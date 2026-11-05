---
id: nuc-callbacks
titulo: Callbacks y eventCallback
capa: 02-nucleo
tipo: api
ambito: core
resumen: onStart, onUpdate, onComplete, onRepeat, onReverseComplete y onInterrupt, sus parámetros, this, callbackScope y cuándo se disparan de verdad.
api: [gsap.CallbackVars.callbackScope, gsap.CallbackVars.onComplete, gsap.CallbackVars.onCompleteParams, gsap.CallbackVars.onRepeat, gsap.CallbackVars.onRepeatParams, gsap.CallbackVars.onReverseComplete, gsap.CallbackVars.onReverseCompleteParams, gsap.CallbackVars.onStart, gsap.CallbackVars.onStartParams, gsap.CallbackVars.onUpdate, gsap.CallbackVars.onUpdateParams, gsap.TweenVars.onInterrupt, gsap.TweenVars.onInterruptParams, Animation.eventCallback]
relacionadas: [nuc-control, nuc-promesas, nuc-context, nuc-limpieza, nuc-overwrite, nuc-delayedcall]
etiquetas: [callbacks, eventos]
fuentes:
  - docs/v3/GSAP/Tween/eventCallback().md
  - resources/getting-started/control.md
  - docs/v3/GSAP/gsap.to().md
estado: verificado
version: 3.15.1
---
# Callbacks

Funciones que GSAP llama en momentos del ciclo de vida de una animación. Se declaran en `vars` o, después de crearla, con `eventCallback()`. [O]

## Firma

```text
vars: onStart, onUpdate, onComplete, onRepeat, onReverseComplete, onInterrupt
      + onStartParams, onUpdateParams, ... (array)   + callbackScope (this)
anim.eventCallback(tipo)                         → función actual
anim.eventCallback(tipo, fn | null, params?)     → anim
```

| Callback | Se dispara cuando |
|---|---|
| `onStart` | El tiempo pasa de 0 a otro valor. **Puede repetirse**: tras `restart()` o volver a 0 [O] [E] |
| `onUpdate` | En cada render que mueve el cabezal [O] |
| `onRepeat` | Empieza una nueva repetición [O] |
| `onComplete` | El cabezal llega al final. En un tween cuenta la posición, no el sentido: `progress(1)` lo dispara aunque esté invertido [C] [E] |
| `onReverseComplete` | El cabezal vuelve a 0 desde otro punto. No exige `reverse()`: `progress(0)` lo dispara sin invertir [C] [E] |
| `onInterrupt` | Se destruye antes de completarse: `kill()`, `revert()`, `overwrite` o `ctx.revert()`. `tl.kill()` no lo dispara en los hijos de esa timeline [O] [C] [E] |

Por defecto, `this` es la animación en funciones normales. `callbackScope` lo cambia para **todos** los callbacks de esa animación. [O] [C]

### Qué mueve el cabezal sin disparar nada

| Método | Dispara callbacks por defecto |
|---|---|
| `seek()`, `pause(t)`, `play(t)`, `reverse(t)`, `restart()` | **No** (`suppressEvents` es `true`) [O] [E] |
| `time()`, `totalTime()`, `progress()`, `totalProgress()` | **Sí** (`suppressEvents` es `false`) [O] [E] |

## Ejemplo

```js
const registro = [];
const tween = gsap.to({ x: 0 }, {
  x: 1,
  duration: 0.05,
  repeat: 1,
  repeatDelay: 0.01,
  callbackScope: { nombre: "panel" },
  onStart() { registro.push("inicio:" + this.nombre); },
  onRepeat() { registro.push("repite"); },
  onComplete(a, b) { registro.push("fin:" + (a + b)); },
  onCompleteParams: [1, 2],
});

// prueba: registro.join() === "inicio:panel,repite,fin:3"
```

`seek()` calla; `progress()` y `time()`, no:

```js
const eventos = [];
const t = gsap.to({ x: 0 }, {
  x: 1,
  duration: 1,
  paused: true,
  onStart() { eventos.push("s"); },
  onComplete() { eventos.push("c"); },
});

t.seek(1);
const trasSeek = eventos.length;
t.seek(0);
t.progress(1);
const trasProgress = eventos.join();

// prueba: trasSeek === 0
// prueba: trasProgress === "s,c"
```

Gestionar callbacks tras la creación:

```js
const o = { x: 0 };
const anim = gsap.to(o, { x: 1, duration: 0.05, onComplete() {} });
const leido = typeof anim.eventCallback("onComplete");
anim.eventCallback("onComplete", null);
const borrado = anim.eventCallback("onComplete");

const avisos = { n: 0 };
anim.eventCallback("onUpdate", () => avisos.n++);

// prueba: leido === "function"
// prueba: borrado === undefined
// prueba: avisos.n > 0
```

`onInterrupt` se dispara también con `revert()`, cosa que la documentación no menciona:

```js
const lista = [];
const cortado = gsap.to({ x: 0 }, { x: 1, duration: 0.5, onInterrupt() { lista.push("int"); } });
await new Promise((r) => setTimeout(r, 40));
cortado.revert();

// prueba: lista.join() === "int"
```

Lo que confirma las tablas y las trampas de esta ficha:

```js
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const pasos = [];
const directo = gsap.to({ a: 0 }, {
  a: 1,
  duration: 1,
  paused: true,
  onComplete() { pasos.push("fin"); },
  onReverseComplete() { pasos.push("inicio"); },
});
directo.progress(0.5);
directo.progress(0);
const sinInvertir = [pasos.join(), directo.reversed()];
pasos.length = 0;
directo.reverse();
directo.pause();
directo.progress(1);
const invertido = [pasos.join(), directo.reversed()];

let inicios = 0;
const repetido = gsap.to({ a: 0 }, { a: 1, duration: 0.02, onStart() { inicios++; } });
await espera(80);
repetido.restart();
await espera(80);

const interrumpidos = [];
const el = document.querySelector(".pieza");
gsap.to(el, { x: 100, duration: 1, onInterrupt() { interrumpidos.push("overwrite"); } });
gsap.to(el, { x: 0, duration: 1, overwrite: true });
gsap.context(() => {
  gsap.to({ a: 0 }, { a: 1, duration: 1, onInterrupt() { interrumpidos.push("contexto"); } });
}).revert();
const cortado = gsap.to({ a: 0 }, { a: 1, duration: 1, onComplete() { interrumpidos.push("completo"); } });
cortado.kill();
const padre = gsap.timeline();
padre.to({ a: 0 }, { a: 1, duration: 1, onInterrupt() { interrumpidos.push("hijo"); } });
padre.kill();

let conTime = 0;
const manual = gsap.to({ a: 0 }, { a: 1, duration: 1, paused: true, onUpdate() { conTime++; } });
manual.pause(0.5);
const trasPausa = conTime;
manual.time(0.6);

let tardio = 0;
const breve = gsap.to({ a: 0 }, { a: 1, duration: 0.01 });
await espera(50);
breve.eventCallback("onComplete", () => tardio++);

const orden = [];
gsap.set({ a: 0 }, { a: 1, onComplete() { orden.push("set"); } });
gsap.delayedCall(0, () => orden.push("delayedCall"));
const alCrear = orden.join();

let creada;
const ctx = gsap.context(() => {
  gsap.to({ a: 0 }, { a: 1, duration: 0.01, onComplete() { creada = gsap.to({ b: 0 }, { b: 1 }); } });
});
await espera(60);

let visto;
const flecha = gsap.to({ a: 0 }, { a: 1, duration: 0.01, onComplete: () => { visto = this; } });
await espera(60);

// prueba: sinInvertir.join() === "inicio,false"
// prueba: invertido.join() === "fin,true"
// prueba: inicios === 2
// prueba: interrumpidos.join() === "overwrite,contexto"
// prueba: trasPausa === 0 && conTime === 1
// prueba: tardio === 0
// prueba: alCrear === "set" && orden.join() === "set,delayedCall"
// prueba: ctx.getTweens().includes(creada)
// prueba: visto !== flecha
```

## Trampas

- **Solo hay uno de cada tipo.** Un segundo `eventCallback("onComplete", fn)` sustituye al anterior. Para varios oyentes, llama a todos desde uno, o encadena promesas. [O]
- **`onComplete` añadido tras terminar** no se dispara: no hay disparo retroactivo. Comprueba `progress() === 1`. [E]
- **`onComplete` y `kill()`.** Un tween destruido nunca completa. Para limpiar pase lo que pase, usa `onInterrupt` además de `onComplete`. [O] [E]
- **Arrow function y `this`.** En una arrow `this` no es la animación. Si necesitas `this.progress()` o `this.targets()`, usa `function` o la forma de método. [C] [E]
- **`onComplete: miFuncion()`.** Con paréntesis la ejecutas al crear el tween: pasa la referencia. [O]
- **Lógica pesada en `onUpdate`.** Corre en cada frame: evita medir layout o crear objetos. [P]
- **`onUpdate` y `suppressEvents`.** Con movimiento manual y supresión, tus sincronizaciones se saltan. Usa `.progress(v)` o `.time(v)` si dependes de ellas. [E]
- **Duración 0.** En `gsap.set()` y `delayedCall` con duración cero el `onComplete` puede ser síncrono o no: en `set()` se dispara al crearse, en `delayedCall(0, ...)` en el siguiente tick. [E]
- **Crear animaciones en un callback** dentro de un `gsap.context()` las añade a ese contexto automáticamente. Ver [context](nuc-context.md). [C] [E]
