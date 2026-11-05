---
id: scr-observer-api
titulo: Observer, referencia completa de opciones y propiedades
capa: 07-scroll
tipo: referencia
ambito: Observer
resumen: Todas las opciones de ObserverVars, los callbacks, las propiedades de la instancia y los métodos estáticos de Observer.
api: [Observer.ObserverVars.allowClicks, Observer.ObserverVars.capture, Observer.ObserverVars.dragMinimum, Observer.ObserverVars.event, Observer.ObserverVars.ignore, Observer.ObserverVars.ignoreCheck, Observer.ObserverVars.lineHeight, Observer.ObserverVars.lockAxis, Observer.ObserverVars.onLockAxis, Observer.ObserverVars.onDisable, Observer.ObserverVars.onEnable, Observer.ObserverVars.onDrag, Observer.ObserverVars.onDragStart, Observer.ObserverVars.onDragEnd, Observer.ObserverVars.onHover, Observer.ObserverVars.onHoverEnd, Observer.ObserverVars.onToggleX, Observer.ObserverVars.onToggleY, Observer.ObserverVars.onChangeX, Observer.ObserverVars.onChangeY, Observer.ObserverVars.onClick, Observer.ObserverVars.onPress, Observer.ObserverVars.onRelease, Observer.ObserverVars.onMove, Observer.ObserverVars.onWheel, Observer.ObserverVars.onStop, Observer.ObserverVars.onStopDelay, Observer.isTouch, Observer.eventTypes, Observer.version, Observer.deltaX, Observer.deltaY, Observer.event, Observer.isDragging, Observer.isEnabled, Observer.isPressed, Observer.startX, Observer.startY, Observer.target, Observer.vars, Observer.velocityX, Observer.velocityY, Observer.x, Observer.y, Observer.axis, Observer.getAll, Observer.getById, Observer.disable, Observer.enable, Observer.kill, Observer.scrollX, Observer.scrollY]
requiere: [scr-observer]
relacionadas: [scr-normalize, int-draggable]
etiquetas: [scroll, gestos, referencia]
fuentes:
  - docs/v3/Plugins/Observer.md
  - docs/v3/Plugins/Observer/*
estado: verificado
version: 3.15.1
---
# Observer: referencia

Lo básico, con ejemplo, está en [scr-observer](scr-observer.md). Cada callback recibe la instancia.

## Opciones

| Clave | Por defecto | Efecto |
|---|---|---|
| `target`, `type`, `id`, `debounce`, `tolerance`, `wheelSpeed`, `preventDefault` | | Ver [scr-observer](scr-observer.md) |
| `scrollSpeed` | 1 | Multiplicador de eventos `scroll`. Documentado, ausente en los tipos [O] [C] |
| `dragMinimum` | 0 | Píxeles para considerar que se arrastra. Solo el primer movimiento tras pulsar [O] [E] |
| `lockAxis` | `false` | Fija el eje del primer arrastre hasta soltar [O] [E] |
| `ignore` | — | Elemento, selector o array cuyos eventos se ignoran [O] |
| `ignoreCheck` | — | `(evento, esPunteroOToque) => boolean`. Sin documentar: `true` descarta el evento [C] [E] |
| `capture` | `false` | Listeners en fase de captura [O] |
| `allowClicks` | `false` | Con `preventDefault`, deja pasar los clics [C] |
| `lineHeight` | la de `<body>`, o 22 | Convierte rueda en modo "líneas" a píxeles [C] |
| `event` | — | Evento pasado a `enable()` al iniciar, para arrancar a media pulsación [C] |
| `onStopDelay` | 0.25 | Segundos sin cambios para `onStop` [O] |

## Callbacks

| Callback | Cuándo |
|---|---|
| `onUp`, `onDown`, `onLeft`, `onRight` | Movimiento en ese sentido |
| `onChange`, `onChangeX`, `onChangeY` | Movimiento en un eje o en cualquiera |
| `onToggleX`, `onToggleY` | Cambio de sentido en ese eje |
| `onWheel` | Rueda |
| `onPress`, `onRelease` | Pulsar y soltar (`touch`, `pointer`) |
| `onClick` | Clic en el objetivo |
| `onDragStart`, `onDrag`, `onDragEnd` | Arrastre pulsando, sujeto a `dragMinimum` |
| `onMove` | Mover el puntero sobre el objetivo sin pulsar. Con él definido, los callbacks de movimiento se disparan también al pasar por encima [O] |
| `onHover`, `onHoverEnd` | Entrar y salir |
| `onLockAxis` | Se fija el eje con `lockAxis` |
| `onStop` | Fin de cambios tras `onStopDelay` |
| `onEnable`, `onDisable` | Al activar o desactivar |

## Propiedades de instancia

| Propiedad | Contenido |
|---|---|
| `deltaX`, `deltaY` | Cambio desde el último callback de ese eje [O] |
| `velocityX`, `velocityY` | px/s [O] |
| `x`, `y` | `clientX`, `clientY` del último evento de puntero o toque [O] |
| `startX`, `startY` | Coordenadas del último `onPress` [O] |
| `isPressed`, `isDragging`, `isEnabled` | Estados [O] |
| `axis` | `"x"` o `"y"` tras `lockAxis` [O] |
| `event` | Último evento [O] |
| `target`, `vars` | Elemento observado y configuración [O] |
| `scrollX`, `scrollY` | **Funciones** getter y setter del scroll del objetivo, no números [C] |

## Métodos

| Método | Efecto |
|---|---|
| `Observer.create(vars)` | Crea [O] |
| `Observer.getAll()` | Copia del array de observers, incluidos los internos de `normalizeScroll()` y `paused()` [O] [E] |
| `Observer.getById(id)` | Busca [O] |
| `obs.enable()`, `obs.disable()` | Añade o quita los listeners [O] |
| `obs.kill()` | Desactiva y elimina [O] |
| `Observer.isTouch` | 0, 1 o 2, como en ScrollTrigger [O] |
| `Observer.eventTypes` | Array con los nombres de evento en uso: pulsar, mover, cancelar y soltar [C] [E] |
| `Observer.version` | Versión |

## Ejemplo

Arrastre simulado con `PointerEvent`. `dragMinimum: 5` descarta el primer movimiento, y `lockAxis` fija el eje horizontal, por lo que la parte vertical se ignora:

```html
<div class="tablero" style="height:400px"></div>
```

```js
const tablero = document.querySelector(".tablero");
const puntero = (tipo, x, y) =>
  tablero.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: "mouse" }));

const pasos = [];
const obs = Observer.create({
  target: ".tablero",
  type: "pointer",
  debounce: false,
  dragMinimum: 5,
  lockAxis: true,
  onPress: (self) => pasos.push("press:" + self.startX + "," + self.isPressed),
  onDragStart: () => pasos.push("dragStart"),
  onDrag: (self) => pasos.push("drag:" + self.deltaX + "," + self.axis),
  onLockAxis: (self) => pasos.push("lock:" + self.axis),
  onChangeY: () => pasos.push("cambioY"),
  onDragEnd: () => pasos.push("dragEnd"),
  onRelease: (self) => pasos.push("release:" + self.isPressed),
});

puntero("pointerdown", 100, 100);
puntero("pointermove", 102, 100); // bajo dragMinimum
puntero("pointermove", 120, 103); // primer arrastre, sobre todo horizontal
puntero("pointermove", 130, 120); // la Y se ignora: eje fijado
puntero("pointerup", 130, 120);

// prueba: pasos[0] === "press:100,true"
// prueba: pasos.includes("dragStart") && pasos.includes("dragEnd")
// prueba: pasos.includes("lock:x")
// prueba: !pasos.includes("cambioY")
// prueba: pasos[pasos.length - 1] === "release:false"
// prueba: obs.axis === null || obs.axis === undefined || obs.axis === "x"
```

Ciclo de vida:

```js
const eventos = [];
const obs = Observer.create({
  target: ".tablero",
  id: "panel",
  onEnable: () => eventos.push("on"),
  onDisable: () => eventos.push("off"),
  ignoreCheck: (e, esPuntero) => false,
});
const enLista = Observer.getAll().includes(obs);

obs.disable();
const apagado = obs.isEnabled;
obs.enable();
obs.kill();

// prueba: enLista === true
// prueba: apagado === false
// prueba: eventos.join() === "on,off,on,off"
// prueba: Observer.getById("panel") === undefined
// prueba: typeof obs.scrollY === "function"
// prueba: Observer.eventTypes[0] === "pointerdown"
```

`onDragEnd` se ejecuta antes que `onRelease`, y en `onRelease` tanto `isPressed` como `isDragging` ya son `false`. Comprueba ahí el resultado del arrastre, no el estado. [E]

## Trampas

- **`self.scrollY` no es un número.** Llámala: `self.scrollY()`. [C]
- **`deltaY` no es el total del gesto,** sino lo acumulado desde el anterior callback de ese eje. Para el total, compara `y` con `startY`. [O]
- **`x` e `y` solo se actualizan con puntero o toque.** La rueda no los toca. [O]
- **`isDragging` sigue a `true` fuera del objetivo** hasta soltar. [O]
- **`allowClicks` y `preventDefault`.** Con `preventDefault` en un área con botones, los clics pueden perderse; usa `allowClicks: true` o `ignore`. [C] [P]
- **`onMove` activa los callbacks de movimiento sin pulsar:** `onChange` se llamará solo con mover el ratón. Si no quieres eso, no lo definas. [O]
- **`Observer.getAll()` incluye los observers internos** de `normalizeScroll()` y de `smoother.paused()`: `getAll().forEach(o => o.kill())` se los lleva por delante. Filtra por `id`. [E] [P]
- **`onGestureStart` y `onGestureEnd`** existen en el código, sin documentar ni tipar. No cuentes con ellos. [C]
