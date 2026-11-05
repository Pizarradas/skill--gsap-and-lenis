---
id: esp-easel
titulo: EaselPlugin, filtros de EaselJS
capa: 11-especializados
tipo: plugin
ambito: EaselPlugin
resumen: Anima tint, exposure, brightness, saturation, contrast, hue y colorize en objetos de EaselJS, además de frame en MovieClip, mediante easel.
api: [EaselPlugin]
relacionadas: [esp-pixi]
etiquetas: [canvas, filtros]
fuentes:
  - docs/v3/Plugins/EaselPlugin.md
estado: verificado
version: 3.15.1
---
# EaselPlugin

Para las propiedades numéricas normales de EaselJS, como `x` o `y`, no hace falta. El plugin añade las que requieren `ColorFilter` y `ColorMatrixFilter`. [O] No tiene miembros públicos propios: solo la clave `easel` en el tween. [C]

## Para qué sirve

Proyectos con CreateJS que necesitan animar color. EaselJS **no está cargado en el arnés**: el ejemplo principal es `fragmento`; lo ejecutado usa objetos simulados.

## Registro

```js fragmento
import gsap from "gsap";
import { EaselPlugin } from "gsap/EaselPlugin";

gsap.registerPlugin(EaselPlugin);
gsap.ticker.add(() => stage.update()); // EaselJS debe redibujar en cada tick
```

**Sin empaquetador:** `<script>` con `dist/EaselPlugin.min.js` (global `EaselPlugin`), o entrada `gsap/EaselPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

| Propiedad en `easel: {}` | Filtro | Notas |
|---|---|---|
| `tint`, `tintAmount` | ColorFilter | Color y mezcla 0–1 |
| `exposure` | ColorFilter | 0–2; 1 es normal, 0 negro, 2 blanco |
| `brightness` | ColorFilter | 0–2 |
| `colorFilter` | ColorFilter | Objeto con `redMultiplier`, `greenOffset`, etc. |
| `saturation`, `contrast`, `hue` | ColorMatrixFilter | |
| `colorize`, `colorizeAmount` | ColorMatrixFilter | |
| `frame` | — | `MovieClip`: número o etiqueta, redondeado con `gotoAndStop` [C] |

## Ejemplo

```js fragmento
const escena = new createjs.Stage("lienzo");
const forma = new createjs.Shape();
forma.graphics.beginFill("#f00").drawCircle(0, 0, 100);
forma.cache(-100, -100, 200, 200); // imprescindible para que los filtros se vean
escena.addChild(forma);

gsap.ticker.add(() => escena.update());

gsap.to(forma, { duration: 1, scaleX: 0.5, easel: { tint: "#0f0", tintAmount: 0.5 } });
gsap.to(forma, { duration: 1, delay: 1, easel: { saturation: 0 } });
```

Con un objeto simulado que tiene la forma de un `MovieClip`, `frame` admite etiquetas:

```js
const clip = {
  currentFrame: 0,
  labels: [{ label: "fin", position: 20 }],
  gotoAndStop(n) { this.currentFrame = n; },
};
const t = gsap.to(clip, { duration: 1, paused: true, ease: "none", easel: { frame: "fin" } });
t.progress(0.5);
const mitad = clip.currentFrame;
t.progress(1);
// prueba: mitad === 10
// prueba: clip.currentFrame === 20
```

## Trampas

- **Hay que envolver en `easel: {}`.** Es el fallo más habitual, ya que `tint` suelto no significa nada para GSAP. [O]
- **Carga los filtros.** `ColorFilter` y `ColorMatrixFilter` son archivos de EaselJS, y deben estar en `window.createjs`. Sin ellos, avisa. [O] [C]
- **Sin `cache()` no se ve nada.** Los filtros exigen cachear el objeto. Si no lo hiciste, el plugin intenta `cache()` con `getBounds()` y avisa. [O] [C]
- **Sin redibujar no se ve nada.** Llama a `stage.update()` en un `gsap.ticker.add()`. [O]
- **Filtros sin comprobar.** Los valores de color no se han ejecutado contra EaselJS real; proceden de la documentación y del fuente. [P]
