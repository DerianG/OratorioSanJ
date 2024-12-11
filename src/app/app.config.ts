import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'oratorio-san-jose',
        appId: '1:731229351613:web:7e226c0413f8e7c74651d4',
        storageBucket: 'oratorio-san-jose.firebasestorage.app',
        apiKey: 'AIzaSyAuseXSclPZMgdh-y5kUYZ687ejJdPOKgQ',
        authDomain: 'oratorio-san-jose.firebaseapp.com',
        messagingSenderId: '731229351613',
        measurementId: 'G-NN2SYMYMMF',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
  ],
};
