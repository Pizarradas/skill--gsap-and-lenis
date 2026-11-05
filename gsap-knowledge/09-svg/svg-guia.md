---
id: svg-guia
titulo: Animar SVG con GSAP, guía y trampas
capa: 09-svg
tipo: guia
ambito: transversal
resumen: Qué normaliza GSAP en SVG (transforms, transformOrigin, svgOrigin, smoothOrigin), qué plugin elegir y qué límites del formato conviene conocer antes de animar.
api: [gsap.to, gsap.getProperty]
relacionadas: [svg-drawsvg, svg-morphsvg, svg-motionpath, css-origin, css-attr, cal-rendimiento]
etiquetas: [svg, transforms, rendimiento]
fuentes:
  - resources/svg.md
estado: verificado
version: 3.15.1
---
# Animar SVG con GSAP

Los elementos SVG se animan con la misma sintaxis que el DOM, pero el navegador los trata distinto: el origen de transformación es otro, no hay 3D fiable y los trazos y formas tienen sus propias propiedades. Esta guía resume qué resuelve GSAP y qué sigue siendo tu problema.

## Pasos

1. **Decide qué vas a animar.**

| Objetivo | Herramienta |
|---|---|
| Mover, escalar, rotar | `x`, `y`, `scale`, `rotation` normales |
| Dibujar un trazo | [DrawSVGPlugin](svg-drawsvg.md) |
| Convertir una forma en otra | [MorphSVGPlugin](svg-morphsvg.md) |
| Recorrer una ruta | [MotionPathPlugin](svg-motionpath.md) |
| Atributos como `cx`, `r`, `viewBox` | `attr` (ficha `css-attr`) |
| Color de relleno o trazo | `fill`, `stroke`, `opacity` por CSSPlugin |

2. **Prepara el arte.** Dale `id` o clase a cada parte, agrupa con `<g>` lo que se mueva junto y simplifica con una herramienta como SVGOMG. [O] Añadir en el editor un rectángulo del tamaño de la mesa de trabajo facilita conservar las dimensiones al exportar. [O]

3. **Fija el origen.** En SVG, el origen por especificación es relativo al lienzo. GSAP interpreta `transformOrigin` respecto al propio elemento, en `%`, palabras clave o píxeles, igual que en el DOM. [O]

```html
<svg width="300" height="300" viewBox="0 0 300 300">
  <rect class="tarjeta" x="50" y="100" width="100" height="40" />
</svg>
```

```js
gsap.to(".tarjeta", { rotation: 90, transformOrigin: "50% 50%", duration: 0.2 });
const tarjeta = document.querySelector(".tarjeta");
await new Promise((r) => setTimeout(r, 400));
const caja = tarjeta.getBoundingClientRect();
// prueba: Math.round(caja.width) === 40 && Math.round(caja.height) === 100
// prueba: Math.round(caja.left + caja.width / 2) === 100
// prueba: Math.round(caja.top + caja.height / 2) === 120
// prueba: tarjeta.getAttribute("transform").startsWith("matrix(")
```

GSAP escribe el resultado en el atributo `transform` como `matrix()`, no en `style`. [E]

4. **Si el origen es un punto común del lienzo, usa `svgOrigin`.** Funciona como `transformOrigin`, pero en coordenadas globales del SVG: útil para que varias piezas giren alrededor del mismo eje. [O]

```html
<svg width="300" height="300" viewBox="0 0 300 300">
  <rect class="aspa" x="140" y="20" width="20" height="60" />
</svg>
```

```js
gsap.to(".aspa", { rotation: 180, svgOrigin: "150 150", duration: 0.2 });
await new Promise((r) => setTimeout(r, 400));
const aspa = document.querySelector(".aspa").getBoundingClientRect();
// prueba: Math.round(aspa.top) === 220 && Math.round(aspa.left) === 140
```

5. **Cambia el origen sin saltos.** Cambiar `transformOrigin` en un elemento ya transformado lo movería según la especificación. `smoothOrigin` aplica un desplazamiento para evitarlo, y está activo por defecto en SVG. Se desactiva por tween con `smoothOrigin: false` o de forma global con `CSSPlugin.defaultSmoothOrigin = false`. [O]

6. **Anima con valores relativos cuando el arte pueda cambiar.** `y: "+=100"` sobrevive a que retoques coordenadas en el SVG. [O]

7. **Convierte coordenadas con ayuda.** Para situar un elemento sobre otro dentro de contenedores transformados, usa `convertCoordinates()` o `getRelativePosition()` de [MotionPathPlugin](svg-motionpath-api.md).

## Trampas

- **Fija las transformaciones con GSAP, no con CSS.** Hay errores de navegador al leer transformaciones de SVG que GSAP no puede corregir. Si un elemento se va a animar, aplica también su estado inicial con `gsap.set()`. [O]
- **Sin 3D en hijos de `<svg>`.** La especificación no contempla `rotationX`, `rotationY` ni `z`. Aplica el 3D al `<svg>` o a un `<div>` contenedor, o simúlalo con `scaleX`. [O]
- **`<use>` es intocable por dentro.** No se pueden alterar los contenidos de una instancia; DrawSVG no tendrá efecto visible. [O]
- **Filtros y máscaras son caros.** Si va lento, suele deberse a demasiados elementos o a filtros. Reduce el arte o su tamaño. [O]
- **Artefactos en Chrome.** Una rotación mínima, como `rotation: 0.01`, a veces los corrige. [O]
- **`stroke-width` escala con `scale`.** Para mantener el grosor, usa `vector-effect="non-scaling-stroke"`; DrawSVG lo detecta y recalcula la longitud sola. [C]
- **SplitText no parte `<text>`.** Para animar letras en SVG, crea un `<tspan>` por letra o convierte el texto en trazados. [P]
- **SVG frente a canvas.** Con miles de elementos animados a la vez, el SVG suele quedarse corto. MorphSVG puede dibujar en canvas: ver [svg-morphsvg](svg-morphsvg.md). [P]
