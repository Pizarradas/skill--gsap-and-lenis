---
id: scr-pin
titulo: pin, fijar un elemento durante un tramo de scroll
capa: 07-scroll
tipo: concepto
ambito: ScrollTrigger
resumen: Qué hace pin en el DOM (pin-spacer, position fixed, padding), opciones pinSpacing, pinType, pinReparent, anticipatePin, y causas de pines que saltan.
api: [ScrollTrigger.Vars.pin, ScrollTrigger.Vars.pinSpacing, ScrollTrigger.Vars.pinType, ScrollTrigger.Vars.pinReparent, ScrollTrigger.Vars.pinSpacer, ScrollTrigger.Vars.pinnedContainer, ScrollTrigger.Vars.anticipatePin, ScrollTrigger.pin]
requiere: [scr-start-end]
relacionadas: [scr-scrub, scr-horizontal, scr-refresh, scr-normalize, cal-st-errores, rec-pin-horizontal]
etiquetas: [scroll, pin, layout]
fuentes:
  - docs/v3/Plugins/ScrollTrigger.md
  - docs/v3/Plugins/ScrollTrigger/pin.md
estado: verificado
version: 3.15.1
---
# pin

`pin` deja un elemento quieto en pantalla mientras el scroll recorre el tramo, y el resto de la página espera a que se suelte. Es la base de narraciones por pasos y secciones horizontales.

## Modelo mental

Lo que ocurre, en orden [O] [E]:

1. **Al crear:** envuelve el elemento en un `<div class="pin-spacer">` con el ancho y alto medidos, y le añade `padding-bottom` igual a la distancia del pin. La página crece esa distancia.
2. **Entre `start` y `end`:** `position: fixed` con `top`, `left` y `width` en línea.
3. **Tras `end`:** vuelve a su `position` original con `transform: translate(0, distancia)`, para quedar al final del espaciador.
4. **Al refrescar:** retira el espaciador, mide en el flujo natural y lo reinserta.

Si el scroller no es el viewport no usa `fixed`, sino `transform` en cada actualización. [O] [E]

| Opción | Valor | Para qué |
|---|---|---|
| `pin` | `true`, elemento o selector | `true` fija el `trigger`. Puede fijar otro elemento. Solo uno por instancia [O] |
| `pinSpacing` | `true`, `false`, `"margin"` | `false` no añade espacio y lo de abajo pasa por debajo; `"margin"` usa margen en vez de padding [O] [E] |
| `pinType` | `"fixed"`, `"transform"` | Fuerza la técnica. Por defecto `fixed` solo en el viewport [O] |
| `anticipatePin` | número | Fija un poco antes según la velocidad para tapar el destello con scroll rápido. `1` suele bastar; por defecto `0` [O] |
| `pinReparent` | booleano | Mueve el elemento a `<body>` mientras está fijado. Último recurso [O] |
| `pinSpacer` | elemento o selector | Usa tu propio espaciador en lugar de crear uno, útil con un `iframe` dentro [O] |
| `pinnedContainer` | elemento o selector | El `trigger` está dentro de algo fijado por **otra** instancia: corrige `start`/`end` [O] |

## Ejemplo

```html
<div style="height:500px"></div>
<div class="escena" style="height:200px"><div class="texto"></div></div>
<div class="siguiente" style="height:1500px"></div>
```

Escena de 200 px en `top: 500`, fijada 400 px. Se revisa antes, durante y después:

```js
const altoInicial = document.documentElement.scrollHeight;
const escena = document.querySelector(".escena");
const st = ScrollTrigger.create({ trigger: ".escena", pin: true, start: "top top", end: "+=400" });
const espaciador = escena.parentNode;
const altoConPin = document.documentElement.scrollHeight;

window.scrollTo(0, 700); // mitad del tramo 500-900
ScrollTrigger.update();
const durante = [getComputedStyle(escena).position, escena.getBoundingClientRect().top, st.progress];

window.scrollTo(0, 1000); // 100 px después del final
ScrollTrigger.update();
const despues = [getComputedStyle(escena).position, escena.style.transform, escena.getBoundingClientRect().top];

// prueba: espaciador.className === "pin-spacer"
// prueba: espaciador.style.paddingBottom === "400px"
// prueba: altoConPin - altoInicial === 400
// prueba: durante.join() === "fixed,0,0.5"
// prueba: despues.join("|") === "static|translate(0px, 400px)|-100"
```

`kill()` deshace todo:

```js
const altoInicial = document.documentElement.scrollHeight;
const fijo = ScrollTrigger.create({ trigger: ".escena", pin: true, end: "+=400" });
fijo.kill();

// prueba: document.querySelector(".pin-spacer") === null
// prueba: document.documentElement.scrollHeight === altoInicial
```

Patrón habitual: fijar el contenedor y animar lo de dentro con un timeline. El pin **no** se aplica al elemento animado.

```js
const tl = gsap.timeline({
  scrollTrigger: { trigger: ".escena", pin: true, start: "top top", end: "+=400", scrub: true },
});
tl.to(".texto", { x: 100, ease: "none" });
tl.scrollTrigger.refresh();

window.scrollTo(0, 800);
ScrollTrigger.update();

// prueba: tl.scrollTrigger.progress === 0.75
// prueba: gsap.getProperty(".texto", "x") === 75
// prueba: getComputedStyle(document.querySelector(".escena")).position === "fixed"
```

Espaciado alternativo:

```js
const base = document.documentElement.scrollHeight;
ScrollTrigger.create({ trigger: ".escena", pin: true, end: "+=400", pinSpacing: false });
const sinEspacio = document.documentElement.scrollHeight - base;

ScrollTrigger.create({ trigger: ".siguiente", pin: true, end: "+=100", pinSpacing: "margin" });
const margen = document.querySelector(".siguiente").parentNode.style.marginBottom;

// prueba: sinEspacio === 0
// prueba: margen === "100px"
```

En contenedor con `display: flex`, `pinSpacing` pasa a `false` por defecto; y en un scroller propio el pin usa `transform`:

```html
<div class="fila" style="display:flex"><div class="col" style="width:100px;height:200px"></div></div>
<div class="caja" style="height:300px;overflow:auto"><div style="height:100px"></div><div class="nota" style="height:100px"></div><div style="height:1000px"></div></div>
```

```js
const col = ScrollTrigger.create({ trigger: ".col", pin: true, end: "+=400" });
const relleno = document.querySelector(".col").parentNode.style.paddingBottom;

const nota = document.querySelector(".nota");
const dentro = ScrollTrigger.create({ trigger: ".nota", scroller: ".caja", pin: true, end: "+=200" });
document.querySelector(".caja").scrollTop = 150;
ScrollTrigger.update();

// prueba: relleno === "0px"
// prueba: dentro.start === 100 && dentro.progress === 0.25
// prueba: getComputedStyle(nota).position === "static"
// prueba: nota.style.transform === "translate(0px, 50px)"
```

## Trampas

- **Pin que salta o se mueve con el scroll.** Casi siempre un ancestro con `transform`, `filter`, `perspective` o `will-change: transform`: el navegador lo convierte en bloque contenedor y `position: fixed` deja de ser relativo a la ventana. Quítalo. Si no puedes, `pinReparent: true`, a cambio de romper selectores CSS que dependan del anidamiento. [O]
- **Animar el elemento fijado.** Falsea las medidas. Anima hijos. [O]
- **Animar `x` del propio trigger con `pin`** es el error habitual en secciones horizontales: fija el contenedor exterior y mueve la pista interior ([scr-horizontal](scr-horizontal.md)). [P]
- **Pines fuera de orden.** Un pin aporta altura. Lo que esté debajo y se haya creado antes queda con `start` sin corregir, y `refresh()` no lo arregla porque refresca en orden de creación; hace falta `ScrollTrigger.sort()` o crear de arriba abajo ([scr-refresh](scr-refresh.md)). [O] [E]
- **Timeline con `pin` seguido de otras instancias.** El timeline tarda un tick en medirse y las siguientes no ven su distancia. Llama a `tl.scrollTrigger.refresh()` tras poblarlo. [O]
- **Pines anidados.** La documentación se contradice: una parte reserva `pinnedContainer` a instancias sin pin, y otra lo recomienda para pines anidados. El código tiene rutas para ello, sin prueba aquí: evítalos si puedes. [O] [C]
- **Padre con `display: flex` o `position: absolute`:** el padding no empuja a los hermanos. Reserva el espacio a mano. [O]
- **Tirones al entrar o salir con scroll rápido.** El navegador pinta en otro hilo. Prueba `anticipatePin: 1`; si no basta, [`normalizeScroll()`](scr-normalize.md) o ScrollSmoother. [O]
- **`will-change: transform` en un elemento con `pinType: "fixed"`** rompe el `fixed` igual que un `transform` real. [O]
- **Elemento más alto que el viewport.** `start: "top top"` esconde su parte baja: usa `"bottom bottom"` o un `end` que deje leerlo todo. [P]
- **Fijar el mismo elemento varias veces** es válido en tramos que no se solapen, siempre con el orden correcto. [O]
