---
id: scr-scrollto
titulo: ScrollToPlugin, animar la posición de scroll
capa: 07-scroll
tipo: plugin
ambito: ScrollToPlugin
resumen: Anima el scroll de ventana o contenedor hasta un valor, selector o elemento, con desfases, autoKill y relativos. Incluye su relación con scroll-behavior y anclas.
api: [ScrollToPlugin, ScrollToPlugin.Vars.x, ScrollToPlugin.Vars.y, ScrollToPlugin.Vars.offsetX, ScrollToPlugin.Vars.offsetY, ScrollToPlugin.Vars.autoKill, ScrollToPlugin.Vars.onAutoKill, ScrollToPlugin.config, ScrollToPlugin.ConfigVars.autoKill, ScrollToPlugin.ConfigVars.autoKillThreshold, ScrollToPlugin.max, ScrollToPlugin.offset]
relacionadas: [scr-instancia, scr-smoother-api, scr-snap]
etiquetas: [scroll, navegacion, anclas]
fuentes:
  - docs/v3/Plugins/ScrollToPlugin.md
  - docs/v3/Plugins/ScrollToPlugin/config().md
estado: verificado
version: 3.15.1
---
# ScrollToPlugin

Mueve el scroll de `window` o de un elemento con un tween: duración, ease y control completos. Hace lo que `window.scrollTo()`, pero animado. Para reaccionar al scroll, en cambio, se usa ScrollTrigger. [O]

## Para qué sirve

Navegación por anclas, botón "volver arriba", saltos a una etiqueta de timeline, carruseles con `overflow`.

## Registro

```js
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);
```

**Sin empaquetador:** `<script>` con `dist/ScrollToPlugin.min.js` (global `ScrollToPlugin`), o entrada `gsap/ScrollToPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

| Valor de `scrollTo` | Efecto |
|---|---|
| `400` | Eje `y` a 400 px |
| `"max"` | Máximo |
| `"+=100"`, `"-=100"` | Relativo a la posición actual [C] [E] |
| `"#seccion"` o `".clase"` | Elemento: **ambos ejes** [C] |
| Elemento DOM | Ambos ejes [C] |
| `{ y, x, offsetY, offsetX, autoKill, onAutoKill }` | Control por eje |

| Clave | Efecto |
|---|---|
| `y`, `x` | Número, selector, elemento, `"max"` o relativo |
| `offsetY`, `offsetX` | Píxeles a restar del destino: margen para una cabecera fija [O] |
| `autoKill` | Abandona el eje si el scroll cambia por fuera más de un umbral. Por defecto `false` [O] [C] |
| `onAutoKill` | Se llama al morir el tween, cuando ya no queda ningún eje activo. Abandonar uno de dos ejes no lo dispara [C] [E] |

`ScrollToPlugin.config({ autoKill, autoKillThreshold })` fija los valores globales. El umbral por defecto es 7 px. [O] [C] [E]

`ScrollToPlugin.max(elemento, eje?)` devuelve el máximo de scroll, con eje `"x"` o `"y"`. En un elemento resta `offsetWidth` u `offsetHeight`, no `clientWidth`: ver Trampas. [C] [E]

## Ejemplo

```html
<div style="height:1000px"></div>
<div class="destino" style="height:200px"></div>
<div style="height:1000px"></div>
```

```js
const ida = gsap.to(window, { duration: 0.1, scrollTo: 400 });
await new Promise((r) => setTimeout(r, 160));
const numero = window.scrollY;

gsap.to(window, { duration: 0.1, scrollTo: { y: ".destino", offsetY: 50 } });
await new Promise((r) => setTimeout(r, 160));
const conMargen = [window.scrollY, document.querySelector(".destino").getBoundingClientRect().top];

gsap.to(window, { duration: 0.05, scrollTo: "max" });
await new Promise((r) => setTimeout(r, 100));
const fondo = window.scrollY;

gsap.to(window, { duration: 0.05, scrollTo: "-=100" });

// prueba: numero === 400
// prueba: conMargen.join() === "950,50"
// prueba: fondo === ScrollToPlugin.max(window)
// prueba: window.scrollY === fondo - 100
```

Con ScrollTrigger: saltar a una etiqueta del timeline. El plugin llama a `ScrollTrigger.update()` en cada render, por lo que todo queda sincronizado. [C]

```js
const tl = gsap.timeline({ scrollTrigger: { start: 0, end: 1000, scrub: true } });
tl.to(".pieza", { x: 100, duration: 1, ease: "none" })
  .addLabel("mitad")
  .to(".pieza", { x: 200, duration: 1, ease: "none" });

gsap.to(window, { duration: 0.1, ease: "none", scrollTo: tl.scrollTrigger.labelToScroll("mitad") });

// prueba: window.scrollY === 500
// prueba: tl.scrollTrigger.progress === 0.5
// prueba: gsap.getProperty(".pieza", "x") === 100
```

Sin `autoKill`, el tween sigue imponiendo su valor aunque el usuario desplace. Con él, cede:

```js
window.scrollTo(0, 1500);
const avisos = [];
gsap.to(window, {
  duration: 0.3,
  ease: "none",
  scrollTo: { y: 0, autoKill: true, onAutoKill: () => avisos.push("cortado") },
});
await new Promise((r) => setTimeout(r, 60));
window.scrollTo(0, 800); // el "usuario" interviene
await new Promise((r) => setTimeout(r, 60));

// prueba: avisos.length === 1
// prueba: window.scrollY === 800
```

Contenedor con ambos ejes:

```html
<div class="marco" style="width:300px;height:200px;overflow:auto"><div style="width:2000px;height:2000px"></div></div>
```

```js
gsap.to(".marco", { duration: 0.05, scrollTo: { y: 400, x: 200 }, ease: "power2" });

const marco = document.querySelector(".marco");

// prueba: marco.scrollTop === 400 && marco.scrollLeft === 200
// prueba: ScrollToPlugin.max(marco, "x") === 2000 - marco.offsetWidth
```

`"max"` en un contenedor, `autoKill` con dos ejes y utilidades:

```js
const marco = document.querySelector(".marco");
gsap.to(marco, { duration: 0.02, scrollTo: { x: "max" } });
await new Promise((r) => setTimeout(r, 80));
const conMax = marco.scrollLeft;
const realMax = marco.scrollWidth - marco.clientWidth;

marco.scrollLeft = 0;
const avisos = [];
gsap.to(marco, { duration: 0.3, ease: "none", scrollTo: { x: 1000, y: 1000, autoKill: true, onAutoKill: () => avisos.push("cortado") } });
await new Promise((r) => setTimeout(r, 60));
marco.scrollTop = 1500; // solo interviene en un eje
await new Promise((r) => setTimeout(r, 400));

// prueba: conMax === ScrollToPlugin.max(marco, "x") && conMax === realMax - (marco.offsetWidth - marco.clientWidth)
// prueba: avisos.length === 0
// prueba: marco.scrollLeft === 1000 && marco.scrollTop === 1500
// prueba: gsap.config().autoKillThreshold === 7
// prueba: ScrollToPlugin.offset === undefined && ScrollToPlugin.getOffset(".marco").y === marco.getBoundingClientRect().top + window.scrollY
```

Anclas de la misma página:

```js fragmento
document.querySelectorAll('a[href^="#"]').forEach((enlace) => {
  enlace.addEventListener("click", (e) => {
    e.preventDefault();
    gsap.to(window, { duration: 0.6, scrollTo: { y: enlace.hash, offsetY: 80 } });
  });
});
```

## Trampas

- **`ScrollToPlugin.offset()` no existe en 3.15.1.** Los tipos la declaran con retorno numérico, pero el código expone `ScrollToPlugin.getOffset(elemento, contenedor)`, que devuelve `{ x, y }`. [C] [E]
- **`scroll-behavior: smooth` en `html`.** Cada frame del tween lanza un scroll suave y la página no llega a su destino. En un **elemento** objetivo, el plugin lo fuerza a `auto`, pero con `window` no comprueba el CSS de `html`. Quita esa regla o limítala con `@media`. [O] [C]
- **`scroll-snap-type`.** El plugin lo desactiva durante el tween en el objetivo y lo restaura al acabar, cosa que no hace con `html`/`body` cuando se anima `window`. [C]
- **Un selector sin objeto anima `x` e `y`.** En un carrusel horizontal puede mover lo que no querías; escribe `{ y: "#a" }`. [C]
- **Destino `"max"` con contenido que crece.** Se calcula al iniciar el tween; lo que cargue después no se tiene en cuenta. [C] [P]
- **Sin `autoKill`,** el usuario lucha contra el tween en saltos largos. Actívalo en páginas largas, o globalmente. Con él, un eje puede quedar abandonado y seguir el otro. [C] [P]
- **`"max"` en un contenedor con barra clásica se queda corto.** `ScrollToPlugin.max()` usa `offsetWidth`/`offsetHeight`, que incluyen barras y bordes: con una barra de 15 px, el destino queda 15 px antes del tope real. Si importa, anima a `el.scrollWidth - el.clientWidth`. En `window` usa `innerWidth`/`innerHeight`, con el mismo efecto si hay barra en el otro eje. [C] [E]
- **Cabecera fija:** usa `offsetY`, no restes a mano de una medida: si el destino es un selector, GSAP mide el elemento justo al iniciar. [P]
- **Con `Back` o `Elastic` hacia 0**, el valor negativo se recorta a 0. [C]
- **`gsap.to("window", ...)` no sirve:** el objetivo es el objeto `window`, sin comillas. [P]
- **Animar `window` con ScrollSmoother** funciona, pero se suma el suavizado. Prefiere `smoother.scrollTo()`. [P]
