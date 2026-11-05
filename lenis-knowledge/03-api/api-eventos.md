---
id: api-eventos
titulo: Eventos de Lenis y scrollend
capa: 03-api
tipo: api
ambito: core
resumen: Eventos scroll y virtual-scroll, cuándo se emiten y datos que reciben, además del scrollend propio, que no llega a document.
api: [Lenis.on, Lenis.off, VirtualScrollData.deltaX, VirtualScrollData.deltaY, VirtualScrollData.event, Lenis.userData]
requiere: [fun-modelo]
relacionadas: [api-metodos, opc-filtros, com-raf]
etiquetas: [eventos, scroll, virtual-scroll, scrollend]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Eventos de Lenis

Lenis emite dos eventos propios con `on()`, y cambia cómo llega el `scrollend` del DOM. [C]

## Firma

```text
lenis.on('scroll', (lenis) => void) → desuscribir
lenis.on('virtual-scroll', ({ deltaX, deltaY, event }) => void) → desuscribir
```

| Evento | Argumento | Se emite |
|---|---|---|
| `scroll` | La instancia | Cada fotograma de animación; al terminar; en cada `scroll` nativo procesado; a los 400 ms de reposo nativo; en `resize()`, `stop()`, `start()` e `immediate` |
| `virtual-scroll` | `VirtualScrollData` | Por cada `wheel`, `touchstart`, `touchmove` y `touchend` que llegue a `eventsTarget`, salvo que la opción `virtualScroll` devuelva `false` |

`VirtualScrollData`: `deltaX` y `deltaY` en píxeles ya multiplicados, y `event`, el `WheelEvent` o `TouchEvent` original. Mutar este objeto en el evento `virtual-scroll` no surte efecto: Lenis copió los valores antes. Para eso está la **opción** [`virtualScroll`](../02-opciones/opc-filtros.md). [C]

El último `scroll` de una animación llega con `isScrolling` en `false`, `velocity` en 0 y `userData` aún poblado. [C] [E]

### `scrollend`

Lenis intercepta el `scrollend` nativo en fase de captura y lo corta cuando `isScrolling` es `'smooth'` o `false`; luego, un `requestAnimationFrame` después de terminar, despacha **su propio** `CustomEvent('scrollend', { detail: { lenisScrollEnd: true } })` en `wrapper`. Con `wrapper` ventana, ese evento solo existe en `window`. [C]

Resultado en un navegador real (laboratorio: Chrome 156, 2026-11-05):

| Origen del scroll | Oyente en `window` | Oyente en `document` |
|---|---|---|
| Animación de Lenis | Propio | **Nada** |
| `immediate: true` | Propio | **Nada** |
| Nativo (teclado, `window.scrollTo`) | Nativo | Nativo |

El arnés no sirve para esto: su `requestAnimationFrame` temporizado adelanta el evento `scroll`, y produce resultados que Chrome no da.

## Ejemplo

```js
const lenis = new Lenis();
const fotogramas = [];
lenis.on("scroll", ({ isScrolling, velocity, userData }) =>
  fotogramas.push({ isScrolling, velocity, origen: userData.origen })
);
const virtuales = [];
lenis.on("virtual-scroll", ({ deltaX, deltaY, event }) => virtuales.push([deltaX, deltaY, event.type]));

rueda(100);
lenis.raf(1000);
let t = 1000;
for (let i = 0; i < 300; i++) lenis.raf((t += 16));
const ultimo = fotogramas[fotogramas.length - 1];

lenis.scrollTo(500, { duration: 0.1, userData: { origen: "x" } });
for (let i = 0; i < 20; i++) lenis.raf((t += 16));
const cierre = fotogramas[fotogramas.length - 1];
lenis.destroy();
// prueba: virtuales.length === 1 && virtuales[0].join() === "0,100,wheel"
// prueba: fotogramas.length > 3 && ultimo.isScrolling === false && ultimo.velocity === 0
// prueba: cierre.origen === "x"
```

El evento `virtual-scroll` llega también con la instancia parada:

```js
const lenis = new Lenis();
lenis.stop();
let vistos = 0;
lenis.on("virtual-scroll", () => vistos++);
rueda(100);
const destino = lenis.targetScroll;
lenis.destroy();
// prueba: vistos === 1 && destino === 0
```

Cómo detectar el final del scroll con independencia del origen:

```js
const lenis = new Lenis({ autoRaf: true });
let finales = 0;
const alTerminar = () => finales++;
window.addEventListener("scrollend", alTerminar); // en window, no en document
lenis.scrollTo(300, { duration: 0.1 });
await espera(500);
window.removeEventListener("scrollend", alTerminar);
lenis.destroy();
// prueba: finales >= 1
```

## Trampas

- **`document.addEventListener('scrollend', ...)` con Lenis en ventana.** No se dispara tras animaciones de Lenis: el nativo se corta en la captura y el propio no pasa por `document`. Escucha en `window`, o en el contenedor. (laboratorio)
- **Trabajo pesado en `scroll`.** Se ejecuta en el mismo fotograma de la animación: bloquearlo frena el scroll. Ver [`cal-rendimiento`](../07-calidad/cal-rendimiento.md). [P]
- **Contar fotogramas con `scroll`.** Sin movimiento también se emite: `stop()`, `start()`, `resize()` y el fin de reposo. [C]
- **Contar gestos con `virtual-scroll`.** También cuenta `touchstart`, con delta 0, y gestos filtrados. [C] [E]
- **Mutar `data` en el evento.** No cambia el resultado: ver arriba. [C]
- **Esperar `scroll` con la instancia sin reloj.** Sin `raf`, una rueda cambia el destino pero no emite nada. Ver [`com-raf`](../04-comportamiento/com-raf.md). [E]
