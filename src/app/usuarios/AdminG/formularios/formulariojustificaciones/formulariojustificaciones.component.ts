import { Component } from '@angular/core';
import { DatosFireService } from '../../../../general/data-access/datos-fire.service';
import { AuthService } from '../../../../general/data-access/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators , FormGroup} from '@angular/forms';
import { Subscription } from 'rxjs';
import { log } from 'firebase-functions/logger';
import { Timestamp } from 'firebase/firestore';
@Component({
  selector: 'app-formulariojustificaciones',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule ],
  templateUrl: './formulariojustificaciones.component.html',
  styles: ``
})
export class FormulariojustificacionesComponent {
  justificaciones: any[] = [];
  placeholder: string = 'Ingrese el valor a buscar'; // Placeholder dinámico
  filtroCampo: string = 'nombre'; // Campo seleccionado para filtrar
  filtroValor: string = ''; // Valor ingresado para filtrar
  justificacionesFiltradas: any[] = [];
  cantidadFaltas:any;
  estadofaltas:string='';
  constructor(
    private datosFire: DatosFireService,
    private authService: AuthService,
   
  ) {}
  ngOnInit(): void {
    this.loadJustificaciones();
  }

 // Método para cargar las justificaciones y los datos de las matrículas
 async loadJustificaciones(): Promise<void> {
  try {
    const justificaciones = await this.datosFire.getJustificaciones();
    this.justificaciones = await Promise.all(
      justificaciones.map(async (justificacion) => {
        const matriculaData = await this.datosFire.getMatriculaporId(justificacion.matriculaId);
        const cursos = await this.datosFire.getCursoProfesor();
        const cursoExistente = cursos.find(curso =>
          curso.periodoId === matriculaData.periodoId &&
          curso.nivelId === matriculaData.nivelId &&
          curso.paraleloId === matriculaData.paraleloId
        );
        this.getFaltasDelAlumno(matriculaData.alumnoId,cursoExistente)
        return {
          ...justificacion,
          nombreAlumno: matriculaData.alumnoNombre,
          periodo: matriculaData.periodoNombre,
          nivel: matriculaData.nivelNombre,
          paralelo: matriculaData.paraleloNombre,
          periodoId: matriculaData.periodoId,
          nivelId: matriculaData.nivelId,
          paraleloId: matriculaData.paraleloId,
          alumnoId: matriculaData.alumnoId,

        };
        
      })
    );
    this.justificacionesFiltradas = [...this.justificaciones];
    console.log('Justificaciones cargadas:', this.justificaciones);
  } catch (error) {
    console.error('Error al cargar las justificaciones:', error);
  }
}

  // Método para descargar el PDF desde base64
  descargarPDF(base64: string): void {
    // Crear un objeto Blob desde el base64
    const byteCharacters = atob(base64.split(',')[1]);  // Elimina la parte 'data:application/pdf;base64,' del base64
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    const byteArray = new Blob(byteArrays, { type: 'application/pdf' });

    // Crear un enlace de descarga para el Blob
    const link = document.createElement('a');
    link.href = URL.createObjectURL(byteArray);
    link.download = 'justificacion.pdf'; // Nombre del archivo PDF a descargar
    link.click();
  }

  // Método para justificar la falta
  async justificar(justificacion: any): Promise<void> {
    const confirmar = window.confirm('¿Estás seguro de que deseas justificar esta falta?');
  
    if (!confirmar) {
      console.log('Justificación cancelada');
      return;
    }
  
    try {
      // Justificar la falta
      await this.datosFire.justificarFalta(justificacion.id);
      console.log('Falta justificada correctamente');
     
      window.alert('Falta justificada correctamente');
  
      // Obtener los cursos del profesor
      const cursos = await this.datosFire.getCursoProfesor();
      const cursoExistente = cursos.find(curso =>
        curso.periodoId === justificacion.periodoId &&
        curso.nivelId === justificacion.nivelId &&
        curso.paraleloId === justificacion.paraleloId
      );
  
      if (!cursoExistente) {
        console.error('No se encontró el curso asociado.');
        return;
      }
      console.log('Curso existente:', cursoExistente);

      this.getFaltasDelAlumno(justificacion.alumnoId,cursoExistente)
      // Convertir `fechaFalta` a timestamp válido
      console.log('Fecha falta (raw):', justificacion.fechaFalta);

      const fechaFalta = (() => {
        if (justificacion.fechaFalta instanceof Timestamp) {
          // Caso: Timestamp de Firebase
          return justificacion.fechaFalta.seconds * 1000 + justificacion.fechaFalta.nanoseconds / 1e6;
        } else if (typeof justificacion.fechaFalta === 'string') {
          // Caso: String (convertir a Date y luego a timestamp)
          const date = new Date(justificacion.fechaFalta);
          return isNaN(date.getTime()) ? null : date.getTime();
        } else if (justificacion.fechaFalta instanceof Date) {
          // Caso: Objeto Date
          return justificacion.fechaFalta.getTime();
        } else if (
          justificacion.fechaFalta &&
          typeof justificacion.fechaFalta.seconds === 'number' &&
          typeof justificacion.fechaFalta.nanoseconds === 'number'
        ) {
          // Caso: Objeto similar a Timestamp con `seconds` y `nanoseconds`
          return justificacion.fechaFalta.seconds * 1000 + justificacion.fechaFalta.nanoseconds / 1e6;
        } else {
          console.error('Tipo de dato no reconocido para fechaFalta:', justificacion.fechaFalta);
          return null; // Formato no válido
        }
      })();

      if (!fechaFalta) {
        console.error('Formato no válido para fechaFalta:', justificacion.fechaFalta);
        return;
      }
      console.log('Fecha falta (timestamp):', fechaFalta);
      // Buscar la asistencia correspondiente en el curso
      const asistencia = cursoExistente.asistencias.find((asistencia: any) => {
        const fechaAsistencia = asistencia.fechaAsistencia instanceof Timestamp
          ? asistencia.fechaAsistencia.seconds * 1000 + asistencia.fechaAsistencia.nanoseconds / 1e6
          : asistencia.fechaAsistencia?.seconds !== undefined && asistencia.fechaAsistencia?.nanoseconds !== undefined
          ? asistencia.fechaAsistencia.seconds * 1000 + asistencia.fechaAsistencia.nanoseconds / 1e6
          : null;
  
        return fechaAsistencia === fechaFalta &&
          asistencia.alumnos.some((alumno: any) => alumno.alumnoId === justificacion.alumnoId);
      });
  
      if (!asistencia) {
        console.error('No se encontró la asistencia correspondiente.');
        return;
      }
  
      console.log('Asistencia encontrada:', asistencia);
  
      // Actualizar el estado del alumno
      const alumnoAsistencia = asistencia.alumnos.find((alumno: any) => alumno.alumnoId === justificacion.alumnoId);
      if (alumnoAsistencia) {
        alumnoAsistencia.estadoFalta = 'Justificado';
        alumnoAsistencia.estadoAsistencia = true; // Cambiar el estado de asistencia
  
        await this.datosFire.actualizarAsistenciaCurso(cursoExistente.id, cursoExistente.asistencias);
        console.log('Estado de la falta actualizado a "Justificado".');
      }
  
      // Recargar las justificaciones
      this.loadJustificaciones();
    } catch (error) {
      window.alert('Error al justificar la falta');
      console.error('Error al justificar la falta:', error);
    }
  }
  

  actualizarPlaceholder(): void {
    switch (this.filtroCampo) {
      case 'nombre':
        this.placeholder = 'Ingrese el nombre para buscar';
        break;
      case 'estado':
        this.placeholder = 'Ingrese estado de justificacion para buscar';
        break;
      case 'fechaFalta':
        this.placeholder = 'Ingrese fecha de justificacion para buscar';
        break;
      case 'periodo':
        this.placeholder = 'Ingrese el periodo para buscar';
        break;
      case 'nivel':
        this.placeholder = 'Ingrese la nivel para buscar';
        break;
      default:
        this.placeholder = 'Ingrese el valor a buscar';
    }
  }
  onValorFiltroChange(event: Event): void {
    const valor = (event.target as HTMLInputElement).value.trim(); // Eliminamos espacios en blanco
    this.filtroValor = valor;
  
    // Si el valor del filtro está vacío, cargamos todas las justificaciones
    if (!valor) {
      this.justificacionesFiltradas = [...this.justificaciones]; // Clonamos las originales
    } else {
      this.aplicarFiltro(); // Aplicamos el filtro si hay un valor
    }
  }
  
  onCampoFiltroChange(event: Event): void {
    const campo = (event.target as HTMLSelectElement).value;
    this.filtroCampo = campo;
    this.aplicarFiltro(); // Aplicamos el filtro siempre que cambie el campo
    this.actualizarPlaceholder()
  }
  
  aplicarFiltro(): void {
    if (!this.filtroCampo || !this.filtroValor) {
      this.justificacionesFiltradas = [...this.justificaciones]; // Restauramos las originales si no hay filtro
      return;
    }
  
    // Filtramos según el campo y el valor ingresado
    this.justificacionesFiltradas = this.justificaciones.filter(justificacion => {
      const valorCampo = justificacion[this.filtroCampo]?.toString().toLowerCase(); // Convertimos a string y minúsculas
      return valorCampo?.includes(this.filtroValor.toLowerCase());
    });
  }


  async getFaltasDelAlumno(usuarioId: any, curso:any): Promise<number> {
    try {
      
  
      // Filtramos el curso correspondiente al usuario
      const cursoExistente = curso
  
      if (cursoExistente && cursoExistente.asistencias) {
        // Filtrar las faltas de acuerdo con el alumno
        const faltasDeMatricula = cursoExistente.asistencias
          .filter((asistencia: any) =>
            asistencia.alumnos.some((alumno: any) =>
              alumno.alumnoId === usuarioId && !alumno.estadoAsistencia
            )
          )
          .map((asistencia: any) => {
            const alumno = asistencia.alumnos.find((al: any) => al.alumnoId === usuarioId);
            return {
              fecha: asistencia.fechaAsistencia.toDate(),
              estadoFalta: alumno?.estadoFalta || 'Pendiente', // Agrega estado de falta
            };
          });
  
        // Obtener el número de faltas
        const cantidadFaltas = faltasDeMatricula.length;
  
        // Actualizar el campo estadoFaltas según la cantidad de faltas
        let estadoFaltas = '';
        if (cantidadFaltas === 0) {
          estadoFaltas = 'aprobado';
        } else if (cantidadFaltas > 0 && cantidadFaltas < 3) {
          estadoFaltas = 'advertido';
        } else if (cantidadFaltas >= 3) {
          estadoFaltas = 'reprobado';
        }
  
        // Actualizar el campo estadoFaltas en el usuario
        
         await this.authService.actualizarUsuarioId(usuarioId, estadoFaltas);
        this.estadofaltas = estadoFaltas
        this.cantidadFaltas = cantidadFaltas
        // Retornamos la cantidad de faltas
        return cantidadFaltas;
      }
  
      return 0; // Si no hay faltas
    } catch (error) {
      console.error('Error al obtener las faltas del alumno:', error);
      return 0;
    }
  }
}

