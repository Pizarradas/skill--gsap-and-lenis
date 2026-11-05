---
id: cal-accesibilidad
titulo: Accesibilidad de Lenis: movimiento reducido, foco y teclado
capa: 07-calidad
tipo: guia
ambito: core
resumen: Qué hace respectReducedMotion de verdad, medido con prefers-reduced-motion real; teclado y Tab con rueda real; foco perdido en plena inercia y al usar stop().
api: [LenisOptions.respectReducedMotion, Lenis.prefersReducedMotion, ScrollToOptions.onStart, ScrollToOptions.onComplete, ScrollToOptions.lock, Lenis.stop, Lenis.start, Lenis.scrollTo]
requiere: [fun-modelo]
relacionadas: [opc-automatico, com-stop-start, com-anclas, rec-modal, int-canvas-webgl, cal-limitaciones]
etiquetas: [accesibilidad, reduced-motion, teclado, foco, tab]
fuentes:
  - README.md
  - https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
estado: verificado
version: 1.3.27
---
# Accesibilidad de Lenis

Lenis no toca el teclado ni el foco: esos caminos siguen siendo nativos, y es su mayor virtud. Los riesgos están en lo que la animación pisa, y en lo que `stop()` no bloquea. [C]

**Laboratorio del 2026-11-05:** Chrome 156 headless, 1000×700, `requestAnimationFrame` real, rueda y teclas reales por el protocolo de depuración, y `prefers-reduced-motion` real con `Emulation.setEmulatedMedia`. El arnés no puede activar esa preferencia. **No se probó ningún lector de pantalla,** ni Firefox, ni Safari.

## Pasos

### 1. Conoce la rama de movimiento reducido

`respectReducedMotion` vale `true`, y la preferencia se lee en cada `scrollTo`: se aplica en vivo, sin recargar. `prefersReducedMotion` lo confirmó al activarla y desactivarla. [C] Laboratorio:

| Con `prefers-reduced-motion: reduce` | Resultado |
|---|---|
| `matchMedia(...).matches`, `lenis.prefersReducedMotion` | `true`, `true` |
| Rueda de 600, incluso con `duration: 2` | **7 fotogramas**: 381, 519, 570, 589, 596, 599, 600 |
| Misma rueda, sin la preferencia | 51 fotogramas |
| `scrollTo(2000, { duration: 3 })` | Salto en una sola escritura |
| Clic en un ancla con `anchors: true` | Salto en una sola escritura |
| `respectReducedMotion: false` | `prefersReducedMotion` es `false`: 51 fotogramas, aunque el sistema pida reducir |

**El README dice que el scroll sigue a la rueda "1:1". No es exacto.** Fuerza `lerp = 1`, y `lerp` es un coeficiente de amortiguación, no una fracción: unos 116 ms de movimiento. Es mucho menos, pero no es nulo. Quien necesite cero movimiento debe usar `smoothWheel: false` al detectar la preferencia. [P]

Una llamada programática se convierte en `immediate`, con efectos en tus callbacks: [E]

```js
const original = window.matchMedia;
window.matchMedia = () => ({ matches: true });        // simula la preferencia: el laboratorio la activó de verdad
const lenis = new Lenis({ autoRaf: true });
window.matchMedia = original;

const eventos = [];
lenis.scrollTo(900, {
  duration: 3,
  lock: true,
  onStart: () => eventos.push("onStart"),
  onComplete: () => eventos.push("onComplete"),
});
const y = window.scrollY;
const bloqueada = lenis.isLocked;
const reducido = lenis.prefersReducedMotion;
lenis.destroy();
window.scrollTo(0, 0);
// prueba: y === 900 && reducido === true
// prueba: eventos.join() === "onComplete" && bloqueada === false
```

- **`onStart` no se llama**, y **`lock` no bloquea**: una secuencia que dependa de `onStart` se queda sin arrancar. Prepárala antes de la llamada, o en `onComplete`.
- **Sincronía intacta.** Con GSAP, un ancla saltó a 1806 con `scrub` en 60,2, y la rueda siguió sincronizada. Laboratorio.
- **Tus efectos no se reducen solos.** Una animación que dependa de `lenis.progress` o de `velocity` sigue moviéndose: consulta `lenis.prefersReducedMotion`.

### 2. Confía en el teclado, y compruébalo

Las teclas no pasan por Lenis: producen scroll nativo, y `onNativeScroll` se sincroniza. Laboratorio, con teclas reales:

| Tecla | `scrollY` | `lenis.scroll` |
|---|---|---|
| Av Pág | 612 | 612 |
| Flecha abajo | 652 | 652 |
| Espacio | 1264 | 1264 |
| Fin | 4718 | 4718 |
| Inicio | 0 | 0 |
| Tab hacia un botón fuera de pantalla | 1468 | 1468 |

Sin suavizado: el movimiento de teclado es el del navegador. Arrastrar la barra también funciona, con `isScrolling` en `'native'`.

### 3. Protege el foco en plena inercia

**Durante una animación, Lenis pisa lo que el foco acaba de mover.** Con la inercia activa, se pulsó Tab hacia un enlace: el foco llegó a él, pero el scroll siguió hasta 3000, y el elemento enfocado quedó a −2998 px, fuera de la vista. Un usuario mixto de rueda y teclado pierde su sitio. [C] Laboratorio.

Si te importa, corta la inercia al tabular. Una tecla no pasa por Lenis, así que hay que hacerlo a mano: [P]

```js
const lenis = new Lenis({ autoRaf: true });
document.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && lenis.isSmooth) lenis.scrollTo(lenis.scroll, { immediate: true });
});

rueda(2000);
await espera(120);
const enMarcha = lenis.isSmooth;
document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
const cortada = Math.round(window.scrollY);
await espera(600);
const fin = Math.round(window.scrollY);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: enMarcha === true && Math.abs(fin - cortada) <= 1 && fin < 1990
```

### 4. Bloquear no es solo `stop()`

`stop()` corta la rueda y el tacto, pero **no** el teclado. Lo hace `lenis.css`: `.lenis-stopped` escribe `overflow: clip` en la raíz. Laboratorio:

| Con `stop()` | Con `lenis.css` | Sin `lenis.css` |
|---|---|---|
| Rueda | Bloqueada | Bloqueada |
| Av Pág | Bloqueada | **Se mueve: 612** |
| Tab a un elemento fuera de vista | **Se mueve: 1468** | **Se mueve: 1468** |
| `window.scrollTo()` | Se mueve | Se mueve |

Por tanto, un modal con `stop()` necesita además **su propia trampa de foco**: sin ella, Tab recorre lo que hay detrás y lo mueve, aunque la página parezca bloqueada. Usa `inert` en el fondo, o `<dialog>` con `showModal()`. Ver [`rec-modal`](../08-recetas/rec-modal.md).

### 5. Comprueba el foco al navegar por anclas

Con `anchors: true`, el clic no se cancela: el navegador sigue actualizando el hash y el punto de partida del foco. Tras un ancla a `#c`, Tab fue al botón dentro de `#c`. Laboratorio. Sin esa opción, el ancla es el salto nativo. Ver [`com-anclas`](../04-comportamiento/com-anclas.md). En contenedores propios, el comportamiento puede diferir: sin ejecutar.

## Trampas

- **`prefers-reduced-motion` no significa "sin scroll".** Es una preferencia sobre el movimiento: Lenis sigue funcionando y sigue emitiendo `scroll`, a propósito, para no romper lo sincronizado. [O] [C]
- **Desactivar `respectReducedMotion` por estética.** Ignora una preferencia de accesibilidad del usuario. Si tu diseño la necesita, hazlo solo tras ofrecer otra vía. [P]
- **`syncTouch`.** Cambia el desplazamiento táctil nativo por uno simulado, en dispositivos donde el lector de pantalla y el zoom son habituales. No se probó con tecnologías de asistencia. Déjalo apagado si no lo necesitas. [P]
- **Zoom con Ctrl y rueda.** Lenis lo respeta: con `ctrlKey`, no hace nada. [C]
- **Scroll en `iframe`.** Teclado y rueda dentro de un `iframe` son suyos. Ver [`cal-limitaciones`](../07-calidad/cal-limitaciones.md).
