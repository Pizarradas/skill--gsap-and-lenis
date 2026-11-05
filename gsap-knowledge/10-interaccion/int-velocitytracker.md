---
id: int-velocitytracker
titulo: VelocityTracker, medir la velocidad de propiedades
capa: 10-interaccion
tipo: api
ambito: VelocityTracker
resumen: Rastrea la velocidad de cualquier propiedad numérica en cada tick. Base de inertia con velocity auto, y accesible desde InertiaPlugin sin importar nada más.
api: [VelocityTracker, gsap.VelocityTrackerInstance.target, gsap.VelocityTrackerInstance.add, gsap.VelocityTrackerInstance.kill, gsap.VelocityTrackerInstance.remove, gsap.VelocityTrackerInstance.getAll, gsap.VelocityTrackerInstance.get, gsap.VelocityTrackerStatic.getByTarget, gsap.VelocityTrackerStatic.getVelocity, gsap.VelocityTrackerStatic.isTracking, gsap.VelocityTrackerStatic.track, gsap.VelocityTrackerStatic.untrack]
requiere: [int-inertia]
relacionadas: [int-inertia, int-draggable, nuc-ticker]
etiquetas: [velocidad, puntero]
fuentes:
  - docs/v3/Plugins/InertiaPlugin/VelocityTracker.md
  - docs/v3/Plugins/InertiaPlugin/VelocityTracker/*
estado: verificado
version: 3.15.1
---
# VelocityTracker

Registra los dos últimos valores de una propiedad con sus marcas de tiempo, en cada tick de GSAP, y calcula su velocidad. Viene dentro de InertiaPlugin, que expone sus estáticos, así que casi nunca hay que importarlo aparte. [O]

## Firma

```text
InertiaPlugin.track(objetivos, "x,y", tipos?) → VelocityTrackerInstance[]
InertiaPlugin.untrack(objetivos, props?)
InertiaPlugin.isTracking(objetivo, prop) → boolean
InertiaPlugin.getVelocity(objetivo, prop) → number
InertiaPlugin.getByTarget(objetivo) → VelocityTrackerInstance
```

Los mismos estáticos existen en `VelocityTracker`, importable desde `gsap/utils/VelocityTracker`. `tipos` es `"num"`, `"deg"` o `"rad"`, y sirve para no contar como salto un giro que cruza 360°. [C]

Instancia:

| Miembro | Efecto |
|---|---|
| `target` | Objeto rastreado |
| `get(prop)` | Velocidad en unidades por segundo |
| `getAll()` | `{ prop: velocidad }` de todas |
| `add(prop, tipo?)` | Añade, o reinicia si ya existe |
| `remove(prop)` | Deja de rastrear esa propiedad |
| `kill(shallow?)` | Quita todas; sin `shallow`, también del registro |

El constructor (`new` con `prototype` y `register` en la interfaz `gsap.VelocityTracker`) existe, pero se desaconseja: debe haber un único rastreador por objeto, y `track()` lo garantiza. [O] [C]

## Ejemplo

`InertiaPlugin` hereda estos estáticos de `VelocityTrackerStatic`, de modo que `VelocityTracker.track()` e `InertiaPlugin.track()` son la misma función. [C] [E]

```js
import { VelocityTracker } from "gsap/utils/VelocityTracker";

const movil = { x: 0 };
const rastreador = VelocityTracker.track(movil, "x")[0];
const siSigue = VelocityTracker.isTracking(movil, "x");
const sinNombre = VelocityTracker.isTracking(movil);
const mismaFuncion = InertiaPlugin["track"] === VelocityTracker.track;

gsap.to(movil, { x: 1000, duration: 1, ease: "none" });
await new Promise((r) => setTimeout(r, 250));

const v = VelocityTracker.getVelocity(movil, "x");
const todas = rastreador.getAll();
gsap.killTweensOf(movil);
const antes = movil.x;

const frenar = gsap.to(movil, { inertia: { x: "auto" }, paused: true });
frenar.progress(0.001).progress(1);
const despues = movil.x;

VelocityTracker.untrack(movil, "x");
// prueba: siSigue === true && sinNombre === false && mismaFuncion === true
// prueba: Math.abs(v - 1000) < 100 && Math.abs(todas.x - 1000) < 100
// prueba: rastreador.target === movil
// prueba: VelocityTracker.getByTarget(movil) === rastreador
// prueba: despues > antes
// prueba: VelocityTracker.isTracking(movil, "x") === false
```

Propiedades con función, tanto métodos directos como pares `getX()` y `setX()`, también funcionan. [O]

```js
const leer = {
  _v: 0,
  nivel(v) { if (arguments.length) this._v = v; return this._v; },
};
const pista = VelocityTracker.track(leer, "nivel")[0];
gsap.to(leer, { nivel: 100, duration: 0.5, ease: "none" });
await new Promise((r) => setTimeout(r, 200));
const velocidad = pista.get("nivel");
// prueba: velocidad > 0
```

## Trampas

- **Nombres antiguos en la documentación.** Las páginas de instancia hablan de `addProp()`, `removeProp()` e `isTrackingProp()`. En 3.15.1 esos métodos no existen: son `add()`, `remove()` e `isTracking()`. [C]
- **`track()` devuelve un array,** aunque la página de `.track` hable de un objeto. `getByTarget()` da `undefined`, no `null`, si no hay rastreador. [C]
- **Espera 100 ms y dos ticks** antes de leer: con menos datos no hay velocidad fiable. [O]
- **Es de consumo.** Mientras haya propiedades rastreadas se ejecuta en cada tick. Llama a `untrack()` al acabar. [O]
- **`isTracking(objetivo)` sin propiedad da `false`,** aunque el objetivo esté rastreado. La documentación indica lo contrario y los tipos marcan la propiedad como opcional. Pásala siempre, o usa `getByTarget()`. [E]
- **`getVelocity` de algo no rastreado** avisa `Not tracking velocity of…` y devuelve `undefined`. [E]
- **`untrack(obj)` sin propiedades** deja la instancia en el registro: `getByTarget()` la sigue devolviendo, ya sin propiedades. [E]
