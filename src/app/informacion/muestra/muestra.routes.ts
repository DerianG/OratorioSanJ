import { Routes } from "@angular/router";
import { preventLoggedInAccessGuard } from "../../general/core/loginGuard/login-guards.guard"; 

export default [
    {
        path: 'inicio',
        loadComponent: () => import('./principal/principal.component')
    },
    {
        path: 'actividades',
        loadComponent: () => import('./actividades/actividades.component'),
       
    },
    {
        path: 'nofound',
        loadComponent: () => import('./nopagina/nopagina.component')
    },
    {
        
        path: 'ingreso',
        loadComponent: () => import('./presesion/presesion.component'),
        canActivate: [preventLoggedInAccessGuard],// Agregar el guard para proteger la ruta

    },
    { 
        path: 'contacto',
        loadComponent: () => import('./contacto/contacto.component')
    },
    { 
        path: 'acercade',
        loadComponent: () => import('./acercade/acercade.component')
    },
    { 
        path: 'informacionlegal',
        loadComponent: () => import('./informacionlegal/informacionlegal.component')
    },
   
] as Routes

