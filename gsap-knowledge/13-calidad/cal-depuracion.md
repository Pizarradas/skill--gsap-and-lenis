---
id: cal-depuracion
titulo: Depurar animaciones GSAP
capa: 13-calidad
tipo: guia
ambito: transversal
resumen: Método en cinco pasos, avisos de consola y su causa, inspección de tweens activos, ralentizar todo, marcadores y GSDevTools.
api: [gsap.getTweensOf, gsap.getById, gsap.globalTimeline, gsap.exportRoot, gsap.version, gsap.GSAPConfig.nullTargetWarn, Timeline.getChildren, ScrollTrigger.getAll, ScrollTrigger.getById, GSDevTools.create]
relacionadas: [cal-errores-comunes, cal-st-errores, esp-gsdevtools, nuc-global, cal-conflictos]
etiquetas: [depuracion, consola, avisos, gsdevtools]
fuentes:
  - resources/st-mistakes.md
  - docs/v3/GSAP/gsap.getTweensOf().md
  - docs/v3/GSAP/gsap.globalTimeline.md
estado: verificado
version: 3.15.1
---
# Depurar animaciones GSAP

Un método para aislar el fallo y las herramientas para ver qué está haciendo GSAP en ese momento.

## Pasos

1. **Lee la consola.** Consulta la tabla de avisos.
2. **Comprueba versión y plugins** con `gsap.version`. Dos copias cargadas explican muchos misterios.
3. **Aísla.** Quita ScrollTrigger, framework y demás. Si funciona, añade piezas de una en una. [O]
4. **Ralentiza.** `gsap.globalTimeline.timeScale(0.2)` alarga todo y hace visibles los saltos. [O]
5. **Inspecciona** qué tweens hay activos sobre el elemento, y sus valores.

## Avisos de consola

Textos literales del código de 3.15.1. [C]

| Aviso | Causa | Corrección |
|---|---|---|
| `GSAP target .x not found` | El selector no coincide o aún no hay DOM | Crea la animación cuando la vista exista, revisa el ámbito |
| `Invalid property x set to y Missing plugin?` | Errata o plugin sin registrar | `registerPlugin` |
| `x not eligible for reset. Try splitting into individual properties` | `quickTo` sobre `borderRadius` u otra propiedad compuesta | Usa una propiedad individual |
| `Invalid scope` | El ámbito de `gsap.context` o `selector` no es un elemento, o la referencia aún está vacía | Pasa el elemento real, ya creado |
| `Element not found: …` | `Flip`, o un objetivo de `Observer`/ScrollTrigger inexistente | Revisa el objetivo |
| `Please gsap.registerPlugin(X)` | Un plugin se usó sin registrar | `registerPlugin` |
| `Not a valid state object.` | `Flip.from` recibió otra cosa | Pasa el retorno de `Flip.getState` |
| `No inertia tracking on … InertiaPlugin.track(target) first.` | `velocity: "auto"` sin seguimiento | Llama a `InertiaPlugin.track()` |
| `scrollTo target doesn't exist. Using 0` | Destino de `scrollTo` no encontrado | Revisa el selector |
| `GSDevTools can't work with ScrollTrigger-based animations` | Dos controladores para el mismo cabezal | Quita uno de los dos |
| `Requires GSAP 3.11.0 or later` | ScrollTrigger reciente con núcleo viejo | Alinea versiones |

`Invalid property` aparece al inicializar el tween, en el siguiente tick, no en la línea donde se creó. [E]

`gsap.config({ nullTargetWarn: false })` silencia el aviso de objetivos nulos; útil en listas que pueden estar vacías. [O] Compruébalo:

```js
const avisos = [];
const original = console.warn;
console.warn = (...m) => avisos.push(m.join(" "));

const selector = ".no" + "-existe";
gsap.to(selector, { x: 1 });
gsap.config({ nullTargetWarn: false });
gsap.to(selector, { x: 1 });
gsap.config({ nullTargetWarn: true });

console.warn = original;
// prueba: avisos.length === 1 && avisos[0].includes("not found")
```

## Inspeccionar

```js
const caja = document.querySelector(".caja");
const animacion = gsap.to(caja, { x: 100, duration: 0.3, id: "entrada" });
await new Promise((r) => setTimeout(r, 60));

const activos = gsap.getTweensOf(caja).length;
const porId = gsap.getById("entrada") === animacion;
const raiz = gsap.globalTimeline.getChildren(true, true, true).length;
const version = gsap.version;
const inicio = gsap.getProperty(caja, "x");
// prueba: activos === 1 && porId && raiz >= 1 && version === "3.15.1" && inicio > 0
```

| Pregunta | Herramienta |
|---|---|
| ¿Qué tweens afectan a este elemento? | `gsap.getTweensOf(el)` |
| ¿Hay un conflicto? | Dos resultados activos, o `gsap.getTweensOf(el, true)` para ver solo activos [O] |
| ¿Dónde va la animación? | `anim.progress()`, `anim.time()`, `anim.isActive()` |
| ¿Qué contiene un timeline? | `tl.getChildren()` |
| ¿Sigue vivo el tween de scroll? | `ScrollTrigger.getAll()`, `ScrollTrigger.getById(id)` |
| ¿Qué valor tiene de verdad? | `gsap.getProperty(el, "x")`: las transformaciones no se leen bien del CSS |
| ¿A qué objetivos afecta? | `tween.targets()` |

## Ver

- **Marcadores:** `markers: true` en ScrollTrigger dibuja `start`, `end` y `scroller`. Con `id`, se etiquetan. [O]
- **Cabezal manual:** `tl.pause().progress(0.5)` en la consola congela un instante. Ponle `window.tl = tl` mientras depuras. [P]
- **GSDevTools:** una barra para moverse por la línea de tiempo, cambiar velocidad y repetir un tramo. No funciona con animaciones controladas por ScrollTrigger. [C]

```js
const devtools = GSDevTools.create({ animation: gsap.timeline().to(".visor", { x: 50, duration: 0.2 }) });
await new Promise((r) => setTimeout(r, 300));
// prueba: document.querySelector(".gs-dev-tools") !== null
```

- **Ralentizar solo tu escena:** `gsap.exportRoot()` envuelve lo existente en un timeline propio, sin tocar lo creado después. [O]

## Trampas

- **`timeScale(0)` global** congela también los ScrollTrigger con `scrub` numérico: si olvidas restaurarlo, parece un bug. [P]
- **`getProperty` tras crear un `from()`.** En la misma línea el resultado depende del frame: GSAP puede diferir la primera escritura (`lazy`, condición en `gsap-core.js:303`) y devolver el valor previo o ya el inicial. No leas ahí; si lo necesitas, usa `lazy: false`. [C] [E]

```js
gsap.from(".perezosa", { x: 100, duration: 0.2, lazy: false });
const enLaMismaLinea = gsap.getProperty(".perezosa", "x");
// prueba: enLaMismaLinea === 100
```

- **No compares cadenas de `transform` ni textos de error.** GSAP escribe `translate(20px, 0px)`, pero el navegador la serializa al leerla: Chrome la devuelve igual y Firefox da `translate(20px)`. Lo mismo con `transformOrigin`, `0% 100%` frente a `0% 100% 0px`. Compara el número: `gsap.getProperty()` da la caché, y `new DOMMatrix()` lo que el navegador aplica, sobre `getComputedStyle(el).transform` o una cadena sin porcentajes. Los mensajes de excepción también son del motor: comprueba el tipo. El ancho de la barra de scroll cambia, y es 0 en Firefox sin interfaz: mídelo. [E]

```js
const leida = document.querySelector(".leida");
gsap.set(leida, { x: 20, scale: 2 });
const matriz = new DOMMatrix(getComputedStyle(leida).transform);

let fallo = null;
try { JSON.parse("{"); } catch (e) { fallo = e; }

// prueba: matriz.m41 === 20 && matriz.a === 2
// prueba: gsap.getProperty(leida, "x") === 20
// prueba: fallo instanceof SyntaxError
```

- **Solo falla en producción:** revisa `registerPlugin` (tree shaking), orden de scripts en CMS y variables de `NODE_ENV`. [P]
- **Solo falla en desarrollo, con animaciones duplicadas o `from()` que no llega:** tu inicialización corre dos veces, por un script incluido dos veces, una recarga en caliente o un modo de desarrollo. Aplica `montar → desmontar → montar`, y revisa [fra-agnostico](../12-frameworks/fra-agnostico.md). [P]
- **Un iframe o pestaña oculta** frena `requestAnimationFrame`, y al volver `lagSmoothing` ajusta el tiempo. No es un fallo de GSAP. [O]
- **Quita `markers` y `window.tl`** antes de publicar: se olvidan con facilidad. [P]
