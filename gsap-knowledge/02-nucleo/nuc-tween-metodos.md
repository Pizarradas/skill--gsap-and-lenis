---
id: nuc-tween-metodos
titulo: Crear tweens - to, from, fromTo, set y la clase Tween
capa: 02-nucleo
tipo: api
ambito: core
resumen: Firmas de gsap.to, from, fromTo y set, miembros propios de Tween y qué método elegir en cada caso.
api: [gsap.to, gsap.from, gsap.fromTo, gsap.set, gsap.timeline, Tween.to, Tween.from, Tween.fromTo, Tween.set, Tween.staggerTo, Tween.staggerFrom, Tween.staggerFromTo, Tween.targets, Tween.vars, Tween.data, Tween.ratio, Tween.kill, Tween.resetTo, Animation.data, Animation.scrollTrigger, Animation.version]
relacionadas: [fun-modelo, fun-objetivos, fun-valores, nuc-vars-especiales, nuc-immediate-render, nuc-quickto, nuc-quicksetter, nuc-control, nuc-limpieza, tim-basico]
etiquetas: [tween, to, from, fromto, set]
fuentes:
  - docs/v3/GSAP/gsap.to().md
  - docs/v3/GSAP/gsap.from().md
  - docs/v3/GSAP/gsap.fromTo().md
  - docs/v3/GSAP/gsap.set().md
  - docs/v3/GSAP/gsap.timeline().md
  - docs/v3/GSAP/Tween.md
  - docs/v3/GSAP/Tween/data.md
  - docs/v3/GSAP/Tween/ratio.md
  - docs/v3/GSAP/Tween/targets().md
  - docs/v3/GSAP/Tween/vars.md
  - docs/v3/GSAP/Tween/scrollTrigger.md
estado: verificado
version: 3.15.1
---
# Crear tweens

Un tween se crea con cuatro métodos del objeto `gsap`; todos devuelven una instancia de `Tween`. `gsap.timeline()` devuelve un `Timeline`, que se cubre en `tim-basico`. [O]

## Firma

```text
gsap.to(targets, vars)                 → Tween   del estado actual a vars
gsap.from(targets, vars)               → Tween   de vars al estado actual
gsap.fromTo(targets, fromVars, toVars) → Tween   de fromVars a toVars
gsap.set(targets, vars)                → Tween   aplica ya, duración 0
gsap.timeline(vars?)                   → Timeline
```

| Necesidad | Método |
|---|---|
| Ir a un destino desde donde esté | `gsap.to()` |
| Dejar el HTML y CSS en su estado final y entrar desde fuera | `gsap.from()` |
| Inicio y fin exactos, sobre todo si puede reinterrumpirse | `gsap.fromTo()` |
| Estado inicial sin animar | `gsap.set()` |
| Muchos cambios por segundo | [quickTo](nuc-quickto.md) o [quickSetter](nuc-quicksetter.md) |

`vars` mezcla propiedades a animar y [propiedades especiales](nuc-vars-especiales.md). En `fromTo()`, las especiales (`duration`, `ease`, `delay`, callbacks) van **solo en `toVars`**. [O]

### Miembros propios de Tween

Además de lo heredado de `Animation` ([control](nuc-control.md) y [tiempo](nuc-tiempo.md)):

| Miembro | Devuelve |
|---|---|
| `tween.targets()` | Array de objetivos ya resueltos [O] |
| `tween.vars` | El objeto de configuración; los setters como `eventCallback()` escriben aquí [O] |
| `tween.data` | Lo que pasaste en `vars.data`, y un sitio libre para guardar lo tuyo [O] |
| `tween.ratio` | Progreso **tras** el ease, solo lectura; puede salir de 0-1 con `back` o `elastic` [O] |
| `tween.scrollTrigger` | La instancia ScrollTrigger; `undefined` si el tween no tiene [O] [E] |
| `tween.resetTo(prop, valor, inicio?, inicioRelativo?)` | Reorienta el tween; lo usa `gsap.quickTo()` [C] |
| `tween.kill(target?, props?)` | Ver [limpieza](nuc-limpieza.md) [O] |

La clase está en `gsap.core.Tween`, con los estáticos `to`, `from`, `fromTo` y `set` equivalentes a los de `gsap`. Los estáticos `staggerTo`, `staggerFrom` y `staggerFromTo` son heredados de versiones antiguas: devuelven un `Timeline` y usan la firma con duración como segundo argumento. Usa `stagger` en `vars`. [C] [E]

## Ejemplo

```js
gsap.set(".marca", { opacity: 0.5 });
const entra = gsap.to(".marca", { x: 120, opacity: 1, duration: 0.2, ease: "power2.out" });
const sube = gsap.from(".lema", { y: 30, duration: 0.2 });
const exacto = gsap.fromTo(".cifra", { scale: 0.5 }, { scale: 1, duration: 0.2 });

// prueba: gsap.getProperty(".marca", "x") === 120
// prueba: gsap.getProperty(".lema", "y") === 0
// prueba: gsap.getProperty(".cifra", "scaleX") === 1
// prueba: entra instanceof gsap.core.Tween
// prueba: entra.scrollTrigger === undefined
```

`ratio` frente a `progress()`, y la duración de `fromVars` que se ignora:

```js
const curva = gsap.to({ v: 0 }, { v: 10, duration: 1, ease: "power2.out", paused: true });
curva.pause(0.5);

const ignorada = gsap.fromTo({ v: 0 }, { v: 1, duration: 5 }, { v: 2, duration: 0.1, paused: true });

// prueba: curva.progress() === 0.5
// prueba: curva.ratio === 0.875
// prueba: ignorada.duration() === 0.1
```

Callbacks en `fromVars`, `from()` relanzado, `set()` en timeline y estáticos heredados:

```js
const eventos = [];
gsap.fromTo({ v: 0 }, { v: 1, onComplete() { eventos.push("desde"); } }, { v: 2, duration: 0.02, onComplete() { eventos.push("hasta"); } });

const valor = { a: 100 };
gsap.from(valor, { a: 0, duration: 0.1, ease: "none" });
await new Promise((r) => setTimeout(r, 40));
const medio = valor.a;
gsap.from(valor, { a: 0, duration: 0.02, ease: "none", overwrite: true });

const fijo = { x: 5 };
gsap.timeline({ paused: true }).set(fijo, { x: 0 });

const antiguo = gsap.core.Tween.staggerTo([{ a: 0 }], 1, { a: 1 }, 0.1);

await new Promise((r) => setTimeout(r, 150));

// prueba: eventos.includes("desde") && eventos.at(-1) === "hasta"
// prueba: medio > 0 && medio < 100 && valor.a === medio
// prueba: fijo.x === 5
// prueba: antiguo instanceof gsap.core.Timeline
```

## Trampas

- **Especiales en `fromVars`.** `duration`, `delay` y `ease` no tienen efecto: salen de `toVars`. Los callbacks sí se ejecutan, porque `fromVars` genera un `set` interno: un `onComplete` ahí se dispara al arrancar, incluso más de una vez. [C] [E]
- **`from()` interrumpido y relanzado.** El destino se lee del estado actual, así que un segundo `from()` a mitad de camino acaba en un valor intermedio (ver [immediateRender](nuc-immediate-render.md)). Para animaciones repetibles, `fromTo()`. [O] [E]
- **`set()` dentro de un timeline** no se aplica al crearlo, sino cuando el cabezal llega a su posición. Ver [immediateRender](nuc-immediate-render.md). [E]
- **`set()` en bucles rápidos.** Crea un tween por llamada. Para `pointermove`, usa [quickSetter](nuc-quicksetter.md). [O]
- **Firma antigua.** `gsap.to(el, 1, { x: 100 })` todavía funciona pero está obsoleta. Pon `duration` en `vars`. [C]
- **`gsap.to()` no reutiliza nada.** Si creas muchos tweens sobre lo mismo, entran en conflicto: ver [overwrite](nuc-overwrite.md). [P]
- **`vars` se modifica internamente.** GSAP guarda ahí valores como `parent` o `immediateRender`. No reutilices el mismo objeto `vars` para varios tweens si esperas que quede intacto; crea uno por llamada. [C] [P]
