import { Component , OnInit} from '@angular/core';
import { DatosFireService } from '../../../../general/data-access/datos-fire.service';
import { AuthService } from '../../../../general/data-access/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule  ,Validators , FormGroup, FormArray  } from '@angular/forms';
import { Timestamp } from 'firebase/firestore'; // Asegúrate de importar Timestamp
import { Observable } from 'rxjs';
import { AngularFireFunctions } from '@angular/fire/compat/functions';

interface Docente {
  docenteId: string; // ID del docente
  docenteNombre: string; // Nombre del docente
}
@Component({
  selector: 'app-formularioscursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formularioscursos.component.html',
  styles: ``
})

export  class FormularioscursosComponent implements OnInit {
  form: FormGroup;
  periodosActivos: any[] = [];
  periodoSeleccionado: any = null;
  niveles: any[] = [];
  nivelSeleccionado:any = null;
  paralelos:any[] = [];
  paraleloSeleccionado:any = null;
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  usuariosFiltrados2: any[] = [];
  usuariosFiltrados3: any[] = [];
  filtroRol: string = 'alumno'; // Por defecto, solo alumnos
  isSecretario: boolean = false; // Variable que indica si el usuario es secretario
  currentUserRole: string = ''; // Rol del usuario actual
  nivelesVisible: boolean = false; // Estado de la visibilidad de los niveles
  matriculas: any[] = []; // Aquí se guardarán las matrículas
  alumnos: any[] = []; // Lista de alumnos
  docentes: any[] = []; // Lista de docentes
  docenteSeleccionado: any = null; // Alumno seleccionado
  valorFiltroDocente: string = '';
  mostrarSugerencias: boolean = false; // Para controlar la visualización de las sugerencias
  cursosDocentes: any[] = [];//todos los cursodocentes
  docentesFiltrados: any[] = [];
  docentesFiltrados2: any[] = [];
  isDocente: boolean = false; // Variable que indica si el usuario es  isDocente: boolean = false; // Variable que indica si el usuario es 
  asistencias: { [usuarioId: string]: boolean } = {};

  
  constructor(
    private fb: FormBuilder,
    private datosFireService: DatosFireService,
    private authService: AuthService,
    private functions: AngularFireFunctions

  ) { this.form = this.fb.group({
    docenteSeleccionado: ['', Validators.required], 
 });
}

  async ngOnInit(): Promise<void> {

    this.cargarPeriodosActivos(); 

    const currentUser = this.authService.getCurrentUser();
    this.currentUserRole = currentUser?.role || '';
    this.isSecretario = this.currentUserRole === 'secretario';
    this.isDocente = this.currentUserRole === 'profesor';
 
  }
  // Cargar períodos activos desde Firestore
  async cargarPeriodosActivos(): Promise<void> {
    try {
      this.periodosActivos = await this.datosFireService.getPeriodosActivos(); // Método en el servicio Firestore
      this.periodosActivos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (error) {
      console.error('Error al cargar períodos activos:', error);
    }
  }
 // Método para seleccionar un paralelo
 async seleccionarParalelo(paralelo: any): Promise<void> {  
  this.paraleloSeleccionado = paralelo;
  this.cancelarSeleccion()
  console.log('Paralelo seleccionado:', this.paraleloSeleccionado);
     // Cargar las matrículas para el periodo, nivel y paralelo seleccionados
  this.cargarCursoProfesor();
  this.cargarUsuariosDocentes(); // Recargar los usuarios cuando se selecciona un paralelo
  this.cargarUsuariosAlumnos(); // Recargar los usuarios cuando se selecciona un paralelo
  
}
  
// Método para seleccionar un nivel
// Método para seleccionar un nivel
async seleccionarNivel(nivel: any): Promise<void> {
  if (this.nivelSeleccionado?.id === nivel.id) {
    // Si el nivel ya está seleccionado, lo deseleccionamos y ocultamos los paralelos
    this.nivelSeleccionado = null;
    this.paralelos = [];
    this.paraleloSeleccionado = null; // Desmarcar paralelo seleccionado
    return;
  }
  
  this.nivelSeleccionado = nivel;
  this.paralelos = []; // Reiniciar paralelos antes de cargarlos
  this.paraleloSeleccionado = null; // Restablecer el paralelo seleccionado
  this.cancelarSeleccion()
  try {
    this.paralelos = await this.datosFireService.getParalelos(); // Cargar paralelos
    
    // Ordenar los paralelos alfabéticamente
    this.paralelos.sort((a, b) => a.nombre.localeCompare(b.nombre));

    // Buscar el paralelo "A" por defecto
    const paraleloA = this.paralelos.find(paralelo => paralelo.nombre === 'A');
    if (paraleloA) {
      this.paraleloSeleccionado = paraleloA; // Seleccionar paralelo "A"
    }
    this.cargarUsuariosDocentes()
    this.cargarUsuariosAlumnos(); // Recargar los usuarios cuando se selecciona un paralelo
    console.log('Paralelos cargados:', this.paralelos);
  } catch (error) {
    console.error('Error al cargar paralelos:', error);
    this.paralelos = [];
  }
}
 // Seleccionar periodo y mostrar/ocultar niveles
 async seleccionarPeriodo(periodo: any): Promise<void> {
  if (this.periodoSeleccionado?.id === periodo.id) {
    // Si el período ya está seleccionado, lo deseleccionamos
    this.periodoSeleccionado = null;
    this.nivelesVisible = false; // Ocultar niveles si se deselecciona el período
    return;
  }
  
  this.periodoSeleccionado = periodo;
  this.nivelesVisible = true; // Mostrar niveles si se selecciona un período
  this.cancelarSeleccion()
  try {
    this.niveles = await this.datosFireService.getNivelesPorPeriodo(periodo.id);
    this.niveles.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } catch (error) {
    console.error('Error al cargar niveles del período:', error);
    this.niveles = [];
  }
}
  // Cargar matricula desde el servicio

  async cargarMatriculas(): Promise<void> {
    try {
      const matriculasData = await this.datosFireService.getMatriculas(); // Llama al método de servicio
      this.matriculas = matriculasData.map(matricula => ({
        ...matricula,
        fechaMatricula: matricula.fechaMatricula instanceof Timestamp
          ? matricula.fechaMatricula.toDate() // Convierte Timestamp a Date
          : new Date(matricula.fechaMatricula), // Convierte string o valor no esperado a Date
      }));
    } catch (error) {
      console.error('Error al cargar matrículas:', error);
    }
  }
  async cargarCursoProfesor(): Promise<void> {
    try {
      const cursosPData = await this.datosFireService.getCursoProfesor(); // Llama al método de servicio
      this.cursosDocentes = cursosPData.map(docente => ({
        ...docente,
      }));
    } catch (error) {
      console.error('Error al cargar docentes:', error);
    }
  }
 // Cargar usuarios desde el servicio y filtrarlos según la matrícula
 async cargarUsuariosAlumnos() {
  try {
    // Primero, cargamos las matrículas
    await this.cargarMatriculas();

    this.usuarios = await this.authService.obtenerUsuarios();


    if (this.usuarios) {
      this.alumnos = this.usuarios.filter(usuario => usuario.role === 'alumno');
    } else {
  
      this.alumnos=[]
    }

    if (this.alumnos){
        // Obtener las matrículas correspondientes al período, nivel y paralelo seleccionados
        let matriculasFiltradas = this.matriculas;
        console.log('matrículas:',matriculasFiltradas)

        if (this.periodoSeleccionado) {
          matriculasFiltradas = matriculasFiltradas.filter(
            matricula => matricula.periodoId === this.periodoSeleccionado.id
            
          );
        
        }

        if (this.nivelSeleccionado) {
          matriculasFiltradas = matriculasFiltradas.filter(
            matricula => matricula.nivelId === this.nivelSeleccionado.id
          );
        }

        if (this.paraleloSeleccionado) {
          matriculasFiltradas = matriculasFiltradas.filter(
            matricula => matricula.paraleloId === this.paraleloSeleccionado.id
          );
        }

        // Obtener los ids de los usuarios matriculados
        const alumnoIds = matriculasFiltradas.map(matricula => matricula.alumnoId);
        console.log('alumnos ya filtrados:',alumnoIds)
        // Filtrar los usuarios que están matriculados en el período, nivel y paralelo seleccionados
        let usuariosMatriculados = this.usuarios.filter(usuario => alumnoIds.includes(usuario.id));

        // Asignar los usuarios filtrados a la variable usuariosFiltrados
        this.usuariosFiltrados = usuariosMatriculados;
        this.usuariosFiltrados2 = [...this.usuariosFiltrados]; // Establecer la lista de usuarios filtrados inicial
        this.usuariosFiltrados.forEach(usuario => {
          if (this.asistencias[usuario.id] === undefined) {
            this.asistencias[usuario.id] = true; // Por defecto, todos están "no asistieron"
          }
        });
    }
  
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
  }
}
async cargarUsuariosDocentes() {
  try {
    // Primero, cargamos las matrículas
    await this.cargarCursoProfesor();
    this.usuarios = await this.authService.obtenerUsuarios();

    if (this.usuarios) {
      this.docentes = this.usuarios.filter(usuario => usuario.role === 'profesor');
    } else {
      this.docentes = []
    }   
    if (this.docentes){
      // Obtener las matrículas correspondientes al período, nivel y paralelo seleccionados
      let cursoDocentesFiltrados = this.cursosDocentes;
      console.log('cursodocentes:',cursoDocentesFiltrados)

      if (this.periodoSeleccionado) {
        cursoDocentesFiltrados = cursoDocentesFiltrados.filter(
          docente => docente.periodoId === this.periodoSeleccionado.id
          
        );
      
      }

      if (this.nivelSeleccionado) {
        cursoDocentesFiltrados = cursoDocentesFiltrados.filter(
          docente => docente.nivelId === this.nivelSeleccionado.id
        );
      }

      if (this.paraleloSeleccionado) {
        cursoDocentesFiltrados = cursoDocentesFiltrados.filter(
          docente => docente.paraleloId === this.paraleloSeleccionado.id
        );
      }

      // Obtener los ids de los usuarios matriculados
      const docentesIds = cursoDocentesFiltrados.flatMap(curso =>
        curso.docentes.map((docente: Docente) => docente.docenteId)
      );
      
      console.log('alumnos ya filtrados:',docentesIds)
      // Filtrar los usuarios que están matriculados en el período, nivel y paralelo seleccionados
      let docentesdeCurso = this.usuarios.filter(usuario => docentesIds.includes(usuario.id));

      // Asignar los usuarios filtrados a la variable usuariosFiltrados
      this.docentesFiltrados = docentesdeCurso;
      this.docentesFiltrados2 = [...this.docentesFiltrados]; // Establecer la lista de usuarios filtrados inicial

  }
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
  }
}

filtrarUsuarios(): void {
  const valorFiltro = (document.getElementById('valorFiltro') as HTMLInputElement).value.toLowerCase();

  if (!valorFiltro) {
    // Si el campo de búsqueda está vacío, restaurar todos los usuarios filtrados inicialmente
    this.usuariosFiltrados2 = [...this.usuariosFiltrados];
    
  } else {
    // Filtrar los usuarios basados en el nombre o apellido
    this.usuariosFiltrados2 = this.usuariosFiltrados.filter(
      usuario => usuario.nombre.toLowerCase().includes(valorFiltro) || usuario.apellido.toLowerCase().includes(valorFiltro)
    );
  }

  console.log('Usuarios filtrados por nombre o apellido:', this.usuariosFiltrados2);
}

seleccionarDocente(docente: any): void {
  this.docenteSeleccionado = docente; // Actualiza el modelo
  this.form.patchValue({ alumnoSeleccionado: docente.nombre }); // Actualiza el formulario si es necesario
  this.mostrarSugerencias = false; // Cierra la lista de sugerencias
}
ocultarSugerencias(): void {
  setTimeout(() => {
    this.mostrarSugerencias = false;
    if (!this.docenteSeleccionado) {
      this.docenteSeleccionado = null; // Limpia la selección si no se elige nada
    }
  }, 200);
}
cancelarSeleccion(): void {
  // Limpiar el valor del input
  this.docenteSeleccionado = null;
  this.valorFiltroDocente = ''; // Limpiar el filtro para el nombre del docente
  this.mostrarSugerencias = false; // Ocultar sugerencias
}
getTituloAsistencia(): string {
  if (this.isDocente) {
    const now = new Date();
    const fecha = now.toLocaleDateString(); // Formato de fecha según configuración local
    const hora = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Hora en formato HH:MM
    return `Asistencia (${fecha}) - (${hora})`;
  }
  return 'Lista de Usuarios'; // Título por defecto para no docentes
}

filtrarDocentes(event?: any): void {
  // Obtener el valor del campo de búsqueda y asegurarse de que sea en minúsculas
  this.valorFiltroDocente = event?.target?.value.trim().toLowerCase() || '';

  // Si el campo está vacío, no mostrar sugerencias
  if (!this.valorFiltroDocente) {
    this.mostrarSugerencias = false;
    return;
  }

  // Filtrar solo los usuarios con el rol 'profesor'
  let usuariosFiltrados = this.docentes

  // Filtrar por nombre o apellido
  usuariosFiltrados = usuariosFiltrados.filter((usuario) => {
    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.toLowerCase(); // Combina nombre y apellido
    return nombreCompleto.includes(this.valorFiltroDocente); // Busca si el texto contiene el filtro
  });

  // Actualizar la lista de usuarios filtrados
  this.usuariosFiltrados3 = usuariosFiltrados;

  // Mostrar las sugerencias si hay resultados
  this.mostrarSugerencias = this.usuariosFiltrados3.length > 0;
}

 // Método que se ejecuta al hacer clic en el botón "Asignar"
 async asignarDocente(): Promise<void> {
  if (this.docenteSeleccionado && this.periodoSeleccionado && this.nivelSeleccionado && this.paraleloSeleccionado) {
    const cursoProfesorData = {
      periodoId: this.periodoSeleccionado.id, // ID del período
      periodoNombre: this.periodoSeleccionado.nombre, // Nombre del período
      nivelId: this.nivelSeleccionado.id, // Nivel
      nivelnombre: this.nivelSeleccionado.nombre, // Nivel
      paraleloId: this.paraleloSeleccionado.id, // Paralelo
      paralelonombre: this.paraleloSeleccionado.nombre, // Paralelo
      docentes: [
        {
          docenteId: this.docenteSeleccionado.id, // ID del docente
          docenteNombre: this.docenteSeleccionado.nombre, // Nombre del docente
        },
      ], // Guardamos al docente en un array
    };

    try {
      // Obtener todos los cursos
      const cursos = await this.datosFireService.getCursoProfesor();
      
      // Buscar el curso que coincida con periodoId, nivelId y paraleloId
      const cursoExistente = cursos.find(curso =>
        curso.periodoId === this.periodoSeleccionado.id &&
        curso.nivelId === this.nivelSeleccionado.id &&
        curso.paraleloId === this.paraleloSeleccionado.id
      );

      if (cursoExistente) {
        // Si el curso ya existe, actualizarlo
        await this.datosFireService.actualizarCursoConDocente(cursoProfesorData);
        console.log('Docente asignado correctamente al curso existente');
        alert('Docente asignado exitosamente');
      } else {
        // Si el curso no existe, crearlo
        await this.datosFireService.crearCursoProfesor(cursoProfesorData);
        console.log('Curso con profesor asignado correctamente');
        alert('Docente asignado exitosamente');
      }
      this.cancelarSeleccion();
      this.cargarUsuariosDocentes();
      
      
    } catch (error) {
      console.error('Error al asignar el curso con el profesor:', error);
    }
  } else {
    console.error('Faltan datos para asignar el curso con el profesor.');
  }
}


// Evento focus para activar la lista de sugerencias solo si hay texto en el campo
onFocus() {
  if (this.valorFiltroDocente.trim().length > 0) {
    this.mostrarSugerencias = true;
  }
}

async quitarDocente(id: string): Promise<void> {
  const confirmar = confirm('¿Estás seguro de que deseas quitar al docente de este paralelo?');
  if (!confirmar) {
    return; // Cancela la operación si el usuario no confirma
  }

  try {
    // Llamamos al servicio para eliminar al docente del curso
    await this.datosFireService.quitarDocenteDelCurso(id, this.periodoSeleccionado.id, this.nivelSeleccionado.id, this.paraleloSeleccionado.id);
    console.log('Docente eliminado exitosamente');
    alert('Docente eliminado exitosamente');
   
    this.cargarUsuariosDocentes();
  } catch (error) {
    console.error('Error al eliminar docente:', error);
  }
}

async guardarAsistencia(): Promise<void> {
  if (this.periodoSeleccionado && this.nivelSeleccionado && this.paraleloSeleccionado) {
    const asistenciaData = this.usuariosFiltrados.map(usuario => ({
      alumnoId: usuario.id,
      alumnoNombre: `${usuario.nombre} ${usuario.apellido}`,
      estadoAsistencia: this.asistencias[usuario.id] || false, // Obtiene el estado del mapa
      alumnoEmail: usuario.email,
      alumnoTelefono: usuario.telefono, // Ejemplo de otro dato del alumno
      alumnoDireccion: usuario.direccion, // Puedes incluir más campos aquí si lo necesitas
    }));

    const registroAsistencia = {
      fechaAsistencia: Timestamp.now(),
      alumnos: asistenciaData,
    };

    try {
      const cursos = await this.datosFireService.getCursoProfesor();
      const cursoExistente = cursos.find(curso =>
        curso.periodoId === this.periodoSeleccionado.id &&
        curso.nivelId === this.nivelSeleccionado.id &&
        curso.paraleloId === this.paraleloSeleccionado.id
      );

      if (cursoExistente) {
        if (cursoExistente.asistencias && Array.isArray(cursoExistente.asistencias)) {
          await this.datosFireService.agregarAsistenciaACurso(cursoExistente.id, registroAsistencia);
        } else {
          await this.datosFireService.inicializarAsistenciasCurso(cursoExistente.id, [registroAsistencia]);
        }
        alert('Asistencia guardada exitosamente');

        // Filtrar usuarios con asistencia `false`
        const usuariosConAsistenciaFalse = asistenciaData.filter(usuario => !usuario.estadoAsistencia);

        // Enviar correos a esos usuarios
        if (usuariosConAsistenciaFalse.length > 0) {
          for (const usuario of usuariosConAsistenciaFalse) {
            const asunto = 'Asistencia no registrada';
            const mensaje = `Estimado/a ${usuario.alumnoNombre},\n\nSe ha registrado que no has marcado tu asistencia. Por favor, verifica tu estado.\n\nSaludos.`;
            const email = usuario.alumnoEmail
            this.enviarCorreo(asunto,mensaje,email)
          }
        }
      } else {
        const cursoProfesorData = {
          periodoId: this.periodoSeleccionado.id,
          periodoNombre: this.periodoSeleccionado.nombre,
          nivelId: this.nivelSeleccionado.id,
          nivelNombre: this.nivelSeleccionado.nombre,
          paraleloId: this.paraleloSeleccionado.id,
          paraleloNombre: this.paraleloSeleccionado.nombre,
          asistencias: [registroAsistencia],
        };
        await this.datosFireService.crearCursoConAsistencia(cursoProfesorData);
        alert('Curso creado con asistencia');
      }
    } catch (error) {
      console.error('Error al guardar la asistencia:', error);
      alert('Error al guardar la asistencia');
    }
  } else {
    alert('Por favor, selecciona todos los campos requeridos.');
  }
}
async enviarCorreo(asunto: string, mensaje: string, email: string): Promise<void> {
  const enviarCorreoFn = this.functions.httpsCallable('enviarCorreoAsistencias');
  try {
    const response = await enviarCorreoFn({
      asunto: asunto,
      mensaje: mensaje,
      email: email 
    }).toPromise();
    console.log(response);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
}
}
