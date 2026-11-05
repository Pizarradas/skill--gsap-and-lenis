---
id: nuc-getproperty
titulo: gsap.getProperty() - leer valores
capa: 02-nucleo
tipo: api
ambito: core
resumen: Lee el valor actual de una propiedad como número, con unidad convertida o mediante una función reutilizable. Conoce transformaciones que getComputedStyle no separa.
api: [gsap.getProperty]
relacionadas: [nuc-quicksetter, nuc-consulta, css-transforms, fun-objetivos]
etiquetas: [lectura, medicion, transformaciones]
fuentes:
  - docs/v3/GSAP/gsap.getProperty().md
estado: verificado
version: 3.15.1
---
# gsap.getProperty()

Devuelve el valor actual de una propiedad de un objetivo. A diferencia de `getComputedStyle()`, entiende los componentes de transformación que usa GSAP (`x`, `rotation`, `scaleX`) en lugar de devolver una matriz, y da números limpios. [O] [C]

## Firma

```text
gsap.getProperty(objetivo, propiedad)          → número si se puede; si no, cadena
gsap.getProperty(objetivo, propiedad, unidad)  → cadena con esa unidad
gsap.getProperty(objetivo)                     → función (propiedad, unidad?) → valor
```

- Con selector o array, se usa el **primer** objetivo. [C]
- `"native"` como unidad devuelve el valor con su unidad original. Está en el código pero sin documentar. [C] [E]
- En un elemento, se busca en este orden: CSS inline, `getComputedStyle()`, propiedad del elemento y atributo. [O]
- En objetos propios lee la propiedad, y si es función la llama. [C] [E]

## Ejemplo

```html
<div id="tarjeta" style="width: 100px; font-size: 20px" data-orden="7" title="hola"></div>
```

```js
gsap.set("#tarjeta", { x: 20, rotation: 45, xPercent: 50 });

const numero = gsap.getProperty("#tarjeta", "x");
const conUnidad = gsap.getProperty("#tarjeta", "x", "px");
const enEm = gsap.getProperty("#tarjeta", "width", "em");
const nativo = gsap.getProperty("#tarjeta", "width", "native");
const atributo = gsap.getProperty("#tarjeta", "data-orden");
const color = gsap.getProperty("#tarjeta", "backgroundColor");

const leer = gsap.getProperty("#tarjeta");

// prueba: numero === 20
// prueba: conUnidad === "20px"
// prueba: enEm === "5em"
// prueba: nativo === "100px"
// prueba: atributo === 7
// prueba: color === "rgba(0, 0, 0, 0)"
// prueba: leer("rotation") === 45
// prueba: leer("xPercent") === 50
```

Objetos propios, y qué devuelve lo que no existe:

```html
<div id="vacio"></div>
```

```js
const leidos = {
  numeroEnCadena: gsap.getProperty({ a: "5px" }, "a"),
  funcion: gsap.getProperty({ a() { return 3; } }, "a"),
  ausenteEnObjeto: gsap.getProperty({}, "b"),
  ausenteEnElemento: gsap.getProperty("#vacio", "inventada"),
};

// prueba: leidos.numeroEnCadena === 5
// prueba: leidos.funcion === 3
// prueba: leidos.ausenteEnObjeto === undefined
// prueba: leidos.ausenteEnElemento === 0
```

La función reutilizable convierte la unidad, pero no la añade:

```html
<div id="ficha" style="width: 100px; font-size: 20px"></div>
```

```js
const medir = gsap.getProperty("#ficha");
const convertido = medir("width", "em");

// prueba: convertido === 5
```

## Trampas

- **`null` para lo que no existe.** La documentación dice que devuelve `null`; en 3.15.1 da `0` en un elemento y `undefined` en un objeto. No lo uses para detectar si una propiedad existe. [C] [E]
- **Conversión de `"rad"`.** Con transformaciones, la unidad solo se concatena: `gsap.getProperty(el, "rotation", "rad")` devuelve `"45rad"` con el número sin convertir. Convierte tú. [E]
- **Pasar unidad a la función reutilizable.** Devuelve número y no cadena, a diferencia de la llamada directa. [E]
- **Leer en mitad de la creación.** Si acabas de crear un tween, el valor puede no estar escrito aún: ver [modelo](../01-fundamentos/fun-modelo.md). [C]
- **Bucles.** Fuerza lectura de estilos en elementos: en bucles de animación, combínala con moderación o guarda el valor. [P]
- **Transformaciones ajenas.** Si otra librería o CSS cambia `transform` después de que GSAP lo leyera, la caché de GSAP queda desfasada. Pasa `true` como cuarto argumento (`uncache`) o anima solo con GSAP. [C] [P]
