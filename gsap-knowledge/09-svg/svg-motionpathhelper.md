---
id: svg-motionpathhelper
titulo: MotionPathHelper, editar rutas en el navegador
capa: 09-svg
tipo: plugin
ambito: MotionPathHelper
resumen: Herramienta de desarrollo para editar visualmente una ruta de motionPath y copiar el resultado. También hace editable cualquier path con editPath().
api: [MotionPathHelper.create, MotionPathHelper.editPath, MotionPathHelper.kill, MotionPathHelper.Vars.ease, MotionPathHelper.Vars.end, MotionPathHelper.Vars.duration, MotionPathHelper.Vars.path, MotionPathHelper.Vars.pathColor, MotionPathHelper.Vars.pathWidth, MotionPathHelper.Vars.pathOpacity, MotionPathHelper.Vars.selected, MotionPathHelper.Vars.start, MotionPathHelper.EditPathVars.anchorSnap, MotionPathHelper.EditPathVars.callbackScope, MotionPathHelper.EditPathVars.draggable, MotionPathHelper.EditPathVars.handleSize, MotionPathHelper.EditPathVars.handleSnap, MotionPathHelper.EditPathVars.onDeleteAnchor, MotionPathHelper.EditPathVars.onPress, MotionPathHelper.EditPathVars.onRelease, MotionPathHelper.EditPathVars.onUpdate, MotionPathHelper.EditPathVars.selected]
requiere: [svg-motionpath]
relacionadas: [svg-motionpath, esp-gsdevtools]
etiquetas: [svg, ruta, herramienta, desarrollo]
fuentes:
  - docs/v3/MotionPathHelper/*
estado: verificado
version: 3.15.1
---
# MotionPathHelper

Herramienta de desarrollo que dibuja la ruta sobre la página, con anclas y asas, para ajustarla a mano y copiar el resultado con un botón. Se quita antes de publicar. [O]

## Para qué sirve

Afinar un `motionPath` viéndolo, dibujar una ruta desde cero o convertir un `<path>` en editable con `MotionPathHelper.editPath()`.

## Registro

```js fragmento
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { MotionPathHelper } from "gsap/MotionPathHelper";

gsap.registerPlugin(MotionPathPlugin, MotionPathHelper);
```

**Sin empaquetador:** `<script>` con `dist/MotionPathPlugin.min.js` y `dist/MotionPathHelper.min.js` (globales `MotionPathPlugin` y `MotionPathHelper`), o entradas `gsap/MotionPathPlugin` y `gsap/MotionPathHelper` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

| Llamada | Efecto |
|---|---|
| `MotionPathHelper.create(objetivo, vars?)` | Abre el editor sobre el tween `motionPath` existente del objetivo o crea uno |
| `helper.getString()` | Datos de la ruta actual. Falta en los tipos [E] |
| `helper.kill()` | Quita editor y botón, y revierte el tween de prueba [O] [C] |
| `MotionPathHelper.editPath(path, vars?)` | Editor sobre un `<path>`; devuelve un PathEditor con `getString()` y `kill()` [E] |

`objetivo` en `create()` también puede ser un tween o un elemento. [C]

Opciones de `create()`, solo para el tween que crea si no había uno: [C]

| Opción | Defecto |
|---|---|
| `path` | Ruta inicial; si falta, crea una y deja el tween en pausa |
| `duration` `ease` | `5` y `"power1.inOut"` |
| `start` `end` | `0` y `1` |
| `selected` | Mostrar seleccionada |
| `pathColor` `pathWidth` `pathOpacity` | `"#555"`, `3` y `0.6` para la ruta creada |

Sin tipar, el fuente lee también `center`, `container`, `autoRotate` y `alignOrigin`. [C]

Opciones de `editPath()`:

| Opción | Uso |
|---|---|
| `selected` | Selección inicial |
| `draggable` | Arrastrar toda la ruta. En la tabla oficial la descripción está duplicada de `selected` |
| `handleSize` | Radio de anclas y asas |
| `anchorSnap` `handleSnap` | Funciones de ajuste de posición |
| `onPress` `onRelease` `onUpdate` `onDeleteAnchor` | Eventos del editor |
| `callbackScope` | `this` de las callbacks |

Atajos del editor [O]:

| Acción | Gesto |
|---|---|
| Añadir punto | ALT + clic sobre la ruta |
| Cambiar ancla suave ↔ esquina | ALT + clic sobre el ancla |
| Sacar asa de una esquina | ALT + arrastrar |
| Seleccionar varias | SHIFT + clic |
| Borrar ancla | Seleccionar y tecla DELETE |
| Deshacer | CTRL + Z |
| Mover toda la ruta | Arrastrar un tramo sin anclas |

## Ejemplo

```html
<svg id="escena" width="300" height="200" viewBox="0 0 300 200">
  <path id="borrador" d="M10 10 L60 10 L60 60" fill="none" stroke="#333" />
</svg>
<div class="movil" style="position:absolute;left:0;top:0;width:20px;height:20px"></div>
```

```js
const antes = document.body.querySelectorAll("*").length;
const tween = gsap.to(".movil", { motionPath: { path: "M0 0 L50 0 L50 50" }, duration: 1 });
const ayuda = MotionPathHelper.create(".movil");
const texto = ayuda.getString();
const conEditor = document.body.querySelectorAll("*").length;
ayuda.kill();
const despues = document.body.querySelectorAll("*").length;

const editor = MotionPathHelper.editPath("#borrador", { handleSize: 7, selected: true });
const datos = editor.getString();
editor.kill();
// prueba: texto.startsWith("M0,0 C")
// prueba: conEditor > antes
// prueba: despues === antes
// prueba: datos.startsWith("M10 10")
```

## Trampas

- **Es solo para desarrollo.** Pesa, añade DOM y un botón a la página. Cárgalo con importación condicional y no lo envíes a producción. [P]
- **Requiere MotionPathPlugin registrado.** Lo toma de `gsap.plugins.motionPath`; si falta, avisa. [C]
- **`kill()` no deja la ruta nueva en tu tween.** Copia el resultado con el botón y pégalo en tu código. [P]
- **Sin página principal en el corpus.** Solo existen las de `kill()` y `editPath()`; `create()` y sus opciones se han documentado leyendo los tipos y el fuente. [C]
- **`editPath` con algo que no sea SVG** falla con `TypeError` en `appendChild`. El objetivo debe ser un `<path>` dentro de un `<svg>`. [E]
