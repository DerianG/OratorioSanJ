import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes'; // Ajusta si tienes rutas personalizadas
import { initializeApp, provideFirebaseApp } from '@angular/fire/app'; // de @angular/fire
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: 'AIzaSyAuseXSclPZMgdh-y5kUYZ687ejJdPOKgQ',
        authDomain: 'oratorio-san-jose.firebaseapp.com',
        projectId: 'oratorio-san-jose',
        storageBucket: 'oratorio-san-jose.appspot.com',
        messagingSenderId: '731229351613',
        appId: '1:731229351613:web:7e226c0413f8e7c74651d4',
        measurementId: 'G-NN2SYMYMMF'
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ],
};
