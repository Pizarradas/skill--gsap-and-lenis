---
id: cal-limitaciones
titulo: Limitaciones oficiales de Lenis, contrastadas una a una
capa: 07-calidad
tipo: referencia
ambito: transversal
resumen: Las seis limitaciones del README frente al código y a pruebas reales: cuáles se confirman, cuáles matizar y cuáles no se pudieron ejecutar.
api: [LenisOptions.allowNestedScroll, LenisOptions.syncTouch, LenisOptions.prevent, Lenis.isIos]
requiere: [fun-modelo]
relacionadas: [cal-conflictos, cal-errores, cal-rendimiento, com-anidado, opc-filtros, opc-tactil, snp-snap]
etiquetas: [limitaciones, iframe, safari, scroll-snap, ios]
fuentes:
  - README.md
  - packages/snap/README.md
  - https://bugs.webkit.org/show_bug.cgi?id=173434
  - https://github.com/darkroomengineering/lenis/issues/103
estado: revisar
version: 1.3.27
---
# Limitaciones oficiales de Lenis

El README enumera seis limitaciones. Aquí cada una se contrasta con el código y, si se pudo, con una prueba real. **`estado: revisar`** porque tres dependen de Safari o iOS, que no se han ejecutado.

Laboratorio del 2026-11-05: Chrome 156 headless en Windows, rueda real, 1000×700. El rastreador de WebKit y el de Lenis se consultaron ese mismo día.

| # | Limitación | Veredicto | Evidencia |
|---|---|---|---|
| 1 | Sin soporte para CSS scroll-snap | **Confirmada** | Laboratorio, abajo |
| 2 | 60 fps en Safari, 30 en bajo consumo | **Sin ejecutar.** Lenis no limita nada; es de `requestAnimationFrame` | Código y rastreador |
| 3 | Se detiene sobre un `iframe` | **Confirmada, con matices** | Laboratorio, abajo |
| 4 | `position: fixed` se retrasa en Safari de macOS anterior a M1 | **Sin ejecutar**, y sin causa clara | Incidencia abierta |
| 5 | El tacto puede fallar con `syncTouch` en iOS anterior a 16 | **Sin ejecutar.** El código no distingue versiones | Código |
| 6 | Lo anidado requiere configuración | **Confirmada** | Laboratorio, abajo |

## 1. CSS scroll-snap

Lenis escribe la posición fotograma a fotograma, y el navegador ajusta esas escrituras a los puntos de anclaje. Con secciones de 700 px, igual que la ventana:

| `scroll-snap-type` | Rueda de 200 | Rueda de 500 | `scrollTo(2300)` |
|---|---|---|---|
| Sin Lenis, `mandatory` | Vuelve a 0 | — | — |
| Con Lenis, `mandatory` | Vuelve a 0, 0 pasos | **Un salto a 700**, sin animación | Saltos 1400, 2100 |
| Con Lenis, `proximity` | Vuelve a 0 | 22 pasos y salto final a 700 | Termina en 2100, no en 2300 |

No se rompe nada: el destino es un punto de anclaje válido. Lo que se pierde es la animación. Con secciones más altas que la ventana, sí hay movimiento libre dentro de ellas, como sin Lenis. Usa [`lenis/snap`](../05-snap/snp-snap.md). Ver [`cal-conflictos`](cal-conflictos.md).

## 2. Frecuencia en Safari

El código no tiene ningún límite: `raf` avanza con el `dt` que recibe, y `damp` es independiente de la frecuencia. Con menos fotogramas, el recorrido dura lo mismo, pero con pasos mayores. Lo que cambia con la frecuencia es `velocity`. [C]

El informe citado, *Support for 120Hz requestAnimationFrame*, sigue abierto. Su contenido matiza la frase del README: WebKit limitó el contenido a 60 Hz por consumo, con un ajuste interno; varios usuarios afirman que iOS 18 lo corrige con ese ajuste desactivado, y un ingeniero de Apple informó de 120 fps en un iPad con iOS 26.1. El límite de 30 fps en bajo consumo se cita en comentarios. No se ha comprobado en Safari. [O]

## 3. `iframe`

Un `iframe` es otro documento: su rueda no llega al `window` de la página. Lo confirma la prueba, con matices que el README no recoge:

| Rueda de 300 sobre un `iframe` | Página | `iframe` | `virtual-scroll` |
|---|---|---|---|
| Contenido corto, sin scroll propio | **Scroll nativo**, sin suavizar: 300 | — | 0 |
| Contenido alto | Quieta | Se mueve: 300 | 0 |
| En plena animación de Lenis | Sigue suave | Quieto | Sí recibe |

- La página **no se detiene**: si el `iframe` no tiene scroll, encadena a la página, pero sin suavizado.
- Durante la animación, `lenis.css` aplica `pointer-events: none` a los `iframe` con `.lenis-smooth`: la rueda pasa a la página, y el `iframe` no recibe nada. Es deliberado: permite cruzar uno sin tropezar. Sin esa hoja, la rueda quedaría atrapada. [C]
- No hay solución dentro de Lenis para el documento interno. Si controlas ambos, instala Lenis dentro también.

## 4. `position: fixed` en Safari

La incidencia #103 sigue abierta, con la etiqueta `blocked`. El mantenedor no pudo reproducirla en Safari 15.4 ni en un Intel de 2019. Los informes apuntan a equipos poco potentes, modo de bajo consumo y cambio automático de gráficos, y las soluciones citadas no funcionan para todos. No hay una causa confirmada. No se ha probado aquí: ver [`com-sticky-fixed`](../04-comportamiento/com-sticky-fixed.md). [O]

## 5. `syncTouch` en iOS anterior a 16

`isIos` solo se usa para no interferir con los tiradores de selección de texto. No hay ninguna comprobación de versión: el problema, si existe, es del navegador antiguo, y no hay forma de saberlo sin un dispositivo. Por defecto, el tacto es nativo: solo afecta a quien activa `syncTouch`. Ver [`opc-tactil`](../02-opciones/opc-tactil.md). [C]

## 6. Scroll anidado

Rueda real de 400 sobre una caja `overflow: auto` de 300 px, con 1500 de contenido:

| Configuración | Página | Caja | Al llegar al final de la caja |
|---|---|---|---|
| Sin configurar | **Se mueve**: 399 | Quieta | La caja nunca se mueve |
| `allowNestedScroll: true` | Quieta | Se mueve: 400 | La página continúa |
| `data-lenis-prevent` | Quieta | Se mueve: 400 | La página no continúa, por `overscroll-behavior: contain` de `lenis.css` |

Ver [`com-anidado`](../04-comportamiento/com-anidado.md) y [`opc-filtros`](../02-opciones/opc-filtros.md).

## Lo que el README no enumera

Comprobado aquí. Los detalles están en cada ficha:

| Limitación | Dónde |
|---|---|
| El scroll de la rueda pasa al hilo principal: oyente `wheel` no pasivo | [`cal-rendimiento`](cal-rendimiento.md) |
| Lo que escribe el scroll en plena animación se pierde: foco, `scrollIntoView`, `window.scrollTo` | [`cal-conflictos`](cal-conflictos.md) |
| `stop()` no bloquea Tab ni, sin `lenis.css`, el teclado | [`cal-accesibilidad`](cal-accesibilidad.md) |
| `autoToggle` solo observa la raíz, no `body` | [`cal-conflictos`](cal-conflictos.md) |
| No existe sin `window`: ni servidor ni `Worker` | [`int-contrato`](../06-integracion/int-contrato.md) |

**Sin probar en este sistema:** Firefox, Safari, iOS, Android real y tecnologías de asistencia.
