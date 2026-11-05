---
id: rec-acordeon
titulo: Acordeón accesible con height auto
capa: 14-recetas
tipo: patron
ambito: core
resumen: Abre y cierra paneles animando hasta height auto, con aria-expanded, hidden, interrupción sin saltos y altura libre al terminar.
api: [gsap.fromTo, gsap.TweenVars.overwrite, gsap.matchMedia, gsap.set]
requiere: [css-clearprops]
relacionadas: [css-plugin, nuc-overwrite, cal-accesibilidad, nuc-context]
etiquetas: [interaccion, accesibilidad, altura, plantilla]
fuentes:
  - docs/v3/GSAP/gsap.fromTo().md
  - docs/v3/GSAP/CorePlugins/CSS.md
  - resources/a11y.md
estado: verificado
version: 3.15.1
---
# Acordeón accesible con height auto

Paneles que se abren y cierran con transición de altura, usables con teclado y lector de pantalla. Plantilla: `plantillas/acordeon.js`. [E]

## Problema

CSS no interpola hasta `height: auto` de forma general. Una altura fija en píxeles se rompe con contenido variable o al redimensionar. Y un panel solo colapsado sigue siendo enfocable y legible para lectores de pantalla si su contenido no se oculta de verdad.

## Solución

Patrón de botón con `aria-expanded` y `aria-controls`, y panel con `hidden` mientras está cerrado. GSAP sí anima hasta `"auto"`: mide la altura natural. Al terminar se borran `height` y `overflow`, de modo que el panel sigue al contenido si este cambia. Empezar desde `panel.offsetHeight` evita un salto al interrumpir. [E]

```html
<h3><button id="tirador" aria-expanded="false" aria-controls="respuesta">Pregunta</button></h3>
<div id="respuesta" hidden><div style="height:120px">Contenido</div></div>
```

```js
const boton = document.getElementById("tirador");
const panel = document.getElementById("respuesta");

const alternar = (abrir) => {
  const altura = panel.hidden ? 0 : panel.offsetHeight;
  boton.setAttribute("aria-expanded", abrir);
  panel.hidden = false;
  gsap.fromTo(panel, { height: altura, overflow: "hidden" }, {
    height: abrir ? "auto" : 0,
    duration: 0.1,
    overwrite: true,
    onComplete: () => {
      panel.hidden = !abrir;
      gsap.set(panel, { clearProps: "height,overflow" });
    },
  });
};

boton.addEventListener("click", () => alternar(boton.getAttribute("aria-expanded") !== "true"));
await new Promise((r) => setTimeout(r, 30));
boton.click();
await new Promise((r) => setTimeout(r, 180));
const abierto = panel.offsetHeight;
const libre = panel.style.height;
boton.click();
await new Promise((r) => setTimeout(r, 180));
// prueba: abierto === 120 && libre === ""
// prueba: panel.hidden === true && boton.getAttribute("aria-expanded") === "false"
```

## Parámetros ajustables

| Opción | Por defecto | Efecto |
|---|---|---|
| `botones` | `"[aria-controls]"` | Selector dentro del contenedor |
| `duracion` / `ease` | `0.3` / `"power2.inOut"` | Transición |
| `unico` | `true` | Abrir uno cierra los demás; en `false` se pueden abrir varios |

El estado inicial se toma de `aria-expanded` en el HTML, que es además lo que debe verse sin JS.

## Variante con prefers-reduced-motion

Abre y cierra al instante: solo cambian `hidden` y `aria-expanded`, sin tween. La función del acordeón se mantiene intacta. [P] [E]

```html
<button id="pulsador" aria-expanded="false" aria-controls="caja">Abrir</button>
<div id="caja" hidden>Texto</div>
```

```js
window.matchMedia = (q) => ({ matches: /: reduce\)/.test(q), addListener() {}, removeListener() {} });
const boton = document.getElementById("pulsador");
const caja = document.getElementById("caja");
const mm = gsap.matchMedia();
mm.add({ normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" }, (c) => {
  boton.addEventListener("click", () => {
    const abrir = boton.getAttribute("aria-expanded") !== "true";
    boton.setAttribute("aria-expanded", abrir);
    if (c.conditions.reducido) caja.hidden = !abrir;
  });
});
boton.click();
// prueba: caja.hidden === false && gsap.getTweensOf(caja).length === 0
```

## Limpieza

`limpiar()` quita los listeners y restaura `aria-expanded`, `hidden`, `height` y `overflow` originales, incluso si se llama con un panel a medio abrir o interrumpido. Esos dos estilos se restauran a mano, en la limpieza de `matchMedia`, porque `revert()` no basta. [E]

```js fragmento
const limpiar = acordeon(raiz.querySelector(".preguntas"), { unico: false });
limpiar();
```

## Trampas

- **`revert()` con varios `fromTo` en el panel.** Cada apertura o cierre añade un `startAt` que captura el estilo de ese momento, y todos empatan al revertir. En Chrome se deshacen del último al primero; en Firefox, del primero al último, así que tras una interrupción el panel se queda con `height: 104px; overflow: hidden`, sin tweens que lo cambien. No es una carrera, ni depende del tiempo. Guarda `style.height` y `style.overflow` al crear y restáuralos en la limpieza. Ver [contexto](../02-nucleo/nuc-context.md#trampas). [C] [E]
- **Dentro de Shadow DOM.** Un `id` solo es único en su árbol: la plantilla busca el panel con `raiz.getRootNode().getElementById()`, y no en `document`, donde podría encontrar otro con el mismo `id` o ninguno. Pasa el contenedor como elemento: un selector no atraviesa la sombra. [E]
- **Cerrar sin `hidden`.** Con `height: 0`, los enlaces del panel siguen recibiendo foco con el tabulador. Pon `hidden` en `onComplete`. [P]
- **Timeline construido una vez.** La altura `"auto"` se mide al crearlo y queda obsoleta al redimensionar. Crea el tween en cada apertura. [P]
- **Dejar `height` fija al abrir.** Si el contenido crece después (imagen que carga, texto), se corta. Borra `height` y `overflow` al terminar. [P]
- **`<details>`.** El navegador lo muestra y oculta sin pasos intermedios; animarlo exige interceptar el clic y pierde parte de su ventaja. El botón con `aria-controls` es más previsible. [P]
- **Padding en el panel.** Con `height: 0` y `box-sizing: content-box`, el padding sigue visible. Ponlo en un hijo interior. [P]
- **`margin` del primer o último hijo.** Puede colapsar fuera del panel y producir un salto al final. El `overflow: hidden` lo cambia durante la animación. Usa `padding` interior. [P]
- **`ScrollTrigger` debajo del acordeón.** Abrir mueve lo que sigue y deja mal las posiciones: llama a `ScrollTrigger.refresh()` en `onComplete`. [O]
