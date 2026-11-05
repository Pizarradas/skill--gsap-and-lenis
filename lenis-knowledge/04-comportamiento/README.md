<!-- GENERADO por herramientas/generar_indices.py: no editar a mano -->

# 04 · Comportamiento

| Ficha | Tipo | Ámbito | Resumen |
|---|---|---|---|
| [Anclas y enlaces internos](com-anclas.md) | concepto | core | Sin anchors, un enlace #id salta de forma nativa y durante una animación se pierde. Con anchors se anima, conserva la URL y admite opciones de scrollTo. |
| [Scroll anidado](com-anidado.md) | concepto | core | Áreas con scroll propio dentro de una página con Lenis: allowNestedScroll, data-lenis-prevent, prevent o una segunda instancia, y qué hace overscroll. |
| [Clases CSS de estado](com-clases.md) | referencia | core | Clases que Lenis pone en la raíz según su estado, cuándo cambian y por qué borra cualquier otra clase tuya que empiece por lenis-. |
| [Dimensiones, limit y resize](com-dimensiones.md) | concepto | core | limit se guarda en caché con 250 ms de retardo: consecuencias tras cambiar contenido, y las salidas: resize(), autoResize y naiveDimensions. |
| [Scroll horizontal](com-horizontal.md) | concepto | core | orientation horizontal: maquetación necesaria, conversión de la rueda vertical, medidas en X y posición de objetivos, en ventana y en contenedor. |
| [Scroll infinito](com-infinito.md) | concepto | core | infinite elimina el límite y envuelve la posición con módulo. Qué parte hace Lenis, qué contenido hay que duplicar y cómo cambian scroll, progress y scrollTo. |
| [El reloj de Lenis, autoRaf o bucle propio](com-raf.md) | concepto | core | Lenis no se mueve solo: necesita autoRaf o llamadas a raf(time) en milisegundos. Independencia de fotogramas, pausas, y qué pasa de verdad al mezclar relojes. |
| [Restauración de scroll y cambios de vista](com-restauracion.md) | concepto | core | Lenis no toca history.scrollRestoration. Qué pasa al recargar, cómo fijar la posición al cambiar de vista sin recarga y el estado que puede quedar colgado. |
| [position sticky y fixed](com-sticky-fixed.md) | concepto | core | sticky y fixed funcionan sin adaptación porque Lenis escribe el scroll real. Excepciones: ancestros, contenedores y el efecto de Snap en sticky. |
| [stop, start, isStopped, isLocked y autoToggle](com-stop-start.md) | concepto | core | Parar frente a bloquear, qué impide cada uno, papel de overflow y lenis.css, y el funcionamiento asíncrono de autoToggle. |
