import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Foto } from '../../../core/contenido/mural.model';

/**
 * Cuántos segundos tarda una foto en recorrer su propio ancho. Es el único
 * mando de velocidad: más alto, la cinta va más lenta; más bajo, más rápida.
 * La vuelta completa se calcula a partir de esto y de cuántas fotos haya, así
 * que el ritmo por foto no cambia aunque se agreguen o quiten fotos del
 * `mural.json`.
 */
const SEGUNDOS_POR_FOTO = 6;

/**
 * Mínimo de diapositivas en media cinta. Con pocas fotos (3, 4) la cinta no
 * alcanza a cubrir el ancho del panel y se vería un hueco dando vueltas. Se
 * repite la lista hasta llegar a este número antes de duplicarla para el bucle.
 */
const MIN_DIAPOS = 8;

/**
 * Cinta de fotos secundarias.
 *
 * Corre de derecha a izquierda, lento y a ritmo constante, y da la vuelta sin
 * costura: la cinta es una lista de fotos repetida dos veces, y la animación
 * la desplaza exactamente media cinta. Al llegar a la mitad, lo que se ve es
 * idéntico al fotograma inicial, así que el salto de vuelta a cero no se nota.
 *
 * Solo se anima `transform`, que va por GPU en todos los navegadores de TV.
 * El movimiento continuo, además, es lo que evita que ocho horas diarias del
 * mismo encuadre queden marcadas en el panel del televisor.
 *
 * Rota UNA cosa —la cinta entera, despacio—, no cada foto por su cuenta: un
 * cambio por foto se lee como parpadeo y le roba atención a la protagonista,
 * que es lo contrario de lo que tiene que hacer una zona secundaria.
 */
@Component({
  selector: 'app-galeria',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="marco">
      <div class="pista" [style.animation-duration.s]="duracion()">
        @for (foto of cinta(); track $index) {
          <figure class="marco-foto diapo" [attr.aria-hidden]="$index >= media() ? 'true' : null">
            <img [src]="foto.archivo" alt="" />

            @if (foto.pie) {
              <figcaption>{{ foto.pie }}</figcaption>
            }
          </figure>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    /* Ventana fija: la cinta corre por debajo y solo se ve lo que cabe. */
    .marco {
      position: relative;
      height: 100%;
      overflow: hidden;
    }

    .pista {
      display: flex;
      width: max-content;
      height: 100%;
      /* La duración real la pone el binding; este valor es solo el respaldo
         por si el estilo en línea no llega. 'linear' para que no haya
         acelerón ni frenada: una cinta que cambia de ritmo llama la
         atención, y esta es la zona secundaria. */
      animation: correr 60s linear infinite;
      will-change: transform;
    }

    @keyframes correr {
      from { transform: translate3d(0, 0, 0); }
      /* -50% = media cinta exacta, porque las dos mitades son idénticas y
         cada diapo —incluida la última— lleva el mismo margen a la derecha. */
      to   { transform: translate3d(-50%, 0, 0); }
    }

    /* Retrato: las fotos las saca gente con el teléfono en vertical. El
       marco es 3:4 y 'cover' recorta lo que sobre; una foto horizontal
       entra igual, centrada, perdiendo los costados. */
    .diapo {
      flex: 0 0 auto;
      height: 100%;
      aspect-ratio: 3 / 4;
      /* Margen, no 'gap': el 'gap' de flex no se pone después del último
         hijo, y sin ese hueco final la costura del bucle quedaría más
         apretada que el resto y se notaría un tironcito cada vuelta. */
      margin: 0 1.25rem 0 0;
    }

    /* Respaldo para televisores sin 'aspect-ratio' (Chromium < 88): sin un
       ancho explícito la diapo colapsa —la imagen va posicionada absoluta—
       y la cinta desaparece. 15rem = 20rem de alto en proporción 3:4. */
    @supports not (aspect-ratio: 1) {
      .diapo {
        width: 15rem;
      }
    }

    /* El pie se apoya sobre un degradado, no sobre la foto pelada: sin él,
       un texto claro sobre una ola clara desaparece. */
    .diapo figcaption {
      position: absolute;
      inset: auto 0 0 0;
      padding: 2.6rem 1.1rem 0.9rem;
      font-size: 1rem;
      line-height: 1.25;
      color: var(--color-tinta);
      background: linear-gradient(180deg, transparent, rgb(4 18 31 / 88%));
    }

    /* Por debajo de 1000px es la vista de revisión, no el televisor: la
       cinta se detiene y las fotos se apilan para no quedar en sellos. */
    @media (max-width: 999px) {
      .marco {
        overflow: visible;
      }

      .pista {
        width: auto;
        height: auto;
        flex-wrap: wrap;
        gap: 1.25rem;
        animation: none;
        transform: none;
      }

      .diapo {
        width: 100%;
        max-width: 20rem;
        height: auto;
        aspect-ratio: 3 / 4;
        margin: 0 auto;
      }
    }

    /* Quien pidió menos movimiento no quiere ver una cinta que corre. Se
       congela; las primeras fotos quedan a la vista y el resto espera fuera
       de cuadro. El mural sigue completo y legible. */
    @media (prefers-reduced-motion: reduce) {
      .pista {
        animation: none;
      }
    }
  `,
})
export class Galeria {
  readonly fotos = input.required<Foto[]>();

  /**
   * Media cinta: la lista de fotos repetida hasta llegar a MIN_DIAPOS. Con 12
   * o más fotos es la lista tal cual; con menos, se repite para que no queden
   * huecos.
   */
  private readonly base = computed<Foto[]>(() => {
    const fotos = this.fotos();
    if (!fotos.length) {
      return [];
    }

    const objetivo = Math.max(MIN_DIAPOS, fotos.length);
    const base: Foto[] = [];
    while (base.length < objetivo) {
      base.push(...fotos);
    }
    return base;
  });

  /** Dónde termina la primera mitad de la cinta. La segunda es su copia y va
      marcada `aria-hidden` para no repetirle los pies al lector de pantalla. */
  protected readonly media = computed(() => this.base().length);

  /** La cinta completa: media cinta más su copia, pegadas. */
  protected readonly cinta = computed<Foto[]>(() => {
    const base = this.base();
    return base.length ? [...base, ...base] : [];
  });

  /** Segundos de una vuelta entera. Escala con la cantidad de fotos para que
      cada una pase a la misma velocidad, haya 4 o haya 12. */
  protected readonly duracion = computed(() => this.base().length * SEGUNDOS_POR_FOTO);
}
