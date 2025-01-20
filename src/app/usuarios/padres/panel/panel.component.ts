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
    cantidadFaltas:string='';
    cargaAuto: boolean=false;
    verJustificacion: boolean= false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private datosFireService: DatosFireService
    ){ this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(4)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      estado: ['activo', Validators.required],
      nivelesSeleccionados: this.fb.array([], Validators.required),
      periodo: ['', Validators.required],
      nivel: ['', Validators.required],
      paralelo: ['', Validators.required],
      nombreAlumno: ['', Validators.required],
      fechaFalta: ['', Validators.required],
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

    async cargaAutomatica(): Promise<void> {
      if (this.isLoggedIn && this.user?.email) {
        this.cargaAuto = true; // Evitar que se ejecute nuevamente
        this.form.get('periodo')?.enable();
this.form.get('nivel')?.enable();
this.form.get('paralelo')?.enable();
this.form.get('nombreAlumno')?.enable();
this.form.get('fechaFalta')?.enable();
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
            console.log(cursoExistente, cursoExistente.asistencias);
    
            const faltasDeMatricula: Falta[] = cursoExistente.asistencias
              .filter((asistencia: any) =>
                asistencia.alumnos.some((alumno: any) =>
                  alumno.alumnoId === this.usuarioSeleccionado.id && !alumno.estadoAsistencia
                )
              )
              .map((asistencia: any) => ({
                fecha: asistencia.fechaAsistencia.toDate(), // Convertir a fecha
              }));
    
            // Actualizar las faltas por usuario
            if (!this.faltasPorUsuario[this.usuarioSeleccionado.id]) {
              this.faltasPorUsuario[this.usuarioSeleccionado.id] = [];
            }
            
            // Evitar faltas duplicadas
            this.faltasPorUsuario[this.usuarioSeleccionado.id] = [
              ...this.faltasPorUsuario[this.usuarioSeleccionado.id],
              ...faltasDeMatricula.filter(falta =>
                !this.faltasPorUsuario[this.usuarioSeleccionado.id].some(existingFalta => existingFalta.fecha.getTime() === falta.fecha.getTime())
              )
            ];
    
            // Actualizar la cantidad de faltas para el usuario seleccionado
            this.cantidadFaltas = this.faltasPorUsuario[this.usuarioSeleccionado.id].length.toString();
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
          this.verJustificacion = true;
          this.form.patchValue({
            periodo: matricula.periodoNombre,
            nivel: matricula.nivelNombre,
            paralelo: matricula.paraleloNombre,
            nombreAlumno: matricula.alumnoNombre,
            fechaFalta: this.convertirFecha(fecha),
          });
        
          // Deshabilitar los campos excepto el de descripción
          this.form.get('periodo')?.disable();
          this.form.get('nivel')?.disable();
          this.form.get('paralelo')?.disable();
          this.form.get('nombreAlumno')?.disable();
          this.form.get('fechaFalta')?.disable();
          this.form.get('descripcionJustificacion')?.enable(); // Asegurarte de que esté habilitado
        }
        
    async submit(): Promise<void> {
      if (this.form.valid) {
        try {
          const justificacionData = {
            periodo: this.form.get('periodo')?.value,
            nivel: this.form.get('nivel')?.value,
            paralelo: this.form.get('paralelo')?.value,
            nombreAlumno: this.form.get('nombreAlumno')?.value,
            fechaFalta: this.form.get('fechaFalta')?.value,
            //imagenFalta: this.form.get('imagenFalta')?.value,
          //  estado: 'justificada', // Esto depende de tu lógica de negocio
          };
    // Aquí podrías enviar la justificación a Firestore o a la API correspondiente
          await this.datosFireService.justificarFalta(justificacionData);
    
          // Mensaje de éxito o redirección
          console.log('Justificación enviada correctamente');
    
          // Limpiar el formulario y ocultar la vista de justificación
          this.form.reset();
           this.verJustificacion = false;
        } catch (error) {
          console.error('Error al enviar la justificación:', error);
          // Aquí podrías agregar un mensaje de error al usuario
        }
      } else {
        console.log('Formulario no válido');
        // Aquí podrías mostrar un mensaje de validación
      }

    }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();  // Limpiar la suscripción cuando el componente se destruye
  }
}
