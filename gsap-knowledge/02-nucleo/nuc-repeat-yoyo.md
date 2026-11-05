---
id: nuc-repeat-yoyo
titulo: repeat, yoyo y easeReverse
capa: 02-nucleo
tipo: api
ambito: core
resumen: Repetir, alternar sentido, pausas entre vueltas, repeatRefresh y easeReverse, que reemplaza a yoyoEase desde 3.15.0.
api: [Animation.repeat, Animation.repeatDelay, Animation.yoyo, Animation.iteration, gsap.AnimationVars.repeatRefresh, gsap.TweenVars.easeReverse, gsap.TweenVars.yoyoEase]
relacionadas: [nuc-tiempo, nuc-vars-especiales, nuc-stagger, fun-valores, eas-guia]
etiquetas: [repeat, yoyo, ease, bucle]
fuentes:
  - docs/v3/GSAP/Tween/repeat().md
  - docs/v3/GSAP/Tween/repeatDelay().md
  - docs/v3/GSAP/Tween/yoyo().md
  - docs/v3/GSAP/Tween/iteration().md
  - docs/v3/GSAP/Tween/vars.md
estado: verificado
version: 3.15.1
---
# repeat, yoyo y easeReverse

`repeat` indica cuántas veces se repite **además** de la primera. `yoyo` hace que las vueltas alternen sentido. `easeReverse`, añadida en 3.15.0, decide qué ease se usa cuando el cabezal retrocede. [O]

## Firma

```text
vars:  repeat: n | -1    repeatDelay: s    repeatRefresh: bool    yoyo: bool    easeReverse: bool | ease
anim.repeat(n?)      anim.repeatDelay(s?)      anim.yoyo(bool?)      anim.iteration(n?, suprimir?)
```

Los métodos son getter si se llaman sin argumento, y setter encadenable si reciben uno. [O]

| Con `repeat: 2` | Recorrido |
|---|---|
| `yoyo: false` | ida, salto al inicio, ida, salto al inicio, ida |
| `yoyo: true` | ida, vuelta, ida |

`iteration()` empieza en 1 y permite saltar a otra vuelta. [O] [E]

`repeatRefresh: true` llama a `invalidate()` al completar cada ciclo, sin contar las vueltas de yoyo, para volver a resolver valores relativos, aleatorios o por función. No refresca `duration`, `delay` ni `stagger`. [O]

### Qué ease se usa al volver

| Configuración | Comportamiento al retroceder |
|---|---|
| Sin nada | La misma curva, recorrida al revés: un `out` se percibe como `in` |
| `easeReverse: true` | Aplica el `ease` original en el sentido de la vuelta |
| `easeReverse: "back.out"` | Aplica ese ease en la vuelta |
| `yoyoEase` (obsoleta) | Como `easeReverse`, pero además activa `yoyo` y exige repetición |

`easeReverse` recalcula desde donde cambia el sentido y sobre la distancia restante, así que también funciona con `reverse()` a mitad del tween y no depende de `repeat`. [O] [E]

## Ejemplo

```js
const ida = { x: 0 };
const bucle = gsap.to(ida, { x: 100, duration: 2, repeat: 3, repeatDelay: 1, paused: true });

const antes = bucle.totalDuration();
bucle.totalTime(4);          // segunda vuelta: 2 s + 1 s de espera + 1 s
const vuelta = bucle.iteration();
const local = bucle.time();

// prueba: antes === 11
// prueba: vuelta === 2
// prueba: local === 1
```

`easeReverse` cambia la curva de vuelta con el mismo recorrido. Se fuerza un retroceso real moviendo el cabezal del final a la mitad:

```js
const crear = (extra) => gsap.to({ x: 0 }, { x: 100, duration: 1, ease: "power2.in", paused: true, ...extra });
const medir = (tw) => { tw.progress(1); tw.time(0.5); return tw.targets()[0].x; };

const defecto = medir(crear({}));
const lineal = medir(crear({ easeReverse: "none" }));
const mismo = medir(crear({ easeReverse: true }));

// prueba: defecto === 12.5
// prueba: lineal === 50
// prueba: mismo === 87.5
```

`easeReverse` no activa `yoyo`, a diferencia de `yoyoEase`:

```js
const conEase = gsap.to({ x: 0 }, { x: 1, repeat: 1, easeReverse: "none", paused: true });
const conYoyoEase = gsap.to({ x: 0 }, { x: 1, repeat: 1, yoyoEase: "none", paused: true });

// prueba: conEase.yoyo() === false
// prueba: conYoyoEase.yoyo() === true
```

## Trampas

- **Migrar de `yoyoEase` a `easeReverse` sin añadir `yoyo`.** La primera activaba `yoyo` sola; la segunda, no. Sin `yoyo: true`, el tween repite saltando al inicio. [C] [E]
- **`repeat: 1` no es "una vez".** Son dos pasadas. [O]
- **`yoyo` sin `repeat`** no hace nada. [O]
- **`repeat: -1` y `totalDuration()`.** Devuelve un número enorme (`1e10` en un tween de 1 s): no lo uses para cálculos ni para posicionar. [E]
- **`onComplete` con `repeat: -1`** nunca se dispara, y una promesa sobre ese tween nunca se resuelve. Usa `onRepeat`. Ver [promesas](nuc-promesas.md). [E]
- **`yoyo` y `reversed()`.** Una vuelta de yoyo no cambia `reversed()`. Para saber el sentido, usa `iteration()` par o impar. [O]
- **`repeat` debe ser entero.** [O]
