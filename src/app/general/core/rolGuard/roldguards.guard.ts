import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../../data-access/auth.service'; // Ajusta el path si es necesario
import { Observable, of ,from } from 'rxjs';
import { map, switchMap, catchError  } from 'rxjs/operators';
import { Router } from '@angular/router';

//adminguard
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // Inyectar el servicio AuthService
  const router = inject(Router); // Inyectar el router

  // Verificar si el usuario está logueado usando el método del servicio
  return authService.isUserLoggedIn().pipe(
    switchMap(isLoggedIn => {
      if (!isLoggedIn) {
        console.log("No logeado");
        router.navigate(['/info/ingreso']);  // Si no está logueado, redirigir al login
        return of(false);  // Bloquear el acceso
      }

      // Si está logueado, obtener el usuario desde localStorage
      const userStr = localStorage.getItem('user');  // Obtenemos el objeto 'user' desde localStorage

      if (!userStr) {
        console.log("Usuario no encontrado en localStorage");
        router.navigate(['/info/ingreso']);  // Si no hay usuario en localStorage, redirigir al login
        return of(false);  // Bloquear el acceso
      }

      // Parsear el objeto JSON del usuario
      const user = JSON.parse(userStr);

      // Verificar si el rol del usuario es 'administrador'
      if (user.role === 'administrador') {
        console.log("Acceso permitido");
        return of(true);  // Permitir el acceso
      } else {
        console.log("Acceso denegado: Rol incorrecto");
        router.navigate(['']);  // Redirigir al home si el rol no es 'administrador'
        return of(false);  // Bloquear el acceso
      }
    })
  );
};


//profeguard
export const ProfesorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // Inyectar el servicio AuthService
  const router = inject(Router); // Inyectar el router

  // Verificar si el usuario está logueado usando el método del servicio
  return authService.isUserLoggedIn().pipe(
    switchMap(isLoggedIn => {
      if (!isLoggedIn) {
        console.log("No logeado");
        router.navigate(['/info/ingreso']);  // Si no está logueado, redirigir al login
        return of(false);  // Bloquear el acceso
      }

      // Si está logueado, obtener el usuario desde localStorage
      const userStr = localStorage.getItem('user');  // Obtenemos el objeto 'user' desde localStorage

      if (!userStr) {
        console.log("Usuario no encontrado en localStorage");
        router.navigate(['/info/ingreso']);  // Si no hay usuario en localStorage, redirigir al login
        return of(false);  // Bloquear el acceso
      }

      // Parsear el objeto JSON del usuario
      const user = JSON.parse(userStr);

      // Verificar si el rol del usuario es 'administrador'
      if (user.role === 'administrador'|| user.role === 'profesor') {
        console.log("Acceso permitido");
        return of(true);  // Permitir el acceso
      } else {
        console.log("Acceso denegado: Rol incorrecto");
        router.navigate(['']);  // Redirigir al home si el rol no es 'administrador'
        return of(false);  // Bloquear el acceso
      }
    })
  );
};

//secretarioguard
export const SecretarioGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // Inyectar el servicio AuthService
  const router = inject(Router); // Inyectar el router

  // Verificar si el usuario está logueado usando el método del servicio
  return authService.isUserLoggedIn().pipe(
    switchMap(isLoggedIn => {
      if (!isLoggedIn) {
        console.log("No logeado");
        router.navigate(['/info/ingreso']);  // Si no está logueado, redirigir al login
        return of(false);  // Bloquear el acceso
      }

      // Si está logueado, obtener el usuario desde localStorage
      const userStr = localStorage.getItem('user');  // Obtenemos el objeto 'user' desde localStorage

      if (!userStr) {
        console.log("Usuario no encontrado en localStorage");
        router.navigate(['/info/ingreso']);  // Si no hay usuario en localStorage, redirigir al login
        return of(false);  // Bloquear el acceso
      }

      // Parsear el objeto JSON del usuario
      const user = JSON.parse(userStr);

      // Verificar si el rol del usuario es 'administrador'
      if (user.role === 'administrador'|| user.role === 'secretario') {
        console.log("Acceso permitido");
        return of(true);  // Permitir el acceso
      } else {
        console.log("Acceso denegado: Rol incorrecto");
        router.navigate(['']);  // Redirigir al home si el rol no es 'administrador'
        return of(false);  // Bloquear el acceso
      }
    })
  );
};


//padreguard
export const PadresGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // Inyectar el servicio AuthService
  const router = inject(Router); // Inyectar el router

  // Verificar si el usuario está logueado usando el método del servicio
  return authService.isUserLoggedIn().pipe(
    switchMap(isLoggedIn => {
      if (!isLoggedIn) {
        console.log("No logeado");
        router.navigate(['/info/ingreso']);  // Si no está logueado, redirigir al login
        return of(false);  // Bloquear el acceso
      }

      // Si está logueado, obtener el usuario desde localStorage
      const userStr = localStorage.getItem('user');  // Obtenemos el objeto 'user' desde localStorage

      if (!userStr) {
        console.log("Usuario no encontrado en localStorage");
        router.navigate(['/info/ingreso']);  // Si no hay usuario en localStorage, redirigir al login
        return of(false);  // Bloquear el acceso
      }

      // Parsear el objeto JSON del usuario
      const user = JSON.parse(userStr);

      // Verificar si el rol del usuario es 'administrador'
      if (user.role === 'administrador'|| user.role === 'alumno') {
        console.log("Acceso permitido");
        return of(true);  // Permitir el acceso
      } else {
        console.log("Acceso denegado: Rol incorrecto");
        router.navigate(['']);  // Redirigir al home si el rol no es 'administrador'
        return of(false);  // Bloquear el acceso
      }
    })
  );
};
