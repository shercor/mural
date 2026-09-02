import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ContenidoService } from '../../core/contenido/contenido.service';
import { CodigoQr } from './componentes/codigo-qr';
import { Galeria } from './componentes/galeria';

@Component({
  selector: 'app-mural',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodigoQr, Galeria],
  templateUrl: './mural.html',
  styleUrl: './mural.scss',
})
export class Mural {
  private readonly contenido = inject(ContenidoService);

  protected readonly mural = this.contenido.mural;
  protected readonly error = this.contenido.error;

  /**
   * La URL sin `https://` ni la barra final.
   *
   * Debajo del QR va escrita para quien no logre escanear —el reflejo del
   * televisor, una cámara vieja, un teléfono sin batería—, y ahí lo que
   * importa es que se pueda teclear. El esquema no aporta nada a eso y sí
   * gasta ancho, que es lo escaso.
   */
  protected readonly urlLegible = computed(() =>
    (this.mural()?.llamado.url ?? '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
  );
}
