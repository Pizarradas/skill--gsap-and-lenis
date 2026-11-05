---
id: svg-morphsvg-api
titulo: RawPath y utilidades de MorphSVGPlugin
capa: 09-svg
tipo: api
ambito: MorphSVGPlugin
resumen: El formato RawPath con los tipos de 3.15.1, y convertToPath, getRawPath, stringToRawPath, rawPathToString y normalizeStrings con sus trampas.
api: [MorphSVGPlugin.convertToPath, MorphSVGPlugin.getRawPath, MorphSVGPlugin.stringToRawPath, MorphSVGPlugin.rawPathToString, MorphSVGPlugin.normalizeStrings, MorphSVGPlugin.defaultRender, MorphSVGPlugin.defaultType, MorphSVGPlugin.defaultUpdateTarget, gsap.plugins.NormalizeVars.shapeIndex, gsap.plugins.NormalizeVars.map, gsap.plugins.RawPath.totalPoints, gsap.plugins.PathSegment.closed]
requiere: [svg-morphsvg]
relacionadas: [svg-morphsvg, svg-motionpath-api, fra-typescript]
etiquetas: [svg, rawpath, typescript]
fuentes:
  - docs/v3/Plugins/MorphSVGPlugin/*
estado: verificado
version: 3.15.1
---
# RawPath y utilidades de MorphSVG

Un **RawPath** es la forma numérica de una ruta SVG: un array con un segmento por cada comando `M`, y cada segmento, un array plano `x, y, x, y…` de cúbicas de Bézier (ancla, dos controles, ancla…). Sea cual sea el comando original, el resultado siempre son cúbicas. [O]

## Firma

```text
MorphSVGPlugin.convertToPath(forma, swap = true)       → SVGPathElement[]
MorphSVGPlugin.getRawPath(selector | elemento | datos) → RawPath
MorphSVGPlugin.stringToRawPath(datos)                  → RawPath
MorphSVGPlugin.rawPathToString(rawPath)                → string
MorphSVGPlugin.normalizeStrings(a, b, config)          → [string, string]
```

Tipos desde 3.15.1: [C]

```ts
interface PathSegment extends Array<number> { closed?: boolean }
interface RawPath extends Array<PathSegment> { totalPoints?: number }
```

Hasta 3.15.0, `RawPath` era `number[][]` y `getRawPath()` se declaraba, por error, como `string[]`. Ahora devuelve `RawPath`. En código TS antiguo: quita los *cast* de `getRawPath()`, y usa `segment.closed` sin forzar el tipo. Como ambas propiedades son opcionales, un `number[][]` debería seguir siendo asignable a `RawPath`; no se ha compilado. [P]

| Propiedad | Dónde | Significado |
|---|---|---|
| `closed` | segmento | `true` si termina en `z` o sus extremos coinciden; `rawPathToString()` añade `z` [E] |
| `totalPoints` | RawPath | Cantidad de números en todos los segmentos [E] |
| `totalLength` | RawPath | Lo añade `cacheRawPathMeasurements()`; no está en los tipos [E] |

## Ejemplo

```html
<svg width="100" height="100">
  <path id="doble" d="M0,0 C10,20,15,30,5,18 M0,100 C50,120,80,110,100,100 z" />
</svg>
```

```js
const rp = MorphSVGPlugin.getRawPath("#doble");
const texto = MorphSVGPlugin.rawPathToString(rp);
const recta = MorphSVGPlugin.stringToRawPath("M0 0 L10 0");
// prueba: rp.length === 2 && rp[0].slice(0, 4).join() === "0,0,10,20"
// prueba: rp[0].closed === false && rp[1].closed === true
// prueba: texto.startsWith("M0,0 C10,20 15,30 5,18 M0,100") && texto.endsWith("z")
// prueba: recta[0].length === 8 && recta.totalPoints === 8
```

Una recta se vuelve una cúbica de 8 números, con controles fabricados sobre la propia línea. [E]

### convertToPath

```html
<svg width="100" height="100">
  <circle id="bola" cx="50" cy="50" r="30" fill="red" />
  <rect id="caja" width="20" height="10" />
</svg>
```

```js
const nuevos = MorphSVGPlugin.convertToPath("#bola");
const copias = MorphSVGPlugin.convertToPath("#caja", false);
// prueba: nuevos[0].tagName === "path" && nuevos[0].id === "bola" && nuevos[0].getAttribute("fill") === "red"
// prueba: document.querySelectorAll("circle").length === 0
// prueba: copias[0].parentNode === null && document.querySelectorAll("rect").length === 1
```

Sustituye el elemento en el DOM conservando los atributos, salvo con `swap: false`, que solo devuelve la copia. [E] GSAP no lo hace por ti porque rompería listeners y referencias al nodo original. Acepta `"circle, rect, ellipse, line, polygon, polyline"` para convertirlo todo. [O] El mismo método existe en `MotionPathPlugin`. [O]

### normalizeStrings

Iguala los puntos de dos cadenas para usarlas fuera de GSAP (CSS `d`, otro motor), sin animar. No tiene página propia en la documentación. [C]

```js
const [a, b] = MorphSVGPlugin.normalizeStrings(
  "M0 0 L10 0 L10 10 Z",
  "M0 0 L5 5 L10 0 L10 10 L0 10 Z",
  { map: "size", shapeIndex: "auto" }
);
const puntosA = MorphSVGPlugin.stringToRawPath(a)[0].length;
const puntosB = MorphSVGPlugin.stringToRawPath(b)[0].length;
// prueba: puntosA === puntosB
```

## Trampas

- **`normalizeStrings` sin tercer argumento lanza** `Cannot read properties of undefined (reading 'shapeIndex')`, aunque los tipos lo declaran opcional. Pasa siempre `{}`. [E]
- **`getRawPath(elemento)` devuelve una caché compartida.** Dos llamadas sobre el mismo `<path>` con el mismo `d` dan el **mismo** array, también desde `MotionPathPlugin`. Si lo mutas, afectas a todos. Copia con `rp.map((s) => s.slice())`, y recuerda volver a poner `closed`. [E]
- **`stringToRawPath` añade anclas al cerrar.** Con `z` y extremos distintos crea un tramo de vuelta: no cuentes las anclas del original. [E]
- **`<rect>` con solo `rx` o `ry`.** MorphSVG usa 0 para el que falta, mientras algunos navegadores copian el otro. Define ambos. [O]
- **`getRawPath` y `normalizeStrings` no tienen página en la documentación**, pero sí tipos. Los demás métodos expuestos en el objeto, como `smoothRawPath`, `pathFilter`, `pointsFilter`, `getTotalSize` y `equalizeSegmentQuantity`, no tienen ni página ni tipos: trátalos como internos. [C] [E]
