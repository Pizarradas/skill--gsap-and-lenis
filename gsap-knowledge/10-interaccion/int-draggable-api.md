---
id: int-draggable-api
titulo: Draggable, opciones, propiedades y métodos
capa: 10-interaccion
tipo: api
ambito: Draggable
resumen: Referencia completa de Draggable.Vars, propiedades de instancia, métodos, eventos y formas de bounds, con el orden real de callbacks.
api: [Draggable.get, Draggable.timeSinceDrag, Draggable.zIndex, Draggable.addEventListener, Draggable.removeEventListener, Draggable.dispatchEvent, Draggable.applyBounds, Draggable.disable, Draggable.enable, Draggable.enabled, Draggable.endDrag, Draggable.startDrag, Draggable.getDirection, Draggable.kill, Draggable.update, Draggable.isDragging, Draggable.isPressed, Draggable.isThrowing, Draggable.scrollProxy, Draggable.BoundsMinMax.minX, Draggable.BoundsRectangle.width, Draggable.BoundsRotation.minRotation, Draggable.Rectangle.bottom]
requiere: [int-draggable]
relacionadas: [int-draggable, int-inertia]
etiquetas: [puntero, referencia]
fuentes:
  - docs/v3/Plugins/Draggable/*
estado: verificado
version: 3.15.1
---
# Draggable: referencia

Opciones, propiedades y métodos. El uso y las trampas principales están en [int-draggable](int-draggable.md).

## Firma

```text
Draggable.create(objetivos, vars?) → Draggable[]         new Draggable(elemento, vars?)
Draggable.get(objetivo) → Draggable | undefined
Draggable.hitTest(a, b, umbral = 0) → boolean            d.hitTest(b, umbral?) → boolean
Draggable.timeSinceDrag() → segundos                     Draggable.zIndex (arranque, 1000)
```

## Opciones

| Opción | Efecto |
|---|---|
| `type` | Ver [int-draggable](int-draggable.md). Defecto `"x,y"` |
| `bounds` | Elemento, selector u objeto |
| `edgeResistance` | 0–1, fuera de los límites. Defecto 1 [C] |
| `dragResistance` | 0–1, resistencia constante al arrastrar. Defecto 0 [C] |
| `lockAxis` | Fija el eje tras los primeros 2 píxeles [O] |
| `minimumMovement` | Píxeles para considerar arrastre. Defecto 2 [O] |
| `trigger` | Elementos que inician el arrastre |
| `liveSnap` | Función, array, objeto o `true`, durante el arrastre |
| `snap` | Igual, al soltar. Requiere `inertia` |
| `inertia` | `true` u objeto. `throwProps` es su alias antiguo [C] |
| `throwResistance` | Resistencia del lanzamiento. Defecto 1000 [O] |
| `resistance` | Resistencia, sin documentar en la tabla; se pasa a Inertia [C] |
| `minDuration` `maxDuration` | Límites de duración del lanzamiento |
| `overshootTolerance` | Cuánto puede pasarse antes de volver |
| `autoScroll` | Velocidad; 1 es normal |
| `cursor` `activeCursor` | Cursor en reposo y al pulsar. `false` no toca el estilo [C] |
| `zIndexBoost` | `false` no eleva `zIndex` al pulsar [O] |
| `force3D` | `false` evita capas 3D [O] |
| `dragClickables` | `false` deja `<a>`, `<button>`, etc. con su clic [C] [E] |
| `clickableTest` | Función `(el) → boolean` propia. Solo actúa con `dragClickables: false` [C] [E] |
| `allowEventDefault` | No llama a `preventDefault()` [O] |
| `allowContextMenu` | Permite menú contextual [O] |
| `allowNativeTouchScrolling` | Scroll táctil en el eje contrario; activo con tipos de un eje [O] |
| `callbackScope` | `this` de los callbacks |

Callbacks, cada uno con su variante `…Params` (array de argumentos). `this` es la instancia, salvo `callbackScope`. Excepción: `onLockAxis` se llama directamente, sin `Params` ni `callbackScope` [C]:

| Callback | Cuándo |
|---|---|
| `onPressInit` | Antes de registrar valores iniciales: lugar para reposicionar [O] |
| `onPress` | Al pulsar |
| `onMove` | Cada movimiento, antes incluso de `onDragStart` [E] |
| `onDragStart` | Superado `minimumMovement` |
| `onDrag` | Durante el arrastre |
| `onLockAxis` | Al fijarse el eje |
| `onRelease` | Al soltar, siempre, haya arrastre o no |
| `onDragEnd` | Tras `onRelease`, solo si hubo arrastre [E] |
| `onClick` | Pulsar y soltar con menos de 3 píxeles [O] |
| `onThrowUpdate` `onThrowComplete` | Durante y al final del lanzamiento |

Nombres de parámetros: `onClickParams`, `onDragParams`, `onDragStartParams`, `onDragEndParams`, `onMoveParams`, `onPressParams`, `onPressInitParams`, `onReleaseParams`, `onThrowUpdateParams`, `onThrowCompleteParams`.

## Propiedades de instancia

| Propiedad | Contenido |
|---|---|
| `target` `vars` | Elemento y configuración |
| `x` `y` `rotation` | Valor actual. Con `left,top`, `x` e `y` son `left` y `top` |
| `startX` `startY` | Inicio del arrastre |
| `endX` `endY` `endRotation` | Destino del lanzamiento, conocido al soltar |
| `deltaX` `deltaY` | Cambio desde el evento anterior |
| `minX` `maxX` `minY` `maxY` `minRotation` `maxRotation` | Límites resueltos |
| `pointerX` `pointerY` `pointerEvent` | Último puntero normalizado. Úsalos en lugar de `pageX` [O] |
| `isDragging` `isPressed` `isThrowing` | Estado |
| `lockAxis` `lockedAxis` | `lockedAxis` es el eje **bloqueado**: arrastrar en horizontal da `"y"` [O] [E] |
| `tween` | Tween del último lanzamiento |
| `autoScroll` | Velocidad, modificable |
| `scrollProxy` | Proxy de los tipos `scroll` |

Formas de límite: `BoundsMinMax` (`minX`, `maxX`, `minY`, `maxY`), `BoundsRectangle` (`top`, `left`, `width`, `height`, relativo al padre), `BoundsRotation` (`minRotation`, `maxRotation`). `hitTest` acepta además un `Rectangle` (`top`, `left`, `right`, `bottom`) o un evento de puntero. [C]

## Métodos

| Método | Efecto |
|---|---|
| `enable()` `disable()` | Activar y desactivar. Devuelven la instancia |
| `enabled(valor?)` | Sin argumento, lee; con él, escribe y devuelve la instancia [E] |
| `kill()` | Como `disable()`, y además elimina del registro: `Draggable.get()` da `undefined` [E] |
| `update(aplicarLimites?, sticky?)` | Sincroniza `x` e `y` con el elemento; `sticky` lo pega al puntero, útil al cambiar de padre [O] |
| `applyBounds(limites)` | Fija límites y recoloca al momento si hace falta [E] |
| `startDrag(evento, alinear?)` | Empieza desde un evento real |
| `endDrag(evento)` | Termina como si se soltara. Distinto de `disable()` |
| `getDirection(desde?)` | `"start"`, `"velocity"` (requiere Inertia) o un elemento |
| `hitTest(destino, umbral?)` | Solape con `target`. `hitTest(window)` detecta visibilidad [O] |
| `timeSinceDrag()` | Como el estático |
| `addEventListener(tipo, fn)` `removeEventListener(tipo, fn)` | `press`, `click`, `dragstart`, `drag`, `dragend`, `release`, `throwupdate`, `throwcomplete`. `this` es la instancia [E] |
| `dispatchEvent(tipo)` | Lanza un evento a mano |

`getDirection()` devuelve `"up"`, `"down"`, `"left"`, `"right"` o una combinación como `"left-up"`. [O] En `type: "rotation"` da `"clockwise"` o `"counter-clockwise"`. [C]

## Ejemplo

```html
<style>
  #caja { position: absolute; left: 0; top: 0; width: 50px; height: 50px; }
  #otra { position: absolute; left: 300px; top: 0; width: 50px; height: 50px; }
</style>
<div id="caja"></div><div id="otra"></div>
```

```js
const ev = (t, tipo, x, y) => t.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", buttons: 1 }));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const caja = document.querySelector("#caja");
const d = Draggable.create(caja, { onDragParams: ["hola"], onDrag(msg) { window.msg = msg; } })[0];

let pulsado = 0;
const alPulsar = () => pulsado++;
d.addEventListener("press", alPulsar);

ev(caja, "pointerdown", 10, 10);
await espera(20);
const presionado = d.isPressed;
ev(document, "pointermove", 40, 10);
await espera(20);
const arrastrando = d.isDragging;
ev(document, "pointerup", 40, 10);
await espera(40);
d.removeEventListener("press", alPulsar);
const direccion = d.getDirection();
const conSelector = d.getDirection("#otra"); // cuidado: se trata como "start"
const haciaOtra = d.getDirection(document.querySelector("#otra"));

gsap.set(caja, { x: 80 });
const obsoleto = d.x;
d.update();
const fresco = d.x;

d.applyBounds({ minX: 0, maxX: 50 });
const recolocado = d.x;

d.disable();
const apagado = d.enabled();
const instancia = d.enabled(true) === d;
const retorno = d.kill();
// prueba: presionado === true && arrastrando === true && d.isDragging === false
// prueba: pulsado === 1 && window.msg === "hola"
// prueba: direccion === "right"
// prueba: conSelector === "right" && haciaOtra === "left"
// prueba: obsoleto === 30 && fresco === 80 && recolocado === 50
// prueba: apagado === false && instancia === true
// prueba: retorno === d && Draggable.get(caja) === undefined
```

## Trampas

- **`Draggable.zIndex` sube con cada pulsación.** Empieza en 1000 e incrementa: si quieres que conviva con tu escala de capas, fija su valor o desactiva `zIndexBoost`. [O] [E]
- **`getDirection("#selector")` no mide contra ese elemento.** Una cadena se interpreta como `"start"`. Pasa el elemento. [C] [E]
- **`startDrag()` y `endDrag()` necesitan el evento original**, porque leen `pageX`, `pageY` y `target`. [O]
- **Tipos incompletos.** `timeSinceClick()` de instancia existe pero no está tipado; `dispatchEvent()` se declara `boolean` y devuelve `undefined` si no hay retorno de listeners. [C] [E]
- **`disable()` quita el cursor** y los estilos táctiles aplicados; `enable()` los restaura. [C]
