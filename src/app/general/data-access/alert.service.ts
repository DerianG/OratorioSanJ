import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
    alerta: {
      message: string;
      class: string;
      tipo: string;
      accionConfirmada: () => void;
      accionCancelada: () => void;
      esConfirmacion: boolean;
    } = {
      message: '',
      class: '',
      tipo: '',
      accionConfirmada: () => {},
      accionCancelada: () => {},
      esConfirmacion: false,
    };
  
    constructor() {}
  
    // Mostrar alerta
    mostrarAlerta(
      message: string,
      alertClass: string,
      tipo: string,
      esConfirmacion: boolean = false,
      accionConfirmada: () => void = () => {},
      accionCancelada: () => void = () => {}
    ): void {
      this.alerta.message = message;
      this.alerta.class = `alert-${alertClass}`;  // 'alert-danger', 'alert-success', 'alert-warning'
      this.alerta.tipo = tipo;
      this.alerta.esConfirmacion = esConfirmacion;
      this.alerta.accionConfirmada = accionConfirmada;
      this.alerta.accionCancelada = accionCancelada;
  
      // Ocultar la alerta después de 5 segundos si no es de confirmación
      if (!esConfirmacion) {
        setTimeout(() => {
          this.ocultarAlerta();
        }, 5000); // Se oculta después de 5 segundos
      }
    }
  
    // Confirmar acción
    confirmarAccion(): void {
      if (this.alerta.accionConfirmada) {
        this.alerta.accionConfirmada();
      }
      this.ocultarAlerta();
    }
  
    // Cancelar acción
    cancelarAccion(): void {
      if (this.alerta.accionCancelada) {
        this.alerta.accionCancelada();
      }
      this.ocultarAlerta();
    }
  
    // Ocultar la alerta
    ocultarAlerta(): void {
      this.alerta.message = '';
      this.alerta.accionConfirmada = () => {}; // Reiniciar las funciones
      this.alerta.accionCancelada = () => {};  // Reiniciar las funciones
      this.alerta.esConfirmacion = false;  // Resetear el flag
    }
  }
  