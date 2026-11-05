---
id: ver-historial
titulo: Historial de cambios de GSAP, de 3.12.7 a 3.15.1
capa: 15-versiones
tipo: referencia
ambito: transversal
resumen: Cambios reales leídos en los diffs de código y tipos, separados en API nueva, corrección e interno, y a quién afecta el renombrado de tipos de 3.15.0.
api: [gsap.TweenVars.easeReverse, gsap.TweenVars.yoyoEase, SplitText.create, SplitText.Vars.aria, SplitText.Vars.overwrite, SplitText.kill, gsap.utils.distribute, gsap.plugins.RawPath]
relacionadas: [ver-migracion-v3, ver-repo-privado, fra-typescript, fun-licencia, txt-splittext, svg-morphsvg, nuc-repeat-yoyo]
etiquetas: [versiones, changelog, migracion]
fuentes:
  - docs/v3/GSAP/gsap.to().md
  - docs/v3/Plugins/MorphSVGPlugin.md
  - docs/v3/Plugins/SplitText.md
estado: verificado
version: 3.15.1
---
# Historial de cambios de GSAP, de 3.12.7 a 3.15.1

Construido comparando los paquetes de npm (`src/`, `types/`), no a partir de notas de versión. Salvo que se indique otra marca, todo es `[C]`: un cambio aparece aquí solo si se vio en un diff.

**Límites.** Se dispuso de los paquetes 3.12.7, 3.13.0, 3.14.2, 3.15.0 y 3.15.1. Faltan 3.14.0 y 3.14.1, así que el tramo 3.13.0 → 3.14.2 se describe como uno solo: no se puede atribuir un cambio a una de esas tres versiones, salvo lo que afirma la documentación. Lo anterior a 3.12.7 no está cubierto.

| Versión | Fecha | Resumen |
|---|---|---|
| 3.12.7 | 2025-01-15 | Punto de partida |
| 3.13.0 | 2025-04-30 | Todos los plugins en el paquete público, SplitText nuevo |
| 3.14.0, 3.14.1 | 2025-12-08 | Sin diff individual |
| 3.14.2 | 2025-12-12 | Fin del tramo: MorphSVG `smooth` y `curveMode`, tipos de CustomEase y afines |
| 3.15.0 | 2026-04-13 | `easeReverse`, renombrado de tipos |
| 3.15.1 | 2026-11-04 | `scrollTrigger` en Flip, RTL en SplitText, fugas de matchMedia |

## 3.15.1

**API nueva**
- `Flip.from()`/`Flip.to()` admiten `scrollTrigger`: se pasa al timeline que crean. `scrollTrigger` entra en la lista de reservadas de Flip.
- `EasePack.register`.

**Tipos**
- `gsap.plugins.RawPath` pasa de `number[][]` a una interfaz, con `PathSegment.closed` y `totalPoints`.
- `MorphSVGPlugin.getRawPath()` devuelve `RawPath`, no `string[]`. Código que tipaba el resultado como cadenas deja de compilar.

**Correcciones**
- `gsap.matchMedia()`: al revertir o matar un contexto se retiran sus listeners de `MediaQueryList`. Antes quedaban registrados.
- ScrollTrigger: la lectura de posiciones usa la caché compartida (`_scrollers.cache++`), porque `++cacheID` podía devolver un valor obsoleto tras exactamente un evento de scroll.
- ScrollTrigger con matchMedia: la posición grabada sobrevive a la transacción revertir y recrear, incluso para scrollers descubiertos durante ella.
- `scrollRestoration` solo se escribe si cambia, en ScrollTrigger y Observer.
- `animation.timeScale()`: solo reposiciona el cabezal si cambia de dirección o está entre 0 y la duración total, lo que evita renders innecesarios en los extremos.
- `play()` en `progress === 1`: ya no suprime un hijo de duración cero pendiente, como `delayedCall(0)`.
- Ticker: el salto cuando hay retraso de fotograma pasa de `overlap + 4` a `overlap`.
- SplitText: `lines` respeta texto `rtl`; `kill()` cancela el temporizador de `autoSplit`, guardado ahora en `_data.t`; las máscaras reciben `verticalAlign: top`; los fragmentos de `specialChars` se respetan al dividir palabras en caracteres.

**Interno**
- Inserción de `from()` en timelines: el `_startAt` temporal se coloca sin recorrer todo el timeline, y deja de ser O(n²) en timelines grandes.

## 3.15.0

**API nueva**
- `easeReverse`, en tweens y animaciones: ease para cuando el cabezal invierte su dirección, sea por `yoyo` o por `reverse()`. Sustituye a `yoyoEase`.
- `yoyoEase` queda **obsoleto**, marcado con `@deprecated`, aunque sigue funcionando: `vars.easeReverse || yoyoEase` alimenta el mismo mecanismo.

**Tipos**
- `gsap.Callback` devuelve `any`, antes `void | null`.
- **Renombrado**: `draggable.d.ts`, `flip.d.ts`, `observer.d.ts` y `utils/velocity-tracker.d.ts` pasan a `Draggable.d.ts`, `Flip.d.ts`, `Observer.d.ts` y `utils/VelocityTracker.d.ts`.

**Correcciones**
- `Timeline.render()`: `_act` se calculaba invertido (`!timeScale`), y ahora es `!!timeScale`, como indicaba su propio comentario.
- ScrollTrigger: los callbacks de `snap` (`onStart`, `onComplete`, `onInterrupt`) pasan por `_callback`, así que respetan el contexto del ScrollTrigger.
- ScrollTrigger: contempla un `document` o un `<iframe>` como contenedor al medir, y si `enable()` corre sin `body`, se reintenta en `DOMContentLoaded`.
- Observer: `preventDefault` comprueba `cancelable`. Observer puede inicializarse antes que ScrollTrigger.
- SplitText: acepta elementos de otros documentos (iframe), al comprobar `nodeType` y no `instanceof HTMLElement`; varias clases en `el.className` generan varias clases `-mask`; se retira el aviso `SplitText called before fonts loaded`.
- El aviso `not eligible for reset` añade `Try splitting into individual properties`.

**Interno**
- Se elimina `_propagateYoyoEase`: la inversión se calcula en `render` con `_rEase` y `_inv`.

### A quién afecta el renombrado de tipos

`package.json` no cambió entre 3.14.2 y 3.15.0. Su `exports` ya decía `"types": "./types/*.d.ts"`, y `gsap/Flip` apuntaba a un archivo `Flip.d.ts` que en 3.14.2 no existía con esa grafía. Los resultados siguientes son de `tsc` 5.9.3 en Linux, con `strict`.

| Caso | 3.14.2 | 3.15.1 |
|---|---|---|
| `import { Flip } from "gsap/Flip"` y `import gsap from "gsap"` en el proyecto | Correcto | Correcto |
| Solo `import { Flip } from "gsap/Flip"`, `moduleResolution` `bundler` o `node16` | **TS7016** | Correcto |
| Solo `import { Flip } from "gsap/Flip"`, `moduleResolution: node` | TS7016 | TS7016 |
| `/// <reference path=".../gsap/types/flip.d.ts" />` | Correcto | **TS6053** |
| `import … from "gsap/types/flip"` | TS2307 | TS2307 |

**Quién debe hacer algo:** solo quien cite las rutas en minúsculas en `<reference>`, `files`, `include`, `paths` o `typeRoots`. En Windows y macOS, con sistema de archivos insensible a mayúsculas, ese fallo puede quedar oculto hasta el CI en Linux, o aparecer como aviso de `forceConsistentCasingInFileNames`. Eso último es una deducción, no una prueba.

**Quién no:** quien importa por `gsap/Flip`, `gsap/Draggable` u `gsap/Observer`, lo normal. Las rutas de ejecución no cambian: `src/Flip.js` ya llevaba mayúscula.

El arreglo es parcial. El resto de tipos conserva nombres como `scroll-trigger.d.ts`, y `gsap/ScrollTrigger` solo funciona por la declaración ambiental que carga `import "gsap"`: con `bundler`, un archivo que solo importa `ScrollTrigger`, `SplitText`, `CustomEase`, `ScrollSmoother` o `MorphSVGPlugin` da TS7016 aún en 3.15.1. Ver [TypeScript](../12-frameworks/fra-typescript.md).

## 3.13.0 → 3.14.2

**API nueva**
- MorphSVGPlugin: `smooth` (número, `"auto"`, objeto) y `curveMode`. La documentación los fecha en 3.14.0. [O]
- SplitText: método `kill()` y opción `overwrite`. Una instancia nueva sobre el mismo elemento revierte la anterior, salvo `overwrite: false`.
- `gsap.utils.distribute()` admite también `NumberValue` en los tipos.
- `ScrollTrigger.removeEventListener` acepta `"revert"` en los tipos.

**Tipos**
- `CustomEase`, `CustomBounce` y `CustomWiggle` dejan de ser `any` y pasan a clases tipadas, con `CustomEaseConfig`, `CustomBounceVars` y `CustomWiggleVars`.
- **Se eliminan las sobrecargas** `gsap.to/from(targets, duration, vars)`. La sintaxis sigue funcionando en ejecución, pero no compila. Ver [migración](ver-migracion-v3.md).
- Se quitan las declaraciones `gsap-trial/*` de CustomEase, CustomBounce, CustomWiggle y SplitText.
- `AnimationVars` y `TweenVars` pasan a `export interface`.

**Correcciones**
- `VelocityTracker`: `add()` sobre una propiedad ya seguida la reinicia, `v1` y `v2` parten del valor real, y `remove()` sin propiedades mata el seguimiento. El helper `seamlessLoop` fecha en 3.14.0 el fin de un salto de inercia relacionado. [O]
- Draggable: redondeo de `rotation`, el seguimiento de inercia se reinicia al pulsar, y en modo rotación el puntero también pasa por `matrix`.
- Flip: con `nested`, la medida de hijos usa el estado final de los ancestros (`_revertTempStyles`). Nuevo `ElementState.clone()`.
- `animation.then()` encadena la promesa previa.
- `repeatRefresh`: `onStart` ya no se dispara en la segunda iteración.
- `invalidateOnRefresh`: también aplica `immediateRender` en un tween suelto.
- `random()` en cadenas: `_replaceRandom` reescrito con expresiones regulares.
- Valores `var(--x)` con `calc()` en transformaciones.
- Observer: `dragged` ya no vuelve a "primer arrastre".
- `getGlobalMatrix`: mide elementos dentro de `<mask>`, y escribe por `element.style` en lugar de `setAttribute("style")` y `cssText`.
- `Intl.Segmenter` se comprueba antes de usarse en SplitText.
- `startTime()` y `shiftChildren()` redondean con `_roundPrecise`.

**Interno**
- MorphSVG: reparto de anclas proporcional a la longitud de cada bezier, en lugar de uniforme.

## 3.12.7 → 3.13.0

**API nueva**
- Todos los plugins antes de pago entran en el paquete público: `DrawSVGPlugin`, `Physics2DPlugin`, `PhysicsPropsPlugin`, `ScrambleTextPlugin`, `CustomBounce`, `CustomWiggle`, `GSDevTools`, `InertiaPlugin`, `MorphSVGPlugin`, `MotionPathHelper`, `ScrollSmoother` y `SplitText`. `gsap/all` los exporta, y `dist/` pasa de 40 a 75 archivos.
- SplitText reescrito: `SplitText.create()`, `mask`, `aria`, `autoSplit`, `onSplit`, `onRevert`, `deepSlice`, `smartWrap`, `ignore`, `prepareText`, `propIndex`, y `tag`. Se retiran `position` y `lineThreshold` de los tipos, y la propiedad `selector`. `masks` e `isSplit` son nuevos.
- CSS: `var(--x)` como valor final en propiedades normales y en transformaciones.
- Observer: `ignore` también cubre descendientes de la lista, antes solo coincidencia exacta.
- `headless: 1` en `endArray` y en los plugins de `_buildModifierPlugin` (`roundProps`, `modifiers`, `snap`), que así se registran sin `window`.

**Tipos**
- `SplitText.Vars.type` pasa a obligatorio.

**Correcciones**
- `revert()` en timelines nunca iniciados, con `_isRevertWorthy`.
- `onStart` en la primera repetición, al comparar `tTime` y `prevIteration`.
- `timeScale()` limita con `totalDuration()`, no con la caché `_tDur`.
- ScrollTrigger: `invalidateOnRefresh` renderiza los `from()` de un timeline, y se respeta `immediateRender: false` al refrescar.
- Flip: `uncache` antes de medir, y `_fit` sin aplicar `props` cuando hay `duration`.
- PixiPlugin: `strength` en filtros con Pixi 8, y `filters` se reasigna como array nuevo.
- `getGlobalMatrix` dentro de Shadow DOM.

## Ejemplos comprobados

`easeReverse` actúa también al invertir manualmente, no solo en yoyo:

```js
const curva = (t) => t;
let usada = 0;
const inversa = (t) => { usada++; return t; };

const tween = gsap.to(".reversible", { x: 100, duration: 0.1, ease: curva, easeReverse: inversa });
await new Promise((r) => setTimeout(r, 200));
tween.reverse();
await new Promise((r) => setTimeout(r, 200));
// prueba: usada > 0 && gsap.getProperty(".reversible", "x") === 0
```

`yoyoEase` sigue funcionando, aunque obsoleto:

```js
let llamadas = 0;
gsap.to(".antigua", { x: 100, duration: 0.05, yoyo: true, repeat: 1, yoyoEase: (t) => { llamadas++; return t; } });
await new Promise((r) => setTimeout(r, 300));
// prueba: llamadas > 0 && gsap.getProperty(".antigua", "x") === 0
```

`var()` como valor final, desde 3.13.0:

```html
<div class="con-variable" style="--destino: 120px; position: relative;"></div>
```

```js
gsap.to(".con-variable", { left: "var(--destino)", duration: 0.05 });
await new Promise((r) => setTimeout(r, 200));
// prueba: getComputedStyle(document.querySelector(".con-variable")).left === "120px"
```

`scrollTrigger` en `Flip.from()`, desde 3.15.1:

```js
const nodo = document.querySelector(".movil");
const estado = Flip.getState(nodo);
nodo.style.marginLeft = "50px";
const flip = Flip.from(estado, { duration: 0.1, scrollTrigger: { trigger: nodo, start: "top bottom" } });
// prueba: flip.scrollTrigger !== undefined
```

Una instancia nueva de SplitText sobre el mismo elemento revierte la anterior:

```js
const primera = SplitText.create(".doble-split", { type: "words" });
const hijosA = primera.words.length;
const segunda = SplitText.create(".doble-split", { type: "chars" });
const palabrasResiduales = document.querySelector(".doble-split").querySelectorAll(":scope > div > div > div").length;
// prueba: hijosA > 1 && segunda.chars.length > hijosA && palabrasResiduales === 0
```
