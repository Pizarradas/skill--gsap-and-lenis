---
id: scr-snap
titulo: snap, ajustar el scroll a posiciones concretas
capa: 07-scroll
tipo: concepto
ambito: ScrollTrigger
resumen: Formas de snap (incremento, array, función, etiquetas, objeto), opciones de SnapVars, snapDirectional y cuándo un ajuste se cancela o no arranca.
api: [ScrollTrigger.Vars.snap, ScrollTrigger.Vars.onSnapComplete, ScrollTrigger.SnapVars.snapTo, ScrollTrigger.SnapVars.delay, ScrollTrigger.SnapVars.duration, ScrollTrigger.SnapVars.ease, ScrollTrigger.SnapVars.inertia, ScrollTrigger.SnapVars.directional, ScrollTrigger.SnapVars.onStart, ScrollTrigger.SnapVars.onComplete, ScrollTrigger.SnapVars.onInterrupt, ScrollTrigger.RangeObject.min, ScrollTrigger.RangeObject.max, ScrollTrigger.snapDirectional, ScrollTrigger.getTween]
requiere: [scr-scrub]
relacionadas: [scr-pin, scr-horizontal, scr-instancia, css-snap]
etiquetas: [scroll, snap]
fuentes:
  - docs/v3/Plugins/ScrollTrigger.md
  - docs/v3/Plugins/ScrollTrigger/static.snapDirectional().md
  - docs/v3/Plugins/ScrollTrigger/getTween().md
estado: verificado
version: 3.15.1
---
# snap

Al parar el scroll, ScrollTrigger anima la posición nativa hasta el punto de ajuste más adecuado. No es CSS scroll snap: es un tween sobre el scroll, y cede en cuanto el usuario vuelve a moverse. [O]

## Modelo mental

El valor es siempre un **progreso** (0-1) del tramo, no píxeles. El ajuste calcula un destino natural a partir de la velocidad, lo pasa por tu regla y anima hasta allí. [O] [C]

| Forma | Ejemplo | Regla |
|---|---|---|
| Número | `snap: 0.25` | Incrementos. Para N secciones: `1 / (N - 1)` |
| Array | `snap: [0, 0.1, 0.5, 1]` | Valores permitidos |
| Función | `snap: (v, self) => ...` | Recibe el destino natural, devuelve el progreso final. El segundo argumento es la instancia [C] |
| `"labels"` | `snap: "labels"` | Etiqueta más cercana de un timeline |
| `"labelsDirectional"` | | Etiqueta en el sentido del último scroll |
| Objeto | `snap: { snapTo: 0.25, duration: 0.3 }` | Control completo (`SnapVars`) |

| Clave de `SnapVars` | Por defecto | Nota |
|---|---|---|
| `snapTo` | — | Número, array, función, `"labels"` o `"labelsDirectional"` |
| `duration` | `{ min: 0.1, max: 2 }` | Número o rango (`RangeObject`, con `min` y `max`) según la distancia y velocidad [C] |
| `delay` | mitad de `scrub`, o 0.1 | Espera desde el último evento de scroll [O] |
| `ease` | `"power3"` | [O] |
| `directional` | `true` desde 3.8 | Va en el sentido del último scroll; `false` usa el más cercano [O]. Solo con número o array: con función o etiquetas no se lee [C] |
| `inertia` | `true` | `false` no considera la velocidad [O] |
| `onStart`, `onInterrupt`, `onComplete` | — | Reciben la instancia. `onInterrupt` salta si el usuario corta el ajuste [O] |

`onSnapComplete` (en `ScrollTrigger.Vars`) es equivalente a `snap.onComplete`, y tampoco se llama si el ajuste se cancela. [O]

## Ejemplo

Se para en 420 y acaba en 500. El ejemplo espera antes de mover porque en el arranque del plugin no se programa ningún ajuste. [C] Con la página ya asentada, parar en 320 bajando acaba también en 500, aunque lo más cercano sea 250: eso es `directional`. [E]

```js
await new Promise((r) => setTimeout(r, 520));

const eventos = [];
const st = ScrollTrigger.create({
  start: 0,
  end: 1000,
  snap: {
    snapTo: 0.25,
    duration: 0.05,
    delay: 0.02,
    onStart: () => eventos.push("inicio"),
    onComplete: () => eventos.push("fin"),
  },
  onSnapComplete: () => eventos.push("completo"),
});

window.scrollTo(0, 420);
ScrollTrigger.update();

// prueba: window.scrollY === 500
// prueba: st.progress === 0.5
// prueba: eventos.join() === "inicio,completo,fin"
```

`onSnapComplete` se ejecuta antes que `snap.onComplete`. [E]

`ScrollTrigger.snapDirectional()` expone la misma lógica como utilidad. Sirve para `snap` con función, o para decidir tú qué sección toca:

```js
const pasos = ScrollTrigger.snapDirectional(0.25);
const lista = ScrollTrigger.snapDirectional([0, 0.1, 0.5, 1]);

// prueba: pasos(0.3) === 0.25
// prueba: pasos(0.3, 1) === 0.5
// prueba: pasos(0.3, -1) === 0.25
// prueba: pasos(0.5, 1) === 0.5
// prueba: pasos(0.26, 1, 0.05) === 0.25
// prueba: pasos(0.26, 1) === 0.5
// prueba: lista(0.2) === 0.1
// prueba: lista(0.2, 1) === 0.5
// prueba: lista(0.2, -1) === 0.1
```

Tiene un tercer argumento sin documentar, `threshold`. Si el valor dista del punto anterior menos que ese umbral, no avanza al siguiente: `pasos(0.26, 1, 0.05)` da `0.25`, y `pasos(0.26, 1)` da `0.5`. [E]

Etiquetas y control del tween de ajuste:

```js
const tl = gsap.timeline({
  scrollTrigger: { start: 0, end: 1000, scrub: true, snap: { snapTo: "labels", duration: 0.2 } },
});
tl.to(".pieza", { x: 100, duration: 1, ease: "none" })
  .addLabel("mitad")
  .to(".pieza", { y: 100, duration: 3, ease: "none" });

const paso = tl.scrollTrigger.labelToScroll("mitad");
const enCurso = tl.scrollTrigger.getTween(true); // tween de ajuste, solo si hay uno en marcha

// prueba: paso === 250
// prueba: !enCurso
```

Parar en 320 según lo reciente que sea el último refresco, y el estilo que deja el plugin:

```js
await new Promise((r) => setTimeout(r, 520));
const ajuste = { snapTo: 0.25, duration: 0.02, delay: 0.02 };

const reciente = ScrollTrigger.create({ start: 0, end: 1000, snap: ajuste });
await new Promise((r) => setTimeout(r, 40));
window.scrollTo(0, 320);
ScrollTrigger.update();
await new Promise((r) => setTimeout(r, 200));
const recienCreada = window.scrollY;
reciente.kill();
const estilo = document.documentElement.style.scrollBehavior;

window.scrollTo(0, 0);
ScrollTrigger.update();
ScrollTrigger.create({ start: 0, end: 1000, snap: ajuste });
await new Promise((r) => setTimeout(r, 600));
window.scrollTo(0, 320);
ScrollTrigger.update();
await new Promise((r) => setTimeout(r, 1000));

// prueba: recienCreada === 250
// prueba: window.scrollY === 500
// prueba: estilo === "auto" && document.body.style.scrollBehavior === "auto"
```

`getTween(true)` devuelve el ajuste en curso: `snap.progress(1).kill()` lo termina al instante. Sin snap en marcha no devuelve nada útil. [O]

## Trampas

- **Justo tras un `refresh()` no es direccional.** Durante 500 ms, `directional` se comporta como `false`. Parar en 320 recién creada la instancia acaba en 250. No lo notarás en uso normal, pero sí en pruebas automáticas. [C] [E]
- **Sale un valor en píxeles.** `snap: 500` no significa "ir a 500 px". Convierte: `posicion / (st.end - st.start)` o usa `labelToScroll()`. [O] [P]
- **Con `pin` y secciones, usa `1 / (N - 1)` sin redondear.** Un decimal truncado acumula error y deja la última sección a un píxel. [P]
- **`scroll-behavior: smooth`.** Al crear una instancia con `snap`, ScrollTrigger escribe `scroll-behavior: auto` en línea en `html` y `body` (o en el scroller), para toda la página y sin restaurarlo tras `kill()`. Un CSS con `!important` volvería a romperlo. [C] [E] [P]
- **No funciona en instancias con `containerAnimation`.** El ajuste se pone en la instancia que mueve la pista, no en las de dentro. [O]
- **`ScrollSmoother` y `snap`.** Se admite, pero anima la posición nativa: el suavizado se suma al ajuste, así que usa `delay` y `duration` más generosos. [P]
- **`snap` se cancela al interactuar.** Si el usuario toca o sigue con la rueda, el tween muere, `onInterrupt` se dispara y `onSnapComplete` no. No dependas de él para cambiar estado crítico. [O]
- **Ajuste sobre scroll muy largo y `duration` fija** viaja a velocidad absurda. Usa el rango `{ min, max }`. [P]
- **`css-snap` es otra cosa.** Eso es el plugin de valores (`snap:` en un tween); ver [css-snap](../04-propiedades/css-snap.md). [P]
