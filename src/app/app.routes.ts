import { Routes } from '@angular/router';

import NopaginaComponent from './informacion/muestra/nopagina/nopagina.component';
import PrincipalComponent from './informacion/muestra/principal/principal.component';
import { authLoginGuards } from './general/core/loginGuard/login-guards.guard';


export const routes: Routes = [
    {
        path:'',
        component:PrincipalComponent
    },
    {
        path: 'info',
        loadChildren: () => import('./informacion/muestra/muestra.routes')
    },
    {
        path:'auths',
        loadChildren: () => import('./auths/features/auths.routes'),
    },
    {
        path:'Users',
        loadChildren: () => import('./usuarios/users.routes'),
        canActivate: [authLoginGuards],
    },
    {
        path: '',
        redirectTo:'inicio',
        pathMatch:'full'
    },
    {
        path:'**',
        component:NopaginaComponent,
    },
];
