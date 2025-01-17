import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { FormularioscursosComponent } from '../../secretaria/formularios/formularioscursos/formularioscursos.component';
@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, FormularioscursosComponent],
  templateUrl: './panel.component.html',
  styles: ``
})
export default class PanelComponent {
  vistaSeleccionada: string = '';

  // Cambiar la vista dependiendo del botón seleccionado
  cambiarVista(vista: string) {
    this.vistaSeleccionada = vista;
  }
}
