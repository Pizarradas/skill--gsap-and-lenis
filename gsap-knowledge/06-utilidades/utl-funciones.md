---
id: utl-funciones
titulo: Utilidades, forma curried, pipe y unitize
capa: 06-utilidades
tipo: concepto
ambito: core
resumen: Mapa de gsap.utils con qué devuelve cada función al omitir el último argumento, cómo encadenarlas con pipe y unitize, y el fallo silencioso de pasar un valor vacío.
api: [gsap.utils.pipe, gsap.utils.unitize, gsap.utils.clamp, gsap.utils.mapRange, gsap.utils.normalize, gsap.utils.interpolate, gsap.utils.snap, gsap.utils.wrap, gsap.utils.wrapYoyo, gsap.utils.random, gsap.utils.distribute]
relacionadas: [utl-numeros, utl-colecciones, utl-cadenas, nuc-quickto, css-modifiers, fun-valores]
etiquetas: [utilidades, curried, funciones]
fuentes:
  - docs/v3/GSAP/UtilityMethods.md
  - docs/v3/GSAP/UtilityMethods/pipe().md
  - docs/v3/GSAP/UtilityMethods/unitize().md
estado: verificado
version: 3.15.1
---
# Utilidades y forma curried

`gsap.utils` agrupa funciones puras de cálculo. Muchas tienen dos caras: con todos los argumentos devuelven un resultado; sin el último devuelven una **función reutilizable** que recuerda la configuración. Eso permite enchufarlas en `pipe()`, `modifiers`, `quickTo` o en valores por función. [O]

## Modelo mental

Toda la familia usa el mismo mecanismo interno: si el último argumento es un valor utilizable, calcula; si no, devuelve la función. [C]

```text
valor || valor === 0 ? calcula(valor) : devuelve la función
```

### Qué pasa al omitir el último argumento

Comprobado función a función. [E]

| Función | Con último argumento | Sin él |
|---|---|---|
| `clamp(min, max, v)` | número | función `(v) → número` |
| `mapRange(a, b, c, d, v)` | número | función `(v) → número` |
| `normalize(min, max, v)` | número | función `(v) → número` |
| `interpolate(inicio, fin, p)` | valor interpolado | función `(p) → valor` |
| `interpolate(array, p)` | valor interpolado | función `(p) → valor` |
| `snap(config, v)` | valor ajustado | función `(v) → valor` |
| `wrap(min, max, i)`, `wrap(array, i)` | número o elemento | función `(i) → ...` |
| `wrapYoyo(min, max, i)`, `wrapYoyo(array, i)` | número o elemento | función `(i) → ...` |
| `random(min, max, inc?)`, `random(array)` | valor | Aquí el "último" es `true`: `random(min, max, inc, true)` **devuelve la función** |
| `distribute(config)` | | Siempre devuelve función |
| `pipe(...funciones)` | | Siempre devuelve función; sin funciones, la identidad |
| `unitize(fn, unidad?)` | Fuerza esa unidad | Sin `unidad`, conserva la de la entrada |
| `selector(ambito)` | | Siempre devuelve función |
| `getUnit(v)`, `splitColor(c)`, `checkPrefix(p)`, `shuffle(a)`, `toArray(v)` | Sin forma curried; ver sus fichas | Sin argumento, ver la tabla inferior |

Sin argumento, las que no son curried responden así: [E]

| Llamada | Resultado |
|---|---|
| `getUnit()` | `""` |
| `toArray()` | `[]` |
| `splitColor()` | `[0, 0, 0]` |
| `checkPrefix()` | Lanza `TypeError` |
| `shuffle()` | Lanza `TypeError` |

## Ejemplo

Cada función curried, con y sin el último argumento:

```js
const u = gsap.utils;

const directo = [
  u.clamp(0, 100, 150),
  u.mapRange(0, 10, 0, 100, 5),
  u.normalize(0, 100, 25),
  u.interpolate(0, 100, 0.5),
  u.interpolate([0, 10], 0.5),
  u.snap(5, 12),
  u.wrap(0, 10, 12),
  u.wrap(["a", "b"], 3),
  u.wrapYoyo(0, 10, 12),
  u.wrapYoyo(["a", "b", "c"], 3),
];

const curried = [
  u.clamp(0, 100)(150),
  u.mapRange(0, 10, 0, 100)(5),
  u.normalize(0, 100)(25),
  u.interpolate(0, 100)(0.5),
  u.interpolate([0, 10])(0.5),
  u.snap(5)(12),
  u.wrap(0, 10)(12),
  u.wrap(["a", "b"])(3),
  u.wrapYoyo(0, 10)(12),
  u.wrapYoyo(["a", "b", "c"])(3),
];

const azar = u.random(0, 10, 5, true);

const lanza = (fn) => {
  try {
    fn();
    return false;
  } catch (e) {
    return e instanceof TypeError;
  }
};

// prueba: u.getUnit() === "" && u.toArray().length === 0 && u.splitColor().join() === "0,0,0"
// prueba: lanza(() => u.checkPrefix()) && lanza(() => u.shuffle())
// prueba: directo.join() === "100,50,0.25,50,5,10,2,b,8,b"
// prueba: curried.join() === directo.join()
// prueba: [0, 5, 10].includes(azar())
// prueba: typeof u.distribute({ each: 1 }) === "function"
```

### `pipe()`

Compone funciones de izquierda a derecha, pasando el resultado de cada una a la siguiente. La primera recibe el valor; solo el **primer argumento**. [O] [E]

```js
const aPantalla = gsap.utils.pipe(
  gsap.utils.clamp(0, 100),
  gsap.utils.mapRange(0, 100, 0, 800),
  gsap.utils.snap(10),
);

// prueba: aPantalla(25.874) === 210
// prueba: aPantalla(500) === 800
// prueba: gsap.utils.pipe()(3) === 3
// prueba: gsap.utils.pipe((a, b) => a + (b || 0))(1, 2) === 1
```

Se combina con [`quickTo`](../02-nucleo/nuc-quickto.md) para filtrar valores antes de animarlos. [O]

### `unitize()`

Envuelve una función numérica: quita la unidad a la entrada con `parseFloat()` y la añade a la salida. Si no indicas unidad, usa la que traía la entrada; una entrada numérica no tiene unidad. Es la pareja natural de [`modifiers`](../04-propiedades/css-modifiers.md). [O] [E]

```js
const limitar = gsap.utils.unitize(gsap.utils.clamp(0, 100), "px");
const envolver = gsap.utils.unitize(gsap.utils.wrap(0, 100));

// prueba: limitar(132) === "100px"
// prueba: limitar("-20%") === "0px"
// prueba: envolver("150px") === "50px"
// prueba: envolver("130%") === "30%"
// prueba: envolver(130) === "30"
```

### Como valor por función

Si una propiedad recibe una función, GSAP la llama por objetivo con `(indice, objetivo, objetivos)`. Las curried que esperan un **índice**, como `wrap`, `wrapYoyo` y `distribute`, encajan directamente. [O] [E]

```js
gsap.set(".celda", { backgroundColor: gsap.utils.wrap(["rgb(255, 0, 0)", "rgb(0, 0, 255)"]) });

const celdas = gsap.utils.toArray(".celda");
const colores = celdas.map((c) => getComputedStyle(c).backgroundColor);

// prueba: colores[0] === "rgb(255, 0, 0)"
// prueba: colores[1] === "rgb(0, 0, 255)"
// prueba: colores[2] === "rgb(255, 0, 0)"
```

## Trampas

- **Un valor vacío devuelve una función, no un error.** `undefined`, `null`, `NaN`, `""` y `false` hacen que `clamp(0, 100, x)` devuelva la función en lugar de un número. Aguas abajo aparecen `NaN` o `"function..."` lejos de la causa, por ejemplo con un `parseFloat()` fallido o un `dataset` ausente. Solo el 0 se trata como valor. [E]

```js
const u = gsap.utils;
const fallidos = [undefined, null, NaN, "", false].map((v) => typeof u.clamp(0, 100, v));
const cero = u.clamp(0, 100, 0);

// prueba: fallidos.every((t) => t === "function")
// prueba: cero === 0
// prueba: typeof u.mapRange(0, 1, 0, 2, undefined) === "function"
// prueba: typeof u.wrap(0, 10, NaN) === "function"
// prueba: typeof u.snap(5, null) === "function"
// prueba: typeof u.interpolate(0, 100, undefined) === "function"
```

Valida la entrada antes de llamar, o normaliza con `Number(v) || 0`. [P]

- **Una curried no es un valor por función salvo que espere un índice.** `x: gsap.utils.clamp(0, 100)` llama a `clamp` con el índice del objetivo. Pasa un número ya calculado, o escribe `(i, el) => ...`. [E]

```js
gsap.set(".fila", { x: gsap.utils.mapRange(0, 2, 0, 100) });
const filas = gsap.utils.toArray(".fila").map((f) => gsap.getProperty(f, "x"));

// prueba: filas.join() === "0,50,100"
```

- **`unitize()` pierde la unidad en entradas numéricas** si no la declaras: `envolver(130)` da `"30"`, sin unidad. En `modifiers` de `x`, llega con `px`, así que no hay problema. [E]
- **Crea la función curried una vez.** Dentro de `pointermove` pierdes la ventaja. [P]
- **`pipe()` no captura errores** ni detiene la cadena si un paso devuelve `undefined`: el siguiente lo recibe, y si es curried devolverá una función. [C]
- **Importables sueltos.** `gsap.utils.clamp` también se exporta como `clamp` desde `gsap/gsap-core`, salvo `checkPrefix`, que solo existe en `gsap.utils` y requiere CSSPlugin. [C]
