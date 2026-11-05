---
id: nuc-promesas
titulo: Promesas y await con animaciones
capa: 02-nucleo
tipo: api
ambito: core
resumen: Esperar animaciones con then y await, y los casos en que la promesa no se resuelve nunca - kill, revert y repeat infinito.
api: [Animation.then]
relacionadas: [nuc-callbacks, nuc-limpieza, nuc-context, tim-basico]
etiquetas: [promesas, async]
fuentes:
  - docs/v3/GSAP/Tween/then().md
estado: verificado
version: 3.15.1
---
# Promesas y await

Toda animación es *thenable*: `then()` devuelve una promesa que se resuelve al completarse, y por tanto `await tween` funciona. Es una alternativa a `onComplete` cuando el flujo es asíncrono. [O] [C]

## Firma

```text
animacion.then(callback?) → Promise     se resuelve con lo que devuelva callback, o con la animación
await animacion                         → la animación
```

| Caso | ¿Se resuelve? |
|---|---|
| Llega al final | Sí [O] [E] |
| Ya estaba completa | Sí, enseguida [C] [E] |
| Vuelve al inicio con `reverse()` | Sí [C] [E] |
| Varios `then()` | Se resuelven todos [C] [E] |
| Tween `delayedCall`, Timeline | Sí [E] |
| `kill()` | **Nunca** [E] |
| `revert()` o `ctx.revert()` | **Nunca** [E] |
| `repeat: -1` | **Nunca** [E] |
| En pausa | No, mientras siga en pausa [C] |

## Ejemplo

```js
const o = { x: 0 };
const paso = gsap.to(o, { x: 1, duration: 0.05 });
const mismo = await paso;

const valor = await gsap.to(o, { x: 2, duration: 0.05 }).then((t) => t.progress());

await Promise.all([
  gsap.to(o, { x: 3, duration: 0.05 }),
  gsap.timeline().to({ y: 0 }, { y: 1, duration: 0.05 }),
]);

// prueba: mismo === paso
// prueba: valor === 1
// prueba: o.x === 3
```

La promesa queda pendiente para siempre tras destruir la animación:

```js
const estado = { kill: false, revert: false };
const a = gsap.to({ x: 0 }, { x: 1, duration: 0.3 });
const b = gsap.to({ x: 0 }, { x: 1, duration: 0.3 });
a.then(() => { estado.kill = true; });
b.then(() => { estado.revert = true; });

await new Promise((r) => setTimeout(r, 30));
a.kill();
b.revert();

await new Promise((r) => setTimeout(r, 400));

// prueba: estado.kill === false
// prueba: estado.revert === false
```

Patrón para no quedar colgado: resolver también por interrupción.

```js
const hastaFin = (anim) =>
  new Promise((resolver) => {
    anim.eventCallback("onComplete", () => resolver("completa"));
    anim.eventCallback("onInterrupt", () => resolver("interrumpida"));
  });

const t = gsap.to({ x: 0 }, { x: 1, duration: 0.3 });
const espera = hastaFin(t);
await new Promise((r) => setTimeout(r, 30));
t.kill();
const resultado = await espera;

// prueba: resultado === "interrumpida"
```

## Trampas

- **`await` que nunca vuelve.** Una función `async` que espera un tween se queda colgada para siempre si un `revert()` lo destruye, por ejemplo al retirar la vista. No lanza error: el código siguiente, simplemente, no corre. Usa el patrón de arriba si puede interrumpirse. [E]
- **`await` dentro de `gsap.context()`.** Tras el `await` el contexto deja de grabar: ver [context](nuc-context.md). Para secuencias, un timeline es más seguro. [C] [E]
- **Secuenciar con `await`.** Pierdes `pause()`, `reverse()` y `seek()` del conjunto. Si son solo animaciones, usa un [timeline](nuc-control.md); `await` compensa cuando hay lógica entre pasos. [P]
- **`repeat: -1`.** Usa `onRepeat`. [E]
- **`then` temporalmente nulo.** Mientras se resuelve, GSAP pone `animation.then = null` para evitar un bucle con el protocolo de promesas. No afecta al uso normal. [C]
- **`Promise.all` mezclado con tweens infinitos** nunca se cumple. Usa `Promise.race` o excluye esos. [P]
