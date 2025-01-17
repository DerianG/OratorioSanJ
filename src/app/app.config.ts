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
        apiKey: "AIzaSyDJKjgu3GkmLT0DRCzSmZnmz2eX8Wc2CyQ",
        authDomain: "oratorio-san-jose-4bb01.firebaseapp.com",
        projectId: "oratorio-san-jose-4bb01",
        storageBucket: "oratorio-san-jose-4bb01.firebasestorage.app",
        messagingSenderId: "981771657103",
        appId: "1:981771657103:web:c197d634f879affb3075fa",
  
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
   // provideFunctions(() => getFunctions()), // Agrega soporte para Cloud Functions
   
  ],
};
