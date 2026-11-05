---
id: nuc-quicksetter
titulo: gsap.quickSetter() - aplicar valores a alta frecuencia
capa: 02-nucleo
tipo: api
ambito: core
resumen: Función optimizada que escribe un valor al instante, sin crear tweens. Para pointermove o bucles donde gsap.set sería costoso.
api: [gsap.quickSetter, gsap.set]
relacionadas: [nuc-quickto, nuc-ticker, nuc-tween-metodos, utl-funciones, cal-rendimiento, rec-seguidor-cursor]
etiquetas: [rendimiento, puntero, setter]
fuentes:
  - docs/v3/GSAP/gsap.quickSetter().md
estado: verificado
version: 3.15.1
---
# gsap.quickSetter()

Devuelve una función ligada a una propiedad de uno o varios objetivos; cada llamada escribe el valor sin crear un tween. Según la documentación, rinde entre un 50 % y un 250 % mejor que `gsap.set()` cuando la propiedad cambia muchas veces. En casos normales `gsap.set()` es suficiente. [O]

## Firma

```text
gsap.quickSetter(targets, propiedad, unidad?) → funcion(valor) → undefined
```

| Parámetro | Nota |
|---|---|
| `targets` | Varios objetivos: los escribe todos con un mismo valor [C] [E] |
| `propiedad` | Nombre real que entiende GSAP, o un plugin como `"css"` o `"attr"` |
| `unidad` | Se concatena al número. Sin ella, va el número solo, y hace falta casi siempre: también en `x` y `rotation` [C] [E] |

Renuncia a [O] [C]:

- Conversión de unidades, valores relativos, funciones y `"random()"`.
- Alias que reparten en varias propiedades: `scale` y `autoAlpha`. La documentación pone `translateX` como ejemplo de alias que no funciona, pero en 3.15.1 sí funciona, como `rotate`. [C] [E]
- Parches por propiedad, como `transformOrigin` en SVG.

Con `"css"` o `"attr"` se recupera todo eso y se pueden pasar objetos, con menos ventaja de rendimiento, aunque más que con `gsap.set()`. [O] [E]

| Necesidad | Herramienta |
|---|---|
| Aplicar valores de golpe | `gsap.quickSetter()` |
| Llegar a valores con suavidad | [`gsap.quickTo()`](nuc-quickto.md) |
| Una escritura puntual | `gsap.set()` |

## Ejemplo

```js
const moverX = gsap.quickSetter(".marca", "x", "px");
const moverY = gsap.quickSetter(".marca", "y", "px");

window.addEventListener("pointermove", (e) => {
  moverX(e.clientX);
  moverY(e.clientY);
});

moverX(50);
const devuelve = moverY(20);

const segunda = document.querySelectorAll(".marca")[1];

// prueba: gsap.getProperty(segunda, "x") === 50
// prueba: gsap.getProperty(segunda, "y") === 20
// prueba: devuelve === undefined
```

Al final de un `pipe()`, y en modo objeto:

```html
<div class="deslizador"></div><div id="caja"></div>
<svg><circle class="foco" cx="1" cy="1" r="1"></circle></svg>
```

```js
const limitado = gsap.utils.pipe(
  gsap.utils.clamp(0, 100),
  gsap.utils.snap(5),
  gsap.quickSetter(".deslizador", "x", "px")
);
limitado(150);
const tope = gsap.getProperty(".deslizador", "x");
limitado(3);
const ajustado = gsap.getProperty(".deslizador", "x");

const estilo = gsap.quickSetter("#caja", "css");
estilo({ y: "+=10", rotation: 30 });
estilo({ y: "+=10" });

const atributos = gsap.quickSetter(".foco", "attr");
atributos({ cx: "+=4" });

// prueba: tope === 100
// prueba: ajustado === 5
// prueba: gsap.getProperty("#caja", "y") === 20
// prueba: gsap.getProperty("#caja", "rotation") === 30
// prueba: document.querySelector(".foco").getAttribute("cx") === "5"
```

Alias y unidades:

```js
const estilo = (selector) => document.querySelector(selector).style;

gsap.quickSetter(".alias-a", "scale")(2);
gsap.quickSetter(".alias-b", "autoAlpha")(0.5);
gsap.quickSetter(".alias-c", "translateX", "px")(50);
gsap.quickSetter(".alias-d", "rotate", "deg")(30);
gsap.quickSetter(".sin-unidad-a", "x")(50);
gsap.quickSetter(".sin-unidad-b", "rotation")(45);
gsap.quickSetter(".sin-unidad-c", "width")(77);
gsap.quickSetter(".sin-unidad-d", "scaleX")(2);

// prueba: gsap.getProperty(".alias-a", "scaleX") === 1
// prueba: estilo(".alias-b").opacity === "" && estilo(".alias-b").visibility === ""
// prueba: new DOMMatrix(estilo(".alias-c").transform).m41 === 50 && new DOMMatrix(estilo(".alias-c").transform).m42 === 0
// prueba: estilo(".alias-d").transform === "rotate(30deg)"
// prueba: estilo(".sin-unidad-a").transform === "" && estilo(".sin-unidad-b").transform === ""
// prueba: estilo(".sin-unidad-c").width !== "77px"
// prueba: estilo(".sin-unidad-d").transform === "scale(2, 1)"
```

## Trampas

- **`scale` y `autoAlpha` no funcionan y no avisan.** Son alias que GSAP reparte en dos propiedades. `gsap.quickSetter(el, "scale")(2)` no cambia nada: crea dos setters con `scaleX` y `scaleY`, o usa `"css"`, que también sirve para `autoAlpha`. [C] [E]
- **Olvidar la unidad.** El setter escribe exactamente lo que le das. En `width`, y también en `x`, `y` y `rotation`, un número sin unidad no pinta nada y no avisa: pasa `"px"` o `"deg"`. `scaleX` y `opacity` no la necesitan. [C] [E]
- **Crearlo dentro del evento.** Pierdes toda la ventaja. Créalo una vez y guarda la función. [P]
- **Sin revertir.** No crea tween: lo escrito no pasa por un Context, así que `ctx.revert()` no lo deshace. Limpia con `clearProps` o restablece el valor. [C]
- **Objetivo vacío.** No avisa si el selector no encuentra nada: escribe en un objeto ficticio. [C]
- **Escribir más veces que frames.** Un `pointermove` puede dispararse varias veces por frame. No suele importar, pero para trabajo costoso guarda el valor y aplícalo una vez en [`gsap.ticker`](nuc-ticker.md). [P]
