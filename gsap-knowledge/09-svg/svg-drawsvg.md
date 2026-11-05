---
id: svg-drawsvg
titulo: DrawSVGPlugin, dibujar trazos
capa: 09-svg
tipo: plugin
ambito: DrawSVGPlugin
resumen: Revela u oculta el trazo de formas SVG controlando stroke-dasharray y stroke-dashoffset. El valor describe el segmento visible, no un porcentaje de avance.
api: [DrawSVGPlugin, DrawSVGPlugin.getLength, DrawSVGPlugin.getPosition]
relacionadas: [svg-guia, svg-morphsvg, scr-scrub]
etiquetas: [svg, trazo]
fuentes:
  - docs/v3/Plugins/DrawSVGPlugin.md
  - docs/v3/Plugins/DrawSVGPlugin/*
estado: verificado
version: 3.15.1
---
# DrawSVGPlugin

Anima qué tramo del trazo de un elemento SVG es visible, ajustando `stroke-dashoffset` y `stroke-dasharray`. Sirve en `<path>`, `<line>`, `<polyline>`, `<polygon>`, `<rect>`, `<ellipse>` y `<circle>`. [O] [C]

## Para qué sirve

Dibujar logotipos e iconos, subrayados, gráficos de líneas, recorridos sincronizados con scroll o un guion que viaja por una ruta.

## Registro

```js fragmento
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

gsap.registerPlugin(DrawSVGPlugin);
```

**Sin empaquetador:** `<script>` con `dist/DrawSVGPlugin.min.js` (global `DrawSVGPlugin`), o entrada `gsap/DrawSVGPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

**La clave:** el valor describe el **segmento visible al que llegas**, no un avance. `"20% 80%"` significa "al final se ve del 20 % al 80 %"; no anima de 20 a 80. [O]

| Valor | Equivale a | Resultado |
|---|---|---|
| `0` o `false` | `"0 0"` | Nada visible [C] |
| `true` | `"0 100%"` | Trazo completo [C] |
| `"100%"` | `"0 100%"` | Un solo valor implica inicio 0 [O] |
| `"20% 80%"` | | Tramo central |
| `"10 60"` | | Longitudes absolutas en unidades de usuario [O] |
| `"20% 80% live"` | | Recalcula la longitud en cada tick [O] |
| `"10% 20% nowrap"` | | Sustituye el hueco del dash por uno enorme, sin repetición. Sin documentar [C] [E] |

El orden no importa: `"80% 20%"` se normaliza a `"20% 80%"`. [E]

Métodos:

| Método | Devuelve |
|---|---|
| `DrawSVGPlugin.getLength(el)` | Longitud del trazo |
| `DrawSVGPlugin.getPosition(el)` | Array `[inicio, fin]` del segmento actual. La documentación dice Number; el código y los tipos, array [C] [E] |

## Ejemplo

Dibujar desde cero, con estado comprobable:

```html
<svg width="300" height="60" viewBox="0 0 300 60">
  <path id="linea" d="M0 30 L100 30" stroke="#333" stroke-width="4" fill="none" />
  <circle id="aro" cx="150" cy="30" r="20" stroke="#333" fill="none" />
</svg>
```

```js
const linea = document.querySelector("#linea");
const t = gsap.to(linea, { drawSVG: "20% 80%", duration: 1, paused: true, ease: "none" });
t.progress(1);
const segmento = DrawSVGPlugin.getPosition(linea);
const longitud = DrawSVGPlugin.getLength(linea);
// prueba: longitud === 100
// prueba: segmento[0] === 20 && segmento[1] === 80
// prueba: Math.round(DrawSVGPlugin.getLength("#aro")) === 126
```

Un guion de longitud fija que recorre la ruta, porque se animan los dos extremos:

```html
<svg width="300" height="60" viewBox="0 0 300 60">
  <path id="serpiente" d="M0 30 L200 30" stroke="#333" fill="none" />
</svg>
```

```js
const serpiente = document.querySelector("#serpiente");
const viaje = gsap.fromTo(serpiente, { drawSVG: "0 5%" }, { drawSVG: "95% 100%", duration: 1, paused: true, ease: "none" });
viaje.progress(0.5);
const mitad = DrawSVGPlugin.getPosition(serpiente);
// prueba: mitad[0] === 95 && mitad[1] === 105
```

Desde el centro hacia fuera y en cascada:

```html
<svg width="300" height="100" viewBox="0 0 300 100">
  <line class="trazo" x1="0" y1="10" x2="200" y2="10" stroke="#333" />
  <line class="trazo" x1="0" y1="50" x2="200" y2="50" stroke="#333" />
</svg>
```

```js
gsap.fromTo(".trazo", { drawSVG: "50% 50%" }, { drawSVG: "0% 100%", duration: 0.2, stagger: 0.05 });
await new Promise((r) => setTimeout(r, 400));
const fin = DrawSVGPlugin.getPosition(document.querySelector(".trazo"));
// prueba: fin[0] === 0 && Math.round(fin[1]) === 200
```

Orden indiferente y `nowrap`:

```js
const [a, b] = gsap.utils.toArray(".trazo");
gsap.to(a, { drawSVG: "80% 20%", duration: 1, paused: true }).progress(1);
gsap.to(b, { drawSVG: "10% 20% nowrap", duration: 1, paused: true }).progress(1);
const orden = DrawSVGPlugin.getPosition(a);

// prueba: orden.join() === "40,160"
// prueba: parseFloat(getComputedStyle(b).strokeDasharray.split(",")[1]) === 999999
```

Porcentaje dibujado en un momento dado, a partir de los dos métodos. La documentación divide solo el extremo final, que únicamente vale si el tramo empieza en 0; aquí se resta el inicio [C] [E]:

```js
const tramo = gsap.utils.toArray(".trazo")[0];
gsap.to(tramo, { drawSVG: "20% 80%", duration: 1, paused: true }).progress(1);
const porcentaje = (el) => {
  const [inicio, fin] = DrawSVGPlugin.getPosition(el);
  return ((fin - inicio) / DrawSVGPlugin.getLength(el)) * 100;
};

// prueba: Math.round(porcentaje(tramo)) === 60
```

## Trampas

- **No se ve nada.** El plugin controla un trazo existente: sin `stroke` y `stroke-width` en CSS o atributos, no hay qué mostrar. [O]
- **No toca el relleno.** Solo el trazo. Para que un logotipo con relleno parezca dibujarse, usa una máscara con un trazo animado encima o funde el relleno al final. [O] [P]
- **Rutas con varios `M`.** Los navegadores trazan mal un guion a través de varios segmentos. Divide la ruta en un `<path>` por segmento. [O]
- **Dirección del borrado.** `drawSVG: 0` en un `to()` recoge el trazo hacia el inicio. Para recogerlo hacia el final, usa `"100% 100%"`. [C]
- **Resize.** La longitud se mide al iniciar el tween. Si la longitud puede variar, añade `live`. Con `vector-effect="non-scaling-stroke"`, `live` se activa solo y se tiene en cuenta el escalado de pantalla. [C]
- **`non-scaling-stroke` con escala desigual:** la longitud no se puede medir bien en un `<path>` y el plugin avisa en consola. [C]
- **Elementos ocultos.** Con `display: none` o dentro de `<defs>`, algunos navegadores no miden. El plugin lo intenta con atributos en `rect`, `circle`, `ellipse` y `line`, pero mide después de mostrarlos. [C]
- **Trazo punteado.** El plugin ocupa `stroke-dasharray`: no puede convivir con un `dasharray` de diseño. Dibuja una máscara sobre la línea punteada. [C] [P]
- **Se queda corto en Firefox.** Es un error raro al medir. Añade anclas o llega a `102%`. [O]
- **Remates.** Con `stroke-linecap: round`, un segmento de longitud 0 puede mostrar un punto. Oculta el elemento con `autoAlpha` al inicio si se nota. [P]
- **Limpieza.** `tween.revert()` restaura `strokeDasharray` y `strokeDashoffset`. [C]
