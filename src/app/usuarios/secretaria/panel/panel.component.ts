import { Component } from '@angular/core';
import { RouterOutlet,RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';  
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import FormulariousuariosComponent from '../../AdminG/formularios/formulariousuarios/formulariousuarios.component';
import { FormularioscursosComponent } from '../formularios/formularioscursos/formularioscursos.component';
import { FormulariosmatriculasComponent } from '../formularios/formulariosmatriculas/formulariosmatriculas.component';
@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, FormulariousuariosComponent, FormulariosmatriculasComponent, FormularioscursosComponent],
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
 