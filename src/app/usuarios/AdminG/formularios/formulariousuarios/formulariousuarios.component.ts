import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators , FormGroup} from '@angular/forms';
import { AuthService } from '../../../../general/data-access/auth.service';
import { isRequired,  matchPasswords } from '../../../../general/utils/validator';
import { DatosFireService } from '../../../../general/data-access/datos-fire.service';
import { AlertService } from '../../../../general/data-access/alert.service';
import { Timestamp } from '@angular/fire/firestore';
import { AlertasComponent } from '../../../../general/utils/alertas/alertas.component';
@Component({
  selector: 'app-formulariousuarios',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule,CommonModule, AlertasComponent],
  templateUrl: './formulariousuarios.component.html',
  styles: ``
})
export default class FormulariousuariosComponent implements OnInit {
  form: FormGroup;
  usuarios: any[] = [];
  modoEdicion: boolean = false;
  usuarioEditando: any = null;
  emailExiste: boolean = false;
  cedulaExiste: boolean = false;
  mostrarForm: boolean = false; 
  passwordVisible: boolean = false;  // Controla la visibilidad de la contraseña
  usuariosFiltrados: any[] = [];
  campoFiltro: string = 'nombre'; // Campo de filtro predeterminado
  valorFiltro: string = ''; // Valor de búsqueda
  valorFiltro2: string = ''; // Valor del filtro de selección (Rol/Estado)
  placeholder: string = 'Ingrese el valor a buscar'; // Placeholder dinámico
  cedulaSubscription: any = null;
  isAlumnoLocked: boolean = false; // Bloqueo del selector si es necesario
  currentUserRole: string = ''; // Rol del usuario actual
  isSecretario: boolean = false; // Variable que indica si el usuario es secretario

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private datosFireService: DatosFireService,
    public alertaService: AlertService
  )  {
  this.form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    cedula: ['', [ Validators.pattern('^\\d{10}$')]], // Cédula con validación
    cedulaPadre: ['', [ Validators.pattern('^\\d{10}$')]], // Cédula con validación
    fechanacimiento: ['', Validators.required],
    telefono: ['', Validators.pattern('^\\d{10}$')], // Teléfono con validación de 10 dígitos
    email: ['', [ Validators.email]], // Email con validación
    emailPadre: ['', [ Validators.email]], // Email con validación
    contraseña: ['', [Validators.required, Validators.minLength(6)]], // Contraseña mínima de 6 caracteres
    confirmContraseña: ['', [Validators.required]], // Confirmación de contraseña
    rol: ['profesor', Validators.required], // Rol por defecto
    estado: ['inactivo', Validators.required], // Estado por defecto
   
  }, { validators: [matchPasswords] });  // Agregar el validador de contraseñas
}


async ngOnInit(): Promise<void> {
  this.cargarUsuarios();
  const currentUser = this.authService.getCurrentUser();
  this.currentUserRole = currentUser?.role || '';
  this.isSecretario = this.currentUserRole === 'secretario';

  // Establecer el rol "alumno" por defecto
 // this.form.get('rol')?.setValue('alumno'); 

  // Bloquear el selector si el usuario es secretario
  if (this.currentUserRole === 'secretario') {
    this.form.get('rol')?.setValue('alumno'); // Establecer el rol "alumno"
    this.form.get('rol')?.disable(); // Deshabilitar el control a nivel del FormGroup
    this.isAlumnoLocked = true;
  } else {
    this.form.get('rol')?.enable(); // Habilitar el control si no es secretario
    this.isAlumnoLocked = false;
  }

  // Establecer la cédula como contraseña al cargar el formulario si el rol es 'alumno'
  if (this.form.get('rol')?.value === 'alumno') {
    this.form.patchValue({
      contraseña: this.form.get('cedulaPadre')?.value || '',
      confirmContraseña: this.form.get('cedulaPadre')?.value || '',
    });
    this.establecerContraseñaConCedulaPadre();
  }

  this.establecerContraseñaConCedulaPadre();

  // Establecer validadores cuando el rol cambie
  this.form.get('rol')?.valueChanges.subscribe(() => {
    this.establecerContraseñaConCedulaPadre();
    this.setConditionalValidators();
  });

}

setConditionalValidators() {
  const rol = this.form.get('rol')?.value;
  const cedulaControl = this.form.get('cedula');
  const emailControl = this.form.get('email');
  const cedulaPadreControl = this.form.get('cedulaPadre');
  const emailPadreControl = this.form.get('emailPadre');
  // Si el rol es 'alumno', los campos de cédula y email no son requeridos
  if (rol === 'alumno') {
    cedulaControl?.clearValidators();
    emailControl?.clearValidators();
    cedulaPadreControl?.setValidators([Validators.required, Validators.maxLength(10), Validators.pattern('^[0-9]{10}$')]);
    emailPadreControl?.setValidators([Validators.required, Validators.email]);

  } else {
    // Si el rol es otro, los campos de cédula y email son requeridos
    cedulaPadreControl?.clearValidators();
    emailPadreControl?.clearValidators();
    cedulaControl?.setValidators([Validators.required, Validators.maxLength(10), Validators.pattern('^[0-9]{10}$')]);
    emailControl?.setValidators([Validators.required, Validators.email]);
  }

  // Actualiza los estados de validación
  cedulaControl?.updateValueAndValidity();
  emailControl?.updateValueAndValidity();
  cedulaPadreControl?.updateValueAndValidity();
  emailPadreControl?.updateValueAndValidity();
}
  establecerContraseñaConCedulaPadre() {
    const rol = this.form.get('rol')?.value;
    if (rol === 'alumno') {
      const cedulaPadre = this.form.get('cedulaPadre')?.value;
      this.form.patchValue({
        contraseña: cedulaPadre || '',
        confirmContraseña: cedulaPadre || ''
      });
      this.cedulaSubscription = this.form.get('cedulaPadre')?.valueChanges.subscribe((cedulaValue) => {
        this.form.patchValue({
          contraseña: cedulaValue || '',
          confirmContraseña: cedulaValue || '',
        });
      });
      // Deshabilitar los campos de contraseña para "alumno"
      this.form.get('contraseña')?.disable();
      this.form.get('confirmContraseña')?.disable();
    } else {
      // Habilitar los campos de contraseña si no es "alumno"
      this.form.get('contraseña')?.enable();
      this.form.get('confirmContraseña')?.enable();
    }
  }
    // Función
    // Función para mostrar/ocultar el formulario
    mostrarFormulario(): void {
    
      if (this.mostrarForm) {
        // Siempre resetea el formulario al cancelar
        this.resetForm();
        this.modoEdicion = false; // Asegúrate de salir del modo edición si estaba activo
        this.mostrarForm = false; // Oculta el formulario
      } else {
         
        this.mostrarForm = true; // Muestra el formulario
      }
    }
    togglePasswordVisibility(): void {
      this.passwordVisible = !this.passwordVisible;
    }
    //cambiartitulo

    getTitulo(): string {
      if (this.isSecretario) {
        return 'Alumnos';
      }
      return `Usuarios`; // Título por defecto para no docentes
    }
  // Cargar usuarios desde el servicio
  async cargarUsuarios() {
    try {
      this.usuarios = await this.authService.obtenerUsuarios();
      
      // Filtrar solo los usuarios con rol 'alumno' si el usuario actual es secretario
      if (this.isSecretario) {
        this.usuariosFiltrados = this.usuarios.filter(usuario => usuario.role === 'alumno');
      } else {
        this.usuariosFiltrados = this.usuarios; // Si no es secretario, mostrar todos los usuarios
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  }

  filtrarUsuarios(): void {
    console.log('Filtro aplicado:', this.campoFiltro, this.valorFiltro, this.valorFiltro2);
  
    let usuariosFiltrados = this.usuarios;
  
    // Si el usuario es secretario, solo filtra los alumnos además de los demás filtros
    if (this.isSecretario) {
      usuariosFiltrados = usuariosFiltrados.filter((usuario) => usuario.role === 'alumno');
    }
  
    // Filtra por rol (solo si no es secretario, se puede seleccionar un rol)
    if (this.campoFiltro === 'rol' && this.valorFiltro2) {
      usuariosFiltrados = usuariosFiltrados.filter((usuario) => {
        let valorCampo = usuario.role?.toString().toLowerCase();
        return valorCampo === this.valorFiltro2.toLowerCase();
      });
    }
  
    // Filtra por estado
    if (this.campoFiltro === 'estado' && this.valorFiltro2) {
      usuariosFiltrados = usuariosFiltrados.filter((usuario) => {
        let valorCampo = usuario.estado?.toString().toLowerCase();
        return valorCampo === this.valorFiltro2.toLowerCase();
      });
    }
  
    // Filtra por nombre, correo, cédula u otros campos
    if (this.valorFiltro && this.campoFiltro !== 'rol' && this.campoFiltro !== 'estado') {
      usuariosFiltrados = usuariosFiltrados.filter((usuario) => {
        let valorCampo: any;
  
        switch (this.campoFiltro) {
          case 'nombre':
            valorCampo = usuario.nombre?.toString().toLowerCase();
            break;
          case 'email':
            valorCampo = usuario.email?.toString().toLowerCase();
            break;
          case 'cedula':
            valorCampo = usuario.cedula?.toString().toLowerCase();
            break;
          case 'estado':
            valorCampo = usuario.estado?.toString().toLowerCase().substring(0, 3);
            break;
          default:
            valorCampo = usuario[this.campoFiltro]?.toString().toLowerCase();
        }
  
        return valorCampo?.includes(this.valorFiltro.toLowerCase());
      });
    }
  
    // Si el usuario es secretario, solo muestra los usuarios con rol "alumno"
    if (this.isSecretario) {
      usuariosFiltrados = usuariosFiltrados.filter((usuario) => usuario.role === 'alumno');
    }
  
    this.usuariosFiltrados = usuariosFiltrados;
    console.log('Usuarios filtrados:', this.usuariosFiltrados);
  }

 
  actualizarPlaceholder(): void {
    switch (this.campoFiltro) {
      case 'nombre':
        this.placeholder = 'Ingrese el nombre para buscar';
        break;
      case 'estado':
        this.placeholder = 'Ingrese estado (activo/inactivo)';
        break;
      case 'rol':
        this.placeholder = 'Ingrese rol para buscar';
        break;
      case 'email':
        this.placeholder = 'Ingrese el correo para buscar';
        break;
      case 'cedula':
        this.placeholder = 'Ingrese la cédula para buscar';
        break;
      default:
        this.placeholder = 'Ingrese el valor a buscar';
    }
  }
  // Eliminar usuario
  // async eliminarUsuario(userId: string) {
  //   const confirmacion = confirm("¿Estás seguro de que deseas eliminar este usuario?");
  //   if (confirmacion) {
  //     try {
  //       await this.authService.eliminarUsuario(userId);
  //       alert('Usuario eliminado exitosamente');
  //       this.cargarUsuarios();
  //     } catch (error) {
  //       console.error('Error al eliminar el usuario', error);
  //       alert('Error al eliminar el usuario');
  //     }
  //   }
  // }

  eliminarUsuario(id: string): void {
    // Mostrar alerta de confirmación
    this.alertaService.mostrarAlerta(
      `¿Estás seguro de que deseas eliminar el usuario?`,
      'danger', // Clase de alerta (puedes ajustar el color según tu diseño)
      'Confirmación: ', // Tipo de alerta (puedes cambiar esto si lo prefieres)
      true, // Esto indica que es una alerta de confirmación
      () => {
        // Acción confirmada
        this.authService.eliminarUsuario(id).then(() => {
          this.cargarUsuarios();
          this.alertaService.mostrarAlerta(
            'usuario eliminado con éxito.',
            'success',
            'Éxito: '
          );
        }).catch((error) => {
          console.error('Error al eliminar el usuario:', error);
          this.alertaService.mostrarAlerta(
            'Hubo un error al intentar eliminar el usuario.',
            'danger',
            'Error: '
          );
        });
      },
      () => {
        // Acción cancelada (si el usuario cancela la eliminación)
        console.log('Eliminación cancelada');
        this.alertaService.mostrarAlerta(
          'La eliminación del usuario fue cancelada.',
          'warning',
          'Advertencia: '
        );
      }
    );
  }

  async submit() {
    if (this.form.valid) {
      const formData = this.form.value;
    
      // Si el usuario es secretario y el rol es indefinido, aseguramos que sea 'alumno'
      if (this.isSecretario && !formData.rol) {
        formData.rol = 'alumno'; // Establecer 'alumno' si el rol está vacío
      }
  
      const finalData = {
        ...formData,
        contraseña: formData.rol === 'alumno' ? formData.cedulaPadre : formData.contraseña,
        confirmContraseña: undefined, // No necesitamos enviar la confirmación
        fechanacimiento: formData.fechanacimiento ? Timestamp.fromDate(new Date(`${formData.fechanacimiento}T00:00:00`)) : null,
      };
  
      // Si estamos en modo de edición, actualizamos el usuario
      if (this.modoEdicion) {
        const updatedData = { ...finalData, id: this.usuarioEditando.id };
        console.log(this.usuarioEditando.id)

    
          try {
            const resultado = await this.authService.actualizarUsuario(
              this.usuarioEditando.id,
              finalData.email,
              finalData.contraseña,
              finalData.nombre,
              finalData.apellido,
              finalData.cedula,
              finalData.telefono,
              finalData.rol,
              finalData.estado,
              finalData.fechanacimiento,
              finalData.emailPadre,
              finalData.cedulaPadre,
            );
    
            if (resultado) {
              this.mostrarAlertaDeExito('Usuario actualizado exitosamente');
              this.resetForm();
              this.cargarUsuarios();
            } else {
              this.mostrarAlertaDeError('Error al actualizar el usuario.');
            }
          } catch (error) {
            console.error('Error al actualizar usuario', error);
            this.mostrarAlertaDeError('Error al actualizar usuario');
          }
      
      } else {
        // Si no estamos editando, creamos un nuevo usuario
         // Si el correo fue modificado y ya no es el mismo correo existente, reiniciar la validación
         if (formData.rol === 'alumno'){
              if (this.emailExiste) {
                this.emailExiste = false;
              }     
              // Verificamos si el correo ya existe solo cuando el formulario se envía
              const emailExistente = await this.authService.correoYaRegistrado(formData.email);
              
              // Si el correo existe, mostrar el mensaje de error
              if (emailExistente) {
                this.emailExiste = true;
                this.mostrarAlertaDeAdvertencia('El correo electrónico del alumno ya está registrado.');
                return;
              }
              
         }else{
          if (this.emailExiste) {
            this.emailExiste = false;
          }     
          // Verificamos si el correo ya existe solo cuando el formulario se envía
          const emailExistente = await this.authService.correoYaRegistrado(formData.email);
          
          // Si el correo existe, mostrar el mensaje de error
          if (emailExistente) {
            this.emailExiste = true;
            this.mostrarAlertaDeAdvertencia('El correo electrónico ya está registrado.');
            return;
           }
         }
          if (this.cedulaExiste) {
            this.cedulaExiste = false;
          }     
          // Verificamos si el correo ya existe solo cuando el formulario se envía
          const cedulaexistente = await this.authService.cedulaYaRegistrado(formData.cedula);
          
          // Si el correo existe, mostrar el mensaje de error
          if (cedulaexistente) {
            this.cedulaExiste= true;
            this.mostrarAlertaDeAdvertencia('Cedula ya registrada.');
            return;
          }
        try {
          
          const resultado = await this.authService.registrarUsuario(
            finalData.email,
            finalData.contraseña,
            finalData.nombre,
            finalData.apellido,
            finalData.cedula,
            finalData.telefono,
            finalData.rol,
            finalData.estado,
            finalData.fechanacimiento,
            finalData.emailPadre,
            finalData.cedulaPadre,
          );
  
          if (resultado) {
            this.mostrarAlertaDeExito('Usuario registrado exitosamente');
            this.resetForm();
            this.cargarUsuarios();
          } else {
            this.mostrarAlertaDeError('Error al registrar usuario');
          }
        } catch (error) {
          console.error('Error al registrar usuario', error);
          this.mostrarAlertaDeError('Error al registrar usuario');
        }
      }
    } else {
      this.mostrarAlertaDeAdvertencia('Por favor, completa correctamente todos los campos.');
    }
  }
  
  // Método para manejar la validación de correo en tiempo real
  onEmailChange() {
    this.emailExiste = false; // Reiniciar el estado de correo existente
  }
  onCedulaChange() {
    this.cedulaExiste = false; // Reiniciar el estado de correo existente
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
  
    return `${year}-${month}-${day}`; // Devuelve la fecha en formato "YYYY-MM-DD"
  }
  
  editarUsuario(usuario: any) {
    this.resetForm(); // Reinicia el formulario
    this.modoEdicion = true; // Activa el modo edición
    this.usuarioEditando = usuario; // Guarda el usuario actual
  
    // Asigna valores comunes al formulario
    this.form.patchValue({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      cedula: usuario.cedula,
      telefono: usuario.telefono,
      email: usuario.email,
      rol: usuario.role,
      estado: usuario.estado,
      contraseña: usuario.contraseña,
      confirmContraseña: usuario.contraseña,
      fechanacimiento:this.convertirFecha(usuario.fechaNacimiento) || '',
    });
  
    // Si el rol es alumno, cargamos los valores dinámicos
    if (usuario.role === 'alumno') {
     this.form.patchValue({
        cedulaPadre: usuario.cedulaPadre,
        emailPadre: usuario.emailPadre,
     })
    }
  
    this.mostrarForm = true; // Muestra el formulario
  }
  
  
  


// Función para resetear el formulario
resetForm(): void {
  // Limpiar suscripción activa de cédula
  if (this.cedulaSubscription) {
    this.cedulaSubscription.unsubscribe();
    this.cedulaSubscription = null;
  }
  this.modoEdicion = false;
  this.form.reset(); // Limpia todos los controles del formulario
  this.form.markAsPristine(); // Marca el formulario como limpio (sin cambios)
  this.form.markAsUntouched(); // Marca todos los controles como no tocados
  this.form.patchValue({ // Establece valores predeterminados
    rol: 'alumno',
    estado: 'inactivo'
  });
  this.emailExiste = false; // Restablecer el estado de emailExiste
  this.cedulaExiste= false;
  this.mostrarForm = false; // Ocultar el formulario al resetear
}

  // Filtrar solo números (para cédula y teléfono)
  filterNumbers(event: any) {
    let inputValue = event.target.value;
    inputValue = inputValue.replace(/[^0-9]/g, '');
    event.target.value = inputValue;
  }

  // Validadores simplificados


  get isPasswordInvalid() {
    const control = this.form.get('contraseña');
    return control?.hasError('minlength') && control?.touched;
  }

  // Validación de que las contraseñas coinciden
  get isPasswordMismatch() {
    return this.form.hasError('mismatch') && this.form.get('confirmContraseña')?.touched;
  }

  get isRequiredPassword() {
    return this.form.get('contraseña')?.hasError('required') && this.form.get('contraseña')?.touched;
  }

  get isRequiredConfirmPassword() {
    return this.form.get('confirmContraseña')?.hasError('required') && this.form.get('confirmContraseña')?.touched;
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