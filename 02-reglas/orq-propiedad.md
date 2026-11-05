---
id: orq-propiedad
titulo: Un solo dueño por responsabilidad
capa: 02-reglas
tipo: regla
perfiles: [ninguno, gsap, gsap-smoother, lenis, gsap+lenis]
resumen: Quién manda en reloj, posición, suavizado, medición, scroll programático, snap, bloqueo, anclas, velocidad, movimiento reducido y limpieza, en cada perfil, sin alternativas.
relacionadas: [orq-anulaciones, cmb-reloj, cmb-pin, cmb-scrub, cmb-scroll-programatico, cmb-snap, cmb-modal, cmb-observer, cmb-contenedor, cmb-horizontal, cmb-medidas, cmb-smoother, cmb-normalize, cmb-velocidad, cmb-anclas, cmb-reducido, cmb-salida, cmb-css]
fuentes:
  - gsap:nuc-ticker
  - gsap:scr-smoother
  - gsap:scr-scrollto
  - gsap:scr-snap
  - lenis:int-gsap
  - lenis:cal-conflictos
  - lenis:com-stop-start
  - lab:conflictos-lab
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Un solo dueño por responsabilidad

Cada fila tiene **un** dueño por perfil. Si una ficha de las bases propone otra cosa, gana esta tabla: ver [`orq-anulaciones`](orq-anulaciones.md). Lo demostrado está en la ficha enlazada; las reglas `O..` están en `datos/reglas.json`.

## Tabla

| Responsabilidad | `ninguno` | `gsap` | `gsap-smoother` | `lenis` | `gsap+lenis` |
|---|---|---|---|---|---|
| **Reloj** | `requestAnimationFrame` | `gsap.ticker` | `gsap.ticker` | `autoRaf: true`; con motor propio, su bucle llama a `lenis.raf(t)` y `autoRaf: false` | `gsap.ticker` llama a `lenis.raf(time * 1000)`; `autoRaf` apagado |
| **Posición de scroll** | Navegador | Navegador | Navegador; ScrollSmoother traslada el contenido | Lenis | Lenis |
| **Suavizado** | Ninguno | Ninguno; `scrub` numérico solo anima | ScrollSmoother | Lenis | Lenis; `scrub: true` |
| **Medición y refresh** | Navegador | `ScrollTrigger.refresh()` | `ScrollTrigger.refresh()` | `lenis.resize()` | `ScrollTrigger.refresh()`; `lenis.resize()` colgado de su evento `refresh` |
| **Scroll programático** | `window.scrollTo` | `ScrollToPlugin` | `smoother.scrollTo()` | `lenis.scrollTo()` | `lenis.scrollTo()` |
| **Snap** | CSS `scroll-snap` | `snap` de ScrollTrigger | `snap` de ScrollTrigger | `lenis/snap` | `lenis/snap` |
| **Bloqueo** | `<dialog>` y `overflow` en `html` | `<dialog>` y `overflow` en `html` | `smoother.paused(true)` | `lenis.stop()` | `lenis.stop()` |
| **Anclas** | Navegador | `ScrollToPlugin`; sin él, navegador | `smoother.scrollTo()` | `anchors: true` | `anchors: true` |
| **Velocidad** | Sin dueño: cálculo propio | `self.getVelocity()` | `smoother.getVelocity()` | `lenis.velocity`, normalizada | `self.getVelocity()`; con `infinite`, `lenis.velocity` |
| **Movimiento reducido** | `mov.reducido` | `mov.reducido` | `mov.reducido`, con `smooth: 0` | `mov.reducido`, con `smoothWheel: false` | `mov.reducido`, con `smoothWheel: false`; `respectReducedMotion` activo |
| **Limpieza** | La vista | `ctx.revert()` | `ctx.revert()` y `smoother.kill()` | `lenis.destroy()` | `ctx.revert()`, quitar `paso` del ticker, `lenis.destroy()` |

En la fila de anclas, `plantillas/orquestador.js` lo aplica sola: activa `anchors` y, en `gsap-smoother` y en `gsap` con `ScrollToPlugin`, pasa los enlaces `#id` por `irA`. Ver [`cmb-anclas`](../04-combinaciones/cmb-anclas.md).

`mov.reducido` es la decisión única de `plantillas/orquestador.js`: un `gsap.matchMedia` propio no ve el interruptor de la interfaz. Sin plantilla: [`cmb-reducido`](../04-combinaciones/cmb-reducido.md).

## Lo prohibido en `gsap+lenis`

| Prohibido | Por qué, medido | Regla |
|---|---|---|
| `autoRaf` y `gsap.ticker` a la vez | Con GSAP cargado 125 s después: `NaN`, página clavada en 0 | O01, [`cmb-reloj`](../04-combinaciones/cmb-reloj.md) |
| Sin `lenis.on("scroll", ScrollTrigger.update)` | `scrub` hasta 145 px por detrás; pin en contenedor, 110 px | O04, [`cmb-pin`](../04-combinaciones/cmb-pin.md) |
| ScrollSmoother | Dos suavizados: 64 fotogramas frente a 46 | O03, [`cmb-smoother`](../04-combinaciones/cmb-smoother.md) |
| `normalizeScroll` | Mueve la página con `lenis.stop()`: 600 | O07, [`cmb-normalize`](../04-combinaciones/cmb-normalize.md) |
| `ScrollToPlugin`, `tweenTo`, `st.scroll()`, `window.scrollTo` | En plena inercia se pierden: 2500 y no 300 | O08, [`cmb-scroll-programatico`](../04-combinaciones/cmb-scroll-programatico.md) |
| `snap` de ScrollTrigger junto a `lenis/snap` | Pelean: 3,5 s y otro destino | O10, [`cmb-snap`](../04-combinaciones/cmb-snap.md) |
| `scroll-snap-type: mandatory` | Salto sin animación: 5 pasos | O11, [`cmb-snap`](../04-combinaciones/cmb-snap.md) |
| Dos instancias en la misma raíz | `stop()` en una no bloquea | O02, [`cmb-salida`](../04-combinaciones/cmb-salida.md) |
| `scrub` numérico con `infinite` | Rebobina 33 fotogramas en cada vuelta | O21, [`cmb-infinito`](../04-combinaciones/cmb-infinito.md) |
| `respectReducedMotion: false` | Lenis sigue animando con `reduce` | O24, [`cmb-reducido`](../04-combinaciones/cmb-reducido.md) |

## Excepciones cerradas

Solo estas. Cualquier otra desviación es un error.

| Excepción | Condición | Ficha |
|---|---|---|
| `lagSmoothing(0)` en `gsap+lenis` | El proyecto sigue un tiempo real, como audio o vídeo. Por defecto no se llama | [`cmb-reloj`](../04-combinaciones/cmb-reloj.md) |
| `scrub` numérico | Efecto deliberado en un elemento, hasta `0.3`, sin `infinite` | [`cmb-scrub`](../04-combinaciones/cmb-scrub.md) |
| `snap` de ScrollTrigger en `gsap+lenis` | Sin `lenis/snap`, con `delay` de 0.3 o más | [`cmb-snap`](../04-combinaciones/cmb-snap.md) |
| `ScrollToPlugin` en `gsap+lenis` | Sobre un área con `data-lenis-prevent`, que no es el scroll de Lenis | [`cmb-gestos`](../04-combinaciones/cmb-gestos.md) |

## En un contenedor

Solo `gsap`, `lenis` y `gsap+lenis`: ScrollSmoother no admite contenedores. La tabla no cambia, con tres añadidos para `gsap+lenis`: `scroller` en cada ScrollTrigger que siga al contenedor (O12, aviso: uno que siga a la ventana no lo lleva), `orientation` y `horizontal: true` van juntos (O17), y `stop()` exige que el contenedor conserve el scroll (O13). Ver [`cmb-contenedor`](../04-combinaciones/cmb-contenedor.md).

## Elegir entre `gsap-smoother` y `gsap+lenis`

Sin preferencia previa: [`cmb-smoother`](../04-combinaciones/cmb-smoother.md). ScrollSmoother gana si el proyecto ya usa GSAP, es vertical en ventana, no tiene `sticky` ni `fixed` en el contenido, y además importa suavizar teclado y barra, usar `data-speed` o `data-lag`, o que terceros escriban el scroll. En cualquier otro caso, Lenis.

## Comprobar en ejecución

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const sincronizar = () => lenis.resize();
ScrollTrigger.addEventListener("refresh", sincronizar);
const ctx = gsap.context(() => {
  gsap.to(".pieza", { x: 100, ease: "none", scrollTrigger: { start: 0, end: 1000, scrub: true } });
});
await espera(40);
lenis.scrollTo(500, { duration: 0.2 });
await espera(500);
const x = Math.round(gsap.getProperty(".pieza", "x"));
const reloj = lenis.options.autoRaf;

ctx.revert();
ScrollTrigger.removeEventListener("refresh", sincronizar);
gsap.ticker.remove(paso);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: x === 50 && !reloj
```
