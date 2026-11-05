---
id: utl-numeros
titulo: Utilidades numéricas
capa: 06-utilidades
tipo: api
ambito: core
resumen: clamp, mapRange, normalize, interpolate, snap, wrap, wrapYoyo y random, con su forma curried, sus configuraciones y sus casos límite.
api: [gsap.utils.clamp, gsap.utils.mapRange, gsap.utils.normalize, gsap.utils.interpolate, gsap.utils.snap, gsap.utils.wrap, gsap.utils.wrapYoyo, gsap.utils.random, gsap.utils.SnapNumberConfig.increment, gsap.utils.SnapNumberConfig.values, gsap.utils.SnapNumberConfig.radius, gsap.utils.SnapPoint2DConfig.values, gsap.utils.SnapPoint2DConfig.radius]
requiere: [utl-funciones]
relacionadas: [utl-colecciones, utl-cadenas, css-snap, css-modifiers]
etiquetas: [utilidades, matematicas, rango]
fuentes:
  - docs/v3/GSAP/UtilityMethods/clamp().md
  - docs/v3/GSAP/UtilityMethods/mapRange().md
  - docs/v3/GSAP/UtilityMethods/normalize().md
  - docs/v3/GSAP/UtilityMethods/interpolate().md
  - docs/v3/GSAP/UtilityMethods/snap().md
  - docs/v3/GSAP/UtilityMethods/wrap().md
  - docs/v3/GSAP/UtilityMethods/wrapYoyo().md
  - docs/v3/GSAP/UtilityMethods/random().md
estado: verificado
version: 3.15.1
---
# Utilidades numéricas

Cálculos habituales en animación. Todas aceptan la [forma curried](utl-funciones.md): sin el último argumento devuelven una función reutilizable. [O]

## Firma

| Función | Devuelve |
|---|---|
| `clamp(min, max, v?)` | `v` limitado al rango |
| `mapRange(aMin, aMax, bMin, bMax, v?)` | `v` llevado de un rango a otro, **sin limitar** |
| `normalize(min, max, v?)` | `mapRange` hacia 0 a 1 |
| `interpolate(a, b, p?)`, `interpolate(array, p?)` | Mezcla por progreso, de cualquier tipo compatible |
| `snap(config, v?)` | Valor ajustado |
| `wrap(min, max, v?)`, `wrap(array, i?)` | Da la vuelta: al superar `max` vuelve a `min` |
| `wrapYoyo(min, max, v?)`, `wrapYoyo(array, i?)` | Rebota en los extremos |
| `random(min, max, inc?, fn?)`, `random(array, fn?)` | Número o elemento al azar |

## Ejemplo

### `clamp`

```js
const limite = gsap.utils.clamp(0, 100);

// prueba: gsap.utils.clamp(0, 100, 105) === 100
// prueba: gsap.utils.clamp(0, 100, -5) === 0
// prueba: gsap.utils.clamp(0, 100, 20) === 20
// prueba: limite(150) === 100
```

### `mapRange` y `normalize`

```js
const aPx = gsap.utils.mapRange(0, 100, 0, 500);
const aFraccion = gsap.utils.normalize(0, 100);

// prueba: gsap.utils.mapRange(-10, 10, 100, 200, 0) === 150
// prueba: aPx(10) === 50
// prueba: gsap.utils.normalize(0, 100, 25) === 0.25
// prueba: aFraccion(25) === 0.25
// prueba: gsap.utils.mapRange(0, 100, 500, 0, 25) === 375
```

### `interpolate`

Mezcla números, colores, cadenas complejas y objetos. Con un array reparte el progreso entre tramos iguales. [O] [E]

| Tipo | Ejemplo | Con `p = 0.5` |
|---|---|---|
| Número | `(0, 500)` | `250` |
| Cadena con unidad | `("20px", "40px")` | `"30px"` |
| Varios números | `("1px 2px", "3px 4px")` | `"2px 3px"` |
| Color | `("red", "blue")` | `"rgba(128,0,128,1)"` |
| Objeto | `({ a: 0 }, { a: 100 })` | `{ a: 50 }` |
| Array | `([100, 50, 500], p)` | `50` |

```js
const u = gsap.utils;
const mezcla = u.interpolate(0, 100);
const paleta = u.interpolate(["red", "blue"]);

const origen = { a: 0 };
const mutado = u.interpolate(origen, { a: 10 }, 0.5, true);

// prueba: u.interpolate(0, 500, 0.5) === 250
// prueba: u.interpolate("20px", "40px", 0.5) === "30px"
// prueba: u.interpolate("1px 2px", "3px 4px", 0.5) === "2px 3px"
// prueba: u.interpolate("red", "blue", 0.5) === "rgba(128,0,128,1)"
// prueba: u.interpolate({ a: 0, c: "red" }, { a: 100, c: "blue" }, 0.5).a === 50
// prueba: u.interpolate([100, 50, 500], 0.5) === 50
// prueba: u.interpolate([100, 50, 500], 0.75) === 275
// prueba: mezcla(0.25) === 25
// prueba: paleta(0.5) === "rgba(128,0,128,1)"
// prueba: mutado === origen && origen.a === 5
```

Un cuarto argumento `true` hace que, con objetos, se escriba en el primero en lugar de crear uno nuevo, sin reservar memoria. No está en los tipos. [C] [E]

### `snap`

Tipos `gsap.utils.SnapNumberConfig` (`increment`, `values`, `radius`) y `gsap.utils.SnapPoint2DConfig` (`values`, `radius`). [C]

| Configuración | Efecto |
|---|---|
| `10` | Múltiplo más cercano |
| `[0, 50, 100]` | Valor más cercano de la lista |
| `{ values, radius }` | Solo si dista menos de `radius`; si no, queda igual |
| `{ increment, radius }` | Múltiplo, con radio |
| `{ values: [{ x, y }, ...], radius }` | Punto 2D más cercano, con distancia euclídea |

```js
const u = gsap.utils;
const paso = u.snap(5);
const lista = u.snap([100, 50, 500]);
const iman = u.snap({ values: [0, 100], radius: 10 });
const puntos = u.snap({
  values: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
  radius: 20,
});

// prueba: u.snap(10, 23.5) === 20
// prueba: paso(21) === 20
// prueba: lista(65) === 50
// prueba: iman(95) === 100
// prueba: iman(50) === 50
// prueba: u.snap({ increment: 50, radius: 5 }, 52) === 50
// prueba: u.snap({ increment: 50, radius: 5 }, 70) === 70
// prueba: u.snap({ increment: 50 })(70) === 50
// prueba: puntos({ x: 90, y: 95 }).x === 100
// prueba: puntos({ x: 50, y: 50 }).x === 50
// prueba: u.snap(5, "23px") === "25px"
// prueba: u.snap(0.1, 1.26) === 1.3
```

Sin `radius`, el ajuste a lista es siempre al más cercano. Las cadenas con unidad la conservan. [C] [E]

### `wrap` y `wrapYoyo`

```js
const u = gsap.utils;
const vuelta = u.wrap(5, 10);
const color = u.wrap(["rojo", "verde", "azul"]);
const vaiven = u.wrapYoyo(0, 10);
const paso = u.wrapYoyo(["a", "b", "c"]);

// prueba: u.wrap(5, 10, 12) === 7
// prueba: u.wrap(0, 10, -1) === 9
// prueba: vuelta(12) === 7
// prueba: u.wrap(["a", "b", "c"], -1) === "c"
// prueba: color(4) === "verde"
// prueba: u.wrapYoyo(5, 10, 12) === 8
// prueba: u.wrapYoyo(0, 10, -3) === 3
// prueba: vaiven(15) === 5
// prueba: [0, 1, 2, 3, 4, 5].map(paso).join("") === "abcbab"
```

`wrap` usa un rango **semiabierto**: `max` nunca aparece, se convierte en `min`. `wrapYoyo` sí llega a `max`. [E]

```js
// prueba: gsap.utils.wrap(5, 10, 10) === 5
// prueba: gsap.utils.wrapYoyo(0, 10, 10) === 10
```

### `random`

```js
const u = gsap.utils;
const dado = u.random(1, 6, 1, true);
const azar = u.random(-10, 10, true);
const fruta = u.random(["pera", "uva"], true);
const tiradas = Array.from({ length: 200 }, dado);

// prueba: typeof u.random(0, 10) === "number"
// prueba: typeof azar === "function" && typeof azar() === "number"
// prueba: ["pera", "uva"].includes(fruta())
// prueba: ["a", "b"].includes(u.random(["a", "b"]))
// prueba: tiradas.every((n) => Number.isInteger(n) && n >= 1 && n <= 6)
// prueba: u.random(5, 5) === 5
// prueba: u.random(0, 500, 5) % 5 === 0
```

En `vars` también existe la cadena `"random(-100, 100, 5)"`, que se evalúa por objetivo. Ver [valores](../01-fundamentos/fun-valores.md). [O]

## Trampas

- **`mapRange` no limita.** `mapRange(0, 100, 0, 500, 150)` da 750. Encadena con `clamp` en `pipe()`. [E]

```js
const seguro = gsap.utils.pipe(gsap.utils.clamp(0, 100), gsap.utils.mapRange(0, 100, 0, 500));

// prueba: gsap.utils.mapRange(0, 100, 0, 500, 150) === 750
// prueba: seguro(150) === 500
```

- **Rango de entrada nulo.** `normalize(5, 5, 5)` da 0, porque 0/0 se trata como 0, pero `mapRange(0, 0, 0, 500, 5)` da `Infinity`. Protege rangos calculados. [E]

```js
// prueba: gsap.utils.normalize(5, 5, 5) === 0
// prueba: gsap.utils.mapRange(0, 0, 0, 500, 5) === Infinity
```

- **`clamp` con los extremos invertidos** no los ordena: `clamp(100, 0, 50)` da 100. [E]
- **`clamp` no convierte cadenas.** `clamp(0, 100, "50")` devuelve la cadena `"50"`, y fuera de rango devuelve número. Convierte antes. [E]

```js
const u = gsap.utils;

// prueba: u.clamp(100, 0, 50) === 100
// prueba: u.clamp(0, 100, "50") === "50"
// prueba: u.clamp(0, 100, "150") === 100
```

- **`interpolate` extrapola fuera de 0 a 1** con números, y con un array y progreso negativo **lanza** un error. Limita el progreso. [E]

```js
let fallo = null;
try {
  gsap.utils.interpolate([0, 10, 20], -1);
} catch (e) {
  fallo = e;
}

// prueba: gsap.utils.interpolate(0, 100, 2) === 200
// prueba: fallo instanceof TypeError
```

- **`interpolate` no convierte unidades.** `"10px"` a `"2rem"` da `"6rem"`, operando los números tal cual. [E]

```js
// prueba: gsap.utils.interpolate("10px", "2rem", 0.5) === "6rem"
```

- **`wrapYoyo` con array:** la documentación escribe en un ejemplo que el índice 5 de tres elementos es `"red"` y en otro `"green"`. Lo correcto es el segundo elemento. [E]
- **`random(0, 10, 1)`, el tercer argumento es el incremento, no un flag.** Para obtener una función con incremento son cuatro argumentos; sin incremento, `random(0, 10, true)`. Un `false` final devuelve un número. [E]
- **`shuffle`, no `random`, para recorrer sin repetir.** `random(array)` puede dar el mismo dos veces. Ver [colecciones](utl-colecciones.md). [P]
- **`snap` con función como config.** `snap(fn)` devuelve una función que ajusta con `fn`, también con `radius`, pero no está documentado ni tipado. [C]
