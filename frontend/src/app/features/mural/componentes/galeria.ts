import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  input,
  signal,
} from '@angular/core';
import type { Foto } from '../../../core/contenido/mural.model';

/** Cada cuánto rota UNA ranura, en milisegundos. */
const INTERVALO_ROTACION = 7_000;

/**
 * Una ranura de la tira. Guarda dos fotos, no una: la que se ve y la que
 * está debajo esperando turno. El fundido es un `transition` de opacidad
 * entre ambas capas, así que las dos tienen que existir a la vez.
 */
interface Ranura {
  a: number;
  b: number;
  mostrandoA: boolean;
}

/**
 * Tira de fotos secundarias.
 *
 * Si hay más fotos que ranuras, van rotando. Rota UNA ranura por vez, por
 * turno, no todas juntas: un cambio simultáneo se lee como un corte de
 * pantalla y llama más la atención que la protagonista, que es justo lo
 * contrario de lo que tiene que hacer una tira secundaria.
 *
 * La rotación además mueve la imagen sobre el panel, que en un televisor
 * encendido ocho horas al día es lo que evita que la foto se quede marcada
 * en la pantalla.
 */
@Component({
  selector: 'app-galeria',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tira">
      @for (ranura of ranuras(); track $index) {
        <figure class="marco-foto ranura">
          <img class="capa" [src]="ruta(ranura.a)" [style.opacity]="ranura.mostrandoA ? 1 : 0" alt="" />
          <img class="capa" [src]="ruta(ranura.b)" [style.opacity]="ranura.mostrandoA ? 0 : 1" alt="" />

          @if (pie(ranura)) {
            <figcaption>{{ pie(ranura) }}</figcaption>
          }
        </figure>
      }
    </div>
  `,
  styles: `
    .tira {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      gap: 1.25rem;
      height: 100%;
    }

    .ranura {
      margin: 0;
      height: 100%;
    }

    .capa {
      position: absolute;
      inset: 0;
      height: 100%;
      width: 100%;
      object-fit: cover;
      transition: opacity 1.2s ease-in-out;
    }

    /* El pie se apoya sobre un degradado, no sobre la foto pelada: sin él,
       un texto claro sobre una ola clara desaparece. */
    figcaption {
      position: absolute;
      inset: auto 0 0 0;
      padding: 2.6rem 1.1rem 0.9rem;
      font-size: 1rem;
      line-height: 1.25;
      color: var(--color-tinta);
      background: linear-gradient(180deg, transparent, rgb(4 18 31 / 88%));
    }

    /* Por debajo de 1000px estamos en la vista de revisión, no en el
       televisor: la tira se apila para que las fotos no queden en sellos. */
    @media (max-width: 999px) {
      .tira {
        grid-auto-flow: row;
        grid-auto-rows: 14rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .capa {
        transition: none;
      }
    }
  `,
})
export class Galeria implements OnDestroy {
  readonly fotos = input.required<Foto[]>();

  /** Cuántas fotos se ven a la vez. Si hay menos, se usan las que haya. */
  readonly cupo = input(4);

  readonly ranuras = signal<Ranura[]>([]);

  /** Ranura a la que le toca cambiar. Avanza de a una, por turno. */
  private turno = 0;

  /** Por dónde va el recorrido de las fotos de reserva. */
  private cursor = 0;

  private reloj?: ReturnType<typeof setInterval>;

  constructor() {
    effect(() => {
      const fotos = this.fotos();
      this.detener();

      const visibles = Math.min(this.cupo(), fotos.length);
      this.ranuras.set(
        Array.from({ length: visibles }, (_, i) => ({ a: i, b: i, mostrandoA: true })),
      );

      this.turno = 0;
      // Arranca justo antes de la primera foto de reserva, para que la
      // primera rotación traiga una imagen que todavía no se vio.
      this.cursor = visibles - 1;

      // Sin fotos de sobra no hay nada que rotar: se dejan quietas en vez de
      // fundir una imagen contra sí misma, que se ve como un parpadeo.
      if (fotos.length <= visibles) {
        return;
      }

      this.precargar(fotos);
      this.reloj = setInterval(() => this.rotar(), INTERVALO_ROTACION);
    });
  }

  ngOnDestroy(): void {
    this.detener();
  }

  protected ruta(indice: number): string {
    return this.fotos()[indice]?.archivo ?? '';
  }

  protected pie(ranura: Ranura): string {
    return this.fotos()[ranura.mostrandoA ? ranura.a : ranura.b]?.pie ?? '';
  }

  /**
   * El fundido cambia la opacidad de una capa cuya imagen quizá el navegador
   * todavía no bajó, y ahí se vería el panel vacío por debajo. Pedirlas todas
   * al arrancar cuesta una vez y elimina el problema para siempre.
   */
  private precargar(fotos: Foto[]): void {
    for (const foto of fotos) {
      new Image().src = foto.archivo;
    }
  }

  private rotar(): void {
    const total = this.fotos().length;
    const ranuras = this.ranuras();

    if (!ranuras.length || total <= ranuras.length) {
      return;
    }

    const entrante = this.siguienteNoVisible(ranuras, total);
    const turno = this.turno;

    this.ranuras.update((actuales) =>
      actuales.map((ranura, i) => {
        if (i !== turno) {
          return ranura;
        }

        // La foto entrante se carga en la capa que ahora mismo está oculta,
        // y recién después se invierte la opacidad. Al revés se vería el
        // salto de imagen antes del fundido.
        return ranura.mostrandoA
          ? { ...ranura, b: entrante, mostrandoA: false }
          : { ...ranura, a: entrante, mostrandoA: true };
      }),
    );

    this.turno = (turno + 1) % ranuras.length;
  }

  /**
   * La siguiente foto que no esté ya puesta en otra ranura.
   *
   * Sin este filtro, con seis fotos en cuatro ranuras el recorrido termina
   * dejando la misma imagen dos veces en la tira. En pantalla se lee como un
   * error de carga, no como una repetición intencional.
   */
  private siguienteNoVisible(ranuras: Ranura[], total: number): number {
    const visibles = new Set(ranuras.map((r) => (r.mostrandoA ? r.a : r.b)));

    for (let intento = 0; intento < total; intento++) {
      this.cursor = (this.cursor + 1) % total;
      if (!visibles.has(this.cursor)) {
        return this.cursor;
      }
    }

    return this.cursor;
  }

  private detener(): void {
    if (this.reloj) {
      clearInterval(this.reloj);
      this.reloj = undefined;
    }
  }
}
