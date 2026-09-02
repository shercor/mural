import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { ContenidoService } from './core/contenido/contenido.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),

    // La lectura del contenido arranca con la aplicación, no cuando se pinta
    // el mural. La primera pasada no se espera a propósito: si el JSON está
    // mal o falta, el mural tiene que arrancar igual y decirlo en pantalla,
    // no quedarse en negro. Un televisor no tiene consola donde mirar.
    provideAppInitializer(() => inject(ContenidoService).iniciar()),
  ],
};
