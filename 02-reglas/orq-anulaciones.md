---
id: orq-anulaciones
titulo: Qué cambia de cada ficha de las bases según el perfil
capa: 02-reglas
tipo: regla
perfiles: [gsap, gsap-smoother, lenis, gsap+lenis]
resumen: Ficha por ficha, qué dicen gsap-knowledge y lenis-knowledge, qué hacer en cada perfil y por qué, y cómo se resuelven con evidencia las contradicciones entre las dos bases.
relacionadas: [orq-propiedad, cmb-reloj, cmb-scroll-programatico, cmb-snap, cmb-normalize, cmb-smoother, cmb-reducido, cmb-css]
fuentes:
  - gsap:scr-normalize
  - gsap:scr-scrollto
  - gsap:scr-snap
  - gsap:nuc-ticker
  - lenis:int-gsap
  - lenis:cal-conflictos
  - lab:conflictos-lab
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Qué cambia de cada ficha según el perfil

`gsap-knowledge` no conoce Lenis, y `lenis-knowledge` trata GSAP como un cliente más. Esta tabla dice qué sigue valiendo. "Igual" significa que la ficha se aplica tal cual. Si la ficha o la plantilla no aparece, se aplica tal cual en sus perfiles. Las bases no se modifican.

## Contradicciones entre las dos bases

| Tema | `gsap-knowledge` | `lenis-knowledge` | Resolución con evidencia | Ficha |
|---|---|---|---|---|
| `lagSmoothing` | Por defecto; `0` para audio y vídeo, "típico con librerías de scroll" | `int-gsap`: lo incluye en la receta y en `relojGsap` | **Por defecto.** Bajo 500 ms no cambia nada; por encima, `0` da saltos de 897-3242 px, y la sincronía es la misma | [`cmb-reloj`](../04-combinaciones/cmb-reloj.md) |
| Ajuste | `scr-snap`, y `scr-smoother` propone CSS | `snp-snap`: `lenis/snap` | **`lenis/snap`.** El `snap` de ScrollTrigger cambia de destino entre `lerp` y `duration` y tarda el doble | [`cmb-snap`](../04-combinaciones/cmb-snap.md) |
| Scroll programático | `ScrollToPlugin` | `lenis.scrollTo`, y `cal-conflictos` avisa | **`lenis.scrollTo`.** Las demás se pierden en inercia en los cuatro cruces | [`cmb-scroll-programatico`](../04-combinaciones/cmb-scroll-programatico.md) |
| Anclas | `ScrollToPlugin` con `offsetY` | `anchors` | **`anchors`.** Llega con pines y en inercia | [`cmb-anclas`](../04-combinaciones/cmb-anclas.md) |
| `normalizeScroll` | Recomendado para pines que tiemblan | "Sin conflicto con rueda; innecesario" | **Prohibido.** Las dos se quedan cortas: burla `stop()` y roba `data-lenis-prevent` | [`cmb-normalize`](../04-combinaciones/cmb-normalize.md) |
| `scroll-behavior: smooth` | "Quítalo" | "Sin conflicto, déjalo o quítalo" | **Lenis tiene razón en este perfil.** Rueda, `scrollTo` y `refresh` en inercia, bien | [`cmb-css`](../04-combinaciones/cmb-css.md) |
| Suavidad de `scrub` | Numérico como acabado | "El retardo es el que pides" | **`scrub: true`.** El numérico se suma: 285 ms y 543 px con `1` | [`cmb-scrub`](../04-combinaciones/cmb-scrub.md) |
| Movimiento reducido | `gsap.matchMedia`, y `smooth: 0` | `respectReducedMotion`, "1:1" | **Una decisión:** `mov.reducido`, y `smoothWheel: false`. El 1:1 de Lenis son 8 pasos | [`cmb-reducido`](../04-combinaciones/cmb-reducido.md) |
| Velocidad | `getVelocity()` | `lenis.velocity` | **`getVelocity()`**, salvo con `infinite` | [`cmb-velocidad`](../04-combinaciones/cmb-velocidad.md) |
| Bloqueo por gestos | `preventDefault` y `overflow: hidden` | `stop()` | **`stop()`.** Lenis ignora `preventDefault` | [`cmb-observer`](../04-combinaciones/cmb-observer.md) |

## Afirmaciones que el laboratorio corrige

| Ficha | Dice | Medido |
|---|---|---|
| `lenis:int-gsap` | Sin `update`, ScrollTrigger va un fotograma por detrás | En lo pintado, también con `autoRaf`: 143 px y, en pin de contenedor, 110 px en todos los fotogramas |
| `lenis:int-gsap` | `scroller` en contenedor, [P] | Ejecutado: confirmado |
| `lenis:int-gsap` | `colocar` y después `refresh` | Gasta un `once` con el scroll viejo, y deja el destino 3000 px antes si `refresh` cambia el alto: [`orq-navegacion`](../03-ciclo/orq-navegacion.md) |
| `gsap:scr-observer` | La receta suelta el guardián al terminar la animación | Una ráfaga de trackpad salta 2 pantallas, y 5 con `duration: 0`: el movimiento reducido mueve más. En `onStop`, 1 |
| `lenis:cal-conflictos` | `normalizeScroll`: sin conflicto con rueda | Solo en rueda libre; táctil, ya probado |
| `gsap:scr-scrollto` | Con `scroll-behavior: smooth` en `html`, la página no llega | Chrome 156: llegó, en 67 pasos y más lento, con y sin Lenis |
| `gsap:scr-instancia` | `getVelocity()` es la velocidad del scroll | Es una media con ventana: hasta 1,5 veces la real en plena frenada, con y sin Lenis |

## Plantillas de las bases

Una plantilla de `lenis-knowledge` que recibe `lenis` no crea nada; sin él, crea **una segunda instancia con otro reloj**, y eso es O02 y O01. Si la plantilla no aparece aquí, se aplica tal cual en sus perfiles.

| Plantilla | `gsap` | `lenis` | `gsap+lenis` | Por qué |
|---|---|---|---|---|
| `lenis:barraProgreso`, `botonArriba`, `menuAnclas`, `navDireccion`, `parallax`, `sincronizarCanvas`, `scrollHorizontal`, `seccionesSnap` | No aplica | **Con `{ lenis: mov.lenis }`** | **Con `{ lenis: mov.lenis }`** | O02, O01 |
| `lenis:bloqueoModal` | No aplica | **Con `{ lenis: mov.lenis }`**, o solo `mov.bloquear` | Igual | Un solo contador de bloqueos |
| `lenis:iniciarScroll` | No aplica | No usar: `iniciarMovimiento`. Solo en Shadow DOM | **No usar** | Por defecto activa `autoRaf`; `relojGsap` lleva `lagSmoothing(0)`: O01, O06 |
| `lenis:navegacionScroll` | No aplica | Con `{ lenis: mov.lenis }` | **No usar:** `mov.navegar` | Otro orden: [`orq-navegacion`](../03-ciclo/orq-navegacion.md) |
| `gsap:transicionPaginas` | Igual | No aplica | **No usar:** timeline y `mov.navegar` | `window.scrollTo`: O08 |
| `gsap:pinHorizontal` | Igual | No aplica | Con `suavizado: true` y sin `ajustar` | Por defecto `scrub: 1`: O16. `ajustar` es `snap` de ScrollTrigger: O09, O10 |
| `gsap:secuenciaImagenes`, `gsap:parallax` | Igual | No aplica | Con `suavizado: true` | `scrub` numérico por encima de 0.3: O16 |

En `gsap-smoother`, las plantillas de GSAP se aplican tal cual, salvo `transicionPaginas`: usa `mov.navegar`.

Las plantillas de GSAP y `lenis:parallax`, `scrollHorizontal` y `seccionesSnap` leen `prefers-reduced-motion` por su cuenta. Solo importa si hay interruptor propio: con `mov.fijarReducido`, no lo verán, y hay que recrearlas dentro de `mov.añadir`.

## `gsap-knowledge`: scroll

| Ficha | Qué dice | `gsap` | `gsap-smoother` | `gsap+lenis` | Por qué |
|---|---|---|---|---|---|
| `scr-scrolltrigger` | Quita `scroll-behavior: smooth` | Igual | Lo anula él | No hace falta | Lenis escribe `instant` |
| `scr-start-end` | Medidas, `clamp`, `max` | Igual | Igual | Igual, con `scroller` en contenedor | O12 |
| `scr-toggle` | Callbacks y `toggleActions` | Igual | Igual | Igual; con `infinite` no se disparan `onLeave` | [`cmb-infinito`](../04-combinaciones/cmb-infinito.md) |
| `scr-scrub` | `scrub` numérico suaviza | Igual | Igual, suma a `smooth` | `scrub: true`, numérico solo como efecto | O16 |
| `scr-pin` | `anticipatePin`, `normalizeScroll` o ScrollSmoother contra tirones | Igual | Pin por `transform` | Ninguno de los tres: deriva 0 con `update` | O04, O07, O03 |
| `scr-snap` | `snap` en ScrollTrigger | Igual | Igual | `lenis/snap`; `snap` solo con `delay` de 0.3 | O09, O10 |
| `scr-refresh` | `refresh()` tras cambios | Igual | Igual | `refresh()`, y `resize()` en su evento | O18 |
| `scr-estaticos` | `killAll` borra oyentes; `ignoreMobileResize` | Igual | Igual | Igual, y `killAll` se lleva el oyente de `resize` | [`cmb-medidas`](../04-combinaciones/cmb-medidas.md) |
| `scr-instancia` | `tweenTo`, `scroll()` | Igual | `smoother.scrollTo` | **No usar.** `lenis.scrollTo(st.start)` | O08 |
| `scr-scrollto` | `ScrollToPlugin`, anclas por plugin, `autoKill` | Igual; en `reduce`, `duration: 0` | `smoother.scrollTo` | **No usar** sobre el scroll de Lenis, tampoco con `autoKill`; vale en áreas interiores | O08, O25 |
| `scr-normalize` | Para pines, barra y iOS | Igual, con `allowNestedScroll` si hay contenedores | Opción `normalizeScroll` | **Prohibido** | O07 |
| `scr-scrollerproxy` | Para bibliotecas de scroll simulado | No aplica | No aplica | **Innecesario** | O30 |
| `scr-smoother`, `scr-smoother-api`, `scr-smoother-efectos` | Suavizado y efectos | No aplica | Igual | **Prohibido** | O03 |
| `scr-observer`, `scr-observer-api` | `preventDefault: true` frena el scroll; receta de paginación | Igual, soltando el guardián en `onStop` | Igual, ídem | Además `lenis.stop()`; `disable()` con modal; ídem | O14, O15 |
| `scr-horizontal` | `containerAnimation`, y `scrub: 1` en sus ejemplos | Igual | Igual | Igual sobre Lenis vertical, con `scrub: true`. Con `orientation`, `horizontal: true` | O16, O17 |
| `scr-batch` | Lotes | Igual | Igual | Igual, sin ejecutar con Lenis [P] | Solo lee el scroll |

## `gsap-knowledge`: otras fichas que tocan el scroll

| Ficha | Qué dice | `gsap` | `gsap-smoother` | `gsap+lenis` | Por qué |
|---|---|---|---|---|---|
| `nuc-ticker` | `lagSmoothing` por defecto; oyentes permanentes | Igual | Igual | Se mantiene por defecto. El oyente permanente es aceptable: 0,003 ms en reposo | O06 |
| `nuc-defaults-config` | `autoSleep` | Igual | Igual | Con `paso` no duerme | [`cmb-reloj`](../04-combinaciones/cmb-reloj.md) |
| `nuc-context`, `nuc-limpieza` | `ctx.revert()` | Igual | Igual, y `kill()` | Igual, y `ticker.remove`, `destroy` | O22 |
| `cal-accesibilidad`, `nuc-matchmedia` | `gsap.matchMedia` | Igual; con la plantilla, `reducido` en `mov.añadir` | Igual, y `smooth: 0` | Igual, y `smoothWheel: false` | O24 |
| `int-draggable`, `int-inertia` | Arrastre e inercia | Igual | Igual: arrastre exacto. Una rueda a mitad deja la pieza 60 px separada del puntero | Igual; con `syncTouch`, atributo | O23 |
| `int-flip` | Flip | `refresh` en `onComplete` | Igual | Igual | O28 |
| `txt-splittext` | `autoSplit` | Igual | Sin ejecutar [P] | Igual | [`cmb-flip-split`](../04-combinaciones/cmb-flip-split.md) |
| `rec-transicion-paginas` | `window.scrollTo(0, 0)` y `refresh` | Igual | `smoother.scrollTo(0)`, sin animar | `mov.navegar`: [`orq-navegacion`](../03-ciclo/orq-navegacion.md) | O08 |
| `rec-pin-horizontal` | Pista con pin | Igual | Igual | Igual, con `scrub: true`: con `1`, 239 px y 267 ms de retraso | O16, [`cmb-horizontal`](../04-combinaciones/cmb-horizontal.md) |
| `rec-parallax`, `rec-revelar-scroll`, `rec-secuencia-imagenes` | `scrub` y lectura | Igual | `data-speed` para parallax | Igual; `scrub: true`; en sus pruebas usan `window.scrollTo`, que aquí sería `lenis.scrollTo` | O08 |

## `lenis-knowledge`: integración

| Ficha | Qué dice | `lenis` | `gsap+lenis` | `gsap` y `gsap-smoother` | Por qué |
|---|---|---|---|---|---|
| `int-gsap` | Reloj con `lagSmoothing(0)`; `relojGsap` | Igual, sin GSAP no aplica | **Sin `lagSmoothing(0)`.** Lo demás, igual | No aplica | O06 |
| `int-gsap` | `resize` y `refresh`, "cada uno por su lado" | No aplica | **Un orden:** `refresh`, y `resize` en su evento | No aplica | O18 |
| `int-contrato` | `gsap.ticker` es el reloj; quitar el reloj y `destroy` | Igual | Igual, con `ctx.revert()` | No aplica | O22 |
| `int-navegacion`, `rec-navegacion` | `colocar(lenis)` | Igual | **Otro orden:** `colocar(0)`, crear, `refresh`, `resize`, `colocar(destino)`. `mov.navegar` lo hace | `window.scrollTo` y `refresh` | [`orq-navegacion`](../03-ciclo/orq-navegacion.md) |
| `int-canvas-webgl` | Motor como reloj; con GSAP, `gsap.ticker` | Con la plantilla, `autoRaf: false` en `opciones.lenis` y `mov.lenis.raf(t)` en el motor | Igual: `gsap.ticker` manda sobre el motor | No aplica | O01 |
| `int-react`, `int-vue-nuxt`, `int-nextjs`, `int-svelte`, `int-angular`, `int-webcomponents`, `int-vanilla` | Ciclo por tecnología y `autoRaf` | Igual | `autoRaf: false` y `relojGsap` sin `lagSmoothing(0)` | No aplica | O01, O06 |
| `int-webflow`, `int-wordpress` | Fragmento con `autoRaf` y `anchors` | Igual | `autoRaf` fuera si hay GSAP | No aplica | O01 |
| `int-typescript` | Tipos | Igual | Igual | No aplica | Sin relación |

## `lenis-knowledge`: comportamiento, ajuste y recetas

| Ficha | Qué dice | `lenis` | `gsap+lenis` | Por qué |
|---|---|---|---|---|
| `cal-conflictos` | Tabla de conflictos | Igual | `normalizeScroll` pasa de innecesario a prohibido; ScrollSmoother de [P] a demostrado | O07, O03 |
| `com-raf` | `autoRaf` o bucle propio | Igual | `gsap.ticker` | O01 |
| `com-dimensiones` | `lenis.resize()` tras cambios | Igual | En el evento `refresh` | O18 |
| `com-stop-start` | `stop()` y contenedor | Igual | Igual: además, ScrollTrigger lee el 0 y arrastra `scrub` y pin | O13 |
| `com-anclas`, `rec-menu-anclas` | `anchors` | Igual | Igual; a un elemento fijado, no | O29 |
| `com-horizontal`, `rec-horizontal` | `orientation`, y `sticky` con `transform` | Igual | Igual, con `horizontal: true`; o pista de GSAP | O17 |
| `com-infinito` | `infinite` | Igual | `scrub: true`; velocidad de Lenis | O21 |
| `com-sticky-fixed` | Funcionan sin adaptar | Igual | Igual, y `pin` también | [`cmb-pin`](../04-combinaciones/cmb-pin.md) |
| `snp-snap`, `snp-elementos`, `rec-secciones-snap` | `Snap` | Igual | Igual; con pines, posiciones de ScrollTrigger | O19 |
| `opc-automatico`, `cal-accesibilidad` | `respectReducedMotion` | Se mantiene, y `smoothWheel: false` | Se mantiene, y `smoothWheel: false` | O24 |
| `opc-tactil` | `syncTouch` | Igual | Igual; con Draggable, atributo | O23 |
| `rec-modal` | `stop()` y `data-lenis-prevent` | Igual | Igual, y `observer.disable()` | O15 |
| `rec-parallax` | Parallax con `lenis.on("scroll")` | Igual | `scrub: true`; una medida, de ScrollTrigger | [`cmb-scrub`](../04-combinaciones/cmb-scrub.md) |
| `rec-barra-progreso`, `rec-nav-direccion`, `rec-scroll-to-top`, `rec-canvas-sync` | Lectura de Lenis y `scrollTo` | Igual | Igual; sin ejecutar con GSAP [P]. Con GSAP, el dibujo va en el `ticker`, tras `paso` | O01 |
| `fun-cuando-usarlo` | Decidir Lenis | Igual | Ver `01-decidir` | Criterio |

## Perfil `gsap-smoother`

| Ficha | Qué dice | `gsap-smoother` | Por qué |
|---|---|---|---|
| `scr-smoother` | "Una instancia", `kill()` | Igual, y retira restos de Lenis: `html.lenis-stopped` bloquea | [`cmb-smoother`](../04-combinaciones/cmb-smoother.md) |
| `scr-smoother-api` | Para animar: `gsap.to(smoother, { scrollTop })` | **No lo hagas:** anima la ventana o usa `mov.irA`. La rueda siguiente deja el contenido parado | O33, [`cmb-smoother`](../04-combinaciones/cmb-smoother.md) |
| `lenis:*` | Cualquiera | No aplica | O03 |
