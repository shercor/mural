import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import qrcode from 'qrcode-generator';

/** Zona de silencio, en módulos. La norma pide 4: con menos, muchos
    lectores no encuentran el código contra un fondo con textura. */
const SILENCIO = 4;

/**
 * Dibuja el QR como un `<path>` de SVG, no como imagen.
 *
 * Importa que sea vectorial: el mismo mural se ve en un televisor HD y en
 * uno 2K, y un PNG escalado llega al 2K con los bordes lavados. Un lector
 * de teléfono necesita el borde del módulo nítido para decidir si es negro
 * o blanco; con el borde difuso, falla o tarda.
 *
 * Por lo mismo va `shape-rendering="crispEdges"`: sin eso el navegador
 * suaviza los bordes al escalar y se pierde justo lo que se buscaba.
 *
 * El código se genera aquí, en el navegador. Nada de una API que devuelva
 * la imagen: el televisor puede estar en una red sin salida a internet y
 * el QR tiene que aparecer igual. Quien escanea sí necesita internet, pero
 * ese es su teléfono, no el aparato.
 */
@Component({
  selector: 'app-codigo-qr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="lienzo()"
      [attr.aria-label]="'Código QR hacia ' + url()"
      role="img"
      shape-rendering="crispEdges"
      class="block h-full w-full"
    >
      <path [attr.d]="trazado()" fill="currentColor" />
    </svg>
  `,
})
export class CodigoQr {
  readonly url = input.required<string>();

  /**
   * Corrección de errores. 'M' recupera un 15% y es lo correcto aquí: el
   * código se ve limpio y sin nada encima. Subir a 'H' solo tendría sentido
   * con un logo tapando el centro, y añadiría módulos —cada uno más chico—
   * que es exactamente lo que no conviene a tres metros de distancia.
   */
  private readonly matriz = computed(() => {
    const qr = qrcode(0, 'M');
    qr.addData(this.url());
    qr.make();
    return qr;
  });

  protected readonly lienzo = computed(() => {
    const lado = this.matriz().getModuleCount() + SILENCIO * 2;
    return `${-SILENCIO} ${-SILENCIO} ${lado} ${lado}`;
  });

  /**
   * Un solo `path` con todos los módulos, en vez de un `rect` por módulo.
   * Un QR de tamaño medio son más de mil módulos: mil nodos del DOM en un
   * navegador de televisor se notan, un `path` no.
   */
  protected readonly trazado = computed(() => {
    const qr = this.matriz();
    const n = qr.getModuleCount();
    const partes: string[] = [];

    for (let fila = 0; fila < n; fila++) {
      for (let col = 0; col < n; col++) {
        if (qr.isDark(fila, col)) {
          partes.push(`M${col} ${fila}h1v1h-1z`);
        }
      }
    }

    return partes.join('');
  });
}
