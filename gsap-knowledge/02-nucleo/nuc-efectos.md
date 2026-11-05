---
id: nuc-efectos
titulo: Efectos registrados
capa: 02-nucleo
tipo: api
ambito: core
resumen: gsap.registerEffect y gsap.effects para empaquetar animaciones con nombre, defaults y métodos directos en Timeline.
api: [gsap.registerEffect, gsap.effects]
relacionadas: [fun-plugins, nuc-context, tim-basico, nuc-defaults-config, eas-registro]
etiquetas: [efectos, reutilizacion]
fuentes:
  - docs/v3/GSAP/gsap.registerEffect().md
  - docs/v3/GSAP/gsap.effects.md
estado: verificado
version: 3.15.1
---
# Efectos registrados

Un efecto es una función de animación con nombre, reutilizable con distintos objetivos y opciones. GSAP resuelve los objetivos a un array, aplica los valores por defecto y, si lo pides, la añade como método de los timelines. [O]

## Firma

```text
gsap.registerEffect({
  name,                  // string
  effect,                // (targets, config, timeline?) → Tween | Timeline
  defaults?,             // valores por defecto de config
  extendTimeline?,       // añade timeline.name(targets, config?, posicion?)
  plugins?,              // "ScrollTrigger,TextPlugin": avisa si faltan
})
gsap.effects.name(targets, config?) → lo que devuelva effect
```

| Opción | Efecto |
|---|---|
| `defaults` | Se fusionan en cada llamada; lo que pases prevalece [O] [E] |
| `extendTimeline: true` | Añade el método a `Timeline`. `effect` debe devolver una animación [O] |
| `plugins` | Solo comprueba y avisa `... effect requires ... plugin`; no los carga [C] [E] |

El tercer parámetro de `effect`, el timeline que llama, no aparece en la documentación. En el método del timeline, el segundo argumento puede ser directamente la posición: `tl.nombre(".x", 3)`. [C] [E]

## Ejemplo

```html
<div class="foto"></div><div class="foto"></div>
```

```js
gsap.registerEffect({
  name: "fundir",
  defaults: { duration: 0.05, hasta: 0 },
  extendTimeline: true,
  effect: (objetivos, config) =>
    gsap.to(objetivos, { opacity: config.hasta, duration: config.duration }),
});

const suelta = gsap.effects.fundir(".foto", { hasta: 0.5 });

const tl = gsap.timeline();
tl.fundir(".foto")
  .fundir(".foto", { duration: 0.1 }, "+=1")
  .fundir(".foto", 3);

const inicios = tl.getChildren().map((c) => c.startTime());

// prueba: suelta instanceof gsap.core.Tween
// prueba: suelta.targets().length === 2
// prueba: JSON.stringify(inicios) === "[0,1.05,3]"
```

Sin `extendTimeline` hay que usar `tl.add()`:

```js
gsap.registerEffect({
  name: "soloGlobal",
  effect: (objetivos) => gsap.to(objetivos, { x: 10, duration: 0.05 }),
});
const tl = gsap.timeline();
const metodo = typeof tl.soloGlobal;
tl.add(gsap.effects.soloGlobal(".icono"));

// prueba: metodo === "undefined"
// prueba: tl.getChildren().length === 1
```

## Trampas

- **`extendTimeline` sin devolver animación.** `tl.nombre()` no falla, pero no añade nada. Devuelve siempre el tween o el timeline. [O] [E]
- **Registrar otra vez el mismo nombre** sustituye al efecto sin avisar. Evita colisiones entre paquetes con un prefijo. [E]
- **Nombres que chocan con `Timeline`.** `extendTimeline` escribe en el prototipo: un efecto llamado `to` o `add` rompería los timelines. [C]
- **TypeScript.** `gsap.effects` y los métodos añadidos a `Timeline` no tienen tipos: declara una extensión o usa una aserción. Ver `fra-typescript`. [C] [P]
- **Limpieza.** Lo que crea el efecto se graba en el Context activo si lo llamas dentro de uno. Fuera, debes guardar lo devuelto. [C]
- **`defaults` del efecto no son `gsap.defaults()`.** Solo rellenan `config`: tu función decide si los usa. [C]
- **¿Efecto o plugin?** Ver [plugins](../01-fundamentos/fun-plugins.md). [P]
