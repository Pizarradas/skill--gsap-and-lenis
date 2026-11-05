---
id: nuc-stagger
titulo: stagger - escalonar varios objetivos
capa: 02-nucleo
tipo: api
ambito: core
resumen: Número, objeto o función; each frente a amount, from, grid, axis y ease; repeat y callbacks a nivel de tween o de cada elemento.
api: [gsap.TweenVars.stagger, gsap.StaggerVars.repeat, gsap.StaggerVars.repeatDelay, gsap.StaggerVars.repeatRefresh, gsap.StaggerVars.yoyo, gsap.StaggerVars.yoyoEase, gsap.StaggerVars.easeReverse]
relacionadas: [nuc-tween-metodos, nuc-keyframes, nuc-repeat-yoyo, utl-funciones, tim-basico]
etiquetas: [stagger, secuencia, grid]
fuentes:
  - resources/getting-started/Staggers.md
estado: verificado
version: 3.15.1
---
# stagger

`stagger` retrasa el arranque de cada objetivo respecto al anterior. Evita crear un tween por elemento: internamente GSAP genera un timeline con un sub-tween por objetivo, y lo devuelto sigue siendo un solo `Tween` que se controla como uno. [O] [C]

## Firma

```text
stagger: número                 segundos entre arranques; negativo, en orden inverso
stagger: { each | amount, from, grid, axis, ease, base, ...callbacks, repeat... }
stagger: (index, target, list) => segundos desde el inicio
```

| Opción | Valor | Efecto |
|---|---|---|
| `each` | número | Tiempo entre arranques; el total depende de cuántos elementos haya [O] |
| `amount` | número | Tiempo total a repartir; usa uno u otro, no ambos [O] |
| `from` | índice, `"start"`, `"center"`, `"edges"`, `"end"`, `"random"`, decimal o `[x, y]` | Origen del escalonado. `0` por defecto [O] |
| `grid` | `[filas, columnas]` o `"auto"` | Calcula distancias en cuadrícula; `"auto"` mide con `getBoundingClientRect()` [O] |
| `axis` | `"x"` o `"y"` | Con `grid`, considera solo un eje [O] |
| `ease` | ease | Reparte los arranques, no anima. `"none"` por defecto [O] |
| `base` | número | Retardo añadido a todos. Sale de `utils.distribute`, sin documentar para stagger [C] [E] |

También admite `repeat`, `repeatDelay`, `repeatRefresh`, `yoyo`, `easeReverse`, `yoyoEase` y los callbacks: **dentro del objeto** se aplican a cada sub-tween. [O] [C]

| Dónde pones `repeat` o `onComplete` | Se aplica a |
|---|---|
| Nivel superior de `vars` | Toda la secuencia: espera a que acaben todos |
| Dentro de `stagger: {}` | Cada elemento por separado, sin esperar a los demás |

## Ejemplo

```js
const hileras = gsap.to(".hilera", { x: 10, duration: 1, stagger: 0.1, paused: true });
const reparto = gsap.to(".hilera", { y: 10, duration: 1, stagger: { amount: 0.6 }, paused: true });

// prueba: hileras.targets().length === 3
// prueba: hileras.duration() === 1.2
// prueba: reparto.duration() === 1.6
```

`from` cambia el orden de llegada, y el total se mantiene:

```html
<div class="celda"></div><div class="celda"></div><div class="celda"></div><div class="celda"></div>
```

```js
const arranques = (stagger) =>
  gsap.to(".celda", { x: 1, duration: 1, stagger, paused: true })
    .timeline.getChildren().map((t) => t.startTime());

const centro = arranques({ each: 0.1, from: "center" });
const funcion = arranques((i) => i * i * 0.1);
const conBase = arranques({ each: 0.1, base: 0.5 });
const rejilla = arranques({ each: 0.1, grid: [2, 2], axis: "y" });

// prueba: JSON.stringify(centro) === "[0,0,0.3,0.3]"
// prueba: JSON.stringify(funcion) === "[0,0.1,0.4,0.9]"
// prueba: JSON.stringify(conBase) === "[0.5,0.6,0.7,0.8]"
// prueba: JSON.stringify(rejilla) === "[0,0,0.2,0.2]"
```

El nivel decide cuántas veces se ejecuta un callback, y cómo se calcula la duración:

```html
<div class="punto"></div><div class="punto"></div>
```

```js
const cuenta = { sub: 0, total: 0 };
gsap.to(".punto", {
  x: 1,
  duration: 0.03,
  onComplete() { cuenta.total++; },
  stagger: { each: 0.02, onComplete() { cuenta.sub++; } },
});

const dentro = gsap.to(".punto", { y: 1, duration: 0.1, stagger: { each: 0.05, repeat: 1, yoyo: true }, paused: true });
const fuera = gsap.to(".punto", { z: 1, duration: 0.1, stagger: 0.05, repeat: 1, paused: true });

// prueba: cuenta.sub === 2 && cuenta.total === 1
// prueba: dentro.repeat() === 0 && dentro.duration() === 0.25
// prueba: fuera.repeat() === 1 && fuera.duration() === 0.15 && fuera.totalDuration() === 0.3
```

## Trampas

- **`each` con `from: "center"` no es el hueco entre vecinos.** El total sigue siendo `each × (n − 1)` y se reparte según la distancia al origen. Con 4 elementos y `each: 0.1`, los arranques son 0 y 0.3. Si quieres fijar el final, usa `amount`. [C] [E]
- **`stagger` función devuelve tiempo absoluto** desde el inicio, no el hueco con el anterior. [O] [E]
- **`duration()` incluye el escalonado.** Un tween de 1 s con 3 objetivos y `stagger: 0.1` dura 1.2. [E]
- **`grid` son filas y columnas**, y asume flujo de arriba a la izquierda hacia abajo a la derecha. Para disposiciones irregulares, usa una función. [O]
- **`grid: "auto"` no se recalcula al redimensionar**: se mide una vez, al crear el tween. Reconstruye en un `matchMedia` o al cambiar el layout. [O]
- **`this` en un callback dentro de `stagger`** es el sub-tween: `this.targets()[0]` da el elemento de esa vuelta. Con arrow functions no hay `this`. [E]
- **Un solo objetivo.** Un `stagger` numérico no tiene efecto visible. Con objeto sí: `repeat`, `yoyo` o `base` dentro de él siguen actuando (`{ each: 0.1, repeat: 1, yoyo: true }` duplica la duración). Si esperabas varios objetivos, revisa el selector. [E]
- **`repeat: -1` dentro de `stagger`.** Cada elemento repite por su cuenta, así que el tween contenedor no termina nunca y su `onComplete` de nivel superior no llega a dispararse. [C] [P]
