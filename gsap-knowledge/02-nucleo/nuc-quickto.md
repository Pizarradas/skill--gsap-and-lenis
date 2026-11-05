---
id: nuc-quickto
titulo: gsap.quickTo(), redirigir una animación a alta frecuencia
capa: 02-nucleo
tipo: api
ambito: core
resumen: Crea una función reutilizable que reorienta un mismo tween hacia un valor nuevo. Ideal para seguir el ratón sin crear un tween por evento.
api: [gsap.quickTo, Tween.resetTo]
relacionadas: [nuc-quicksetter, nuc-overwrite, utl-funciones]
etiquetas: [rendimiento, puntero, interaccion]
fuentes:
  - docs/v3/GSAP/gsap.quickTo().md
  - docs/v3/GSAP/Tween.md
estado: verificado
version: 3.15.1
---
# gsap.quickTo()

Devuelve una función ligada a **una propiedad numérica de un objetivo**. Cada llamada reinicia el mismo tween hacia el número recibido, en lugar de crear uno nuevo. Es la opción adecuada cuando un valor cambia muchas veces por segundo y debe llegar con suavidad: `mousemove`, seguimiento de cursor, efectos magnéticos. [O]

## Firma

```text
gsap.quickTo(target, property, vars?) → función (valor, inicio?, inicioRelativo?) → Tween
```

| Parámetro | Tipo | Nota |
|---|---|---|
| `target` | selector, elemento u objeto | Si coincide con varios, se mueven todos con el mismo destino [E] |
| `property` | string | Una sola propiedad numérica |
| `vars` | objeto de tween | `duration`, `ease`, etc. |

La función devuelta acepta también un valor inicial opcional (segundo argumento) y, en un tercero, si ese inicio es relativo [C]. Por debajo llama a `tween.resetTo()`, y el tween queda accesible en `funcion.tween`. [C]

## Qué elige quickTo frente a sus alternativas

| Necesidad | Herramienta |
|---|---|
| Valor que llega con suavidad, muchas veces por segundo | `gsap.quickTo()` |
| Valor que se aplica al instante, sin duración | [`gsap.quickSetter()`](nuc-quicksetter.md) |
| Animación puntual, con unidades, plugins o valores relativos | `gsap.to()` |

## Ejemplo

```html
<div class="cursor" style="position:fixed;width:20px;height:20px"></div>
```

```js
const moverX = gsap.quickTo(".cursor", "x", { duration: 0.4, ease: "power3" });
const moverY = gsap.quickTo(".cursor", "y", { duration: 0.4, ease: "power3" });

window.addEventListener("pointermove", (e) => {
  moverX(e.clientX);
  moverY(e.clientY);
});

moverX(100);
// prueba: gsap.getProperty(".cursor", "x") === 100
```

Combinado con `gsap.utils.pipe()`, los valores pasan por filtros antes de llegar al tween [O]:

```js
const moverLimitado = gsap.utils.pipe(
  gsap.utils.clamp(0, 300),
  gsap.utils.snap(10),
  gsap.quickTo(".ficha", "x", { duration: 0.2 })
);

moverLimitado(9999); // destino 300
// prueba: gsap.getProperty(".ficha", "x") === 300
```

## Trampas

- **`x` e `y` en un contexto.** Los dos `quickTo` empatan en `revert()` y, en Firefox, el elemento conserva `transform: translate(0px)`. Crea antes `gsap.set(el, { x: "+=0" })`, que guarda el transform original y se deshace después que ellos. Ver [botón magnético](../14-recetas/rec-boton-magnetico.md). [C] [E]
- **Es solo para números.** Se renuncia a la conversión de unidades, los valores relativos (`"+=20"`), las funciones, `"random()"` y los plugins (`attr:`, `morphSVG`). Pasa el número ya calculado. [O]
- **Solo admite propiedades directas o CSS, sin alias.** `"x"` funciona; `"translateX"` no: usa el nombre que entiende GSAP. [O]
- **Crea la función una vez**, fuera del manejador del evento. Crearla dentro de `pointermove` elimina toda la ventaja. [P]
- **Propiedades que GSAP descompone**, como `borderRadius` o `scale`, no admiten el reinicio: `resetTo` avisa de `not eligible for reset`. Anima una de sus partes (`borderTopLeftRadius`, `scaleX` y `scaleY`). [C] [E]
- **Si la vista se retira**, créala dentro de `gsap.context()` para que su tween se limpie con el resto. [P]
