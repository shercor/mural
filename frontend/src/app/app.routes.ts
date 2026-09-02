import { Routes } from '@angular/router';

/**
 * Hoy hay un solo mural. El router está desde el principio porque la idea
 * es que el muro crezca: la segunda pantalla entra como otra ruta, sin
 * tener que replantear el arranque de la aplicación.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/mural/mural').then((m) => m.Mural),
  },
  { path: '**', redirectTo: '' },
];
