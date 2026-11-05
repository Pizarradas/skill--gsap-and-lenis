---
id: orq-reducido
titulo: Movimiento reducido con una sola fuente
capa: 03-ciclo
tipo: ciclo
perfiles: [ninguno, gsap, gsap-smoother, lenis, gsap+lenis]
resumen: Una decisión única de movimiento reducido, que Lenis, ScrollSmoother, GSAP y CSS siguen a la vez, también si cambia en vivo o con un interruptor propio.
relacionadas: [orq-ciclo, orq-navegacion, cmb-reducido]
fuentes:
  - gsap:cal-accesibilidad
  - gsap:nuc-matchmedia
  - gsap:scr-smoother
  - gsap:scr-smoother-api
  - lenis:cal-accesibilidad
  - lenis:opc-automatico
  - lab:orquestador-lab
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Movimiento reducido con una sola fuente

Cada biblioteca lee `prefers-reduced-motion` por su cuenta, y hacen cosas distintas con el dato. Con dos lectores, un interruptor propio de la interfaz solo llega a uno. La regla es una: **una sola decisión, y todos la siguen**. En `plantillas/orquestador.js` es `api.reducido`.

Laboratorio del 2026-11-05: Chrome 156, `prefers-reduced-motion` real con `Emulation.setEmulatedMedia`, rueda real. Firefox y Safari no se probaron con la preferencia real. Sin lector de pantalla.

## La decisión

```text
reducido = último de (opciones.reducido, fijarReducido) ?? prefers-reduced-motion
```

| Quién | Cómo la sigue |
|---|---|
| Lenis | `prefersReducedMotion` redefinido para leer la decisión; `smoothWheel` y `syncTouch` a `false` |
| ScrollSmoother | Se destruye y se recrea con `smooth: 0`, `effects: false` |
| ScrollToPlugin y `irA` | Salto sin animar en todos los perfiles |
| Animaciones | `añadir(fn)` recibe `reducido`; al cambiar, se revierte y se repite |
| CSS | `html[data-movimiento="reducido"]` |
| `lenis/snap` | No la sigue: `snap.stop()` dentro de `mov.añadir` si `reducido`. Salta de golpe: [`cmb-snap`](../04-combinaciones/cmb-snap.md) |

Si ya tienes `gsap.matchMedia()` con esa consulta en la aplicación, es un segundo lector: no verá el interruptor. Lee `reducido` en `añadir`, o llama a `gsap.matchMediaRefresh()` y lee ahí la misma decisión.

## Por qué no basta con dejar a cada una

**Lenis no ve un interruptor propio.** `respectReducedMotion` solo mira el sistema, y ponerlo en `false` es peor: Lenis deja de obedecer (O24). Con el sistema en `no-preference` y tu casilla marcada, anima:

```js
const lenis = new Lenis({ autoRaf: true, lerp: 0.1 });
let decision = true;                                 // la casilla de la interfaz
const antes = lenis.prefersReducedMotion;
lenis.scrollTo(900);
const sinSeguirla = window.scrollY;

lenis.scrollTo(0, { immediate: true });
Object.defineProperty(lenis, "prefersReducedMotion", { get: () => decision, configurable: true });
lenis.scrollTo(900);
const siguiendola = window.scrollY;
decision = false;
const vuelve = lenis.prefersReducedMotion;
lenis.destroy();
window.scrollTo(0, 0);
// prueba: antes === false && sinSeguirla < 900
// prueba: siguiendola === 900 && vuelve === false
```

`prefersReducedMotion` es pública y `scrollTo` la lee en cada llamada, con lo que cubre `anchors` y las llamadas directas a `lenis.scrollTo` del código de la aplicación. Si una versión la lee de otro modo, esta redefinición deja de surtir efecto: la prueba de la plantilla lo detecta.

**`respectReducedMotion` deja movimiento en la rueda.** Fuerza `lerp = 1`, que son unos 116 ms: 7 fotogramas. Ver [`lenis:cal-accesibilidad`](../lenis-knowledge/07-calidad/cal-accesibilidad.md). Con `smoothWheel: false` la rueda es nativa: 1 paso. Se lee en cada evento, así que cambia en vivo, y Lenis sigue emitiendo `scroll`.

```js
const lenis = new Lenis({ autoRaf: true, lerp: 0.1 });
lenis.options.smoothWheel = false;
let eventos = 0;
lenis.on("scroll", () => eventos++);
rueda(600);                            // sintética: sin scroll nativo que la siga
await espera(120);
const sinAnimar = window.scrollY;
lenis.options.smoothWheel = true;
rueda(600);
await espera(120);
const animando = window.scrollY;
lenis.destroy();
window.scrollTo(0, 0);
// prueba: sinAnimar === 0 && animando > 0
```

**`smooth(0)` no sirve en ScrollSmoother.** Deja `wrapper` en `position: fixed` y el contenido en `transform`: sigue siendo el camino suavizado, con duración cero. Hay que matarlo y crearlo con `smooth: 0`, que es el camino nativo. [C] [E]

```html
<div id="smooth-wrapper"><div id="smooth-content"><div style="height:3000px"></div></div></div>
```

```js
const envoltura = document.querySelector("#smooth-wrapper");
let s = ScrollSmoother.create({ smooth: 0.1 });
const conSuavizado = getComputedStyle(envoltura).position;
s.smooth(0);
const trasSmooth0 = getComputedStyle(envoltura).position;
s.kill();
s = ScrollSmoother.create({ smooth: 0 });
const recreado = getComputedStyle(envoltura).position;
s.kill();
// prueba: conSuavizado === "fixed" && trasSmooth0 === "fixed" && recreado === "relative"
```

Recrearlo obliga a repetir lo que dependa de él. `api.smoother` es por eso un *getter*: no lo guardes en una variable. `create` con el mismo `content` devuelve la instancia viva e ignora los `vars`: `kill()` va antes.

Los efectos también son movimiento: `effects: false` en la rama reducida. En laboratorio, `data-speed` desplazó 416 px en la rama normal y 0 en la reducida.

**Revertir antes de cambiar.** Una animación creada para la rama normal no se convierte sola. `aplicar` revierte las entradas, ajusta la biblioteca, repite las entradas y mide, en ese orden: al revés, los pines se crearían sobre el ScrollSmoother que va a morir.

## Medido, por perfil

Rueda real de 600, en vivo. "Pasos" son los fotogramas en que cambió la posición.

| Perfil | Normal: scroll / contenido | Reducido: scroll / contenido | `irA(destino, { duracion: 1 })`, normal / reducido | Ancla, reducido |
|---|---|---|---|---|
| `ninguno` | 1 / 1 | 1 / 1 | 44 / 0 | 1 |
| `gsap` | 1 / 1 | 1 / 1 | 56 / 1 | 1 |
| `gsap-smoother` | 1 / 41 | 1 / 1 | 56 / 1 | 1 |
| `lenis` | 51 / 51 | 1 / 1 | 53 / 0 | 1 |
| `gsap+lenis` | 51 / 51 | 1 / 1 | 53 / 0 | 1 |

Lo mismo arrancando con la preferencia activa, y cambiándola en vivo en los dos sentidos. Las entradas se repitieron una vez, con el valor nuevo, y `data-movimiento` siguió la decisión. Sin excepciones. Lenis siguió emitiendo `scroll`: 2 veces por rueda en reducido, 71 en normal. La rueda nativa da 1 paso porque el laboratorio entrega un único evento: en un dispositivo real son varios pasos del navegador.

`irA` da 0 pasos si el destino ya estaba alcanzado por el salto anterior, y 1 si salta.

## Quitar no es ocultar

En la rama reducida, el contenido que la animación revelaba debe quedar visible: ver [`gsap:cal-accesibilidad`](../gsap-knowledge/13-calidad/cal-accesibilidad.md). `añadir` da el valor; la decisión de qué se quita es de la aplicación.

## Trampas

- **El interruptor manda.** Con `fijarReducido(true)`, un cambio del sistema se ignora. `fijarReducido(null)` devuelve el mando al sistema. Guarda la elección antes de iniciar y pásala en `opciones.reducido`. [E, prueba de la plantilla]
- **`onStart` de Lenis.** En la rama reducida, `scrollTo` no lo llama. `irA` solo ofrece `alTerminar`, que se llama en todas las ramas. [C] [E]
- **Scroll nativo animado.** `irA` usa `behavior: "instant"`, pero un `scroll-behavior: smooth` tuyo en CSS sigue suavizando lo demás: quítalo con `html[data-movimiento="reducido"] { scroll-behavior: auto }`. [P]
