import { Routes } from "@angular/router";



export default [
    {
        path: 'userForm',
        loadComponent: () => import('./formularios/formulariousuarios/formulariousuarios.component'),
        
    },  
   
   
   
] as Routes;
