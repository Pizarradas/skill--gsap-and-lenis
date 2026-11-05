---
id: scr-scrolltrigger
titulo: ScrollTrigger, enlazar cualquier cosa con la posición de scroll
capa: 07-scroll
tipo: plugin
ambito: ScrollTrigger
resumen: Mapa del plugin. Cómo funciona por dentro, formas de crearlo, tabla completa de ScrollTrigger.Vars y a qué ficha ir para cada problema.
api: [ScrollTrigger, ScrollTrigger.create, ScrollTrigger.Vars.trigger, ScrollTrigger.Vars.scroller, ScrollTrigger.Vars.markers, ScrollTrigger.Vars.id, ScrollTrigger.Vars.immediateRender, ScrollTrigger.StaticVars.animation, ScrollTrigger.MarkersVars.startColor, ScrollTrigger.MarkersVars.endColor, ScrollTrigger.MarkersVars.fontSize, ScrollTrigger.MarkersVars.fontWeight, ScrollTrigger.MarkersVars.indent]
relacionadas: [scr-start-end, scr-scrub, scr-pin, scr-toggle, scr-refresh, scr-instancia, scr-estaticos, cal-st-errores, nuc-context, fra-agnostico]
etiquetas: [scroll, plugin, mapa]
fuentes:
  - docs/v3/Plugins/ScrollTrigger.md
  - docs/v3/Plugins/ScrollTrigger/*
  - resources/st-mistakes.md
  - https://github.com/greensock/gsap-skills
estado: verificado
version: 3.15.1
---
# ScrollTrigger

Convierte tramos de scroll en acciones: reproduce una animación al entrar, ata su cabezal a la barra (`scrub`), fija elementos (`pin`), ajusta a puntos (`snap`) o solo avisa con callbacks, sin animación alguna. No secuestra el scroll: el navegador sigue desplazando de forma nativa. [O]

## Para qué sirve

| Quieres | Usa | Ficha |
|---|---|---|
| Disparar una animación al llegar a un punto | `toggleActions`, callbacks | [scr-toggle](scr-toggle.md) |
| Que la animación avance con la barra | `scrub` | [scr-scrub](scr-scrub.md) |
| Dejar un elemento quieto mientras se hace scroll | `pin` | [scr-pin](scr-pin.md) |
| Definir dónde empieza y acaba | `start`, `end`, `endTrigger` | [scr-start-end](scr-start-end.md) |
| Terminar en posiciones concretas | `snap` | [scr-snap](scr-snap.md) |
| Revelar muchos elementos con escalonado | `ScrollTrigger.batch()` | [scr-batch](scr-batch.md) |
| Secciones que se mueven en horizontal | `pin` + `containerAnimation` | [scr-horizontal](scr-horizontal.md) |
| Medidas desfasadas tras cambiar el DOM | `refresh()` | [scr-refresh](scr-refresh.md) |
| Saltos de la barra de direcciones en móvil | `normalizeScroll()` | [scr-normalize](scr-normalize.md) |
| Scroll suavizado y parallax | ScrollSmoother | [scr-smoother](scr-smoother.md) |
| Otra librería de scroll suave | `scrollerProxy()` | [scr-scrollerproxy](scr-scrollerproxy.md) |

**Modelo interno.** No vigila elementos en cada frame. Calcula por adelantado `start` y `end` (dos números de scroll) con el DOM en su flujo natural, y luego solo compara la posición del scroll con esos dos números. Por eso es rápido, y por eso sus medidas no se enteran de que has movido un elemento o cambiado el DOM hasta el siguiente [`refresh()`](scr-refresh.md). A diferencia de `IntersectionObserver`, conoce el progreso entre dos puntos y por eso permite `scrub`. [O]

## Registro

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
```

**Sin empaquetador:** `<script>` con `dist/ScrollTrigger.min.js` (global `ScrollTrigger`), o entrada `gsap/ScrollTrigger` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

No forma parte del núcleo. Sin registrar, el empaquetador puede eliminarlo por *tree shaking* y fallar solo en producción. Registrar dos veces es inocuo. [O]

## API

Tres formas de crearlo. La primera y la tercera son equivalentes; un atajo de cadena equivale a `{ trigger: cadena }` [C]:

```js
gsap.to(".tarjeta", { x: 100, scrollTrigger: ".tarjeta" });              // atajo: solo trigger

gsap.to(".foto", { x: 100, scrollTrigger: { trigger: ".foto", scrub: true } }); // dentro de la animación

const sinAnimacion = ScrollTrigger.create({ trigger: ".franja", onToggle: (self) => {} }); // independiente

// prueba: ScrollTrigger.getAll().length === 3
// prueba: sinAnimacion.animation === undefined
// prueba: sinAnimacion.trigger === document.querySelector(".franja")
```

Para ligar una animación ya creada a una instancia independiente se usa `animation` (`ScrollTrigger.StaticVars.animation`, solo en `create()`):

```js
const giro = gsap.to(".rueda", { rotation: 90, ease: "none", paused: true });
const opciones = { trigger: ".rueda", scrub: true, animation: giro };
const ligado = ScrollTrigger.create(opciones);

// prueba: ligado.animation === giro
// prueba: giro.scrollTrigger === ligado
```

Una instancia controla una sola animación: si hay varias, agrúpalas en un timeline y pon `scrollTrigger` en el timeline. [O]

### Todas las opciones (`ScrollTrigger.Vars`)

| Opción | Valor | Por defecto | Ficha |
|---|---|---|---|
| `trigger` | elemento o selector | — | [start-end](scr-start-end.md) |
| `start` / `end` | cadena, número o función | `"top bottom"` / `"bottom top"`; con `pin`, `start` es `"top top"`; sin `trigger`, `0` / máximo | [start-end](scr-start-end.md) |
| `endTrigger` | elemento o selector | el `trigger` | [start-end](scr-start-end.md) |
| `scroller` | elemento, selector o `window` | `window` | esta |
| `horizontal` | booleano | `false` | [horizontal](scr-horizontal.md) |
| `containerAnimation` | Tween o Timeline lineal | — | [horizontal](scr-horizontal.md) |
| `scrub` | `true` o segundos | sin scrub | [scrub](scr-scrub.md) |
| `toggleActions` | cuatro acciones | `"play none none none"` | [toggle](scr-toggle.md) |
| `toggleClass` | cadena u objeto | — | [toggle](scr-toggle.md) |
| `once` | booleano | `false` | [toggle](scr-toggle.md) |
| `onEnter` `onLeave` `onEnterBack` `onLeaveBack` `onToggle` `onUpdate` | función | — | [toggle](scr-toggle.md) |
| `onKill` | función | — | [instancia](scr-instancia.md) |
| `onRefresh` `onRefreshInit` | función | — | [refresh](scr-refresh.md) |
| `onScrubComplete` | función | — | [scrub](scr-scrub.md) |
| `onSnapComplete` | función | — | [snap](scr-snap.md) |
| `pin` | booleano, elemento o selector | — | [pin](scr-pin.md) |
| `pinSpacing` `pinSpacer` `pinType` `pinReparent` `pinnedContainer` `anticipatePin` | varios | ver ficha | [pin](scr-pin.md) |
| `snap` | número, array, función, `"labels"`, `"labelsDirectional"` u objeto | — | [snap](scr-snap.md) |
| `fastScrollEnd` `preventOverlaps` | booleano, número o cadena | — | [toggle](scr-toggle.md) |
| `invalidateOnRefresh` | booleano | `false` | [refresh](scr-refresh.md) |
| `refreshPriority` | número | `0` | [refresh](scr-refresh.md) |
| `immediateRender` | booleano | — (ponlo en la animación, no aquí) | [scrub](scr-scrub.md) |
| `markers` | booleano u objeto | `false` | esta |
| `id` | cadena | el `id` de la animación | [estáticos](scr-estaticos.md) |

Si la animación tiene `id` y la instancia no, el `id` se hereda: `ScrollTrigger.getById()` la encuentra por él. [C]

### `scroller`: un contenedor con scroll propio

```html
<div class="lista" style="height:300px;overflow:auto">
  <div style="height:500px"></div>
  <div class="fila" style="height:100px"></div>
  <div style="height:800px"></div>
</div>
```

```js
const fila = ScrollTrigger.create({ trigger: ".fila", scroller: ".lista", start: "top top" });
document.querySelector(".lista").scrollTop = 550;
ScrollTrigger.update();

// prueba: fila.start === 500
// prueba: fila.isActive === true
// prueba: fila.scroller === document.querySelector(".lista")
```

### `markers`: depuración visual

`markers: true` usa `startColor: "green"`, `endColor: "red"`, `fontSize: "16px"`, `fontWeight: "normal"` e `indent: 0`; un objeto (`ScrollTrigger.MarkersVars`) cambia cualquiera de ellos. [O] Añade cuatro elementos por instancia, dos en la zona del scroll y dos ligados al `trigger`. [E]

```js
ScrollTrigger.create({ trigger: ".pieza", markers: { startColor: "blue", indent: 40, fontSize: "12px" } });

// prueba: document.querySelectorAll(".gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end").length === 4
```

## Ejemplo

Un timeline atado al scroll, con el fin relativo al inicio:

```html
<div style="height:400px"></div>
<section class="escena" style="height:300px"><div class="titular"></div></section>
<div style="height:1000px"></div>
```

```js
const tl = gsap.timeline({
  defaults: { ease: "none" },
  scrollTrigger: { trigger: ".escena", start: "top top", end: "+=400", scrub: true },
});
tl.to(".titular", { x: 100, duration: 1 }).to(".titular", { y: 50, duration: 1 });
tl.scrollTrigger.refresh();

window.scrollTo(0, 600); // la mitad del tramo 400-800
ScrollTrigger.update();  // ver la nota de abajo

// prueba: tl.scrollTrigger.start === 400 && tl.scrollTrigger.end === 800
// prueba: tl.scrollTrigger.progress === 0.5
// prueba: gsap.getProperty(".titular", "x") === 100 && gsap.getProperty(".titular", "y") === 0
```

> En uso normal no se llama a `update()`: ScrollTrigger reacciona solo al evento `scroll`. Los ejemplos de esta capa lo llaman porque el navegador de pruebas retrasa ese evento en iframes fuera de pantalla, y así la aserción no depende de ese retardo. El scroll sigue siendo real. [E]

## Trampas

- **`scrollTrigger` en tweens anidados de un timeline.** El cabezal del hijo lo manda el padre y el scroll no puede mandar a la vez. Pon uno solo en el timeline padre o deja los tweens independientes. [O]
- **Un tween con varios objetivos y un solo `scrollTrigger`** anima todos a la vez. Para que cada elemento se dispare por su cuenta, haz un bucle con un `trigger` por elemento o usa [`batch()`](scr-batch.md). [O]
- **Crear las instancias fuera de orden.** Con pines por encima, calcula mal. Créalas de arriba abajo; ver [scr-refresh](scr-refresh.md). [O]
- **`content-visibility: auto|hidden`** en el trigger impide medir como `display: none`. Evítalo en elementos con ScrollTrigger. [O]
- **`scroll-behavior: smooth`** en CSS retrasa el scroll que ScrollTrigger ordena (`snap` lo anula por su cuenta). Quítalo en páginas con ScrollTrigger. [C] [P]
- **Olvidar la limpieza al retirar la vista.** Crea las instancias dentro de `gsap.context()` y llama a `revert()` cuando la vista desaparezca; un pin que sobrevive es la causa típica de saltos. [O]
- **Dejar `markers` en producción.** Son elementos reales en el DOM; quítalos o condiciónalos al entorno. [P]
