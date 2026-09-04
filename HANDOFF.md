# Handoff

Estado del proyecto para retomarlo en otra máquina. El **README.md** explica
cómo funciona el mural; esto explica en qué punto quedó y qué falta.

---

## Primero, en la máquina nueva

```bash
make
```

Debería dejar el mural en http://localhost:4200 con recarga en vivo. Ya
está probado y funcionando en la máquina original — este comando y `make
tv` corrieron sin problemas.

**Antes de nada, dos archivos que no viajan por git a propósito:**

### 1. Las fotos reales

`frontend/public/contenido/fotos/*.jpg` está gitignorado adrede (ver
`.gitignore`): son material de campaña, pesado y cambia seguido, y el repo
es **público** en GitHub — no queremos los originales de Javiera dando
vueltas para siempre en el historial de un repo público.

Te mandé un zip con las 9 fotos por este mismo chat (`fotos-mural.zip`).
Descomprimilo en `frontend/public/contenido/fotos/` antes de levantar el
proyecto:

```
frontend/public/contenido/fotos/
  protagonista.jpg
  01.jpg … 08.jpg
```

`mural.json` ya apunta a esos nombres. Sin las fotos, el mural carga pero
las imágenes salen rotas.

### 2. El `.env`

También gitignorado. `make` lo crea solo (`MURAL_PORT=4200`, `TV_PORT=8080`)
si no existe. En la máquina original tuve que subir `TV_PORT` a `8090`
porque el `8080` lo tenía tomado otro proyecto sin relación (`whishlist_webserver`)
corriendo en la misma máquina. Es un problema de esa máquina, no del
proyecto: en la nueva probablemente no haga falta tocarlo. Si `make tv` te
tira `port is already allocated`, ese es el arreglo.

---

## Qué se hizo en esta sesión

- **Autoría del commit inicial corregida**: el primer commit tenía el email
  de la empresa por error; se reescribió con `--amend --reset-author`.
- **Galería → cinta continua**: [componentes/galeria.ts](frontend/src/app/features/mural/componentes/galeria.ts)
  dejó de ser rotación por ranura y ahora es un carrusel que corre en
  horizontal, lento, sin costura (lista duplicada + `translateX(-50%)`).
  Marcos en retrato (3:4) porque las fotos reales son verticales;
  `.zona-galeria` subió a `20rem` en [mural.scss](frontend/src/app/features/mural/mural.scss)
  para que el retrato tenga presencia.
- **Fotos reales cargadas**: se reemplazaron los marcadores `.svg` por las
  9 fotos de Javiera, renombradas a `01.jpg`…`08.jpg` y `protagonista.jpg`
  (elegida a mano como la mejor toma de héroe). `mural.json` actualizado.
- **[tv.html](frontend/public/tv.html)**: una copia de la misma pantalla en
  HTML/CSS/JS plano, sin Angular ni build. Existe porque el navegador de la
  TV (LG webOS) es un Chromium viejo que ignora `<script type="module">` —
  el bundle de Angular 22 le queda en pantalla azul, sin renderizar nada.
  `tv.html` usa JS estilo ES5, flexbox (no grid), sin `gap`/`min()`/
  `aspect-ratio`, con prefijos `-webkit-`. Reutiliza
  [vendor/qrcode.js](frontend/public/vendor/qrcode.js) (la misma librería
  del QR que usa la app, vendorizada). Se sirve desde el mismo nginx del
  contenedor `tv`, sin infraestructura nueva: `http://IP:8090/tv.html`.
  **Todavía no se probó en la TV real** — falta saber la versión de webOS
  para confirmar que corre.
- Todo esto ya está pusheado a `origin/main`.

---

## Lo que sigue: publicarlo sin VPS

La idea es un hosting estático (Netlify / Cloudflare Pages / Vercel, a
decidir) para tener el mural en una URL pública sin pagar servidor. El plan
que quedó conversado:

- El **código** sigue en GitHub tal cual (público, sin fotos).
- El **deploy** se sube directo desde la máquina local con el CLI del
  hosting elegido (`netlify deploy --dir=frontend/dist/mural/browser`, o
  equivalente), **sin pasar por git** — así las fotos llegan al sitio
  publicado sin quedar nunca en el historial público del repo.

Falta decidir cuál de los tres (Netlify es la sugerencia por defecto) y
armar el deploy.

---

## Pendiente de antes, todavía vigente

**Escanear el QR desde la TV real.** La URL codificada se verificó a mano
byte a byte contra lo que pinta el `<path>` del SVG — coincide. Lo que no
está probado es leerlo con un teléfono a tres metros, con el reflejo de la
sala. `llamado.url` en `mural.json`.

**Zona segura del overscan.** `--zona-segura` en
`frontend/src/styles.scss`, hoy en 2,5%. Ajustar mirando la TV real: subir
si recorta bordes, bajar si sobra marco negro.

**Cifras de `datos` en `mural.json`** («votos», «Puesto N en Chile») están
puestas a mano y quedan viejas solas. Hay una conversación aparte, ya
resuelta, sobre leerlas por scraping del sitio de OCEANMAN (es legal y
técnicamente simple — el HTML ya trae los números, `robots.txt` lo permite,
y los términos del concurso no lo prohíben) — todavía no implementado.

---

## Decisiones que conviene no deshacer sin leer el porqué

- **Tailwind 3.4 y no 4.** La v4 pide Chromium 111+; los televisores reales
  andan bastante por debajo.
- **Sin Bootstrap**: su reset pelea con el preflight de Tailwind y para una
  vista única no aporta nada, solo peso.
- **El QR se genera en el navegador**, no con una API: la TV puede estar
  sin salida a internet. Por lo mismo `tv.html` vendoriza la librería en vez
  de pedirla a un CDN.
- **El contenido se relee cada minuto** desde `mural.json` (en la app y en
  `tv.html`). Cambiás un texto o una foto y la pantalla se actualiza sola,
  sin ir a buscar el control remoto.
- **Las fotos NO van en git.** Ver arriba. No es un descuido si en un clon
  nuevo faltan: hay que traerlas aparte.

---

## Detalle de entorno que puede morder

El contenedor de desarrollo corre como el usuario `node` (uid 1000 en la
imagen Alpine). Si en la máquina nueva tu uid no es 1000, `npm install` va
a fallar por permisos dentro de `/app/node_modules`. Se arregla pasando el
uid en `docker-compose.yml`. Comprobalo con `id -u`.
