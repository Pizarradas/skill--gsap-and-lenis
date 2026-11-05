---
id: utl-cadenas
titulo: Utilidades de cadenas, unidades y color
capa: 06-utilidades
tipo: api
ambito: core
resumen: getUnit, splitColor y checkPrefix. Extraer la unidad de un valor, descomponer colores y resolver prefijos, con los límites de cada una.
api: [gsap.utils.getUnit, gsap.utils.splitColor, gsap.utils.checkPrefix]
requiere: [utl-funciones]
relacionadas: [utl-numeros, css-plugin, css-complejas]
etiquetas: [utilidades, unidades, color]
fuentes:
  - docs/v3/GSAP/UtilityMethods/getUnit().md
  - docs/v3/GSAP/UtilityMethods/splitColor().md
  - docs/v3/GSAP/UtilityMethods/checkPrefix().md
estado: verificado
version: 3.15.1
---
# Utilidades de cadenas

Tres funciones para interpretar valores CSS en forma de texto. Ninguna tiene [forma curried](utl-funciones.md): siempre devuelven el resultado. [O]

## Firma

```text
gsap.utils.getUnit(valor)            → unidad, o ""
gsap.utils.splitColor(color, hsl?)   → [r, g, b] o [r, g, b, a], o [h, s, l, ...]
gsap.utils.checkPrefix(propiedad)    → nombre, con prefijo si lo necesita, o null
```

| Sin el último argumento | Resultado [E] |
|---|---|
| `getUnit()` | `""` |
| `splitColor("red")`, sin `hsl` | RGB |
| `splitColor()` | `[0, 0, 0]`, negro |
| `checkPrefix()` | Lanza `TypeError` |

| `splitColor` acepta | Ejemplo | Resultado |
|---|---|---|
| Nombre básico | `"red"` | `[255, 0, 0]` |
| Hexadecimal | `"#6fb936"`, `"#f00"` | `[111, 185, 54]`, `[255, 0, 0]` |
| Hexadecimal con alfa | `"#ff000080"` | `[255, 0, 0, 0.5019...]` |
| `rgb()`, `rgba()` | `"rgba(204,153,51,.5)"` | `[204, 153, 51, 0.5]` |
| `hsl()`, `hsla()` | `"hsl(120,100%,50%)"` | `[0, 255, 0]` |
| Número | `0xff0000` | `[255, 0, 0]` |

Con `hsl: true` devuelve `[tono, saturación, luminosidad]`. Un tercer argumento `true`, no tipado, fuerza el alfa. [C] [E]

## Ejemplo

```js
const u = gsap.utils;

// prueba: u.getUnit("50%") === "%"
// prueba: u.getUnit("100vw") === "vw"
// prueba: u.getUnit("-10.5px") === "px"
// prueba: u.getUnit("+=20px") === "px"
// prueba: u.getUnit(100) === ""
// prueba: u.getUnit("100") === ""
// prueba: u.getUnit() === ""
```

Descomponer un color para aclararlo:

```js
const [r, g, b] = gsap.utils.splitColor("#6fb936");
const claro = `rgba(${r}, ${g}, ${b}, 0.5)`;
const tono = gsap.utils.splitColor("#6fb936", true);

// prueba: claro === "rgba(111, 185, 54, 0.5)"
// prueba: tono.join() === "94,55,47"
```

Más formatos: [E]

```js
const u = gsap.utils;
const texto = (c, ...resto) => u.splitColor(c, ...resto).join();

// prueba: texto("red") === "255,0,0"
// prueba: texto("#f00") === "255,0,0"
// prueba: texto("rgba(204, 153, 51, 0.5)") === "204,153,51,0.5"
// prueba: texto("hsl(120,100%,50%)") === "0,255,0"
// prueba: texto("hsla(120,100%,50%,0.3)") === "0,255,0,0.3"
// prueba: texto("hsla(120,100%,50%,0.3)", true) === "120,100,50,0.3"
// prueba: u.splitColor(0xff0000).join() === "255,0,0"
// prueba: texto("red", false, true) === "255,0,0,1"
// prueba: u.splitColor("").join() === "0,0,0"
// prueba: u.splitColor().join() === "0,0,0"
```

`checkPrefix` devuelve el nombre JS utilizable:

```js
const propiedad = gsap.utils.checkPrefix("filter");
let sinArgumento = null;
try {
  gsap.utils.checkPrefix();
} catch (e) {
  sinArgumento = e;
}

// prueba: propiedad === "filter"
// prueba: gsap.utils.checkPrefix("transform") === "transform"
// prueba: gsap.utils.checkPrefix("noexiste") === null
// prueba: sinArgumento instanceof TypeError
```

## Trampas

- **`splitColor` no conoce todos los nombres CSS.** Solo 19 básicos, y cualquier otro cae en blanco transparente: `"rebeccapurple"` da `[255, 255, 255, 0]`, sin aviso. Para colores calculados, lee `getComputedStyle()` y pasa el `rgb()`. [C] [E]

```js
// prueba: gsap.utils.splitColor("rebeccapurple").join() === "255,255,255,0"
// prueba: gsap.utils.splitColor("transparent").join() === "255,255,255,0"
```

- **La sintaxis moderna del CSS no se interpreta bien.** Extrae los números tal cual: en `"rgb(1 2 3 / 50%)"` el alfa llega como `50`, no `0.5`. `"oklch(50% 0.1 20)"` devuelve esas cifras como si fueran canales. Usa comas o normaliza. [E]

```js
// prueba: gsap.utils.splitColor("rgb(1 2 3 / 50%)").join() === "1,2,3,50"
// prueba: gsap.utils.splitColor("oklch(50% 0.1 20)").join() === "50,0.1,20"
```

- **`getUnit` solo reconoce número seguido de unidad.** `"translateX(20px)"` y `"10 px"` dan `""`. [E]

```js
// prueba: gsap.utils.getUnit("translateX(20px)") === ""
// prueba: gsap.utils.getUnit("10 px") === ""
// prueba: gsap.utils.getUnit("100.100") === ""
```

- **`checkPrefix` devuelve `null`, no `undefined`,** para propiedades inexistentes, a diferencia de lo que dice la documentación. Usa `if (!prop)`. [E]
- **`checkPrefix` lo aporta CSSPlugin.** No se exporta suelto desde `gsap/gsap-core`. En un entorno sin DOM no funciona. [C]
- **`checkPrefix` en navegadores actuales** rara vez devuelve algo con prefijo, y acepta tanto `fontSize` como `font-size` si `style` lo reconoce. [E]
- **`splitColor` con alfa:** la longitud del array varía. Comprueba `.length` o usa el tercer argumento. [E]
