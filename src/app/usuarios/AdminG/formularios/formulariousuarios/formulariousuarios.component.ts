import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators , FormGroup} from '@angular/forms';
import { AuthService } from '../../../../general/data-access/auth.service';
import { isRequired,  matchPasswords } from '../../../../general/utils/validator';
import { DatosFireService } from '../../../../general/data-access/datos-fire.service';
import { Timestamp } from '@angular/fire/firestore';
@Component({
  selector: 'app-formulariousuarios',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule,CommonModule],
  templateUrl: './formulariousuarios.component.html',
  styles: ``
})
export default class FormulariousuariosComponent implements OnInit {
  form: FormGroup;
  usuarios: any[] = [];
  modoEdicion: boolean = false;
  usuarioEditando: any = null;
  emailExiste: boolean = false;
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
    private datosFireService: DatosFireService
  )  {
  this.form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    cedula: ['', [Validators.required, Validators.pattern('^\\d{10}$')]], // Cédula con validación
    fechanacimiento: ['', Validators.required],
    telefono: ['', Validators.pattern('^\\d{10}$')], // Teléfono con validación de 10 dígitos
    email: ['', [Validators.required, Validators.email]], // Email con validación
    contraseña: ['', [Validators.required, Validators.minLength(6)]], // Contraseña mínima de 6 caracteres
    confirmContraseña: ['', [Validators.required]], // Confirmación de contraseña
    rol: ['alumno', Validators.required], // Rol por defecto
    estado: ['inactivo', Validators.required], // Estado por defecto
   
  }, { validators: [matchPasswords] });  // Agregar el validador de contraseñas
}

async ngOnInit(): Promise<void> {
  this.cargarUsuarios();

  const currentUser = this.authService.getCurrentUser();
  this.currentUserRole = currentUser?.role || '';
  this.isSecretario = this.currentUserRole === 'secretario';
  
  // Bloquear el selector si el usuario es secretario
  if (this.currentUserRole === 'secretario') {
    this.form.get('rol')?.setValue('alumno'); // Establecer el rol "alumno"
    this.form.get('rol')?.disable(); // Deshabilitar el control a nivel del FormGroup
    this.isAlumnoLocked = true; // Actualizar variable para usar en la plantilla (si es necesario)
  } else {
    this.form.get('rol')?.enable(); // Habilitar el control si no es secretario
    this.isAlumnoLocked = false; // Habilitar para otros roles si es necesario
  }

 // Establecer la cédula como contraseña al cargar el formulario
 if (this.form.get('rol')?.value === 'alumno') {
  this.form.patchValue({
    contraseña: this.form.get('cedula')?.value || '',
    confirmContraseña: this.form.get('cedula')?.value || '',
  });
}


  this.form.get('rol')?.valueChanges.subscribe((rolValue) => {
    const isAlumno = rolValue === 'alumno';
   
  
    // Limpiar los campos relacionados si no es "alumno"
    if (!isAlumno) {
      this.form.patchValue({
        fechanacimiento: null,
      });
    }

    // Hacer los campos requeridos solo si es "alumno"
    this.form.get('fechanacimiento')?.setValidators(isAlumno ? [Validators.required] : null);


    // Limpiar los valores de los campos cuando no sea "alumno"
    if (!isAlumno) {
      this.form.patchValue({
        fechanacimiento: null,
      
      });
    }

    // Actualizar la validez de los campos
    this.form.get('fechanacimiento')?.updateValueAndValidity();

    
    // Si es "alumno", se manejan las contraseñas
    if (isAlumno) {
      this.form.get('contraseña')?.disable();
      this.form.get('confirmContraseña')?.disable();

      this.form.patchValue({
        contraseña: this.form.get('cedula')?.value || '',
        confirmContraseña: this.form.get('cedula')?.value || '',
      });

      this.cedulaSubscription = this.form.get('cedula')?.valueChanges.subscribe((cedulaValue) => {
        this.form.patchValue({
          contraseña: cedulaValue || '',
          confirmContraseña: cedulaValue || '',
        });
      });
    } else {
      this.form.get('contraseña')?.enable();
      this.form.get('confirmContraseña')?.enable();
      this.form.patchValue({
        contraseña: '',
        confirmContraseña: '',
      });
    }
  });
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
  async eliminarUsuario(userId: string) {
    const confirmacion = confirm("¿Estás seguro de que deseas eliminar este usuario?");
    if (confirmacion) {
      try {
        await this.authService.eliminarUsuario(userId);
        alert('Usuario eliminado exitosamente');
        this.cargarUsuarios();
      } catch (error) {
        console.error('Error al eliminar el usuario', error);
        alert('Error al eliminar el usuario');
      }
    }
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
        contraseña: formData.rol === 'alumno' ? formData.cedula : formData.contraseña,
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
          );
  
          if (resultado) {
            alert('Usuario actualizado exitosamente');
            this.resetForm();
            this.cargarUsuarios();
          } else {
            alert('Error al actualizar el usuario.');
          }
        } catch (error) {
          console.error('Error al actualizar usuario', error);
          alert('Error al actualizar usuario');
        }
      } else {
        // Si no estamos editando, creamos un nuevo usuario
         // Si el correo fue modificado y ya no es el mismo correo existente, reiniciar la validación
          if (this.emailExiste) {
            this.emailExiste = false;
          }
      
          // Verificamos si el correo ya existe solo cuando el formulario se envía
          const emailExistente = await this.authService.correoYaRegistrado(formData.email);
          
          // Si el correo existe, mostrar el mensaje de error
          if (emailExistente) {
            this.emailExiste = true;
            alert('El correo electrónico ya está registrado.');
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

          );
  
          if (resultado) {
            alert('Usuario registrado exitosamente');
            this.resetForm();
            this.cargarUsuarios();
          } else {
            alert('Error al registrar usuario');
          }
        } catch (error) {
          console.error('Error al registrar usuario', error);
          alert('Error al registrar usuario');
        }
      }
    } else {
      alert('Por favor, complete todos los campos correctamente.');
    }
  }
  
  // Método para manejar la validación de correo en tiempo real
  onEmailChange() {
    this.emailExiste = false; // Reiniciar el estado de correo existente
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
      
    });
  
    // Si el rol es alumno, cargamos los valores dinámicos
    if (usuario.role === 'alumno') {
     this.form.patchValue({
        fechanacimiento:this.convertirFecha(usuario.fechaNacimiento) || '',
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
  this.mostrarForm = false; // Ocultar el formulario al resetear
}

  // Filtrar solo números (para cédula y teléfono)
  filterNumbers(event: any) {
    let inputValue = event.target.value;
    inputValue = inputValue.replace(/[^0-9]/g, '');
    event.target.value = inputValue;
  }

  // Validadores simplificados
  get isEmailInvalid() {
    const control = this.form.get('email');
    return control?.hasError('email') && control?.touched;
  }

  get isPasswordInvalid() {
    const control = this.form.get('contraseña');
    return control?.hasError('minlength') && control?.touched;
  }

  get isCedulaInvalid() {
    const control = this.form.get('cedula');
    return control?.hasError('pattern') && control?.touched;
  }

  get isTelefonoInvalid() {
    const control = this.form.get('telefono');
    return control?.hasError('pattern') && control?.touched;
  }

  // Validación de que las contraseñas coinciden
  get isPasswordMismatch() {
    return this.form.hasError('mismatch') && this.form.get('confirmContraseña')?.touched;
  }

  // Validación de los campos requeridos
  get isRequiredField() {
    return isRequired('email', this.form);
  }
  
  get isRequiredPassword() {
    return this.form.get('contraseña')?.hasError('required') && this.form.get('contraseña')?.touched;
  }

  get isRequiredConfirmPassword() {
    return this.form.get('confirmContraseña')?.hasError('required') && this.form.get('confirmContraseña')?.touched;
  }

  get isRequiredNombre() {
    return this.form.get('nombre')?.hasError('required') && this.form.get('nombre')?.touched;
  }
  get isRequiredApellido() {
    return this.form.get('apellido')?.hasError('required') && this.form.get('apellido')?.touched;
  }


  get isRequiredCedula() {
    return this.form.get('cedula')?.hasError('required') && this.form.get('cedula')?.touched;
  }

  get isRequiredTelefono() {
    return this.form.get('telefono')?.hasError('required') && this.form.get('telefono')?.touched;
  }

  get isRequiredRol() {
    return this.form.get('rol')?.hasError('required') && this.form.get('rol')?.touched;
  }

  get isRequiredEstado() {
    return this.form.get('estado')?.hasError('required') && this.form.get('estado')?.touched;
  }


}