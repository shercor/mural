/**
 * Tailwind 3.4 a propósito, no la 4.
 *
 * La v4 se apoya en `@property` y `color-mix()`, que piden Chromium 111+.
 * Los navegadores de los Smart TV van muy por detrás: webOS 23 ronda
 * Chromium 94 y Tizen 2023 el 108. Con la v4 el mural se rompería justo
 * en el aparato para el que está hecho.
 *
 * Los colores y tipografías no se declaran aquí sino como variables CSS en
 * `src/styles.scss`, y aquí solo se referencian. Así el tema se toca en un
 * solo archivo y las utilidades de Tailwind siguen funcionando sobre él.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        abismo: 'var(--color-abismo)',
        marea: 'var(--color-marea)',
        espuma: 'var(--color-espuma)',
        tinta: 'var(--color-tinta)',
        'tinta-2': 'var(--color-tinta-2)',
        'tinta-3': 'var(--color-tinta-3)',
        acento: 'var(--color-acento)',
        'acento-tinta': 'var(--color-acento-tinta)',
        agua: 'var(--color-agua)',
        borde: 'var(--color-borde)',
      },
      fontFamily: {
        titulo: 'var(--fuente-titulo)',
        cuerpo: 'var(--fuente-cuerpo)',
      },
      borderRadius: {
        panel: 'var(--radio-panel)',
        pieza: 'var(--radio-pieza)',
      },
    },
  },
  plugins: [],
};
