import { Routes } from "@angular/router";
import RegistroComponent from "./registro/registro.component";

export default [
    {
        path: 'actividades',
        loadComponent: () => import('./actividades/actividades.component')
    },
    {
        path: 'nofound',
        loadComponent: () => import('./nopagina/nopagina.component')
    },
    {
        path: 'ingreso',
        loadComponent: () => import('./presesion/presesion.component')
    },
   { 
        path: 'registro',
        component:RegistroComponent,
    },
    { 
        path: 'contacto',
        loadComponent: () => import('./contacto/contacto.component')
    },
] as Routes;
