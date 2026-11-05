---
id: snp-api
titulo: Métodos y callbacks de Snap
capa: 05-snap
tipo: api
ambito: snap
resumen: add, addElement, addElements, next, previous, goTo, start, stop, resize y destroy. Orden de puntos, currentSnapIndex y fallos de destroy.
api: [Snap.add, Snap.addElement, Snap.addElements, Snap.next, Snap.previous, Snap.goTo, Snap.start, Snap.stop, Snap.resize, Snap.destroy, Snap.snaps, Snap.elements, Snap.currentSnapIndex, Snap.isStopped, Snap.onSnapDebounced, SnapItem.value, OnSnapCallback.index, SnapOptions.onSnapStart, SnapOptions.onSnapComplete]
requiere: [snp-snap]
relacionadas: [snp-snap, snp-elementos, api-scrollto, com-stop-start]
etiquetas: [snap, api, metodos, callbacks]
fuentes:
  - packages/snap/README.md
estado: verificado
version: 1.3.27
---
# Métodos y callbacks de `Snap`

Los métodos añaden puntos, navegan entre ellos y controlan el encaje. Toda la navegación pasa por `goTo`, que llama a `lenis.scrollTo` con `userData: { initiator: 'snap' }`. [C]

## Firma

| Método | Devuelve | Efecto |
|---|---|---|
| `add(valor)` | Función para quitar | Punto en píxeles |
| `addElement(el, opciones?)` | Función para quitar | Ver [`snp-elementos`](snp-elementos.md) |
| `addElements(lista, opciones?)` | Función para quitar todos | Admite `NodeList`, aunque los tipos pidan un array |
| `goTo(índice)` | `void` | Va al punto del orden actual, limitado a su rango |
| `next()` | `void` | `goTo((currentSnapIndex ?? 0) + 1)` |
| `previous()` | `void` | `goTo((currentSnapIndex ?? 0) - 1)` |
| `stop()` | `void` | `isStopped = true`: ignora gestos. `goTo` sigue funcionando |
| `start()` | `void` | Reanuda |
| `resize()` | `void` | Remide los **elementos**; no recalcula puntos fijos, ni ancho o alto de ellos |
| `destroy()` | `void` | Quita listeners y observadores. Ver trampas |

| Propiedad | Contenido |
|---|---|
| `snaps` | `Map` de `SnapItem`: `{ value }`, los añadidos con `add` |
| `elements` | `Map` de `SnapElement` |
| `currentSnapIndex` | Último índice elegido; `undefined` al inicio |
| `isStopped` | Estado de `snap.stop()` |
| `options` | Opciones resueltas: editables en vivo, salvo `debounce` |
| `viewport` | `{ width, height }` de la **ventana** |
| `onSnapDebounced` | Función registrada en `virtual-scroll` |

**Orden de los puntos.** Se recalcula en cada uso: unión de `add` y elementos, ordenada por `Math.abs(value)`. El índice es la posición en ese orden, no el orden de inserción. Un elemento con dos `align` ocupa dos índices. [C] [E]

**Callbacks.** `OnSnapCallback` recibe `{ value, index }`: `value` es el punto y `index` su posición. `add` no acepta `userData`, pese a lo que indica su JSDoc. [C] [E]

Dentro del evento `scroll`, se reconoce un encaje con `lenis.userData.initiator === 'snap'`. [E]

## Ejemplo

```js
const lenis = new Lenis({ autoRaf: true });
const snap = new Snap(lenis, { duration: 0.05 });
snap.add(1500);
snap.add(300);
snap.add(900); // se ordenan: 300, 900, 1500
const ini = snap.currentSnapIndex;

const pasos = [];
for (const accion of ["next", "next", "next", "previous"]) {
  snap[accion]();
  await espera(200);
  pasos.push(lenis.scroll);
}
snap.goTo(0);
await espera(200);
const alPrimero = lenis.scroll;
snap.goTo(99);
await espera(200);
const limitado = [lenis.scroll, snap.currentSnapIndex];

lenis.scrollTo(1200, { immediate: true });
snap.goTo(1);
await espera(200);
lenis.scrollTo(100, { immediate: true });
snap.next(); // no mira la posición: va al índice 2
await espera(200);
const sinMirar = lenis.scroll;
lenis.destroy();
snap.destroy();
// prueba: ini === undefined
// prueba: pasos.join() === "900,1500,1500,900"
// prueba: alPrimero === 300 && limitado.join() === "1500,2"
// prueba: sinMirar === 1500
```

`next()` al inicio salta el primer punto; `previous()` no:

```js
const crear = () => {
  const lenis = new Lenis({ autoRaf: true });
  const snap = new Snap(lenis, { duration: 0.05 });
  snap.add(300);
  snap.add(900);
  return { lenis, snap };
};
const a = crear();
a.snap.next();
await espera(250);
const conNext = a.lenis.scroll;
a.lenis.destroy();
a.snap.destroy();
window.scrollTo({ top: 0, behavior: "instant" });
await espera(50);
const b = crear();
b.snap.previous();
await espera(250);
const conPrevious = b.lenis.scroll;
b.lenis.destroy();
b.snap.destroy();
// prueba: conNext === 900 && conPrevious === 300
```

Callbacks y `userData`:

```js
const lenis = new Lenis({ autoRaf: true });
const hechos = [];
const origen = [];
lenis.on("scroll", (l) => origen.push(l.userData.initiator));
const snap = new Snap(lenis, {
  type: "mandatory",
  debounce: 30,
  duration: 0.05,
  onSnapStart: ({ index, value }) => hechos.push(["start", index, value].join()),
  onSnapComplete: ({ index, value }) => hechos.push(["fin", index, value].join()),
});
snap.add(400);
snap.add(800);
rueda(20);
await espera(600);
lenis.destroy();
snap.destroy();
// prueba: hechos.join("|") === "start,0,400|fin,0,400"
// prueba: origen.includes("snap")
```

Quitar puntos y parar:

```html
<div class="sec" style="height:500px"></div>
<div class="sec" style="height:500px"></div>
```

```js
const lenis = new Lenis({ autoRaf: true, duration: 0.05 });
const snap = new Snap(lenis, { type: "mandatory", debounce: 20, duration: 0.05 });
const quitarPunto = snap.add(100);
const conPunto = snap.snaps.size;
quitarPunto();
const sinPunto = snap.snaps.size;
const quitarSec = snap.addElements(document.querySelectorAll(".sec"), { align: "end" });
const conSec = snap.elements.size;
quitarSec();
const sinSec = snap.elements.size;

snap.add(900);
snap.stop();
rueda(50);
await espera(250);
const parado = lenis.targetScroll;
const estado = snap.isStopped;
snap.start();
rueda(50);
await espera(300);
const reanudado = lenis.scroll;
lenis.destroy();
snap.destroy();
// prueba: conPunto === 1 && sinPunto === 0 && conSec === 2 && sinSec === 0
// prueba: parado === 50 && estado === true && reanudado === 900
```

Snap ve lo que Lenis filtra, y sigue activo tras `destroy()`:

```html
<div id="libre" data-lenis-prevent style="height:50px"></div>
```

```js
const lenis = new Lenis({ autoRaf: true, duration: 0.05 });
let encajes = 0;
const snap = new Snap(lenis, { type: "mandatory", debounce: 30, duration: 0.05, onSnapStart: () => encajes++ });
snap.add(600);
rueda(50, document.getElementById("libre")); // Lenis no lo procesa
await espera(300);
const conPrevent = [lenis.scroll, encajes];

lenis.scrollTo(0, { immediate: true });
lenis.stop();
snap.currentSnapIndex = undefined;
rueda(50);
await espera(200);
const indiceParado = snap.currentSnapIndex;
const scrollParado = lenis.scroll;
lenis.start();

encajes = 0;
rueda(50);
snap.destroy(); // el retardo ya estaba en marcha
await espera(300);
const trasDestroy = encajes;
lenis.destroy();
// prueba: conPrevent[0] === 600 && conPrevent[1] === 1
// prueba: indiceParado === 0 && scrollParado === 0
// prueba: trasDestroy === 1
```

## Trampas

- **`next()` antes de cualquier encaje.** `undefined ?? 0` más 1 da índice 1: se salta el primer punto. Llama a `goTo(0)` para empezar. [C] [E]
- **`next()` no sabe dónde está el scroll.** Solo usa `currentSnapIndex`, y este solo cambia en `goTo`. Tras un scroll con teclado o barra, navega desde el índice anterior. [C] [E]
- **Encaje desde un área excluida.** La rueda sobre `data-lenis-prevent` llega a `virtual-scroll`, y Snap mueve la página mientras el usuario usaba una lista. Llama a `snap.stop()` mientras dure, o quita el área de la ruta. [C] [E]
- **`lenis.stop()` no para Snap.** `scrollTo` se ignora, pero `currentSnapIndex` avanza y queda desincronizado. Para los dos a la vez. [C] [E]
- **`destroy()` deja el retardo vivo.** Un encaje pendiente se ejecuta después, y Lenis se mueve. Llama a `snap.stop()` antes de `destroy()`. [E]
- **`destroy()` tampoco vacía `snaps` ni `elements`.** Solo desconecta. Y destruye observadores de los elementos que sigan en `elements`: quitarlos antes con la función devuelta **no** los desconecta, porque solo los borra del mapa. [C]
- **Punto más allá de `limit`.** Se limita sin error, y `value` en el callback sigue siendo el original. [C]
- **Valores negativos.** Se ordenan por valor absoluto: `-100` va detrás de `50`. [C]
- **`goTo` en un encaje exacto.** Si ya está en ese punto, `onSnapStart` y `onSnapComplete` se ejecutan al instante. [C]
- **Gesto lateral.** `virtual-scroll` lo emite aunque Lenis lo ignore: con delta 0 y la posición exacta sobre un punto, Snap **excluye** ese punto (usa `<` y `>` estrictos) y salta al vecino. [C] [E]

```js
const lenis = new Lenis({ autoRaf: true, duration: 0.05 });
const snap = new Snap(lenis, { type: "mandatory", debounce: 30, duration: 0.05 });
snap.add(500);
snap.add(1000);
snap.add(1800);
lenis.scrollTo(1000, { immediate: true });
rueda(0, undefined, 5);
await espera(400);
const y = lenis.scroll;
lenis.destroy();
snap.destroy();
// prueba: y === 500
```
