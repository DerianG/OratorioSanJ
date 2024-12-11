import { Routes } from '@angular/router';

import NopaginaComponent from './informacion/muestra/nopagina/nopagina.component';
import PrincipalComponent from './home/inicio/principal/principal.component';


export const routes: Routes = [
    {
        path:'',
        component:PrincipalComponent
    },
    {
        path: 'home',
        loadChildren: () => import('./home/inicio/home.routes')
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
        path: '',
        redirectTo:'inicio',
        pathMatch:'full'
    },
    {
        path:'**',
        component:NopaginaComponent,
    },
];
