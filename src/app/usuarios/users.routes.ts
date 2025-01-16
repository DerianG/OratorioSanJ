import { Routes } from "@angular/router";
import { adminGuard, PadresGuard, ProfesorGuard, SecretarioGuard } from "../general/core/rolGuard/roldguards.guard";


export default [
    {
        path: 'Administrador',
        loadComponent: () => import('./AdminG/panel/panel.component'),
        canActivate: [adminGuard]
    },
    {
        path: 'Secretario',
        loadComponent: () => import('./secretaria/panel/panel.component'),
        canActivate: [SecretarioGuard]
    },
    {
        path: 'Profesores',
        loadComponent: () => import('./profesor/panel/panel.component'),
        canActivate: [ProfesorGuard]
    },
    {
        path: 'Padres',
        loadComponent: () => import('./padres/panel/panel.component'),
        canActivate: [PadresGuard]
    },
   
   
] as Routes;
