---
id: nuc-ticker
titulo: gsap.ticker - el bucle de GSAP
capa: 02-nucleo
tipo: api
ambito: core
resumen: Añadir lógica por frame, parámetros del listener, prioridad, fps, deltaRatio, lagSmoothing, sleep y wake.
api: [gsap.ticker.add, gsap.ticker.remove, gsap.ticker.fps, gsap.ticker.frame, gsap.ticker.time, gsap.ticker.lagSmoothing, gsap.ticker.sleep, gsap.ticker.tick, gsap.ticker.deltaRatio, gsap.ticker.wake]
relacionadas: [fun-modelo, nuc-global, nuc-quicksetter, nuc-context, nuc-defaults-config, cal-rendimiento, scr-smoother]
etiquetas: [ticker, frame, rendimiento, lag]
fuentes:
  - docs/v3/GSAP/gsap.ticker.md
estado: verificado
version: 3.15.1
---
# gsap.ticker

El ticker es el latido de GSAP: en cada `requestAnimationFrame` avanza la línea de tiempo raíz y llama a los listeners añadidos. Usarlo para tu lógica por frame te mantiene sincronizado con las animaciones, sin un segundo bucle. [O]

## Firma

```text
gsap.ticker.add(fn, once = false, prioridad = false) → función registrada
gsap.ticker.remove(fn)
gsap.ticker.fps(n)   gsap.ticker.lagSmoothing(umbralMs, ajusteMs)   gsap.ticker.deltaRatio(fps = 60)
gsap.ticker.sleep()  gsap.ticker.wake()  gsap.ticker.tick()
gsap.ticker.time     gsap.ticker.frame
fn(time, deltaTime, frame, cuarto)
```

| Parámetro de `fn` | Valor |
|---|---|
| `time` | Segundos desde el inicio. Lo ajusta el suavizado de lag [O] |
| `deltaTime` | Milisegundos desde el tick anterior [O] |
| `frame` | Contador de ticks [O] |
| cuarto | Lo que recibe el tick: con rAF, el `DOMHighResTimeStamp`. Los tipos lo llaman `elapsed`, pero no es un tiempo transcurrido [C] |

| Miembro | Uso |
|---|---|
| `add(fn, true)` | Una sola vez. Devuelve un envoltorio [O] [E] |
| `add(fn, false, true)` | Se ejecuta **antes** que la actualización de GSAP [O] [E] |
| `fps(n)` | Limita **por debajo** del refresco nativo; no puede superarlo. `fps(0)` vuelve al tope interno de 240 [O] [C] |
| `deltaRatio(fps)` | Tiempo real del frame respecto al objetivo: `2` si a 60 fps el frame tardó el doble [O] |
| `lagSmoothing(umbral, ajuste)` | Si pasan más de `umbral` ms, cuenta `ajuste` ms. Por defecto `500, 33`. `0` lo desactiva [O] [C] |
| `sleep()`, `wake()` | Para y reanuda. Crear un tween lo despierta [C] [E] |
| `tick()` | Fuerza un tick manual [C] [E] |

Orden dentro de un tick: los prioritarios, del último añadido al primero; la actualización de GSAP, y luego tus listeners, en orden de alta. [O] [C] [E]

## Ejemplo

Movimiento independiente de la tasa de refresco:

```js
const nave = { x: 0 };
const mover = () => { nave.x += 3 * gsap.ticker.deltaRatio(60); };

gsap.ticker.add(mover);
await new Promise((r) => setTimeout(r, 100));
gsap.ticker.remove(mover);
const quieta = nave.x;
await new Promise((r) => setTimeout(r, 60));

// prueba: quieta > 0
// prueba: nave.x === quieta
```

Orden de ejecución, y frames manuales:

```js
const orden = [];
const propio = () => orden.push("mio");
const antes = () => orden.push("antes");

gsap.to({ x: 0 }, { x: 1, duration: 1, onUpdate() { orden.push("tween"); } });
gsap.ticker.add(propio);
gsap.ticker.add(antes, false, true);
await new Promise((r) => setTimeout(r, 60));
gsap.ticker.remove(propio);
gsap.ticker.remove(antes);

const frameAntes = gsap.ticker.frame;
gsap.ticker.tick();
const incremento = gsap.ticker.frame - frameAntes;

// prueba: orden.slice(0, 3).join() === "antes,tween,mio"
// prueba: incremento === 1
```

Varios prioritarios, y un listener añadido dentro de un Context:

```js
const turnos = [];
const p1 = () => turnos.push("p1");
const p2 = () => turnos.push("p2");
gsap.ticker.add(p1, false, true);
gsap.ticker.add(p2, false, true);
gsap.ticker.tick();
gsap.ticker.remove(p1);
gsap.ticker.remove(p2);

const cuenta = { n: 0 };
const latido = () => cuenta.n++;
gsap.context(() => { gsap.ticker.add(latido); }).revert();
await new Promise((r) => setTimeout(r, 60));
const sigueVivo = cuenta.n > 0;
gsap.ticker.remove(latido);

// prueba: turnos.join() === "p2,p1"
// prueba: sigueVivo === true
```

`once` devuelve un envoltorio; solo este sirve para cancelar:

```js
const c = { a: 0, b: 0 };
const fa = () => c.a++;
const fb = () => c.b++;

gsap.ticker.add(fa, true);
gsap.ticker.remove(fa);                  // no cancela

const registrada = gsap.ticker.add(fb, true);
gsap.ticker.remove(registrada);          // cancela

await new Promise((r) => setTimeout(r, 60));

// prueba: c.a === 1
// prueba: c.b === 0
```

`sleep()` para el reloj, y un tween nuevo lo reactiva; `lagSmoothing()` no es getter:

```js
const leido = gsap.ticker.lagSmoothing(500, 33);
const o = { x: 0 };
gsap.ticker.sleep();
gsap.to(o, { x: 1, duration: 0.05 });

// prueba: leido === undefined
// prueba: o.x === 1
```

## Trampas

- **`lagSmoothing()` sin argumentos no lee.** La documentación lo presenta como getter y setter, pero no devuelve nada; llamarlo sin argumentos **lo desactiva**, porque el umbral vacío se convierte en infinito. [C]
- **Valores muy bajos en `lagSmoothing`.** Con `10, 10` el reloj se ajusta casi siempre y una animación de 2 s puede durar 8. Quédate con los valores por defecto. [O]
- **`lagSmoothing(0)` y saltos.** Sin suavizado, una pestaña que vuelve de segundo plano salta al estado que le correspondía. Es lo que quieres para sincronizar con audio o vídeo, y es la configuración típica con algunas librerías de scroll. [O] [P]
- **`gsap.ticker.add` en un Context.** No se graba: `ctx.revert()` no lo quita y el listener queda vivo. Retíralo en la función de limpieza. [E]
- **`remove` con la función equivocada.** Con `once`, usa lo que devolvió `add()`. [E]
- **Listener permanente sin necesidad.** Mientras haya listeners, el ticker no duerme y consume batería en móvil: `autoSleep` solo lo detiene si no queda ninguno aparte del suyo. Quita lo que ya no se use. En escenas que no cambian, usa un render a demanda: ver [fra-canvas-webgl](../12-frameworks/fra-canvas-webgl.md). [C]
- **Pestaña oculta.** El navegador reduce `requestAnimationFrame`, y por tanto los ticks. No pongas ahí trabajo que deba seguir en segundo plano. [O]
- **`fps()` no ahorra si tu código es lento.** Salta frames, pero no acelera ni suaviza; es una decisión de cadencia. [P]
- **Listener que hace `gsap.set()`.** Crea un tween por frame. Usa [quickSetter](nuc-quicksetter.md). [P]
