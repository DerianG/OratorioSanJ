import { Routes } from "@angular/router";

export default [
    {
        path: 'prinipal',
        loadComponent: () => import('./principal/principal.component'),
    },
] as Routes;