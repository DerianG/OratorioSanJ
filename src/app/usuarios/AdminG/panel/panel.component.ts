import { Component } from '@angular/core';
import { RouterOutlet,RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';  
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import FormulariousuariosComponent from '../formularios/formulariousuarios/formulariousuarios.component';
import { FormularioperiodosComponent } from '../formularios/formularioperiodos/formularioperiodos.component';
import { FormulariosmatriculasComponent } from '../../secretaria/formularios/formulariosmatriculas/formulariosmatriculas.component';
import { FormularioscursosComponent } from '../../secretaria/formularios/formularioscursos/formularioscursos.component';


@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, FormulariousuariosComponent, FormularioperiodosComponent, FormulariosmatriculasComponent, FormularioscursosComponent],
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
