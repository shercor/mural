# Mural

Muro publicitario para televisor. La primera etapa es una sola vista a
pantalla completa: una protagonista, sus fotos, su historia y un QR grande
que lleva a votar por ella.

Está pensado para quedar encendido en un televisor durante horas, y ese
destino manda sobre casi todas las decisiones que hay más abajo.

---

## Puesta en marcha

Requiere Docker y Docker Compose. No hace falta Node ni npm en la máquina.

```bash
make
```

Eso crea el `.env`, construye la imagen, instala las dependencias y deja el
mural en **http://localhost:4200** con recarga en vivo.

`make help` lista el resto.

> **Estado.** El mural está terminado y verificado en el navegador (ver
> `HANDOFF.md`), pero `make up` y `make tv` **no se pudieron ejecutar de punta
> a punta**: la máquina donde se creó tenía el disco al 100%. Es lo primero
> que hay que comprobar al retomarlo.

---

## Ponerlo en el televisor

```bash
make tv
```

Compila el mural y lo sirve por nginx, sin sourcemaps ni websocket de
recarga. El comando imprime la dirección exacta que hay que escribir en el
navegador del televisor, del tipo `http://192.168.1.42:8080`.

**`localhost` no sirve**: desde el televisor, `localhost` es el televisor.
Hay que usar la IP de esta máquina, y las dos tienen que estar en la misma
red.

### Si se ve recortado por los bordes

Muchos televisores recortan entre un 2% y un 5% de cada borde (*overscan*).
El mural ya reserva un margen para eso. Se ajusta en un solo lugar,
`frontend/src/styles.scss`:

```scss
--zona-segura: 2.5%;   /* súbelo si se recorta, bájalo si sobra marco */
```

---

## Cambiar el contenido

No hay que tocar código ni recompilar nada.

| Qué | Dónde |
|-----|-------|
| Textos, cifras, URL del QR | `frontend/public/contenido/mural.json` |
| Fotos | `frontend/public/contenido/fotos/` |

El mural **relee el JSON cada minuto solo**. Se edita el archivo y el
televisor se actualiza sin que nadie vaya a buscar el control remoto.

Las fotos de ejemplo son marcadores `.svg` que dicen «reemplaza esta foto».
Se dejan las reales en esa carpeta y se apuntan desde el JSON.

**Formato de las fotos**

- Protagonista: vertical, proporción 3:4, mínimo 900 × 1200 px.
- Galería: horizontal, 4:3, mínimo 800 × 600 px.
- JPG o WebP. Nada de AVIF: el soporte en televisores es irregular.

El recorte lo resuelve el marco (`object-fit: cover`), así que una foto con
otra proporción no se deforma, pero sí se le recortan los bordes: conviene
que la cara no quede pegada al canto.

**Si hay más fotos que ranuras en la galería**, van rotando de a una, con un
fundido. Eso además mueve la imagen sobre el panel, que es lo que evita que
ocho horas del mismo encuadre queden marcadas en la pantalla.

Si el JSON queda mal escrito, el mural **no se queda en negro**: mantiene lo
último que sí cargó y, si nunca cargó nada, dice en pantalla qué archivo hay
que arreglar. Un televisor no tiene consola donde mirar el error.

---

## Compatibilidad con televisores

Es la restricción que más decisiones cerró, así que conviene tenerla escrita.

Los navegadores de los Smart TV van años por detrás del escritorio:

| Televisor | Motor aproximado |
|-----------|------------------|
| LG webOS 23 | Chromium 94 |
| Samsung Tizen 2023 | Chromium 108 |
| Samsung Tizen 2024 | Chromium 116 |
| Chromecast / Fire TV / mini-PC | Chrome al día |

De ahí salen tres decisiones:

**Tailwind 3.4, no Tailwind 4.** La v4 se apoya en `@property` y
`color-mix()`, que piden Chromium 111+. Con la v4 el mural se rompería justo
en un televisor reciente. Es la única diferencia deliberada respecto de
`evaluacion-persona-frontend`, que sí usa la 4 porque corre en escritorio.

**Sin Bootstrap.** Su reset pelea con el preflight de Tailwind y para una
vista única a pantalla completa no aporta componentes, solo peso.

**El bundle se rebaja a Chromium 80** vía el `browserslist` de
`frontend/package.json`. Angular avisa en cada compilación que esos
navegadores quedan fuera de su soporte oficial; el aviso es correcto y está
asumido a propósito. El código sí se transpila a esa sintaxis.

El mural también evita `filter: blur()` a pantalla completa (caro y a
tirones en varios modelos) y trae un respaldo para televisores sin
`aspect-ratio`, que es lo que sostiene la tarjeta del QR.

---

## El QR

Se genera en el navegador con `qrcode-generator`, no con una API externa: el
televisor puede estar en una red sin salida a internet y el código tiene que
aparecer igual. Quien escanea sí necesita internet, pero eso es su teléfono.

Se dibuja como `<path>` de SVG, no como imagen, para que llegue nítido tanto
a un televisor HD como a uno 2K. Un lector de teléfono necesita el borde del
módulo definido; con el borde lavado por el escalado, falla o tarda.

**El tamaño no es decorativo.** En un televisor de 55" a FullHD ocupa unos
25 cm reales, que es lo que hace falta para escanear desde tres metros.
Achicar ese bloque es la forma más rápida de que el mural deje de cumplir su
función.

Para cambiar el destino se edita `llamado.url` en el JSON. `make url`
muestra a dónde apunta ahora. Después de cambiarlo, **escanéalo con un
teléfono de verdad** antes de dejarlo puesto.

---

## Resoluciones

El mural se diseñó sobre un lienzo de 1920 × 1080 y se escala entero. No hay
tres maquetaciones: hay una, medida en `rem`, y el `rem` cambia con la
pantalla (`frontend/src/styles.scss`).

| Pantalla | 1 rem | Resultado |
|----------|-------|-----------|
| 1366 × 768 (HD) | 11,4 px | el mismo diseño, más chico |
| 1920 × 1080 (FullHD) | 16 px | escala 1:1 |
| 2560 × 1440 (2K) | 21,3 px | el mismo diseño, más grande |

Medido en las tres: no hay desbordamiento ni barras de desplazamiento.

Por debajo de 1000 px de ancho el lienzo fijo deja de tener sentido, así que
la vista se apila y se desplaza. Eso no es el destino del mural: es cómo se
revisa desde un portátil o un teléfono mientras se trabaja.

---

## Estructura

```
docker/angular/        Dockerfile (dev · build · prod) y config de nginx
docker-compose.yml     servicio `mural` (desarrollo) y `tv` (compilado)
Makefile               atajos; `make` a secas levanta todo

frontend/
  public/contenido/    EL CONTENIDO: mural.json y las fotos
  src/styles.scss      sistema visual: paleta, tipografías y el escalado
  src/app/
    core/contenido/    lectura del mural.json
    features/mural/    la vista y sus componentes (QR, galería)
```

---

## Lo que viene

Hoy hay un solo mural, pero el router ya está puesto: la segunda pantalla
entra como otra ruta sin replantear el arranque. Cuando el muro tenga varias
protagonistas, lo que hay que agregar es el recorrido entre ellas y,
probablemente, un backend que reemplace al `mural.json`.
