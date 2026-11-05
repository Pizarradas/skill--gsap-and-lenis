# Contradicciones y fallos

Lugares donde la documentación o los tipos no coinciden con lo que hace `lenis` 1.3.27, y fallos reales del paquete. **Gana el código.** Cada punto se comprobó en el código o en ejecución; la evidencia está en la ficha citada. Revísalo al cambiar de versión. No están notificados a los autores.

## Documentación frente a realidad

| Tema | Documentación | Realidad en 1.3.27 | Ficha |
|---|---|---|---|
| `direction` | `1` sube, `-1` baja | `1` cuando `scroll` aumenta | api-instancia, rec-nav-direccion |
| `duration` por defecto | `1.2` | `undefined`; `1` solo si hay `easing` sin `duration` | opc-referencia |
| `easing` por defecto | Curva exponencial | `undefined`; la curva solo se aplica si hay `duration` sin `easing` | opc-referencia |
| `duration` frente a `lerp` | `duration` es inútil si hay `lerp` | Al revés: `duration` gana en todas las rutas salvo toque con `syncTouch`. Anula también el `lerp` de `scrollTo` y Snap. `duration: 0` fuerza `lerp` | opc-suavizado |
| `eventsTarget` por defecto | `window` | El valor de `wrapper` | opc-referencia, opc-contenedores |
| `gestureOrientation` por defecto | `vertical` | `both` con orientación horizontal | opc-referencia |
| `programmatic` | `false` por defecto | `true` | api-scrollto |
| `time` | Tiempo desde la creación | Último `time` pasado a `raf()` | api-instancia |
| `isStopped` | Si el usuario debería poder desplazarse | Invertido | api-instancia |
| `offset` | Como `scroll-padding-top` | Signo contrario: se suma | api-scrollto |
| Movimiento reducido | Sigue la entrada 1:1 | `lerp` 1 amortigua: en torno al 62 % por paso de 16 ms; unos 7 fotogramas para 300 px | opc-automatico |
| `allowNestedScroll` | Comprueba el DOM en cada evento | Caché por nodo de 2 s, con datos que pueden quedar obsoletos | opc-filtros |
| `lerp` | Intensidad entre 0 y 1 | Coeficiente de amortiguación, no fracción por fotograma | opc-suavizado |
| Snap `resize()` | Recalcula los puntos | Solo la posición de los elementos | snp-api |
| `Snap.add` | JSDoc cita `userData` | Retirado en 1.3.12 | snp-api |
| `Snap.addElements` | Tipo `HTMLElement[]` | Acepta `NodeList` desde 1.3.15 | snp-api |
| Propiedades listadas | Sin `isLocked`, `isSmooth`, `isTouching`, `isIos`, `userData`, `overflow` | Existen | api-instancia |
| Ruta de `lenis.css` | `./packages/core/lenis.css` | En npm, `dist/lenis.css` | fun-instalacion |
| Bucle `raf` propio del README de React | Ejemplo | No se reprograma: 0 llamadas a `raf`, la página no se mueve | int-react |
| README de Vue, ejemplo con GSAP | Completo | Usa `onMounted` sin importarlo | int-vue-nuxt |
| `vue >=3.0.0` en el paquete | Admitido | Importa `onWatcherCleanup`, de 3.5: con 3.4 falla al importar | int-vue-nuxt |
| "Global imports" en Vue | Disponibles | Solo en Nuxt. Con `app.use`, `<VueLenis>` no se resuelve, sin aviso en producción | int-vue-nuxt |
| `LenisExposed` | Tipo público | No se exporta (TS2614) | int-typescript |
| Fragmento sin código y modales | "Should handle" | `autoToggle` no detecta `overflow` en `body` | int-webflow, cal-conflictos |
| `iframe` | Deja de funcionar | Encadena a scroll nativo si el `iframe` no tiene scroll | cal-limitaciones |
| `lagSmoothing(0)` con GSAP | Evita retrasos | Cierto, pero causa un salto tras un bloqueo | int-gsap |
| `immediate` | Ignora `duration`, `easing` y `lerp` | Si el destino es `targetScroll`, no corta la animación en curso: esa rama va antes | api-scrollto, int-navegacion |
| `force` | Llega aunque esté parada | En un contenedor con `overflow` en hoja y `lenis.css`, parada no mueve nada | com-stop-start |
| `window.lenis` en los tipos | Siempre definido | `undefined` antes de la primera instancia | int-typescript |
| Props de React y Vue | Solo `options` y `root` | Hay más, sin documentar | int-react, int-vue-nuxt |
| Historial oficial | — | Omite cambios que rompen en 1.1.0, 1.1.10, 1.3.5, 1.3.6, 1.3.12, 1.3.17 y 1.3.25, y no da los valores de 1.3.8 | ver-historial |
| `V2-ROADMAP.md` | Plan de la 2.0 | No coincide con 2.0.0-dev.6, publicada con la etiqueta `dev` | ver-v2 |

## Fallos reales del paquete

### Snap

- Un ancestro `sticky` queda en `position: static` para siempre con `ignoreSticky`, y un `sticky` en línea se borra (snp-elementos).
- `align: "start"` en horizontal usa `rect.top` (snp-elementos, rec-secciones-snap).
- Dentro de un contenedor, los puntos salen desplazados: la medida incluye la posición del contenedor (snp-elementos, rec-secciones-snap).
- El destino cuenta dos veces el último delta y excluye el punto exacto en el que está (snp-snap, snp-api).
- `destroy()` no cancela el `debounce` pendiente, y quitar un elemento no desconecta sus observadores (snp-api, rec-secciones-snap).
- Reacciona a gestos sobre `data-lenis-prevent`, y con Lenis parado desincroniza `currentSnapIndex` (snp-api).

### Núcleo

- `autoToggle`: `stop()` seguido de `start()` deja la página en `overflow: clip`. Sin `lenis.css`, `stop()` no cambia `isStopped`; pero crear con `overflow` ya oculto da `isStopped` en `true`, y ya no se reanuda (com-stop-start).
- `stop()` en un contenedor con `overflow` en hoja y `lenis.css`: `clip` lo anula como contenedor de scroll, salta a 0, y `start()` deja `scroll` y `targetScroll` en 0 con `scrollTop` en 500. Una rueda salta de 500 a 100 (com-stop-start).
- `destroy()` no retira `transitionend` de `autoToggle` (rec-modal).
- `stop()` sin `lenis.css` no bloquea el teclado (com-stop-start).
- `raf()` manual con `autoRaf: true` deja cadenas de rAF vivas tras `destroy()` (rec-canvas-sync).
- Dos relojes mezclados en `raf()`, con `lerp` y a más de unos 118 s de distancia, producen `NaN` y la página queda clavada en 0 hasta `stop()` y `start()`, o un `scrollTo` con `immediate`. Con `duration`, o con orígenes cercanos, no (com-raf).
- `isScrolling` puede quedar en `"native"` tras una restauración del navegador, tras `stop()` y `start()` con un reinicio de scroll, y con `smoothWheel: false` y rueda en el límite (api-instancia, com-restauracion).
- `isTouching` no atiende `touchcancel` (opc-tactil).
- `wrapper: null` lanza `TypeError` y deja la clase `lenis` (opc-contenedores).
- `updateClassName` borra cualquier clase `lenis-*` ajena (com-clases).
- `scrollend`: con ventana, tras una animación `document` no recibe nada (api-eventos).

### Integración

- `destroy()` no para un reloj externo (int-contrato).
- El reinicio de scroll de un enrutador se pierde en plena inercia: queda en 200 y no en 0, comprobado en seis apps reales. `resize()` no la corta y, si el scroll ya está en destino, tampoco `resize()` seguido de `scrollTo` con `immediate`: visto en Next y SvelteKit (int-navegacion).
- Un contenedor con instancia propia atrapa la rueda en sus extremos: `preventDefault` también en el límite (opc-contenedores).
- Un `window.scrollTo` dentro de `onComplete` no lo ve Lenis: `scrollY` 400 frente a `lenis.scroll` 1500 (cal-conflictos).
- Tab en plena inercia puede dejar el foco fuera de pantalla (cal-accesibilidad).
- En Vue, `:options` en línea recrea la instancia en cada render del padre (int-vue-nuxt).

### Empaquetado

- `sideEffects: false` hace que webpack en producción elimine `lenis.css` sin aviso. Se arregla con `sideEffects: true` en la regla CSS (fun-instalacion).
