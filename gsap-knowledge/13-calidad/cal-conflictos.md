---
id: cal-conflictos
titulo: Tweens en conflicto y modos de overwrite
capa: 13-calidad
tipo: concepto
ambito: transversal
resumen: Qué pasa cuando dos tweens animan lo mismo, cómo elegir entre false, true y auto, y cuándo actúa cada modo.
api: [gsap.TweenVars.overwrite, gsap.defaults, gsap.killTweensOf, gsap.getTweensOf]
relacionadas: [nuc-overwrite, nuc-defaults-config, cal-errores-comunes, cal-rendimiento]
etiquetas: [overwrite, conflictos, interaccion]
fuentes:
  - resources/conflict.md
estado: verificado
version: 3.15.1
---
# Tweens en conflicto y modos de overwrite

Hay conflicto cuando varios tweens animan **las mismas propiedades** de **los mismos objetivos** **a la vez**. En una animación lineal casi nunca ocurre. Con interacción o eventos aleatorios sí, y entonces importa cómo se resuelve. [O]

## Modelo mental

| Modo | Qué mata | Cuándo actúa |
|---|---|---|
| `false` (defecto) | Nada: ambos escriben hasta que uno acaba, y en cada tick gana el último en renderizar | Nunca [O] |
| `true` | Todos los tweens de esos objetivos, sea cual sea la propiedad | Al **crear** el tween [C] |
| `"auto"` | Solo las propiedades en conflicto de los tweens activos | La **primera vez que renderiza** [C] |

Elección práctica: `"auto"` para interacción normal, `true` cuando el tween nuevo sustituye a todo lo anterior, y `false` si sabes que no se solapan. [P]

## Ejemplo

Tres elementos con un tween largo de `x` y `rotation`. Al poco, un segundo tween lleva solo `x` a 0:

```js
const lanzar = async (clase, modo) => {
  gsap.to(clase, { x: 100, rotation: 90, duration: 0.25, ease: "none" });
  await new Promise((r) => setTimeout(r, 40));
  gsap.to(clase, { x: 0, duration: 0.05, overwrite: modo });
};

await Promise.all([lanzar(".sin", false), lanzar(".todo", true), lanzar(".auto", "auto")]);
await new Promise((r) => setTimeout(r, 400));

const estado = (c) => [Math.round(gsap.getProperty(c, "x")), Math.round(gsap.getProperty(c, "rotation"))];
const sin = estado(".sin");
const todo = estado(".todo");
const auto = estado(".auto");
// prueba: sin[0] === 100 && sin[1] === 90
// prueba: todo[0] === 0 && todo[1] < 90
// prueba: auto[0] === 0 && auto[1] === 90
```

| Modo | `x` final | `rotation` | Lectura |
|---|---|---|---|
| `false` | 100 | 90 | El tween largo gana porque acaba después |
| `true` | 0 | A medias | El giro también murió |
| `"auto"` | 0 | 90 | Solo se retiró la parte de `x` |

Se fija por tween, por timeline o de forma global: [O]

```js
gsap.defaults({ overwrite: "auto" });
const interfaz = gsap.timeline({ defaults: { overwrite: true } });
gsap.to(".global", { x: 10, duration: 0.05 });
gsap.defaults({ overwrite: false });
// prueba: interfaz.vars.defaults.overwrite === true
```

## Trampas

- **`overwrite: true` dentro de un timeline se come lo anterior.** Actúa al crear y no atiende al orden temporal: mata tweens aún sin empezar del mismo objetivo, incluso del mismo timeline. [E]

```js
const secuencia = gsap.timeline();
secuencia.to(".paso", { x: 100, duration: 0.05 });
secuencia.to(".paso", { y: 50, duration: 0.05, overwrite: true });
await new Promise((r) => setTimeout(r, 250));
// prueba: gsap.getProperty(".paso", "x") === 0 && gsap.getProperty(".paso", "y") === 50
```

- **`"auto"` no toca lo que aún no ha empezado.** Solo mira tweens activos en ese momento. Una secuencia del mismo elemento en un timeline no se pisa. [E]

```js
const secuencia = gsap.timeline();
secuencia.to(".orden", { x: 100, duration: 0.05 });
secuencia.to(".orden", { x: 200, duration: 0.05, overwrite: "auto" });
await new Promise((r) => setTimeout(r, 250));
// prueba: gsap.getProperty(".orden", "x") === 200
```

- **`gsap.defaults({ overwrite: "auto" })` es un buen diagnóstico.** Si un comportamiento raro desaparece al ponerlo, tenías un conflicto. Era además el defecto de GSAP 1 y 2. [O]
- **`repeat: -1` con `false`.** Un tween infinito nunca acaba, de modo que seguirá escribiendo sobre cualquier otro. Hay que matarlo con `overwrite` o `gsap.killTweensOf()`. [P]
- **`onInterrupt`** se dispara cuando un tween muere sin completarse, también por overwrite. Sustituye al antiguo `onOverwrite`. [O]
- **`fromTo()` y `from()` con overwrite:** el `set` inicial no sobrescribe; el conflicto se resuelve cuando el tween empieza de verdad. [C]
- **Conflictos sin solape de tiempo** no son conflictos de overwrite, sino de valores de inicio: `to()` lee lo que hay. Ver [errores comunes](cal-errores-comunes.md). [P]
