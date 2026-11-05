---
id: ver-migracion-v3
titulo: Migrar de GSAP 1.x/2.x a GSAP 3
capa: 15-versiones
tipo: guia
ambito: transversal
resumen: Equivalencias de TweenMax, duración, eases, staggers, overwrite y plugins, qué sigue funcionando en 3.15.1 y qué ya no compila en TypeScript.
api: [gsap.to, gsap.timeline, gsap.defaults, gsap.config, gsap.getProperty, gsap.registerPlugin, gsap.globalTimeline, gsap.ticker.add, gsap.ticker.remove, gsap.parseEase, gsap.TweenVars.callbackScope, Timeline.getChildren]
relacionadas: [ver-historial, cal-errores-comunes, cal-conflictos, fun-plugins, svg-motionpath, int-inertia, nuc-stagger]
etiquetas: [migracion, legacy, tweenmax]
fuentes:
  - resources/3-migration.md
estado: verificado
version: 3.15.1
---
# Migrar de GSAP 1.x/2.x a GSAP 3

La mayor parte del código antiguo sigue funcionando en GSAP 3. Lo que hay que tocar es lo eliminado, y conviene modernizar lo demás porque la sintaxis nueva es más corta y las antiguas globales desaparecerán en GSAP 4. [O]

## Pasos

### 1. Comprueba qué funciona hoy

Comprobado en 3.15.1: la capa de compatibilidad sigue activa. [E]

```js
const estilo = TweenMax.to(".vieja", 0.05, { x: 10 });
const linea = new TimelineMax({ repeat: 1 });
linea.to(".vieja2", 0.05, { x: 5 });
const escalonado = TweenMax.staggerTo(".vieja3", 0.05, { x: 3 }, 0.01);
const conDuracion = gsap.to(".vieja4", 0.05, { x: 20 });

await new Promise((r) => setTimeout(r, 300));
// prueba: estilo instanceof gsap.core.Tween && linea instanceof gsap.core.Timeline
// prueba: escalonado instanceof gsap.core.Timeline
// prueba: Power2.easeOut === gsap.parseEase("power2.out") && Linear.easeNone === gsap.parseEase("none")
// prueba: gsap.getProperty(".vieja4", "x") === 20 && conDuracion.duration() === 0.05
```

| Funciona | Eliminado en 3.15.1 |
|---|---|
| `TweenMax`, `TweenLite`, `TimelineMax`, `TimelineLite` | `TweenMax.ticker` [E] |
| `gsap.to(objetivo, duracion, vars)` en ejecución | `TweenMax.killAll`, `pauseAll`, `getAllTweens` [E] |
| `Power2.easeOut`, `Linear.easeNone` | `gsap.ticker.addEventListener`, `useRAF` [E] |
| `TweenMax.staggerTo`, `tl.staggerTo` | Tampoco existe `gsap.staggerTo` [E] |

```js
// prueba: typeof TweenMax.ticker === "undefined" && typeof TweenMax.killAll === "undefined"
// prueba: typeof TweenMax.pauseAll === "undefined" && typeof TweenMax.getAllTweens === "undefined" && typeof gsap.staggerTo === "undefined"
// prueba: typeof gsap.ticker.addEventListener === "undefined" && typeof gsap.ticker.useRAF === "undefined"
```

**TypeScript es más estricto:** desde 3.14 la forma con duración en segundo lugar no compila (TS2554). Ver [historial](ver-historial.md). [C]

### 2. Moderniza la sintaxis

| Antiguo | GSAP 3 | |
|---|---|---|
| `TweenMax.to(el, 1, {x: 100})` | `gsap.to(el, {duration: 1, x: 100})` | [O] |
| `new TimelineMax({repeat: -1})` | `gsap.timeline({repeat: -1})` | Sin `new` [O] |
| `ease: Power3.easeInOut` | `ease: "power3.inOut"` | [O] |
| `ease: Sine.easeOut` | `ease: "sine"` | `.out` es el defecto [O] |
| `ease: Linear.easeNone` | `ease: "none"` | [O] |
| `Elastic.easeOut.config(1, 0.3)` | `"elastic(1, 0.3)"` | [O] |
| `SteppedEase.config(5)` | `"steps(5)"` | [O] |
| `TweenMax.staggerTo(el, .5, {...}, .1)` | `gsap.to(el, {..., stagger: 0.1})` | [O] |
| `cycle: {x: [-100, 100]}` | `x: gsap.utils.wrap([-100, 100])` | En cualquier tween [O] |
| `TweenLite.ticker.addEventListener("tick", f)` | `gsap.ticker.add(f)` | [O] |
| `CSSPlugin.suffixMap.left = "%"` | `gsap.config({units: {left: "%"}})` | [O] |
| `TweenLite.defaultEase`, `defaultOverwrite` | `gsap.defaults({...})` | [O] |
| `TweenLite.autoSleep`, `CSSPlugin.defaultForce3D` | `gsap.config({...})` | [O] |
| `el._gsTransform.x` | `gsap.getProperty(el, "x")` | [O] |
| `TweenMax.pauseAll()` | `gsap.globalTimeline.pause()` | [O] |
| `TweenMax.killAll()` | `gsap.globalTimeline.clear()` | [O] |
| `TweenMax.globalTimeScale(.5)` | `gsap.globalTimeline.timeScale(0.5)` | [O] |
| `onCompleteScope: obj` | `callbackScope: obj` o `.bind(obj)` | [O] |
| `"{self}"` en `onCompleteParams` | `this` en una `function` | [O] |
| `this.target` | `this.targets()`, un array | [O] |
| `timeline.addCallback()` | `timeline.call()` | [O] |

`RoughEase`, `SlowMo` y `ExpoScaleEase` no están en el núcleo: van en `EasePack`. [O]

```js fragmento
gsap.registerPlugin(EasePack);
gsap.to(".nube", { y: 30, ease: "rough({ points: 20 })" });
```

### 3. Corrige lo que cambió de comportamiento

**`overwrite`** era `"auto"`, y ahora es `false`. Si el proyecto depende del comportamiento antiguo, una línea lo restaura. Ver [conflictos](../13-calidad/cal-conflictos.md). [O]

```js
gsap.defaults({ overwrite: "auto" });
gsap.to(".solapada", { x: 100, duration: 0.2 });
gsap.to(".solapada", { x: 0, duration: 0.05, delay: 0.02 });
await new Promise((r) => setTimeout(r, 400));
gsap.defaults({ overwrite: false });
// prueba: gsap.getProperty(".solapada", "x") === 0
```

Los modos `concurrent`, `preexisting` y `allOnStart` ya no existen. `onOverwrite` se reemplazó por `onInterrupt`. [O]

**`timeScale` y `reversed` están ligados.** Un `timeScale` negativo reproduce hacia atrás, y `reverse()` invierte su signo. [O]

```js
const anim = gsap.to(".tiempo", { x: 100, duration: 1, paused: true }).timeScale(0.5);
anim.reverse();
// prueba: anim.timeScale() === -0.5 && anim.reversed() === true
```

**`stagger` legado devuelve un timeline**, no un array: usa `getChildren()` si dependías del array. [O]

**Repetición en stagger.** `repeat` en el tween repite el conjunto entero. Dentro de `stagger`, cada subtween se repite por su cuenta. Lo mismo vale para `yoyo` y `onComplete`. [O]

### 4. Sustituye lo eliminado

| Antiguo | Sustituto |
|---|---|
| Tweens de `className` | Anima propiedades y añade la clase en `onComplete` [O] |
| `BezierPlugin` | `MotionPathPlugin`: `bezier: [...]` pasa a `motionPath: [...]`. `type: "soft"` no tiene equivalente directo [O] |
| `ColorPropsPlugin` | Innecesario: el núcleo anima colores [O] |
| `ThrowPropsPlugin` | `InertiaPlugin` [O] |
| `RoundPropsPlugin` | `SnapPlugin`, aunque el antiguo sigue incluido [O] |
| `skewType`, `CSSPlugin.defaultSkewType` | Eliminados; hay un helper `compensatedSkew` [O] |
| `TweenLite.selector` | `querySelectorAll`, ya lo hace GSAP [O] |

```js
let clases = false;
gsap.to(".marcar", {
  backgroundColor: "red",
  duration: 0.05,
  onComplete: function () {
    this.targets().forEach((el) => el.classList.add("activa"));
    clases = document.querySelectorAll(".marcar.activa").length === 3;
  },
});
await new Promise((r) => setTimeout(r, 200));
// prueba: clases === true
```

### 5. Registra los plugins

Los plugins distintos de los del núcleo (`CSSPlugin`, `AttrPlugin`, `ModifiersPlugin`, `SnapPlugin`) requieren `gsap.registerPlugin()`. También sirve para que el *tree shaking* no los descarte: es la causa habitual de "solo falla en producción". [O]

```js fragmento
gsap.registerPlugin(MotionPathPlugin, TextPlugin, MorphSVGPlugin);
```

## Trampas

- **Búsqueda y reemplazo.** Sustituye `"new TimelineMax("` por `"gsap.timeline("` dejando abierto el paréntesis, para conservar `vars`. [O]
- **Flechas en callbacks.** `this` deja de ser el tween. Usa `function`. Ver [errores comunes](../13-calidad/cal-errores-comunes.md). [O]
- **`overwrite` y fallos sin error.** Si tras migrar aparece un comportamiento raro sin avisos, prueba `gsap.defaults({ overwrite: "auto" })`. Si desaparece, había un conflicto. [O]
- **Valores de inicio con `translate(-50%, -50%)` en CSS.** GSAP detecta ese caso exacto y usa `xPercent`/`yPercent`. Cualquier otro, fíjalo en GSAP. [O]
- **Las globales antiguas no llegarán a GSAP 4.** Que funcionen no significa que debas dejarlas. [O]
- **Tipos de 2.x.** `@types/gsap` es de otra época: desinstálalo, porque GSAP 3 trae los suyos. [P]
