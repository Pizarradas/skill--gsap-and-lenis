---
id: fun-valores
titulo: Valores - relativos, dinámicos, aleatorios y unidades
capa: 01-fundamentos
tipo: concepto
ambito: core
resumen: Formas de escribir un valor destino - número, unidades, relativo, función por objetivo, random(), colores y cadenas complejas.
api: [gsap.TweenVars.startAt, gsap.AnimationVars.repeatRefresh, gsap.GSAPConfig.units, Animation.invalidate]
relacionadas: [fun-objetivos, fun-modelo, nuc-repeat-yoyo, nuc-defaults-config, utl-numeros, css-transforms]
etiquetas: [valores, relativos, random, unidades]
fuentes:
  - docs/v3/GSAP/gsap.to().md
  - docs/v3/GSAP/gsap.from().md
  - docs/v3/GSAP/gsap.fromTo().md
  - resources/get-started.md
estado: verificado
version: 3.15.1
---
# Valores

En `vars`, toda clave que no sea una propiedad especial se interpreta como algo que animar. Su valor admite bastante más que un número. [O]

## Modelo mental

| Forma | Ejemplo | Se resuelve |
|---|---|---|
| Número | `x: 100` | Unidad por defecto: `px` en longitudes y `deg` en rotaciones [O] |
| Con unidad | `width: "50%"`, `x: "2rem"` | CSSPlugin convierte el valor inicial [O] |
| Relativo | `"+=20"`, `"-=20"`, `"*=2"`, `"/=2"` | Sobre el valor al inicializar. `*=` y `/=` no aparecen en la documentación, pero existen [O] [C] [E] |
| Función | `x: (i, el, todos) => i * 50` | Una vez por objetivo, en la inicialización [O] |
| Aleatorio | `"random(-100, 100, 5)"`, `"random([0, 50, 90])"` | Por objetivo; el tercer número redondea [O] |
| Color | `backgroundColor: "#f00"`, `"rgb(0,0,0)"` | Interpola canales [O] |
| Cadena compleja | `boxShadow: "0 0 10px red"`, `"a 3 b 4"` | Interpola cada número si la forma coincide [O] [E] |

La función recibe `index`, `target` y `targets` (igual que `tween.targets()`). Usa ese índice para distribuir valores; para escalonar el arranque existe [stagger](../02-nucleo/nuc-stagger.md). [O]

`startAt` fuerza valores de partida justo antes de iniciar, incluso de propiedades que no se animan: `startAt: { x: -100, opacity: 0 }`. [O]

## Ejemplo

```js
const m = { a: 10, b: 10, c: 10, d: 10, medida: "10px", tinte: "rgb(255,0,0)", texto: "a 1 b 2" };

gsap.to(m, {
  a: "*=2",
  b: "/=2",
  c: "+=5",
  d: "-=5",
  medida: "+=5",
  tinte: "rgb(0,0,0)",
  texto: "a 3 b 4",
  duration: 0.05,
});

// prueba: m.a === 20 && m.b === 5 && m.c === 15 && m.d === 5
// prueba: m.medida === "15px"
// prueba: m.tinte === "rgb(0,0,0)"
// prueba: m.texto === "a 3 b 4"
```

Valor por objetivo con función y `random()`:

```js
const objetos = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];

gsap.to(objetos, {
  x: (i) => i * 50,
  y: "random(0, 100, 10)",
  duration: 0.05,
});

// prueba: objetos[2].x === 100
// prueba: objetos.every((o) => o.y % 10 === 0 && o.y >= 0 && o.y <= 100)
```

Un relativo con `repeat` se resuelve **una sola vez**, salvo que refresques:

```js
const sinRefresco = { x: 0 };
const conRefresco = { x: 0 };

gsap.to(sinRefresco, { x: "+=10", duration: 0.03, repeat: 2 });
gsap.to(conRefresco, { x: "+=10", duration: 0.03, repeat: 2, repeatRefresh: true });

// prueba: sinRefresco.x === 10
// prueba: conRefresco.x === 30
```

## Trampas

- **`"random()"` y funciones no se recalculan solos.** Solo se resuelven una vez por objetivo. `repeat: -1` repite el mismo valor; añade `repeatRefresh: true` para obtener uno nuevo en cada vuelta. `duration` y `delay` no se refrescan. [O] [E]
- **Relativo y `restart()`.** `restart()` reproduce los valores ya grabados, no vuelve a sumar. Llama antes a `invalidate()`, que limpia lo grabado sin tocar la temporización. [O] [E]
- **Relativos en bucle.** Lanzar `gsap.to(el, { x: "+=100" })` en cada clic mientras otro sigue activo acumula desde un valor intermedio. Calcula el destino o usa `overwrite`. [P]
- **Formas distintas de cadena.** Animar entre `"auto"` y un número, o entre listas de longitud distinta, no se interpola bien: normaliza ambos extremos. Ver `css-complejas`. [P]
- **Valor numérico con unidad en objetos propios.** `{ medida: 10 }` hacia `"+=5"` da número, y `"10px"` conserva `px`: la unidad la aporta el valor actual. [C] [E]
- **`x` no es `left`.** `x` es una transformación y no afecta al layout; `left` sí, y además es más costoso. Ver `css-transforms`. [O]
- **Cambiar la unidad por defecto** con `gsap.config({ units: { left: "%" } })` afecta a todo el proyecto. Prefiere escribir la unidad en cada valor. [O] [P]
