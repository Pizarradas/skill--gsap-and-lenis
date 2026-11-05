---
id: api-scrollto
titulo: lenis.scrollTo(), objetivos y opciones
capa: 03-api
tipo: api
ambito: core
resumen: Tabla completa de objetivos y opciones de scrollTo, con lock, force, programmatic, immediate y userData probados, y qué callbacks se ejecutan en cada caso.
api: [Lenis.scrollTo, ScrollToOptions.offset, ScrollToOptions.immediate, ScrollToOptions.lock, ScrollToOptions.duration, ScrollToOptions.easing, ScrollToOptions.lerp, ScrollToOptions.onStart, ScrollToOptions.onComplete, ScrollToOptions.force, ScrollToOptions.programmatic, ScrollToOptions.userData, Lenis.userData]
requiere: [fun-modelo]
relacionadas: [opc-suavizado, com-anclas, com-stop-start, api-eventos]
etiquetas: [scrollTo, api, lock, force]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# `lenis.scrollTo()`

Es el punto único por el que pasa todo desplazamiento de Lenis, incluida la rueda, que lo llama con `programmatic: false`. [C]

## Firma

```text
lenis.scrollTo(destino: number | string | Element, opciones?: ScrollToOptions) → void
```

### Objetivos

| `destino` | Resultado | Evidencia |
|---|---|---|
| número | Esa posición en píxeles, limitada a `[0, limit]` salvo `infinite` | [E] |
| `'top'`, `'left'`, `'start'`, `'#'` | `0` | [E] |
| `'bottom'`, `'right'`, `'end'` | `limit` | [E] |
| `'#id'` | `document.getElementById`: admite ids que no son selectores válidos. Solo busca en el documento, no en una sombra | [E] |
| `'#top'` sin ese id | `0` | [C] |
| Otra cadena | `document.querySelector`; un selector inválido **lanza excepción** | [C] |
| `Element`, también SVG | Posición del elemento | [E] |
| Cadena sin resultado | `console.warn('Lenis: Target not found', ...)` y no hace nada | [E] |
| Elemento de otro documento | `instanceof Element` falla: no hace nada, sin aviso | [C] |

La posición de un elemento resta su `scroll-margin` y el `scroll-padding` de `rootElement`, y en contenedores compensa la posición del contenedor. [C] [E]

### Opciones

| Opción | Tipo | Defecto | Efecto |
|---|---|---|---|
| `offset` | `number` | `0` | Se suma al destino, también a números y palabras clave. El README lo equipara a `scroll-padding-top`, pero el signo es el contrario: para dejar 100 px arriba, `offset: -100` [E] |
| `immediate` | `boolean` | `false` | Salta en el acto, sin animación ni `onStart`; ignora `lock`, y corta la inercia. **Se ignora si el destino es `targetScroll`:** ver abajo [E] |
| `lock` | `boolean` | `false` | `isLocked` hasta llegar: bloquea gestos y otros `scrollTo` sin `force` [E] |
| `force` | `boolean` | `false` | Actúa aunque esté parado o bloqueado. No cambia ese estado. En un contenedor con `overflow` en hoja y `lenis.css`, parado no mueve nada: ver [`com-stop-start`](../04-comportamiento/com-stop-start.md#ventana-y-contenedor) [E] |
| `programmatic` | `boolean` | `true` | El JSDoc dice `false`. Con `false` se comporta como un gesto [E] |
| `lerp` | `number` | Instancia | Con `programmatic: false`, `undefined` |
| `duration` | `number` | Instancia | Gana a `lerp`: [`opc-suavizado`](../02-opciones/opc-suavizado.md) |
| `easing` | función | Instancia | Ídem |
| `onStart` | `(lenis) => void` | | Al empezar, de forma síncrona |
| `onComplete` | `(lenis) => void` | | Al llegar |
| `userData` | `object` | `{}` | Visible en `lenis.userData` durante el movimiento; se vacía al terminar [E] |

### Qué callbacks se ejecutan

| Caso | `onStart` | `onComplete` | Asíncrono |
|---|---|---|---|
| Animación normal que termina | Sí | Sí | Sí |
| `immediate: true` | **No** | Sí | No |
| Destino igual a `targetScroll` | Sí | Sí | No, y sin aplicar `lock`, `userData` ni **`immediate`**: no corta una animación en curso |
| Parado o bloqueado sin `force` | No | No | |
| Otro `scrollTo` o una rueda a mitad | Sí | **No** | |
| Destino no encontrado | No | No | |
| Movimiento reducido | **No** | Sí | No |

### `programmatic`

| | `true` | `false` |
|---|---|---|
| `targetScroll` | Sigue a la animación; salta al destino al final | Salta al destino al llamar |
| Sin `lerp` ni `duration` | Hereda de la instancia | **Salto** en el siguiente `raf` |
| Con `infinite` | Va por el camino más corto | Acumula |
| Movimiento reducido | `immediate` | `lerp = 1` |

### `immediate` no siempre corta

La comparación con `targetScroll` va **antes** de la rama de `immediate`. Si pides justo ese valor, `scrollTo` llama a los callbacks y vuelve: la animación sigue. Vale para ventana y contenedor, con `lerp` y con `duration`. Pasa cuando la inercia ya iba a ese destino, y tras un `resize()`, que iguala `targetScroll` al scroll real. Para cortar seguro, apunta a otro valor: ver [`int-navegacion`](../06-integracion/int-navegacion.md). [C] [E]

```js
const lenis = new Lenis({ autoRaf: true, lerp: 0.05 });
rueda(1000);
await espera(100);
lenis.scrollTo(1000, { immediate: true });        // ya es targetScroll
const sigue = lenis.isScrolling;
const enCamino = window.scrollY;

lenis.scrollTo(500, { immediate: true });         // otro valor: corta
const cortada = lenis.isScrolling;
await espera(100);
const quieta = window.scrollY;
lenis.destroy();
window.scrollTo(0, 0);
// prueba: sigue === "smooth" && enCamino < 1000
// prueba: cortada === false && quieta === 500
```

## Ejemplo

Objetivos, `offset`, y CSS del objetivo:

```html
<div id="meta" style="margin-top:900px;height:50px;scroll-margin-top:60px"></div>
<svg width="20" height="20" style="display:block;margin-top:400px"><circle id="punto" r="5" cx="10" cy="10"/></svg>
<style>html { scroll-padding-top: 40px; }</style>
```

```js
const lenis = new Lenis();
const ir = (destino, opciones) => {
  lenis.scrollTo(destino, { immediate: true, ...opciones });
  return lenis.scroll;
};
const meta = document.getElementById("meta");
const fin = lenis.limit;

const palabras = [ir("bottom"), ir("top"), ir("end"), ir("left"), ir("right"), ir("start")];
const conMargenes = ir("#meta"); // 900 - 60 - 40
const conOffset = ir(meta, { offset: -10 });
const porSelector = ir("div#meta");
const numero = [ir(0), ir(100, { offset: 50 }), ir("bottom", { offset: -100 })];
const svg = ir(document.getElementById("punto"));
const posSvg = document.getElementById("punto").getBoundingClientRect().top;
const limitado = ir(999999);
lenis.destroy();
// prueba: palabras.join() === [fin, 0, fin, 0, fin, 0].join()
// prueba: conMargenes === 800 && conOffset === 790 && porSelector === 800
// prueba: numero.join() === [0, 150, fin - 100].join()
// prueba: Math.abs(posSvg - 40) < 1 && svg > 1000
// prueba: limitado === fin
```

Un id que no es un selector válido, en un contenedor separado del borde:

```html
<style>.marco { height: 300px; overflow: auto; margin-top: 100px; }</style>
<div class="marco"><div style="height:1000px"><div id="1.a†" style="height:10px;position:relative;top:500px"></div></div></div>
```

```js
const marco = document.querySelector(".marco");
const lenis = new Lenis({ wrapper: marco, content: marco.firstElementChild });
lenis.scrollTo("#1.a†", { immediate: true });
const y = marco.scrollTop;
lenis.destroy();
// prueba: y === 500
```

Un destino inexistente solo avisa. El arnés falla con cualquier `console.warn`, así que el bloque lo captura:

```js
const avisos = [];
console.warn = (...a) => avisos.push(a.join(" "));
const lenis = new Lenis();
lenis.scrollTo("#no" + "-existe", { immediate: true });
const posicion = lenis.scroll;
lenis.destroy();
// prueba: posicion === 0 && avisos[0].includes("Target not found")
```

`immediate`, y lo que omite:

```js
const lenis = new Lenis();
const vistos = [];
lenis.on("scroll", (l) => vistos.push(l.userData.origen));
lenis.scrollTo(700, {
  immediate: true,
  lock: true,
  userData: { origen: "menu" },
  onStart: () => vistos.push("start"),
  onComplete: () => vistos.push("complete"),
});
const sincrono = window.scrollY;
const bloqueado = lenis.isLocked;
const datos = Object.keys(lenis.userData).length;
lenis.destroy();
// prueba: sincrono === 700 && bloqueado === false && datos === 0
// prueba: vistos.join() === "menu,complete"
```

`lock` frente a gesto y a otro `scrollTo`; `force` lo atraviesa:

```js
const lenis = new Lenis();
const fin = [];
lenis.scrollTo(800, { lock: true, onComplete: () => fin.push("a") });
const durante = { bloqueado: lenis.isLocked, clase: lenis.className };
let t = 1000;
lenis.raf(t);
lenis.raf((t += 16));
rueda(1000);
lenis.scrollTo(100);
const destinoIgnorado = lenis.targetScroll < 100;
for (let i = 0; i < 300; i++) lenis.raf((t += 16));
const llegada = lenis.scroll;
const libre = lenis.isLocked;

lenis.scrollTo(100, { lock: true });
lenis.raf((t += 16));
lenis.scrollTo(1500, { force: true });
for (let i = 0; i < 300; i++) lenis.raf((t += 16));
const forzado = lenis.scroll;
lenis.destroy();
// prueba: durante.bloqueado === true && durante.clase.includes("lenis-locked")
// prueba: llegada === 800 && libre === false && fin.join() === "a"
// prueba: forzado === 1500
```

Con la instancia parada, `force` mueve pero no reanuda:

```js
const lenis = new Lenis();
lenis.stop();
const hechos = [];
lenis.scrollTo(500, { onStart: () => hechos.push("x") });
const sinForce = lenis.targetScroll;
lenis.scrollTo(500, { force: true, onComplete: () => hechos.push("hecho") });
let t = 1000;
lenis.raf(t);
for (let i = 0; i < 300; i++) lenis.raf((t += 16));
const conForce = lenis.scroll;
const sigueParada = lenis.isStopped;
lenis.destroy();
// prueba: sinForce === 0 && conForce === 500 && sigueParada && hechos.join() === "hecho"
```

`programmatic: false`, `lerp: 0` y la interrupción:

```js
const lenis = new Lenis();
lenis.scrollTo(500, { programmatic: false });
const destinoYa = lenis.targetScroll;
lenis.raf(1000);
lenis.raf(1016);
const saltoSinLerp = lenis.scroll;

lenis.scrollTo(100, { lerp: 0 });
lenis.raf(1032);
lenis.raf(1048);
const conLerpCero = lenis.scroll;

const hechos = [];
lenis.scrollTo(1500, { onComplete: () => hechos.push("primero") });
lenis.raf(1064);
const objetivoSigue = lenis.targetScroll < 1500;
lenis.scrollTo(300, { onComplete: () => hechos.push("segundo") });
let t = 1080;
for (let i = 0; i < 300; i++) lenis.raf((t += 16));
const llegada = lenis.scroll;

const rota = [];
lenis.scrollTo(1500, { onComplete: () => rota.push("no") });
lenis.raf((t += 16));
rueda(50); // la rueda toma el control
for (let i = 0; i < 300; i++) lenis.raf((t += 16));
lenis.destroy();
// prueba: destinoYa === 500 && saltoSinLerp === 500 && conLerpCero === 100
// prueba: objetivoSigue && llegada === 300 && hechos.join() === "segundo"
// prueba: rota.length === 0
```

`userData` vive durante la animación:

```js
const lenis = new Lenis();
const vistos = [];
lenis.on("scroll", (l) => vistos.push(l.userData.origen ?? "-"));
lenis.scrollTo(400, { userData: { origen: "menu" }, duration: 0.1 });
let t = 1000;
lenis.raf(t);
for (let i = 0; i < 20; i++) lenis.raf((t += 16));
const alFinal = lenis.userData;
rueda(50); // un gesto reemplaza userData por {}
lenis.raf((t += 16));
lenis.raf((t += 16));
const tras = vistos[vistos.length - 1];
lenis.destroy();
// prueba: vistos[0] === "menu" && Object.keys(alFinal).length === 0 && tras === "-"
```

## Trampas

- **Encadenar con `onComplete` sin contar con la interrupción.** Si el usuario gira la rueda, `onComplete` nunca llega. Para fases críticas usa `lock: true`, o no dependas del callback. [C] [E]
- **`lock` no bloquea el teclado ni la barra.** Solo gestos filtrados por Lenis y otros `scrollTo`. Esos scrolls nativos se sobrescriben en el siguiente fotograma, y hay parpadeo. [C]
- **`onStart` para activar algo, con `immediate` o movimiento reducido.** No se ejecuta. Inicializa antes de llamar. [C] [E]
- **`force` no reanuda.** Tras el movimiento, sigue parado. [E]
- **Medir el elemento durante una animación propia.** La posición usa `getBoundingClientRect`: un `transform` en curso se incluye. [C]
- **`scrollTo` antes de `resize` tras crecer el contenido.** Se limita al `limit` antiguo. Ver [`com-dimensiones`](../04-comportamiento/com-dimensiones.md). [E]
- **Selector con caracteres especiales.** `'#id'` va directo a `getElementById`, pero `'.a:b'` lanza `SyntaxError`. [C]
- **`scrollTo(0)` estando ya en 0.** Ejecuta `onStart` y `onComplete` al instante, sin `lock`, sin `userData`. [C]
- **`scrollTo(elemento)` justo tras un salto nativo.** La posición suma `animatedScroll`, que aún no se ha enterado: mide de más o de menos. Llama antes a `lenis.resize()`, o espera al evento `scroll`. [C] [E]

```html
<div id="diana" style="position:absolute;top:1500px;height:10px"></div>
```

```js
const lenis = new Lenis();
const diana = document.getElementById("diana");
window.scrollTo(0, 400);
lenis.scrollTo(diana, { immediate: true });
const mal = window.scrollY;
window.scrollTo(0, 400);
lenis.resize();
lenis.scrollTo(diana, { immediate: true });
const bien = window.scrollY;
lenis.destroy();
// prueba: mal === 1100 && bien === 1500
```
