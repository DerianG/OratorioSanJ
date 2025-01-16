import { FormGroup } from '@angular/forms';

// 1. Validación de campos requeridos
export const isRequired = (field: string, form: FormGroup) => {
  const control = form.get(field);
  return control && control.touched && control.hasError('required');
};

// 8. Validación de coincidencia de contraseñas (confirmar que las contraseñas coincidan)
export const matchPasswords = (form: FormGroup) => {
  const password = form.get('contraseña')?.value;
  const confirmPassword = form.get('confirmContraseña')?.value;
  return password === confirmPassword ? null : { mismatch: true };
};
