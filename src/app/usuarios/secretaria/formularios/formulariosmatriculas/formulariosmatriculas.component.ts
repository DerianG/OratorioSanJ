import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../general/data-access/auth.service';
import { DatosFireService } from '../../../../general/data-access/datos-fire.service';
import { Timestamp } from '@angular/fire/firestore';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators , FormGroup} from '@angular/forms';
import { jsPDF }  from 'jspdf';

@Component({
  selector: 'app-formulariosmatriculas',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule,CommonModule],
  templateUrl: './formulariosmatriculas.component.html',
  styles: ``
})
export class FormulariosmatriculasComponent implements OnInit {
  form: FormGroup;
  mostrarForm: boolean = false;
  modoEdicion: boolean = false;
  periodos: any[] = []; // Lista de períodos activos
  niveles: any[] = []; // Lista de niveles del período seleccionado
  paralelos: any[] = [];  // Para almacenar los paralelos
  periodoSeleccionado: any = {}; // Período seleccionado como objeto
  nivelSeleccionado: any = {};// Nivel seleccionado como objeto
  paraleloSeleccionado: any = {}; // Paralelo seleccionado como objeto
  alumnos: any[] = []; // Lista de los alumnos
  alumnoSeleccionado: any = null; // Alumno seleccionado
  usuariosFiltrados: any[] = [];
  placeholder: string = 'Ingrese el valor a buscar'; // Placeholder dinámico
  placeholderMatricula: string = 'Ingrese el valor a buscar'; // Placeholder dinámico
  isSecretario: boolean = false; // Variable que indica si el usuario es secretario
  currentUserRole: string = ''; // Rol del usuario actual
  mostrarSugerencias: boolean = false; // Para controlar la visualización de las sugerencias
  matriculas: any[] = []; // Aquí se guardarán las matrículas
  matriculaEditando: any = null;
  valorFiltroAlumno: string = '';
  campoFiltroAlumno:string = 'nombre';
  valorFiltroMatricula: string = '';
  campoFiltroMatricula: string = 'nombre';
  matriculasFiltradas: any[] = []; // Lista de matrículas después del filtrado
  periodosCargados: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private datosFireService: DatosFireService
  ) { this.form = this.fb.group({
    periodoSeleccionado: ['', Validators.required],  // Añadir el control para 'periodoSeleccionado'
    nivelSeleccionado: ['', Validators.required] ,   // Añadir el control para 'nivelSeleccionado'
    paraleloSeleccionado: ['', Validators.required], // Campo para paralelo
    alumnoSeleccionado: ['', Validators.required], 
    campoFiltroAlumno: ['nombre'],  // Campo de filtro alumno agregado
    campoFiltroMatricula: ['nombre'],
    fechaMatricula: [new Date().toISOString().slice(0, 10)],
 });  // Agregar el validador de contraseñas
}

  async ngOnInit(): Promise<void> {
    
  
    const currentUser = this.authService.getCurrentUser();
    this.currentUserRole = currentUser?.role || '';
    this.isSecretario = this.currentUserRole === 'secretario';
    await this.cargarUsuarios(); // Asegúrate de agregar los paréntesis
    this.cargarPeriodosActivos(); 
    this.cargarMatriculas();
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

  
// Cargar períodos activos desde Firestore
async cargarPeriodosActivos(): Promise<void> {
  try {
    this.periodos = await this.datosFireService.getPeriodosActivos(); // Método en el servicio Firestore
    this.periodosCargados = true; // Indica que se ha intentado cargar
  } catch (error) {
    console.error('Error al cargar períodos activos:', error);
  }
}
onPeriodoChange(event: any) {
  const periodoId = event.target.value;
  console.log(event.target.value)
   // Busca el objeto completo del periodo correspondiente
   const periodoSeleccionado = this.periodos.find(periodo => periodo.id === periodoId);
   console.log(periodoSeleccionado)
  // Verifica si el periodo ha cambiado realmente
  if (periodoSeleccionado) {
    this.periodoSeleccionado = periodoSeleccionado;
    console.log(this.periodoSeleccionado)
    this.form.get('periodoSeleccionado')?.setValue(periodoSeleccionado.id); // Asigna el objeto completo

    
    // Limpiar los valores de nivel y paralelo si el periodo ha cambiado
    this.form.patchValue({
      nivelSeleccionado: null,
      paraleloSeleccionado: null
    });
    
    // Cargar los niveles y paralelos basados en el periodo seleccionado
    this.datosFireService.getNivelesPorPeriodo(periodoId).then((niveles) => {
      this.niveles = niveles;
    });
  }
}



onNivelChange(event: any) {
  const nivelId = event.target.value;
  const nivelSeleccionado = this.niveles.find(nivel => nivel.id === nivelId);
  console.log(this.periodoSeleccionado)
  console.log(nivelSeleccionado)
  if (nivelSeleccionado) {
    this.nivelSeleccionado = nivelSeleccionado;
    console.log(this.nivelSeleccionado)
    this.form.get('nivelSeleccionado')?.setValue(nivelSeleccionado.id); // Actualiza el nivelSeleccionado en el formulario
    
    // Cargar los paralelos 
    this.cargarParalelos()
  }
}


async cargarParalelos(): Promise<void> {
  try {
    this.paralelos= await this.datosFireService.getParalelos(); // Método en el servicio Firestore
    console.log(this.paralelos)
  } catch (error) {
    console.error('Error al cargar paralelos:', error);
  }
}
// Función para manejar el cambio en el paralelo seleccionado
onParaleloChange(event: any) {
  const paraleloId = event.target.value;
  console.log(event.target.value)
  const paraleloSeleccionado = this.paralelos.find(paralelo => paralelo.id === paraleloId);
  if (paraleloSeleccionado) {
    this.paraleloSeleccionado = paraleloSeleccionado;
    console.log(this.paraleloSeleccionado)
    this.form.get('paraleloSeleccionado')?.setValue(paraleloSeleccionado.id); // Actualiza el paraleloSeleccionado en el formulario
  }
}


mostrarFormulario(): void {
  if (this.mostrarForm) {
    this.resetForm(); // Reinicia el formulario cuando se cancela
    this.modoEdicion = false; // Cambia a modo creación
    this.mostrarForm = false; // Oculta el formulario
  } else {
    this.modoEdicion = false; // Inicialmente el modo es creación
    this.mostrarForm = true; // Muestra el formulario
  }
}

 resetForm(): void {
  // Restablecer los valores del formulario
  this.form.reset();
  this.periodoSeleccionado = null;
  this.nivelSeleccionado = null;
  this.paraleloSeleccionado = null;
  this.alumnoSeleccionado = null;
  this.form.patchValue({ // Establece valores predeterminados
    periodoSeleccionado: null,
    nivelSeleccionado: null,
    paraleloSeleccionado: null,
    alumnoSeleccionado: null,
    campoFiltroAlumno:'nombre',
    fechaMatricula: new Date().toISOString().split('T')[0],
  });
}


  seleccionarAlumno(alumno: any): void {
    this.alumnoSeleccionado = alumno; // Actualiza el modelo
    this.form.patchValue({ alumnoSeleccionado: alumno.nombre }); // Actualiza el formulario si es necesario
    this.mostrarSugerencias = false; // Cierra la lista de sugerencias
}
  ocultarSugerencias(): void {
    setTimeout(() => {
      this.mostrarSugerencias = false;
      if (!this.alumnoSeleccionado) {
        this.alumnoSeleccionado = null; // Limpia la selección si no se elige nada
      }
    }, 200);
  }

  async cargarUsuarios() {
    try {
      this.alumnos = await this.authService.obtenerUsuarios();
      console.log('Alumnos cargados:', this.alumnos); // Agregar este log para depurar
  
      if (this.isSecretario) {
        this.usuariosFiltrados = this.alumnos.filter(usuario => usuario.role === 'alumno');
      } else {
        this.usuariosFiltrados = []
      }
      console.log('Usuarios filtrados:', this.usuariosFiltrados); // Log para verificar los usuarios filtrados
    } catch (error) {
      console.error('Error al cargar alumno:', error);
    }
  }
  filtrarAlumnos(event?: any): void {
    this.valorFiltroAlumno = event?.target?.value.trim().toLowerCase() || '';
  
    if (!this.valorFiltroAlumno) {
      this.usuariosFiltrados = [];
      this.mostrarSugerencias = false;  // Asegúrate de que no se muestren sugerencias
      return;
    }
  
    let usuariosFiltrados = this.alumnos.filter(usuario => usuario.role === 'alumno');
    const campoFiltroAlumno = this.form.get('campoFiltroAlumno')?.value;
  
    usuariosFiltrados = usuariosFiltrados.filter((usuario) => {
      let valorCampo: any;
      switch (campoFiltroAlumno) {
        case 'nombre':
          valorCampo = usuario.nombre?.toLowerCase();
          break;
        case 'cedula':
          valorCampo = usuario.cedula?.toLowerCase();
          break;
        default:
          valorCampo = usuario[campoFiltroAlumno]?.toLowerCase();
      }
      return valorCampo?.includes(this.valorFiltroAlumno.toLowerCase());
    });
  
    this.usuariosFiltrados = usuariosFiltrados;
    this.mostrarSugerencias = this.usuariosFiltrados.length > 0; // Solo mostrar sugerencias si hay resultados
  }
  

  actualizarPlaceholder(event?: any): void {
    this.campoFiltroAlumno = this.form.get('campoFiltroAlumno')?.value; // Obtener el valor directamente del formulario
    switch (this.campoFiltroAlumno) {
      case 'nombre':
        this.placeholder = 'Ingrese el nombre para buscar';
        break;
      case 'cedula':
        this.placeholder = 'Ingrese la cédula para buscar';
        break;
      default:
        this.placeholder = 'Ingrese el valor a buscar';
    }
  }
  

  
  filtrarMatriculas(): void {
    let matriculasFiltradas = this.matriculas;
  
    if (this.valorFiltroMatricula && this.campoFiltroMatricula) {
      matriculasFiltradas = matriculasFiltradas.filter((matricula) => {
        let valorCampo: string | undefined;
  
        switch (this.campoFiltroMatricula) { // Usa la variable específica para matrículas
          case 'nombre':
            valorCampo = matricula.alumnoNombre?.toLowerCase();
            break;
          case 'periodo':
            valorCampo = matricula.periodoNombre?.toLowerCase();
            break;
          case 'fecha':
            valorCampo = new Date(matricula.fechaMatricula).toLocaleDateString().toLowerCase();
            break;
          default:
            valorCampo = matricula[this.campoFiltroMatricula]?.toString().toLowerCase();
        }
  
        return valorCampo?.includes(this.valorFiltroMatricula.toLowerCase());
      });
    }
  
    this.matriculasFiltradas = matriculasFiltradas;
    console.log('Matrículas filtradas:', this.matriculasFiltradas);
  }
  

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
  
    
  actualizarPlaceholderMatricula(): void {
    switch (this.campoFiltroMatricula) {
      case 'nombre':
        this.placeholderMatricula = 'Ingrese el nombre para buscar';
        break;
      case 'periodo':
        this.placeholderMatricula = 'Ingrese periodo para buscar (####-#)';
        break;
      case 'fecha':
         this.placeholderMatricula = 'Ingrese fecha para buscar (yyyy-mm-dd)';
         break;
      default:
        this.placeholderMatricula = 'Ingrese el valor a buscar';
    }
  }


 
  
  async eliminarMatricula(id: string): Promise<void> {
    const confirmar = confirm('¿Estás seguro de que deseas eliminar esta matrícula?');
    if (!confirmar) {
      return; // Cancela la operación si el usuario no confirma
    }
  
    try {
      await this.datosFireService.eliminarMatricula(id);
      alert('Matrícula eliminada exitosamente');
      this.cargarMatriculas(); // Recargar la lista después de eliminar
    } catch (error) {
      console.error('Error al eliminar la matrícula:', error);
      alert('Ocurrió un error al eliminar la matrícula');
    }
  }

// En el método de edición o al cargar los datos
async editarMatricula(matriculaId: string) {
  this.resetForm(); // Reinicia el formulario
     
  this.modoEdicion = true;
  this.mostrarForm = true;
  this.matriculaEditando = null; // Limpiar antes de obtener la matrícula
  try {
    // Obtener todas las matrículas y buscar la que corresponde
    const matriculas = await this.datosFireService.getMatriculas();
    const matricula = matriculas.find(m => m.id === matriculaId);
    console.log(matricula)
    if (!matricula) {
      alert('Matrícula no encontrada.');
      return;
    }

    // Asignar la matrícula que estamos editando
    this.matriculaEditando = matricula;
 

    // Obtener los períodos activos
    const periodosActivos = await this.datosFireService.getPeriodosActivos();
    this.periodos = periodosActivos;

    // Buscar el periodo seleccionado
    const periodoSeleccionado = this.periodos.find(p => p.id === matricula.periodoId);
    if (periodoSeleccionado) {
      this.periodoSeleccionado = periodoSeleccionado;

      // Obtener los niveles para este periodo
      const niveles = await this.datosFireService.getNivelesPorPeriodo(periodoSeleccionado.id);
      this.niveles = niveles;

      // Asignar el nivel seleccionado
      this.nivelSeleccionado = this.niveles.find(n => n.id === matricula.nivelId) || {};

      // Obtener los paralelos
      const paralelos = await this.datosFireService.getParalelos();
      this.paralelos = paralelos;

      // Asignar el paralelo seleccionado
      this.paraleloSeleccionado = this.paralelos.find(p => p.id === matricula.paraleloId) || {};

      // Actualizar el formulario con los valores de la matrícula
      this.form.patchValue({
        fechaMatricula: this.convertirFecha(matricula.fechaMatricula),
      });
      
      // Obtener los usuarios
      const usuarios = await this.authService.obtenerUsuarios();
      this.alumnos = usuarios;
      console.log( this.alumnos)
      // Asignar el alumno seleccionado
      this.alumnoSeleccionado = this.alumnos.find(n => n.id === matricula.alumnoId) || {};
      console.log( this.alumnoSeleccionado)
    
      this.form.patchValue({
        periodoSeleccionado: this.periodoSeleccionado.id,
        nivelSeleccionado: this.nivelSeleccionado.id,
        paraleloSeleccionado: this.paraleloSeleccionado.id,
        alumnoSeleccionado: this.alumnoSeleccionado,
        fechaMatricula: this.convertirFecha(matricula.fechaMatricula)
      });
        // Marcar el formulario como sucio y tocado

      console.log('Periodo:', this.form.get('periodoSeleccionado')?.value);
      console.log('Nivel:', this.form.get('nivelSeleccionado')?.value);
      console.log('Paralelo:', this.form.get('paraleloSeleccionado')?.value);
      console.log('Fecha:', this.form.get('fechaMatricula')?.value);
      console.log('Alumno:', this.form.get('alumnoSeleccionado')?.value);
    } else {
      alert('Periodo no encontrado');
    }
  } catch (error) {
    console.error('Error al editar matrícula:', error);
  }
}

  
  
  
async submit() {
  if (!this.periodoSeleccionado || !this.nivelSeleccionado || !this.paraleloSeleccionado) {
    alert('Por favor, asegúrate de haber seleccionado un período, nivel y paralelo.');
    return;
  }

 
  if (this.form.valid) {
    try {
      if (this.modoEdicion) {
        const matriculaData = {
          matriculaId:this.matriculaEditando.id,
          periodoId: this.periodoSeleccionado.id,
          periodoNombre: this.periodoSeleccionado.nombre,
          nivelId: this.nivelSeleccionado.id,
          nivelNombre: this.nivelSeleccionado.nombre,
          paraleloId: this.paraleloSeleccionado.id,
          paraleloNombre: this.paraleloSeleccionado.nombre,
          alumnoId: this.alumnoSeleccionado.id,
          alumnoNombre: this.alumnoSeleccionado.nombre,
          fechaMatricula: this.form.value.fechaMatricula? Timestamp.fromDate(new Date(`${this.form.value.fechaMatricula}T00:00:00`)) : null,
          estado: 'activo',
        };
          // Actualizar matrícula existente
          await this.datosFireService.actualizarMatricula(matriculaData);
          alert('Matrícula actualizada exitosamente');

      }else {
        const matriculaData = {
          periodoId: this.periodoSeleccionado.id,
          periodoNombre: this.periodoSeleccionado.nombre,
          nivelId: this.nivelSeleccionado.id,
          nivelNombre: this.nivelSeleccionado.nombre,
          paraleloId: this.paraleloSeleccionado.id,
          paraleloNombre: this.paraleloSeleccionado.nombre,
          alumnoId: this.alumnoSeleccionado.id,
          alumnoNombre: this.alumnoSeleccionado.nombre,
          fechaMatricula: this.form.value.fechaMatricula? Timestamp.fromDate(new Date(`${this.form.value.fechaMatricula}T00:00:00`)) : null,
          estado: 'activo',
        };
        const esUnica = await this.datosFireService.validarMatriculaUnica(matriculaData);
        if (!esUnica) {
          alert('El alumno ya está matriculado en este período.');
          return;
        }
   
        await this.datosFireService.crearMatricula(matriculaData);
        alert('Matrícula guardada exitosamente');


          // Mostrar opción de generar PDF
          if (confirm('¿Deseas generar un PDF con el reporte de esta matrícula?')) {
            this.generarPDF(matriculaData);
          }
         
        this.cargarMatriculas();
        this.form.reset();
        this.alumnoSeleccionado = null;
        this.modoEdicion = false;
        this.mostrarForm = false;
      }
       this.cargarMatriculas();
        this.resetForm();
        this.modoEdicion = false; // Asegura que siempre regrese al modo de creación
        this.mostrarForm = false; // Oculta el formulario
      } catch (error) {
        console.error('Error al guardar la matrícula:', error);
        alert('Ocurrió un error al guardar la matrícula');
     
      }
  }else {
    // Lógica para registrar nueva matrícula
    console.log('Formulario creado con:', this.form.value);
    // Aquí iría la llamada para registrar una nueva matrícula
  }
 
}
generarPDF(matriculaData: any): void {
  const doc = new jsPDF();

  // Configurar la imagen para el encabezado
  const logoURL = 'logo n.png'; // Reemplaza con la ruta o base64 de tu imagen
  const imageWidth = 50; // Ancho de la imagen
  const imageHeight = 50; // Alto de la imagen

  // Agregar títulos en el centro del encabezado
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Centro de Oratoria San José Don Bosco', 105, 20, { align: 'center' });

  // Agregar la imagen centrada debajo del primer título
  const pageWidth = doc.internal.pageSize.getWidth();
  const imageX = (pageWidth - imageWidth) / 2; // Centrar la imagen
  doc.addImage(logoURL, 'PNG', imageX, 25, imageWidth, imageHeight);

  // Segundo título
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Certificado de Matrícula', 105, 85, { align: 'center' });

  // Concatenar nombre y apellido del alumno
  const alumnoNombreCompleto = `${matriculaData.alumnoNombre} ${this.alumnoSeleccionado.apellido}`;

  // Obtener usuario actual y concatenar su nombre completo
  const usuarioActual = this.authService.getCurrentUser();
  const usuarioNombreCompleto = `${usuarioActual.nombre} ${usuarioActual.apellido}`;

  // Mensaje principal
  const fechaMatricula = matriculaData.fechaMatricula.toDate().toLocaleDateString();
  const periodoNombre = matriculaData.periodoNombre;
  const nivelNombre = matriculaData.nivelNombre;
  const paraleloNombre = matriculaData.paraleloNombre;
  const periodoInicio = this.periodoSeleccionado.fechaInicio.toDate().toLocaleDateString();
  const periodoFin = this.periodoSeleccionado.fechaFin.toDate().toLocaleDateString();

  const mensaje = `Manta, ${fechaMatricula}

Certificamos que se ha matriculado al alumno ${alumnoNombreCompleto} en el período ${periodoNombre}, nivel ${nivelNombre} y paralelo ${paraleloNombre}. Este período durará desde ${periodoInicio} hasta ${periodoFin}. Agradecemos su compromiso con nuestra institución.

--------------------------
Matriculado por: ${usuarioNombreCompleto}`;

  // Ajustar el texto para justificarlo
  const anchoTexto = 170; // Ancho máximo del texto (en mm)
  const textoDividido: string[] = doc.splitTextToSize(mensaje, anchoTexto);

  // Agregar texto justificado
  const startY = 95;
  textoDividido.forEach((line: string, index: number) => {
    doc.text(line, 20, startY + index * 7);
  });

  // Descargar el PDF
  doc.save(`reporte_matricula_${alumnoNombreCompleto}.pdf`);
}

}
