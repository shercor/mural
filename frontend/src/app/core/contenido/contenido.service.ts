import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { Mural } from './mural.model';

/** Cada cuánto se vuelve a leer el mural.json, en milisegundos. */
const INTERVALO_REFRESCO = 60_000;

/**
 * Lee el contenido del mural desde `public/contenido/mural.json`.
 *
 * Relee cada minuto a propósito. El mural vive en un televisor que nadie
 * toca: si para cambiar un texto hubiera que ir a buscar el control remoto
 * y recargar la página, en la práctica no se cambiaría nunca. Así, quien
 * edita el JSON ve el cambio en pantalla solo.
 *
 * El coste es un GET de unos pocos kB por minuto contra el mismo nginx que
 * ya sirve la página, así que no hay nada que optimizar aquí.
 */
@Injectable({ providedIn: 'root' })
export class ContenidoService {
  private readonly http = inject(HttpClient);

  readonly mural = signal<Mural | null>(null);
  readonly error = signal<string | null>(null);

  private ultimoCrudo = '';

  iniciar(): void {
    this.leer();
    setInterval(() => this.leer(), INTERVALO_REFRESCO);
  }

  private leer(): void {
    // `responseType: text` y no json: se compara el crudo contra la lectura
    // anterior para no reemplazar la señal cuando el archivo no cambió. Sin
    // esa comparación, cada minuto se emitiría un objeto nuevo, Angular
    // volvería a pintar las fotos y el televisor parpadearía.
    this.http
      .get('contenido/mural.json', { responseType: 'text' })
      .subscribe({
        next: (crudo) => {
          if (crudo === this.ultimoCrudo) {
            return;
          }

          try {
            this.mural.set(JSON.parse(crudo) as Mural);
            this.ultimoCrudo = crudo;
            this.error.set(null);
          } catch {
            // Un JSON mal formado no puede dejar el televisor en blanco: si
            // ya había contenido bueno en pantalla, ese se queda.
            this.error.set('El archivo contenido/mural.json tiene un error de sintaxis.');
          }
        },
        error: () => {
          this.error.set('No se pudo leer contenido/mural.json.');
        },
      });
  }
}
