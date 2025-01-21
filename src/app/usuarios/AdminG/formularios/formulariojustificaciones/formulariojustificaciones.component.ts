import { Component } from '@angular/core';
import { DatosFireService } from '../../../../general/data-access/datos-fire.service';
import { AuthService } from '../../../../general/data-access/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators , FormGroup} from '@angular/forms';
import { Subscription } from 'rxjs';
import { log } from 'firebase-functions/logger';
import { Timestamp } from 'firebase/firestore';
@Component({
  selector: 'app-formulariojustificaciones',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule ],
  templateUrl: './formulariojustificaciones.component.html',
  styles: ``
})
export class FormulariojustificacionesComponent {
  justificaciones: any[] = [];
  placeholder: string = 'Ingrese el valor a buscar'; // Placeholder dinámico
  filtroCampo: string = 'nombre'; // Campo seleccionado para filtrar
  filtroValor: string = ''; // Valor ingresado para filtrar
  justificacionesFiltradas: any[] = [];

  constructor(private datosFire: DatosFireService) {}
  ngOnInit(): void {
    this.loadJustificaciones();
  }
 // Método para cargar las justificaciones y los datos de las matrículas
 // Método para cargar las justificaciones y los datos de las matrículas
 async loadJustificaciones(): Promise<void> {
  try {
    const justificaciones = await this.datosFire.getJustificaciones();
    this.justificaciones = await Promise.all(
      justificaciones.map(async (justificacion) => {
        const matriculaData = await this.datosFire.getMatriculaporId(justificacion.matriculaId);
        return {
          ...justificacion,
          nombreAlumno: matriculaData.alumnoNombre,
          periodo: matriculaData.periodoNombre,
          nivel: matriculaData.nivelNombre,
          paralelo: matriculaData.paraleloNombre,
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

  // Método para justificar la falta
  justificar(justificacionId: string): void {
    // Preguntar al usuario si está seguro de justificar la falta
    const confirmar = window.confirm('¿Estás seguro de que deseas justificar esta falta?');

    if (confirmar) {
      // Si el usuario confirma, se llama al servicio para actualizar la justificación
      this.datosFire.justificarFalta(justificacionId)
        .then(() => {
          console.log('Falta justificada correctamente');
          window.alert('Falta justificada correctamente');
          this.loadJustificaciones()
          // Aquí podrías actualizar la lista de justificaciones si es necesario
        })
        .catch(error => {
          window.alert('Error al justificar la falta');
          console.error('Error al justificar la falta:', error);
        });
    } else {
      console.log('Justificación cancelada');
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
}

