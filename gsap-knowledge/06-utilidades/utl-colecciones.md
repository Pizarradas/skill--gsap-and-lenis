---
id: utl-colecciones
titulo: Utilidades de colecciones
capa: 06-utilidades
tipo: api
ambito: core
resumen: toArray, selector, shuffle y distribute. Convertir objetivos en arrays, acotar selectores a un contenedor, barajar y repartir valores como un stagger.
api: [gsap.utils.toArray, gsap.utils.selector, gsap.utils.shuffle, gsap.utils.distribute, gsap.utils.DistributeConfig.amount, gsap.utils.DistributeConfig.axis, gsap.utils.DistributeConfig.base, gsap.utils.DistributeConfig.each, gsap.utils.DistributeConfig.ease, gsap.utils.DistributeConfig.from, gsap.utils.DistributeConfig.grid]
requiere: [utl-funciones]
relacionadas: [nuc-stagger, nuc-context, fun-objetivos, fra-agnostico]
etiquetas: [utilidades, arrays, selectores, stagger]
fuentes:
  - docs/v3/GSAP/UtilityMethods/toArray().md
  - docs/v3/GSAP/UtilityMethods/selector().md
  - docs/v3/GSAP/UtilityMethods/shuffle().md
  - docs/v3/GSAP/UtilityMethods/distribute().md
estado: verificado
version: 3.15.1
---
# Utilidades de colecciones

Funciones para obtener y ordenar objetivos, y para repartir un valor entre ellos. [O]

## Firma

| Función | Devuelve | Forma curried |
|---|---|---|
| `toArray(valor, ambito?, dejarCadenas?)` | Array plano | No: sin argumento, `[]` |
| `selector(ambito)` | Función `(selector) → array` | Siempre función |
| `shuffle(array)` | El **mismo** array, barajado | No: sin argumento, `TypeError` |
| `distribute(config)` | Función `(i, objetivo, objetivos) → valor` | Siempre función |

| `toArray` recibe | Resultado |
|---|---|
| Selector | Elementos en array, dentro de `ambito` si se indica |
| Array de selectores o elementos | Plano, con los selectores resueltos |
| `NodeList`, jQuery, array-like | Array |
| Un elemento u objeto | Array de uno |
| `null`, `undefined`, `0`, `false` | `[]` |
| Selector sin coincidencias | `[]` |

`distribute(config)` acepta un objeto, un número (equivale a `{ each: n }`) o una función, que devuelve tal cual. [C] [E]

| `DistributeConfig` | Defecto | Efecto |
|---|---|---|
| `base` | 0 | Valor de partida |
| `amount` | | Total a repartir. Se suma a `base` |
| `each` | | Cantidad por paso. Ignorado si hay `amount` [E] |
| `from` | 0 | Origen: índice, `"start"`, `"center"`, `"edges"`, `"end"`, `"random"`, ratio de 0 a 1, o `[ratioX, ratioY]` |
| `grid` | | `[filas, columnas]` o `"auto"`, que las detecta en DOM |
| `axis` | | En rejilla, mide solo en `"x"` o `"y"` |
| `ease` | `"none"` | Curva el reparto |

## Ejemplo

### `toArray`

```html
<section class="grupo"><p class="linea">a</p><p class="linea">b</p></section>
<p class="linea">fuera</p>
```

```js
const u = gsap.utils;
const grupo = document.querySelector(".grupo");
const original = [grupo];

// prueba: u.toArray(".linea").length === 3
// prueba: u.toArray(".linea", grupo).length === 2
// prueba: u.toArray([".linea", ".grupo"]).length === 4
// prueba: u.toArray(document.querySelectorAll(".linea")).length === 3
// prueba: u.toArray(grupo)[0] === grupo
// prueba: u.toArray("noexiste").length === 0
// prueba: u.toArray(null).length === 0
// prueba: u.toArray().length === 0
// prueba: u.toArray(".linea", null, true)[0] === ".linea"
// prueba: u.toArray(original) !== original
```

`dejarCadenas` trata el texto como texto y no como selector. No está en la documentación de la función, pero sí en los tipos. [C] [E]

### `selector`

Crea una versión de `querySelectorAll` acotada a un contenedor, que devuelve un array. Acepta un elemento, un selector, o un **objeto contenedor** que guarde el elemento en `.current` o `.nativeElement`, y lo desenvuelve en cada llamada. Sirve para cualquier tecnología que entregue la referencia al elemento de esa forma. Si el ámbito lo gestiona tu código, `gsap.context()` acota los selectores y además limpia. [O] [C]

```html
<div class="tarjeta"><span class="cifra">1</span><span class="cifra">2</span></div>
<span class="cifra">externa</span>
```

```js
const u = gsap.utils;
const tarjeta = document.querySelector(".tarjeta");

const porElemento = u.selector(tarjeta);
const porTexto = u.selector(".tarjeta");
const porContenedor = u.selector({ current: tarjeta });
const porNativo = u.selector({ nativeElement: tarjeta });

gsap.to(porElemento(".cifra"), { opacity: 0.5, duration: 0.05 });

// prueba: porElemento(".cifra").length === 2
// prueba: Array.isArray(porElemento(".cifra"))
// prueba: porTexto(".cifra").length === 2
// prueba: porContenedor(".cifra").length === 2
// prueba: porNativo(".cifra").length === 2
// prueba: gsap.getProperty(document.querySelectorAll(".cifra")[2], "opacity") === 1
```

### `shuffle`

```js
const numeros = [1, 2, 3, 4];
const mismo = gsap.utils.shuffle(numeros);

// prueba: mismo === numeros
// prueba: mismo.slice().sort().join() === "1,2,3,4"
```

### `distribute`

Es el motor de los [stagger](../02-nucleo/nuc-stagger.md) avanzados, pero sirve para cualquier propiedad. Con 5 objetivos y `amount: 100`: [E]

| Config | Valores |
|---|---|
| `{ amount: 100 }` | 0, 25, 50, 75, 100 |
| `{ each: 10 }` | 0, 10, 20, 30, 40 |
| `{ base: 50, amount: 100 }` | 50, 75, 100, 125, 150 |
| `{ amount: 100, from: "center" }` | 100, 50, 0, 50, 100 |
| `{ amount: 100, from: "edges" }` | 0, 50, 100, 50, 0 |
| `{ amount: 100, from: "end" }` | 100, 75, 50, 25, 0 |
| `{ amount: 100, ease: "power2.in" }` | 0, 1.5625, 12.5, 42.1875, 100 |

```js
const lista = [0, 0, 0, 0, 0];
const reparto = (config) => lista.map((v, i) => gsap.utils.distribute(config)(i, v, lista)).join();

const rejilla = [0, 0, 0, 0, 0, 0];
const enRejilla = (config) => rejilla.map((v, i) => gsap.utils.distribute(config)(i, v, rejilla)).join();

// prueba: reparto({ amount: 100 }) === "0,25,50,75,100"
// prueba: reparto({ each: 10 }) === "0,10,20,30,40"
// prueba: reparto({ base: 50, amount: 100 }) === "50,75,100,125,150"
// prueba: reparto({ amount: 100, from: "center" }) === "100,50,0,50,100"
// prueba: reparto({ amount: 100, from: "edges" }) === "0,50,100,50,0"
// prueba: reparto({ amount: 100, from: "end" }) === "100,75,50,25,0"
// prueba: reparto({ amount: 100, ease: "power2.in" }) === "0,1.5625,12.5,42.1875,100"
// prueba: reparto({ amount: 100, each: 1 }) === "0,25,50,75,100"
// prueba: enRejilla({ amount: 100, grid: [2, 3], axis: "y" }) === "0,0,0,100,100,100"
// prueba: enRejilla({ amount: 100, grid: [2, 3], axis: "x" }) === "0,50,100,0,50,100"
```

En un tween se pasa la función, y GSAP le da índice, objetivo y objetivos: [O] [E]

```js
gsap.set(".escalon", {
  x: gsap.utils.distribute({ base: 10, amount: 40 }),
});

const valores = gsap.utils.toArray(".escalon").map((el) => gsap.getProperty(el, "x"));

// prueba: valores.join() === "10,30,50"
```

## Trampas

- **`toArray("")` lanza `SyntaxError`.** Una cadena vacía se pasa a `querySelectorAll`. Protege selectores que vengan de datos. [E]

```js
let error = null;
try {
  gsap.utils.toArray("");
} catch (e) {
  error = e;
}

// prueba: error !== null && error.name === "SyntaxError"
```

- **Dentro de `gsap.context()` con ámbito,** `toArray(".x")` queda acotado al ámbito sin decirlo: un selector global encuentra menos de lo esperado. Pasa un ámbito explícito para salirte: `toArray(".x", document)`. [E]

```html
<div class="zona"><i class="punto"></i></div>
<i class="punto"></i>
```

```js
let dentro = 0;
let global = 0;
gsap.context(() => {
  dentro = gsap.utils.toArray(".punto").length;
  global = gsap.utils.toArray(".punto", document).length;
}, ".zona");

// prueba: dentro === 1
// prueba: global === 2
```

- **`selector()` con un contenedor vacío** (`{ current: null }`) no lanza: devuelve `[]` y avisa `Invalid scope` en cada llamada. Es el síntoma de usarlo antes de que el elemento exista en el DOM. Ver [integración](../12-frameworks/fra-agnostico.md). Con `null` también avisa al crearlo. [E]

```js
const avisos = [];
const original = console.warn;
console.warn = (...a) => {
  avisos.push(a.join(" "));
};
const vacia = gsap.utils.selector({ current: null })(".algo");
console.warn = original;

// prueba: vacia.length === 0
// prueba: avisos[0] === "Invalid scope"
```

- **`selector` resuelve en cada llamada**, no al crearse: sirve para contenido que se añade después. [C]
- **`shuffle` modifica el original.** Copia antes: `shuffle(a.slice())`. Además su reparto no es uniforme, porque usa `sort()` con comparador aleatorio. Para estadística real escribe Fisher-Yates. [C]
- **La función de `distribute` necesita el array.** Sin tercer argumento devuelve 0, salvo que `config.length`, no tipado, dé el tamaño. [E]

```js
const sinArray = gsap.utils.distribute({ amount: 100 })(2);
const conLength = gsap.utils.distribute({ amount: 100, length: 5 })(2);

// prueba: sinArray === 0
// prueba: conLength === 50
```

- **`from` decimal contra entero.** Entre 0 y 1 es una proporción; `1` en adelante es un índice. `from: 1` es el segundo elemento, no el final. [C] [E]
- **`from: "random"` se decide una vez,** cacheado por longitud, en cada función creada. [C]
- **`grid: "auto"` mide el DOM** con `getBoundingClientRect` y necesita elementos reales. En objetos planos da error. [C]
- **Las unidades de `amount`:** `{ amount: "100px" }` devuelve cadenas con `px`. [E]
