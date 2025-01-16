import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../general/data-access/auth.service';
import { CommonModule } from '@angular/common';
interface FormSign {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
}

@Component({
  selector: 'app-presesion',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './presesion.component.html',
})
export default class PresesionComponent {

  private _usuarioService = inject(AuthService);
  private router = inject(Router);
  passwordVisible = false;
  // Inicialización del FormBuilder usando el inject
  form = inject(FormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    contraseña: ['', [Validators.required]]  // Cambié el campo a "contraseña"
  });

  constructor() {
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
      const loginSuccess = await this._usuarioService.login(email!, contraseña!);  // Cambié "password" por "contraseña"
      
      if (loginSuccess) {
        // Si el login es exitoso, redirigir al usuario
        this.router.navigate(['']);  // Redirige a la página de dashboard
      } else {
        alert('Error en el login');
      }
    } catch (error) {
      console.error('Error en el login:', error);
      alert('Error al intentar iniciar sesión. Por favor, intenta nuevamente.');
    }
  }
}