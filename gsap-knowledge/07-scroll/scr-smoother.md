---
id: scr-smoother
titulo: ScrollSmoother, scroll suavizado sobre scroll nativo
capa: 07-scroll
tipo: plugin
ambito: ScrollSmoother
resumen: Qué hace, estructura wrapper y content, cuándo compensa frente al scroll nativo, su límite en móvil y las interacciones con pin y position fixed.
api: [ScrollSmoother, ScrollSmoother.create, ScrollSmoother.get, ScrollSmoother.Vars.smooth, ScrollSmoother.Vars.smoothTouch, ScrollSmoother.Vars.speed, ScrollSmoother.Vars.ease, ScrollSmoother.Vars.effects, ScrollSmoother.Vars.wrapper, ScrollSmoother.Vars.content, ScrollSmoother.Vars.normalizeScroll, ScrollSmoother.Vars.ignoreMobileResize, ScrollSmoother.Vars.autoResize, ScrollSmoother.Vars.onUpdate, ScrollSmoother.Vars.onStop, ScrollSmoother.Vars.onFocusIn, ScrollSmoother.version]
requiere: [scr-scrolltrigger]
relacionadas: [scr-smoother-efectos, scr-smoother-api, scr-normalize, scr-scrollerproxy, cal-accesibilidad, rec-parallax]
etiquetas: [scroll, suavizado, parallax, movil]
fuentes:
  - docs/v3/Plugins/ScrollSmoother.md
  - docs/v3/Plugins/ScrollSmoother/*
  - resources/private-repo-migration.md
estado: verificado
version: 3.15.1
---
# ScrollSmoother

Suaviza el scroll vertical de la página. La barra sigue siendo nativa y está en `<body>`; lo que cambia es que el contenido alcanza esa posición con retardo, mediante `transform` sobre `content`. Es, en esencia, un ScrollTrigger con `scrub` numérico aplicado a toda la página. [O] [C]

## Para qué sirve

**Cuándo compensa frente al scroll nativo:**

| Situación | Recomendación [P] |
|---|---|
| Web de campaña o portfolio con parallax, `data-lag` y pines | ScrollSmoother: es lo que da su acabado, y `data-speed` ahorra mucho código |
| Páginas con pines que tiemblan al entrar con rueda | Puede ayudar: al mover con transform, desaparece el desfase entre hilos [O] |
| Sitio de contenido, tienda, documentación, blog | Nativo. No aporta y cuesta rendimiento, y altera la expectativa del usuario |
| Mucho texto o formularios largos | Nativo. El retardo penaliza la lectura |
| Usuarios mayoritariamente en móvil | Nativo: en móvil apenas hace nada (ver abajo) |
| Solo quieres parallax | `scrub` en un ScrollTrigger: no exige reestructurar el DOM ([rec-parallax](../14-recetas/rec-parallax.md)) |
| Scroll con ajuste por secciones | CSS `scroll-snap` o [`snap`](scr-snap.md) |

**Coste que se asume** [C] [P]: cada frame repinta toda la capa de `content` con `matrix3d`; todo `position: fixed` debe salir del wrapper; `wrapper` pasa a `position: fixed`, y con eso cambia cómo se calcula cualquier medida; `<body>` recibe una altura artificial.

**Límite en móvil.** Por defecto, en dispositivos **solo táctiles** (`ScrollTrigger.isTouch === 1`) **no suaviza**: `smooth` se ignora, `wrapper` queda en `position: relative` y `content` sin transform. El navegador desplaza con normalidad. Es intencionado: el dedo perdería contacto con el contenido. [O] [C]

| | Escritorio | Solo táctil, por defecto | Solo táctil, `smoothTouch: 0.1` |
|---|---|---|---|
| Duración | `smooth` | 0: sin suavizado | 0.1 s |
| `wrapper` | `position: fixed` | `relative` | `fixed` |
| Movimiento | `transform` en `content` | scroll nativo | `transform` en `content` |
| `data-speed`, `data-lag` | Sí | Se crean igual, pero se mueven por JS en un hilo distinto del scroll, por lo que pueden temblar | Sí |
| Barra de direcciones | No aplica | Redimensiona; usa `normalizeScroll: true` | Igual |

`smooth: 0` reproduce el camino del móvil sin necesidad de un móvil, y así se verifica abajo. [E] `smoothTouch: true` equivale a 0.8 s. Si necesitas efectos en táctil sin temblor, usa un valor pequeño como `0.1`. Pruébalo en dispositivo: **el arnés de esta base no emula un móvil real**. [C] [P]

## Registro

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
```

**Sin empaquetador:** `<script>` con `dist/ScrollTrigger.min.js` y `dist/ScrollSmoother.min.js` (globales `ScrollTrigger` y `ScrollSmoother`), o entradas `gsap/ScrollTrigger` y `gsap/ScrollSmoother` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

Requiere ScrollTrigger. ScrollSmoother viene en el paquete público `gsap`: todos los plugins son gratuitos, aunque páginas antiguas de la documentación aún lo llamen ventaja de miembros. [O] [C]

## API

```html
<div id="smooth-wrapper">
  <div id="smooth-content">
    <section class="portada" style="height:800px"></section>
    <section class="medio" style="height:2200px"></section>
  </div>
</div>
<div class="flotante" style="position:fixed"></div> <!-- lo fijo va fuera -->
```

`wrapper` hace de ventana y `content` se traslada. Si usas esos ids, no hay que indicarlos. Si no hay `wrapper`, se crea uno. [O]

| Opción | Por defecto | Efecto |
|---|---|---|
| `smooth` | 0.8 | Segundos para alcanzar la posición nativa. `0` o `false` lo desactiva [O] [C] |
| `smoothTouch` | desactivado | Número o `true`: suavizado en táctil [O] |
| `speed` | 1 | Multiplicador global. `2` recorre el contenido al doble, con menos altura de `<body>` [O] [E] |
| `ease` | `"expo"` | Ease del suavizado [O] |
| `effects` | — | `true` o selector: activa `data-speed` y `data-lag`. [scr-smoother-efectos](scr-smoother-efectos.md) |
| `wrapper`, `content` | `#smooth-wrapper`, `#smooth-content` | Elementos [O] |
| `normalizeScroll` | `false` | Como [`normalizeScroll()`](scr-normalize.md), con debounce [O] |
| `ignoreMobileResize` | | Se pasa a `ScrollTrigger.config()` [O] [C] |
| `autoResize` | `true` | Reacciona a cambios de tamaño de `content` con `ResizeObserver` [C] |
| `onUpdate`, `onStop` | — | Tras cada movimiento y al alcanzar el destino. Reciben la instancia [O] [C] |
| `onFocusIn` | — | Si devuelve `false`, no desplaza al elemento enfocado [O] |

## Ejemplo

```js
const paradas = [];
const smoother = ScrollSmoother.create({ smooth: 0.05, onStop: () => paradas.push(1) });
await new Promise((r) => setTimeout(r, 520)); // pasa el arranque, en el que el scrub se omite
paradas.length = 0;

const wrapper = document.querySelector("#smooth-wrapper");
const content = document.querySelector("#smooth-content");

const estilos = [getComputedStyle(wrapper).position, getComputedStyle(wrapper).overflow, document.body.style.height];

window.scrollTo(0, 500);
ScrollTrigger.update();
const alMover = [window.scrollY, smoother.scrollTop()]; // el nativo salta, el suavizado aún no

// prueba: estilos.join() === "fixed,hidden,3000px"
// prueba: alMover.join() === "500,0"
// prueba: Math.abs(smoother.scrollTop() - 500) < 1
// prueba: paradas.length >= 1
// prueba: ScrollSmoother.get() === smoother
```

Sin duración (el mismo camino que en táctil): `wrapper` no se fija y no hay transform.

```js
const smoother = ScrollSmoother.create({ smooth: 0, effects: true });
const wrapper = document.querySelector("#smooth-wrapper");
const content = document.querySelector("#smooth-content");

window.scrollTo(0, 400);
ScrollTrigger.update();

// prueba: getComputedStyle(wrapper).position === "relative"
// prueba: smoother.smooth() === 0
// prueba: content.style.transform === "" || content.style.transform === "none"
// prueba: smoother.scrollTop() === 400
```

ScrollSmoother antes que las demás instancias. Pasa a ser el `scroller` por defecto, y el pin usa `transform`:

```js
const smoother = ScrollSmoother.create({ smooth: 0.05 });
const st = ScrollTrigger.create({ trigger: ".medio", pin: true, start: "top top", end: "+=300" });

window.scrollTo(0, 950);
ScrollTrigger.update();

// prueba: st.scroller === document.querySelector("#smooth-wrapper")
// prueba: st.start === 800 && st.end === 1100
// prueba: st.progress === 0.5
// prueba: getComputedStyle(document.querySelector(".medio")).position !== "fixed"
```

## Trampas

- **`position: fixed` dentro de `content`** se fija a `content`, porque el transform crea un bloque contenedor. Ponlo fuera del wrapper o usa `pin`. [O]
- **Crea el smoother primero.** Las instancias previas se reinician para adoptar el scroller, pero es más limpio y barato crearlo antes. [O] [C]
- **Una sola instancia.** Sin `content` en `vars`, `create()` mata la anterior. Si `vars.content` coincide con el actual, **devuelve la instancia existente e ignora los `vars` nuevos**: para cambiarlos, llama antes a `kill()`. Para acceder a la activa, usa `ScrollSmoother.get()`. [C] [E]
- **Navegación sin recarga.** Si `content` se sustituye al cambiar de vista, mata el smoother y créalo de nuevo, o mantén `wrapper` y `content` en la parte estable de la página. `kill()` restaura `wrapper` y `content`, pero `<body>` conserva `scroll-behavior: auto` en línea. [C] [E]
- **Anclas y foco.** Un `<a href="#x">` nativo no pasa por el smoother y salta; usa `smoother.scrollTo()`. Al tabular, centra el elemento enfocado si está fuera de pantalla (`onFocusIn` lo evita). [C] [P]
- **Accesibilidad.** Respeta `prefers-reduced-motion`: crea el smoother con `smooth: 0`, o no lo crees. [P]
- **`scroll-behavior: smooth`** queda anulado: se pone a `auto` en `html` y `body`. [C]
- **`overscroll-behavior`** ya no se fija por ti, porque rompía Safari 17. Si no quieres rebote, ponlo en tu CSS. [C]
- **Barra en iPhone en vertical:** `normalizeScroll: true` no la evita, por imposición de iOS. [O]
- **`ScrollTrigger.killAll()`** respeta la instancia principal; no la mata. [O] [E]
