---
id: cal-conflictos
titulo: Conflictos de Lenis con CSS y otras bibliotecas
capa: 07-calidad
tipo: patron
ambito: transversal
resumen: scroll-behavior, CSS scroll-snap, overflow en body, scroll nativo en plena animación, y ScrollSmoother, normalizeScroll y ScrollToPlugin de GSAP, medido.
api: [Lenis.scrollTo, Lenis.stop, Lenis.start, LenisOptions.autoToggle, ScrollToOptions.immediate, ScrollToOptions.force, Lenis.isScrolling]
requiere: [fun-modelo]
relacionadas: [int-gsap, cal-limitaciones, cal-errores, snp-snap, rec-modal, opc-automatico]
etiquetas: [conflictos, css, scroll-behavior, scroll-snap, overflow, gsap]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Conflictos de Lenis con CSS y otras bibliotecas

Lenis mueve el scroll nativo con `scrollTo` en cada fotograma. De ahí salen casi todos los conflictos: si otro escribe la posición, gana quien escriba después; y si otro la anima, hay dos animaciones. [C]

Laboratorio del 2026-11-05: Chrome 156 headless, rueda real, gsap 3.15.1.

## Problema

Tres clases de choque: CSS que altera la escritura de Lenis, código que escribe el scroll mientras Lenis lo anima, y un segundo suavizado. El síntoma varía, y la causa es siempre uno de los tres.

## Solución

| Con Lenis activo | Resultado | Actuación |
|---|---|---|
| `scroll-behavior: smooth` | Sin conflicto para Lenis: ver abajo | Déjalo o quítalo |
| CSS `scroll-snap-type` | **Se pierde la animación** | Usa [`lenis/snap`](../05-snap/snp-snap.md) |
| `overflow: hidden` en `body` o `html` | **La página sigue moviéndose** | `stop()`, o `autoToggle` con `html` |
| `window.scrollTo`, `scrollIntoView` en plena animación | **Se pierden** | `lenis.scrollTo(..., { immediate: true })` |
| `ScrollToPlugin` en plena animación | **Se pierde** | `lenis.scrollTo` |
| `ScrollTrigger` | Sin conflicto: [`int-gsap`](../06-integracion/int-gsap.md) | `lenis.on("scroll", ScrollTrigger.update)` |
| `ScrollTrigger.normalizeScroll(true)` | Sin conflicto con rueda; táctil sin probar | Innecesario |
| `ScrollSmoother` | **Dos suavizados apilados** | Elige uno |
| Dos instancias sobre la misma raíz | **Clases perdidas** | [`int-contrato`](../06-integracion/int-contrato.md#trampas) |

### `scroll-behavior: smooth`

Lenis escribe con `behavior: "instant"`, que ignora esta propiedad: rueda, `scrollTo` e `immediate` funcionaron igual. Lo que sigue suave es lo ajeno: `window.scrollTo` y `scrollIntoView` animan en nativo, y Lenis los acompaña. [C] [E]

```html
<style>html { scroll-behavior: smooth }</style>
```

```js
const lenis = new Lenis({ autoRaf: true });
lenis.scrollTo(900, { immediate: true });
const propia = window.scrollY;
window.scrollTo({ top: 0, behavior: "instant" });
await espera(100);
lenis.destroy();
// prueba: propia === 900
```

En laboratorio: rueda de 800 con 54 pasos, `window.scrollTo(0, 0)` con 28 pasos nativos, y `scrollIntoView` con 42, con `lenis.scroll` igual a `scrollY` al final. El ancla sin `anchors` también es suave, pero es la animación del navegador, y otra curva: si quieres una sola, activa `anchors`. Versiones antiguas de la hoja de Lenis forzaban `scroll-behavior: auto`; la de 1.3.27 ya no lo hace. [C]

### CSS `scroll-snap`

El navegador ajusta cada escritura a un punto de anclaje. Tabla y cifras en [`cal-limitaciones`](cal-limitaciones.md): con `mandatory`, una rueda de 500 fue un salto a 700 sin animación. No se combinan: quita `scroll-snap-type` y usa `lenis/snap`.

### `overflow` y modales

`overflow: hidden` frena la rueda nativa, pero Lenis cancela esa rueda y escribe por programa, lo que `hidden` permite. Rueda real de 600, con el estilo aplicado después de crear la instancia:

| Bloqueo | Sin `autoToggle` | Con `autoToggle` |
|---|---|---|
| `overflow: hidden` en `body` | **Se mueve**: 598 | **Se mueve**: 598 |
| `overflow: hidden` en `html` | **Se mueve**: 598 | Se detiene |
| `lenis.stop()` | Se detiene | Se detiene |

`autoToggle` solo mira `rootElement`, y `body` no lo es. Los bloqueos de bibliotecas de modales suelen escribir en `body`. Por tanto, llama a `stop()` y `start()` junto a tu modal, o bloquea en `html` con `autoToggle`. Ver [`rec-modal`](../08-recetas/rec-modal.md).

### Escribir el scroll en plena animación

Mientras `isScrolling` es `'smooth'`, `onNativeScroll` no toma la posición, y el siguiente fotograma la pisa: `scrollIntoView` y `gsap.to(window, { scrollTo: 0 })`, lanzados en plena inercia, acabaron en el destino de Lenis (3000 y 2000). En reposo funcionan: `ScrollToPlugin` llegó a 900, con `isScrolling` en `'native'`, y Lenis lo siguió. [C] [E]

```js
const lenis = new Lenis({ autoRaf: true });
await espera(50);
rueda(1500);
await espera(80);
document.documentElement.scrollIntoView({ behavior: "instant" });
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
const pisado = Math.round(window.scrollY);
lenis.destroy();
window.scrollTo({ top: 0, behavior: "instant" });
// prueba: pisado === 1500
```

**También al terminar.** Al completar, Lenis ignora el siguiente `scroll` nativo durante un fotograma, para no emitir dos veces. Un `window.scrollTo(0, 400)` dentro de `onComplete` queda fuera de su vista: en laboratorio, 5 de 5 veces, `scrollY` era 400 y `lenis.scroll` seguía en 1500, y el siguiente gesto parte de ahí. Usa `lenis.scrollTo`, o llama a `lenis.resize()` para resincronizar. [C]

Las escrituras ajenas que no puedas cambiar, como un enrutador: tras ellas, corta, mide y coloca con `colocar`. Un `scrollTo` con `immediate` a ese mismo destino no basta, si `targetScroll` ya vale eso: ver [`int-navegacion`](../06-integracion/int-navegacion.md).

### Otro suavizado

Con `ScrollSmoother` y Lenis juntos, no hubo excepciones, pero a los 500 ms de una rueda de 800, `scrollY` iba por 764 y el contenido, por 669: Lenis suaviza el scroll, y `ScrollSmoother` suaviza sobre eso. Es un retardo doble, y `lenis.scrollTo` y los `pin` pasan a depender de dos capas. Elige uno. [P]

`ScrollTrigger.normalizeScroll(true)` corrió sin avisos: 800 alcanzados en 54 pasos. Está pensado para el tacto: ahí puede chocar con `syncTouch`, y no se ha probado. No lo necesitas por Lenis. [P]

Otros suavizadores, Locomotive o Smooth Scrollbar, no se han ejecutado. Son del mismo tipo, y deben sustituirse, no combinarse. Bibliotecas que solo **leen** el scroll nativo, de revelado o de seguimiento de sección, no deberían verse afectadas: Lenis produce eventos `scroll` reales. Sin ejecutar. [P]

## Trampas

- **`html, body { overflow: hidden }` como reinicio de CSS.** Ver [`cal-errores`](cal-errores.md): el desplazador real puede no ser la ventana.
- **`overscroll-behavior`.** `lenis.css` lo fija en `contain` sobre los elementos con `data-lenis-prevent`: por eso no encadenan al llegar al final. Si quieres encadenar, usa `allowNestedScroll`. Ver [`cal-limitaciones`](cal-limitaciones.md). [C]
- **`hasNestedScroll` guarda en caché.** Con `allowNestedScroll`, un cambio de `overflow` puede tardar 2 s en notarse. Ver [`opc-filtros`](../02-opciones/opc-filtros.md). [C]
- **`scroll-padding`.** No es un conflicto: Lenis lo descuenta al usar `scrollTo` con objetivo. [C]
