---
id: nuc-keyframes
titulo: keyframes - varios estados en un tween
capa: 02-nucleo
tipo: api
ambito: core
resumen: Las tres sintaxis (array de objetos, porcentajes, arrays por propiedad), cómo se combinan ease y easeEach, y sus diferencias de herencia.
api: [gsap.TweenVars.keyframes]
relacionadas: [nuc-tween-metodos, nuc-stagger, nuc-callbacks, tim-basico, eas-guia]
etiquetas: [keyframes, secuencia, css]
fuentes:
  - resources/keyframes.md
estado: verificado
version: 3.15.1
---
# keyframes

`keyframes` mueve los objetivos por una serie de estados dentro de un único `to()`: funciona como un timeline anidado en el tween. Sirve cuando encadenarías varios tweens sobre el mismo objetivo, y permite portar `@keyframes` de CSS. Solo se usan en tweens `to()`. [O]

## Firma

```text
keyframes: [ { x: 100, duration: 1 }, { y: 50, duration: 1, delay: 0.5 } ]      array de objetos
keyframes: { "0%": {...}, "50%": {...}, "100%": {...}, easeEach, ease }         porcentajes
keyframes: { x: [0, 100, 0], y: [0, 50], easeEach, ease }                       arrays por propiedad
```

| Sintaxis | Tiempo | Ease entre pasos, por defecto | Por paso | `easeEach` |
|---|---|---|---|---|
| Array de objetos | `duration` en cada paso; `delay` deja huecos o, si es negativo, solapa | `"none"` | Sí | No aplica |
| Porcentajes | `duration` del tween | `"power1.inOut"` | Sí | Sí |
| Arrays por propiedad | `duration` del tween; se reparte por igual | `"power1.inOut"` | No | Sí |

Hay dos niveles de ease, que se componen [O] [C]:

- **Entre pasos:** `easeEach`, o `ease` dentro de cada paso.
- **Sobre el conjunto:** `keyframes.ease`; si falta, `ease` del tween; si falta, `"none"`.

## Ejemplo

```js
const a = { x: 0, y: 0 };
const pasos = gsap.to(a, {
  keyframes: [
    { x: 100, duration: 0.1 },
    { y: 100, duration: 0.1 },
    { x: 0, duration: 0.1, delay: 0.05 },
  ],
  paused: true,
});

const b = { x: 0 };
const porcentajes = gsap.to(b, {
  keyframes: { "0%": { x: 0 }, "50%": { x: 100 }, "100%": { x: 0 }, easeEach: "none" },
  duration: 1,
  paused: true,
});
porcentajes.progress(0.25);
const enCuarto = b.x;

const c = { x: 0, y: 0 };
const arrays = gsap.to(c, { keyframes: { x: [0, 100, 0], y: [0, 40], easeEach: "none" }, duration: 1, paused: true });
arrays.progress(0.25);

// prueba: pasos.duration() === 0.35
// prueba: enCuarto === 50
// prueba: c.x === 50
// prueba: c.y === 10
```

Los arrays no necesitan la misma longitud: cada uno se reparte en toda la duración, de ahí que `y` valga 10 en el 25 %. [O] [E]

El `ease` del tween afecta a toda la secuencia:

```js
const uno = { x: 0 };
const dos = { x: 0 };
gsap.to(uno, { keyframes: [{ x: 100, duration: 1 }], paused: true }).progress(0.5);
gsap.to(dos, { keyframes: [{ x: 100, duration: 1 }], ease: "power2.in", paused: true }).progress(0.5);

// prueba: uno.x === 50
// prueba: dos.x === 12.5
```

## Trampas

- **`gsap.defaults({ ease })` no llega a los keyframes.** Se excluye a propósito: sin `ease` explícito, la secuencia es lineal aunque el proyecto tenga un ease global. Con array de objetos tampoco se hereda `duration`: cada paso debe llevar la suya. [C] [E]
- **`duration` del tween con array de objetos** no reparte nada: la duración sale de sumar los pasos. En porcentajes y arrays por propiedad es la del tween. [O]
- **Sin `100%`.** El último valor se alcanza en su porcentaje y queda quieto el resto de la duración: el tween no se acorta. [C] [E]
- **Sin `0%`.** Parte del valor actual, como un `to()`. [C]
- **Callbacks.** Solo los pasos de las sintaxis de objetos y porcentajes admiten `onStart`, `onComplete`, etc. Con `stagger`, se disparan por cada objetivo. [O] [E]
- **Mezclar claves.** Una propiedad fuera de `keyframes` se anima con el `ease` del tween durante toda la duración, en paralelo. Es útil, pero una misma propiedad dentro y fuera entra en conflicto. [O] [P]
- **`keyframes` en `from()` o `fromTo()`.** La documentación solo los admite en `to()`. No confíes en lo que resulte. [O]
- **`easeEach` en array de objetos.** No se lee: pon `ease` en cada paso. [C]
