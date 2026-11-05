# Plantilla de orquestación

`orquestador.js` es el único punto por el que la aplicación toca el scroll y el movimiento. Cambiar de perfil es cambiar una palabra: el resto del código no se reescribe. Las órdenes que aplica están demostradas en [`03-ciclo`](../03-ciclo/orq-ciclo.md).

| Archivo | Uso |
|---|---|
| `orquestador.js` | Fuente: módulo ES, sin `import` |
| `globales/orquestador.js` | Generado: para `<script>` clásico, expone `Plantillas.iniciarMovimiento` |
| `orquestador.html`, `orquestador.prueba.js` | Prueba, en `python3 probar_bloques.py --plantillas` |

No importa nada: recibe las bibliotecas por parámetro. Un perfil solo exige las suyas, y falla con un `TypeError` claro si falta alguna.

| Perfil | Parámetros obligatorios | Opcionales |
|---|---|---|
| `ninguno` | | |
| `gsap` | `gsap` | `ScrollTrigger`, `ScrollToPlugin`, que además hace suyas las anclas |
| `gsap-smoother` | `gsap`, `ScrollTrigger`, `ScrollSmoother` | |
| `lenis` | `Lenis` | |
| `gsap+lenis` | `gsap`, `ScrollTrigger`, `Lenis` | `ScrollToPlugin` no se usa: `irA` va por Lenis |

## Las tres vías de carga

Probadas en Chrome 156, con `gsap+lenis`, rueda real, `irA` y `salir`. `ninguno` empaquetado con esbuild no arrastra GSAP ni Lenis.

### Empaquetador

```js fragmento
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { iniciarMovimiento } from "./orquestador.js";

const mov = iniciarMovimiento({ perfil: "gsap+lenis", gsap, ScrollTrigger, Lenis });
```

### `<script>` clásico

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.css">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js"></script>
<script src="globales/orquestador.js"></script>
<script>
  const mov = Plantillas.iniciarMovimiento({ perfil: "gsap+lenis", gsap, ScrollTrigger, Lenis });
</script>
```

### Módulos nativos

```html
<script type="importmap">
  { "imports": {
    "gsap": "https://cdn.jsdelivr.net/npm/gsap@3.15.1/index.js",
    "gsap/ScrollTrigger": "https://cdn.jsdelivr.net/npm/gsap@3.15.1/ScrollTrigger.js",
    "lenis": "https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.mjs"
  } }
</script>
<script type="module">
  import gsap from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";
  import Lenis from "lenis";
  import { iniciarMovimiento } from "./orquestador.js";
  const mov = iniciarMovimiento({ perfil: "gsap+lenis", gsap, ScrollTrigger, Lenis });
</script>
```

Las rutas de CDN no se ejecutaron: el laboratorio usó los mismos archivos servidos en local.

## Un ejemplo por perfil

La aplicación es siempre la misma, y va después del arranque:

```js fragmento
mov.añadir(({ reducido }) => {
  gsap.to(".cabecera", { y: reducido ? 0 : -40, scrollTrigger: { scrub: true } });
});
boton.addEventListener("click", () => mov.irA("#contacto", { desplazamiento: -80 }));
dialogo.addEventListener("toggle", (e) => {
  if (e.oldState === e.newState) return;   // close() y showModal() seguidos funden dos eventos en uno
  e.newState === "open" ? mov.bloquear() : mov.desbloquear();
});
```

Solo cambia el arranque. En `ninguno` y `lenis`, `añadir` no puede usar GSAP: pon ahí tus propios efectos.

```js fragmento
const mov = iniciarMovimiento({ perfil: "ninguno" });

const mov = iniciarMovimiento({ perfil: "gsap", gsap, ScrollTrigger, ScrollToPlugin });

const mov = iniciarMovimiento({
  perfil: "gsap-smoother", gsap, ScrollTrigger, ScrollSmoother,
  raiz: "#smooth-wrapper", content: "#smooth-content",
  opciones: { smoother: { smooth: 1, effects: true } },
});

const mov = iniciarMovimiento({ perfil: "lenis", Lenis, opciones: { lenis: { lerp: 0.1 } } });

const mov = iniciarMovimiento({
  perfil: "gsap+lenis", gsap, ScrollTrigger, Lenis,
  opciones: { lenis: { lerp: 0.1 }, smoother: { smooth: 1 } },   // lo de otro perfil se ignora
});
```

En un contenedor, añade `raiz` y `content`. ScrollTrigger recibe ese `scroller` por defecto mientras dure, así que `scrollTrigger: { scrub: true }` sigue sirviendo. **Eso captura también los disparadores de la página, sin aviso:** los que sigan a la ventana llevan `scroller: window`. Ver [`cmb-contenedor`](../04-combinaciones/cmb-contenedor.md).

```js fragmento
const mov = iniciarMovimiento({ perfil: "gsap+lenis", gsap, ScrollTrigger, Lenis, raiz: "#panel", content: "#panel-interior" });
ScrollTrigger.create({ scroller: window, trigger: "#marca", start: "top center", toggleClass: "on" });
```

**ScrollSmoother no admite contenedor.** Con `gsap-smoother`, `raiz` y `content` son su `wrapper` y su `content`, y el scroll es el de la ventana.

## API

| Miembro | Qué hace |
|---|---|
| `perfil`, `raiz` | Los del arranque. `raiz` es `window` o el contenedor |
| `lenis`, `smoother` | Instancia o `null`. Son *getters*: el movimiento reducido recrea ScrollSmoother |
| `ctx` | Un `gsap.context`, o algo con `add` y `revert` si no hay GSAP. `salir` lo revierte |
| `reducido` | La decisión de movimiento reducido |
| `añadir(fn, { persistente, ambito })` | Ejecuta `fn({ perfil, reducido, lenis, smoother, raiz, ctx })`, que puede devolver su limpieza. Devuelve cómo retirarla |
| `actualizar()` | `ScrollTrigger.refresh()` y después `lenis.resize()`, según el perfil |
| `navegar(destino, { cambiar, montar })` | Coloca al cambiar de vista. Promesa de `true`, o `false` si otra la adelantó |
| `bloquear()`, `desbloquear()` | Acumulativos: varios modales, un solo fondo |
| `irA(destino, opts)` | Número, selector o elemento. `{ inmediato, duracion, desplazamiento, forzar, alTerminar }`. `false` si no se movió. Con ScrollSmoother, la rueda, el toque o una tecla de scroll fuera de un campo lo interrumpen, y entonces `alTerminar` no se llama |
| `posicion()` | Posición de scroll, en todos los perfiles |
| `fijarReducido(v)` | Interruptor propio: `true`, `false`, o `null` para volver al sistema. Conserva la posición |
| `salir()` | Revierte y destruye. Se puede volver a llamar a `iniciarMovimiento` |

`opciones`: `lenis`, `smoother`, `reducido` (fija la decisión al arrancar), `alAvisar` (por defecto, `console.warn`).

En `opciones.lenis`, `anchors` es `true` si no se indica, y acepta `false` o un objeto. `autoRaf` lo decide el perfil: `gsap+lenis` lo ignora, con aviso si es `true`. En `lenis` vale `autoRaf: false` para un motor propio: su bucle llama a `mov.lenis.raf(t)`, como pide `lenis:int-canvas-webgl`, y es el único reloj.

## Anclas

El dueño es el de [`orq-propiedad`](../02-reglas/orq-propiedad.md), sin que la aplicación haga nada:

| Perfil | Enlace `#id` de la página |
|---|---|
| `ninguno`, `gsap` sin `ScrollToPlugin` | Navegador |
| `gsap` con `ScrollToPlugin`, `gsap-smoother` | La plantilla lo intercepta y llama a `irA`, y conserva la dirección con `history.pushState` |
| `lenis`, `gsap+lenis` | `anchors: true` de Lenis |

No se interceptan los enlaces a otra página, los que abren otra pestaña, los pulsados con una tecla modificadora, ni los que no tienen destino. En un contenedor, solo los que apuntan a algo dentro de él. `salir` retira el oyente.

Un ancla interceptada deja el foco como el navegador: el destino lo recibe sin saltar, con `tabindex="-1"` temporal si hace falta, y el siguiente Tab sigue desde ahí. Con teclado, algunos navegadores pintan el contorno de foco en el destino: si no lo quieres, `[tabindex="-1"]:focus { outline: none; }`.

Tras cambiar de ruta, `añadir` y `navegar` están explicados en [`orq-navegacion`](../03-ciclo/orq-navegacion.md), y el movimiento reducido, en [`orq-reducido`](../03-ciclo/orq-reducido.md).

## Contradicciones en ejecución

Al arrancar, tras cada `añadir` y en cada `actualizar` y `navegar`, comprueba lo siguiente, y avisa con el id de la regla en [`datos/reglas.json`](../datos/reglas.json):

| Detecta | Qué hace |
|---|---|
| ScrollSmoother activo con otro perfil, u otro ScrollSmoother | Avisa |
| Lenis activo en la ventana con un perfil sin Lenis | Avisa |
| Dos arranques sobre la misma raíz | Avisa y retira el anterior |
| Una instancia de Lenis ajena sobre la misma raíz | Avisa |
| `autoRaf` con `gsap+lenis`, al arrancar o activado después | Avisa, y al arrancar lo ignora |
| `ScrollTrigger.normalizeScroll` activo con Lenis | Avisa |
| `scroll-snap-type: mandatory` en la raíz de Lenis | Avisa |

## Copiar a un proyecto

Copia `orquestador.js` o `globales/orquestador.js`: no depende de nada más. Declara el perfil en un archivo `movimiento.perfil` en la raíz del proyecto, con una palabra, y [`herramientas/auditar_proyecto.py`](../herramientas/auditar_proyecto.py) lo comparará con lo que el código hace de verdad.

Para regenerar la copia global, desde `herramientas/`: `python3 plantillas_globales.py`. Para probarla: `python3 plantillas_globales.py --probar`.

## Lo que no hace

- Shadow DOM: `lenis.css` no cruza la sombra. Usa `iniciarScroll` de `lenis-knowledge`.
- `gsap.ticker.lagSmoothing`: es global y no tiene *getter*, y no lo toca.
- Modo horizontal: `irA` y `posicion` son verticales.
- Foco tras `navegar`: es de la aplicación, porque solo ella sabe qué título o región recibe el foco al cambiar de vista.
