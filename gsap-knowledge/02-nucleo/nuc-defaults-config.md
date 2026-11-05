---
id: nuc-defaults-config
titulo: gsap.defaults() y gsap.config()
capa: 02-nucleo
tipo: api
ambito: core
resumen: Valores heredados por los tweens frente a ajustes globales del motor; autoSleep, force3D, units, nullTargetWarn, stringFilter y claves que añaden plugins.
api: [gsap.defaults, gsap.config, gsap.GSAPConfig.autoKillThreshold, gsap.GSAPConfig.autoSleep, gsap.GSAPConfig.force3D, gsap.GSAPConfig.nullTargetWarn, gsap.GSAPConfig.resistance, gsap.GSAPConfig.stringFilter, gsap.GSAPConfig.unitFactors, gsap.GSAPConfig.units, gsap.AnimationVars.inherit]
relacionadas: [nuc-vars-especiales, nuc-overwrite, nuc-ticker, fun-valores, tim-herencia, css-transforms]
etiquetas: [configuracion, defaults, global]
fuentes:
  - docs/v3/GSAP/gsap.defaults().md
  - docs/v3/GSAP/gsap.config().md
estado: verificado
version: 3.15.1
---
# gsap.defaults() y gsap.config()

Dos ajustes globales, fáciles de confundir. `gsap.defaults()` fija **propiedades que heredan los tweens**, como `ease` o `duration`. `gsap.config()` fija **parámetros del motor**, como `autoSleep` o `units`. [O]

## Firma

```text
gsap.defaults(vars?) → objeto de defaults actual
gsap.config(ajustes?) → objeto de configuración actual
```

Ambos fusionan lo que pases: lo omitido no cambia. Sin argumentos, solo leen. [O] [C]

### defaults

Valores iniciales: `duration: 0.5`, `overwrite: false`, `delay: 0`, y ease `"power1.out"`. [O] [C] [E]

Orden de herencia, de mayor a menor prioridad [O] [C]:

1. `vars` del propio tween.
2. `defaults` de su timeline padre y, en cadena, de los timelines superiores.
3. `gsap.defaults()`.

`inherit: false` corta toda la cadena, incluida la duración global. Ver [propiedades especiales](nuc-vars-especiales.md).

### config

| Clave | Por defecto | Efecto |
|---|---|---|
| `autoSleep` | `120` | Frames entre comprobaciones para dormir el ticker sin trabajo. `0` lo desactiva [O] [C] |
| `force3D` | `"auto"` | `"auto"` usa `translate3d` durante la animación y vuelve a 2D al final. `true` mantiene 3D, `false` lo evita [O] [E] |
| `nullTargetWarn` | activado | Avisa de objetivos inexistentes [O] |
| `units` | `px`, `deg`, etc. | Unidad por propiedad para valores sin unidad [O] [E] |
| `stringFilter` | filtro de colores | Función que recibe `[inicio, fin]` de cada cadena compleja antes de interpretarla. Admite también `vars.stringFilter` [C] [E] |
| `autoKillThreshold` | `7` | Lo añade ScrollToPlugin: píxeles de diferencia para detectar scroll ajeno y abortar [C] |
| `resistance` | `100` | Lo añade InertiaPlugin: resistencia por defecto [C] |
| `unitFactors` | `{ time: 1000, ... }` | Lo añade InertiaPlugin: factores de escala por propiedad [C] |

## Ejemplo

```js
gsap.defaults({ ease: "none", duration: 0.2 });

const hereda = gsap.to({ x: 0 }, { x: 100, paused: true });
const propio = gsap.to({ x: 0 }, { x: 100, duration: 1, paused: true });

const tl = gsap.timeline({ defaults: { duration: 2 } });
tl.to({ x: 0 }, { x: 100 });

hereda.progress(0.5);

// prueba: hereda.duration() === 0.2
// prueba: hereda.targets()[0].x === 50
// prueba: propio.duration() === 1
// prueba: tl.duration() === 2
// prueba: gsap.defaults().duration === 0.2
```

```html
<div class="a"></div><div class="b"></div><div class="c"></div><div class="d"></div>
```

```js
const leer = (sel) => document.querySelector(sel).style.transform;
const tick = () => new Promise((r) => setTimeout(r, 40));

gsap.config({ units: { left: "%" } });
gsap.set(".d", { left: 50, position: "absolute" });

gsap.config({ force3D: true });          // cada elemento lo copia en su primer render
gsap.to(".a", { x: 10, duration: 0.02 });
await tick();

gsap.config({ force3D: false });
gsap.to(".b", { x: 20, duration: 0.2 });
gsap.to(".a", { x: 40, duration: 0.02 });  // ya tenía caché: sigue en 3D
await tick();
const enCurso = leer(".b");

gsap.config({ force3D: "auto" });
gsap.to(".c", { x: 30, duration: 0.1 });
await tick();
const durante = leer(".c");
await new Promise((r) => setTimeout(r, 120));

// prueba: document.querySelector(".d").style.left === "50%"
// prueba: leer(".a").startsWith("translate3d")
// prueba: enCurso.startsWith("translate(")
// prueba: durante.startsWith("translate3d")
// prueba: leer(".c").startsWith("translate(")
```

`stringFilter` recibe las dos cadenas, una vez, antes de interpolar:

```js
const vistas = [];
const texto = { c: "a 1" };
gsap.to(texto, { c: "a 2", duration: 0.02, stringFilter: (par) => vistas.push(par.slice()) });

// prueba: vistas[0].join("|") === "a 1|a 2"
```

## Trampas

- **`ease` en `gsap.config()` o `units` en `gsap.defaults()`.** No produce error, pero no tiene efecto donde esperas: `defaults` hereda en tweens; `config`, no. [O] [C]
- **`trialWarn` no existe.** El ejemplo oficial de `gsap.config()` lo incluye, pero es un resto de `gsap-trial`: no hay ninguna referencia en el fuente de 3.15.1. Se guarda en el objeto sin efecto. [C] [E]
- **`force3D` se fija por elemento.** La primera vez que GSAP analiza las transformaciones de un elemento copia el valor global en su caché. Cambiar `gsap.config()` después no afecta a ese elemento, como se ve con `.a` en el ejemplo. Esa lectura ocurre en el primer render, no al crear el tween. [C] [E]
- **`force3D: true` en muchos elementos.** Cada uno ocupa capa y memoria de GPU, y puede degradar el texto. Deja `"auto"`. [O] [P]
- **Defaults en módulos.** `gsap.defaults()` es global: una biblioteca que lo cambie afecta a toda la aplicación. En código reutilizable, usa `gsap.timeline({ defaults })`. [P]
- **`gsap.defaults({ ease })` no alcanza a los keyframes.** Ver [keyframes](nuc-keyframes.md). [C] [E]
- **`nullTargetWarn: false` en desarrollo** esconde errores de selector, sobre todo con `scope`. Si lo usas, que sea solo en producción. [P]
- **`autoSleep` bajo no ahorra por sí solo.** Con plugins que registran listeners, como ScrollTrigger, el ticker no llega a dormir aunque no haya tweens. [C] [E]
- **Valores por defecto de `gsap.config().units`.** Incluyen `lineHeight: ""`: sin unidad, `lineHeight` queda como multiplicador. [C]
