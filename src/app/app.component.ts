import { Component,inject,OnInit } from '@angular/core';
import { AuthService } from './general/data-access/auth.service';
import { RouterOutlet,RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';  

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
  
})
export class AppComponent implements OnInit{
  
  user: any = null;
  userRole: string = '';
  isLoggedIn: boolean = false;
  subscription: Subscription = new Subscription();

  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Suscribirse al estado de autenticación
    this.subscription = this.authService.authState$.subscribe(user => {
      this.user = user;
      this.isLoggedIn = !!user;  // Verificar si el usuario está logueado
      this.userRole = user ? user.role : '';  // Obtener el rol del usuario
    });
  }

  // Método para cerrar sesión
  logout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['']);  // Redirigir al home o página deseada después de cerrar sesión
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();  // Limpiar la suscripción cuando el componente se destruye
  }
}