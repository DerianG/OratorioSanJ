import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter, OnChanges, inject, SimpleChanges   } from '@angular/core';
import { DatosFireService } from '../../../../general/data-access/datos-fire.service';
@Component({
  selector: 'app-formularioniveles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formularioniveles.component.html',
  styles: ``
})
export class FormularionivelesComponent  implements OnInit , OnChanges {
  @Input() detalle: any; // Recibe el período seleccionado
  @Input() niveles: any[] = []; // Lista de niveles asociados al período
  @Output() detalleOcultado = new EventEmitter<void>(); // Evento para notificar que se debe ocultar el detalle

  detalleConvertido: any; // Convertimos fechas si es necesario
  nivelesAsociados: any[] = []; // Lista de niveles asociados al periodo
  private datosFireService = inject(DatosFireService); // Inyectamos el servicio de DatosFireService

  ngOnInit(): void {
    if (this.detalle) {
      this.detalleConvertido = {
        ...this.detalle,
        fechaInicio: this.detalle.fechaInicio.toDate(),
        fechaFin: this.detalle.fechaFin.toDate(),
      };

     
    }
  }
// ngOnChanges para manejar cambios en el detalle
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['detalle'] && this.detalle) {
      // Actualizamos los datos del detalle cuando cambie el periodo
      this.detalleConvertido = {
        ...this.detalle,
        fechaInicio: this.detalle.fechaInicio.toDate(),
        fechaFin: this.detalle.fechaFin.toDate(),
      };

      // Si la subcolección de niveles existe, cargamos los niveles del periodo
      this.obtenerNiveles();
    }
  }
  // Método para ocultar el detalle
  ocultarDetalle(): void {
    this.detalleOcultado.emit(); // Emite el evento para ocultar el detalle
  }

  // Obtener niveles de la subcolección "niveles" del período usando el servicio
  async obtenerNiveles(): Promise<void> {
    try {
      this.niveles = await this.datosFireService.getNivelesPorPeriodo(this.detalle.id);
      if (this.niveles.length === 0) {
        console.log('Este período no tiene niveles asociados.');
      }
    } catch (error) {
      console.error('Error al obtener los niveles:', error);
    }
  }
}