import { Component, OnInit } from '@angular/core';
import { DatosFireService } from '../../../general/data-access/datos-fire.service';
import { AuthService } from '../../../general/data-access/auth.service';
import { AlertService } from '../../../general/data-access/alert.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators , FormGroup} from '@angular/forms';
import { Subscription } from 'rxjs';
import { jsPDF }  from 'jspdf';
import { Timestamp } from 'firebase/firestore';
import { AlertasComponent } from '../../../general/utils/alertas/alertas.component';
interface Falta {
  fecha: Date;
  estadoFalta:any;
  estadoAsistencia:any;
}
@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule, AlertasComponent ],
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
        private datosFireService: DatosFireService,
        public alertaService: AlertService
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
                  estadoAsistencia: alumno?.estadoAsistencia || false, // Asistencia actual
                };
                              });
                // Separar y contar faltas no justificadas
                const faltasSinJustificar = faltasDeMatricula.filter(falta => !falta.estadoAsistencia && falta.estadoFalta !== 'Justificado');
                this.cantidadFaltas = faltasSinJustificar.length;

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

                this.faltas = this.faltasPorUsuario[this.usuarioSeleccionado.id]; // Mostrar todas las faltas en la tabla
                }
        } catch (error) {
          console.error('Error al obtener las faltas del alumno:', error);
          this.faltas = [];
          this.cantidadFaltas = "0";
        }
      }
      getFaltasNoJustificadas(usuarioId: string): number {
        if (this.faltasPorUsuario[usuarioId]) {
          return this.faltasPorUsuario[usuarioId].filter(falta => 
            !falta.estadoAsistencia && falta.estadoFalta !== 'Justificado'
          ).length;
        }
        return 0;
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
              this.mostrarAlertaDeExito('Justificación enviada correctamente ');
           
        
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
              this.mostrarAlertaDeError('Error al enviar la justificación');
              console.error('Error al enviar la justificación:', error);
            }
          } else {
            console.log('Formulario no válido');
          }
        }
        
        async generarReporte(matricula: any): Promise<void> {
          const doc = new jsPDF();
        
          // Obtener los usuarios
          const usuarios = await this.authService.obtenerUsuarios();
        
          // Asignar el alumno seleccionado
          const alumnoSeleccionado = usuarios.find(n => n.id === matricula.alumnoId) || {};
        
          // Obtener el estado de faltas
          const estadoFaltas = alumnoSeleccionado.estadoFaltas ?? 'aprobado';
          let estadoTexto = estadoFaltas;
          let color = [0, 128, 0]; // Verde por defecto (aprobado)
        
          if (estadoFaltas === 'advertido') {
            color = [255, 165, 0]; // Naranja (advertido)
          } else if (estadoFaltas === 'reprobado') {
            color = [255, 0, 0]; // Rojo (reprobado)
          }
        
          // Configurar la imagen para el encabezado
          const logoURL = 'logo n.png'; // Reemplaza con la ruta o base64 de tu imagen
          const imageWidth = 50;
          const imageHeight = 50;
        
          // Agregar títulos en el centro del encabezado
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('Centro de Oratoria San José Don Bosco', 105, 20, { align: 'center' });
        
          // Agregar la imagen centrada
          const pageWidth = doc.internal.pageSize.getWidth();
          const imageX = (pageWidth - imageWidth) / 2;
          doc.addImage(logoURL, 'PNG', imageX, 25, imageWidth, imageHeight);
        
           // Datos del alumno
           const alumnoNombreCompleto = `${alumnoSeleccionado.nombre} ${alumnoSeleccionado.apellido}`;
           const alumnoCorreo = alumnoSeleccionado.correo || 'No disponible';
           const alumnoCedula = alumnoSeleccionado.cedula || 'No disponible';
         
           // Datos de la matrícula
           const periodoNombre = matricula.periodoNombre;
           const nivelNombre = matricula.nivelNombre;
           const paraleloNombre = matricula.paraleloNombre;


          // Segundo título
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text(`Reporte de Información del Alumno ${alumnoSeleccionado.nombre} en el periodod ${periodoNombre}`, 105, 85, { align: 'center' });
        
         
        
          // Agregar información del alumno
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text(`Nombre del Alumno: ${alumnoNombreCompleto}`, 20, 95);
          doc.text(`Correo: ${alumnoCorreo}`, 20, 105);
          doc.text(`Cédula: ${alumnoCedula}`, 20, 115);
          doc.text(`Periodo: ${periodoNombre}`, 20, 125);
          doc.text(`Nivel: ${nivelNombre}`, 20, 135);
          doc.text(`Paralelo: ${paraleloNombre}`, 20, 145);
        
          // Agregar estado de faltas con color solo en el valor del estado
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text(`Estado de Faltas: `, 20, 155); // Texto normal en negro
        
          // Texto del estado con color
          doc.setTextColor(color[0], color[1], color[2]); // Aplicar color
          doc.text(estadoTexto, 60, 155); // Solo el estado en color
        
          // Guardar el PDF
          doc.save(`reporte_informacion_${alumnoNombreCompleto}.pdf`);
          
        
        }
        
     
        
        
        

  ngOnDestroy(): void {
    this.subscription.unsubscribe();  // Limpiar la suscripción cuando el componente se destruye
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


