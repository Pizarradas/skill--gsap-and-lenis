---
id: api-instancia
titulo: Instancia de Lenis, propiedades y estado
capa: 03-api
tipo: api
ambito: core
resumen: Constructor y todas las propiedades de la instancia: posiciones, velocidad, dirección, estado, globales. Corrige direction, time e isStopped del README.
api: [Lenis, Lenis.options, Lenis.time, Lenis.isTouching, Lenis.isIos, Lenis.userData, Lenis.lastVelocity, Lenis.velocity, Lenis.direction, Lenis.targetScroll, Lenis.animatedScroll, Lenis.dimensions, Lenis.overflow, Lenis.rootElement, Lenis.limit, Lenis.isHorizontal, Lenis.actualScroll, Lenis.scroll, Lenis.progress, Lenis.isScrolling, Lenis.isStopped, Lenis.isLocked, Lenis.isSmooth, Lenis.prefersReducedMotion, Lenis.className]
requiere: [fun-modelo]
relacionadas: [api-metodos, api-eventos, opc-referencia, com-clases]
etiquetas: [api, propiedades, estado]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Instancia de Lenis

`new Lenis(opciones)` registra listeners y deja lista una instancia. No arranca ningún bucle salvo con `autoRaf`. Las propiedades son de lectura: escribir en ellas no está previsto, y varias son getters sin setter público. [C]

## Firma

```text
new Lenis(opciones?: LenisOptions) → Lenis
```

| Propiedad | Tipo | Significado | Nota |
|---|---|---|---|
| `scroll` | `number` | Posición actual; con `infinite`, en `[0, limit)` | La que debes leer |
| `animatedScroll` | `number` | Valor de la animación | Sin módulo |
| `targetScroll` | `number` | Destino | Ver [`fun-modelo`](../01-fundamentos/fun-modelo.md) |
| `actualScroll` | `number` | Lo que informa el navegador | Getter, lee el DOM |
| `limit` | `number` | Máximo en el eje | En caché salvo `naiveDimensions` |
| `progress` | `number` | `scroll / limit` | Vale `1` si `limit` es 0, para evitar `NaN` |
| `velocity` | `number` | Píxeles por fotograma, con signo | `0` al terminar |
| `lastVelocity` | `number` | Valor anterior de `velocity` | |
| `direction` | `1 \| -1 \| 0` | `1`: hacia abajo o la derecha; `-1`: hacia arriba o la izquierda | **El README lo dice al revés** |
| `isScrolling` | `false \| 'native' \| 'smooth'` | Estado | Ver abajo |
| `isSmooth` | `boolean` | `isScrolling === 'smooth'` | |
| `isStopped` | `boolean` | `true` tras `stop()` | El README lo describe invertido |
| `isLocked` | `boolean` | `true` durante un `scrollTo` con `lock` | No está en la tabla del README |
| `isTouching` | `boolean \| undefined` | Dedo en pantalla | `undefined` hasta el primer gesto |
| `isIos` | `boolean` | User agent con `iPad`, `iPhone` o `iPod` | Ver [`opc-tactil`](../02-opciones/opc-tactil.md) |
| `isHorizontal` | `boolean` | `orientation === 'horizontal'` | |
| `prefersReducedMotion` | `boolean` | Preferencia y opción, a la vez | [`opc-automatico`](../02-opciones/opc-automatico.md) |
| `overflow` | `string` | `overflow-x/y` calculado de `rootElement`, según el eje | Lee estilos |
| `rootElement` | `HTMLElement` | `<html>` o `wrapper` | |
| `className` | `string` | Clases que tocan según el estado | Ver [`com-clases`](../04-comportamiento/com-clases.md) |
| `options` | objeto | Opciones resueltas | [`opc-referencia`](../02-opciones/opc-referencia.md) |
| `dimensions` | `Dimensions` | Medidas en caché | [`com-dimensiones`](../04-comportamiento/com-dimensiones.md) |
| `userData` | `object` | Datos del `scrollTo` en curso | `{}` si no hay |
| `time` | `number` | Último `time` recibido en `raf()` | **No** es "tiempo desde la creación" |

Los estados de `isScrolling` [C]:

| Valor | Cuándo |
|---|---|
| `'smooth'` | Hay una animación de Lenis en curso |
| `'native'` | El navegador está desplazando; o gesto no suavizado, incluido el toque sin `syncTouch` |
| `false` | Reposo: tras completar la animación, o 400 ms después del último scroll nativo |

Lenis también publica datos globales: `window.lenis.version` y, según lo usado, `window.lenis.horizontal`, `window.lenis.touch` y `window.lenis.snap`. `window.lenisVersion` está obsoleta, y todo es para diagnóstico. [C] [E]

## Ejemplo

```js
const lenis = new Lenis();
const inicial = { touching: lenis.isTouching, tiempo: lenis.time, scrolling: lenis.isScrolling };
const globales = { ...window.lenis };

rueda(300);
const t0 = 5000;
lenis.raf(t0);
lenis.raf(t0 + 16);
const bajando = { dir: lenis.direction, vel: lenis.velocity, tiempo: lenis.time };

for (let i = 2; i < 200; i++) lenis.raf(t0 + i * 16);
const reposo = { vel: lenis.velocity, dir: lenis.direction, scrolling: lenis.isScrolling, smooth: lenis.isSmooth };

rueda(-100);
lenis.raf(t0 + 4000);
lenis.raf(t0 + 4016);
const subiendo = { dir: lenis.direction, vel: lenis.velocity, ultima: lenis.lastVelocity };
const progreso = lenis.progress;
lenis.destroy();
// prueba: inicial.touching === undefined && inicial.tiempo === 0 && inicial.scrolling === false
// prueba: globales.version === "1.3.27"
// prueba: bajando.dir === 1 && bajando.vel > 0 && bajando.tiempo === 5016
// prueba: reposo.vel === 0 && reposo.dir === 1 && reposo.scrolling === false && reposo.smooth === false
// prueba: subiendo.dir === -1 && subiendo.vel < 0
// prueba: progreso > 0 && progreso < 1
```

## Trampas

- **`direction` del README.** Dice `1` arriba y `-1` abajo. En el código es el signo de la variación: `1` cuando `scroll` aumenta. Mantiene el último valor en reposo, no vuelve a 0. [C] [E]
- **`time` para medir cuánto lleva activo.** Guarda el último `time` pasado a `raf()`. Con `autoRaf` es el reloj de `requestAnimationFrame`, medido desde que se abrió la página. [C] [E]
- **`velocity` en píxeles por segundo.** Es diferencia por fotograma: depende de la tasa de refresco. Normaliza si la usas para un efecto. [C]
- **`isScrolling` puede quedarse en `'native'`.** Dos vías: un `scroll` nativo sin desplazamiento real, como la restauración tras recargar, deja `velocity` en 0 y no se programa el temporizador de 400 ms; y con `smoothWheel: false`, una rueda en el límite marca `'native'`, sin scroll que lo limpie. También `stop()` y `start()` tras un reinicio de scroll. `lenis-scrolling` sigue puesta hasta el siguiente scroll. Ver [`com-restauracion`](../04-comportamiento/com-restauracion.md). [C] (laboratorio: Chrome 156, 2 s después seguía igual)
- **`limit` tras cambiar contenido.** Está en caché con 250 ms de retardo. [E] en [`com-dimensiones`](../04-comportamiento/com-dimensiones.md)
- **Escribir `lenis.targetScroll = x`.** Se admite por tipos, pero no anima nada y se sobrescribe. Usa `scrollTo`. [C]
