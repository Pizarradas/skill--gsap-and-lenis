---
id: css-attr
titulo: AttrPlugin, animar atributos
capa: 04-propiedades
tipo: plugin
ambito: AttrPlugin
resumen: Anima atributos numéricos de HTML y SVG con attr. Cuándo usarlo en lugar de CSS y qué ocurre con unidades, colores y rutas.
api: [gsap.TweenVars.attr, gsap.plugins.attr]
relacionadas: [css-plugin, svg-guia, svg-drawsvg, css-complejas]
etiquetas: [svg, atributos, plugin]
fuentes:
  - docs/v3/GSAP/CorePlugins/Attributes.md
estado: verificado
version: 3.15.1
---
# AttrPlugin

Anima los atributos de un elemento, en lugar de sus estilos. Es la forma natural de tocar geometría SVG, como `x`, `width`, `r` o `points`, y atributos propios como `data-*`. [O]

## Para qué sirve

Dentro de `attr` se lee el atributo con `getAttribute()`, se interpola y se escribe con `setAttribute()`. Fuera de `attr`, las mismas palabras pueden ser otra cosa: en un `<rect>`, `x` fuera es la traslación CSS y `attr: { x }` es la coordenada real. [O] [C]

## Registro

Incluido en el núcleo. No se importa ni se registra. [O]

## API

```text
attr: { nombre: valor, ... }
```

| Valor | Comportamiento |
|---|---|
| Número | Interpola |
| Con sufijo: `"80%"` | Conserva el sufijo del destino |
| Relativo: `"+=10"` | Respecto al valor actual [E] |
| Función | Se evalúa por objetivo con `(indice, objetivo, objetivos)` [E] |
| Color | Interpola como color y escribe `rgba()` [E] |
| Cadena con números | Empareja números, como en [valores complejos](css-complejas.md): `d`, `points`, `viewBox` [E] |
| Texto sin números | Se aplica de golpe [E] |

Se anima cualquier cantidad de atributos a la vez. `revert()` devuelve el valor original. [O] [E]

## Ejemplo

```html
<svg width="200" height="100"><rect class="barra" x="0" y="0" width="50%" height="20"/></svg>
```

```js
const barra = document.querySelector(".barra");

gsap.to(barra, {
  attr: { width: "100%", x: 10, y: "+=5" },
  duration: 0.1,
  ease: "none",
});

await new Promise((r) => setTimeout(r, 250));

// prueba: barra.getAttribute("width") === "100%"
// prueba: barra.getAttribute("x") === "10"
// prueba: barra.getAttribute("y") === "5"
```

Geometría y traslación CSS en un mismo tween:

```html
<svg width="200" height="100"><rect class="mixto" x="0" y="0" width="10" height="10"/></svg>
```

```js
const mixto = document.querySelector(".mixto");
gsap.set(mixto, { attr: { x: 50 }, x: 20 });

// prueba: mixto.getAttribute("x") === "50"
// prueba: gsap.getProperty(mixto, "x") === 20
```

Atributos propios, puntos y rutas:

```html
<div class="contador" data-n="0"></div>
<svg width="100" height="100"><polygon class="forma" points="0,0 10,0 10,10"/></svg>
```

```js
const contador = document.querySelector(".contador");
const forma = document.querySelector(".forma");

const tl = gsap.timeline({ paused: true, defaults: { duration: 1, ease: "none" } });
tl.to(contador, { attr: { "data-n": 10 } }, 0).to(forma, { attr: { points: "0,0 20,0 20,20" } }, 0);
tl.progress(0.5);

// prueba: contador.getAttribute("data-n") === "5"
// prueba: forma.getAttribute("points") === "0,0 15,0 15,15"
```

## Trampas

- **No convierte unidades.** De `100%` a `"100px"` no calcula nada: empareja el número y el resultado es `100px` desde el primer render. Si origen y destino usan unidades distintas, unifícalas antes. [O] [E]

```html
<svg width="200" height="100"><rect class="ancho" width="100%" height="10"/></svg>
```

```js
const ancho = document.querySelector(".ancho");
gsap.to(ancho, { attr: { width: "100px" }, duration: 1, ease: "none", paused: true }).progress(0.5);

// prueba: ancho.getAttribute("width") === "100px"
```

- **No anime CSS dentro de `attr`.** `attr: { opacity: 0.5 }` escribe un atributo, que tiene menos prioridad que el CSS. Las propiedades CSS van fuera. [O]
- **Atributo inexistente:** parte de 0. [C]
- **`d` y `points` solo interpolan con la misma estructura.** Para rutas con distinto número de puntos usa [MorphSVG](../09-svg/svg-morphsvg.md). [C]
- **Los decimales se escriben sin redondear.** En un contador visible, combina con [`snap`](css-snap.md) o redondea en `onUpdate`. [E]
