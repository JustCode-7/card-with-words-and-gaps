import {ApplicationConfig, isDevMode} from '@angular/core';
import {provideRouter, withComponentInputBinding, withHashLocation} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient} from "@angular/common/http";
import {provideAnimations} from "@angular/platform-browser/animations";
import {provideServiceWorker} from '@angular/service-worker';
import {environment} from "../environments/environment";

import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {getDatabase, provideDatabase} from '@angular/fire/database';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withHashLocation()),
    provideAnimations(),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerImmediately'
    }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // Realtime Database bereitstellen
    provideDatabase(() => getDatabase())
  ]
};
