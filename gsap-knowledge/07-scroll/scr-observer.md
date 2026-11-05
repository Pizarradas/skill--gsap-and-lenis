---
id: scr-observer
titulo: Observer, intención de movimiento unificada
capa: 07-scroll
tipo: plugin
ambito: Observer
resumen: Detecta rueda, toque, puntero y scroll con una sola API, con direcciones, deltas y velocidad. Base de las páginas que cambian de sección sin scroll real.
api: [Observer, Observer.create, ScrollTrigger.observe, Observer.ObserverVars.target, Observer.ObserverVars.type, Observer.ObserverVars.onUp, Observer.ObserverVars.onDown, Observer.ObserverVars.onLeft, Observer.ObserverVars.onRight, Observer.ObserverVars.onChange, Observer.ObserverVars.tolerance, Observer.ObserverVars.debounce, Observer.ObserverVars.wheelSpeed, Observer.ObserverVars.preventDefault, Observer.ObserverVars.id]
relacionadas: [scr-observer-api, scr-normalize, scr-smoother-api, int-draggable]
etiquetas: [scroll, gestos, rueda, tactil]
fuentes:
  - docs/v3/Plugins/Observer.md
  - docs/v3/Plugins/Observer/static.create().md
  - docs/v3/Plugins/ScrollTrigger/static.observe().md
estado: verificado
version: 3.15.1
---
# Observer

Reúne rueda, toque, puntero y scroll en una sola API. Acumula deltas en cada frame y decide el sentido, de modo que puedas reaccionar a la intención ("quiere ir abajo") y no al evento. No hace falta que la página tenga scroll. [O]

## Para qué sirve

| Caso | Por qué Observer |
|---|---|
| Secciones a pantalla completa que cambian con un gesto | Se ignora el scroll real: un gesto equivale a una transición |
| Controlar un carrusel con rueda y dedo a la vez | Mismo callback para todo |
| Saber velocidad y sentido sin hacer cálculos | `velocityX/Y`, `deltaX/Y` |
| Arrastre simple con umbral | `onDrag`, `dragMinimum`, `lockAxis`. Si es arrastre de un elemento, mira [Draggable](../10-interaccion/int-draggable.md) |

Observer no mueve nada ni anima: solo informa. [O]

## Registro

```js
import { Observer } from "gsap/Observer";

gsap.registerPlugin(Observer);
```

**Sin empaquetador:** `<script>` con `dist/Observer.min.js` (global `Observer`), o entrada `gsap/Observer` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

ScrollTrigger lo lleva dentro: con él cargado, `ScrollTrigger.observe(vars)` es idéntico a `Observer.create(vars)`, sin otro archivo. [O] [C]

## API

| Clave | Por defecto | Efecto |
|---|---|---|
| `target` | viewport | Elemento o selector cuyos eventos se escuchan. Sin él, `documentElement` [O] [C] |
| `type` | `"wheel,touch,pointer"` | Lista con `wheel`, `touch`, `pointer`, `scroll` [O] |
| `onUp`, `onDown`, `onLeft`, `onRight` | — | Movimiento en ese sentido |
| `onChange`, `onChangeX`, `onChangeY` | — | Cualquier movimiento |
| `tolerance` | 0 | Píxeles acumulados para disparar. Tras disparar, vuelve a empezar [O] [E] |
| `debounce` | `true` | Acumula los deltas de cada frame. `false` dispara con cada evento [O] [E] |
| `wheelSpeed` | 1 | Multiplicador de la rueda; `-1` invierte [O] |
| `preventDefault` | `false` | Cancela el evento. Necesario para impedir el scroll nativo [C] [P] |
| `id` | — | Para `Observer.getById()` [O] |

El resto de opciones y propiedades está en [scr-observer-api](scr-observer-api.md).

**Sentido de `onDown` y `onUp`:** se refiere al delta. Con rueda, `onDown` es rueda hacia abajo (`deltaY > 0`). Con dedo o puntero, es mover el **dedo** hacia abajo, que en un scroll nativo equivale a subir la página. Quien hace paginación suele invertir el mapeo. [O] [P]

## Ejemplo

Eventos sintéticos para que el ejemplo sea autónomo. Rueda, sin debounce, con `wheelSpeed: 2`:

```html
<div class="zona" style="height:400px"></div>
```

```js
const zona = document.querySelector(".zona");
const rueda = (d) => zona.dispatchEvent(new WheelEvent("wheel", { deltaY: d, bubbles: true, cancelable: true }));

const pasos = [];
const obs = Observer.create({
  target: ".zona",
  type: "wheel",
  debounce: false,
  wheelSpeed: 2,
  id: "lector",
  onDown: (self) => pasos.push("abajo:" + self.deltaY),
  onUp: (self) => pasos.push("arriba:" + self.deltaY),
});

rueda(10);
rueda(-10);

// prueba: pasos.join() === "abajo:20,arriba:-20"
// prueba: Observer.getById("lector") === obs
// prueba: obs.target === zona
```

`tolerance` con `debounce` (por defecto) acumula entre eventos, y dispara solo al superar el umbral:

```js
const zona = document.querySelector(".zona");
const rueda = (d) => zona.dispatchEvent(new WheelEvent("wheel", { deltaY: d, bubbles: true, cancelable: true }));
const pasos = [];

Observer.create({ target: ".zona", type: "wheel", tolerance: 30, onDown: (self) => pasos.push(self.deltaY) });

rueda(10);
rueda(10);                                      // 20: por debajo del umbral
await new Promise((r) => setTimeout(r, 40));
const antes = pasos.length;
rueda(10);
rueda(10);                                      // 40: dispara
await new Promise((r) => setTimeout(r, 40));

// prueba: antes === 0
// prueba: pasos.join() === "40"
```

`onPress` llega en el acto, y `onDragStart` espera al frame, como `onDrag`:

```js
const zona = document.querySelector(".zona");
const ev = (t, tipo, x, y) => t.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", buttons: 1 }));
const pasos = [];
Observer.create({ target: zona, type: "pointer", onPress: () => pasos.push("press"), onDragStart: () => pasos.push("inicio"), onDrag: () => pasos.push("drag") });

ev(zona, "pointerdown", 10, 10);
ev(document, "pointermove", 30, 30);
const enElActo = pasos.join();
await new Promise((r) => setTimeout(r, 50));
ev(document, "pointerup", 30, 30);

// prueba: enElActo === "press"
// prueba: pasos.join() === "press,inicio,drag"
```

Paginación por gestos, sin scroll real. Un bloqueo mientras dura la transición evita saltarse pantallas:

```js
const paneles = gsap.utils.toArray(".pantalla");
let actual = 0;
const estado = { animando: false };

const irA = (i) => {
  if (estado.animando || i < 0 || i >= paneles.length) return;
  estado.animando = true;
  gsap.to(paneles, {
    yPercent: -100 * i,
    duration: 0.05,
    onComplete: () => (estado.animando = false),
  });
  actual = i;
};

const pagina = Observer.create({
  type: "wheel,touch,pointer",
  wheelSpeed: -1,
  tolerance: 10,
  preventDefault: true,
  onUp: () => irA(actual + 1),
  onDown: () => irA(actual - 1),
});

irA(1);
window.pantallaActual = () => actual;

// prueba: pantallaActual() === 1
// prueba: gsap.getProperty(".pantalla", "yPercent") === -100
// prueba: pagina.isEnabled === true
```

## Trampas

- **Sin `preventDefault: true`, el scroll nativo sigue.** Si quieres paginar, además fija `overflow: hidden` en la página. [C] [P]
- **Un gesto dispara muchos callbacks.** Rueda de trackpad con inercia, sobre todo. Usa `tolerance`, un bloqueo como en el ejemplo, u `onStop` para desbloquear. [P]
- **`onDown`/`onUp` invertidos entre rueda y dedo,** ya que el dedo se mueve al revés que el scroll. Con `wheelSpeed: -1` se igualan. [O]
- **`type: "touch"` sin pantalla táctil** no escucha nada: los listeners de pulsación se añaden solo si hay soporte de toque, o con `pointer` en la lista. [C]
- **`debounce` afecta a todos los callbacks de delta,** no a `onPress`, `onRelease`, `onHover`, `onHoverEnd`, `onClick` ni `onDragEnd`. La documentación incluye en esa lista `onDragStart`, pero en el código se dispara dentro de la misma actualización diferida que `onDrag`. [C] [E]
- **`scrollSpeed` está documentado y lo lee el código, pero no está en los tipos.** En TypeScript da error de propiedad. Usa aserción de tipo. [C]
- **Accesibilidad.** Una página solo por gestos deja fuera al teclado. Añade flechas y controles visibles. [P]
- **Limpieza.** Un observer sigue vivo tras retirar la vista: llama a `kill()`, o créalo en `gsap.context()`. [C] [P]
