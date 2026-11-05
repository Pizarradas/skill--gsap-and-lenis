---
id: snp-snap
titulo: lenis/snap, puntos de encaje
capa: 05-snap
tipo: plugin
ambito: snap
resumen: Clase Snap: añade encaje a Lenis tras un gesto. Tipos mandatory, proximity y lock, distanceThreshold, debounce y cómo se calcula el destino.
api: [Snap, SnapOptions.type, SnapOptions.distanceThreshold, SnapOptions.debounce, SnapOptions.lerp, SnapOptions.duration, SnapOptions.easing, SnapOptions.onSnapStart, SnapOptions.onSnapComplete, Snap.options, Snap.distanceThreshold, Snap.viewport]
requiere: [fun-modelo, opc-suavizado]
relacionadas: [snp-api, snp-elementos, rec-secciones-snap, opc-filtros]
etiquetas: [snap, encaje, debounce, secciones]
fuentes:
  - packages/snap/README.md
  - README.md
estado: verificado
version: 1.3.27
---
# `lenis/snap`

Lenis no es compatible con CSS `scroll-snap`: ambos quieren decidir la posición. `Snap` lo sustituye en parte: espera a que acabe el gesto y llama a `lenis.scrollTo()` hacia el punto elegido. [O] [C]

## Para qué sirve

Encajar secciones, carruseles a pantalla completa o una presentación por diapositivas. No es CSS `scroll-snap`: reacciona solo a **gestos de rueda y toque**, y el comentario `TODO` del código reconoce que faltan flechas y barra espaciadora. [C]

```text
evento 'virtual-scroll' → retardo (debounce) → onSnap:
  ¿isStopped?, ¿touchmove?, ¿lock en curso? → corta
  posición prevista = ceil(scroll + delta del último gesto)
  anterior = último punto < prevista;  siguiente = primero > prevista
  elige: lock → según el signo del delta | resto → el más cercano
  ¿distancia ≤ distanceThreshold? → goTo(índice)
```

## Registro

No necesita registro: se instancia sobre una instancia de Lenis.

```text
new Snap(lenis: Lenis, opciones?: SnapOptions)
```

Carga por las tres vías en [`fun-instalacion`](../01-fundamentos/fun-instalacion.md). Por módulos, `import Snap from "lenis/snap"`; por script clásico, el global `Snap`. `window.lenis.snap` queda en `true`. [C] [E]

## API

| Opción | Tipo | Defecto | Efecto |
|---|---|---|---|
| `type` | `'proximity' \| 'mandatory' \| 'lock'` | `'proximity'` | Ver abajo |
| `distanceThreshold` | `number \| '<n>%'` | `'50%'` | Distancia máxima. Porcentaje del **viewport** en el eje |
| `debounce` | `number` (ms) | `500` | Espera tras el último gesto |
| `lerp` | `number` | Hereda | Ver el aviso de abajo |
| `duration` | `number` (s) | Hereda | |
| `easing` | función | Hereda | |
| `onSnapStart` | `OnSnapCallback` | | Al empezar a encajar |
| `onSnapComplete` | `OnSnapCallback` | | Al llegar |

| `type` | Elige | Umbral | Durante el encaje |
|---|---|---|---|
| `proximity` | El punto más cercano | Se aplica | El usuario puede interrumpir |
| `mandatory` | El punto más cercano | **Ignorado**: siempre encaja | Puede interrumpir |
| `lock` | El siguiente o anterior, según dirección | **Se aplica** | `lock: true`: gestos bloqueados |

`snap.distanceThreshold` es un getter con el valor en píxeles. Si es una cadena sin `%`, se usa el viewport completo: `'300'` da 700 en una ventana de 700 px. [C] [E]

La API de métodos y los callbacks están en [`snp-api`](snp-api.md). Los elementos, en [`snp-elementos`](snp-elementos.md).

## Ejemplo

Los tres tipos:

```js
const lenis = new Lenis({ autoRaf: true, duration: 0.1 });
const snap = new Snap(lenis, { debounce: 50, duration: 0.1 });
snap.add(650);
snap.add(2000);

const r = { tipo: snap.options.type, umbral: snap.distanceThreshold };
rueda(300); // posición prevista entre 300 y 600: dentro del umbral de 350 px
await espera(600);
r.cerca = lenis.scroll;

lenis.scrollTo(1500, { immediate: true });
rueda(1);
await espera(600);
r.lejos = lenis.scroll; // a más de 350 px de todo: no encaja

snap.options.type = "mandatory";
const infinito = snap.distanceThreshold;
rueda(1);
await espera(600);
r.obligatorio = lenis.scroll;
lenis.destroy();
snap.destroy();
// prueba: r.tipo === "proximity" && r.umbral === 350
// prueba: r.cerca === 650
// prueba: r.lejos > 1499 && r.lejos < 1505
// prueba: infinito === Infinity && r.obligatorio === 2000
```

Diapositivas con `lock`. `distanceThreshold: '100%'` es imprescindible:

```js
const lenis = new Lenis({ autoRaf: true });
const vistos = [];
const snap = new Snap(lenis, {
  type: "lock",
  debounce: 0,
  distanceThreshold: "100%",
  duration: 0.3,
  onSnapComplete: ({ index }) => vistos.push(index),
});
[0, 600, 1200].forEach((y) => snap.add(y));

rueda(10);
await espera(100);
const durante = { bloqueado: lenis.isLocked, datos: lenis.userData.initiator };
const destinoAntes = lenis.targetScroll;
rueda(500); // ignorado
const ignorado = lenis.targetScroll - destinoAntes < 200;
await espera(700);
const r = { y: lenis.scroll, bloqueado: lenis.isLocked, indice: snap.currentSnapIndex };

rueda(-10);
await espera(700);
const atras = lenis.scroll;
lenis.destroy();
snap.destroy();
// prueba: durante.bloqueado === true && durante.datos === "snap" && ignorado
// prueba: r.y === 600 && r.bloqueado === false && r.indice === 1
// prueba: atras === 0 && vistos.join() === "1,0"
```

`lock` con el umbral por defecto: un gesto corto no alcanza un punto a más de medio viewport, y uno largo sí, porque la distancia se mide desde la posición prevista:

```js
const lenis = new Lenis({ autoRaf: true });
const snap = new Snap(lenis, { type: "lock", debounce: 0, duration: 0.2 });
snap.add(0);
snap.add(800);
rueda(10);
await espera(500);
const corto = lenis.scroll;

lenis.scrollTo(0, { immediate: true });
await espera(50);
rueda(500);                   // prevista: 500, a 300 de 800
await espera(600);
const largo = lenis.scroll;
lenis.destroy();
snap.destroy();
// prueba: corto < 20 && largo === 800
```

`debounce` espera al último evento:

```js
const lenis = new Lenis({ autoRaf: true, duration: 0.05 });
let encajes = 0;
const snap = new Snap(lenis, { type: "mandatory", debounce: 300, duration: 0.05, onSnapStart: () => encajes++ });
snap.add(1000);
for (let i = 0; i < 6; i++) {
  rueda(10);
  await espera(60);
}
const durante = encajes;
await espera(800);
const despues = encajes;
lenis.destroy();
snap.destroy();
// prueba: durante === 0 && despues === 1
```

La posición prevista cuenta dos veces el último delta, y `lerp` de `Snap` se pierde si Lenis tiene `duration`:

```js
const lenis = new Lenis({ autoRaf: true, duration: 0.05 });
const snap = new Snap(lenis, { type: "mandatory", debounce: 200, duration: 0.05 });
snap.add(1000);
snap.add(1500);
rueda(1100); // termina en 1100, a 100 px de 1000
await espera(100);
const aterriza = lenis.scroll;
await espera(500);
const encaja = lenis.scroll;
lenis.destroy();
snap.destroy();
// prueba: aterriza === 1100 && encaja === 1500
```

```js
const lenis = new Lenis({ duration: 2, easing: (t) => t });
const snap = new Snap(lenis, { lerp: 1 });
snap.add(1000);
snap.goTo(0);
lenis.raf(1000);
for (let i = 1; i <= 25; i++) lenis.raf(1000 + i * 16); // 400 ms
const conLerp = lenis.animatedScroll;
lenis.destroy();
snap.destroy();
// prueba: conLerp > 150 && conLerp < 250
```

## Trampas

- **Deltas grandes apuntan al punto equivocado.** Snap suma el último delta a `scroll` **ya aplicado**: con un gesto de 1100 px terminado en 1100, prevé 2200 y elige 1500 en vez de 1000. Afecta más cuanto mayor sea `wheelMultiplier` o más corta la animación. [C] [E]
- **`lock` sin subir `distanceThreshold`.** La distancia se mide desde la posición prevista, que crece con el gesto. Con `'50%'` en una ventana de 700 y diapositivas de pantalla completa, una muesca corta queda fuera del umbral y no pasa nada; `rueda(500)` hacia 800, o cuatro muescas de 100 hacia 700, sí llegan. El resultado depende de la fuerza del gesto: usa `'100%'`, como el README, o más. [C] [E]
- **`lerp` de `Snap` con `duration` en la instancia.** No tiene efecto: `undefined` hereda la `duration`, que gana. Es la regla de [`opc-suavizado`](../02-opciones/opc-suavizado.md). [C] [E]
- **Encaje sin gesto.** Teclado, barra y `scrollTo` no lo activan: no pasan por `virtual-scroll`. [C]
- **`debounce` corto con rueda continua.** Un valor bajo encaja a media inercia del trackpad. En diapositivas, `0` funciona porque el `lock` retiene los gestos. [P]
- **Con toque nativo**, el encaje llega `debounce` ms después de levantar el dedo, posiblemente con la inercia nativa en marcha. No se ha probado en dispositivo. [P]
- **`distanceThreshold` con un viewport que no es el del contenedor.** Siempre usa la ventana. Ver [`snp-elementos`](snp-elementos.md). [C]
- **CSS `scroll-snap` a la vez.** Interfiere. Quítalo si usas `Snap`. [O]
