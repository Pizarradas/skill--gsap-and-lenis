---
id: cal-rendimiento
titulo: Rendimiento de Lenis, medido
capa: 07-calidad
tipo: concepto
ambito: core
resumen: Coste real de raf, resize, oyente wheel no pasivo y tamaño, medido en una máquina concreta. Qué consume de verdad y qué no, y cuándo el coste no es de Lenis.
api: [Lenis.raf, Lenis.resize, Lenis.limit, Lenis.dimensions, LenisOptions.naiveDimensions, LenisOptions.autoResize, LenisOptions.allowNestedScroll]
requiere: [fun-modelo, com-raf]
relacionadas: [com-dimensiones, cal-depuracion, cal-limitaciones, int-canvas-webgl, opc-filtros]
etiquetas: [rendimiento, medicion, raf, wheel, tamano]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Rendimiento de Lenis, medido

Lenis es barato por fotograma. Su coste estructural no es de CPU: mueve el desplazamiento de la rueda al hilo principal, y si este se atasca, el scroll se atasca con él. [C]

**Medición.** Una sola máquina, 2026-11-05: Intel Core i7-12650H, 16 hilos, 32 GB, Windows con WSL2, Chrome 156 headless, 1000×700, sin extensiones, compilación minificada `lenis.min.js`. Página de 5418 px con 5000 nodos extra. `performance.now()`, que Chrome redondea a 0,1 ms: lo inferior a esa resolución no es fiable por llamada. Headless no mide pintado ni composición. Estas cifras no son extrapolables: repítelas en tu dispositivo de gama baja.

## Modelo mental

| Medido | Resultado |
|---|---|
| `raf` en reposo | Menos de 0,03 µs por llamada, en 5 tandas de 200 000 |
| `raf` animando, por fotograma | Mediana 0,1 ms, p95 0,2 ms, máximo 1,5 ms |
| Igual, con 50 `ScrollTrigger` con `scrub` | Mediana 0,1 ms, p95 0,3 ms, máximo 2 ms |
| `resize()` con 5000 nodos y DOM sucio | Mediana 1,4 ms, p95 2,3 ms, máximo 2,9 ms |
| Intervalo entre fotogramas animando | Mediana 16,7 ms, p95 17,1 ms: 60 Hz sin fotogramas perdidos |

Rueda real, 60 eventos de 40 px, sobre la misma página:

| | Mediana | p95 | Máximo |
|---|---|---|---|
| Con Lenis | 16,7 ms | 18,8 ms | 30,9 ms |
| Sin Lenis | 16,7 ms | 18,8 ms | 61,6 ms |

No hay diferencia medible aquí. El máximo mayor sin Lenis no significa nada: es una sola muestra.

| Archivo | Bytes | Gzip -9 |
|---|---|---|
| `lenis.min.js` | 18 815 | 5425 |
| `lenis-snap.min.js` | 5844 | 2022 |
| `lenis.css` | 513 | 252 |

**El oyente de rueda no es pasivo.** `VirtualScroll` registra `wheel`, `touchstart` y `touchmove` con `passive: false`, porque debe poder cancelarlos. El navegador tiene que esperar al hilo principal antes de desplazar. Y en el camino de Lenis, cada fotograma de scroll sale de JavaScript. Una tarea larga congela el scroll. Sin Lenis, el navegador puede seguir desplazando en otro hilo. Por eso, **una página con el hilo principal ocupado empeora** con Lenis, aunque estas cifras sean buenas: esta conclusión es razonada, porque aquí no se midió con el hilo bloqueado y sin Lenis. [P]

Por qué `raf` es casi gratis en reposo: `Animate.advance` sale en su primera línea si no hay nada en curso. El bucle no duerme, pero no hace trabajo. [C]

**Qué fuerza una medición.** [C]

- Cada `setScroll` es un `scrollTo` por fotograma.
- `resize()` lee `scrollHeight` y `clientHeight`: forzado si el DOM está sucio.
- `limit` con `naiveDimensions: true` lee `scrollHeight` en cada consulta, y `scrollTo` lo consulta siempre; y `progress`, también.
- `allowNestedScroll` usa `getComputedStyle`, con caché de 2 s por nodo.

## Ejemplo

Mide tu propia página con este patrón: el cuerpo de `raf` frente a cada fotograma. [E]

```js
const lenis = new Lenis();
const costes = [];
let corre = true;
lenis.scrollTo(1500, { duration: 0.4, easing: (t) => t, onComplete: () => { corre = false; } });

await new Promise((listo) => {
  const paso = (t) => {
    const a = performance.now();
    lenis.raf(t);
    costes.push(performance.now() - a);
    corre ? requestAnimationFrame(paso) : listo();
  };
  requestAnimationFrame(paso);
});
const orden = [...costes].sort((x, y) => x - y);
const mediana = orden[orden.length >> 1];
lenis.destroy();
window.scrollTo(0, 0);
// prueba: costes.length > 5 && mediana < 16
```

La prueba solo garantiza que el patrón funciona: la cifra es la del arnés.

## Trampas

- **Atribuir a Lenis el coste de tus `scroll`.** `emit` llama a tus oyentes dentro de `raf`, en el mismo fotograma. Si `raf` tarda, mira qué has colgado de `on("scroll")`. Con 50 `scrub` apenas subió, pero no hubo trabajo de DOM: una medición por oyente es otra historia. [P]
- **`autoRaf` no ahorra nada al quedarse quieto, ni cuesta.** Un `requestAnimationFrame` perpetuo impide que algunos navegadores bajen su consumo. Sin medir: si la batería importa, para el bucle con el scroll quieto, despertando en el primer gesto. Sin ejecutar. [P]
- **Medir en desarrollo.** Las herramientas de desarrollo y los compiladores en caliente cambian las cifras: mide compilado. [P]
- **`will-change` en todo.** No acelera a Lenis, que no usa transformaciones: escribe scroll real. [C]
- **Un `resize()` por fotograma.** A 1,4 ms, consume casi una décima del presupuesto de 60 Hz. Llámalo por evento, no en bucle. [P]
- **Bajo consumo.** Safari puede reducir `requestAnimationFrame`: ver [`cal-limitaciones`](cal-limitaciones.md). Sin ejecutar.
