---
id: rec-pin-horizontal
titulo: Sección fija con desplazamiento horizontal
capa: 14-recetas
tipo: patron
ambito: ScrollTrigger
resumen: Fija una sección y convierte el scroll vertical en movimiento horizontal, responsive, con scroll nativo como alternativa reducida.
api: [ScrollTrigger.Vars.pin, ScrollTrigger.Vars.invalidateOnRefresh, ScrollTrigger.Vars.containerAnimation, ScrollTrigger.Vars.snap, ScrollTrigger.Vars.scrub]
requiere: [scr-pin, scr-scrub]
relacionadas: [scr-horizontal, scr-refresh, cal-st-errores, rec-parallax]
etiquetas: [scroll, pin, horizontal, plantilla]
fuentes:
  - docs/v3/Plugins/ScrollTrigger.md
  - resources/st-mistakes.md
estado: verificado
version: 3.15.1
---
# Sección fija con desplazamiento horizontal

La sección se queda fija y su contenido avanza de lado mientras el usuario hace scroll vertical. Plantilla: `plantillas/pinHorizontal.js`. [E]

## Problema

Galerías y líneas temporales piden avanzar en horizontal sin que el usuario cambie de gesto. Hay que fijar la sección el tiempo justo, mover la pista la distancia exacta y recalcular ambas cosas si cambia el tamaño de ventana.

## Solución

Un solo tween sobre la pista, con pin en la sección. La duración del pin en píxeles coincide con el recorrido, de modo que un píxel de scroll equivale a un píxel horizontal. `x` y `end` son funciones, y `invalidateOnRefresh` hace que se recalculen en cada refresh. [O] [E]

```html
<section class="tira" style="height:400px;overflow:hidden">
  <div class="carril" style="display:flex;width:max-content">
    <div style="width:700px;height:300px">1</div>
    <div style="width:700px;height:300px">2</div>
    <div style="width:700px;height:300px">3</div>
  </div>
</section>
```

```js
const tira = document.querySelector(".tira");
const carril = document.querySelector(".carril");
const recorrido = () => carril.scrollWidth - tira.clientWidth;

const ctx = gsap.context(() => {
  gsap.to(carril, {
    x: () => -recorrido(),
    ease: "none",
    scrollTrigger: {
      trigger: tira,
      start: "top top",
      end: () => "+=" + recorrido(),
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
});

window.scrollTo(0, recorrido());
ScrollTrigger.update();
await new Promise((r) => setTimeout(r, 120));
const final = gsap.getProperty(carril, "x");
// prueba: Math.abs(final + recorrido()) < 1
// prueba: tira.parentElement.classList.contains("pin-spacer")
```

Para animar elementos internos según su posición horizontal, pasa el tween a `containerAnimation` en un `ScrollTrigger` hijo. La plantilla lo entrega en `alCrear(tween)`. El tween contenedor debe tener `ease: "none"`, y esos disparadores no admiten pin ni snap. [O]

```js
const pieza = document.querySelector(".interior");
const tween = gsap.to(".carril2", { x: -1000, ease: "none", scrollTrigger: { trigger: ".carril2", scrub: true, end: "+=1000", start: "top top" } });
gsap.from(pieza, {
  opacity: 0,
  scrollTrigger: { trigger: pieza, containerAnimation: tween, start: "left 80%", toggleActions: "play none none none" },
});
// prueba: ScrollTrigger.getAll().length === 2
// prueba: ScrollTrigger.getAll()[1].vars.containerAnimation === tween
```

## Parámetros ajustables

| Opción | Por defecto | Efecto |
|---|---|---|
| `pista` | primer hijo | Elemento que se desplaza |
| `suavizado` | `1` | `scrub`: segundos de inercia, o `true` para ir pegado |
| `ajustar` | `false` | Añade `snap` a cada hijo de la pista (`1 / (n - 1)`) |
| `alCrear` | — | Recibe el tween, para `containerAnimation` |

## Variante con prefers-reduced-motion

Convertir scroll vertical en movimiento lateral no es imprescindible para leer el contenido. La rama reducida no fija nada y deja scroll horizontal nativo en la sección, de modo que todo sigue siendo alcanzable. [P] [E]

```html
<section class="muro" style="width:400px"><div style="width:1200px;height:80px">contenido ancho</div></section>
```

```js
window.matchMedia = (q) => ({ matches: /: reduce\)/.test(q), addListener() {}, removeListener() {} });

const mm = gsap.matchMedia();
mm.add({ normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" }, (c) => {
  if (c.conditions.reducido) gsap.set(".muro", { overflowX: "auto" });
});
const muro = document.querySelector(".muro");
// prueba: getComputedStyle(muro).overflowX === "auto" && muro.scrollWidth > muro.clientWidth
// prueba: ScrollTrigger.getAll().length === 0
```

## Limpieza

`limpiar()` retira el `pin-spacer`, devuelve la sección a su padre original y restaura el `style` de sección y pista. La misma sección admite volver a inicializarse después. [E]

```js fragmento
const limpiar = pinHorizontal(raiz.querySelector(".galeria"), { suavizado: 0.5, ajustar: true });
limpiar();
```

## Trampas

- **`pin` + `invalidateOnRefresh` deja residuo.** Tras `ctx.revert()` la pista conserva `translate: none; rotate: none; scale: none; transform: translate(0px, 0px)`. Solo aparece con esa combinación; sin pin, o sin `invalidateOnRefresh`, sale limpio. Revertir antes el tween o el `ScrollTrigger` no lo evita, y `fromTo` tampoco. La plantilla guarda `pista.style.cssText` y lo restaura. Causa interna no aislada. [E]
- **`pista.scrollWidth` con ancho al 100 %.** Sin `width: max-content`, la pista se comprime en flex si los hijos pueden encoger. Pon `flex: none` a los hijos o `max-content` a la pista. [P]
- **`clientWidth` incluye la barra.** En la prueba, el iframe de 1000 px tiene 985 de ancho útil: calcula con `seccion.clientWidth`, no con `window.innerWidth`. [E]
- **Valores fijos sin función.** Si `x` y `end` son números calculados una vez, un cambio de tamaño deja recorrido de más o de menos. Usa funciones más `invalidateOnRefresh`. [O]
- **Ease distinto de `none`.** La pista se desacopla del scroll, y además `containerAnimation` deja de ser válido. [O]
- **Ancestro con `transform` o `will-change`.** Rompe `position: fixed` en el pin: la sección se desplaza. Quita la propiedad o usa `pinReparent: true`. [O]
- **Snap en un disparador con `containerAnimation`.** No funciona: pon el snap en el disparador principal. [O]
