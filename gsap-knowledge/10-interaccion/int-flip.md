---
id: int-flip
titulo: Flip, animar cambios de estado del DOM
capa: 10-interaccion
tipo: plugin
ambito: Flip
resumen: Captura posición y tamaño, deja que cambies el DOM como quieras y anima desde el estado anterior al nuevo, incluso con reparenting, flex, grid y scrollTrigger.
api: [Flip.getState, Flip.from, Flip.AnimationVars.absolute, Flip.AnimationVars.simple, Flip.AnimationVars.props, Flip.TweenVarOverrides.scale, Flip.FromToVars.absoluteOnLeave, Flip.FromToVars.prune, Flip.FromToVars.fade, Flip.FromToVars.nested, Flip.FromToVars.onEnter, Flip.FromToVars.onLeave, Flip.FromToVars.spin, Flip.FromToVars.targets, Flip.FromToVars.toggleClass, Flip.FromToVars.zIndex]
relacionadas: [int-flip-api, int-flip-batch, rec-transicion-flip, scr-scrolltrigger, fra-agnostico]
etiquetas: [layout, transicion, estado, flex, grid]
fuentes:
  - docs/v3/Plugins/Flip.md
  - docs/v3/Plugins/Flip/static.from().md
  - docs/v3/Plugins/Flip/static.getState().md
estado: verificado
version: 3.15.1
---
# Flip

Anima transiciones de layout que con tweens normales serían imposibles o muy laboriosas: cambiar de contenedor, reordenar, alternar clases, pasar de cuadrícula a lista. La técnica FLIP (First, Last, Invert, Play) mide, cambia, compensa la diferencia con transformaciones y anima su eliminación. [O]

## Para qué sirve

Miniatura que se abre a pantalla completa, filtrado o reordenación de listas, mover un elemento entre contenedores, cambiar entre vistas. El layout final lo decide tu CSS y Flip solo anima el trayecto.

## Registro

```js fragmento
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);
```

**Sin empaquetador:** `<script>` con `dist/Flip.min.js` (global `Flip`), o entrada `gsap/Flip` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

Tres pasos, siempre en este orden:

1. `const estado = Flip.getState(objetivos, vars?)`: medir.
2. Cambiar el DOM o los estilos, sin pasar por Flip.
3. `Flip.from(estado, vars)`: devuelve un timeline.

`getState` acepta selector, elemento o array. `vars` puede ser `{ props, simple, kill, batch }`. Siempre registra transformaciones, tamaño y opacidad. [O] Los tipos solo declaran `simple` y `props`; `kill` y `batch` funcionan igualmente. [C]

Opciones de `Flip.from()`, más cualquiera de un tween (`duration`, `ease`, `stagger`, `onComplete`):

| Opción | Efecto |
|---|---|
| `absolute` | `true` o subconjunto: `position: absolute` durante el vuelo. Arregla casi todos los problemas de flex y grid [O] |
| `scale` | Usa `scaleX/scaleY` en lugar de `width/height`. Mejor rendimiento, deforma contenido [O] |
| `nested` | Si hay padre e hijo entre los objetivos: evita acumular desplazamientos [O] |
| `props` | Propiedades CSS extra. Deben haberse capturado en `getState` [O] |
| `targets` | Subconjunto, o elementos nuevos. Si no están en el estado, van a `onEnter` [O] |
| `onEnter` `onLeave` | `(elementos) => animación`, para los que aparecen o desaparecen [O] |
| `absoluteOnLeave` | Solo los que salen se vuelven absolutos [O] |
| `fade` | Fundido cruzado entre dos elementos con el mismo `data-flip-id` [O] |
| `spin` | `true`, número de vueltas o función `(i, el, objetivos)` [O] |
| `prune` | Excluye los objetivos que no cambian [O] |
| `toggleClass` | Clase durante el vuelo [O] |
| `zIndex` | Durante el vuelo [O] |
| `simple` | Omite cálculos de rotación y escala de contenedores [O] |
| `scrollTrigger` | Desde 3.15.1, se pasa al timeline [C] [E] |

Sin documentar, `custom` separa propiedades con su propio ease o duración, como `custom: { scale: { ease: "back" } }`. [C]

## Ejemplo

Cambio de contenedor. Se comprueba que el elemento **no se mueve visualmente** al llamar a `from()`, que termina en su sitio nuevo y que no quedan estilos en línea:

```html
<style>
  .origen { position: absolute; left: 0; top: 0; }
  .destino { position: absolute; left: 300px; top: 200px; }
  .pieza { width: 50px; height: 50px; }
</style>
<div class="origen"><div class="pieza"></div></div>
<div class="destino"></div>
```

```js
const pieza = document.querySelector(".pieza");
const inicio = pieza.getBoundingClientRect();

const estado = Flip.getState(pieza);
document.querySelector(".destino").appendChild(pieza); // salto real en el DOM

const vuelo = Flip.from(estado, { duration: 0.2, ease: "none", toggleClass: "volando" });

const alEmpezar = pieza.getBoundingClientRect();
const claseEnVuelo = pieza.classList.contains("volando");
await new Promise((r) => setTimeout(r, 400));
const alAcabar = pieza.getBoundingClientRect();
// prueba: alEmpezar.left === inicio.left && alEmpezar.top === inicio.top
// prueba: claseEnVuelo === true
// prueba: alAcabar.left === 300 && alAcabar.top === 200
// prueba: pieza.classList.contains("volando") === false
// prueba: !pieza.getAttribute("style").includes("transform")
// prueba: vuelo.data === "isFlip"
```

Cambio de tamaño por clase en un flex, con `absolute` para que las vecinas no estorben:

```html
<style>
  .fila { display: flex; gap: 10px; }
  .celda { width: 50px; height: 50px; }
  .celda.grande { width: 150px; }
</style>
<div class="fila"><div class="celda" id="a"></div><div class="celda" id="b"></div></div>
```

```js
const a = document.querySelector("#a");
const b = document.querySelector("#b");
const antes = Flip.getState(".celda");

a.classList.add("grande");

Flip.from(antes, { duration: 0.2, ease: "none", absolute: true });
const anchoInicial = a.getBoundingClientRect().width;
const posicionEnVuelo = getComputedStyle(a).position;
await new Promise((r) => setTimeout(r, 400));
// prueba: anchoInicial === 50
// prueba: posicionEnVuelo === "absolute"
// prueba: a.getBoundingClientRect().width === 150
// prueba: b.getBoundingClientRect().left === 160
// prueba: getComputedStyle(a).position === "static"
```

Salidas y entradas: un elemento oculto en el estado final llega a `onLeave`. Sin `absolute` no se vería, porque ya tiene `display: none`. [O]

```html
<style>.fila2 { display: flex; } .tar { width: 50px; height: 50px; }</style>
<div class="fila2"><div class="tar" id="uno"></div><div class="tar" id="dos"></div><div class="tar" id="tres" style="display:none"></div></div>
```

```js
const salen = [];
const entran = [];
const estadoLista = Flip.getState(".tar");
document.querySelector("#uno").style.display = "none";
document.querySelector("#tres").style.display = "block";

Flip.from(estadoLista, {
  duration: 0.1,
  absolute: true,
  onLeave: (els) => { salen.push(...els); return gsap.to(els, { opacity: 0, duration: 0.1 }); },
  onEnter: (els) => { entran.push(...els); return gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.1 }); },
});
// prueba: salen.length === 1 && salen[0].id === "uno"
// prueba: entran.length === 1 && entran[0].id === "tres"
```

Dos elementos distintos que se comportan como uno, gracias a `data-flip-id`:

```html
<style>.miniatura { width: 40px; height: 40px; } .detalle { position: absolute; left: 200px; top: 100px; width: 200px; height: 120px; display: none; }</style>
<div class="miniatura" data-flip-id="foto"></div>
<div class="detalle" data-flip-id="foto"></div>
```

```js
const mini = document.querySelector(".miniatura");
const grande = document.querySelector(".detalle");
const previo = Flip.getState(".miniatura, .detalle");

mini.style.display = "none";
grande.style.display = "block";

Flip.from(previo, { duration: 0.2, ease: "none", absolute: true, fade: true });
const anchoAlEmpezar = grande.getBoundingClientRect().width;
const opacidadAlEmpezar = grande.style.opacity;
await new Promise((r) => setTimeout(r, 400));
// prueba: anchoAlEmpezar === 40
// prueba: opacidadAlEmpezar === "0"
// prueba: grande.getBoundingClientRect().width === 200
// prueba: getComputedStyle(mini).display === "none"
```

Sin `data-flip-id`, Flip asigna `auto-1`, `auto-2`… al capturar. [O]

### Con ScrollTrigger

Desde 3.15.1, `scrollTrigger` llega al timeline y `scrub` controla todo el vuelo. Antes se pasaba a los tweens internos. [C]

```html
<style>.base { position: absolute; left: 0; top: 0; } .meta { position: absolute; left: 300px; top: 0; } .viajero { width: 40px; height: 40px; }</style>
<div class="base"><div class="viajero"></div></div>
<div class="meta"></div>
```

```js
const viajero = document.querySelector(".viajero");
const foto = Flip.getState(viajero);
document.querySelector(".meta").appendChild(viajero);

const conScroll = Flip.from(foto, {
  ease: "none",
  scrollTrigger: { trigger: document.body, start: "top top", end: "+=1000", scrub: true },
});
window.scrollTo(0, 500);
await new Promise((r) => setTimeout(r, 300));
const enScroll = conScroll.scrollTrigger.progress;
const avance = conScroll.progress();
// prueba: enScroll > 0
// prueba: Math.abs(avance - enScroll) < 0.02
```

## Trampas

- **Orden.** `getState()` antes del cambio y `from()` después. Si el DOM lo actualiza un render diferido, el cambio no es inmediato: llama a `from()` cuando ese render haya terminado, con el mecanismo de tu tecnología, un `requestAnimationFrame` o [Flip.batch](int-flip-batch.md). [O] Ver [integración en cualquier tecnología](../12-frameworks/fra-agnostico.md).
- **El framework recrea los nodos.** `from()` usa los elementos capturados, que ya no están en el DOM. Pasa `targets: ".clase"` y pon `data-flip-id` estable. [O]
- **Empuja a las vecinas.** Si el layout salta durante el vuelo, usa `absolute: true`. Con flex y grid, el elemento sale del flujo y deja hueco. [O]
- **Solo 2D.** `rotationX`, `rotationY` y `z` no están contemplados. [O]
- **`box-sizing: border-box`** en los objetivos, o los tamaños no cuadrarán. [O]
- **Transformaciones en CSS.** Fíjalas con GSAP. Si quieres anular su caché: `gsap.set(el, { clearProps: "transform" })`. [O]
- **`getState()` termina los vuelos en curso** de esos objetivos, para medir el estado final limpio. Interrumpir así hace saltar el elemento; con `{ kill: false }` el vuelo sigue. [O] [E]
- **`onComplete` y compañía van al timeline**, no a cada tween: `this` es el timeline. [C] [E]
- **`absolute` y scroll.** Las coordenadas se calculan según el viewport: hacer scroll o redimensionar durante el vuelo puede descolocarlo, aunque al terminar queda bien. [O]
- **`props` sin capturar** no hace nada: deben estar en `getState(…, { props })`. [O]
- **Escala y texto.** `scale: true` deforma hijos y texto durante el vuelo. Usa `width/height` si el contenido se ve mal. [P]
