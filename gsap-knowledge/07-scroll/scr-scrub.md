---
id: scr-scrub
titulo: scrub, atar el cabezal de la animación al scroll
capa: 07-scroll
tipo: concepto
ambito: ScrollTrigger
resumen: Diferencia entre scrub true y numérico, cómo se reparten las duraciones de un timeline, valores iniciales cacheados y por qué ease none es casi obligatorio.
api: [ScrollTrigger.Vars.scrub, ScrollTrigger.Vars.onScrubComplete, ScrollTrigger.Vars.immediateRender]
requiere: [scr-start-end]
relacionadas: [scr-scrolltrigger, scr-toggle, scr-snap, scr-pin, tim-basico]
etiquetas: [scroll, scrub, timeline]
fuentes:
  - docs/v3/Plugins/ScrollTrigger.md
  - docs/v3/Plugins/ScrollTrigger/getTween().md
  - resources/st-mistakes.md
estado: verificado
version: 3.15.1
---
# scrub

Con `scrub`, el `progress` de ScrollTrigger gobierna el de la animación: bajar la avanza y subir la rebobina. La animación queda pausada y sin vida propia; solo se mueve con el scroll. [O]

## Modelo mental

| Valor | Efecto |
|---|---|
| `scrub: true` | La animación copia `progress` de inmediato, 1:1 con la barra |
| `scrub: 1` | El cabezal tarda 1 s en alcanzar a la barra (suavizado con ease `"expo"`) [O] [C] |
| `scrub: 0` | Como `true`: es un número sin suavizado, y además desactiva `toggleActions` [C] |
| sin `scrub` | El modo es *toggle*: ver [scr-toggle](scr-toggle.md) |

`scrub` y `toggleActions` son excluyentes: si hay `scrub`, las acciones se ignoran. [C]

**Duración como proporción.** Con `scrub` los segundos no son tiempo real, sino reparto del tramo. Un timeline de 1 + 3 + 1 s usa el 20 %, el 60 % y el 20 % del recorrido. Para que dure "más" no subas `duration`: alarga `end`. [O]

**`progress` y valor no son lo mismo.** `scrub` no toca el ease del tween: si no pones `ease: "none"`, el valor sigue la curva por defecto (`power1.out`), aunque `progress` sea lineal. En un 60 % de scroll, un tween a `x: 100` vale 84 y no 60. [E]

## Ejemplo

```html
<div style="height:500px"></div>
<div class="bloque" style="height:200px"></div>
<div style="height:1500px"></div>
```

`scrub: true` lineal. El tramo 150-700 se recorre a la mitad con scroll 425:

```js
const barra = gsap.to(".bloque", {
  x: 100,
  ease: "none",
  scrollTrigger: { trigger: ".bloque", start: "top center", end: "bottom top", scrub: true },
});

window.scrollTo(0, 425);
ScrollTrigger.update();
const enMitad = gsap.getProperty(".bloque", "x");

window.scrollTo(0, 2000);
ScrollTrigger.update();

// prueba: barra.paused() === true
// prueba: enMitad === 50
// prueba: gsap.getProperty(".bloque", "x") === 100
// prueba: barra.progress() === barra.scrollTrigger.progress
```

El ease importa, y las duraciones reparten el tramo:

```js
const conCurva = gsap.to(".bloque", { x: 100, scrollTrigger: { start: 0, end: 1000, scrub: true } });

const tl = gsap.timeline({ scrollTrigger: { start: 0, end: 1000, scrub: true } });
tl.to(".uno", { x: 10, duration: 1, ease: "none" })
  .to(".dos", { x: 100, duration: 3, ease: "none" })
  .to(".tres", { x: 10, duration: 1, ease: "none" });
tl.scrollTrigger.refresh();

window.scrollTo(0, 600);
ScrollTrigger.update();

// prueba: conCurva.progress() === 0.6
// prueba: gsap.getProperty(".bloque", "x") === 84
// prueba: gsap.getProperty(".uno", "x") === 10
// prueba: Math.abs(gsap.getProperty(".dos", "x") - 66.67) < 0.01
// prueba: gsap.getProperty(".tres", "x") === 0
```

`scrub` numérico. El ejemplo espera medio segundo porque durante el arranque del plugin (los primeros 0,5 s tras registrarlo) el suavizado se omite y la animación salta al valor [C] [E]:

```js
await new Promise((r) => setTimeout(r, 520));

const terminados = [];
const suave = gsap.to(".bloque", {
  x: 100,
  ease: "none",
  scrollTrigger: {
    trigger: ".bloque", start: "top center", end: "bottom top",
    scrub: 0.1,
    onScrubComplete: () => terminados.push(1),
  },
});

window.scrollTo(0, 425);
ScrollTrigger.update();
const recienMovido = suave.progress(); // la barra ya está en 0.5, el cabezal no

// prueba: suave.scrollTrigger.progress === 0.5
// prueba: recienMovido < 0.1
// prueba: Math.abs(suave.progress() - 0.5) < 0.01
// prueba: terminados.length === 1
// prueba: suave.scrollTrigger.getTween().duration() === 0.1
```

`getTween()` devuelve ese tween de suavizado. `st.getTween().progress(1)` fuerza a alcanzar la barra al instante. [O]

## Trampas

- **`onUpdate` de ScrollTrigger con `scrub` numérico** deja de llamarse al parar el scroll, pero la animación sigue unos instantes. Si necesitas seguir la animación, usa `onUpdate` del tween o timeline. [O]
- **Dos tweens del mismo valor en tramos distintos.** Los tweens con ScrollTrigger se renderizan al crearse y guardan su valor inicial. El segundo `to()` anota `x: 0`, no el destino del primero, y al llegar a su tramo salta atrás. Soluciones: `immediateRender: false` en las vars del **tween** (dentro de `scrollTrigger` no surte efecto para esto: el refresco inicial vuelve a leer el valor), un `fromTo()`, o un único timeline. [O] [E]

```js
const primero = gsap.to(".ficha", { x: 100, ease: "none", scrollTrigger: { start: 0, end: 100, scrub: true } });
const segundo = gsap.to(".ficha", {
  x: 200,
  ease: "none",
  immediateRender: false,
  scrollTrigger: { start: 200, end: 300, scrub: true },
});
await new Promise((r) => setTimeout(r, 50));

window.scrollTo(0, 150);
ScrollTrigger.update();
const entreMedias = gsap.getProperty(".ficha", "x");

window.scrollTo(0, 250);
ScrollTrigger.update();

// prueba: entreMedias === 100
// prueba: gsap.getProperty(".ficha", "x") === 150
```

- **`from()` con `scrollTrigger`** aplica el estado inicial en la carga, antes de llegar al tramo. Suele ser lo deseado, pero si un elemento desaparece hasta llegar a él, no lo confundas con un fallo; ver [nuc-immediate-render](../02-nucleo/nuc-immediate-render.md). [O]
- **Animar con `scrub` algo no compositado** (`top`, `width`, `box-shadow`) se paga en cada píxel de scroll. Prefiere `x`, `y`, `scale`, `opacity`. [P]
- **`scrub` en el `trigger` animado con `y` grande** cambia lo que el usuario ve, no lo que se midió; el tramo sigue el flujo natural. [O]
- **`repeat: -1` con `scrub`** no tiene sentido: el tramo es finito y la duración total sería infinita. [P]
