<!-- GENERADO por herramientas/generar_indices.py: no editar a mano -->

# 02 · Núcleo: tweens y control

| Ficha | Tipo | Ámbito | Resumen |
|---|---|---|---|
| [Callbacks y eventCallback](nuc-callbacks.md) | api | core | onStart, onUpdate, onComplete, onRepeat, onReverseComplete y onInterrupt, sus parámetros, this, callbackScope y cuándo se disparan de verdad. |
| [Buscar y matar animaciones](nuc-consulta.md) | api | core | gsap.getById, getTweensOf, isTweening y killTweensOf para localizar animaciones sin guardar variables, y sus límites tras completarse. |
| [gsap.context() - agrupar, limitar y limpiar](nuc-context.md) | api | core | Recoge animaciones y ScrollTriggers para revertirlos juntos y limita selectores a un ámbito. Qué registra de verdad, limpiezas, contextSafe y fugas. |
| [Controlar una animación](nuc-control.md) | api | core | play, pause, resume, reverse, restart, seek, paused, reversed e isActive; sus argumentos, diferencias y patrón de hover con timeScale. |
| [gsap.defaults() y gsap.config()](nuc-defaults-config.md) | api | core | Valores heredados por los tweens frente a ajustes globales del motor; autoSleep, force3D, units, nullTargetWarn, stringFilter y claves que añaden plugins. |
| [gsap.delayedCall() - temporizador sincronizado](nuc-delayedcall.md) | api | core | Llama a una función tras un retardo, dentro del reloj de GSAP. Alternativa a setTimeout que se pausa, se escala y se limpia con el resto. |
| [Efectos registrados](nuc-efectos.md) | api | core | gsap.registerEffect y gsap.effects para empaquetar animaciones con nombre, defaults y métodos directos en Timeline. |
| [gsap.getProperty() - leer valores](nuc-getproperty.md) | api | core | Lee el valor actual de una propiedad como número, con unidad convertida o mediante una función reutilizable. Conoce transformaciones que getComputedStyle no separa. |
| [Control global - globalTimeline, exportRoot y updateRoot](nuc-global.md) | api | core | Pausar o ralentizar todo, separar lo que ya existe de lo nuevo con exportRoot, manejar el reloj a mano y otros miembros de gsap. |
| [immediateRender - cuándo se escribe el primer valor](nuc-immediate-render.md) | concepto | core | Por qué from() y fromTo() pintan al crearse, cómo rompe eso varios from() sobre la misma propiedad y cuándo poner immediateRender en false. |
| [keyframes - varios estados en un tween](nuc-keyframes.md) | api | core | Las tres sintaxis (array de objetos, porcentajes, arrays por propiedad), cómo se combinan ease y easeEach, y sus diferencias de herencia. |
| [kill frente a revert - limpiar animaciones](nuc-limpieza.md) | concepto | core | Qué deja kill y qué deshace revert, inline styles, reutilización, muerte parcial, callbacks y cuál usar en cada situación. |
| [gsap.matchMedia() - animaciones por media query](nuc-matchmedia.md) | api | core | Ejecuta código según media queries y lo revierte al dejar de coincidir. Condiciones, prefers-reduced-motion, scope, refresh y diferencias entre revert y kill. |
| [overwrite - resolver animaciones en conflicto](nuc-overwrite.md) | concepto | core | Qué pasa cuando dos tweens tocan lo mismo y cómo se comportan overwrite true, auto y false, incluidos tweens pausados, retrasados y en timelines. |
| [Promesas y await con animaciones](nuc-promesas.md) | api | core | Esperar animaciones con then y await, y los casos en que la promesa no se resuelve nunca - kill, revert y repeat infinito. |
| [gsap.quickSetter() - aplicar valores a alta frecuencia](nuc-quicksetter.md) | api | core | Función optimizada que escribe un valor al instante, sin crear tweens. Para pointermove o bucles donde gsap.set sería costoso. |
| [gsap.quickTo(), redirigir una animación a alta frecuencia](nuc-quickto.md) | api | core | Crea una función reutilizable que reorienta un mismo tween hacia un valor nuevo. Ideal para seguir el ratón sin crear un tween por evento. |
| [repeat, yoyo y easeReverse](nuc-repeat-yoyo.md) | api | core | Repetir, alternar sentido, pausas entre vueltas, repeatRefresh y easeReverse, que reemplaza a yoyoEase desde 3.15.0. |
| [stagger - escalonar varios objetivos](nuc-stagger.md) | api | core | Número, objeto o función; each frente a amount, from, grid, axis y ease; repeat y callbacks a nivel de tween o de cada elemento. |
| [gsap.ticker - el bucle de GSAP](nuc-ticker.md) | api | core | Añadir lógica por frame, parámetros del listener, prioridad, fps, deltaRatio, lagSmoothing, sleep y wake. |
| [Propiedades de tiempo - time, progress, duration, timeScale](nuc-tiempo.md) | api | core | Diferencia entre time y totalTime, progress y totalProgress, duration y totalDuration; timeScale, delay, startTime, endTime y globalTime. |
| [Crear tweens - to, from, fromTo, set y la clase Tween](nuc-tween-metodos.md) | api | core | Firmas de gsap.to, from, fromTo y set, miembros propios de Tween y qué método elegir en cada caso. |
| [Propiedades especiales de vars](nuc-vars-especiales.md) | referencia | core | Catálogo de claves reservadas de vars - tiempo, ease, repetición, render, control y callbacks - con valor por defecto y ficha donde se detallan. |
