import { Component,inject,OnInit,HostListener } from '@angular/core';
import { AuthService } from './general/data-access/auth.service';
import { DatosFireService } from './general/data-access/datos-fire.service';
import { AlertService } from './general/data-access/alert.service';
import { RouterOutlet,RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';  
import { Timestamp } from 'firebase/firestore';
import { Subscription } from 'rxjs';
import { AlertasComponent } from './general/utils/alertas/alertas.component';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, AlertasComponent],
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
  showButton: boolean = true; // Para controlar la visibilidad del botón
  private scrollTimeout: any; // Para almacenar el temporizador


  constructor(  
     public alertaService: AlertService,
     private viewportScroller: ViewportScroller,
    ) {
    // Verificar si el usuario ya está logueado, en ese caso redirigirlo
    
  }
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
      this.mostrarAlertaDeExito(`sesion cerrada`)
      setTimeout(() => {
        this.router.navigate(['']);  // Redirige a la página de dashboard
      }, 1000); // Se oculta después de 5 segundos
     
     
      this.router.navigate(['']);  // Redirigir al home o página deseada después de cerrar sesión
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();  // Limpiar la suscripción cuando el componente se destruye
  }

  mostrarAlertaDeAdvertencia(mensaje:string): void {
    this.alertaService.mostrarAlerta(
      mensaje,
      'warning',  // Tipo de alerta: 'danger', 'success', 'warning', etc.
      'Advertencia: ',
      false // No es una alerta de confirmación
    );
  }

  mostrarAlertaDeExito(mensaje:string): void {
    this.alertaService.mostrarAlerta(
      mensaje,
      'success',  // Tipo de alerta de éxito
      'Éxito: ',
      false // No es una alerta de confirmación
    );
  }

  mostrarAlertaDeError(mensaje:string): void {
    this.alertaService.mostrarAlerta(
      mensaje,
      'danger',  // Tipo de alerta de error
      'Error: ',
      false // No es una alerta de confirmación
    );
  }

  mostrarAlertaDeConfirmacion(mensaje: string): void {
    this.alertaService.mostrarAlerta(
      mensaje,
      'danger',  // Tipo de alerta: 'danger', 'success', 'warning', etc.
      'Confirmación: ',
      true, // Es una alerta de confirmación
      () => {
        console.log('Acción confirmada');
        // Realiza la acción de eliminación aquí
      },
      () => {
        console.log('Acción cancelada');
        // Acción de cancelación
      }
    );
  }

  scrollToTop() {
    this.viewportScroller.scrollToPosition([0, 0]); // Mueve la página al inicio
  }

 onWindowScroll() {
    // Ocultar botón mientras el usuario está desplazándose
    this.showButton = false;

    // Limpiar el timeout anterior si sigue activo
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Establecer un nuevo timeout para volver a mostrar el botón después de 500ms
    this.scrollTimeout = setTimeout(() => {
      this.showButton = true;
    }, 500);
  }


}