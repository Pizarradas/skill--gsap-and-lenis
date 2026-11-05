---
id: esp-pixi
titulo: PixiPlugin, animar objetos de PixiJS
capa: 11-especializados
tipo: plugin
ambito: PixiPlugin
resumen: Simplifica animar PixiJS. Propiedades planas, rotación en grados, colores como en CSS, y filtros de color y desenfoque sin crearlos a mano.
api: [PixiPlugin.registerPIXI, PixiPlugin.PixiMatrix.a, PixiPlugin.PixiMatrix.b, PixiPlugin.PixiMatrix.c, PixiPlugin.PixiMatrix.d, PixiPlugin.PixiMatrix.tx, PixiPlugin.PixiMatrix.ty, PixiPlugin.PixiMatrix.array, PixiPlugin.Vars.saturation, PixiPlugin.Vars.brightness, PixiPlugin.Vars.contrast, PixiPlugin.Vars.hue, PixiPlugin.Vars.colorize, PixiPlugin.Vars.colorizeAmount, PixiPlugin.Vars.colorMatrixFilter, PixiPlugin.Vars.combineCMF, PixiPlugin.Vars.blur, PixiPlugin.Vars.blurX, PixiPlugin.Vars.blurY, PixiPlugin.Vars.blurPadding]
relacionadas: [css-rotacion, eas-guia]
etiquetas: [canvas, webgl, filtros]
fuentes:
  - docs/v3/Plugins/PixiPlugin.md
  - docs/v3/Plugins/PixiPlugin/*
estado: verificado
version: 3.15.1
---
# PixiPlugin

Sin plugin, animar PixiJS obliga a apuntar a subobjetos (`obj.scale`, `obj.skew`) y a usar radianes. `pixi: {}` lo unifica, acepta grados y colores legibles, y crea los filtros necesarios. [O]

## Para qué sirve

Escenas WebGL o canvas con PixiJS que quieran la sintaxis de GSAP. PixiJS **no está cargado en el arnés de pruebas**: los ejemplos de filtros son `fragmento`. Lo ejecutable usa un objeto simulado con la misma forma que un `Container`.

## Registro

```js fragmento
import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI); // basta una vez; sin esto busca window.PIXI
```

**Sin empaquetador:** `<script>` con `dist/PixiPlugin.min.js` (global `PixiPlugin`), o entrada `gsap/PixiPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

Con importaciones sueltas, pasa un objeto con lo que uses [O]:

```js fragmento
import { Container, Sprite, BlurFilter, ColorMatrixFilter } from "pixi.js";

PixiPlugin.registerPIXI({ Container, Sprite, BlurFilter, ColorMatrixFilter });
```

## API

| Grupo | Propiedades dentro de `pixi: {}` |
|---|---|
| Posición | `x`, `y`, `position`, `positionX`, `positionY` |
| Escala | `scale`, `scaleX`, `scaleY` |
| Inclinación (grados) | `skew`, `skewX`, `skewY` |
| Ancla y pivote | `anchor`, `anchorX`, `anchorY`, `pivot`, `pivotX`, `pivotY` |
| Rotación | `rotation` y `angle`, ambas en grados. Admiten `_short`, `_cw`, `_ccw` |
| Tamaño | `width`, `height` |
| Opacidad | `alpha`, `autoAlpha` (también cambia `visible`) |
| Color | `tint`, `lineColor`, `fillColor`. Sin tipar, `strokeColor` [C] |
| Filtro de color | `saturation`, `brightness`, `contrast`, `hue`, `colorize`, `colorizeAmount`, `colorMatrixFilter`, `combineCMF` |
| Desenfoque | `blur`, `blurX`, `blurY`, `blurPadding` |
| Tiling | `tileX`, `tileY`, `tilePosition`, `tilePositionX`, `tilePositionY`, `tileScale`, `tileScaleX`, `tileScaleY` |
| Otros | `matrix`, `zIndex`, `resolution` |

Cualquier otra propiedad numérica también funciona: no hay lista cerrada. [O] `PixiMatrix` tiene `a`, `b`, `c`, `d`, `tx`, `ty` y `array`. [C]

Colores admitidos: `"red"`, `"#F00"`, `"rgb(255,0,0)"`, `"hsl(0, 100%, 50%)"`, `0xFF0000` y HSL relativo `"hsl(+=180, +=0%, +=0%)"`. [O]

## Ejemplo

Objeto simulado, para comprobar rotación, subobjetos, color y `autoAlpha`:

```js
window.PIXI = {};
PixiPlugin.registerPIXI(window.PIXI);

const sprite = {
  position: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, skew: { x: 0, y: 0 },
  rotation: 0, alpha: 1, visible: true, tint: 0xff0000,
};

const t = gsap.to(sprite, {
  duration: 1,
  paused: true,
  ease: "none",
  pixi: { x: 100, scaleX: 2, skewX: 90, rotation: 180, tint: "#00ff00", autoAlpha: 0 },
});
t.progress(1);
// prueba: sprite.position.x === 100
// prueba: sprite.scale.x === 2 && sprite.scale.y === 1
// prueba: Math.abs(sprite.rotation - Math.PI) < 0.0001
// prueba: Math.abs(sprite.skew.x - Math.PI / 2) < 0.0001
// prueba: sprite.tint === 0x00ff00
// prueba: sprite.visible === false
```

Giro por el camino corto:

```js
PixiPlugin.registerPIXI({});
const rad = Math.PI / 180;
const ruleta = { rotation: 170 * rad };
const giro = gsap.to(ruleta, { duration: 1, paused: true, ease: "none", pixi: { rotation: "-170_short" } });
giro.progress(0.5);
const mitad = ruleta.rotation / rad;
// prueba: Math.abs(mitad - 180) < 0.01
```

Filtros, sin ejecutar por requerir PixiJS real:

```js fragmento
const imagen = PIXI.Sprite.from("foto.png");

gsap.timeline({ defaults: { duration: 1 } })
  .to(imagen, { pixi: { colorize: "red", colorizeAmount: 1 } })
  .to(imagen, { pixi: { hue: 180 } })
  .to(imagen, { pixi: { saturation: 0 } })
  .to(imagen, { pixi: { brightness: 2, contrast: 1.5 } })
  .to(imagen, { pixi: { blurX: 15, blurY: 15 } });

// filtro propio:
const sepia = new PIXI.ColorMatrixFilter();
sepia.sepia();
gsap.to(imagen, { pixi: { colorMatrixFilter: sepia }, duration: 1 });
```

## Trampas

- **Sin `registerPIXI` en módulos** avisa `PIXI was not found` y no anima, porque no hay global. [O] [C]
- **Las claves van dentro de `pixi: {}`.** Fuera, `rotation` se interpreta en radianes del propio objeto y `scaleX` no existe en un `Container`. [P]
- **`combineCMF`.** Sin él, los valores no incluidos en un tween vuelven a su estado por defecto; con `combineCMF: true`, se conservan los filtros anteriores. [C]
- **`blur` añade `padding`** a todos los filtros, para que no se recorten; `blurPadding: 0` lo desactiva. [C]
- **Módulos sueltos.** En PixiJS 7.1 los filtros pasaron de `PIXI.filters` a `PIXI`; el plugin busca en ambos. [C]
- **PixiJS 8.** `lineColor` se traduce a `strokeColor`, y tras cada cambio redibuja con `fill()` y `stroke()`. [C] Sin comprobar con PixiJS real. [P]
- **`resolution`** se ignora en la animación. [C]
