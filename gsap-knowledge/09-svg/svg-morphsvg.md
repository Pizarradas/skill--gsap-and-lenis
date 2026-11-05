---
id: svg-morphsvg
titulo: MorphSVGPlugin, transformar una forma en otra
capa: 09-svg
tipo: plugin
ambito: MorphSVGPlugin
resumen: Interpola el atributo d de un path hacia otra forma aunque tengan distinto número de puntos. Opciones de calidad, rendimiento y salida a canvas.
api: [MorphSVGPlugin, gsap.plugins.MorphSVGVars.shape, gsap.plugins.MorphSVGVars.type, gsap.plugins.MorphSVGVars.origin, gsap.plugins.MorphSVGVars.shapeIndex, gsap.plugins.MorphSVGVars.precompile, gsap.plugins.MorphSVGVars.map, gsap.plugins.MorphSVGVars.render, gsap.plugins.MorphSVGVars.updateTarget]
relacionadas: [svg-morphsvg-api, svg-guia, svg-drawsvg]
etiquetas: [svg, morph, canvas]
fuentes:
  - docs/v3/Plugins/MorphSVGPlugin.md
  - docs/v3/Plugins/MorphSVGPlugin/static.defaultRender.md
  - docs/v3/Plugins/MorphSVGPlugin/static.defaultType.md
  - docs/v3/Plugins/MorphSVGPlugin/static.defaultUpdateTarget.md
estado: verificado
version: 3.15.1
---
# MorphSVGPlugin

Anima el atributo `d` de un `<path>` hasta otra forma. Convierte ambas a cúbicas de Bézier y añade puntos donde faltan, así que no hace falta que coincidan en número o tipo de puntos. [O]

## Para qué sirve

Iconos que cambian de estado, transiciones entre siluetas y formas orgánicas. También dibujar el resultado en `<canvas>` o en otro motor. [O]

## Registro

```js fragmento
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);
```

**Sin empaquetador:** `<script>` con `dist/MorphSVGPlugin.min.js` (global `MorphSVGPlugin`), o entrada `gsap/MorphSVGPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

`morphSVG` acepta un selector, un elemento, datos de ruta, puntos para `<polygon>` y `<polyline>`, o un objeto de opciones. [O]

| Opción | Valores | Uso |
|---|---|---|
| `shape` | selector, elemento o datos | Forma final; única obligatoria [O] |
| `type` | `"linear"` `"rotational"` | `rotational` interpola ángulo y longitud; útil si `linear` se pliega a mitad [O] |
| `origin` | `"50% 50%"` o `"a b,c d"` | Centro de rotación de `rotational`; dos pares si difiere entre formas [O] |
| `shapeIndex` | número, `"auto"`, `"log"`, array | Qué punto inicial emparejar. Negativo invierte la ruta. Solo en rutas cerradas [O] |
| `map` | `"size"` `"position"` `"complexity"` | Cómo emparejar subsegmentos; `size` por defecto [O] |
| `smooth` | número, `"auto"`, objeto | Desde 3.14. Anclas extra: `{ points, redraw, persist }` [O] [C] |
| `curveMode` | boolean | Desde 3.14. Evita pliegues en anclas suaves interpolando asas por ángulo [O] [C] |
| `precision` | número | Decimales de `d`. Por defecto 2 [O] [C] |
| `precompile` | `"log"` o array | Hornea el cálculo inicial [O] |
| `render` | función | `(rawPath, target)`, con `this` igual al tween [E] |
| `updateTarget` | boolean | `false` no toca el `d` del objetivo. Ideal si solo dibujas en canvas [O] |

`smooth`, `curveMode` y `precision` funcionan pero **no están en `MorphSVGVars`**, que tampoco admite `"log"` en `shapeIndex`: en TypeScript dan error. Fuerza el tipo o declara una extensión. [C]

Defectos globales: `MorphSVGPlugin.defaultType` (`"linear"`), `defaultUpdateTarget` (`true`) y `defaultRender`. Sin tipar y sin documentar, `MorphSVGPlugin.defaultMap` vale `"size"`. [E]

## Ejemplo

```html
<svg width="300" height="200" viewBox="0 0 300 200">
  <path id="cuadro" d="M10 10 L60 10 L60 60 L10 60 Z" />
  <path id="flecha" d="M100 100 L150 100 L125 150 Z" />
</svg>
```

```js
const cuadro = document.querySelector("#cuadro");
const inicial = cuadro.getAttribute("d");
const destino = document.querySelector("#flecha").getAttribute("d");

const ida = gsap.to(cuadro, { morphSVG: "#flecha", duration: 1, paused: true, ease: "none" });
ida.progress(0.5);
const intermedio = cuadro.getAttribute("d");
ida.progress(1);
const final = cuadro.getAttribute("d");
const original = cuadro.getAttribute("data-original");

const vuelta = gsap.to(cuadro, { morphSVG: cuadro, duration: 1, paused: true }); // el propio elemento = volver a data-original
vuelta.progress(1);
// prueba: intermedio.includes("C") && intermedio !== inicial
// prueba: final === destino
// prueba: original === inicial
// prueba: cuadro.getAttribute("d") === inicial
```

Dos cosas se ven aquí. Al llegar a 1, escribe tal cual la cadena de destino, y guarda el `d` inicial en `data-original`. Para volver basta con pasar el propio elemento. [E]

Dibujar en canvas sin tocar el SVG:

```html
<svg width="10" height="10"><path id="ojo" d="M0 0 L50 0 L50 50 Z" /><path id="meta" d="M0 0 L9 9 L0 9 Z" /></svg>
<canvas id="lienzo" width="200" height="200"></canvas>
```

```js
const ctx = document.querySelector("#lienzo").getContext("2d");
const ojo = document.querySelector("#ojo");
let segmentos = 0;

function pintar(rawPath) {
  ctx.clearRect(0, 0, 200, 200);
  ctx.beginPath();
  for (const s of rawPath) {
    ctx.moveTo(s[0], s[1]);
    for (let i = 2; i < s.length; i += 6) ctx.bezierCurveTo(s[i], s[i + 1], s[i + 2], s[i + 3], s[i + 4], s[i + 5]);
    if (s.closed) ctx.closePath();
  }
  ctx.fill();
  segmentos = rawPath.length;
}

const dibujo = gsap.to(ojo, { morphSVG: { shape: "#meta", render: pintar, updateTarget: false }, duration: 1, paused: true, ease: "none" });
dibujo.progress(0.5);
// prueba: segmentos === 1
// prueba: ojo.getAttribute("d") === "M0 0 L50 0 L50 50 Z"
```

### Cuando el morph queda mal

1. Se tuerce o se cruza: prueba otro `shapeIndex`. Con `"log"` ves el valor que eligió `"auto"`, como `shapeIndex:[0]`; en rutas abiertas sale el literal `[log]`, porque no aplica. La utilidad externa `findShapeIndex()` permite elegirlo visualmente. [O]
2. Se pliega en curvas: `curveMode: true` o `type: "rotational"`. [O]
3. Rota raro: mueve `origin`. [O]
4. Puntos mal repartidos: `smooth: 40`. Redibujar pierde fidelidad; con `smooth: { points: 40, redraw: false }` se mantienen las anclas originales. [O]
5. Subformas que no casan: cambia `map` o divide en varias rutas. [O]

### Rendimiento

El coste está en el primer render, al emparejar puntos. Fija un `shapeIndex` numérico (array con uno por segmento) para saltarte el cálculo, o precompila para las formas muy complejas. [O] Ambos se obtienen ejecutando una vez con `"log"`; la salida va por `console.warn`, no `console.log` como dice la documentación. [C] [E]

```js fragmento
gsap.to("#a", { morphSVG: { shape: "#b", precompile: "log" } });
// copia el array de la consola:
gsap.to("#a", { morphSVG: { shape: "#b", precompile: ["M0,0 C...", "M1,1 C..."] } });
```

`precompile` solo se aplica a `<path>` y hay que regenerarlo si cambia el arte. [O]

## Trampas

- **Primitivas.** `<circle>`, `<rect>`, `<ellipse>` y `<line>` no se pueden morfear: se avisa `Cannot morph a <RECT> element` y no ocurre nada. Conviértelas antes con [`convertToPath()`](svg-morphsvg-api.md). Como destino sí valen. [O] [E]
- **`<polygon>` y `<polyline>`** solo aceptan puntos: pasarles una ruta con comandos avisa `cannot accept path data` y el tween no hace nada. [E]
- **`revert()` no recupera el texto original de `d`.** Ni `revert()` ni `progress(0)` restauran la cadena exacta: queda su equivalente en cúbicas. Se ve igual, pero si comparas cadenas, usa `data-original`. [E]
- **`smooth` persiste por defecto.** Tras el tween, `d` conserva los puntos añadidos, no la cadena destino. Con `persist: false` vuelve a la original del destino. [E]
- **El morph no anima `fill` ni `stroke`.** Añádelos como propiedades normales al mismo tween. [P]
- **Si va a saltos durante todo el tween**, no es el cálculo inicial: es el coste de pintar. `precompile` no lo arregla; simplifica el arte, reduce el tamaño o pinta en canvas. [O]
