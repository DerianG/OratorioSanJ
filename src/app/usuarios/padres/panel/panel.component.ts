import { Component, OnInit } from '@angular/core';
import { DatosFireService } from '../../../general/data-access/datos-fire.service';
import { AuthService } from '../../../general/data-access/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators , FormGroup} from '@angular/forms';
import { Subscription } from 'rxjs';
import { log } from 'firebase-functions/logger';
import { Timestamp } from 'firebase/firestore';
interface Falta {
  fecha: Date;
  estadoFalta:any;
}
@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule ],
  templateUrl: './panel.component.html',
  styles: ``
})

export  default class PanelComponent {
    form: FormGroup;
    usuarios: any[] = [];  // Para almacenar los usuarios encontrados
    user: any = null;    // Almacenar el usuario logeado
    isLoggedIn: boolean = false;
    subscription: Subscription = new Subscription();
    verDetalle: boolean=false;
    usuarioSeleccionado: any = null;  // Para almacenar los detalles del usuario seleccionado
    matriculasUsuario: any[] = []; // Asegúrate de inicializar como array vacío
    verDetalleMatricula: boolean=false;
    matriculaSeleccionada: any = null;  // Para almacenar los detalles del usuario seleccionado
    faltas: any[] = [];
    faltasPorUsuario: { [userId: string]: Falta[] } = {};
    cantidadFaltas:any;
    cargaAuto: boolean=false;
    verJustificacion: boolean= false;
    faltaJustificacion: any = null;
    cursoId: string='';
    archivoInvalido: boolean = false;
    archivoPDF: File | null = null;


    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private datosFireService: DatosFireService
    ){ this.form = this.fb.group({
      periodo: ['', Validators.required],
      nivel: ['', Validators.required],
      paralelo: ['', Validators.required],
      nombreAlumno: ['', Validators.required],
      fechaFalta: ['', Validators.required],
      archivoPDF: [null, Validators.required],
     // imagenFalta: ['', Validators.required],
      descripcionJustificacion: ['', Validators.required],
    },
     );
  }
    ngOnInit(): void {
      this.subscription = this.authService.authState$.subscribe(user => {
      this.user = user;
      this.isLoggedIn = !!user;  // Verifica si el usuario está logueado
      console.log(this.user )
      // Si el usuario está logeado, obtenemos los usuarios con el email del padre
      if (this.isLoggedIn && this.user?.email && !this.cargaAuto) {
        console.log(this.user)
       
        this.cargaAutomatica() // Usamos el email del usuario logeado
      }
    });
    }

    onFileSelected(event: any): void {
      const file = event.target.files[0];
      if (file) {
        // Validar que el archivo sea un PDF y no exceda 1MB
        if (file.type === 'application/pdf' && file.size <= 1048576) {
          this.archivoInvalido = false;
          // Almacenar el archivo en una variable local
          this.archivoPDF = file;  // Puedes crear una variable para almacenar el archivo
        } else {
          this.archivoInvalido = true;
        }
      }
    }
    
    async cargaAutomatica(): Promise<void> {
      if (this.isLoggedIn && this.user?.email) {
        this.cargaAuto = true; // Evitar que se ejecute nuevamente
        try {
          // Paso 1: Obtener usuarios asociados al email del padre
          await this.getUsersByCedulaPadre(this.user.email);
 
          // Paso 2: Para cada usuario, cargar las matrículas y calcular las faltas
          for (const usuario of this.usuarios) {
            this.usuarioSeleccionado = usuario;
 
            // Cargar las matrículas del usuario
            await this.cargarMatriculasDelUsuario();
 
            // Calcular las faltas para cada matrícula
            for (const matricula of this.matriculasUsuario) {
              await this.getFaltasDelAlumno(matricula);
            }
          }
        } catch (error) {
          console.error('Error durante la carga inicial:', error);
        }
      }
    }
 
   
        // Método para obtener todos los usuarios por cedulaPadre (en este caso usamos el email del padre)
    async getUsersByCedulaPadre(emailPadre: string): Promise<void> {
      this.usuarios = await this.authService.getUsersByCedulaPadre(emailPadre);
      console.log(this.usuarios)
    }


    // Mostrar detalles de un usuario
    mostrardalle(usuario: any): void {
      this.usuarioSeleccionado = usuario;
      this.verDetalle = true;
      this.cargarMatriculasDelUsuario()
      this.verDetalleMatricula = false;
      this.faltas = this.faltasPorUsuario[usuario.id] || []; // Mostrar las faltas del usuario seleccionado
      this.cantidadFaltas = this.faltas.length.toString();
    }


      // Mostrar detalles de un usuario
      mostrardalleMatricula(matricula: any): void {
        this.matriculaSeleccionada = matricula ;
        this.verDetalleMatricula = true;
        this.getFaltasDelAlumno(matricula)
      }




      async cargarMatriculasDelUsuario(): Promise<void> {
        if (this.usuarioSeleccionado || this.cargaAuto) {
          try {
            const matriculasActivasDelUsuario = await this.datosFireService.getMatriculasPorUsuarioYPeriodosActivos(this.usuarioSeleccionado.id);
            console.log(matriculasActivasDelUsuario);
            this.matriculasUsuario = matriculasActivasDelUsuario || [];
          } catch (error) {
            console.error('Error al cargar las matrículas del usuario:', error);
          }
        }
      }
   
      async getFaltasDelAlumno(matricula: any): Promise<void> {
        try {
          const cursos = await this.datosFireService.getCursoProfesor();
      
          const cursoExistente = cursos.find(curso =>
            curso.periodoId === matricula.periodoId &&
            curso.nivelId === matricula.nivelId &&
            curso.paraleloId === matricula.paraleloId
          );
      
          if (cursoExistente && cursoExistente.asistencias) {
            // Traer asistencias relevantes: faltas o justificadas
            const faltasDeMatricula: Falta[] = cursoExistente.asistencias
              .filter((asistencia: any) =>
                asistencia.alumnos.some((alumno: any) =>
                  alumno.alumnoId === this.usuarioSeleccionado.id &&
                  (!alumno.estadoAsistencia || alumno.estadoFalta === 'Justificado')
                )
              )
              .map((asistencia: any) => {
                const alumno = asistencia.alumnos.find((al: any) => al.alumnoId === this.usuarioSeleccionado.id);
                return {
                  fecha: asistencia.fechaAsistencia.toDate(),
                  estadoFalta: alumno?.estadoFalta || 'Pendiente', // Estado predeterminado
                };
              });



            
      
            // Actualizar todas las faltas (para la tabla)
            if (!this.faltasPorUsuario[this.usuarioSeleccionado.id]) {
              this.faltasPorUsuario[this.usuarioSeleccionado.id] = [];
            }
      
            this.faltasPorUsuario[this.usuarioSeleccionado.id] = [
              ...this.faltasPorUsuario[this.usuarioSeleccionado.id],
              ...faltasDeMatricula.filter(falta =>
                !this.faltasPorUsuario[this.usuarioSeleccionado.id].some(existingFalta => existingFalta.fecha.getTime() === falta.fecha.getTime())
              )
            ];
      
            // Separar faltas no justificadas para el conteo
            const faltasSinJustificar = faltasDeMatricula.filter(falta =>
              falta.estadoFalta !== 'Justificado' // Contar solo las no justificadas
            );
      
            // Actualizar cantidad de faltas y lista para la tabla
            this.cantidadFaltas = faltasSinJustificar.length;
            this.faltas = this.faltasPorUsuario[this.usuarioSeleccionado.id]; // Mostrar todas las faltas en la tabla
          }
        } catch (error) {
          console.error('Error al obtener las faltas del alumno:', error);
          this.faltas = [];
          this.cantidadFaltas = "0";
        }
      }
      convertirFecha(fecha: Timestamp | Date): string {
          let dateObj: Date;
       
          if (fecha instanceof Timestamp) {
            dateObj = fecha.toDate(); // Convierte Timestamp a Date
          } else if (fecha instanceof Date) {
            dateObj = fecha;
          } else {
            return ''; // Si no es una fecha válida, devuelve una cadena vacía
          }
       
          // Extrae manualmente el año, mes y día en la zona horaria local
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Meses van de 0 a 11
          const day = String(dateObj.getDate()).padStart(2, '0'); // Día del mes
       
          // Devolver solo la fecha en formato "yyyy-mm-dd" sin la parte de la hora
          return `${year}-${month}-${day}`;
        }
   
        justificarFalta(matricula: any, fecha: any): void {
          const falta = this.faltas.find(f => f.fecha.getTime() === fecha.getTime());
          if (falta && falta.estadoFalta === 'en proceso') {
            return; // No hacer nada si ya está en proceso
          }
        
          this.verJustificacion = true;
          this.form.patchValue({
            periodo: matricula.periodoNombre,
            nivel: matricula.nivelNombre,
            paralelo: matricula.paraleloNombre,
            nombreAlumno: matricula.alumnoNombre,
            fechaFalta: this.convertirFecha(fecha),
          });
        
          this.faltaJustificacion= fecha
          // Deshabilitar controles
          this.form.get('periodo')?.disable();
          this.form.get('nivel')?.disable();
          this.form.get('paralelo')?.disable();
          this.form.get('nombreAlumno')?.disable();
          this.form.get('fechaFalta')?.disable();
          this.form.get('descripcionJustificacion')?.enable(); // Habilitar este
        }
       
       

        async submit(): Promise<void> {
          if (this.form.valid) {
            try {
              // Validar el tipo de this.faltaJustificacion
              if (Array.isArray(this.faltaJustificacion) || !this.faltaJustificacion) {
                console.error('La fecha de la falta no es válida.');
                return;
              }
              const archivo = this.archivoPDF;
              if (!archivo) {
                console.error('No se ha seleccionado un archivo.');
                return;
              }
              const justificacionData = {
                matriculaId: this.matriculaSeleccionada?.id,
                estado:"en proceso",
                fechaFalta: this.faltaJustificacion instanceof Timestamp
                  ? this.faltaJustificacion
                  : new Date(this.faltaJustificacion),
                descripcion: this.form.get('descripcionJustificacion')?.value,
              };
        
              if (!justificacionData.matriculaId) {
                console.error('Error: No se ha seleccionado una matrícula válida.');
                return;
              }
        
              const cursos = await this.datosFireService.getCursoProfesor();
              const cursoExistente = cursos.find(curso =>
                curso.periodoId === this.matriculaSeleccionada.periodoId &&
                curso.nivelId === this.matriculaSeleccionada.nivelId &&
                curso.paraleloId === this.matriculaSeleccionada.paraleloId
              );
        
              if (!cursoExistente) {
                console.error('No se encontró el curso asociado.');
                return;
              }
        
              const asistencia = cursoExistente.asistencias.find((asistencia: any) => {
                const fechaFalta = justificacionData.fechaFalta instanceof Timestamp
                  ? justificacionData.fechaFalta.toDate().getTime()
                  : new Date(justificacionData.fechaFalta).getTime();
        
                const fechaAsistencia = asistencia.fechaAsistencia instanceof Timestamp
                  ? asistencia.fechaAsistencia.toDate().getTime()
                  : asistencia.fechaAsistencia?.seconds !== undefined && asistencia.fechaAsistencia?.nanoseconds !== undefined
                  ? Timestamp.fromMillis(asistencia.fechaAsistencia.seconds * 1000 + asistencia.fechaAsistencia.nanoseconds / 1e6).toDate().getTime()
                  : null;
        
                return fechaAsistencia === fechaFalta &&
                  asistencia.alumnos.some((alumno: any) => alumno.alumnoId === this.usuarioSeleccionado.id);
              });
        
              if (!asistencia) {
                console.error('No se encontró la asistencia correspondiente.');
                return;
              }
        
              const alumnoAsistencia = asistencia.alumnos.find((alumno: any) => alumno.alumnoId === this.usuarioSeleccionado.id);
              if (alumnoAsistencia) {
                alumnoAsistencia.estadoFalta = 'en proceso';
                await this.datosFireService.actualizarAsistenciaCurso(cursoExistente.id, cursoExistente.asistencias);
                console.log('Estado de la falta actualizado a "en proceso".');
              }
        
              await this.datosFireService.solicitarJustificacion(justificacionData, archivo);
              window.alert('Justificación enviada correctamente ');
           
        
              // Recargar faltas después de enviar la justificación
            // Actualizar la falta en la lista local
                const faltaActualizada = this.faltas.find(falta => {
                  const fechaFalta = justificacionData.fechaFalta instanceof Timestamp
                    ? justificacionData.fechaFalta.toDate().getTime()
                    : justificacionData.fechaFalta.getTime();
                
                  const fechaActual = falta.fecha instanceof Timestamp
                    ? falta.fecha.toDate().getTime()
                    : falta.fecha.getTime();
                
                  return fechaActual === fechaFalta;
                });
                
                if (faltaActualizada) {
                  faltaActualizada.estadoFalta = 'en proceso';
                }
                
                      
              // Reiniciar el formulario y cerrar el modal
              this.form.reset();
              this.verJustificacion = false;
            } catch (error) {
              window.alert('Error al enviar la justificación');
              console.error('Error al enviar la justificación:', error);
            }
          } else {
            console.log('Formulario no válido');
          }
        }
        
        
        
        

  ngOnDestroy(): void {
    this.subscription.unsubscribe();  // Limpiar la suscripción cuando el componente se destruye
  }
}


