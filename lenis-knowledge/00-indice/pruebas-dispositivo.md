# Lista para dispositivo real

Lo que las pruebas automáticas no alcanzan: Chrome y Firefox de escritorio ya están cubiertos. Pasa esta lista una vez por cada combinación que te importe, en especial Safari en macOS, Safari en iOS y Chrome en Android. Tarda unos 15 minutos. Si algo falla, anota dispositivo, versión y ficha, y márcalo en la ficha con `estado: revisar`.

## Scroll

- [ ] Arrastre con un dedo: sigue al dedo, sin retardo apreciable (`opc-tactil`).
- [ ] Con `syncTouch: true`: la inercia se siente natural y se detiene al tocar (`opc-tactil`).
- [ ] La barra de direcciones se oculta y reaparece sin saltos (`opc-tactil`).
- [ ] Rebote al llegar arriba y abajo en iOS (`cal-limitaciones`).
- [ ] Selección de texto con los tiradores nativos (`opc-tactil`).
- [ ] Trackpad en Safari: desplazamiento fluido y sin tirones (`cal-limitaciones`).
- [ ] Refresco de 120 Hz en un dispositivo que lo admita (`cal-limitaciones`).

## Estado y navegación

- [ ] Área interna con `data-lenis-prevent`: se desplaza sola y no mueve la página al llegar al final (`com-anidado`).
- [ ] Modal abierto: el fondo no se mueve con el dedo ni con el teclado (`rec-modal`).
- [ ] Atrás y adelante del navegador: posición correcta (`com-restauracion`).
- [ ] Giro de la pantalla: `limit` correcto y sin contenido cortado (`com-dimensiones`).
- [ ] Contenedor con scroll propio: mismas comprobaciones (`opc-contenedores`).

## Accesibilidad

- [ ] Movimiento reducido activado en el sistema: sin suavizado perceptible (`cal-accesibilidad`).
- [ ] VoiceOver y TalkBack: se puede recorrer la página y el foco queda a la vista (`cal-accesibilidad`).
- [ ] Teclado: Tab, flechas, Inicio, Fin y barra espaciadora (`cal-accesibilidad`).
