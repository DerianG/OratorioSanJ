import { Component,inject,OnInit } from '@angular/core';
import { AuthService } from './general/data-access/auth.service';
import { DatosFireService } from './general/data-access/datos-fire.service';
import { RouterOutlet,RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';  
import { Timestamp } from 'firebase/firestore';
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
  private datosService = inject(DatosFireService)
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Suscribirse al estado de autenticación
    this.subscription = this.authService.authState$.subscribe(user => {
      this.user = user;
      this.isLoggedIn = !!user;  // Verificar si el usuario está logueado
      this.userRole = user ? user.role : '';  // Obtener el rol del usuario
    });

    this.datosService.getPeriodosActivos().then(periodos => {
      console.log('Períodos activos:', periodos);  // Verifica que obtienes los períodos correctos
    
      periodos.forEach(periodo => {
        // Convierte el Timestamp de Firestore a Date
        const fechaFin: Date = periodo.fechaFin.toDate();
        console.log('Fecha fin original:', fechaFin);
    
        // Sumar un día a fechaFin para determinar el "día siguiente"
        const diaSiguiente = new Date(fechaFin);
        diaSiguiente.setDate(fechaFin.getDate() + 1); // Incrementa en un día
    
        // Define la fecha actual (en tu caso, fija para pruebas)
        const fechaActual: Date = new Date(); 
    
        // Remueve la hora para comparar solo las fechas
        const fechaActualSinHora = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
        const diaSiguienteSinHora = new Date(diaSiguiente.getFullYear(), diaSiguiente.getMonth(), diaSiguiente.getDate());
        console.log('Fechas para comparación:', { diaSiguienteSinHora, fechaActualSinHora });
    
        // Comparar: solo actualiza si es el día siguiente o posterior
        if (fechaActualSinHora >= diaSiguienteSinHora) {
          console.log(`Actualizando período ${periodo.id} a "finalizado"`);
          this.datosService.actualizarPeriodo(periodo.id, { ...periodo, estado: 'finalizado' });
        }
      });
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