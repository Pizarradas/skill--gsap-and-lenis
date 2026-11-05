---
id: nuc-tiempo
titulo: Propiedades de tiempo - time, progress, duration, timeScale
capa: 02-nucleo
tipo: api
ambito: core
resumen: Diferencia entre time y totalTime, progress y totalProgress, duration y totalDuration; timeScale, delay, startTime, endTime y globalTime.
api: [Animation.time, Animation.totalTime, Animation.progress, Animation.totalProgress, Animation.duration, Animation.totalDuration, Animation.timeScale, Animation.delay, Animation.startTime, Animation.endTime, Animation.rawTime, Tween.ratio]
relacionadas: [fun-modelo, nuc-control, nuc-repeat-yoyo, nuc-global, tim-posicion]
etiquetas: [tiempo, progreso, timescale]
fuentes:
  - docs/v3/GSAP/Tween/time().md
  - docs/v3/GSAP/Tween/totalTime().md
  - docs/v3/GSAP/Tween/progress().md
  - docs/v3/GSAP/Tween/totalProgress().md
  - docs/v3/GSAP/Tween/duration().md
  - docs/v3/GSAP/Tween/totalDuration().md
  - docs/v3/GSAP/Tween/timeScale().md
  - docs/v3/GSAP/Tween/delay().md
  - docs/v3/GSAP/Tween/startTime().md
  - docs/v3/GSAP/Tween/endTime().md
  - docs/v3/GSAP/Tween/globalTime().md
estado: verificado
version: 3.15.1
---
# Propiedades de tiempo

Cada animación expone su cabezal de varias formas. La distinción clave es si la medida es **de una vuelta** o **incluye repeticiones**. Sin argumento leen; con él escriben y devuelven la instancia. [O]

## Firma

| Una vuelta | Con repeticiones y `repeatDelay` |
|---|---|
| `time(valor?, suprimir = false)` | `totalTime(valor?, suprimir = false)` |
| `progress(valor?, suprimir = false)` | `totalProgress(valor?, suprimir = false)` |
| `duration(valor?)` | `totalDuration(valor?)` |

| Método | Valor |
|---|---|
| `timeScale(valor?)` | Multiplicador de velocidad: `1` normal, `0.5` mitad, `-1` hacia atrás [O] |
| `delay(valor?)` | Retardo inicial. No lo escala `timeScale` [O] |
| `startTime(valor?)` | Inicio en el tiempo del padre, **ya con `delay`** [O] [E] |
| `endTime(incluirRepeticiones = true)` | Fin en el tiempo del padre, teniendo en cuenta `timeScale` [O] |
| `globalTime(local?)` | Convierte un tiempo local al de la raíz, con anidados y `timeScale`. Sin argumento usa `rawTime()` [O] [C] |
| `rawTime(recortar?)` | Tiempo sin recortar según el padre [C] |
| `tween.ratio` | Progreso tras el ease, solo lectura [O] |

Fórmula: `totalDuration = duration × (repeat + 1) + repeatDelay × repeat`. [O]

Con `repeat` y `yoyo`, `time` va y vuelve mientras `totalTime` crece de forma lineal. [O]

## Ejemplo

```js
const base = gsap.to({ x: 0 }, { x: 1, duration: 2, repeat: 3, repeatDelay: 1, paused: true });
base.totalTime(4);

const lectura = {
  tiempo: base.time(),
  progreso: base.progress(),
  vuelta: base.iteration(),
  total: base.totalDuration(),
};

base.totalTime(99);
const recortado = base.totalTime();

// prueba: lectura.tiempo === 1
// prueba: lectura.progreso === 0.5
// prueba: lectura.vuelta === 2
// prueba: lectura.total === 11
// prueba: recortado === 11
```

Fijar `duration` conserva `repeat` y recalcula el total; fijar `totalDuration` despeja `duration`:

```js
const elastica = gsap.to({ x: 0 }, { x: 1, duration: 2, repeat: 3, repeatDelay: 1, paused: true });

elastica.duration(4);
const nuevoTotal = elastica.totalDuration();  // 4 × 4 + 3 × 1

elastica.totalDuration(5);
const nuevaDuracion = elastica.duration();    // (5 − 3) / 4

// prueba: nuevoTotal === 19
// prueba: nuevaDuracion === 0.5
```

En un timeline, `startTime` y `endTime` hablan el idioma del padre; `globalTime` el de la raíz:

```js
const pista = gsap.timeline({ paused: true });
const clip = gsap.to({ x: 0 }, { x: 1, duration: 1 });
pista.add(clip, 2);
const fin = clip.endTime();
const global = clip.globalTime(0) - pista.startTime();

clip.timeScale(2);
const finRapido = clip.endTime();

// prueba: fin === 3
// prueba: Math.abs(global - 2) < 1e-9
// prueba: finRapido === 2.5
```

## Trampas

- **Tiempos negativos en `time()` y `totalTime()`.** La documentación dice que cuentan desde el final; en 3.15.1 se recortan a 0, en tween y timeline. Calcula `anim.totalDuration() - 2`. [C] [E]
- **`progress()` y `seek()` difieren en eventos.** `progress()` y `time()` disparan callbacks salvo que pases `true`; `seek()` no. Ver [callbacks](nuc-callbacks.md). [O] [E]
- **`progress()` con `repeat`.** Da el progreso de la vuelta actual. Para una barra del total, usa `totalProgress()`. [O]
- **`progress()` frente a valor con ease.** `progress()` es lineal; para la curva aplicada, `ratio`. [O] [E]
- **`timeScale(0)` no equivale a `pause()`.** Congela, pero `paused()` sigue en `false` y luego `play()` no la reanuda. Para frenar suavemente, anima `timeScale`; para parar, `pause()`. [C] [E]
- **`timeScale` negativo** invierte: `reversed()` pasa a `true`. [E]
- **`delay()` tras iniciar.** Mueve el `startTime` si el padre tiene `smoothChildTiming`. No lo uses para "esperar más" a mitad de animación. [C] [P]
- **`startTime` cambia solo.** Con `smoothChildTiming` en el padre (la raíz lo tiene), `reverse()` o `timeScale()` lo ajustan para evitar saltos. No lo guardes como dato fijo. [O]
- **`globalTime()` no está en los tipos** de `animation.d.ts`, aunque existe y está documentado. En TypeScript necesitas una aserción. [C]
- **`Animation.version` no existe en la práctica.** Los tipos declaran ese estático, pero solo `Tween.version` y `Timeline.version` tienen valor. Usa `gsap.version`. [C] [E]
