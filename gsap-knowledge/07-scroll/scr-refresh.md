---
id: scr-refresh
titulo: refresh, cuándo y cómo se recalculan las posiciones
capa: 07-scroll
tipo: concepto
ambito: ScrollTrigger
resumen: Diferencia entre refresh y update, qué dispara un refresco, orden de creación, sort, refreshPriority, invalidateOnRefresh, saveStyles y memoria del scroll.
api: [ScrollTrigger.refresh, ScrollTrigger.update, ScrollTrigger.sort, ScrollTrigger.saveStyles, ScrollTrigger.clearScrollMemory, ScrollTrigger.addEventListener, ScrollTrigger.removeEventListener, ScrollTrigger.Vars.onRefresh, ScrollTrigger.Vars.onRefreshInit, ScrollTrigger.Vars.invalidateOnRefresh, ScrollTrigger.Vars.refreshPriority]
requiere: [scr-start-end]
relacionadas: [scr-pin, scr-estaticos, scr-instancia, scr-normalize, nuc-matchmedia, nuc-context, cal-st-errores, fra-agnostico]
etiquetas: [scroll, responsive, medidas]
fuentes:
  - docs/v3/Plugins/ScrollTrigger/static.refresh().md
  - docs/v3/Plugins/ScrollTrigger/refresh().md
  - docs/v3/Plugins/ScrollTrigger/static.update().md
  - docs/v3/Plugins/ScrollTrigger/static.sort().md
  - docs/v3/Plugins/ScrollTrigger/static.saveStyles().md
  - docs/v3/Plugins/ScrollTrigger/static.clearScrollMemory().md
  - docs/v3/Plugins/ScrollTrigger/static.addEventListener().md
  - docs/v3/Plugins/ScrollTrigger/static.removeEventListener().md
estado: verificado
version: 3.15.1
---
# refresh

Como `start` y `end` son fotos del DOM, cualquier cambio de layout las deja viejas. `ScrollTrigger.refresh()` vuelve a medirlas todas. Ocurre solo al redimensionar, y debes pedirlo cuando cambias el DOM tú.

## Modelo mental

| | `refresh()` | `update()` |
|---|---|---|
| Qué hace | Recalcula `start` y `end` | Lee el scroll y actualiza `progress`, animaciones y callbacks |
| Coste | Alto: quita pines, revierte y mide | Bajo |
| Cuándo llamarlo | Tras cambios de layout | Casi nunca: lo hace el evento `scroll` |

**Se dispara solo** en `load`, `DOMContentLoaded`, `visibilitychange` (si el tamaño cambió) y `resize`; `autoRefreshEvents` en [`config()`](scr-estaticos.md) ajusta la lista. También lo encolan crear un `pin` y un cambio de `matchMedia`. El redimensionado espera 200 ms de calma. [O] [C]

**Pasos** [O]: se emite `refreshInit`; cada instancia devuelve pines y animaciones `scrub` a su estado original (`revert`); se miden las posiciones, reevaluando `start` y `end` si son funciones; se restauran pines y animaciones; se hace `update()`; se llama a `onRefresh`; se emite `refresh`.

Tras cada `refreshInit` se emite `revert` y, dentro de la instancia, el orden es `onRefreshInit`, medición, `onRefresh`. [E]

| Evento global | Cuándo |
|---|---|
| `refreshInit` | Justo antes de medir |
| `revert` | Tras retirar espaciadores y revertir |
| `refresh` | Al terminar todo |
| `scrollStart`, `scrollEnd` | Empieza o termina el scroll (fin: unos 200 ms sin eventos y sin puntero pulsado) [O] |
| `matchMedia` | Tras aplicarse un punto de ruptura |

`ScrollTrigger.addEventListener(tipo, fn)` y `removeEventListener(tipo, fn)` son estáticos. No están ligados a una instancia. Si un oyente de `refreshInit` devuelve un `gsap.set()`, ese estado se revierte al acabar el refresco. [O]

`refresh(true)` es el modo "seguro": espera 200 ms y, si hay un scroll en curso, hasta que termine, sin interrumpirlo [C]. Es el indicado dentro de un `click` que expande contenido. [O]

## Ejemplo

```html
<div class="acordeon" style="height:300px"></div>
<div class="objetivo" style="height:100px"></div>
```

```js
const orden = [];
ScrollTrigger.addEventListener("refreshInit", () => orden.push("refreshInit"));
ScrollTrigger.addEventListener("revert", () => orden.push("revert"));
ScrollTrigger.addEventListener("refresh", () => orden.push("refresh"));

const st = ScrollTrigger.create({
  trigger: ".objetivo",
  start: "top top",
  onRefreshInit: () => orden.push("onRefreshInit"),
  onRefresh: () => orden.push("onRefresh"),
});
await new Promise((r) => setTimeout(r, 30));
orden.length = 0;

const antes = st.start;
document.querySelector(".acordeon").style.height = "600px";
const sinRefrescar = st.start; // la foto vieja
ScrollTrigger.refresh();

// prueba: antes === 300
// prueba: sinRefrescar === 300
// prueba: st.start === 600
// prueba: orden.join() === "refreshInit,onRefreshInit,revert,onRefresh,refresh"
```

### Valores que deben reevaluarse

Una función en `start`/`end` se relee en cada refresco. Para que los valores **de la animación** también lo hagan, añade `invalidateOnRefresh: true`, que vacía los valores iniciales y destinos grabados. [O]

```html
<div class="hueco" style="height:500px"></div>
<div class="pista" style="width:400px"><div class="movil"></div></div>
```

```js
const pista = document.querySelector(".pista");
const tw = gsap.to(".movil", {
  x: () => pista.offsetWidth,
  ease: "none",
  scrollTrigger: {
    trigger: ".pista",
    start: "top top",
    end: () => "+=" + pista.offsetWidth,
    scrub: true,
    invalidateOnRefresh: true,
  },
});
pista.style.width = "800px";
ScrollTrigger.refresh();
window.scrollTo(0, tw.scrollTrigger.end);
ScrollTrigger.update();

// prueba: tw.scrollTrigger.end - tw.scrollTrigger.start === 800
// prueba: gsap.getProperty(".movil", "x") === 800
```

### Orden de creación

ScrollTrigger refresca en orden de creación, y cada pin añade distancia a lo que queda debajo. Si lo de abajo se creó antes, su `start` no incluye el pin, y `refresh()` **no lo corrige**, porque repite el mismo orden. Hace falta `sort()`, que ordena por `refreshPriority` y luego por posición. [O] [E]

```html
<div class="uno" style="height:1000px"></div>
<div class="dos" style="height:200px"></div>
<div class="tres" style="height:800px"></div>
```

```js
const abajo = ScrollTrigger.create({ trigger: ".tres", start: "top top" }); // creada antes, pero más abajo
const fijo = ScrollTrigger.create({ trigger: ".dos", pin: true, start: "top top", end: "+=400" });
ScrollTrigger.refresh();
const trasRefresh = abajo.start;

ScrollTrigger.sort();
ScrollTrigger.refresh();

// prueba: trasRefresh === 1200
// prueba: abajo.start === 1600
// prueba: ScrollTrigger.getAll()[0] === fijo
```

`refreshPriority` modifica ese orden: más alto, antes. Definirlo en cualquier instancia activa la ordenación en el siguiente refresco. También puedes pasar tu comparador a `sort()`, como en `Array.sort`. [O]

```js
const ultimo = ScrollTrigger.create({ start: 0, end: "bottom bottom", trigger: ".tres", refreshPriority: -1 });
const primero = ScrollTrigger.create({ trigger: ".uno", refreshPriority: 1 });
ScrollTrigger.sort();

// prueba: ScrollTrigger.getAll()[0] === primero
// prueba: ScrollTrigger.getAll()[1] === ultimo
```

### Estilos en el revert: `saveStyles()`

Si algo aplica estilos en línea fuera de GSAP, el `revert` puede perderlos o, si son de una animación, dejarlos en medidas. `ScrollTrigger.saveStyles(".panel")` hace una foto del `style` actual y solo restaura eso al revertir. Llámalo antes de crear las animaciones sobre esos elementos. [O]

```js
const caja = document.querySelector(".dos");
caja.style.color = "red";
ScrollTrigger.saveStyles(".dos");
gsap.to(".dos", { x: 50, duration: 0.05 });

// prueba: caja.style.color === "red"
```

### Memoria del scroll

`ScrollTrigger.clearScrollMemory(scrollRestoration?)` borra las posiciones grabadas para que un `refresh()` no devuelva la página a la anterior. Es útil en navegación sin recarga, cuando la vista nueva no debe heredar la posición de la anterior. Con `"manual"` o `"auto"` fija además `history.scrollRestoration`. [O]

```js
ScrollTrigger.clearScrollMemory("manual");

// prueba: history.scrollRestoration === "manual"
```

## Cuando el DOM cambia después de crear los triggers

Es la causa más frecuente de disparos desplazados, y no depende de la tecnología: tu código mide en un momento y la página termina de formarse en otro. ScrollTrigger se entera de los eventos de arriba, no de que tu contenido cambie; eso hay que comunicárselo. [C] [P]

| Situación | Qué pasa | Qué hacer [P] |
|---|---|---|
| Carga diferida (imágenes, fuentes, datos remotos) | La altura crece después de medir y todo lo de abajo queda con `start` antiguo | Reservar espacio con `width`/`height` o `aspect-ratio`. Si no se puede, `refresh()` al terminar de cargar |
| Render asíncrono (el contenido se pinta tras una promesa o un cambio de estado) | El elemento aún no existe, o existe vacío y mide 0 | Crear los triggers **después** de que el contenido esté en el DOM, no al arrancar la página |
| Contenido que crece solo (acordeón, lista infinita, tabs) | `resize` de ventana no se dispara, porque cambia un elemento, no la ventana | `refresh()` tras el cambio; `refresh(true)` si es en el mismo evento. Si no controlas quién lo cambia, `ResizeObserver` |
| Navegación sin recarga | Los triggers de la vista anterior siguen vivos, con pines y espaciadores que alteran la altura de la nueva | `revert()` del contexto al retirar la vista; crear la nueva cuando su DOM esté listo; decidir la posición del scroll |

Orden recomendado al cambiar de vista: revertir lo anterior, sustituir el DOM, crear lo nuevo de arriba abajo y, si algo aún puede moverse, un `refresh()` final. Con `gsap.context()` el primer paso es una línea, y deshace también los pines. [O] [E]

```html
<main class="vista"><div class="cabecera" style="height:300px"></div><div class="tramo" style="height:200px"></div></main>
```

```js
const montar = () => gsap.context(() => {
  ScrollTrigger.create({ trigger: ".tramo", pin: true, start: "top top", end: "+=500" });
});

const vistaA = montar();
const tramo = document.querySelector(".tramo");
const conPin = document.documentElement.scrollHeight;
const padreConPin = tramo.parentNode.className;

vistaA.revert();                     // retirar la vista: quita instancia y espaciador
const trasRevert = [ScrollTrigger.getAll().length, tramo.parentNode.className, conPin - document.documentElement.scrollHeight];

document.querySelector(".vista").innerHTML =
  '<div class="cabecera" style="height:900px"></div><div class="tramo" style="height:200px"></div>';

const vistaB = montar();
const nuevo = ScrollTrigger.getAll()[0];

// prueba: padreConPin === "pin-spacer"
// prueba: trasRevert.join() === "0,vista,500"
// prueba: nuevo.start === 900 && nuevo.end === 1400
```

Contenido que crece después de crear el trigger, añadido sin avisar:

```html
<div class="lista"><div style="height:400px"></div></div>
<div class="final" style="height:100px"></div>
```

```js
const final = ScrollTrigger.create({ trigger: ".final", start: "top top" });
const medido = final.start;

document.querySelector(".lista").insertAdjacentHTML("beforeend", '<div style="height:600px"></div>');
const sinAvisar = final.start;
ScrollTrigger.refresh();

// prueba: medido === 400
// prueba: sinAvisar === 400
// prueba: final.start === 1000
```

Si la altura cambia por causas que no controlas, observa el contenedor y agrupa los avisos: un `refresh()` por cada cambio sería caro. ScrollSmoother hace esto mismo con `autoResize`. [C]

```js fragmento
const aplazado = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
const observador = new ResizeObserver(() => aplazado.restart(true));
observador.observe(document.querySelector(".contenido"));

// al retirar la vista
observador.disconnect();
aplazado.kill();
```

## Trampas

- **Imágenes sin dimensiones.** Cargan después y empujan todo sin `resize`. Reserva `width`/`height` o `aspect-ratio`; en último caso, llama a `refresh()` tras `load`. [P]
- **Contenido añadido por `fetch`, acordeones, tabs.** Llama a `ScrollTrigger.refresh()`. Si lo haces en el mismo `click`, usa `refresh(true)`. [O]
- **Instancia concreta frente a global.** `st.refresh()` solo mide esa; lo normal es el estático, porque los pines de arriba afectan a todo lo de abajo. [O]
- **Timelines.** Esperan un tick para medir, porque aún no tienen hijos. Si tienen pin y creas otras instancias después, llama antes a `tl.scrollTrigger.refresh()`. [O]
- **`ScrollTrigger.update()` no recalcula nada.** Si los disparos caen en sitio equivocado, es `refresh()`. [O]
- **Refrescar en un bucle o en cada `resize` manual.** Es caro y fuerza layout. El plugin ya lo gestiona con retardo. [O] [P]
- **Barra de direcciones móvil.** Por defecto, en dispositivos solo táctiles ScrollTrigger ignora los cambios de alto menores del 25 %, para no refrescar ([scr-normalize](scr-normalize.md)). [C]
- **`gsap.from()` en bucle con `invalidateOnRefresh`** repinta el estado inicial en cada refresco; comprueba que no parpadee. [P]
- **Responsive.** Crea las instancias dentro de [`gsap.matchMedia()`](../02-nucleo/nuc-matchmedia.md), que las revierte al cambiar de punto de ruptura; `ScrollTrigger.matchMedia()` está en desuso. [O]
