---
id: cal-fouc
titulo: Evitar el flash de contenido sin estilo (FOUC)
capa: 13-calidad
tipo: patron
ambito: transversal
resumen: Ocultar en CSS y revelar con autoAlpha, la trampa de from() con visibility hidden, noscript y SSR.
api: [gsap.set, gsap.fromTo, gsap.TweenVars.immediateRender]
relacionadas: [css-autoalpha, nuc-immediate-render, cal-accesibilidad, fra-agnostico]
etiquetas: [fouc, carga, autoalpha, ssr]
fuentes:
  - resources/fouc.md
estado: verificado
version: 3.15.1
---
# Evitar el flash de contenido sin estilo (FOUC)

El navegador pinta lo antes posible, a menudo antes de que corra tu JavaScript. Si el estado inicial lo fija GSAP, el contenido se ve un instante en su posición final y luego salta. La solución es establecer el estado oculto en **CSS**, que llega antes, y revelarlo con `autoAlpha`. [O]

## Problema

`autoAlpha` combina `opacity` y `visibility`: pone `visibility: visible` en cuanto la opacidad supera 0, y `hidden` al llegar a 0. [O]

Con render en servidor el problema se agrava, porque el HTML llega completo mucho antes que el JavaScript. En una prueba real, el servidor envió el título sin ningún estilo, y `from()` lo ocultó solo al ejecutarse en el cliente. Ver [fra-agnostico](../12-frameworks/fra-agnostico.md).

## Solución

```html
<style>
  .revelar { visibility: hidden; }
</style>
<noscript><style>.revelar { visibility: visible; }</style></noscript>
<h1 class="revelar">Bienvenido</h1>
```

```js
const titulo = document.querySelector(".revelar");
const inicial = getComputedStyle(titulo).visibility;

gsap.fromTo(titulo, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.2 });

await new Promise((r) => setTimeout(r, 300));
const final = getComputedStyle(titulo).visibility;
// prueba: inicial === "hidden" && final === "visible"
// prueba: gsap.getProperty(titulo, "opacity") === 1
```

- `noscript` deshace la ocultación si no hay JavaScript. [O]
- `visibility: hidden` conserva el espacio del elemento, sin saltos de layout, a diferencia de `display: none`. [P]

### Variante sin depender de `noscript`

Una clase en `<html>` puesta por un script en línea, en el `<head>`, oculta solo cuando hay JS. También evita dejar la página en blanco si tu JavaScript falla al cargar y añades un temporizador de seguridad. [P]

```html
<script>document.documentElement.classList.add("js");</script>
<style>.js .revelar { visibility: hidden; }</style>
```

## Trampas

- **`from()` depende de cómo ocultaste.** `from()` toma el estado actual como destino. `autoAlpha` resuelve el caso `visibility: hidden` con `opacity: 1` y termina visible. Pero `opacity: 0` en CSS da un destino de 0, y `from({ opacity: 0 })` sobre `visibility: hidden` nunca toca la visibilidad. En ambos casos el elemento no aparece. Lo seguro es `fromTo()` o `gsap.to({ autoAlpha: 1 })`, que no dependen del CSS. [E]

```html
<style>
  .por-visibilidad { visibility: hidden; }
</style>
<div class="por-visibilidad caso-a">A</div>
<div class="por-visibilidad caso-b">B</div>
<div class="caso-c" style="opacity:0">C</div>
```

```js
gsap.from(".caso-a", { autoAlpha: 0, duration: 0.1 });
gsap.from(".caso-b", { opacity: 0, duration: 0.1 });
gsap.from(".caso-c", { autoAlpha: 0, duration: 0.1 });
await new Promise((r) => setTimeout(r, 300));

const estilo = (c) => getComputedStyle(document.querySelector(c));
// prueba: estilo(".caso-a").visibility === "visible"
// prueba: estilo(".caso-b").visibility === "hidden"
// prueba: estilo(".caso-c").opacity === "0"
```

- **`opacity: 0` en CSS sin `visibility`.** El elemento sigue siendo clicable y enfocable aun invisible. Prefiere `visibility`. [P]
- **Todo oculto hasta que cargue el JS.** Si tu JavaScript tarda, la pantalla queda vacía y se resiente el LCP. Oculta solo lo que anima de entrada y no el contenido principal. [P]
- **`prefers-reduced-motion`.** La rama reducida debe revelar también: si solo anima la rama normal, el contenido queda oculto. Ver [accesibilidad](cal-accesibilidad.md). [P]
- **`revert()` devuelve al CSS.** Al revertir un contexto, el inline desaparece y vuelve el `visibility: hidden` de tu hoja: si la animación se recrea en seguida no se nota, pero al desmontar y reutilizar un nodo sí. [E] por el comportamiento de `revert()` comprobado en [fra-agnostico](../12-frameworks/fra-agnostico.md).
- **Transformaciones iniciales en CSS** se leen como píxeles y matriz, sin la intención original. Fija también en GSAP las que vayas a animar. Ver [errores comunes](cal-errores-comunes.md). [O]
