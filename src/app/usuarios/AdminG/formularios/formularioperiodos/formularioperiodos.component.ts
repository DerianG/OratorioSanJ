import { Component,OnInit,ChangeDetectorRef   } from '@angular/core';
import { DatosFireService } from '../../../../general/data-access/datos-fire.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule  ,Validators , FormGroup, FormArray  } from '@angular/forms';
import { Timestamp } from 'firebase/firestore'; // Asegúrate de importar Timestamp
import { FormularionivelesComponent } from '../formularioniveles/formularioniveles.component';

@Component({
  selector: 'app-formularioperiodos',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule, FormularionivelesComponent],
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

  constructor(private fb: FormBuilder, private datosFireService: DatosFireService) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(4)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      estado: ['activo', Validators.required],
      nivelesSeleccionados: this.fb.array([], Validators.required)
    });
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
    // Cargar niveles desde Firebase
    this.nivelesDisponibles = await this.datosFireService.getNiveles();

    // Configurar los niveles seleccionados según el valor porDefecto
    const nivelesArray = this.nivelesSeleccionados;
    nivelesArray.clear(); // Limpiar niveles previamente seleccionados

    this.nivelesDisponibles.forEach((nivel: any) => {
        if (nivel.pordefecto) { // Si el nivel tiene porDefecto como true
            nivelesArray.push(this.fb.group(nivel)); // Agregar nivel al FormArray
        }
    });
}



editarPeriodo(periodo: any): void {
  this.modoEdicion = true;
  this.mostrarForm = true;
  this.periodoEditando = periodo;

  this.form.patchValue({
    nombre: periodo.nombre || '',
    fechaInicio: this.convertirFecha(periodo.fechaInicio) || '',
    fechaFin: this.convertirFecha(periodo.fechaFin) || '',
    estado: periodo.estado || 'activo',
  });

  // Cargar los niveles asociados al periodo actual usando el servicio
  if (periodo.id) {
    this.cargarNivelesYMarcar(periodo.id);
  }
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
    if (!this.mostrarForm) this.resetForm();
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
    window.alert('Por favor, completa correctamente todos los campos.');
    return;
  }

  if (this.nivelesSeleccionados.value.length === 0) {
    window.alert('Debes seleccionar al menos un nivel.');
    return;
  }

  const formData = this.form.value;

  const periodoData = {
    ...formData,
    fechaInicio: formData.fechaInicio ? Timestamp.fromDate(new Date(`${formData.fechaInicio}T00:00:00`)) : null,
    fechaFin: formData.fechaFin ? Timestamp.fromDate(new Date(`${formData.fechaFin}T00:00:00`)) : null,
  };

  // Aquí aseguramos que solo estamos extrayendo los niveles seleccionados correctamente
  const nivelesSeleccionados = this.nivelesSeleccionados.value.map((nivel: any) => {
    return { id: nivel.id, nombre: nivel.nombre };  // Solo guardar id y nombre
  });

  try {
    if (this.modoEdicion && this.periodoEditando) {
      // Actualizar el período con los niveles seleccionados
      await this.datosFireService.actualizarPeriodoConNiveles(this.periodoEditando.id, periodoData, nivelesSeleccionados);
      window.alert('Período actualizado con éxito.');
    } else {
      // Crear el período con los niveles seleccionados
      await this.datosFireService.crearPeriodoConNiveles(periodoData, nivelesSeleccionados);
      window.alert('Período creado con éxito.');
    }
  } catch (error) {
    console.error('Error al guardar el período:', error);
    window.alert('Ocurrió un error al guardar el período.');
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
  
  eliminarPeriodo(id: string, nombre: string): void {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el período "${nombre}"?`)) {
        this.datosFireService.eliminarPeriodo(id).then(() => {
            this.cargarPeriodos();
            window.alert('Período eliminado con éxito.');
        }).catch((error) => {
            console.error('Error al eliminar el período:', error);
            window.alert('Hubo un error al intentar eliminar el período.');
        });
    }
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
  
}