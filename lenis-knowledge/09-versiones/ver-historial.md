---
id: ver-historial
titulo: Historial de versiones contrastado
capa: 09-versiones
tipo: referencia
ambito: transversal
resumen: Qué cambió de verdad entre 1.0.43 y 1.3.27, separado en API, conducta, correcciones e interno, con cambios que RELEASES.md no menciona.
api: [LenisOptions.respectReducedMotion, LenisOptions.naiveDimensions, LenisOptions.stopInertiaOnNavigate, LenisOptions.touchInertiaExponent, Lenis.prefersReducedMotion, Lenis.overflow, Lenis.isIos, SnapOptions.distanceThreshold, Snap.next, Snap.previous, Snap.goTo]
relacionadas: [ver-migracion, ver-v2, opc-referencia, snp-snap, fun-instalacion]
etiquetas: [versiones, historial, releases, npm]
fuentes:
  - RELEASES.md
estado: verificado
version: 1.3.27
---
# Historial de versiones contrastado

`RELEASES.md` tiene 100 entradas, pero no todo lo que cambia aparece ahí, y alguna entrada no se corresponde con un cambio de código. Esta ficha contrasta el historial con lo publicado en npm.

**Método** (2026-11-05): se descargaron de npm las 58 versiones estables de `lenis` desde 1.0.43, más `@studio-freight/lenis` 1.0.0, 1.0.16 a 1.0.42 por muestreo, y se compararon `lenis.d.ts`, `lenis-snap.d.ts`, `lenis.css`, `exports` de `package.json` y el TypeScript original que llevan los `.map`. En esta ficha, `[C]` significa que se leyó ese diff entre versiones publicadas. `[O]` significa que solo lo dice `RELEASES.md`. `[E]` se ejecutó aquí contra 1.3.27.

Para adaptar un proyecto, ve a [migración](ver-migracion.md).

## Cambios de conducta y de API que rompen

Son lo más importante si actualizas: varios llegaron en versiones de parche.

| Versión | Cambio | ¿En `RELEASES.md`? |
|---|---|---|
| 1.3.26 | `respectReducedMotion` nace con `true`: con `prefers-reduced-motion`, `scrollTo` salta y la rueda se fuerza a `lerp: 1` [C] | Sí, sin indicar que es el valor por defecto |
| 1.3.25 | `scrollTo("#algo")` pasa a `getElementById`: un selector compuesto como `"#a .b"` deja de funcionar [C] [E] | No: solo "fix anchors with special characters" |
| 1.3.22 | Las clases se gestionan con `classList`; solo se tocan `lenis` y `lenis-*` [C] | Sí |
| 1.3.17 | `anchors` funciona en contenedores: antes exigía `wrapper === window` [C] | No |
| 1.3.17 | Los gestos ya no heredan `lerp`, `duration` ni `easing` por defecto en `syncTouch` [C] | Sí, "always use lerp for syncTouch" |
| 1.3.12 | `snap.add(valor, userData)` pierde el segundo argumento. El JSDoc lo sigue citando [C] | No |
| 1.3.10 | `gestureOrientation` vale `"both"` si `orientation` es horizontal [C] | Sí |
| 1.3.8 | `Snap`: `type` pasa de `mandatory` a `proximity`; `distanceThreshold` de `100%` a `50%` [C] | "default options", sin valores |
| 1.3.7 | `Snap`: desaparece `velocityThreshold`; `debounce` pasa de 50 a 500 ms; se dispara con `virtual-scroll`, no con `scroll` [C] | Parcial |
| 1.3.6 | `Snap`: se eliminan `remove()` y `removeElement()`. Quedan las funciones que devuelven `add` y `addElement` [C] | No |
| 1.3.5 | `touchInertiaMultiplier` (35) se sustituye por `touchInertiaExponent` (1.7), con otra fórmula. La antigua se ignora sin aviso [C] [E] | No |
| 1.3.3 | `easing` deja de tener valor por defecto: el modo por tiempo solo se activa con `duration` o `easing` [C] | Sí |
| 1.1.19 | `wrapper: document.body` deja de equivaler a `window` [C] | Sí |
| 1.1.15 | `autoRaf` nuevo. `lenis/react` y `lenis/vue` pierden `rafPriority` [C] | Parcial |
| 1.1.10 | Desaparece `wheelEventsTarget`, en desuso desde 1.0.26 [C] | No |
| 1.1.0 | `isScrolling` deja de ser booleano: `false`, `"native"` o `"smooth"`. `isSmooth` pasa a derivar de él [C] | No |

## API nueva

| Versión | Añadido |
|---|---|
| 1.3.26 | `respectReducedMotion`, `prefersReducedMotion` [C] |
| 1.3.24 | `isIos` [C] |
| 1.3.18 | `data-lenis-prevent-vertical`, `data-lenis-prevent-horizontal`; `window.lenis` con `version`, `horizontal`, `snap`; `window.lenis.touch` llega en 1.3.19 [C] |
| 1.3.17 | `naiveDimensions`, `stopInertiaOnNavigate`. En 1.3.18, `__experimental__naiveDimensions` vuelve a los tipos como obsoleta [C] |
| 1.3.16 | Getter `overflow` [C] |
| 1.3.15 | `addElements` acepta `NodeList` en ejecución. El tipo sigue siendo `HTMLElement[]` [C] |
| 1.3.12 | `Snap`: `type: "lock"`, `next()`, `previous()`, `goTo()`, `addElements()`, `resize()`, `currentSnapIndex`. En `RELEASES.md` solo consta `lock` [C] |
| 1.3.6 | `Snap`: `distanceThreshold` [C] |
| 1.3.5 | `touchInertiaExponent` [C] |
| 1.3.2 | `LenisContext` exportado por `lenis/react` [C] |
| 1.3.0 | `autoToggle`, `allowNestedScroll`, clase `lenis-autoToggle` [C] |
| 1.2.0 | `lenis/vue` y `lenis/nuxt` se declaran estables [O]. Los `exports` ya existían: `./vue` desde 1.1.14 y `./nuxt` desde 1.1.21 [C] |
| 1.1.19 | `anchors` [C] |
| 1.1.15 | `autoRaf` [C] |
| 1.1.14 | `overscroll` [C] |
| 1.1.9 | `exports` añade `./dist/*`, que permite `lenis/dist/lenis.css`. El archivo ya estaba en `dist` desde 1.1.8 [C] |
| 1.1.6 | `virtualScroll`, evento `virtual-scroll`, `Snap` con `debounce` [C] |
| 1.1.2 | `Snap`: opciones públicas, horizontal [C] |
| 1.1.0 | `lenis/snap`, `prevent`, `userData` y públicos en tipos: `velocity`, `lastVelocity`, `direction`, `targetScroll`, `animatedScroll`, `time`, `options` [C] |
| 1.0.43 | Primera versión del nombre `lenis`, con `lenis/react`. `RELEASES.md` lo atribuye a 1.0.44, que tiene los mismos `exports` [C] |

## Correcciones demostradas

| Versión | Corrección | Evidencia en el diff |
|---|---|---|
| 1.3.27 | La clase `lenis` volvía tras `destroy()` | `destroy()` cancela el temporizador de 400 ms de `velocity` [C] |
| 1.3.27 | `scrollTo()` con SVG | `instanceof HTMLElement` pasa a `Element` [C] [E] |
| 1.3.25 | Anclas con caracteres especiales | `decodeURIComponent` y `getElementById` [C] |
| 1.3.24 | Selección de texto en iOS | Radio de 40 px alrededor de los tiradores [C] |
| 1.3.23 | Vibración de `syncTouch` lento | Se compara con `Math.round(to)` y `scrollTo` deja de redondear el destino [C] |
| 1.3.22 | `syncTouch` más preciso | La inercia toma el signo de `delta`, no el de `velocity` [C] |
| 1.3.21 | `fix #509` | `onTransitionEnd` ignora eventos de otros elementos y `propertyName` ausente [C] |
| 1.3.20 | `scroll-margin` y `scroll-padding` | Se restan en el destino de un elemento [C] [E: [menú](../08-recetas/rec-menu-anclas.md)] |
| 1.3.19 | `stopInertiaOnNavigate` con `anchors` | Compara URL completas: mismo `pathname` es ancla, distinto es navegación [C] |
| 1.3.18 | `allowNestedScroll` | Reescrito como `hasNestedScroll`, con `overscroll-behavior` [C] |
| 1.3.16 | `autoToggle` al iniciar | `checkOverflow()` en el constructor [C] |
| 1.3.12 | Anclas de subpáginas | `href` que incluye `#`, no solo al inicio [C] |
| 1.3.11 | Sobrescroll en instancias anidadas | Condición `limit > 0` [C] |
| 1.3.5 | `stop()` y `start()` con `autoToggle` | Separa `internalStop` e `internalStart`; `event.cancelable` antes de `preventDefault` [C] |
| 1.1.18 | Tocar para parar en `syncTouch` | Exige `isClickOrTap` [C] |
| 1.1.17 | Clase `lenis-scrolling` | No se activa con la instancia parada [C] |
| 1.1.16 | `overflow: clip` | En `lenis.css`, en lugar de `hidden` [C] |
| 1.1.12 | Regresión de `lerp` | Quita los valores por defecto de `fromTo`, añadidos en 1.1.10 [C] |
| 1.1.11 | `onStart` y `onComplete` | Se llaman también sin recorrido; `resize()` actualiza `scroll` y emite [C] |
| 1.1.3 | `userData` con `immediate` | `emit()` deja de recibirlo: se asigna a `this.userData` antes de la rama `immediate` [C] |

## Cambios internos

Sin efecto en la API pública, aunque sí en lo que se vea por la consola o en el peso:

- **Dependencias:** 1.0.43 trae `@darkroom.engineering/hamo`, `clsx` y `zustand`; 1.0.45 cambia `hamo` y `zustand` por `tempus`; 1.1.0 quita `clsx`; 1.1.15 queda sin dependencias [C].
- **Módulo:** `type: "module"` y `main` en `.mjs` desde 1.0.43. Sin `require` en `exports` [C].
- **`lenis.css`:** 1.1.19 quita `.lenis.lenis-smooth { scroll-behavior: auto !important }`, porque `setScroll` ya usa `behavior: "instant"`. 1.3.0 añade reglas de `autoToggle`. 1.3.11 y 1.3.18 amplían los selectores de `data-lenis-prevent`, y dejan de exigir `lenis-smooth` [C].
- **Compilación:** 1.1.14 a `tsup`, monorepo en `packages/`. 1.1.13 sustituye campos privados `#` por `_`, para no romper proxies [C].
- **`hasNestedScroll`:** se llamaba `checkNestedScroll` hasta 1.3.17 [C].

## Entradas sin cambio demostrable

| Versión | Dice | Comprobación |
|---|---|---|
| 1.3.4 | "improve `syncTouch` on iOS" | El fuente del núcleo es idéntico a 1.3.3, y `lenis.mjs` pesa lo mismo. El cambio real de inercia llega en 1.3.5 [C] |
| 1.3.0 | `lenis/famer` (sic) | Es un componente externo en un enlace. No existe en `exports`, ni en 1.3.27 [C] |
| 1.0.44 | Renombrado de paquetes | `lenis` ya estaba en 1.0.43, publicado seis minutos antes [C] |

## Versiones publicadas sin entrada

En npm y no en `RELEASES.md`: 1.0.43, 1.1.7, 1.1.8 y 1.3.9 [C]. 1.3.9 cambia `lenis/react`: `className`, `style` y demás pasan por `...props`, y añade `root="asChild"` [C]. 1.1.8 estrena `lenis.css` en `dist` [C].

Las fechas de `RELEASES.md` pueden no coincidir con npm: 1.2.0 dice 2025-03-07, y npm registra 2025-03-04 [C].

## Antes de 1.0.43

Esas versiones se publicaron como `@studio-freight/lenis`. Sus entradas de `RELEASES.md` se contrastaron solo en lo que afecta a la migración: opciones retiradas y sus avisos, en [migración](ver-migracion.md). El resto, incluidas las `0.2.x` y `1.0.0-dev.*`, queda como `[O]`, sin contrastar.

## Pruebas

```html
<div style="height:1000px"></div>
<svg width="100" height="100"><circle id="punto" cx="50" cy="50" r="30"></circle></svg>
<div id="padre"><p class="dentro">x</p></div>
<div style="height:3000px"></div>
```

```js
const lenis = new Lenis({ autoRaf: true, lerp: 0.5 });
const circulo = document.querySelector("#punto");
const esperado = circulo.getBoundingClientRect().top;

lenis.scrollTo(circulo);
for (let i = 0; lenis.isSmooth && i < 150; i++) await espera(20);
const llegaSvg = Math.abs(lenis.scroll - esperado) < 2;

// Desde 1.3.25 un destino que empieza por # es un id, no un selector
const avisos = [];
const original = console.warn;
console.warn = (m) => avisos.push(m);
const antes = lenis.scroll;
const compuesto = ["#padre", ".dentro"].join(" ");
lenis.scrollTo(compuesto);
console.warn = original;

// prueba: llegaSvg
// prueba: avisos[0] === "Lenis: Target not found" && lenis.scroll === antes
// prueba: lenis.options.respectReducedMotion === true
// prueba: !("touchInertiaMultiplier" in lenis.options) && lenis.options.touchInertiaExponent === 1.7
```
