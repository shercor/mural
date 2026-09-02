# Handoff

Estado del proyecto al cerrar la primera sesión, para retomarlo en otra
máquina. El **README.md** explica cómo funciona el mural; esto explica en
qué punto quedó y qué falta.

---

## Lo primero, en la máquina nueva

```bash
make
```

Debería dejar el mural en http://localhost:4200. **Ese comando nunca se pudo
ejecutar**: la máquina donde se escribió el proyecto tenía el disco al 100%
(279 MB libres de 226 GB) y Docker no podía ni instalar dependencias.

Todo lo demás sí está verificado, pero el camino de Docker está sin probar.
Si algo falla, es el primer sospechoso.

Comprueba también `make tv`, que es el que compila y sirve el mural para el
televisor.

---

## Qué se verificó y cómo

No es «se ve bien en una captura»: son medidas.

**El bundle compila.** 240 kB en crudo, 67 kB transferidos. Angular imprime
un aviso de navegadores no soportados en cada compilación — es esperado y
está explicado en el README, sección *Compatibilidad con televisores*. No es
un error que haya que arreglar.

**La maquetación cabe en las tres resoluciones.** Medido en Chrome sobre el
bundle compilado, no a ojo:

| Pantalla | 1 rem | `scrollHeight` vs `innerHeight` |
|----------|-------|--------------------------------|
| 1366 × 768 | 10,09 px | 681 = 681 |
| 1920 × 1080 | 14,71 px | 993 = 993 |
| 2560 × 1440 | 20,04 px | 1353 = 1353 |

Sin desbordamiento vertical ni horizontal en ninguna. (Chrome headless
recorta 87 px de alto respecto de `--window-size`, de ahí que las alturas no
sean 768/1080/1440. El escalado por `min()` reaccionó correctamente a esa
altura menor, que es justamente la prueba de que se adapta.)

**Los controles de una fila miden igual.** Las tres piezas del encabezado
—los dos datos y el Instagram— dieron `alto=47.8 top=641.0 radio=11.03px
fuente=14.71px`, idénticas. El alto sale de un token, `--alto-pieza`, no de
un número repetido en cada regla.

**El QR codifica la URL correcta.** Esto se verificó de punta a punta, que
era lo que más importaba: un QR equivocado falla en silencio y nadie lo nota
hasta que alguien se queja de que el enlace no lleva a ninguna parte.

1. Se extrajo el atributo `d` del `<path>` que el navegador realmente pintó.
2. Se comparó módulo por módulo contra la matriz que produce la librería:
   coinciden exactamente (descarta transposiciones y errores de índice en el
   componente).
3. Se decodificó esa matriz a mano hasta recuperar el texto:

```
módulos 37x37 -> versión 5, 708 módulos oscuros
modo=0100 (byte)  largo=65 bytes
URL decodificada: https://welcomeparade.oceanmanswim.com/c/javiera-herrera-corrales
COINCIDE con la esperada
```

**Si cambias `llamado.url`, esta verificación deja de valer.** Vuelve a
escanearlo con un teléfono de verdad antes de dejarlo puesto.

---

## Lo que falta

**1. Las fotos reales.** Hoy hay marcadores `.svg` que dicen «reemplaza esta
foto». Van en `frontend/public/contenido/fotos/` y se apuntan desde
`frontend/public/contenido/mural.json`. Formatos y proporciones
recomendadas, en el README.

Al reemplazarlas, cambia también las extensiones en el JSON: los marcadores
son `.svg` y las fotos reales serán `.jpg`.

**2. Escanear el QR desde el televisor de verdad.** La decodificación
demuestra que el código es correcto; no demuestra que se pueda leer a tres
metros con el reflejo de la sala. Eso solo se sabe probándolo.

**3. Ajustar la zona segura al televisor concreto.** `--zona-segura` en
`frontend/src/styles.scss`, hoy en 2,5%. Súbelo si el televisor recorta los
bordes, bájalo si sobra marco negro.

**4. Confirmar las cifras.** «1.415 votos» y «Puesto 2 en Chile» se tomaron
de una captura de pantalla y cambian solos con el tiempo. Están en el JSON.

---

## Decisiones que conviene no deshacer sin leer el porqué

Las tres están argumentadas en el README y en comentarios del código. En
resumen, por si aparece la tentación:

- **Tailwind 3.4 y no 4.** La v4 pide Chromium 111+; los televisores
  recientes andan entre Chromium 94 y 116. Es la única diferencia deliberada
  respecto de `evaluacion-persona-frontend`.
- **Sin Bootstrap**, aunque se había pedido: su reset pelea con el preflight
  de Tailwind y para una vista única no aporta componentes, solo peso.
- **El QR se genera en el navegador**, no con una API: el televisor puede
  estar sin salida a internet.
- **El contenido se relee cada minuto** desde el JSON. Es lo que permite
  cambiar un texto sin ir a buscar el control remoto del televisor.

---

## Detalle del entorno que puede morder

El contenedor de desarrollo corre como el usuario `node`, que es uid 1000
en la imagen de Alpine. En la máquina original el usuario también era uid
1000 y por eso el bind mount se podía escribir. **Si en la máquina nueva tu
uid no es 1000**, `npm install` va a fallar por permisos dentro de
`/app/node_modules`. Se arregla pasando el uid en `docker-compose.yml`.

Compruébalo con `id -u`.
