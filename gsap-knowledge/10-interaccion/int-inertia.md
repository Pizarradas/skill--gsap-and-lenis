---
id: int-inertia
titulo: InertiaPlugin, detenerse con inercia
capa: 10-interaccion
tipo: plugin
ambito: InertiaPlugin
resumen: Lleva cualquier propiedad numérica a reposo desde una velocidad inicial, con duración automática, límites y puntos de ajuste. Es lo que da el lanzamiento a Draggable.
api: [InertiaPlugin, InertiaPlugin.getVelocity, gsap.InertiaObject.min, gsap.InertiaObject.max, gsap.InertiaObject.end, gsap.InertiaObject.velocity, gsap.InertiaDuration.min, gsap.InertiaDuration.max, gsap.InertiaDuration.overshoot]
relacionadas: [int-velocitytracker, int-draggable, scr-observer]
etiquetas: [puntero, velocidad, fisica]
fuentes:
  - docs/v3/Plugins/InertiaPlugin.md
  - docs/v3/Plugins/InertiaPlugin/static.getVelocity().md
  - docs/v3/Plugins/InertiaPlugin/static.isTracking().md
  - docs/v3/Plugins/InertiaPlugin/static.track().md
  - docs/v3/Plugins/InertiaPlugin/static.untrack().md
estado: verificado
version: 3.15.1
---
# InertiaPlugin

Hace que una propiedad continúe a una velocidad dada y se detenga con suavidad, eligiendo sola dónde y en cuánto tiempo. Antes se llamaba ThrowPropsPlugin. A diferencia de un bucle físico por fotogramas, el resultado es un tween normal: reversible y con búsqueda libre. [O]

## Para qué sirve

Lanzar con [Draggable](int-draggable.md), frenar scroll propio, ruedas que giran y paran en un sector, o cualquier transición desde un movimiento en curso a un valor estable.

## Registro

```js fragmento
import gsap from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";

gsap.registerPlugin(InertiaPlugin);
```

**Sin empaquetador:** `<script>` con `dist/InertiaPlugin.min.js` (global `InertiaPlugin`), o entrada `gsap/InertiaPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

```text
gsap.to(obj, { inertia: { x: 500, y: { velocity: -300, min: 0, max: 720 } } })
```

Por propiedad: un número (velocidad en unidades por segundo), `"auto"` si se rastrea, o un objeto:

| Clave | Efecto |
|---|---|
| `velocity` | Número o `"auto"`. Si se omite, usa el valor rastreado [O] |
| `min` `max` | Límites del **valor final**, no de la velocidad [O] |
| `end` | Número, array de puntos o función `(valorNatural) → valor` [O] |

Dentro de `inertia`, sin ser propiedades:

| Clave | Efecto |
|---|---|
| `duration` | Número exacto u objeto `{ min, max, overshoot }`. Defecto 0.2–10 s, `overshoot` 1 [C] [E] |
| `resistance` | Fricción por segundo. Más alta, para antes [O] [E] |
| `linkedProps` | `"x,y"`: `end` recibe y devuelve un objeto con ambas [O] |
| `preventOvershoot` | Sin tipar: equivale a `overshoot: 0` [C] |

Métodos: `InertiaPlugin.track()`, `untrack()`, `isTracking()`, `getVelocity()` y `getByTarget()`, descritos en [int-velocitytracker](int-velocitytracker.md).

## Ejemplo

La duración se calcula al iniciarse el tween, por lo que hay que forzar el primer render antes de saltar al final:

```js
const bola = { x: 0 };
const t = gsap.to(bola, { inertia: { x: { velocity: 500, max: 100 } }, paused: true });
const alCrear = t.duration();
t.progress(0.001);
const calculada = t.duration();
t.progress(1);
// prueba: alCrear === 0.5
// prueba: calculada > 0.5
// prueba: Math.round(bola.x) === 100
```

Ajustar a una lista de puntos, a una función y a dos propiedades enlazadas. Con la lista gana el punto más cercano al final natural, que aquí ronda 670:

```js
const a = { x: 0 };
const sector = gsap.to(a, { inertia: { x: { velocity: 500, end: [0, 50, 1000] } }, paused: true });
sector.progress(0.001).progress(1);

const b = { x: 0 };
const paso = gsap.to(b, { inertia: { x: { velocity: 500, end: (v) => Math.round(v / 70) * 70 } }, paused: true });
paso.progress(0.001).progress(1);

const c = { x: 0, y: 0 };
const destino = () => ({ x: 10, y: 20 });
const par = gsap.to(c, {
  inertia: { linkedProps: "x,y", x: { velocity: 300, end: destino }, y: { velocity: 100, end: destino } },
  paused: true,
});
par.progress(0.001).progress(1);
// prueba: Math.round(a.x) === 1000
// prueba: Math.round(b.x) % 70 === 0
// prueba: Math.round(c.x) === 10 && Math.round(c.y) === 20
```

Duración controlada y sin rebote:

```js
const d = { x: 0 };
const fija = gsap.to(d, { inertia: { x: 500, duration: 1 }, paused: true });
fija.progress(0.001);

const e = { x: 0 };
const rango = gsap.to(e, { inertia: { x: 500, duration: { min: 2, max: 3 } }, paused: true });
rango.progress(0.001);

const f = { x: 0 };
const seco = gsap.to(f, { inertia: { x: { velocity: 500, max: 10 }, duration: { max: 1, overshoot: 0 } }, paused: true });
seco.progress(0.001).progress(0.5);
// prueba: fija.duration() === 1
// prueba: rango.duration() === 3
// prueba: f.x <= 10
```

Con Draggable, el destino se conoce al soltar, antes de que termine:

```html
<style>#disco { position: absolute; left: 0; top: 0; width: 50px; height: 50px; }</style>
<div id="disco"></div>
```

```js
const ev = (t, tipo, x, y) => t.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", buttons: 1 }));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const disco = document.querySelector("#disco");
let acabado = 0;
const d = Draggable.create(disco, {
  inertia: true,
  bounds: { minX: 0, maxX: 300 },
  snap: { x: (v) => Math.round(v / 100) * 100 },
  maxDuration: 0.3,
  minDuration: 0.1,
  overshootTolerance: 0,
  onThrowComplete() { acabado++; },
})[0];

ev(disco, "pointerdown", 10, 10);
await espera(20);
for (let i = 1; i <= 6; i++) {
  ev(document, "pointermove", 10 + i * 20, 10);
  await espera(20);
}
ev(document, "pointerup", 130, 10);
await espera(10);
const lanzando = d.isThrowing;
const destino = d.endX;
const velocidad = InertiaPlugin.getVelocity(disco, "x");
await espera(420);
window.dx = d.x;
// prueba: lanzando === true && velocidad > 0
// prueba: destino % 100 === 0
// prueba: dx === destino && acabado === 1
```

## Trampas

- **`duration` va dentro de `inertia`.** Si la pones como `duration` del tween se ignora: se sobrescribe con la calculada. [E]
- **`progress(1)` antes de iniciar da un valor erróneo.** El tween arranca con duración 0.5 y al inicializarse cambia. En un tween pausado, llama antes a `progress(0.001)`. [E]
- **Sin velocidad y sin rastreo** avisa `No velocity was defined`. Rastrea primero con `track()`. [C]
- **`inertia: "auto"` sin rastreo** avisa `No inertia tracking on…` y no anima. [C]
- **Solo datos reales.** No se puede rastrear `autoAlpha`, `scrollTo` ni `physics2D`, porque no son propiedades del objetivo. [O]
- **Ease fijo.** Usa internamente una curva `power3`. El `ease` del tween no afecta. [C]
- **Sobrepasar los límites.** Por defecto se permite un rebote suave si la velocidad supera `max`. Con `overshoot: 0` se detiene sin pasarse, pero queda menos natural. [O] [P]
