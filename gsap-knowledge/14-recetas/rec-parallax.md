---
id: rec-parallax
titulo: Parallax con scrub
capa: 14-recetas
tipo: patron
ambito: ScrollTrigger
resumen: Desplaza imágenes o fondos a otra velocidad que el scroll, con disparador en el padre y sin saltos al cargar.
api: [ScrollTrigger.Vars.scrub, ScrollTrigger.Vars.trigger, gsap.fromTo]
requiere: [scr-scrub]
relacionadas: [scr-start-end, scr-smoother-efectos, cal-accesibilidad, cal-rendimiento]
etiquetas: [scroll, scrub, imagen, plantilla]
fuentes:
  - docs/v3/Plugins/ScrollTrigger.md
  - resources/st-mistakes.md
  - resources/a11y.md
estado: verificado
version: 3.15.1
---
# Parallax con scrub

Mueve un elemento en vertical, ligado al scroll, mientras su contenedor cruza el viewport. Da profundidad sin tocar el layout. Plantilla: `plantillas/parallax.js`. [E]

## Problema

Hace falta que una imagen avance más despacio que la página, desde que su bloque asoma por abajo hasta que sale por arriba. Si el propio elemento que se mueve actúa de disparador, sus posiciones se calculan con un desplazamiento que cambia, y un `gsap.to` sin valor inicial empieza en 0 con el bloque aún fuera de pantalla, de modo que la imagen deja hueco por arriba.

## Solución

`fromTo` simétrico en `yPercent`, `ease: "none"` para que la posición sea proporcional al scroll, y `start`/`end` que cubren todo el cruce. El disparador es el padre, con `overflow: hidden`, y el hijo mide más que él para que nunca se vea el borde. [E]

```html
<div style="height:800px"></div>
<div class="franja" style="height:300px;overflow:hidden">
  <div class="fondo" style="height:420px;margin-top:-60px">imagen</div>
</div>
```

```js
const fondo = document.querySelector(".fondo");

const ctx = gsap.context(() => {
  gsap.fromTo(fondo, { yPercent: -14 }, {
    yPercent: 14,
    ease: "none",
    scrollTrigger: { trigger: ".franja", start: "top bottom", end: "bottom top", scrub: true },
  });
});

const st = ScrollTrigger.getAll()[0];
const inicial = gsap.getProperty(fondo, "yPercent");
window.scrollTo(0, (st.start + st.end) / 2);
ScrollTrigger.update();
await new Promise((r) => setTimeout(r, 100));
const enMedio = gsap.getProperty(fondo, "yPercent");
// prueba: inicial === -14
// prueba: Math.abs(enMedio) < 1
```

El hijo debe sobrar por ambos lados, centrado en el padre (aquí, `margin-top: -60px`). Con ±14 % de 420 px, el recorrido es de 58,8 px en cada sentido, y los 120 px que sobran dan 60 por lado. Regla: `alto_hijo - alto_padre >= 2 * alto_hijo * distancia / 100`. Si no se cumple, o el hijo no está centrado, aparece hueco en los extremos. [P]

## Parámetros ajustables

| Opción | Por defecto | Efecto |
|---|---|---|
| `distancia` | `15` | Recorrido en `yPercent`, de `-d` a `+d` |
| `data-distancia` | — | Sobrescribe `distancia` en un elemento: capas a distintas velocidades |
| `suavizado` | `true` | `scrub`: `true` va pegado al scroll; un número añade inercia en segundos |
| `disparador` | padre de cada elemento | Disparador común para varias capas |

## Variante con prefers-reduced-motion

Sin rama alternativa: solo se registra para `no-preference`. Con `reduce` no hay tween, ni disparador, ni estilos; la imagen queda quieta [O]. Conviene que el layout sin parallax se vea bien: centra la imagen con CSS en lugar de confiar en el `yPercent`. [P]

```js
window.matchMedia = (q) => ({ matches: /: reduce\)/.test(q), addListener() {}, removeListener() {} });

const mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: no-preference)", () => {
  gsap.fromTo(".capa", { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: { trigger: "body", scrub: true } });
});
// prueba: ScrollTrigger.getAll().length === 0
// prueba: document.querySelector(".capa").style.transform === ""
```

## Limpieza

`limpiar()` revierte el contexto: desaparecen los disparadores y el `style` del elemento vuelve a su valor inicial, también si la limpieza ocurre con la página desplazada. [E]

```js fragmento
const limpiar = parallax(raiz.querySelectorAll(".franja img"), { distancia: 12 });
limpiar();
```

## Trampas

- **Animar el `trigger`.** Si el disparador se mueve, ScrollTrigger mide posiciones contaminadas. Anima el hijo y dispara con el padre. [P]
- **Sin `ease: "none"`.** La curva por defecto es `power1.out`: la imagen corre al principio y se frena, sin relación con la velocidad del scroll. [O]
- **Hueco en los extremos.** Porcentaje demasiado grande para el sobrante de la imagen. Aumenta el alto del hijo o reduce `distancia`. [P]
- **`scrub` numérico y limpieza.** El tween de arrastre sigue activo unos instantes; `revert()` lo elimina con el disparador y no queda animando nada. [C]
- **Muchas capas en móvil.** Cada elemento añade un disparador y una capa de composición; imágenes grandes con `will-change` disparan memoria. Limita el número o desactiva por `gsap.matchMedia`. [P]
