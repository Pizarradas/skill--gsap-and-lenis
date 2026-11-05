---
id: int-draggable
titulo: Draggable, arrastrar, girar y lanzar elementos
capa: 10-interaccion
tipo: plugin
ambito: Draggable
resumen: Hace arrastrable cualquier elemento con ratón o táctil, con límites, ajuste, ejes bloqueados, detección de solape, autoscroll e inercia.
api: [Draggable.create, Draggable.Vars.type, Draggable.Vars.bounds, Draggable.Vars.edgeResistance, Draggable.Vars.dragResistance, Draggable.Vars.inertia, Draggable.Vars.snap, Draggable.Vars.liveSnap, Draggable.Vars.lockAxis, Draggable.Vars.trigger, Draggable.Vars.autoScroll, Draggable.hitTest, Draggable.SnapObject.points, Draggable.SnapObject.radius, Draggable.SnapObject.x, Draggable.SnapObject.y, Draggable.SnapObject.top, Draggable.SnapObject.left, Draggable.SnapObject.rotation]
relacionadas: [int-draggable-api, int-inertia, scr-observer, nuc-context]
etiquetas: [puntero, tactil, interaccion, arrastrar]
fuentes:
  - docs/v3/Plugins/Draggable.md
  - docs/v3/Plugins/Draggable/static.create().md
  - docs/v3/Plugins/Draggable/static.hitTest().md
  - docs/v3/Plugins/Draggable/autoScroll.md
estado: verificado
version: 3.15.1
---
# Draggable

Convierte un elemento en arrastrable o giratorio, con ratón o táctil, y funciona dentro de contenedores transformados. Con [InertiaPlugin](int-inertia.md) el objeto continúa con la inercia del lanzamiento. [O]

## Para qué sirve

Sliders, carruseles táctiles, listas reordenables, ruedas giratorias, ventanas movibles, juegos de encajar piezas o paneles con scroll por arrastre.

## Registro

```js fragmento
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin"; // solo si usas inertia

gsap.registerPlugin(Draggable, InertiaPlugin);
```

**Sin empaquetador:** `<script>` con `dist/Draggable.min.js` y `dist/InertiaPlugin.min.js` (globales `Draggable` y `InertiaPlugin`), o entradas `gsap/Draggable` y `gsap/InertiaPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

`Draggable.create(objetivos, vars?)` devuelve **siempre un array**, con una instancia por elemento. Guarda `[0]`, o recupera con `Draggable.get(el)`. [O] [E]

| `type` | Mueve |
|---|---|
| `"x,y"` (defecto), `"x"`, `"y"` | Transformaciones. Lo más fluido |
| `"left,top"`, `"left"`, `"top"` | CSS; exige `position: relative` o `absolute` [O] |
| `"rotation"` | Gira alrededor de `transformOrigin` [O] |
| `"scroll"`, `"scrollTop"`, `"scrollLeft"` | Scroll del contenedor, por `scrollProxy` [C] [E] |

Decisiones habituales:

| Necesidad | Opción |
|---|---|
| Limitar al contenedor | `bounds: "#marco"`, `{ minX, maxX, minY, maxY }`, `{ top, left, width, height }` o `{ minRotation, maxRotation }` |
| Sin salirse nada | `edgeResistance: 1` (es el defecto) [C] |
| Tirar más allá del borde | `edgeResistance: 0.65` |
| Asa de arrastre | `trigger: ".barra"` |
| Un solo eje según el gesto | `lockAxis: true` |
| Ajustar durante el arrastre | `liveSnap` |
| Ajustar al soltar | `snap` **con** `inertia: true` |
| Scroll automático en bordes | `autoScroll: 1`, a menos de 40 px del borde; más rápido cuanto más cerca [O] |

Tabla completa de opciones y propiedades en [int-draggable-api](int-draggable-api.md).

## Ejemplo

Las pruebas simulan un puntero real con `PointerEvent`, así que aquí se comprueba el arrastre de verdad:

```html
<style>
  #marco { position: absolute; left: 100px; top: 100px; width: 400px; height: 300px; }
  #ficha { position: absolute; left: 0; top: 0; width: 50px; height: 50px; }
</style>
<div id="marco"><div id="ficha"></div></div>
```

```js
const ev = (t, tipo, x, y) => t.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", buttons: 1 }));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const orden = [];
const ficha = document.querySelector("#ficha");

const [arrastre] = Draggable.create(ficha, {
  bounds: "#marco",
  onPress() { orden.push("press"); },
  onDragStart() { orden.push("dragStart"); },
  onRelease() { orden.push("release"); },
  onDragEnd() { orden.push("dragEnd"); },
});
window.inst = arrastre;

ev(ficha, "pointerdown", 110, 110);
await espera(20);
ev(document, "pointermove", 140, 130);
await espera(20);
ev(document, "pointermove", 1000, 1000); // más allá del límite
await espera(20);
ev(document, "pointerup", 1000, 1000);
await espera(20);
// prueba: inst.x === 350 && inst.y === 250
// prueba: gsap.getProperty(ficha, "x") === 350
// prueba: inst.maxX === 350 && inst.maxY === 250
// prueba: orden.join() === "press,dragStart,release,dragEnd"
// prueba: Draggable.get(ficha) === inst
```

`onRelease` se dispara **antes** que `onDragEnd`. [E]

Ajuste en vivo por propiedad y por punto, y bloqueo de eje:

```html
<style>#pieza { position: absolute; left: 0; top: 0; width: 50px; height: 50px; }</style>
<div id="pieza"></div>
```

```js
const ev = (t, tipo, x, y) => t.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", buttons: 1 }));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const gesto = async (el, dx, dy) => {
  ev(el, "pointerdown", 10, 10);
  await espera(20);
  ev(document, "pointermove", 10 + dx / 2, 10 + dy / 2);
  await espera(20);
  ev(document, "pointermove", 10 + dx, 10 + dy);
  await espera(20);
  ev(document, "pointerup", 10 + dx, 10 + dy);
  await espera(60);
};
const pieza = document.querySelector("#pieza");

let d = Draggable.create(pieza, { liveSnap: { x: (v) => Math.round(v / 50) * 50, y: [0, 70] } })[0];
await gesto(pieza, 62, 80);
const rejilla = [d.x, d.y];
d.kill();
gsap.set(pieza, { x: 0, y: 0 });

d = Draggable.create(pieza, { liveSnap: { points: [{ x: 100, y: 100 }], radius: 30 } })[0];
await gesto(pieza, 90, 90);
const punto = [d.x, d.y];
d.kill();
gsap.set(pieza, { x: 0, y: 0 });

let eje;
d = Draggable.create(pieza, { lockAxis: true, onLockAxis() { eje = this.lockedAxis; } })[0];
await gesto(pieza, 100, 5);
window.fijo = [d.x, d.y];
// prueba: rejilla.join() === "50,70"
// prueba: punto.join() === "100,100"
// prueba: fijo.join() === "100,0" && eje === "y"
```

Detección de solape:

```html
<style>
  .uno, .dos { position: absolute; top: 0; width: 50px; height: 50px; }
  .uno { left: 0; } .dos { left: 40px; }
</style>
<div class="uno"></div><div class="dos"></div>
```

```js
const parcial = Draggable.hitTest(".uno", ".dos");
const con5 = Draggable.hitTest(".uno", ".dos", 5);
const con20 = Draggable.hitTest(".uno", ".dos", 20);
const mitad = Draggable.hitTest(".uno", ".dos", "50%");
const rect = Draggable.hitTest(".uno", { left: 10, top: 10, right: 20, bottom: 20 });
// prueba: parcial === true && con5 === true
// prueba: con20 === false && mitad === false && rect === true
```

Panel con scroll por arrastre:

```html
<div id="vista" style="width:200px;height:100px;overflow:hidden"><div style="height:600px">contenido</div></div>
```

```js
const ev = (t, tipo, x, y) => t.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", buttons: 1 }));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const vista = document.querySelector("#vista");
const panel = Draggable.create(vista, { type: "scrollTop" })[0];
ev(vista, "pointerdown", 50, 90);
await espera(20);
ev(document, "pointermove", 50, 70);
await espera(20);
ev(document, "pointermove", 50, 40);
await espera(20);
ev(document, "pointerup", 50, 40);
await espera(20);
// prueba: vista.scrollTop === 50
```

Comprobaciones de las trampas:

```html
<style>#movil { position: absolute; left: 0; top: 0; width: 50px; height: 50px; }</style>
<div id="movil"><button id="dentro">x</button></div>
```

```js
const ev = (t, tipo, x, y) => t.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", buttons: 1 }));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const gesto = async (el, dx) => {
  ev(el, "pointerdown", 10, 10);
  await espera(20);
  ev(document, "pointermove", 10 + dx, 10);
  await espera(20);
  ev(document, "pointerup", 10 + dx, 10);
  await espera(60);
};
const movil = document.querySelector("#movil");
const dentro = document.querySelector("#dentro");

let d = Draggable.create(movil, { snap: () => 200 })[0];
const cursor = getComputedStyle(movil).cursor;
await gesto(movil, 30);
const sinInercia = d.x;

gsap.to(movil, { x: 77, duration: 0.01 });
await espera(50);
const sinUpdate = d.x;
d.update();
const conUpdate = d.x;
d.kill();
gsap.set(movil, { x: 0 });

d = Draggable.create(movil, {})[0];
await gesto(dentro, 40);
const arrastraBoton = d.x;
d.kill();
gsap.set(movil, { x: 0 });

d = Draggable.create(movil, { dragClickables: false })[0];
await gesto(dentro, 40);
const ignoraBoton = d.x;
d.kill();
gsap.set(movil, { x: 0 });

let pulsaciones = 0;
d = Draggable.create(movil, { onPress: () => pulsaciones++ })[0];
ev(movil, "pointerdown", 10, 10);
ev(document, "pointerup", 10, 10);
ev(movil, "pointerdown", 10, 10);
const pegada = pulsaciones;
ev(document, "pointerup", 10, 10);
d.kill();

let enContexto;
gsap.context(() => { enContexto = Draggable.create(movil)[0]; }).revert();

// prueba: cursor === "grab"
// prueba: sinInercia === 30
// prueba: sinUpdate === 30 && conUpdate === 77
// prueba: arrastraBoton === 40
// prueba: ignoraBoton === 0
// prueba: pegada === 1
// prueba: enContexto.enabled() === false
```

## Trampas

- **`snap` no hace nada sin `inertia`.** Se evalúa al calcular el lanzamiento. Sin `inertia: true`, al soltar el elemento se queda donde estaba, con InertiaPlugin cargado o sin él. Para ajustar sin inercia usa `liveSnap` o anima tú en `onDragEnd`. [E]
- **`Draggable.create()` devuelve un array,** así que `const d = Draggable.create(el); d.x` da `undefined`. [O]
- **`inertia: true` sin registrar InertiaPlugin** no da error ni aviso: simplemente no hay lanzamiento. [O] [C]
- **Bounds rotados.** El elemento de `bounds` no debe tener una rotación distinta a la del objetivo. [O]
- **`left,top` sin `position`.** Con `static` no se moverá nada. [O]
- **Elementos interactivos dentro.** La documentación se contradice: unas secciones dicen que `<a>`, `<button>` o `<input>` se ignoran por defecto y otra que hay que pedirlo con `dragClickables: false`. El código solo los excluye con `false`: por defecto **arrastran**, incluso con `data-clickable="true"`. Usa `dragClickables: false`, que además activa `clickableTest` y `data-clickable`. [C] [E]
- **Clic frente a arrastre.** Menos de 3 píxeles cuenta como clic: `onClick`. Para un `onclick` hijo que no deba activarse tras arrastrar, comprueba `Draggable.timeSinceDrag() > 0.2`. [O]
- **Mover por código.** `gsap.to()` sobre el objetivo no actualiza `draggable.x`. Llama a `update()` en el `onUpdate`, o después. [O] [E]
- **Pulsaciones rápidas seguidas.** Tras un clic, una nueva pulsación en menos de 30 ms se ignora. Lo notarás sobre todo en pruebas automatizadas. [C] [E]
- **Cursor.** La documentación indica `move` por defecto; en Chrome 3.15.1 el valor aplicado es `grab`. Fíjalo con `cursor`. [E]
- **Timelines.** Si arrastras algo que también anima un timeline, usa un proxy: arrastra un elemento invisible y anima a partir de su valor. [O]
- **Elemento dinámico.** Debe estar en el DOM antes de `create()`. [O]
- **Limpieza.** `gsap.context()` mata la instancia al revertir. [E]
