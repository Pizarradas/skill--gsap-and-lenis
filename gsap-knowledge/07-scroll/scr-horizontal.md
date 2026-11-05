---
id: scr-horizontal
titulo: Scroll horizontal, nativo y simulado con containerAnimation
capa: 07-scroll
tipo: concepto
ambito: ScrollTrigger
resumen: Dos horizontales distintos, horizontal true para scroll real y pin más tween para el simulado, con containerAnimation para disparar animaciones dentro de la pista.
api: [ScrollTrigger.Vars.horizontal, ScrollTrigger.Vars.containerAnimation]
requiere: [scr-pin, scr-scrub]
relacionadas: [scr-start-end, scr-snap, scr-refresh, rec-pin-horizontal]
etiquetas: [scroll, horizontal, pin]
fuentes:
  - docs/v3/Plugins/ScrollTrigger.md
estado: verificado
version: 3.15.1
---
# Scroll horizontal

Hay dos situaciones que se confunden. En la primera existe un scroll horizontal real. En la segunda, el usuario hace scroll **vertical** y una pista se traslada con `x`: ningún scroller se mueve en horizontal, y por eso ScrollTrigger necesita ayuda para saber qué entra en pantalla.

## Modelo mental

| | Horizontal nativo | Horizontal simulado |
|---|---|---|
| Qué se mueve | `scrollLeft` de un contenedor o ventana | `x` de una pista, por `scrub` |
| Opción | `horizontal: true` | `pin` + tween con `ease: "none"` |
| Palabras de posición | `"left center"`, `"right 80%"` | `"top top"` (la instancia es vertical) |
| Animaciones internas | Instancias normales con `horizontal: true` | Instancias con `containerAnimation` |
| `pin` y `snap` internos | Sí | No [O] |

Con `horizontal: true` y `trigger`, el valor por defecto de `start` es `"left right"`, y el de `end`, `"right left"`. Con `pin`, `start` pasa a `"left left"`; sin `trigger`, es 0. [C] [E]

En `containerAnimation`, ScrollTrigger mide dónde queda el `trigger` al inicio y al final de esa animación y traduce el tramo a **tiempo de la animación**. Por eso `start` y `end` de esas instancias no son píxeles: son segundos de la animación contenedora, y `self.scroll()` da su tiempo. Además fija la dirección en horizontal sin necesidad de `horizontal: true`, salvo con `horizontal: false`. [C] [E]

## Ejemplo

Horizontal nativo:

```html
<div class="carril" style="width:600px;overflow-x:auto;white-space:nowrap"><div style="display:inline-block;width:300px;height:50px"></div><div class="foto" style="display:inline-block;width:200px;height:50px"></div><div style="display:inline-block;width:1500px;height:50px"></div></div>
```

```js
const carril = document.querySelector(".carril");
const st = ScrollTrigger.create({
  trigger: ".foto",
  scroller: ".carril",
  horizontal: true,
  start: "left center",
  end: "right center",
});
const defecto = ScrollTrigger.create({ trigger: ".foto", scroller: ".carril", horizontal: true });

carril.scrollLeft = 100;
ScrollTrigger.update();

// prueba: st.start === 0 && st.end === 200
// prueba: st.progress === 0.5
// prueba: defecto.start === -300 && defecto.end === 500
// prueba: ScrollTrigger.maxScroll(carril, true) === 1400
// prueba: st.scroll() === 100
```

Con `pin`, el valor por defecto de `start` cambia:

```js
const fijado = ScrollTrigger.create({ trigger: ".foto", scroller: ".carril", horizontal: true, pin: true });

// prueba: fijado.start === 300 && fijado.end === 500
```

Horizontal simulado. Tres paneles de 1000 px, con un elemento dentro del segundo:

```html
<style>
  .ventana { overflow: hidden; }
  .pista { display: flex; width: 3000px; height: 400px; }
  .panel { flex: none; width: 1000px; height: 400px; }
  .sello { width: 100px; height: 50px; margin-left: 200px; }
</style>
<div style="height:100px"></div>
<div class="ventana">
  <div class="pista">
    <div class="panel"></div>
    <div class="panel"><div class="sello"></div></div>
    <div class="panel"></div>
  </div>
</div>
<div style="height:600px"></div>
```

```js
await new Promise((r) => setTimeout(r, 250)); // deja pasar el refresco de "load"

const pista = document.querySelector(".pista");
const recorrido = () => pista.scrollWidth - document.documentElement.clientWidth;

const mover = gsap.to(pista, {
  x: () => -recorrido(),
  ease: "none",                     // obligatorio con containerAnimation
  scrollTrigger: {
    trigger: ".ventana",
    pin: true,
    scrub: true,
    end: () => "+=" + recorrido(),  // 1 px de scroll = 1 px de pista
    invalidateOnRefresh: true,
  },
});

const sello = ScrollTrigger.create({
  trigger: ".sello",
  containerAnimation: mover,
  start: "left center",
  end: "right center",
  toggleClass: "visible",
});

const st = mover.scrollTrigger;
window.scrollTo(0, st.start + recorrido() / 2);
ScrollTrigger.update();
const xEnMitad = gsap.getProperty(pista, "x");

window.scrollTo(0, st.start + 760);
ScrollTrigger.update();
const activo = [sello.isActive, document.querySelector(".sello").classList.contains("visible")];
ScrollTrigger.refresh();
const trasRefresh = [sello.isActive, sello.progress > 0];
const claseTrasRefresh = document.querySelector(".sello").classList.contains("visible");

window.scrollTo(0, st.start + 765);
ScrollTrigger.update();
const trasMover = [sello.isActive, document.querySelector(".sello").classList.contains("visible")];

const pxInicio = st.start + (sello.start / mover.duration()) * (st.end - st.start);
window.scrollTo(0, pxInicio - 2);
ScrollTrigger.update();
const antesDelInicio = sello.isActive;
window.scrollTo(0, pxInicio + 2);
ScrollTrigger.update();
const trasElInicio = sello.isActive;

// Ancho real de la barra: 15 px con barra clásica, 0 con una superpuesta.
const medidor = document.createElement("div");
medidor.style.cssText = "width:100px;height:50px;overflow:scroll";
document.body.append(medidor);
const barra = medidor.offsetWidth - medidor.clientWidth;
medidor.remove();

// prueba: st.start === 100
// prueba: st.end - st.start === recorrido()
// prueba: Math.abs(xEnMitad + recorrido() / 2) < 1
// prueba: sello.end <= mover.duration() + 0.1 && sello.start < 0.5
// prueba: activo.join() === "true,true"
// prueba: trasRefresh.join() === "false,true" && claseTrasRefresh === false
// prueba: trasMover.join() === "true,false"
// prueba: antesDelInicio === false && trasElInicio === true
// prueba: window.innerWidth === 1000 && document.documentElement.clientWidth === 1000 - barra
```

`clientWidth` descuenta la barra vertical, y `innerWidth` no: en el arnés con Chrome son 985 y 1000, y con Firefox sin interfaz, cuya barra mide 0, son iguales. Si usas `innerWidth`, la pista se queda corta el ancho de la barra, 15 px en navegadores con barra clásica. [E]

Tween encadenado con paneles al 100 %, la variante más compacta cuando todos miden lo mismo:

```js fragmento
const paneles = gsap.utils.toArray(".panel");
gsap.to(paneles, {
  xPercent: -100 * (paneles.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: ".pista",
    pin: true,
    scrub: 1,
    snap: 1 / (paneles.length - 1),
    end: () => "+=" + document.querySelector(".pista").offsetWidth,
  },
});
```

## Trampas

- **`ease` distinto de `"none"` en la animación contenedora** desincroniza los `start`/`end` internos: el cálculo asume velocidad lineal. [O]
- **`pin` y `snap` no funcionan en instancias con `containerAnimation`.** Ponlos en la instancia que mueve la pista. [O]
- **Animar con `x` el propio `trigger` interior** falsea el cálculo, que asume que solo lo desplaza la pista. Anima un hijo o compensa `start` y `end`. [O]
- **Fijar y mover el mismo elemento.** Fija un contenedor (`.ventana`) y anima el interior (`.pista`). Si no, el pin mide un elemento que se mueve. [P]
- **`x` en píxeles sin función.** `x: -2000` no se adapta a la pantalla. Usa funciones con `invalidateOnRefresh: true`. [O]
- **`overflow-x` en `body` o `html`** con la pista fuera de un contenedor con `overflow: hidden` crea scroll horizontal fantasma. [P]
- **`sello.start` no son píxeles.** Si lo comparas con `scrollY`, nada coincide. Convierte con `mapRange`, o usa `mover.scrollTrigger.start + (sello.start / mover.duration()) * distancia`. [E]
- **Tras un `refresh()` a mitad de pista,** las instancias con `containerAnimation` quedan con `isActive` a `false` y sin la clase de `toggleClass`, aunque conserven `progress`. `ScrollTrigger.update()` solo no lo arregla. El siguiente movimiento de la pista recupera `isActive`, pero la clase no vuelve hasta que se cruce otra vez `start` o `end`. Si dependes de ese estado, derívalo de `progress`. [E]
- **Móvil.** El tramo es largo y `scrub` numérico se nota menos con el dedo; con mucho panel, valora un carrusel nativo con `scroll-snap`. [P]
