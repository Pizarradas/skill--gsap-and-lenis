# Lista para dispositivo real

Lo que las pruebas automáticas no alcanzan: Chrome y Firefox de escritorio ya están cubiertos. Pasa esta lista una vez en Safari de macOS, Safari de iOS y Chrome de Android. Tarda unos 15 minutos. Si algo falla, anota dispositivo, versión y ficha, y márcala con `estado: revisar`.

- [ ] `ctx.revert()` tras varios `set` del mismo valor dentro de un contexto: Safari usa otro motor, y el orden de reversión depende de él (`nuc-context`).
- [ ] Pin de ScrollTrigger sin tirones al entrar y salir, en iOS (`scr-pin`, `scr-normalize`).
- [ ] La barra de direcciones se oculta sin mover los puntos `start` y `end` (`scr-refresh`).
- [ ] `normalizeScroll()` en iOS y Android (`scr-normalize`).
- [ ] ScrollSmoother: efectos con `smoothTouch` y sin él (`scr-smoother`, `scr-smoother-efectos`).
- [ ] Draggable con el dedo, con inercia y `allowNativeTouchScrolling` (`int-draggable`).
- [ ] Observer: toque y direcciones (`scr-observer`).
- [ ] Flip con `position: fixed` y al girar la pantalla (`int-flip`).
- [ ] SplitText con fuentes web y al girar la pantalla (`txt-splittext`).
- [ ] SVG: `transformOrigin` en Safari (`css-origin`, `svg-guia`).
- [ ] Movimiento reducido activado en el sistema (`cal-accesibilidad`).
- [ ] VoiceOver y TalkBack con SplitText (`cal-accesibilidad`).
