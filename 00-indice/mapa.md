# Mapa

GENERADO por `herramientas/generar_indices.py`.

## 01-decidir

- [`orq-perfiles`](../01-decidir/orq-perfiles.md) — Qué incluye cada perfil, cuánto pesa, cómo arranca, qué fichas aplican y qué deja de existir, para fijar uno y no salir de él.
- [`orq-por-tarea`](../01-decidir/orq-por-tarea.md) — Cada necesidad habitual, cómo se resuelve con lo mínimo, si exige GSAP, qué pide al scroll y qué fichas leer. Tabla generada desde datos/necesidades.json.
- [`orq-que-usar`](../01-decidir/orq-que-usar.md) — Dos preguntas independientes, qué anima y quién lleva el scroll, dan uno de cinco perfiles. Por defecto, lo mínimo que resuelve el encargo. Un proyecto, un perfil.

## 02-reglas

- [`orq-anulaciones`](../02-reglas/orq-anulaciones.md) — Ficha por ficha, qué dicen gsap-knowledge y lenis-knowledge, qué hacer en cada perfil y por qué, y cómo se resuelven con evidencia las contradicciones entre las dos bases.
- [`orq-propiedad`](../02-reglas/orq-propiedad.md) — Quién manda en reloj, posición, suavizado, medición, scroll programático, snap, bloqueo, anclas, velocidad, movimiento reducido y limpieza, en cada perfil, sin alternativas.

## 03-ciclo

- [`orq-ciclo`](../03-ciclo/orq-ciclo.md) — Secuencia exacta para iniciar, volver a medir y retirar cada perfil, qué inversión falla de verdad y cuáles dan igual, ejecutado con ambas bibliotecas.
- [`orq-navegacion`](../03-ciclo/orq-navegacion.md) — colocar de Lenis combinado con ScrollTrigger: revertir, sustituir, colocar arriba, montar, medir y colocar. Qué falla en cada otro orden y qué aporta clearScrollMemory.
- [`orq-reducido`](../03-ciclo/orq-reducido.md) — Una decisión única de movimiento reducido, que Lenis, ScrollSmoother, GSAP y CSS siguen a la vez, también si cambia en vivo o con un interruptor propio.

## 04-combinaciones

- [`cmb-anclas`](../04-combinaciones/cmb-anclas.md) — anchors de Lenis llega bien con pines por encima, también en plena inercia. Un ancla al elemento fijado no va a start: apunta al espaciador o usa st.start.
- [`cmb-contenedor`](../04-combinaciones/cmb-contenedor.md) — Sin scroller, ScrollTrigger mira la ventana y no avanza. Con scroller o defaults funciona sin scrollerProxy. ScrollSmoother no vale para contenedores.
- [`cmb-css`](../04-combinaciones/cmb-css.md) — scroll-behavior smooth no estorba a la combinación. overflow-x hidden en html y body rompe sticky; usa clip. html y body con overflow hidden no bloquean si hay Lenis.
- [`cmb-flip-split`](../04-combinaciones/cmb-flip-split.md) — Flip deja el layout final solo al terminar: refresh en onComplete, no al lanzarlo. SplitText con autoSplit no duplica instancias y Lenis recoge el nuevo alto.
- [`cmb-gestos`](../04-combinaciones/cmb-gestos.md) — Con ratón y con toque nativo, sin conflicto. Con syncTouch, Lenis roba el arrastre a Draggable salvo con data-lenis-prevent-touch. Inertia y autoScroll conviven.
- [`cmb-horizontal`](../04-combinaciones/cmb-horizontal.md) — Hay dos horizontales. Pista con pin y containerAnimation sobre Lenis vertical funciona igual. Lenis con orientation horizontal exige horizontal true en ScrollTrigger.
- [`cmb-infinito`](../04-combinaciones/cmb-infinito.md) — infinite salta de limit a 0: scrub true salta con él y un scrub numérico rebobina toda la animación. getVelocity da picos de 64000 px/s: aquí manda lenis.velocity.
- [`cmb-medidas`](../04-combinaciones/cmb-medidas.md) — refresh primero y resize después, porque refresh cambia el alto de los pines. Lo seguro es colgar lenis.resize del evento refresh. En plena inercia ninguno de los dos corta nada.
- [`cmb-modal`](../04-combinaciones/cmb-modal.md) — lenis.stop() bloquea y ScrollTrigger sigue bien en ventana. En contenedor con overflow en hoja lleva scrollTop a 0, y scrub y pin saltan. Observer no se entera.
- [`cmb-normalize`](../04-combinaciones/cmb-normalize.md) — Prohibido. Con rueda parece inocuo, pero mueve la página con lenis.stop() activo, roba la rueda de data-lenis-prevent y altera el toque. Sin normalizeScroll, el pin ya no tiembla.
- [`cmb-observer`](../04-combinaciones/cmb-observer.md) — preventDefault de Observer no detiene a Lenis, que ignora defaultPrevented. Para paginar con gestos, lenis.stop() y lenis.scrollTo con force; en contenedor, además, la regla de overflow.
- [`cmb-pin`](../04-combinaciones/cmb-pin.md) — pin funciona sin scrollerProxy ni anticipatePin si ScrollTrigger.update va en el scroll de Lenis. Sin él, en contenedor el elemento fijado deriva 110 px en cada fotograma.
- [`cmb-reducido`](../04-combinaciones/cmb-reducido.md) — Una decisión. gsap.matchMedia gobierna las animaciones; Lenis sigue viva sin smoothWheel, y sus scrollTo saltan. respectReducedMotion false y ScrollToPlugin contradicen la preferencia.
- [`cmb-reloj`](../04-combinaciones/cmb-reloj.md) — gsap.ticker da el tiempo a Lenis, ScrollTrigger.update va en el evento scroll y lagSmoothing se deja por defecto. Dos relojes con origen lejano dejan la página clavada.
- [`cmb-salida`](../04-combinaciones/cmb-salida.md) — El orden entre ctx.revert y lenis.destroy da igual. Lo que rompe es no quitar paso del ticker, porque la página sigue moviéndose, y crear dos instancias sobre la misma raíz.
- [`cmb-scroll-programatico`](../04-combinaciones/cmb-scroll-programatico.md) — Solo lenis.scrollTo sobrevive a la inercia. ScrollToPlugin, tweenTo, st.scroll y window.scrollTo se pierden en plena animación y solo funcionan en reposo.
- [`cmb-scrub`](../04-combinaciones/cmb-scrub.md) — scrub true sigue a Lenis sin retraso. scrub numérico suaviza por segunda vez, 285 ms de cola y 540 px de retraso con scrub 1. Es un efecto, no un arreglo.
- [`cmb-smoother`](../04-combinaciones/cmb-smoother.md) — Juntos, prohibido: dos suavizados. Separados, ScrollSmoother gana si deben suavizarse teclado y barra y se usa data-speed; Lenis, con sticky, fixed, contenedor o coste bajo.
- [`cmb-snap`](../04-combinaciones/cmb-snap.md) — lenis/snap es el dueño. El snap de ScrollTrigger cambia de destino según lerp o duration sin delay propio, los dos juntos pelean, CSS mandatory pierde la animación.
- [`cmb-velocidad`](../04-combinaciones/cmb-velocidad.md) — self.getVelocity() da píxeles por segundo y no depende de los fotogramas; lenis.velocity da píxeles por llamada a raf. La dirección coincide. Con infinite, al revés.
