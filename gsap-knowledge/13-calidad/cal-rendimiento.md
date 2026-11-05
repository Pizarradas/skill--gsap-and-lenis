---
id: cal-rendimiento
titulo: Rendimiento de animaciones con GSAP
capa: 13-calidad
tipo: concepto
ambito: transversal
resumen: Qué cuesta de verdad al animar: propiedades, número de elementos, quickTo, force3D, lazy y ticker. Separa datos medidos de criterio práctico.
api: [gsap.config, gsap.GSAPConfig.force3D, gsap.GSAPConfig.autoSleep, gsap.GSAPConfig.nullTargetWarn, gsap.quickTo, gsap.quickSetter, gsap.ticker.lagSmoothing, gsap.ticker.fps, gsap.TweenVars.lazy, ScrollTrigger.config]
relacionadas: [nuc-quickto, nuc-quicksetter, nuc-ticker, nuc-defaults-config, css-transforms, scr-batch, cal-conflictos]
etiquetas: [rendimiento, gpu, ticker, transform]
fuentes:
  - docs/v3/GSAP/gsap.config().md
  - docs/v3/GSAP/gsap.ticker.md
  - docs/v3/Plugins/ScrollTrigger/static.config().md
  - https://github.com/greensock/gsap-skills
estado: verificado
version: 3.15.1
---
# Rendimiento de animaciones con GSAP

GSAP rara vez es el cuello de botella: lo caro suele ser lo que el navegador hace después con cada valor escrito (estilo, layout, pintado, composición). Mejorar el rendimiento es sobre todo elegir **qué** animar y **cuántas cosas** a la vez. [P]

## Modelo mental

| Paso del navegador | Lo dispara | Coste relativo |
|---|---|---|
| Composición | `transform`, `opacity` en capa propia | El más bajo |
| Pintado | `color`, `background`, `box-shadow` | Medio, según área |
| Layout | `width`, `height`, `top`, `left`, `margin`, `padding` | El más alto: afecta a vecinos |

Por eso se prefiere `x`, `y`, `scale`, `rotation` y `opacity`, y se evita animar propiedades de layout cuando una transformación logra lo mismo. [O] (skill `gsap-performance`)

Esa regla describe el trabajo del navegador; cuánto importa depende de la página.

## Lo medido

Medición propia del 2026-11-05: gsap 3.15.1, Chrome 156 headless, Intel i7-12650H, mediana de 5 pasadas y 3 ejecuciones. El tiempo es solo del hilo principal, sin pintado ni composición, porque se forzó el avance del reloj con `gsap.updateRoot()` y el layout con `offsetHeight`. Un móvil de gama media será bastante más lento: compara proporciones, no valores absolutos.

**2000 actualizaciones de un `x`, una por fotograma simulado:**

| Método | Total | Por llamada |
|---|---|---|
| `quickSetter` | 0,8 ms | 0,4 µs |
| `quickTo` | 2,5 ms | 1,3 µs |
| `gsap.set` | 5,6 ms | 2,8 µs |
| `gsap.to` con `overwrite: true` | 7 ms | 3,5 µs |
| `gsap.to` con `overwrite: "auto"` | 9 ms | 4,5 µs |
| `gsap.to` sin `overwrite` | 33 ms | 16 µs, con 23 tweens vivos compitiendo |

Lectura: `quickTo` cuesta aproximadamente un tercio que `gsap.to` con overwrite, pero todos están muy por debajo del presupuesto de un fotograma para **un** elemento. Lo decisivo es no acumular tweens: sin `overwrite` el coste se multiplicó por cuatro, y además el resultado es incorrecto.

**Un fotograma con 400 párrafos en flujo normal, JS + estilo + layout:**

| Propiedad | Por fotograma |
|---|---|
| `y` | 0,8 ms |
| `height` | 1,4 ms |

La diferencia en hilo principal fue menor de lo que sugiere la regla general, en esa página simple. La otra parte de la ventaja, la composición en GPU, no se midió. Mide tu caso con el panel Performance antes de sacrificar diseño por rendimiento.

## Ejemplo

`force3D: "auto"`, el valor por defecto, usa una transformación 3D **durante** el tween y vuelve a 2D al terminar, para liberar memoria de GPU. [O]

```js
const caja = document.querySelector(".capa");
gsap.to(caja, { x: 100, duration: 0.2 });
await new Promise((r) => setTimeout(r, 60));
const durante = caja.style.transform;
await new Promise((r) => setTimeout(r, 250));
const alFinal = caja.style.transform;
// prueba: durante.includes("translate3d")
// prueba: new DOMMatrix(alFinal).m41 === 100 && new DOMMatrix(alFinal).is2D
```

`force3D: true` conserva el 3D al final, y `false` no lo usa salvo que `z` sea distinto de 0:

```js
const fija = document.querySelector(".fija");
const plana = document.querySelector(".plana");
gsap.to(fija, { x: 100, duration: 0.05, force3D: true });
gsap.to(plana, { x: 100, duration: 0.2, force3D: false });
await new Promise((r) => setTimeout(r, 80));
const enCurso = plana.style.transform;
await new Promise((r) => setTimeout(r, 200));
// prueba: fija.style.transform.includes("translate3d")
// prueba: !enCurso.includes("3d")
```

`stagger` no reduce instancias: internamente crea un timeline con un tween por objetivo. Sí simplifica el código y gestiona `onComplete` de conjunto. [E]

```js
const escalonado = gsap.to(".fila", { x: 10, duration: 0.1, stagger: 0.05 });
// prueba: escalonado.timeline.getChildren().length === 3
// prueba: Math.abs(escalonado.duration() - 0.2) < 0.001
```

## Opciones relacionadas

| Opción | Dónde | Efecto |
|---|---|---|
| `force3D` | `gsap.config`, tween | `"auto"`, `true`, `false` |
| `autoSleep` | `gsap.config` | Cada cuántos fotogramas comprueba si puede dormir el ticker. Por defecto 120 [O] |
| `autoKillThreshold`, `resistance`, `unitFactors` | `gsap.GSAPConfig` | Figuran en los tipos sin documentación en `gsap.config()` [C] |
| `nullTargetWarn` | `gsap.config` | `false` silencia `GSAP target … not found` en producción [E] |
| `units` | `gsap.config` | Unidad por defecto por propiedad [O] |
| `stringFilter` | `gsap.GSAPConfig` | Figura en los tipos [C] |
| `lazy` | tween | Retrasa la primera escritura al final del tick, para no mezclar lecturas y escrituras. `lazy: false` la fuerza al momento [O] |
| `lagSmoothing(umbral, ajuste)` | `gsap.ticker` | Tras un parón, avanza el reloj solo `ajuste` ms para evitar saltos. `0` lo desactiva [O] |
| `fps(n)` | `gsap.ticker` | Limita la frecuencia de actualización [O] |
| `limitCallbacks`, `syncInterval`, `ignoreMobileResize` | `ScrollTrigger.config` | Menos callbacks, menos comprobaciones, sin refresh por barra de direcciones móvil [O] |
| `fastScrollEnd` | ScrollTrigger | Termina la animación si se sale a más de 2500 px/s [O] |

## Criterio práctico [P]

- **Empieza por lo simple.** Sin una medición que señale un problema, escribe `gsap.to` y sigue.
- **Eventos de alta frecuencia:** `quickTo` si debe suavizar, `quickSetter` si es instantáneo. Crea la función una vez.
- **Muchos elementos:** limita lo animado a lo visible. Más de unos cientos de elementos a la vez es la señal de pasar a canvas o WebGL.
- **`will-change: transform`** solo en lo que anima y solo mientras haga falta: cada capa consume memoria. No la pongas en `*`.
- **Pixel snapping:** `x` subpíxel en texto puede temblar. `force3D: true` o `will-change` lo estabiliza a costa de nitidez.
- **Filtros y sombras grandes** (`filter: blur()`, `box-shadow`) repintan mucho. Anima la `opacity` de una capa ya pintada.
- **SVG:** no tiene la misma composición por capas que HTML. Muchos nodos con `morphSVG` o `drawSVG` son candidatos a canvas.
- **ScrollTrigger:** usa `ScrollTrigger.batch()` para listas largas y evita `refresh()` en bucle. Cada `refresh()` mide todo.
- **Pausa lo invisible:** animaciones infinitas fuera de pantalla, con `toggleActions` o `kill()`.
- **Mide en el dispositivo más débil** al que apuntes, con CPU reducida en DevTools.

## Trampas

- **`gsap.to` en `mousemove` sin `overwrite`** acumula tweens en paralelo, con coste y resultado incorrectos: 23 vivos en la medición. Usa `quickTo`. [P]
- **`gsap.set` no es barato en bucle:** en la medición fue el doble que `quickTo`, y unas siete veces más que `quickSetter`. Para valores por evento, usa `quickSetter`. [P]
- **Layout thrashing:** leer `offsetWidth` tras escribir estilos en un bucle fuerza layout cada vez. Agrupa lecturas y luego escrituras. [O]
- **`transition` de CSS sobre un valor animado** rehace la transición en cada tick. Ver [errores comunes](cal-errores-comunes.md). [O]
- **`lagSmoothing(0)`** tiene sentido si debes seguir un reloj externo, como audio o vídeo. En una web normal provoca saltos tras un parón. [P]
- **Las cifras de terceros** sobre "60 fps garantizados" no significan nada sin dispositivo y carga. Esta ficha solo da cifras propias, y solo para el entorno indicado. [P]
