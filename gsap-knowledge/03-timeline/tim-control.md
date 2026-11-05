---
id: tim-control
titulo: Controlar una timeline
capa: 03-timeline
tipo: api
ambito: core
resumen: Reproducir, saltar, repetir, cambiar duración y pausar en puntos concretos. addPause, removePause, tweenTo, tweenFromTo y las diferencias con un tween.
api: [Timeline.addPause, Timeline.removePause, Timeline.tweenTo, Timeline.tweenFromTo, Animation.play, Animation.pause, Animation.seek, Animation.reverse, Animation.restart, Animation.resume, Animation.progress, Animation.totalProgress, Animation.time, Animation.totalTime, Animation.timeScale, Animation.duration, Animation.totalDuration, Animation.iteration, Animation.isActive, Animation.then]
requiere: [tim-basico, tim-etiquetas]
relacionadas: [nuc-control, nuc-tiempo, nuc-promesas, tim-gestion, scr-scrub]
etiquetas: [timeline, control, pausa]
fuentes:
  - docs/v3/GSAP/Timeline/addPause().md
  - docs/v3/GSAP/Timeline/removePause().md
  - docs/v3/GSAP/Timeline/tweenTo().md
  - docs/v3/GSAP/Timeline/tweenFromTo().md
  - docs/v3/GSAP/Timeline/duration().md
  - docs/v3/GSAP/Timeline/totalDuration().md
  - docs/v3/GSAP/Timeline/seek().md
  - docs/v3/GSAP/Timeline/then().md
  - docs/v3/GSAP/Timeline/isActive().md
  - docs/v3/GSAP/Timeline/invalidate().md
estado: verificado
version: 3.15.1
---
# Controlar una timeline

Una timeline comparte con el tween `play()`, `pause()`, `reverse()`, `seek()`, `progress()`, `timeScale()` y demás: están en [control](../02-nucleo/nuc-control.md) y [tiempo](../02-nucleo/nuc-tiempo.md). Esta ficha recoge lo que cambia al usarlos en una timeline y lo que solo existe en ella. [O]

## Firma

```text
tl.addPause(posicion?, callback?, params?)   → tl
tl.removePause(posicion)                     → undefined (ver Trampas)
tl.tweenTo(posicion, vars?)                  → Tween
tl.tweenFromTo(desde, hasta, vars?)          → Tween
```

| Método | Particularidad en una timeline |
|---|---|
| `seek(pos, suppressEvents?)` | Acepta posición con etiquetas. Por defecto **no** dispara callbacks al pasar por encima [C] |
| `play(pos)`, `reverse(pos)` | También aceptan etiqueta [O] |
| `duration()` | La marcan los hijos. Como setter cambia `timeScale()`, no la duración leída [O] |
| `totalDuration()` | Incluye `repeat` y `repeatDelay`. Como setter también cambia `timeScale()` [O] |
| `progress()` | Sobre una iteración. `totalProgress()` sobre el total [O] |
| `then()` | Promesa que se resuelve al completar. Ver [promesas](../02-nucleo/nuc-promesas.md) [O] |
| `isActive()` | `true` solo si el cabezal se mueve en su tramo y ningún ancestro está pausado [O] |
| `invalidate()` | Borra los valores registrados de todos los hijos [O] |

`addPause()` inserta un hijo de duración 0 que pausa y, tras pausar, llama a tu función. A diferencia de `tl.call(() => tl.pause())`, recoloca el cabezal exactamente en ese punto, aunque el tick lo hubiera sobrepasado. Así un `reverse()` posterior no vuelve a caer de inmediato en la misma pausa. [O] [C]

`tweenTo()` crea un tween que anima `time()` de la timeline. Por defecto es lineal (`ease: "none"`), su duración es la que tomaría llegar con el `timeScale` actual y la timeline se pausa cuando empieza. [C]

## Ejemplo

Secuencia por pasos con pausa en cada capítulo:

```js
const registro = [];
const pasos = gsap.timeline();

pasos
  .to({ a: 0 }, { a: 1, duration: 0.05 })
  .addPause("+=0", (texto) => registro.push(texto), ["capitulo-1"])
  .to({ b: 0 }, { b: 1, duration: 0.05 });

await new Promise((r) => setTimeout(r, 200));
const enPausa = [pasos.paused(), pasos.time()];

pasos.play();
await new Promise((r) => setTimeout(r, 200));

// prueba: enPausa[0] === true && enPausa[1] === 0.05
// prueba: registro[0] === "capitulo-1"
// prueba: Math.abs(pasos.time() - 0.1) < 0.0001
```

Navegación por etiquetas, que anima el cabezal en lugar de saltar:

```js
const estado = { x: 0 };
const visor = gsap.timeline({ paused: true });
visor.to(estado, { x: 10, duration: 1, ease: "none" }).addLabel("fin");

const paseo = visor.tweenTo("fin", { duration: 0.05 });
const linea = paseo.vars.ease;

await new Promise((r) => setTimeout(r, 200));

// prueba: linea === "none"
// prueba: estado.x === 10
// prueba: visor.paused() === true
// prueba: visor.reversed() === false
```

`tweenTo()` hacia atrás no toca `reversed()`, y `"+=50%"` en `addPause()` son segundos:

```js
const dato = { x: 0 };
const vuelta = gsap.timeline({ paused: true });
vuelta.to(dato, { x: 10, duration: 1, ease: "none" }).progress(1);
vuelta.tweenTo(0, { duration: 0.02 });
await new Promise((r) => setTimeout(r, 100));

const conMargen = gsap.timeline({ paused: true });
conMargen.to({ a: 0 }, { a: 1, duration: 10 }).addPause("+=50%");

// prueba: dato.x === 0 && vuelta.time() === 0
// prueba: vuelta.reversed() === false && vuelta.paused() === true
// prueba: conMargen.getChildren()[1].startTime() === 60
```

Ajustar una secuencia a un tiempo total sin tocar los hijos: [E]

```js
const ajuste = gsap.timeline({ repeat: 2, repeatDelay: 1, paused: true });
ajuste.to({ a: 0 }, { a: 1, duration: 1 });
const leidoAntes = [ajuste.duration(), ajuste.totalDuration()];

ajuste.totalDuration(2.5);

// prueba: leidoAntes.join() === "1,5"
// prueba: ajuste.timeScale() === 2
// prueba: ajuste.duration() === 1
// prueba: ajuste.totalDuration() === 5
```

Tras cambiar la velocidad, `duration()` y `totalDuration()` siguen leyendo el valor interno, sin escalar. Mide el tiempo real con `tl.totalDuration() / tl.timeScale()`. [E]

`repeatRefresh` vuelve a calcular los valores en cada iteración completa. Con relativos, acumula: [E]

```js
const acumula = { x: 0 };
gsap.timeline({ repeat: 2, repeatRefresh: true }).to(acumula, { x: "+=10", duration: 0.05 });

const fija = { x: 0 };
gsap.timeline({ repeat: 2 }).to(fija, { x: "+=10", duration: 0.05 });

await new Promise((r) => setTimeout(r, 300));

// prueba: acumula.x === 30
// prueba: fija.x === 10
```

## Trampas

- **`seek()` no dispara callbacks.** Los eventos y `call()` que quedan atrás se omiten salvo `seek(t, false)`. [E]

```js
let veces = 0;
const tl = gsap.timeline({ paused: true });
tl.call(() => veces++, null, 0.5).to({ a: 0 }, { a: 1, duration: 1 }, 0);

tl.seek(1);
const silencioso = veces;

tl.seek(0);
tl.seek(1, false);

// prueba: silencioso === 0
// prueba: veces === 1
```

- **`tweenTo()` deja la timeline pausada al acabar.** Si debe seguir, usa `onComplete` para llamar a `resume()`. No cambia `reversed()`, aunque vaya hacia atrás. [O] [E]
- **`tweenTo()` calcula la duración al arrancar.** Antes de eso el tween no sabe de dónde saldrá el cabezal. Al encadenar varios en una maestra usa `tweenFromTo()`, cuya duración se conoce al crearlo. [O]
- **`tweenFromTo()` no mueve el cabezal hasta el primer render.** Justo tras llamarlo, `tl.time()` y `tl.paused()` son los de antes, salvo que pases `immediateRender: true` [C]. [E]

```js
const previa = gsap.timeline();
previa.to({ a: 0 }, { a: 1, duration: 1 });
previa.seek(0.5);

const salto = previa.tweenFromTo(0, 1, { duration: 0.05 });
const justoDespues = [previa.paused(), previa.time()];

await new Promise((r) => setTimeout(r, 200));

// prueba: justoDespues[0] === false && justoDespues[1] === 0.5
// prueba: previa.paused() === true
// prueba: previa.time() === 1
```

- **`removePause()` no devuelve la timeline**, pese a la documentación, y corta la cadena. [E]

```js
const conPausa = gsap.timeline({ paused: true });
conPausa.to({ a: 0 }, { a: 1, duration: 1 }).addPause(1).to({ a: 0 }, { a: 1, duration: 1 });
const antes = conPausa.getChildren().length;
const devuelve = conPausa.removePause(1);

// prueba: devuelve === undefined
// prueba: antes === 3
// prueba: conPausa.getChildren().length === 2
```

- **`duration(n)` no cambia `duration()`.** Ajusta `timeScale()` y sigue leyendo lo mismo. Añadir hijos después altera el total, pero no reescala. [O]
- **`addPause()` con `"+=50%"`** significa 50 s, no un porcentaje. Ver [posición](tim-posicion.md). [E]
- **`repeatRefresh` no recalcula `duration`, `delay` ni `stagger`**, solo los valores de inicio y fin. [O]
- **`then()` en una timeline `repeat: -1`** nunca se resuelve. [P]
- **En `reverse()` sin argumento**, la timeline parte del punto actual. Una timeline recién creada está en 0, así que `reverse()` no hace nada visible: usa `tl.reverse(0)` para partir del final. [C]
