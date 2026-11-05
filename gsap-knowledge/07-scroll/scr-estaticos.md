---
id: scr-estaticos
titulo: Métodos estáticos de ScrollTrigger
capa: 07-scroll
tipo: referencia
ambito: ScrollTrigger
resumen: Tabla de los métodos globales de ScrollTrigger con config, defaults, búsqueda de instancias, medición del viewport, activación y métodos obsoletos.
api: [ScrollTrigger.config, ScrollTrigger.ConfigVars.limitCallbacks, ScrollTrigger.ConfigVars.syncInterval, ScrollTrigger.ConfigVars.autoRefreshEvents, ScrollTrigger.defaults, ScrollTrigger.getAll, ScrollTrigger.getById, ScrollTrigger.isInViewport, ScrollTrigger.positionInViewport, ScrollTrigger.maxScroll, ScrollTrigger.getScrollFunc, ScrollTrigger.isScrolling, ScrollTrigger.killAll, ScrollTrigger.enable, ScrollTrigger.disable, ScrollTrigger.matchMedia, ScrollTrigger.clearMatchMedia, ScrollTrigger.observe, ScrollTrigger.register, ScrollTrigger.version]
relacionadas: [scr-instancia, scr-refresh, scr-snap, nuc-matchmedia]
etiquetas: [scroll, referencia]
fuentes:
  - docs/v3/Plugins/ScrollTrigger/static.config().md
  - docs/v3/Plugins/ScrollTrigger/static.defaults().md
  - docs/v3/Plugins/ScrollTrigger/static.getAll().md
  - docs/v3/Plugins/ScrollTrigger/static.getById().md
  - docs/v3/Plugins/ScrollTrigger/static.isInViewport().md
  - docs/v3/Plugins/ScrollTrigger/static.positionInViewport().md
  - docs/v3/Plugins/ScrollTrigger/static.maxScroll().md
  - docs/v3/Plugins/ScrollTrigger/static.isScrolling().md
  - docs/v3/Plugins/ScrollTrigger/static.killAll().md
  - docs/v3/Plugins/ScrollTrigger/static.matchMedia().md
  - docs/v3/Plugins/ScrollTrigger/static.clearMatchMedia().md
  - docs/v3/Plugins/ScrollTrigger/static.observe().md
  - docs/v3/Plugins/ScrollTrigger/static.create().md
estado: verificado
version: 3.15.1
---
# Métodos estáticos de ScrollTrigger

| Método | Devuelve | Para qué |
|---|---|---|
| `create(vars)` | instancia | Crear sin animación. [scr-scrolltrigger](scr-scrolltrigger.md) |
| `batch(objetivos, vars)` | instancias | Agrupar callbacks. [scr-batch](scr-batch.md) |
| `refresh(safe?)`, `update()`, `sort(fn?)`, `saveStyles()`, `clearScrollMemory()`, `addEventListener()`, `removeEventListener()` | | Medición. [scr-refresh](scr-refresh.md) |
| `normalizeScroll(v?)` | Observer | [scr-normalize](scr-normalize.md) |
| `scrollerProxy(el, vars?)` | | [scr-scrollerproxy](scr-scrollerproxy.md) |
| `snapDirectional(v)` | función | [scr-snap](scr-snap.md) |
| `observe(vars)` | Observer | Igual que `Observer.create()`, sin cargar otro archivo. [scr-observer](scr-observer.md) |
| `config(vars)` | | Comportamiento global |
| `defaults(vars)` | objeto de defaults | Valores por defecto para instancias nuevas |
| `getAll()` | array | Todas, salvo la principal de ScrollSmoother [C] |
| `getById(id)` | instancia o `undefined` | Buscar por `id` |
| `isInViewport(el, ratio?, horizontal?)` | booleano | ¿Está dentro? `ratio` exige esa fracción visible |
| `positionInViewport(el, ref?, horizontal?)` | número | Posición normalizada de 0 (arriba) a 1 (abajo). No se recorta: fuera de pantalla sale de ese rango [C] [E] |
| `maxScroll(scroller, horizontal?)` | número | Máximo de scroll |
| `getScrollFunc(el, horizontal?)` | función | Getter y setter rápido del scroll [C] |
| `isScrolling()` | booleano | ¿Hay scroll en curso? Sin eventos durante 200 ms y sin puntero pulsado es "no" [O] |
| `killAll(allowListeners?)` | | `kill()` en todas menos ScrollSmoother. Salvo `true`, vacía también los oyentes [O] [C] |
| `disable(reset?, kill?)`, `enable()` | | Apaga y enciende todo el sistema [C] |
| `matchMedia(vars)` | | **Obsoleto:** usa [`gsap.matchMedia()`](../02-nucleo/nuc-matchmedia.md) [O] |
| `clearMatchMedia(query?)` | | **Obsoleto** [O] |
| `register(core)` | | Interno, lo llama `gsap.registerPlugin` |
| `isTouch`, `version` | número, cadena | [scr-normalize](scr-normalize.md) para `isTouch` |

## `config()`

| Clave | Por defecto | Efecto |
|---|---|---|
| `limitCallbacks` | `false` | Al recargar a media página, solo dispara callbacks de lo que cambia de estado, no los `onEnter` de todo lo anterior [O] |
| `autoRefreshEvents` | `"visibilitychange,DOMContentLoaded,load,resize"` | Eventos que refrescan. Sin `resize`, el redimensionado deja de medir [O] [C] |
| `syncInterval` | 250 ms | Sondeo de scroll para mantener la velocidad. La documentación dice 200 ms, el código usa 250 [C] |
| `ignoreMobileResize` | `true` en `isTouch === 1` | [scr-normalize](scr-normalize.md) [C] |

## `defaults()`

Solo afecta a instancias creadas después, y solo a claves no definidas. Devuelve el objeto de valores por defecto, que incluye `toggleActions` y `anticipatePin`. ScrollSmoother escribe en él `scroller`. [O] [C] [E]

```js
const previos = ScrollTrigger.defaults({ toggleActions: "play none none reverse" });
const a = ScrollTrigger.create({ trigger: ".pieza" });
const b = ScrollTrigger.create({ trigger: ".pieza", toggleActions: "restart none none none" });

// prueba: a.vars.toggleActions === "play none none reverse"
// prueba: b.vars.toggleActions === "restart none none none"
// prueba: "anticipatePin" in previos
```

## Buscar instancias

```js
const tw = gsap.to(".pieza", { x: 10, id: "entrada", scrollTrigger: { trigger: ".pieza" } });
const libre = ScrollTrigger.create({ id: "libre", trigger: ".pieza" });

// prueba: ScrollTrigger.getById("entrada") === tw.scrollTrigger
// prueba: ScrollTrigger.getById("libre") === libre
// prueba: ScrollTrigger.getById("no-existe") === undefined
// prueba: ScrollTrigger.getAll().length === 2
```

## Medir el viewport

```html
<div class="alto" style="height:1000px"></div>
<div class="bajo" style="height:300px"></div>
```

`.alto` llega a 1000 px en un viewport de 700: su centro está en 500/700 y solo un 70 % es visible.

```js
const centro = ScrollTrigger.positionInViewport(".alto");
const arriba = ScrollTrigger.positionInViewport(".alto", "top");
const pixeles = ScrollTrigger.positionInViewport(".alto", "20");
const porcentaje = ScrollTrigger.positionInViewport(".alto", "50%");
const maximo = ScrollTrigger.maxScroll(window);
const pie = ScrollTrigger.positionInViewport(".alto", "bottom");

const scroll = ScrollTrigger.getScrollFunc(window);
scroll(120);

// prueba: Math.abs(centro - 500 / 700) < 0.001
// prueba: Math.abs(pie - 1000 / 700) < 0.001
// prueba: arriba === 0 && Math.abs(pixeles - 20 / 700) < 0.001 && porcentaje === centro
// prueba: scroll() === 120 && window.scrollY === 120
// prueba: maximo === document.documentElement.scrollHeight - window.innerHeight
```

```js
const visible = ScrollTrigger.isInViewport(".alto");
const mitadDeBajo = ScrollTrigger.isInViewport(".bajo", 0.5);

// prueba: visible === true
// prueba: mitadDeBajo === false
// prueba: ScrollTrigger.isInViewport(".bajo") === false
```

`isInViewport()` es algo más barato que `positionInViewport()`. Ninguno necesita una instancia. [O]

## Apagar todo

```js
const st = ScrollTrigger.create({ trigger: ".alto", start: "top top", end: "+=50" });
ScrollTrigger.disable();
const apagado = st.enabled;
ScrollTrigger.enable();
const encendido = st.enabled;

ScrollTrigger.killAll();

// prueba: apagado === false
// prueba: encendido === true
// prueba: ScrollTrigger.getAll().length === 0
```

## Trampas

- **`positionInViewport(el, 20)` lanza una excepción en 3.15.1.** La documentación y los tipos admiten un número, pero el código hace `referencePoint.indexOf("%")` y un número no tiene ese método (`indexOf is not a function`). Pásalo como cadena: `"20"`. [C] [E]
- **`ScrollTrigger.killAll()` borra también los oyentes** de `addEventListener`, salvo `killAll(true)`. La documentación no lo menciona. [C]
- **`getAll()` no incluye la instancia principal de ScrollSmoother,** así que `ScrollTrigger.getAll().forEach(t => t.kill())` no rompe el scroll suave. Para esa instancia está `smoother.scrollTrigger`. [C]
- **`clearMatchMedia()` sin argumento no limpia todo.** La documentación dice que sí, pero el código solo compara cada contexto con el `query` recibido. Migra a `gsap.matchMedia()`. [C]
- **`ScrollTrigger.matchMedia()` y `clearMatchMedia()` siguen en el paquete** solo por compatibilidad. [O] [C]
- **`ScrollTrigger.defaults({ scroller })` con ScrollSmoother.** El plugin lo ocupa. Crea el smoother antes que las instancias. [C] [P]
