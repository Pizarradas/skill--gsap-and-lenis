---
id: css-clearprops
titulo: clearProps, limpiar estilos en línea
capa: 04-propiedades
tipo: api
ambito: CSSPlugin
resumen: Quita estilos en línea al terminar un tween para que vuelvan a mandar las clases. Por qué un componente de transform los borra todos y qué pasa en timelines y yoyo.
requiere: [css-transforms]
relacionadas: [css-plugin, nuc-limpieza, nuc-context]
etiquetas: [css, limpieza, inline]
fuentes:
  - docs/v3/GSAP/CorePlugins/CSS.md
estado: verificado
version: 3.15.1
---
# clearProps

Lista de propiedades que se eliminan del `style` en línea cuando el tween llega a su final. Devuelve el control a las hojas de estilos, por ejemplo tras una animación de entrada en un diseño adaptable. [O]

## Firma

```text
clearProps: "prop1,prop2"     lista separada por comas, en camelCase o CSS
clearProps: "all"             vacía style por completo
clearProps: true              igual que "all"
```

| Valor | Qué borra |
|---|---|
| `"opacity,left"` | Solo esas propiedades |
| `"x"`, `"scale"` o cualquier transformación | **Toda** la propiedad `transform`, y reinicia la caché [O] [C] |
| `"transformOrigin"` | El origen **y también** toda la transformación [C] |
| `"all"`, `true` | Todo `style`, incluidos estilos previos ajenos a GSAP [E] |

En SVG borra también el atributo `transform`. [O] [E]

Se ejecuta **antes** de `onComplete`, cuando el tiempo del tween alcanza su duración. [C] [E]

## Ejemplo

```js
const objetivo = document.querySelector(".entrada");

gsap.to(objetivo, {
  x: 10,
  opacity: 0.5,
  left: 3,
  duration: 0.05,
  clearProps: "x",
});

await new Promise((r) => setTimeout(r, 200));

// prueba: objetivo.style.transform === ""
// prueba: objetivo.style.opacity === "0.5"
// prueba: gsap.getProperty(objetivo, "x") === 0
```

Una sola propiedad de transformación limpia todas: [E]

```js
const doble = document.querySelector(".doble");
const parcial = gsap.to(doble, { x: 10, scale: 2, duration: 1, paused: true, clearProps: "scale" });

parcial.progress(0.5);
const enCurso = doble.style.transform !== "";
parcial.progress(1);

// prueba: enCurso === true
// prueba: doble.style.transform === ""
// prueba: gsap.getProperty(doble, "x") === 0
```

Con `gsap.set()` limpia al momento, útil para restaurar sin animación: [E]

```js
const fija = document.querySelector(".fija");
gsap.set(fija, { x: 10, scale: 2 });
gsap.set(fija, { clearProps: "transform" });

// prueba: fija.style.transform === ""
// prueba: gsap.getProperty(fija, "scaleX") === 1
```

## Trampas

- **`"all"` borra estilos que no puso GSAP**, como un `color` en línea del propio HTML. Si hay estilos previos, lista las propiedades o usa `revert()`, que solo quita lo añadido. [E]

```html
<div class="vestida" style="color:red"></div>
<div class="respetada" style="color:red"></div>
```

```js
const vestida = document.querySelector(".vestida");
gsap.to(vestida, { x: 10, duration: 0.01, clearProps: "all" });

const respetada = document.querySelector(".respetada");
const animacion = gsap.to(respetada, { x: 10, duration: 0.01 });
await new Promise((r) => setTimeout(r, 100));
animacion.revert();

// prueba: vestida.getAttribute("style") === ""
// prueba: respetada.style.color === "red" && respetada.style.transform === ""
```

- **En una timeline borra lo que necesita el siguiente tween.** Limpiar una transformación del elemento pone a cero su caché: si otro tween posterior anima `y`, la `x` lograda se pierde. Pon `clearProps` solo en el último tween del elemento. [E]

```js
const paso = document.querySelector(".paso");
gsap.timeline()
  .to(paso, { x: 50, duration: 0.01, clearProps: "x" })
  .to(paso, { y: 50, duration: 0.01 });

await new Promise((r) => setTimeout(r, 200));

// prueba: paso.style.transform === "translate(0px, 50px)"
```

- **Con `yoyo` que termina en el inicio no se limpia al final.** Solo actúa cuando el tiempo del tween coincide con su duración, y un `yoyo` con `repeat` impar acaba en 0. Limpia en `onComplete` con `gsap.set()`. [C] [E]

```js
const vaiven = document.querySelector(".vaiven");
gsap.to(vaiven, { x: 50, duration: 0.01, repeat: 1, yoyo: true, clearProps: "x" });

await new Promise((r) => setTimeout(r, 200));

// prueba: vaiven.style.transform !== "" && new DOMMatrix(vaiven.style.transform).isIdentity
```

- **Tampoco se ejecuta al invertir** hasta el inicio: si reproduces la animación hacia atrás, los estilos quedan. Además, si se limpió al llegar al final, los valores ya no están. No mezcles `clearProps` con animaciones reversibles. [C] [P]
- **Si el elemento pasa por `clearProps` a mitad de una timeline con `reverse()`,** el retroceso parte de valores perdidos. Usa `revert()` al desmontar. Ver [limpieza](../02-nucleo/nuc-limpieza.md). [P]
- **`gsap.set(el, { clearProps: "transform" })` no reinicia `transformOrigin`.** Son propiedades distintas: añádela a la lista. [C]
