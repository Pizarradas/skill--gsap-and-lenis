<!-- GENERADO por herramientas/generar_indices.py: no editar a mano -->

# 03 · Timelines

| Ficha | Tipo | Ámbito | Resumen |
|---|---|---|---|
| [Timelines anidadas](tim-anidado.md) | patron | core | Componer una secuencia larga con funciones que devuelven timelines. Cómo interactúan posición, pausa, repeat y defaults entre madre e hija. |
| [Timeline, secuenciar animaciones sin encadenar delays](tim-basico.md) | concepto | core | Qué es una timeline, cómo se crea y se llena, y por qué sustituye a los delays. Incluye las opciones de gsap.timeline() y las trampas de from() y set() dentro de ella. |
| [Controlar una timeline](tim-control.md) | api | core | Reproducir, saltar, repetir, cambiar duración y pausar en puntos concretos. addPause, removePause, tweenTo, tweenFromTo y las diferencias con un tween. |
| [Etiquetas en una timeline](tim-etiquetas.md) | api | core | addLabel, removeLabel, labels, currentLabel, nextLabel y previousLabel. Dar nombre a instantes para colocar hijos y navegar sin números mágicos. |
| [Gestionar los hijos de una timeline](tim-gestion.md) | api | core | Añadir, quitar, buscar y desplazar hijos. add, remove, clear, getChildren, getById, getTweensOf, killTweensOf, recent y shiftChildren, con sus desajustes frente a la documentación. |
| [Herencia y política de hijos en una timeline](tim-herencia.md) | concepto | core | defaults e inherit, cómo se sincronizan los cabezales, y qué cambian smoothChildTiming y autoRemoveChildren. |
| [El parámetro de posición](tim-posicion.md) | concepto | core | Gramática completa de la posición en una timeline (número, +=, -=, <, >, etiquetas, porcentajes), qué referencia usa cada forma y qué métodos no la admiten entera. |
