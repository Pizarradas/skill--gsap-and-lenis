---
id: fun-que-es
titulo: Qué es GSAP y qué incluye
capa: 01-fundamentos
tipo: concepto
ambito: transversal
resumen: Mapa de GSAP - núcleo, plugins, Tween y Timeline, qué sabe animar y cuándo compensa frente a CSS. Punto de entrada del sistema.
api: [gsap.to, gsap.timeline, gsap.version]
relacionadas: [fun-instalacion, fun-modelo, fun-plugins, fun-licencia, nuc-tween-metodos, nuc-context, tim-basico, utl-funciones, fra-agnostico]
etiquetas: [introduccion, mapa]
fuentes:
  - docs/v3.md
  - docs/v3/GSAP.md
  - docs/v3/GSAP/gsap.utils.md
  - resources/get-started.md
estado: verificado
version: 3.15.1
---
# Qué es GSAP

GSAP (GreenSock Animation Platform) es una biblioteca JavaScript que cambia valores a lo largo del tiempo. No es exclusiva de CSS: anima cualquier propiedad numérica de cualquier objeto que JavaScript pueda tocar (DOM, SVG, canvas, Three.js, objetos propios) y funciona con cualquier framework. [O]

## Modelo mental

| Pieza | Qué es | Dónde se explica |
|---|---|---|
| `gsap` | Objeto de entrada: crea animaciones y expone utilidades | [Métodos de tween](../02-nucleo/nuc-tween-metodos.md) |
| Tween | Una animación: objetivos + duración + valores. Es quien escribe propiedades | [Modelo de animación](fun-modelo.md) |
| Timeline | Contenedor de tweens y de otros timelines. Solo coordina tiempos, nunca escribe propiedades | `tim-basico` |
| Plugin | Capacidad opcional que se registra aparte | [Plugins](fun-plugins.md) |
| Ticker | Bucle que hace avanzar todo en cada frame | [Ticker](../02-nucleo/nuc-ticker.md) |

Tanto Tween como Timeline heredan de `Animation`, así que comparten los mismos métodos de control: `play()`, `pause()`, `reverse()`, `seek()`, `timeScale()`, `kill()`. [O]

### Qué trae el núcleo y qué no

- **Núcleo:** Tween, Timeline, CSS, atributos (`attr`), arrays (`endArray`), eases estándar, staggers, callbacks, `snap`, `modifiers`, keyframes, ticker con suavizado de lag, `gsap.context()`, `gsap.matchMedia()` y `gsap.utils`. [O]
- **Plugins:** scroll (ScrollTrigger, ScrollTo, ScrollSmoother), texto (SplitText, ScrambleText, Text), SVG (DrawSVG, MorphSVG, MotionPath, MotionPathHelper), interacción (Flip, Draggable, Inertia, Observer), otros (Physics2D, PhysicsProps, GSDevTools, Easel, Pixi) y eases extra (CustomEase, EasePack, CustomWiggle, CustomBounce). [O]
- **Integración con cualquier tecnología:** no hace falta nada específico. `gsap.context()` agrupa lo creado por una vista y lo revierte al retirarla. Ver `fra-agnostico`. [O] [P]
- **Utilidades:** `gsap.utils` agrupa funciones puras (`clamp`, `mapRange`, `snap`, `wrap`, `toArray`, `pipe`...). Casi todas devuelven una función reutilizable si omites el valor. Ver `utl-funciones`. [O]

### Cuándo compensa frente a CSS o Web Animations

Criterio de este sistema [P]:

| Necesidad | Herramienta razonable |
|---|---|
| Un `hover` o una transición de dos estados | CSS |
| Secuencias, solapes, control (pausar, invertir, saltar) | GSAP |
| Animar según scroll, arrastre o física | GSAP con plugin |
| Animar SVG, canvas, WebGL u objetos propios | GSAP |
| Un valor que cambia decenas de veces por segundo | `gsap.quickTo()` o `gsap.quickSetter()` |

## Ejemplo

Los tres métodos habituales sobre tres elementos y, después, una secuencia:

```js
gsap.to(".caja-a", { x: 100, duration: 0.2 });              // desde el estado actual hasta x = 100
gsap.from(".caja-b", { x: -100, duration: 0.2 });           // desde x = -100 hasta el estado actual
gsap.fromTo(".caja-c", { x: -50 }, { x: 50, duration: 0.2 }); // define inicio y fin

const secuencia = gsap.timeline();
secuencia
  .to(".pieza-1", { x: 40, duration: 0.1 })
  .to(".pieza-2", { x: 40, duration: 0.1 });

// prueba: gsap.getProperty(".caja-a", "x") === 100
// prueba: gsap.getProperty(".caja-b", "x") === 0
// prueba: gsap.getProperty(".caja-c", "x") === 50
// prueba: secuencia.duration() === 0.2
// prueba: gsap.version === "3.15.1"
```

## Trampas

- **Un `gsap.to()` suelto ya funciona.** Se reproduce solo y al terminar queda libre para el recolector; guarda la referencia únicamente si vas a controlarlo después. [O]
- **Secuenciar con `delay` escala mal.** Cambiar una duración obliga a recalcular todos los retardos siguientes. Usa Timeline para cualquier secuencia que no sea trivial. [O]
- **Registrar no es cargar.** `gsap.registerPlugin()` no sustituye al `import` o al `<script>` del plugin: ver [plugins](fun-plugins.md). [O]
- **Mucho material antiguo describe APIs ya retiradas** (`TweenMax`, `TimelineLite`, duración como segundo argumento). En 3.15.1 siguen exportándose como alias [C], pero el código nuevo debe usar `gsap.to()` y `gsap.timeline()`. Ver `ver-migracion-v3`.
- **La licencia no es MIT.** Es gratuita pero tiene restricciones: ver [licencia](fun-licencia.md). [O]
