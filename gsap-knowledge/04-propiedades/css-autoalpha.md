---
id: css-autoalpha
titulo: autoAlpha, opacidad con visibilidad
capa: 04-propiedades
tipo: api
ambito: CSSPlugin
resumen: autoAlpha combina opacity y visibility para que un elemento a 0 no reciba eventos. Es la base para evitar parpadeos al cargar.
api: [gsap.CSSProperties.autoAlpha, gsap.CSSProperties.alpha]
relacionadas: [css-plugin, cal-fouc, cal-accesibilidad]
etiquetas: [css, opacidad, visibilidad, fouc]
fuentes:
  - docs/v3/GSAP/CorePlugins/CSS.md
estado: verificado
version: 3.15.1
---
# autoAlpha

Como `opacity`, pero además gestiona `visibility`: a 0 pone `hidden` para que el elemento no se pinte ni reciba clics, y con cualquier otro valor pone `inherit`. Úsalo para mostrar y ocultar. `alpha` es un simple alias de `opacity`. [O] [C]

## Firma

```text
autoAlpha: número de 0 a 1       escribe opacity y visibility
alpha: número de 0 a 1           alias de opacity
```

| Momento | `opacity` | `visibility` |
|---|---|---|
| Salida, durante | interpolada | `inherit` |
| Salida, al llegar a 0 | `0` | `hidden`, solo al final [C] |
| Entrada desde 0 | interpolada | `inherit` desde el primer render |
| Vuelta exacta a 0 | `0` | `hidden` |

Usa `inherit` y no `visible` para respetar a un padre oculto: un hijo con `visible` se mostraría dentro de un padre `hidden`. [O]

## Ejemplo

Ocultar por CSS y revelar sin parpadeo. La regla de la hoja de estilos oculta desde el primer pintado y GSAP interpreta que la opacidad de partida también es 0. [O]

```html
<style>.banner { visibility: hidden; }</style>
<div class="banner" style="width:80px;height:80px"></div>
```

```js
const banner = document.querySelector(".banner");
const entrada = gsap.to(banner, { autoAlpha: 1, duration: 1, ease: "none", paused: true });

entrada.progress(0.5);
const enMedio = [banner.style.opacity, banner.style.visibility];
entrada.progress(0);
const alInicio = banner.style.visibility;

// prueba: enMedio[0] === "0.5" && enMedio[1] === "inherit"
// prueba: alInicio === "hidden"
```

Salida:

```js
const nota = document.querySelector(".nota");
const salida = gsap.to(nota, { autoAlpha: 0, duration: 1, ease: "none", paused: true });

salida.progress(0.5);
const durante = [nota.style.opacity, nota.style.visibility];
salida.progress(1);

// prueba: durante[0] === "0.5" && durante[1] === "inherit"
// prueba: nota.style.opacity === "0" && nota.style.visibility === "hidden"
```

`gsap.from()` también funciona, y se pinta al crearse, de modo que el elemento no se ve antes de empezar. [E]

```js
gsap.from(".pieza", { autoAlpha: 0, duration: 0.3, stagger: 0.05 });
const pieza = document.querySelector(".pieza");
await new Promise((r) => setTimeout(r, 30));
const pronto = Number(pieza.style.opacity) < 1;

// prueba: pronto === true
// prueba: pieza.style.visibility === "inherit" && pieza.style.opacity === "1"
```

## Trampas

- **La inferencia de opacidad solo se da con opacidad 1.** Si el CSS ya tiene `visibility: hidden` y `opacity: 0.5`, el tween parte de 0.5, no de 0. [C]
- **`opacity: 0` no evita clics.** Un elemento invisible con solo `opacity` sigue tapando lo de debajo y recibe eventos y foco. Para ocultar interacción usa `autoAlpha`. [O]
- **`visibility: hidden` saca el elemento del orden de foco y del árbol de accesibilidad.** Suele ser lo deseado, pero un elemento que deba anunciarse no puede partir así. Ver [accesibilidad](../13-calidad/cal-accesibilidad.md). [P]
- **No lo mezcles con `opacity` en otro tween** del mismo elemento: ambos escriben `opacity` y gana el último render. [P]
- **`autoAlpha` no quita el espacio que ocupa** el elemento. Para eso, `display: "none"` al final del tween. [C]
- **Sin JavaScript** el contenido oculto por CSS no aparece nunca. Añade la clase que oculta desde JS en `<head>`. Ver [FOUC](../13-calidad/cal-fouc.md). [P]
