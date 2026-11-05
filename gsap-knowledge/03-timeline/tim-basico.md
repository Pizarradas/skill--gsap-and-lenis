---
id: tim-basico
titulo: Timeline, secuenciar animaciones sin encadenar delays
capa: 03-timeline
tipo: concepto
ambito: core
resumen: Qué es una timeline, cómo se crea y se llena, y por qué sustituye a los delays. Incluye las opciones de gsap.timeline() y las trampas de from() y set() dentro de ella.
api: [gsap.timeline, Timeline.to, Timeline.from, Timeline.fromTo, Timeline.set, Timeline.call, Timeline.vars, Timeline.staggerTo, Timeline.staggerFrom, Timeline.staggerFromTo, gsap.TimelineVars.defaults, gsap.TimelineVars.delay, gsap.TimelineVars.autoRemoveChildren, gsap.TimelineVars.smoothChildTiming]
requiere: [fun-modelo]
relacionadas: [tim-posicion, tim-etiquetas, tim-anidado, tim-control, tim-herencia, nuc-immediate-render, nuc-repeat-yoyo]
etiquetas: [secuencia, timeline, delay]
fuentes:
  - docs/v3/GSAP/Timeline.md
  - docs/v3/GSAP/Timeline/to().md
  - docs/v3/GSAP/Timeline/from().md
  - docs/v3/GSAP/Timeline/fromTo().md
  - docs/v3/GSAP/Timeline/set().md
  - docs/v3/GSAP/Timeline/call().md
  - docs/v3/GSAP/Timeline/vars.md
  - resources/getting-started/timelines.md
estado: verificado
version: 3.15.1
---
# Timeline

Una timeline es un contenedor de tweens y de otras timelines con su propio cabezal. Sirve para fijar la secuencia en un solo sitio y controlarla como una unidad: pausar, invertir, repetir o saltar a un punto. [O]

## Modelo mental

Con `delay` cada tween calcula su inicio a mano: alargar el primero obliga a retocar todos los siguientes. En una timeline cada hijo guarda su posición dentro del contenedor y, por defecto, entra al final de lo que ya hay. Si alargas un tween en el código, lo que va detrás se desplaza sin retocar nada. [O]

| Método | Qué añade | Devuelve |
|---|---|---|
| `tl.to(objetivos, vars, posicion?)` | Tween hacia valores | la timeline |
| `tl.from(objetivos, vars, posicion?)` | Tween desde valores | la timeline |
| `tl.fromTo(objetivos, desde, hasta, posicion?)` | Tween con ambos extremos | la timeline |
| `tl.set(objetivos, vars, posicion?)` | Cambio instantáneo, tween de duración 0 | la timeline |
| `tl.call(funcion, params?, posicion?)` | Función en un punto exacto, equivale a añadir un `gsap.delayedCall(0, ...)` | la timeline |

Todos devuelven la timeline, no el tween, y por eso se encadenan. Para tener el tween en una variable, créalo con `gsap.to()` e insértalo con [`tl.add()`](tim-gestion.md). [C]

`staggerTo()`, `staggerFrom()` y `staggerFromTo()` siguen en el código solo por compatibilidad. Usa `stagger` dentro de `vars`. [C]

### Opciones de `gsap.timeline(vars)`

| Opción | Efecto | Ficha |
|---|---|---|
| `defaults` | Valores que heredan los hijos al crearse | [herencia](tim-herencia.md) |
| `paused`, `reversed` | Estado inicial | [control](tim-control.md) |
| `delay` | Espera antes de empezar, en segundos | |
| `repeat`, `repeatDelay`, `yoyo` | Repetición de toda la secuencia | [repeat y yoyo](../02-nucleo/nuc-repeat-yoyo.md) |
| `repeatRefresh` | Invalida a los hijos en cada iteración completa | [control](tim-control.md) |
| `smoothChildTiming`, `autoRemoveChildren` | Política con los hijos | [herencia](tim-herencia.md) |
| `onStart`, `onUpdate`, `onComplete`, `onRepeat`, `onReverseComplete`, `onInterrupt` y sus `*Params`, `callbackScope` | Eventos | [callbacks](../02-nucleo/nuc-callbacks.md) |
| `data`, `id` | Dato libre y nombre para `gsap.getById()` | |
| `scrollTrigger` | Vincula toda la timeline al scroll | [ScrollTrigger](../07-scroll/scr-scrolltrigger.md) |

## Ejemplo

```html
<div class="tarjeta" style="width:80px;height:80px"></div>
<div class="sello" style="width:80px;height:80px"></div>
```

```js
const entrada = gsap.timeline({ defaults: { duration: 0.1, ease: "none" } });

entrada
  .to(".tarjeta", { x: 100 })
  .to(".sello", { opacity: 0.5 })
  .set(".tarjeta", { backgroundColor: "rgb(255, 0, 0)" });

// prueba: gsap.getProperty(".tarjeta", "x") === 100
// prueba: gsap.getProperty(".sello", "opacity") === 0.5
// prueba: entrada.duration() === 0.2
// prueba: getComputedStyle(document.querySelector(".tarjeta")).backgroundColor === "rgb(255, 0, 0)"
```

Sin hijos la duración es 0 y crece con cada inserción. [E]

```js
const secuencia = gsap.timeline({ paused: true });
const vacia = secuencia.duration();

secuencia.to(".pieza", { x: 10, duration: 1 }).to(".pieza", { y: 10, duration: 2 });

// prueba: vacia === 0
// prueba: secuencia.duration() === 3
// prueba: secuencia.getChildren()[1].startTime() === 1
```

## Trampas

- **`duration` en `gsap.timeline()` no fija la duración total.** Reserva ese tiempo, y el primer hijo entra detrás: `gsap.timeline({ duration: 3 })` con un hijo de 0.5 s dura 3.5 s. Para ajustar la duración de una secuencia ya llena usa `tl.duration(3)` o `tl.totalDuration(3)`, que cambian `timeScale`. Lo común a los hijos va en `defaults`. [E]

```js
const mal = gsap.timeline({ duration: 3, paused: true });
mal.to(".pieza", { x: 10 });

const bien = gsap.timeline({ paused: true });
bien.to(".pieza", { x: 10, duration: 1 }).duration(3);

// prueba: mal.duration() === 3.5
// prueba: mal.getChildren()[0].startTime() === 3
// prueba: Math.abs(bien.timeScale() - 1 / 3) < 0.0001
```

- **`ease` en la timeline se ignora.** Una timeline no tiene curva propia. `gsap.timeline({ ease: "none" })` no afecta a los hijos: ponlo en `defaults`. [E]

```js
const estado = { a: 0 };
const sinEfecto = gsap.timeline({ ease: "none", paused: true });
sinEfecto.to(estado, { a: 1, duration: 1 });
sinEfecto.progress(0.5);

const estado2 = { a: 0 };
const conEfecto = gsap.timeline({ defaults: { ease: "none" }, paused: true });
conEfecto.to(estado2, { a: 1, duration: 1 });
conEfecto.progress(0.5);

// prueba: estado.a === 0.75
// prueba: estado2.a === 0.5
```

- **`tl.from()` se pinta al crearse**, aunque su posición quede lejos, salvo `immediateRender: false`. Si otro tween previo anima la misma propiedad, grabará como punto de partida el valor ya alterado. Ver [immediateRender](../02-nucleo/nuc-immediate-render.md). [O]
- **`tl.set()` no se aplica al instante**, ni siquiera en la posición 0: espera a que el cabezal llegue, como mínimo al siguiente tick, y en una timeline pausada no ocurre. Para preparar el estado antes de pintar usa `gsap.set()` fuera de la timeline. [E]

```js
const objeto = { x: 5 };
const preparada = gsap.timeline({ paused: true });
preparada.set(objeto, { x: 0 });
const alCrear = objeto.x;

// prueba: alCrear === 5
// prueba: objeto.x === 5
```

- **Añadir a una timeline terminada la reabre.** El tween nuevo entra al final y el cabezal sigue, de modo que se reproduce. Es útil para colas, pero sorprende si se esperaba una timeline cerrada. [E]

```js
const cola = gsap.timeline();
const dato = { a: 0 };
cola.to({ b: 0 }, { b: 1, duration: 0.05 });
await new Promise((r) => setTimeout(r, 200));
const antes = cola.progress();
cola.to(dato, { a: 1, duration: 0.05 });
await new Promise((r) => setTimeout(r, 200));

// prueba: antes === 1
// prueba: dato.a === 1
// prueba: Math.abs(cola.time() - 0.1) < 0.001
```

- **Crea la timeline una sola vez.** Reconstruirla en cada clic deja tweens compitiendo por las mismas propiedades. Crea una en pausa y usa `play()` y `reverse()`. [P]
- **`vars` es el objeto original.** `tl.vars` devuelve lo que pasaste al crearla: leerlo no refleja cambios en vivo como `tl.repeat(2)`. [C]
