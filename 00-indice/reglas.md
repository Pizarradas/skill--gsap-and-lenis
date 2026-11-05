# Reglas

GENERADO desde `datos/reglas.json`, que es la fuente de verdad. **Bloqueante** está demostrado por ejecución; **aviso** merece revisión.

| Id | Severidad | Perfiles | Regla | Corrección | Evidencia |
|---|---|---|---|---|---|
| O01 | bloqueante | gsap+lenis | autoRaf y gsap.ticker a la vez | Quita autoRaf: true y deja gsap.ticker.add((t) => lenis.raf(t * 1000)). | [`cmb-reloj`](../04-combinaciones/cmb-reloj.md) |
| O02 | bloqueante | lenis, gsap+lenis | Dos instancias de Lenis sobre la misma raíz | Destruye la anterior antes de crear otra. Comprobación en ejecución: el análisis estático no distingue ventana de contenedor. | [`cmb-salida`](../04-combinaciones/cmb-salida.md) |
| O03 | bloqueante | gsap+lenis, gsap-smoother | ScrollSmoother y Lenis juntos | Elige uno con cmb-smoother y retira el otro, incluidas sus clases. | [`cmb-smoother`](../04-combinaciones/cmb-smoother.md) |
| O04 | bloqueante | gsap+lenis | Falta lenis.on('scroll', ScrollTrigger.update) | Añade lenis.on('scroll', ScrollTrigger.update) al crear la instancia. | [`cmb-reloj`](../04-combinaciones/cmb-reloj.md) |
| O05 | bloqueante | gsap+lenis | lenis.raf recibe segundos | Multiplica por 1000: lenis.raf(time * 1000). | [`cmb-reloj`](../04-combinaciones/cmb-reloj.md) |
| O06 | aviso | gsap+lenis | lagSmoothing(0) sin un tiempo real que seguir | Quítalo: tras un bloqueo largo salta. Solo se justifica con audio o vídeo; si lo usas, restaura 500, 33 al salir. | [`cmb-reloj`](../04-combinaciones/cmb-reloj.md) |
| O07 | bloqueante | gsap+lenis | normalizeScroll con Lenis | Quítalo. Si hace falta en móvil, usa otro perfil en esa vista. | [`cmb-normalize`](../04-combinaciones/cmb-normalize.md) |
| O08 | bloqueante | lenis, gsap+lenis | Mover el scroll sin pasar por Lenis | Usa lenis.scrollTo; toma el destino de st.start, st.end o labelToScroll. La detección no cubre st.scroll() ni window.scrollTo, que fallan igual. | [`cmb-scroll-programatico`](../04-combinaciones/cmb-scroll-programatico.md) |
| O09 | aviso | gsap+lenis | snap de ScrollTrigger con Lenis sin delay suficiente | Usa lenis/snap, o delay de 0.3 o más: sin él, el destino cambia entre lerp y duration. | [`cmb-snap`](../04-combinaciones/cmb-snap.md) |
| O10 | bloqueante | gsap+lenis | snap de ScrollTrigger y lenis/snap a la vez | Deja solo lenis/snap. | [`cmb-snap`](../04-combinaciones/cmb-snap.md) |
| O11 | bloqueante | lenis, gsap+lenis | CSS scroll-snap mandatory con Lenis | Quita scroll-snap-type y usa lenis/snap. | [`cmb-snap`](../04-combinaciones/cmb-snap.md) |
| O12 | aviso | gsap+lenis | ScrollTrigger sin scroller con Lenis en contenedor | Pasa scroller a cada instancia, o ScrollTrigger.defaults({ scroller }) antes de crearlas. | [`cmb-contenedor`](../04-combinaciones/cmb-contenedor.md) |
| O13 | bloqueante | lenis, gsap+lenis | lenis.stop() en contenedor con overflow en hoja | Mantén el contenedor con scroll: overflow hidden en línea, o .caja.lenis-stopped:not(.lenis-autoToggle) { overflow: hidden !important }. | [`cmb-modal`](../04-combinaciones/cmb-modal.md) |
| O14 | bloqueante | gsap+lenis | Observer con preventDefault no detiene a Lenis | Llama a lenis.stop() mientras Observer pagina, y mueve con lenis.scrollTo y force; o usa data-lenis-prevent en el área. | [`cmb-observer`](../04-combinaciones/cmb-observer.md) |
| O15 | aviso | gsap+lenis | Observer sigue activo con el modal abierto | observer.disable() al abrir y enable() al cerrar. | [`cmb-modal`](../04-combinaciones/cmb-modal.md) |
| O16 | aviso | gsap+lenis | scrub numérico alto sobre Lenis | Usa scrub: true. Un valor numérico suaviza por segunda vez: reserva hasta 0.3 para un efecto deliberado. | [`cmb-scrub`](../04-combinaciones/cmb-scrub.md) |
| O17 | bloqueante | gsap+lenis | Lenis horizontal sin horizontal: true en ScrollTrigger | Añade horizontal: true a cada instancia, o ScrollTrigger.defaults({ horizontal: true }). | [`cmb-horizontal`](../04-combinaciones/cmb-horizontal.md) |
| O18 | bloqueante | gsap+lenis | lenis.resize() antes de ScrollTrigger.refresh() | Cuelga lenis.resize() del evento refresh, o llámalo después. | [`cmb-medidas`](../04-combinaciones/cmb-medidas.md) |
| O19 | aviso | gsap+lenis | Snap.addElement sobre un elemento fijado | Añade posiciones de ScrollTrigger con snap.add(st.start), y recalcula en refresh. Demostrado; es aviso porque la detección no sabe si ese elemento es el fijado. | [`cmb-snap`](../04-combinaciones/cmb-snap.md) |
| O20 | aviso | gsap+lenis | lenis.velocity con ScrollTrigger disponible | Usa self.getVelocity(), en px/s: lenis.velocity cambia con la frecuencia. Sin infinite. | [`cmb-velocidad`](../04-combinaciones/cmb-velocidad.md) |
| O21 | bloqueante | gsap+lenis | scrub numérico con infinite | Usa scrub: true con un efecto periódico. | [`cmb-infinito`](../04-combinaciones/cmb-infinito.md) |
| O22 | bloqueante | gsap+lenis | lenis.destroy() sin quitar el reloj del ticker | gsap.ticker.remove(paso) con la misma función, en la salida. | [`cmb-salida`](../04-combinaciones/cmb-salida.md) |
| O23 | bloqueante | gsap+lenis | syncTouch con Draggable sin data-lenis-prevent-touch | Marca el elemento con data-lenis-prevent-touch. | [`cmb-gestos`](../04-combinaciones/cmb-gestos.md) |
| O24 | bloqueante | lenis, gsap+lenis | respectReducedMotion: false | Quítalo: Lenis seguiría animando con la preferencia activa. | [`cmb-reducido`](../04-combinaciones/cmb-reducido.md) |
| O25 | aviso | gsap | ScrollToPlugin sin atender el movimiento reducido | En la rama reduce de gsap.matchMedia, usa duration: 0. | [`cmb-reducido`](../04-combinaciones/cmb-reducido.md) |
| O26 | aviso | gsap, lenis, gsap+lenis, ninguno | overflow-x: hidden en html y body con sticky | Usa overflow-x: clip. | [`cmb-css`](../04-combinaciones/cmb-css.md) |
| O27 | aviso | lenis, gsap+lenis | La barra desaparece con lenis.stop() y hay pines | html { scrollbar-gutter: stable }. No fuerces overflow-y: scroll: libera el teclado. | [`cmb-modal`](../04-combinaciones/cmb-modal.md) |
| O28 | aviso | gsap, gsap-smoother, gsap+lenis | Flip sin refresh en onComplete | ScrollTrigger.refresh() en onComplete: en vuelo mide el tamaño anterior. | [`cmb-flip-split`](../04-combinaciones/cmb-flip-split.md) |
| O29 | aviso | gsap, gsap+lenis | Ancla a un elemento fijado | Apunta al espaciador o a un elemento previo, o usa lenis.scrollTo(st.start). Demostrado; sin detección estática. | [`cmb-anclas`](../04-combinaciones/cmb-anclas.md) |
| O30 | aviso | gsap+lenis | scrollerProxy con Lenis | Quítalo: Lenis usa scroll nativo. No rompe, pero sobra. | [`cmb-contenedor`](../04-combinaciones/cmb-contenedor.md) |
| O31 | aviso | gsap-smoother | sticky o fixed con ScrollSmoother | Saca lo fijo de content y usa pin en lugar de sticky. Demostrado; es aviso porque la detección no ve si está dentro de content. | [`cmb-smoother`](../04-combinaciones/cmb-smoother.md) |
| O32 | aviso | gsap+lenis | autoRaf con GSAP sin reloj compartido | Pasa el reloj a gsap.ticker: tras un bloqueo, scroll y tweens se separan 668 ms. | [`cmb-reloj`](../04-combinaciones/cmb-reloj.md) |
| O33 | bloqueante | gsap-smoother | Animar smoother.scrollTop con un tween | Anima la posición de la ventana, con ScrollToPlugin o un objeto propio y window.scrollTo, o usa mov.irA. Tras el tween, la rueda siguiente deja el contenido parado. | [`cmb-smoother`](../04-combinaciones/cmb-smoother.md) |
