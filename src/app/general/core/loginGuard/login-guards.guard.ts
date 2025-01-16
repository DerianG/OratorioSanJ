import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../data-access/auth.service';
import { Observable,of } from 'rxjs';
import { map, catchError,switchMap,  } from 'rxjs/operators';

export const authLoginGuards: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);  // Inyectar el servicio de autenticación
  const router = inject(Router);  // Inyectar el router

  // Usar el método isUserLoggedIn() para verificar si el usuario está logueado
  return authService.isUserLoggedIn().pipe(
    switchMap(isLoggedIn => {
      if (!isLoggedIn) {
        // Si no está logueado, redirigir al login
        console.log("Usuario no logeado");
        router.navigate(['/info/ingreso']); // Ruta de login
        return of(false);  // Bloquear el acceso
      }

      // Si está logueado, permitir el acceso
      return of(true);
    })
  );
};
export const preventLoggedInAccessGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // Inyectar el servicio AuthService
  const router = inject(Router); // Inyectar el router

  // Usar el método isUserLoggedIn() para verificar si el usuario está logueado
  return authService.isUserLoggedIn().pipe(
    switchMap(isLoggedIn => {
      if (isLoggedIn) {
        // Si el usuario ya está logueado, redirigir a la página principal o dashboard
        console.log("Ya estás logueado, redirigiendo...");
        router.navigate(['']); // Ruta de home o dashboard, ajusta a tu ruta principal
        return of(false);  // Bloquear el acceso al login
      }

      // Si no está logueado, permitir el acceso al login
      return of(true);
    })
  );
};