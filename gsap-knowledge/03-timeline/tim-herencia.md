---
id: tim-herencia
titulo: Herencia y política de hijos en una timeline
capa: 03-timeline
tipo: concepto
ambito: core
resumen: defaults e inherit, cómo se sincronizan los cabezales, y qué cambian smoothChildTiming y autoRemoveChildren.
api: [gsap.TimelineVars.defaults, gsap.TimelineVars.autoRemoveChildren, gsap.TimelineVars.smoothChildTiming, Timeline.autoRemoveChildren, Timeline.smoothChildTiming, gsap.TweenVars.delay]
requiere: [tim-basico]
relacionadas: [tim-anidado, tim-control, nuc-defaults-config, nuc-global]
etiquetas: [timeline, defaults, herencia]
fuentes:
  - docs/v3/GSAP/Timeline.md
  - docs/v3/GSAP/Timeline/smoothChildTiming.md
  - docs/v3/GSAP/Timeline/autoRemoveChildren.md
  - docs/v3/GSAP/Timeline/data.md
  - docs/v3/GSAP/Timeline/vars.md
estado: verificado
version: 3.15.1
---
# Herencia y política de hijos

Una timeline influye en sus hijos de dos formas: les pasa valores (`defaults`) y decide cómo reaccionar cuando su cronometraje cambia en vivo (`smoothChildTiming`, `autoRemoveChildren`). [O]

## Modelo mental

### Herencia de valores

Al **crear** un tween, GSAP recorre sus ancestros y copia cada clave de `defaults` que el tween no tenga. Es una copia puntual: cambiar `defaults` después no afecta a lo creado. Vale cualquier clave, no solo `duration` y `ease`. [O] [C]

| Prioridad | Origen |
|---|---|
| 1 | `vars` del propio tween |
| 2 | `defaults` de la timeline madre |
| 3 | `defaults` de las siguientes ancestras |
| 4 | `gsap.defaults()`, que son los `defaults` de la timeline global |

`inherit: false` en un tween corta **toda** la cadena, también `gsap.defaults()`. [C] [E]

### Cabezales

Todo animado tiene su cabezal, y cada timeline renderiza a sus hijos diciéndoles en qué tiempo local están. Cuando reanudas un hijo, GSAP lo recoloca para que su cabezal coincida con el de la madre sin saltos. Eso es lo que controla `smoothChildTiming`. [O]

| Opción | Por defecto | Con `true` |
|---|---|---|
| `smoothChildTiming` | `false` en las tuyas, `true` en la global [E] | Cambiar en vivo `reverse()`, `timeScale()`, `seek()`, etc. en un hijo mueve su `startTime()` para que no salte |
| `autoRemoveChildren` | `false` en las tuyas | Elimina cada hijo al terminar |

## Ejemplo

```js
const base = gsap.timeline({ defaults: { duration: 2, ease: "none" }, paused: true });
base.to({ a: 0 }, { a: 1 }).to({ b: 0 }, { b: 1, duration: 1 });

const hijos = base.getChildren().map((t) => t.duration());

// prueba: hijos.join() === "2,1"
// prueba: base.duration() === 3
```

`defaults` admite cualquier propiedad. Así se puede aplicar `repeat` a todos los hijos. [E]

```js
const repetida = gsap.timeline({ defaults: { repeat: 1 }, paused: true });
repetida.to({ a: 0 }, { a: 1, duration: 1 });

// prueba: repetida.totalDuration() === 2
```

Diferencia de `smoothChildTiming` al invertir un hijo a mitad de camino:

```js
const conSuavizado = gsap.timeline({ paused: true, smoothChildTiming: true });
const hijoA = gsap.to({ a: 0 }, { a: 1, duration: 1 });
conSuavizado.add(hijoA, 0);
conSuavizado.seek(0.75);
hijoA.reverse();

const sinSuavizado = gsap.timeline({ paused: true });
const hijoB = gsap.to({ a: 0 }, { a: 1, duration: 1 });
sinSuavizado.add(hijoB, 0);
sinSuavizado.seek(0.75);
hijoB.reverse();

// prueba: hijoA.startTime() === 0.5
// prueba: hijoB.startTime() === 0
```

Por defecto el hijo no se recoloca, de modo que al seguir la madre puede saltar. Con `smoothChildTiming` se mueve su `startTime()` y la reproducción sigue sin corte. [O] [E]

`autoRemoveChildren` hace que la timeline se vacíe al avanzar. [E]

```js
const fugaz = gsap.timeline({ autoRemoveChildren: true });
fugaz.to({ a: 0 }, { a: 1, duration: 0.05 }).to({ b: 0 }, { b: 1, duration: 0.05 });

// prueba: fugaz.getChildren().length === 0
```

## Trampas

- **`inherit: false` también quita la duración por defecto.** El tween queda con duración 0, porque 0.5 s venía de `gsap.defaults()`. Declara `duration` junto a `inherit: false`. [E]

```js
const tl = gsap.timeline({ defaults: { duration: 3 }, paused: true });
tl.to({ a: 0 }, { a: 1, inherit: false });

// prueba: tl.getChildren()[0].duration() === 0
```

- **`defaults` se aplica al crear.** Mutar `tl.vars.defaults` solo afecta a tweens futuros. [C]
- **Un `delay` en `defaults` se aplica a cada hijo**, que además se suma a su posición: la secuencia se alarga y queda hueco delante de cada tween. Para retrasar el conjunto usa `delay` en la propia timeline. [C]
- **`autoRemoveChildren` impide volver atrás.** Sin hijos, `reverse()` y `seek()` no tienen nada que renderizar. Úsalo solo en timelines que crecen sin fin y nunca se rebobinan. [O]
- **`smoothChildTiming: true` cambia `startTime()` en vivo.** Si dependes del tiempo de un hijo para colocar otros, léelo antes de manipularlo. [P]
- **Pausar la timeline global detiene todo**, también `delayedCall`. Para controlar lo que ya existe usa `gsap.exportRoot()`, que envuelve lo actual en una timeline propia. Ver [timeline global](../02-nucleo/nuc-global.md). [O]
- **`data`** es un dato libre de cada animado, tomado de `vars.data`. No pasa de la madre a los hijos salvo que lo pongas en `defaults`. [C]
