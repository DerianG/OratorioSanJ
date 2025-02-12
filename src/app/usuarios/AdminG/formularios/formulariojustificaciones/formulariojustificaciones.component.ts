import { Component } from '@angular/core';
import { DatosFireService } from '../../../../general/data-access/datos-fire.service';
import { AuthService } from '../../../../general/data-access/auth.service';
import { AlertService } from '../../../../general/data-access/alert.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators , FormGroup} from '@angular/forms';
import { Subscription } from 'rxjs';
import { log } from 'firebase-functions/logger';
import { Timestamp } from 'firebase/firestore';
import { jsPDF }  from 'jspdf';
import { AlertasComponent } from '../../../../general/utils/alertas/alertas.component';
interface Falta {
  fecha: Date;
  estadoAsistencia:any;
}
@Component({
  selector: 'app-formulariojustificaciones',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule, AlertasComponent],
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
  faltasPorUsuario: { [userId: string]: { faltas: Falta[], estadoFalta: string } } = {};
  constructor(
    private datosFire: DatosFireService,
    private authService: AuthService,
    public alertaService: AlertService
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


  confirmacionJustificar(justificacion: any){
    // Mostrar alerta de confirmación
   this.alertaService.mostrarAlerta(
      `¿Estás seguro de que deseas justificar esta falta?`,
      'danger', // Clase de alerta (puedes ajustar el color según tu diseño)
      'Confirmación: ', // Tipo de alerta (puedes cambiar esto si lo prefieres)
      true, // Esto indica que es una alerta de confirmación
      () => {
         this.justificar(justificacion)
      },
      () => {
        console.log('Justificación cancelada');
        return;
      }
    );
  }
  // Método para justificar la falta
  async justificar(justificacion: any): Promise<void> {
   
    try {
      // Justificar la falta
      await this.datosFire.justificarFalta(justificacion.id);
      console.log('Falta justificada correctamente');
     
      this.mostrarAlertaDeExito('Falta justificada correctamente');
  
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

       // Mostrar alerta de confirmación
    this.alertaService.mostrarAlerta(
      `¿Deseas generar un PDF con el reporte de esta justificacion?`,
      'danger', // Clase de alerta (puedes ajustar el color según tu diseño)
      'Confirmación: ', // Tipo de alerta (puedes cambiar esto si lo prefieres)
      true, // Esto indica que es una alerta de confirmación
      () => {
        this.generarReporteJustificacion(justificacion);
      },
      () => {
        // Acción cancelada (si el usuario cancela la eliminación
      }
    );
    } catch (error) {
      this.mostrarAlertaDeError('Error al justificar la falta');
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


 async getFaltasDelAlumno(usuarioId: any, curso: any): Promise<number> {
  try {
    const cursoExistente = curso;

    if (cursoExistente && cursoExistente.asistencias) {
        // Inicializar el objeto si no existe
        if (!this.faltasPorUsuario[usuarioId]) {
          this.faltasPorUsuario[usuarioId] = { faltas: [], estadoFalta: '' };
        }
      // Filtrar las faltas de acuerdo con el alumno
     
      const faltasDeMatricula: Falta[] = cursoExistente.asistencias
        .filter((asistencia: any) =>
          asistencia.alumnos.some((alumno: any) =>
            alumno.alumnoId === usuarioId && !alumno.estadoAsistencia
          )
        )
        .map((asistencia: any) => {
          const alumno = asistencia.alumnos.find((al: any) => al.alumnoId === usuarioId);
          return {
            fecha: asistencia.fechaAsistencia.toDate(),         
            estadoAsistencia: alumno?.estadoAsistencia || false, // Agregar estado de asistencia
          };
        });

      
      // Guardar las faltas en `faltasPorUsuario`
      this.faltasPorUsuario[usuarioId].faltas = faltasDeMatricula;
      
      // Obtener el número de faltas
      const cantidadFaltas = faltasDeMatricula.length;

      // Determinar el estado de las faltas
      let estadoFaltas = '';
      if (cantidadFaltas === 0) {
        estadoFaltas = 'aprobado';
      } else if (cantidadFaltas > 0 && cantidadFaltas < 3) {
        estadoFaltas = 'advertido';
      } else if (cantidadFaltas >= 3) {
        estadoFaltas = 'reprobado';
      }

      // Actualizar el estado del usuario en la base de datos
      await this.authService.actualizarUsuarioId(usuarioId, estadoFaltas);
      this.faltasPorUsuario[usuarioId].estadoFalta = estadoFaltas
      // Guardar en variables de clase (opcional)
      this.cantidadFaltas = cantidadFaltas;

      return cantidadFaltas;
    }

    return 0; // Si no hay faltas
  } catch (error) {
    console.error('Error al obtener las faltas del alumno:', error);
    return 0;
  }
}


  async generarReporteJustificacion(justificacion: any): Promise<void> {
    const doc = new jsPDF();
    
    // Obtener usuario actual y concatenar su nombre completo
    const usuarioActual = this.authService.getCurrentUser();
    const usuarioNombreCompleto = `${usuarioActual.nombre} `;
  
    // Obtener la fecha actual
    const fechaActual = new Date().toLocaleDateString();
  
    // Configurar la imagen para el encabezado
    const logoURL = 'logo n.png'; // Ruta de la imagen
    const imageWidth = 50;
    const imageHeight = 50;
    
    // Títulos en el encabezado
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Centro de Oratoria San José Don Bosco', 105, 20, { align: 'center' });
  
    // Agregar la imagen centrada
    const pageWidth = doc.internal.pageSize.getWidth();
    const imageX = (pageWidth - imageWidth) / 2;
    doc.addImage(logoURL, 'PNG', imageX, 25, imageWidth, imageHeight);
    
    // Segundo título
    doc.setFontSize(12);
    doc.text(`Reporte de Justificación de Falta`, 105, 85, { align: 'center' });
    
    // Obtener la data del alumno
    const alumnoData = await this.authService.obtenerAlumnoPorId(justificacion.alumnoId);
  
    // Obtener información de la justificación
    const fechaFalta = justificacion.fechaFalta.toDate().toLocaleDateString();
  
    const contenido = `Detalles de la Justificación:
  - Alumno: ${alumnoData.nombre} ${alumnoData.apellido}
  - Fecha de la Falta: ${fechaFalta}
  - Curso: ${justificacion.nivel} - ${justificacion.paralelo}
  - Fecha de Justificación: ${fechaActual}
  - Estado: Justificado`;
  
    // Dividir y justificar el contenido
    const anchoTexto = 170;
    const textoDividido: string[] = doc.splitTextToSize(contenido, anchoTexto);
  
    // Agregar el contenido al PDF
    let startY = 95;
    textoDividido.forEach((line: string, index: number) => {
      doc.text(line, 20, startY + index * 7);
    });
  
    startY += textoDividido.length * 7 + 10;
  
    // **Tabla de detalles de la justificación**
    const columns = ['Fecha de Falta', 'Alumno', 'Curso', 'Estado'];
    const rows = [[
      fechaFalta,
      `${alumnoData.nombre} ${alumnoData.apellido}`,
      `${justificacion.nivel} - ${justificacion.paralelo}`,
      'Justificado'
    ]];
  
    // Dibujar la tabla con autoTable
    // @ts-ignore: Ignore TypeScript error for jsPDF autotable
    doc.autoTable({
      head: [columns],
      body: rows,
      startY: startY + 5,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] } // Verde claro
    });
  
    // Actualizar la posición Y después de la tabla, añadiendo un espacio extra
    startY = (doc.lastAutoTable?.finalY ?? startY) + 15; // Añade espacio extra entre tablas
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    doc.text(`
    --------------------------
    Justificado por: ${usuarioNombreCompleto}`, 20, startY + 10);
  
    // Guardar el PDF
    doc.save(`reporte_justificacion_${alumnoData.nombre}.pdf`);
  }
  
  


  mostrarAlertaDeAdvertencia(mensaje:string): void {
    this.alertaService.mostrarAlerta(
      mensaje,
      'warning',  // Tipo de alerta: 'danger', 'success', 'warning', etc.
      'Advertencia: ',
      false // No es una alerta de confirmación
    );
  }

  mostrarAlertaDeExito(mensaje:string): void {
    this.alertaService.mostrarAlerta(
      mensaje,
      'success',  // Tipo de alerta de éxito
      'Éxito: ',
      false // No es una alerta de confirmación
    );
  }

  mostrarAlertaDeError(mensaje:string): void {
    this.alertaService.mostrarAlerta(
      mensaje,
      'danger',  // Tipo de alerta de error
      'Error: ',
      false // No es una alerta de confirmación
    );
  }

  mostrarAlertaDeConfirmacion(mensaje: string): void {
    this.alertaService.mostrarAlerta(
      mensaje,
      'danger',  // Tipo de alerta: 'danger', 'success', 'warning', etc.
      'Confirmación: ',
      true, // Es una alerta de confirmación
      () => {
        console.log('Acción confirmada');
        // Realiza la acción de eliminación aquí
      },
      () => {
        console.log('Acción cancelada');
        // Acción de cancelación
      }
    );
  }
  
}

