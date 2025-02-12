import { Component,OnInit,ChangeDetectorRef   } from '@angular/core';
import { DatosFireService } from '../../../../general/data-access/datos-fire.service';
import { AuthService } from '../../../../general/data-access/auth.service';
import { AlertService } from '../../../../general/data-access/alert.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule  ,Validators , FormGroup, FormArray  } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';
import { FormularionivelesComponent } from '../formularioniveles/formularioniveles.component';
import { jsPDF }  from 'jspdf';
import 'jspdf-autotable';
import { AlertasComponent } from '../../../../general/utils/alertas/alertas.component';

// Extensión de la interfaz para incluir lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number }; // Añadir la propiedad con el tipo esperado
  }
}
interface Nivel {
  nombre: string;
}
@Component({
  selector: 'app-formularioperiodos',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule, FormularionivelesComponent, AlertasComponent],
  templateUrl: './formularioperiodos.component.html',
  styles: ``
})
export class FormularioperiodosComponent implements  OnInit {

  form: FormGroup;
  periodos: any[] = [];
  periodosFiltrados: any[] = [];
  mostrarForm: boolean = false;
  modoEdicion: boolean = false;
  periodoEditando: any = null;
  valorFiltro: string = '';
  campoFiltro: string = 'nombre';
  placeholder: string = 'Ingrese el valor a buscar';
  detalleSeleccionado: any = null; // Período seleccionado para mostrar detalles
  nivelesDisponibles: any[] = []; // Lista de niveles obtenida de Firestore
  periodoId: string | null = null; // ID del período a modificar
  fechaInvalida: boolean = false;
  matriculas: any[] = []; // Aquí se guardarán las matrículas
  alerta = { message: '', class: '', tipo: '' };  // Para las alertas
  constructor(
    private fb: FormBuilder,
    private datosFireService: DatosFireService,
    private authService: AuthService,
    public alertaService: AlertService
  ) {

    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(4)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      estado: ['activo', Validators.required],
      nivelesSeleccionados: this.fb.array([], Validators.required)
    },
    { validators: this.validarFechas }
     );
  }
  ngOnInit(): void {
    this.cargarPeriodos();
    this.cargarNiveles(); // Cargar los niveles desde Firebase
  }

  async cargarPeriodos(): Promise<void> {
    this.periodos = await this.datosFireService.getPeriodos();
    this.periodosFiltrados = [...this.periodos];
  }
  async cargarNiveles(): Promise<void> {

    this.nivelesDisponibles = await this.datosFireService.getNiveles();
    this.nivelesSeleccionados.clear();  // Limpiar niveles seleccionados
  
    // Si estamos en modo edición, se marcan los niveles correspondientes
    if (this.modoEdicion && this.periodoEditando) {
      this.cargarNivelesYMarcar(this.periodoEditando.id);
    } else {
      // Si estamos creando, marcar los niveles predeterminados
      this.nivelesDisponibles.forEach((nivel: any) => {
        if (nivel.pordefecto) { // Si el nivel tiene porDefecto como true
          this.nivelesSeleccionados.push(this.fb.group(nivel)); // Agregar nivel al FormArray
        }
      });
    }
  }
  validarFechas(group: FormGroup): { [key: string]: boolean } | null {
    const fechaInicio = group.get('fechaInicio')?.value;
    const fechaFin = group.get('fechaFin')?.value;

    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      if (fin < inicio) {
        return { fechaInvalida: true }; // Si la fecha de fin es menor, devuelve un error
      }
    }
    return null; // No hay error
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
  
  

  editarPeriodo(periodo: any): void {
   
    this.periodoEditando = periodo;
  
    console.log(this.periodoEditando); // Verifica que las fechas sean de tipo Timestamp
  
    // Asegúrate de que la conversión de fecha funciona
    console.log(periodo.fechaInicio,periodo.fechaFin)
    const fechaInicio = this.convertirFecha(periodo.fechaInicio)
    const fechaFin = this.convertirFecha(periodo.fechaFin)
  
    // Establecer valores en el formulario
    this.form.patchValue({
      nombre: periodo.nombre || '',
      fechaInicio:fechaInicio,
      fechaFin: fechaFin,
      estado: periodo.estado || 'activo',
    });
    
    // Cargar los niveles asociados al periodo actual usando el servicio
    if (periodo.id) {
      this.cargarNivelesYMarcar(periodo.id);
    }
    this.modoEdicion = true;
    this.mostrarForm = true;

  }
  
  
  
// Controlador - Cargar niveles y marcarlos en el formulario
async cargarNivelesYMarcar(periodoId: string): Promise<void> {
  // Cargar todos los niveles disponibles desde Firebase
  this.nivelesDisponibles = await this.datosFireService.getNiveles();

  // Obtener los niveles asociados al periodo usando el servicio
  const nivelesDelPeriodo = await this.datosFireService.getNivelesPorPeriodo(periodoId);

  // Configurar los niveles seleccionados según la relación con el periodo
  const nivelesArray = this.nivelesSeleccionados;
  nivelesArray.clear(); // Limpiar niveles previamente seleccionados

  this.nivelesDisponibles.forEach((nivel: any) => {
    // Si el nivel está asociado al periodo, seleccionarlo
    const estaEnPeriodo = nivelesDelPeriodo.some((n: any) => n.id === nivel.id);
    if (estaEnPeriodo) {
      nivelesArray.push(this.fb.group(nivel));
    }
  });
}

mostrarFormulario(): void {
  this.mostrarForm = !this.mostrarForm;
  if (this.mostrarForm) {
    this.cargarNiveles(); // Recargar niveles cuando se abre el formulario
  } else {
    this.resetForm();
  }
}


  resetForm(): void {
    this.form.reset({
      estado: 'activo',
    });
    this.nivelesSeleccionados.clear();
    this.modoEdicion = false; // Salir del modo edición
    this.mostrarForm = false; // Ocultar el formulario
    this.periodoEditando = null;
  }
  
async submit(): Promise<void> {
  if (this.form.invalid) {
    this.mostrarAlertaDeAdvertencia('Por favor, completa correctamente todos los campos.');
      return;
  }

  if (this.nivelesSeleccionados.value.length === 0) {
    this.mostrarAlertaDeAdvertencia('Debes seleccionar al menos un nivel.');
    return;
  }

  const formData = this.form.value;

  const periodoData = {
    ...formData,
    fechaInicio: formData.fechaInicio,  // Se deja como string o Date
    fechaFin: formData.fechaFin,        // Se deja como string o Date
  };


  const nivelesSeleccionados = this.nivelesSeleccionados.value.map((nivel: any) => {

    return { id: nivel.id, nombre: nivel.nombre };  // Solo guardar id y nombre
  });

  try {
    if (this.modoEdicion && this.periodoEditando) {
      // Actualizar el período con los niveles seleccionados
      await this.datosFireService.actualizarPeriodoConNiveles(this.periodoEditando.id, periodoData, nivelesSeleccionados);
      this.mostrarAlertaDeExito('Período actualizado con éxito.');
    } else {
      // Crear el período con los niveles seleccionados
      await this.datosFireService.crearPeriodoConNiveles(periodoData, nivelesSeleccionados);
      this.mostrarAlertaDeExito('Período creado con éxito.');
    }
  } catch (error) {
    console.error('Error al guardar el período:', error);
    this.mostrarAlertaDeError('Ocurrió un error al guardar el período.');
  }

  this.cargarPeriodos();
  this.resetForm();
}


  
  

  filtrarPeriodos(): void {
    if (!this.valorFiltro.trim()) {
      this.periodosFiltrados = [...this.periodos];
      return;
    }

    const filtro = this.valorFiltro.toLowerCase();
    this.periodosFiltrados = this.periodos.filter((periodo) => {
      let valorCampo = this.obtenerValorCampo(periodo);
      return valorCampo.includes(filtro);
    });
  }

  obtenerValorCampo(periodo: any): string {
    switch (this.campoFiltro) {
      case 'fechaInicio':
      case 'fechaFin':
        return periodo[this.campoFiltro]?.toDate()?.toISOString().split('T')[0] || '';
      case 'estado':
        return periodo.estado?.toLowerCase().substring(0, 3) || '';
      default:
        return periodo[this.campoFiltro]?.toLowerCase() || '';
    }
  }

  actualizarPlaceholder(): void {
    const placeholders: Record<string, string> = {
      nombre: 'Ingrese el nombre para buscar',
      estado: 'Ingrese estado (activo/inactivo)',
      fechaInicio: 'Ingrese fecha (yyyy-mm-dd)',
      fechaFin: 'Ingrese fecha (yyyy-mm-dd)',
    };
    this.placeholder = placeholders[this.campoFiltro] || 'Ingrese el valor a buscar';
  }


  eliminarPeriodo(id: string, nombre: string): void {
    // Mostrar alerta de confirmación
    this.alertaService.mostrarAlerta(
      `¿Estás seguro de que deseas eliminar el período "${nombre}"?`,
      'danger', // Clase de alerta (puedes ajustar el color según tu diseño)
      'Confirmación: ', // Tipo de alerta (puedes cambiar esto si lo prefieres)
      true, // Esto indica que es una alerta de confirmación
      () => {
        // Acción confirmada
        this.datosFireService.eliminarPeriodo(id).then(() => {
          this.cargarPeriodos();
          this.alertaService.mostrarAlerta(
            'Período eliminado con éxito.',
            'success',
            'Éxito: '
          );
        }).catch((error) => {
          console.error('Error al eliminar el período:', error);
          this.alertaService.mostrarAlerta(
            'Hubo un error al intentar eliminar el período.',
            'danger',
            'Error: '
          );
        });
      },
      () => {
        // Acción cancelada (si el usuario cancela la eliminación)
        console.log('Eliminación cancelada');
        this.alertaService.mostrarAlerta(
          'La eliminación del período fue cancelada.',
          'warning',
          'Advertencia: '
        );
      }
    );
  }
  


  verDetalle(periodo: any): void {
    this.detalleSeleccionado = {
      ...periodo,
      niveles: periodo.niveles || []
    };
  }
  ocultarDetalle(): void {
    this.detalleSeleccionado = null; // Limpia el detalle seleccionado
  }


  get nivelesSeleccionados(): FormArray {
    return this.form.get('nivelesSeleccionados') as FormArray;
  }
  // Alterna la selección de un nivel en el FormArray
  toggleNivelSeleccionado(nivel: any): void {
    const nivelesArray = this.nivelesSeleccionados;

    const index = nivelesArray.value.findIndex((n: any) => n.id === nivel.id);
    if (index >= 0) {
        nivelesArray.removeAt(index); // Si ya está seleccionado, eliminarlo
    } else {
        nivelesArray.push(this.fb.group(nivel)); // Si no está seleccionado, agregarlo
    }
  }
  // Verifica si un nivel está seleccionado o pertenece al período
  isNivelSeleccionado(nivelId: string): boolean {
    return this.nivelesSeleccionados.value.some((n: any) => n.id === nivelId);
  }
    

  // Validaciones para mensajes de error
  get isRequiredNombre(): boolean {
    const control = this.form.get('nombre');
    return control ? control.hasError('required') && control.touched : false;
  }
  
  get isValidNombre(): boolean {
    const control = this.form.get('nombre');
    return control ? control.hasError('minlength') && control.touched : false;
  }

  async generarReportePeriodo(periodoData: any): Promise<void> {
    const doc = new jsPDF();
    
    // Configurar la imagen para el encabezado
    const logoURL = 'logo n.png'; // Reemplaza con la ruta o base64 de tu imagen
    const imageWidth = 50;
    const imageHeight = 50;
  
    // Títulos en el encabezado
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Centro de Oratoria San José Don Bosco', 105, 20, { align: 'center' });
  
    // Agregar la imagen centrada
    const pageWidth = doc.internal.pageSize.getWidth();
    const imageX = (pageWidth - imageWidth) / 2; // Centrar la imagen
    doc.addImage(logoURL, 'PNG', imageX, 25, imageWidth, imageHeight);
  
    // Segundo título
    doc.setFontSize(12);
    doc.text(`Reporte del Período: ${periodoData.nombre}`, 105, 85, { align: 'center' });
  
   // Información del período
const fechaInicio = periodoData.fechaInicio.toDate().toLocaleDateString();
const fechaFin = periodoData.fechaFin.toDate().toLocaleDateString();

// Definir el tipo de los niveles seleccionados
const nivelesSeleccionados: Nivel[] = periodoData.nivelesSeleccionados || []; // Asegurarse de que el array no sea undefined

// Crear la lista de niveles numerados
const nivelesLista = nivelesSeleccionados.map((nivel, index) => `${index + 1}. ${nivel.nombre}`);

// Crear el contenido con una lista de niveles
const contenido = `Detalles del Período:
- Nombre: ${periodoData.nombre}
- Fecha de Inicio: ${fechaInicio}
- Fecha de Fin: ${fechaFin}
- Niveles
`;
// Dividir y justificar el contenido
const anchoTexto = 170;
const textoDividido: string[] = doc.splitTextToSize(contenido, anchoTexto);

// Agregar el contenido al PDF, ahora con justificación a la izquierda
let startY = 95; // Comienza después de la cabecera
textoDividido.forEach((line: string, index: number) => {
  doc.text(line, 20, startY + index * 7); // 20 es la posición X para justificar a la izquierda
});

// Ajustar la posición Y para los niveles
startY += textoDividido.length * 6 ; // Ajustar el espacio después de la información del período

// Agregar los niveles en formato de lista
nivelesLista.forEach((nivel, index) => {
  doc.text(nivel, 30, startY + index * 7); // Ajustar X para los niveles y Y para la posición de cada nivel
});

    // Espacio adicional antes de la primera tabla
    startY += textoDividido.length * 7 + 20; // Ajusta según el número de líneas
  
    try {
      const matriculasData = await this.datosFireService.getMatriculas();
      this.matriculas = matriculasData.map(matricula => ({
        ...matricula,
        fechaMatricula: matricula.fechaMatricula instanceof Timestamp
          ? matricula.fechaMatricula.toDate()
          : new Date(matricula.fechaMatricula),
      }));
    } catch (error) {
      console.error('Error al cargar matrículas:', error);
      return;
    }
  
    const matriculasDelPeriodo = this.matriculas.filter(
      matricula => matricula.periodoId === periodoData.id
    );
  
    // Agrupar matrículas por nivel
    const nivelesUnicos = Array.from(new Set(matriculasDelPeriodo.map(m => m.nivelNombre)));
  
    // Ordenar los niveles alfabéticamente
    nivelesUnicos.sort();
  
    // Generar una tabla para cada nivel
    for (const nivel of nivelesUnicos) {
      const matriculasDelNivel = matriculasDelPeriodo.filter(m => m.nivelNombre === nivel);
  
      // Ordenar las matrículas por paralelo (alfabéticamente)
      matriculasDelNivel.sort((a, b) => a.paraleloNombre.localeCompare(b.paraleloNombre));
  
      // Título del nivel
      doc.setFont('helvetica', 'bold');
      doc.text(`Nivel: ${nivel}`, 20, startY);
  
      // Definir columnas y filas de la tabla
      const columns = ['Alumno', 'Fecha Matrícula', 'Paralelo', 'Estado'];
      const rows = [];
  
      for (const matricula of matriculasDelNivel) {
        // Obtener los datos del alumno usando su alumnoId
        const alumnoData = await this.authService.obtenerAlumnoPorId(matricula.alumnoId);
  
        if (alumnoData) {
          let estadoFaltas = alumnoData.estadoFaltas;
  
          // Verificar si el estadoFaltas existe, de lo contrario dejar vacío
          if (!estadoFaltas) {
            estadoFaltas = ''; // Si no existe el estado, dejamos vacío
          }
  
          // Lógica para el color de subrayado según el estado
          const estadoText = estadoFaltas.toLowerCase() === 'reprobado' 
            ? 'Reprobado' 
            : estadoFaltas || 'Aprobado'; // Si no hay estado, ponemos "Aprobado"
          
          // Decidir color del texto según el estado
          const estadoColor = estadoFaltas.toLowerCase() === 'reprobado' ? [255, 0, 0] : [0, 128, 0]; // Rojo para reprobado, verde para aprobado o cualquier otro
  
          // Añadir fila con el texto y el color en la columna de Estado
          rows.push([
            `${alumnoData.nombre} ${alumnoData.apellido}`,
            matricula.fechaMatricula.toLocaleDateString(),
            matricula.paraleloNombre,
            { content: estadoText, styles: { textColor: estadoColor, textDecoration: 'underline' } }, // Subrayado y color
          ]);
        }
      }
  
      // Dibujar la tabla usando autoTable
      // @ts-ignore: Ignore TypeScript error for jsPDF autotable
      doc.autoTable({
        head: [columns],
        body: rows,
        startY: startY + 5,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 160, 133] }, // Verde claro
      });
  
      // Actualizar la posición Y después de la tabla, añadiendo un espacio extra
      startY = (doc.lastAutoTable?.finalY ?? startY) + 15; // Añade espacio extra entre tablas
    }
  
    // Guardar el PDF
    doc.save(`reporte_periodo_${periodoData.nombre}.pdf`);
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