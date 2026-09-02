/**
 * Forma del contenido del mural.
 *
 * El contenido NO vive en el código: vive en `public/contenido/mural.json`
 * y se lee en caliente. Es a propósito — quien arma la campaña cambia un
 * texto o una foto y recarga el televisor, sin compilar nada ni necesitar
 * a alguien que sepa Angular.
 *
 * Estas interfaces son el contrato de ese archivo. Si se agrega un campo
 * aquí, hay que agregarlo también en `mural.json` y en el README.
 */

/** Una cifra con su etiqueta: «1.415 votos», «Puesto 2 en Chile». */
export interface Dato {
  valor: string;
  etiqueta: string;
}

/** Una foto de la galería. `pie` es opcional: si no está, no se dibuja. */
export interface Foto {
  archivo: string;
  pie?: string;
}

export interface Protagonista {
  /** Se parten en dos porque el mural los compone en dos líneas, con
      distinto peso cada una. Un solo campo obligaría a cortar por espacios
      y los apellidos compuestos quedarían mal. */
  nombre: string;
  apellidos: string;
  pais: string;
  /** Emoji de bandera. Vacío si el televisor no las dibuja bien. */
  bandera: string;
  titular: string;
  descripcion: string;
  foto: string;
  instagram?: string;
  datos: Dato[];
}

/** El bloque del QR: lo único del mural que pide una acción. */
export interface Llamado {
  titulo: string;
  bajada: string;
  url: string;
}

export interface Mural {
  campana: string;
  protagonista: Protagonista;
  galeria: Foto[];
  llamado: Llamado;
}
