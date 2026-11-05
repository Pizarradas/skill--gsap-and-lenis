---
id: opc-referencia
titulo: Referencia de LenisOptions
capa: 02-opciones
tipo: referencia
ambito: core
resumen: Las 26 opciones de Lenis con valor por defecto contrastado con el constructor, cuándo se leen y qué ficha las explica.
api: [LenisOptions.wrapper, LenisOptions.content, LenisOptions.eventsTarget, LenisOptions.smoothWheel, LenisOptions.syncTouch, LenisOptions.syncTouchLerp, LenisOptions.touchInertiaExponent, LenisOptions.duration, LenisOptions.easing, LenisOptions.lerp, LenisOptions.infinite, LenisOptions.orientation, LenisOptions.gestureOrientation, LenisOptions.touchMultiplier, LenisOptions.wheelMultiplier, LenisOptions.autoResize, LenisOptions.prevent, LenisOptions.virtualScroll, LenisOptions.overscroll, LenisOptions.autoRaf, LenisOptions.anchors, LenisOptions.autoToggle, LenisOptions.allowNestedScroll, LenisOptions.naiveDimensions, LenisOptions.stopInertiaOnNavigate, LenisOptions.respectReducedMotion, Lenis.options]
requiere: [fun-modelo]
relacionadas: [opc-suavizado, opc-gestos, opc-tactil, opc-contenedores, opc-filtros, opc-automatico]
etiquetas: [opciones, referencia, valores]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Referencia de `LenisOptions`

Valores por defecto tomados del constructor en `packages/core/src/lenis.ts`, no de la tabla del README ni de los comentarios JSDoc, que discrepan en cuatro casos. El último bloque lo comprueba en ejecución. [C] [E]

| Opción | Tipo | Defecto | Se lee | Ficha |
|---|---|---|---|---|
| `wrapper` | `Window \| Element` | `window` | Al crear | [`opc-contenedores`](opc-contenedores.md) |
| `content` | `Element` | `document.documentElement` | Al crear | [`opc-contenedores`](opc-contenedores.md) |
| `eventsTarget` | `Window \| Element` | el valor de `wrapper` | Al crear | [`opc-contenedores`](opc-contenedores.md) |
| `smoothWheel` | `boolean` | `true` | En vivo | [`opc-gestos`](opc-gestos.md) |
| `syncTouch` | `boolean` | `false` | En vivo | [`opc-tactil`](opc-tactil.md) |
| `syncTouchLerp` | `number` | `0.075` | En vivo | [`opc-tactil`](opc-tactil.md) |
| `touchInertiaExponent` | `number` | `1.7` | En vivo | [`opc-tactil`](opc-tactil.md) |
| `duration` | `number` (s) | `undefined`; `1` si solo das `easing` | En vivo | [`opc-suavizado`](opc-suavizado.md) |
| `easing` | `(t) => number` | `undefined`; curva exponencial si solo das `duration` | En vivo | [`opc-suavizado`](opc-suavizado.md) |
| `lerp` | `number` | `0.1` | En vivo | [`opc-suavizado`](opc-suavizado.md) |
| `infinite` | `boolean` | `false` | En vivo | [`com-infinito`](../04-comportamiento/com-infinito.md) |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | En vivo, pero `gestureOrientation` no se recalcula | [`opc-gestos`](opc-gestos.md) |
| `gestureOrientation` | `'vertical' \| 'horizontal' \| 'both'` | `'both'` si `orientation` es horizontal; si no, `'vertical'` | En vivo | [`opc-gestos`](opc-gestos.md) |
| `touchMultiplier` | `number` | `1` | **Solo al crear** | [`opc-gestos`](opc-gestos.md) |
| `wheelMultiplier` | `number` | `1` | **Solo al crear** | [`opc-gestos`](opc-gestos.md) |
| `autoResize` | `boolean` | `true` | Solo al crear | [`com-dimensiones`](../04-comportamiento/com-dimensiones.md) |
| `prevent` | `(node) => boolean` | `undefined` | En vivo | [`opc-filtros`](opc-filtros.md) |
| `virtualScroll` | `(data) => boolean` | `undefined` | En vivo | [`opc-filtros`](opc-filtros.md) |
| `overscroll` | `boolean` | `true` | En vivo | [`com-anidado`](../04-comportamiento/com-anidado.md) |
| `autoRaf` | `boolean` | `false` | Al crear y en cada `raf` | [`com-raf`](../04-comportamiento/com-raf.md) |
| `anchors` | `boolean \| ScrollToOptions` | `false` | Al crear para escuchar; luego en vivo | [`com-anclas`](../04-comportamiento/com-anclas.md) |
| `autoToggle` | `boolean` | `false` | Al crear para escuchar; luego en vivo | [`com-stop-start`](../04-comportamiento/com-stop-start.md) |
| `allowNestedScroll` | `boolean` | `false` | En vivo | [`opc-filtros`](opc-filtros.md) |
| `naiveDimensions` | `boolean` | `false` | En vivo | [`com-dimensiones`](../04-comportamiento/com-dimensiones.md) |
| `__experimental__naiveDimensions` | `boolean` | `false`, obsoleta | Solo al crear; se copia a `naiveDimensions` | [`com-dimensiones`](../04-comportamiento/com-dimensiones.md) |
| `stopInertiaOnNavigate` | `boolean` | `false` | Como `anchors` | [`opc-automatico`](opc-automatico.md) |
| `respectReducedMotion` | `boolean` | `true` | En vivo | [`opc-automatico`](opc-automatico.md) |

"En vivo" significa que el código consulta `lenis.options.x` en cada uso, así que cambiarlo surte efecto; "solo al crear", que el valor se copió antes o se usó para registrar un listener. `lenis.options` guarda los valores resueltos y no incluye `__experimental__naiveDimensions`. [C] [E]

## Discrepancias con la documentación

| Opción | Dice | Hace el código |
|---|---|---|
| `duration` | README: `1.2`, "inútil si hay lerp" | `undefined`, y si existe **gana** a `lerp` |
| `easing` | README y JSDoc: la curva exponencial | `undefined`: la curva solo se aplica si das `duration` |
| `eventsTarget` | JSDoc: `window` | El valor recibido de `wrapper` |
| `gestureOrientation` | README y JSDoc: `vertical` | `both` con orientación horizontal |

## Comprobación

```js
const lenis = new Lenis();
const o = lenis.options;
const esperado = {
  smoothWheel: true, syncTouch: false, syncTouchLerp: 0.075, touchInertiaExponent: 1.7,
  lerp: 0.1, infinite: false, orientation: "vertical", gestureOrientation: "vertical",
  touchMultiplier: 1, wheelMultiplier: 1, autoResize: true, overscroll: true, autoRaf: false,
  anchors: false, autoToggle: false, allowNestedScroll: false, naiveDimensions: false,
  stopInertiaOnNavigate: false, respectReducedMotion: true,
};
const distintos = Object.keys(esperado).filter((k) => o[k] !== esperado[k]);
const objetos = o.wrapper === window && o.content === document.documentElement && o.eventsTarget === window;
const vacios = [o.duration, o.easing, o.prevent, o.virtualScroll].every((v) => v === undefined);
lenis.destroy();

const horizontal = new Lenis({ orientation: "horizontal" });
const gesto = horizontal.options.gestureOrientation;
horizontal.destroy();

const soloEasing = new Lenis({ easing: (t) => t });
const duracionImplicita = soloEasing.options.duration;
soloEasing.destroy();

const soloDuracion = new Lenis({ duration: 2 });
const easingImplicito = typeof soloDuracion.options.easing;
soloDuracion.destroy();
// prueba: distintos.length === 0 && objetos && vacios
// prueba: gesto === "both" && duracionImplicita === 1 && easingImplicito === "function"
```

La opción obsoleta se traslada a la actual:

```js
const obsoleta = { ["__experimental__naiveDimensions"]: true };
const lenis = new Lenis(obsoleta);
const resuelta = lenis.options.naiveDimensions;
const copiada = "__experimental__naiveDimensions" in lenis.options;
lenis.destroy();
// prueba: resuelta === true && copiada === false
```

Mutar las opciones funciona solo donde se leen en vivo:

```js
const lenis = new Lenis();
lenis.options.wheelMultiplier = 5; // ignorado: VirtualScroll copió el valor
rueda(100);
const trasMultiplicador = lenis.targetScroll;
lenis.options.smoothWheel = false; // respetado: se consulta en cada evento
rueda(100);
const estado = lenis.isScrolling;
lenis.destroy();
// prueba: trasMultiplicador === 100 && estado === "native"
```
