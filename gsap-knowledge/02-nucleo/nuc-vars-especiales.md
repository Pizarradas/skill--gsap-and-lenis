---
id: nuc-vars-especiales
titulo: Propiedades especiales de vars
capa: 02-nucleo
tipo: referencia
ambito: core
resumen: Catálogo de claves reservadas de vars - tiempo, ease, repetición, render, control y callbacks - con valor por defecto y ficha donde se detallan.
api: [gsap.AnimationVars.data, gsap.AnimationVars.id, gsap.AnimationVars.inherit, gsap.AnimationVars.paused, gsap.AnimationVars.repeat, gsap.AnimationVars.repeatDelay, gsap.AnimationVars.repeatRefresh, gsap.AnimationVars.reversed, gsap.AnimationVars.yoyo, gsap.AnimationVars.scrollTrigger, gsap.TweenVars.delay, gsap.TweenVars.duration, gsap.TweenVars.ease, gsap.TweenVars.endArray, gsap.TweenVars.immediateRender, gsap.TweenVars.lazy, gsap.TweenVars.keyframes, gsap.TweenVars.overwrite, gsap.TweenVars.runBackwards, gsap.TweenVars.stagger, gsap.TweenVars.startAt, gsap.TweenVars.yoyoEase, gsap.TweenVars.easeReverse]
relacionadas: [nuc-tween-metodos, nuc-callbacks, nuc-repeat-yoyo, nuc-immediate-render, nuc-overwrite, nuc-defaults-config]
etiquetas: [vars, referencia, opciones]
fuentes:
  - docs/v3/GSAP/Tween/vars.md
  - docs/v3/GSAP/gsap.to().md
estado: verificado
version: 3.15.1
---
# Propiedades especiales de vars

Estas claves están reservadas: GSAP las interpreta como configuración y no las anima. El resto de claves se tratan como propiedades o plugins. Si tu objeto propio tiene una propiedad llamada igual (`delay`, `data`, `ease`), no podrás animarla directamente: usa un método `set` o un objeto intermedio. [O] [C]

## Tiempo y curva

| Clave | Por defecto | Efecto |
|---|---|---|
| `duration` | `0.5` | Segundos. Admite función o `"random()"`, lo que crea un timeline interno [O] [C] |
| `delay` | `0` | Segundos antes de empezar. Igual que `duration`, admite función |
| `ease` | `"power1.out"` | Cadena o función de progreso. Ver `eas-guia` [O] |
| `stagger` | | Escalona varios objetivos: ver [stagger](nuc-stagger.md) [O] |
| `keyframes` | | Secuencia dentro del tween: ver [keyframes](nuc-keyframes.md) [O] |

## Repetición

| Clave | Por defecto | Efecto |
|---|---|---|
| `repeat` | `0` | Repeticiones extra; `-1` es infinito [O] |
| `repeatDelay` | `0` | Pausa entre repeticiones [O] |
| `repeatRefresh` | `false` | Reinicializa valores en cada vuelta completa [O] |
| `yoyo` | `false` | Alterna el sentido en cada repetición [O] |
| `easeReverse` | `false` | Ease al invertir sentido, desde 3.15.0 [O] |
| `yoyoEase` | `false` | **Obsoleta** desde 3.15.0, reemplazada por `easeReverse` [O] [C] |

Detalle en [repeat y yoyo](nuc-repeat-yoyo.md).

## Render y valores

| Clave | Por defecto | Efecto |
|---|---|---|
| `immediateRender` | `false` en `to()`, `true` en `from()` y `fromTo()` | Ver [immediateRender](nuc-immediate-render.md) [O] |
| `lazy` | `true`, salvo duración 0 | Difiere la primera escritura al final del tick para no alternar lecturas y escrituras [O] |
| `startAt` | | Valores que se fijan justo antes de empezar, aunque no se animen [O] |
| `runBackwards` | `false` | Invierte inicio y fin: es lo que hace `from()` por dentro. El ease no se invierte [O] [E] |
| `overwrite` | `false` | Ver [overwrite](nuc-overwrite.md) [O] |
| `endArray` | | Destino para un array numérico: ver [objetivos](../01-fundamentos/fun-objetivos.md) |

## Control e identidad

| Clave | Por defecto | Efecto |
|---|---|---|
| `paused` | `false` | Nace pausada [O] |
| `reversed` | `false` | Nace invertida, así que parece pausada: su cabezal ya está en 0 [O] [E] |
| `id` | | Permite `gsap.getById()` y aparece en GSDevTools [O] |
| `data` | | Se copia a `animation.data` [O] |
| `inherit` | `true` | `false` corta la herencia de defaults. Ver la trampa de abajo [O] [E] |
| `scrollTrigger` | | Vincula un ScrollTrigger: ver `scr-scrolltrigger` |
| `callbackScope` | | `this` de los callbacks: ver [callbacks](nuc-callbacks.md) [O] |

Callbacks: `onStart`, `onUpdate`, `onComplete`, `onRepeat`, `onReverseComplete` y `onInterrupt`, cada uno con su variante `...Params`. Ver [callbacks](nuc-callbacks.md). Otras claves como `parent`, `stringFilter` y `autoRevert` también son reservadas: las usa GSAP internamente. [C]

Las claves de plugins (`attr`, `motionPath`, `scrollTo`...) están en [plugins](../01-fundamentos/fun-plugins.md).

## Ejemplo

`inherit: false` corta **también** los `gsap.defaults()`, incluida la duración de 0.5:

```js
const normal = gsap.to({ x: 0 }, { x: 1, paused: true });
const sinHerencia = gsap.to({ x: 0 }, { x: 1, inherit: false, paused: true });

const conData = gsap.to({ x: 0 }, { x: 1, data: { rol: "demo" }, paused: true });

// prueba: normal.duration() === 0.5
// prueba: sinHerencia.duration() === 0
// prueba: conData.data.rol === "demo"
```

## Trampas

- **`inherit: false` sin `duration`.** El tween pasa a durar 0 y salta al final, porque la duración por defecto también viene de una herencia, la del timeline raíz. Declara `duration` en ese tween. [C] [E]
- **`yoyoEase` en código nuevo.** Una página oficial la sigue describiendo como vigente y otra como obsoleta; los tipos la marcan `@deprecated`. Usa `easeReverse`. [C]
- **`repeat` en keyframes o en stagger** se aplica a un nivel distinto. Revisa [stagger](nuc-stagger.md) antes de anidarlo. [O]
- **`lazy: false` por rutina.** Solo tiene sentido si lees el valor en la misma pila; lo normal es no tocarlo. [O]
