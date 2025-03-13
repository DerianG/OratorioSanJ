import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../general/data-access/auth.service';
import { AlertService } from '../../../general/data-access/alert.service';
import { CommonModule } from '@angular/common';
import { AlertasComponent } from '../../../general/utils/alertas/alertas.component';
interface FormSign {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
}

@Component({
  selector: 'app-presesion',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, AlertasComponent],
  templateUrl: './presesion.component.html',
})
export default class PresesionComponent {

  private authService = inject(AuthService);
  private router = inject(Router);
  
  passwordVisible = false;
  // Inicialización del FormBuilder usando el inject
  form = inject(FormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    contraseña: ['', [Validators.required]]  // Cambié el campo a "contraseña"
  });

  constructor(   public alertaService: AlertService) {
    // Verificar si el usuario ya está logueado, en ese caso redirigirlo
    
  }

  isRequired(field: 'email' | 'contraseña') {  // Cambié a "contraseña"
    return this.form.get(field)?.hasError('required') && this.form.get(field)?.touched;
  }

  hasEmailError() {
    return this.form.get('email')?.hasError('email') && this.form.get('email')?.touched;
  }
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
  async loginUser() {
    try {
      if (this.form.invalid) return;

      const { email, contraseña } = this.form.value;  // Cambié "password" por "contraseña"

      // Verificar las credenciales del usuario
      const loginSuccess = await this.authService.login(email!, contraseña!);  // Cambié "password" por "contraseña"
      
      if (loginSuccess) {
        // Si el login es exitoso, redirigir al usuario

        const usuarioActual = this.authService.getCurrentUser();
        const nombre = `${usuarioActual.nombre} `;
        this.mostrarAlertaDeExito(`ingreso correcto, bienvenido "${nombre}"`)
        setTimeout(() => {
          this.router.navigate(['']);  // Redirige a la página de dashboard
        }, 1000); // Se oculta después de 5 segundos
       
       
      } else {
        this.mostrarAlertaDeError('Error en el ingreso, verifique el correo y contraseña');
      }
    } catch (error) {
      console.error('Error en el login:', error);
      this.mostrarAlertaDeError('Error al intentar iniciar sesión. Por favor, intenta nuevamente.');
    }
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