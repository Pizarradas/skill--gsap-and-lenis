---
id: scr-batch
titulo: ScrollTrigger.batch(), coordinar muchos elementos
capa: 07-scroll
tipo: api
ambito: ScrollTrigger
resumen: Crea una instancia por elemento y agrupa en arrays los callbacks ocurridos casi a la vez. Ideal para revelar rejillas con escalonado sin un bucle de animaciones.
api: [ScrollTrigger.batch, ScrollTrigger.BatchVars.interval, ScrollTrigger.BatchVars.batchMax, ScrollTrigger.BatchVars.onEnter, ScrollTrigger.BatchVars.onLeave, ScrollTrigger.BatchVars.onEnterBack, ScrollTrigger.BatchVars.onLeaveBack, ScrollTrigger.BatchVars.onToggle, ScrollTrigger.BatchVars.onUpdate, ScrollTrigger.BatchVars.onRefresh, ScrollTrigger.BatchVars.onRefreshInit, ScrollTrigger.BatchVars.start, ScrollTrigger.BatchVars.end, ScrollTrigger.BatchVars.once, ScrollTrigger.BatchVars.scroller, ScrollTrigger.BatchVars.horizontal, ScrollTrigger.BatchVars.toggleClass, ScrollTrigger.BatchVars.fastScrollEnd, ScrollTrigger.BatchVars.preventOverlaps, ScrollTrigger.BatchVars.anticipatePin, ScrollTrigger.BatchVars.pin, ScrollTrigger.BatchVars.pinReparent, ScrollTrigger.BatchVars.pinSpacing, ScrollTrigger.BatchVars.pinSpacer, ScrollTrigger.BatchVars.pinType]
relacionadas: [scr-toggle, scr-refresh, nuc-stagger, rec-revelar-scroll]
etiquetas: [scroll, stagger, rejilla]
fuentes:
  - docs/v3/Plugins/ScrollTrigger/static.batch().md
estado: verificado
version: 3.15.1
---
# ScrollTrigger.batch()

Un ScrollTrigger por elemento dispara su callback por separado, y entonces no puedes aplicar un escalonado a "los que acaban de entrar". `batch()` retrasa los callbacks un intervalo mínimo y te los entrega juntos. [O]

## Firma

```text
ScrollTrigger.batch(objetivos, vars) → ScrollTrigger[]
callback(elementos: Element[], instancias: ScrollTrigger[])
```

| Clave | Tipo | Nota |
|---|---|---|
| `interval` | segundos | Tiempo máximo de recogida desde el primer callback. Por defecto 0.016 [C] |
| `batchMax` | entero o función | Tamaño máximo. Al llenarse, entrega ya y abre otro lote. La función se reevalúa en cada `refresh` [O] |
| `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack`, `onToggle`, `onUpdate`, `onRefresh` | función | Reciben **dos arrays**, no la instancia. Cada tipo se agrupa aparte [O] [C] |
| `onRefreshInit` | función | Es la excepción: firma normal (instancia) y sin agrupar [O] |
| `start`, `end`, `once`, `scroller`, `horizontal`, `toggleClass`, `fastScrollEnd`, `preventOverlaps` | | Como en una instancia normal |
| `pin`, `pinSpacing`, `pinSpacer`, `pinType`, `pinReparent`, `anticipatePin` | | Están en los tipos, pero fijar en lote no suele tener sentido [P] |

No admite lo ligado a una animación (`animation`, `invalidateOnRefresh`, `onSnapComplete`, `onScrubComplete`, `scrub`, `snap`, `toggleActions`) ni `trigger`, porque cada objetivo es su propio trigger. [O]

## Ejemplo

Ocho filas de 300 px y `start: "top 80%"` (560 px). Al cargar ya hay dos por encima de esa línea, y ese es el primer lote:

```html
<style>.fila { height: 300px; opacity: 0.5; }</style>
<div class="fila"></div><div class="fila"></div><div class="fila"></div><div class="fila"></div>
<div class="fila"></div><div class="fila"></div><div class="fila"></div><div class="fila"></div>
```

```js
const lotes = [];
const instancias = ScrollTrigger.batch(".fila", {
  start: "top 80%",
  interval: 0.05,
  onEnter: (filas, sts) => {
    lotes.push(filas.length + "/" + sts.length);
    gsap.to(filas, { opacity: 1, duration: 0.05, stagger: 0.01 });
  },
});

await new Promise((r) => setTimeout(r, 120));
window.scrollTo(0, 1500);
ScrollTrigger.update();
await new Promise((r) => setTimeout(r, 150));

// prueba: Array.isArray(instancias) && instancias.length === 8
// prueba: lotes.join() === "2/2,5/5"
// prueba: gsap.getProperty(".fila", "opacity") === 1
```

`batchMax` trocea un lote grande. Con el mismo salto de scroll, y `batchMax: 3`, los cinco elementos se entregan en dos llamadas:

```js
const tamanos = [];
ScrollTrigger.batch(".fila", {
  start: "top 80%",
  interval: 0.05,
  batchMax: 3,
  onEnter: (filas) => tamanos.push(filas.length),
});

await new Promise((r) => setTimeout(r, 120));
window.scrollTo(0, 1500);
ScrollTrigger.update();
await new Promise((r) => setTimeout(r, 150));

// prueba: tamanos.join() === "2,3,2"
```

Con estado inicial desplazado, la medición se desvirtúa, porque ScrollTrigger mide con los transforms aplicados. La solución oficial es devolver un `set` en `refreshInit`, que se deshace al acabar [O]:

```js
gsap.set(".fila", { y: 100 });
ScrollTrigger.addEventListener("refreshInit", () => gsap.set(".fila", { y: 0 }));

const conY = ScrollTrigger.batch(".fila", {
  start: "top 80%",
  onEnter: (filas) => gsap.to(filas, { y: 0, overwrite: true, duration: 0.05 }),
});
ScrollTrigger.refresh();

// prueba: conY.length === 8
```

## Trampas

- **Los callbacks reciben arrays.** `onEnter: (self) => self.progress` da `undefined`, y `onRefreshInit` sí recibe la instancia. [O]
- **Sin `overwrite`, los lotes se pisan.** Entrar y salir rápido lanza tweens enfrentados sobre los mismos elementos. Pon `overwrite: true` en los `gsap.to()` de cada callback. [O] [P]
- **`scrollTrigger.kill()` de cada instancia.** Guardas un array; hay que matarlas todas, o crear el lote en `gsap.context()`. [P]
- **Todo lo que no está aún en el DOM queda fuera.** `batch()` opera sobre los elementos presentes al llamarlo. Con *scroll infinito*, vuelve a llamarlo con los nuevos. [P]
- **`interval` largo retrasa todo,** incluida la reacción al primer elemento. Para revelar, los valores por defecto o 0.05-0.1 s bastan. [P]
- **Rejilla densa con `onLeave`.** Un lote por tipo implica escuchar cuatro callbacks; si solo revelas, usa `once: true` y deja que las instancias se liberen. [P]
