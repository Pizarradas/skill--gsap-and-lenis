---
id: nuc-immediate-render
titulo: immediateRender - cuándo se escribe el primer valor
capa: 02-nucleo
tipo: concepto
ambito: core
resumen: Por qué from() y fromTo() pintan al crearse, cómo rompe eso varios from() sobre la misma propiedad y cuándo poner immediateRender en false.
api: [gsap.TweenVars.immediateRender, gsap.TweenVars.lazy]
requiere: [fun-modelo]
relacionadas: [nuc-tween-metodos, nuc-limpieza, tim-basico, cal-fouc, cal-errores-comunes, scr-scrolltrigger]
etiquetas: [from, fromto, render, fouc]
fuentes:
  - resources/immediaterender.md
  - docs/v3/GSAP/gsap.from().md
  - docs/v3/GSAP/gsap.fromTo().md
estado: verificado
version: 3.15.1
---
# immediateRender

`immediateRender: true` hace que un tween pinte su primer estado al crearse, sin esperar al siguiente tick ni a su `delay` o posición en el timeline. Es el valor por defecto en `from()` y `fromTo()`, porque si no los elementos se verían un instante antes de su animación de entrada. [O]

## Modelo mental

| Caso | Por defecto | Efecto |
|---|---|---|
| `gsap.to()` | `false` | Espera a su inicio real |
| `gsap.from()`, `gsap.fromTo()` | `true` | Pinta ya el estado inicial, aunque tenga `delay` o el timeline esté en pausa [O] [E] |
| `gsap.set()` en la posición actual del padre | Se aplica ya | Es de duración 0 [C] |
| `tl.set()` en una posición posterior | `false` | Se aplica cuando llega el cabezal [C] [E] |
| Animación con `scrollTrigger` | Renderiza al crear el trigger, salvo `immediateRender: false` | [O] [C] |

Separa dos conceptos [C]:

- **`immediateRender`** decide **cuándo** se fija el estado inicial.
- **`from()` lee el destino del estado actual** en el momento de crearse.

La combinación de ambos produce el error más habitual: el segundo `from()` lee como "estado actual" lo que el primero ya pintó.

## Ejemplo

Dos `from()` sobre la misma propiedad **dejan el elemento invisible**:

```html
<div class="mal"></div><div class="bien"></div>
```

```js
const verMal = document.querySelector(".mal");
const verBien = document.querySelector(".bien");

gsap.timeline()
  .from(verMal, { opacity: 0, duration: 0.05 })
  .from(verMal, { opacity: 0, x: 5, duration: 0.05 });

gsap.timeline()
  .from(verBien, { opacity: 0, duration: 0.05 })
  .from(verBien, { opacity: 0, x: 5, duration: 0.05, immediateRender: false });

await new Promise((r) => setTimeout(r, 250));
const opacidadMal = getComputedStyle(verMal).opacity;
const opacidadBien = getComputedStyle(verBien).opacity;

// prueba: opacidadMal === "0"
// prueba: opacidadBien === "1"
```

Con `immediateRender: false`, el segundo `from()` no pinta al crearse y lee el destino cuando le toca arrancar. [E]

**Excepción medida.** Si el **primer tick de la página** llega después de que acabe el primer `from()`, el resultado final puede ser 1 en lugar de 0: pasó con `duration: 0.05` y un primer tick de unos 50 ms o más. Con el ticker ya en marcha, o con duraciones de 0,3 s, siempre dio 0. No confíes en ninguno de los dos resultados: corrige la secuencia. [E]

En `fromTo()` el destino es explícito, pero sigue pintando al crearse: en un timeline en pausa manda el último creado.

```js
const pieza = { x: 0 };
const otraPieza = { x: 0 };

gsap.timeline({ paused: true })
  .fromTo(pieza, { x: 10 }, { x: 20, duration: 0.1 })
  .fromTo(pieza, { x: 50 }, { x: 60, duration: 0.1 });

gsap.timeline({ paused: true })
  .fromTo(otraPieza, { x: 10 }, { x: 20, duration: 0.1 })
  .fromTo(otraPieza, { x: 50 }, { x: 60, duration: 0.1, immediateRender: false });

await new Promise((r) => setTimeout(r, 30));

// prueba: pieza.x === 50
// prueba: otraPieza.x === 10
```

Un `from()` relanzado a medias toma el valor intermedio como destino:

```html
<div class="aviso"></div>
```

```js
const aviso = document.querySelector(".aviso");
gsap.from(aviso, { opacity: 0, duration: 0.1, ease: "none" });
await new Promise((r) => setTimeout(r, 50));
gsap.from(aviso, { opacity: 0, duration: 0.1, ease: "none" });
await new Promise((r) => setTimeout(r, 250));
const opacidadFinal = Number(getComputedStyle(aviso).opacity);

// prueba: opacidadFinal < 1
```

`set()` dentro de un timeline, sin y con render inmediato:

```js
const marca = { y: 0, z: 0 };
gsap.timeline()
  .to({ v: 0 }, { v: 1, duration: 0.2 })
  .set(marca, { y: 50 })
  .set(marca, { z: 7, immediateRender: true });

const yAlCrear = marca.y;
const zAlCrear = marca.z;

// prueba: yAlCrear === 0
// prueba: zAlCrear === 7
```

## Trampas

- **Elemento invisible tras dos `from()`.** Ver ejemplo: acaba en el valor `from`. Opciones: `immediateRender: false` en el segundo, `fromTo()`, o un `set()` inicial con `to()` sucesivos. [O] [E]
- **Código de arranque que corre dos veces.** Si la vista se inicializa de nuevo sin revertir lo anterior, el segundo `from()` lee el estado que dejó el primero. Crea las animaciones en un `gsap.context()` y revierte al retirar la vista. Ver [context](nuc-context.md). [P] [E]

```js
const pieza = document.querySelector(".entrada");
const sinRevertir = document.querySelector(".suelta");
const arrancar = (el) => gsap.context(() => {
  gsap.from(el, { opacity: 0, duration: 0.2, ease: "none" });
});

arrancar(pieza).revert();         // primer arranque, con limpieza
arrancar(pieza);                  // segundo arranque

arrancar(sinRevertir);            // primer arranque, sin limpieza
gsap.getTweensOf(sinRevertir)[0].progress(0.5);
arrancar(sinRevertir);            // el segundo toma como destino un valor a medias

await new Promise((r) => setTimeout(r, 350));
const conLimpieza = getComputedStyle(pieza).opacity;
const sinLimpieza = Number(getComputedStyle(sinRevertir).opacity);
// prueba: conLimpieza === "1" && sinLimpieza === 0.5
```

- **`from()` dentro de un clic repetido.** Cada clic parte de donde esté y el destino se degrada, como en el tercer ejemplo. Usa `fromTo()`. [E]
- **Timeline en pausa que "ya se ve animado".** Sus `from()` han pintado el estado inicial al crearse. Es lo esperado: oculta así los elementos antes de reproducir. [O] [E]
- **Parpadeo inicial (FOUC).** `immediateRender` actúa cuando corre el JS. Si el HTML se pinta antes, el elemento aparece un instante: ocúltalo con CSS. Ver `cal-fouc`. [O]
- **Leer el DOM justo después.** El render inmediato puede ser diferido por `lazy`: ver [modelo](../01-fundamentos/fun-modelo.md). [C] [E]
- **`from()` con ScrollTrigger y varios sobre el mismo elemento.** Mismo problema, agravado porque cada uno renderiza al crear el trigger. Pon `immediateRender: false` en los siguientes. Ver `scr-scrolltrigger`. [C] [P]
