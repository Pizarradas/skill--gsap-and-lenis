---
id: css-complejas
titulo: Valores complejos, sombras, filtros, degradados y clip-path
capa: 04-propiedades
tipo: concepto
ambito: CSSPlugin
resumen: Cómo interpola GSAP cadenas con varios números y colores. Por qué ambos extremos deben tener la misma estructura y cómo preparar el valor inicial.
requiere: [css-plugin]
relacionadas: [css-variables, css-attr, utl-numeros]
etiquetas: [css, sombras, filtros, colores]
fuentes:
  - docs/v3/GSAP/CorePlugins/CSS.md
estado: verificado
version: 3.15.1
---
# Valores complejos

GSAP anima cualquier cadena con números dentro: `boxShadow`, `filter`, `clipPath`, `backgroundImage`, `borderRadius` o `border`. Empareja por **orden de aparición** los números de la cadena inicial y de la final. Los colores se tratan como tres canales más alfa. [O] [C]

## Modelo mental

1. Normaliza los colores de ambas cadenas a `rgba()`, o a `hsla()` si el destino está en HSL.
2. Extrae todos los números con su unidad, por orden.
3. Empareja el primero con el primero, y así sucesivamente. Si en origen faltan, parte de 0.
4. Interpola cada número y compone la cadena final con los textos del **destino**.
5. Al terminar escribe el valor tal como lo pediste. [C]

De ahí la regla: **misma estructura en ambos extremos**. No hay análisis semántico: GSAP no sabe qué función de filtro es cada número. [C] [E]

| Propiedad | Se comporta como |
|---|---|
| `borderRadius`, `padding`, `margin`, `borderWidth` | GSAP descompone en cuatro lados o esquinas [C] |
| `boxShadow`, `textShadow` | Cadena con color; el orden lo normaliza el navegador |
| `filter`, `backdropFilter`, `clipPath` | Cadena: el orden de funciones debe coincidir |
| `backgroundImage` con degradado | Cadena: coinciden ángulo y paradas |
| `background` | El navegador normaliza; con color simple va como cadena de color |
| Colores | Canales. El alfa se interpola también [E] |

## Ejemplo

```html
<div class="sombra" style="box-shadow:0 0 0 0 rgba(255,0,0,0)"></div>
<div class="desenfoque" style="filter:blur(0px)"></div>
<div class="circulo" style="clip-path:circle(0% at 50% 50%)"></div>
```

```js
const sombra = document.querySelector(".sombra");
const desenfoque = document.querySelector(".desenfoque");
const circulo = document.querySelector(".circulo");

const tl = gsap.timeline({ paused: true, defaults: { duration: 1, ease: "none" } });
tl.to(sombra, { boxShadow: "10px 10px 20px 4px rgb(255, 0, 0)" }, 0)
  .to(desenfoque, { filter: "blur(10px)" }, 0)
  .to(circulo, { clipPath: "circle(100% at 50% 50%)" }, 0);

tl.progress(0.5);

// prueba: sombra.style.boxShadow === "rgba(255, 0, 0, 0.5) 5px 5px 10px 2px"
// prueba: desenfoque.style.filter === "blur(5px)"
// prueba: circulo.style.clipPath === "circle(50% at 50% 50%)"
```

Un degradado con la misma estructura:

```html
<div class="fondo" style="background-image:linear-gradient(90deg, rgb(255, 0, 0), rgb(0, 0, 255))"></div>
```

```js
const fondo = document.querySelector(".fondo");
const tween = gsap.to(fondo, {
  backgroundImage: "linear-gradient(180deg, rgb(0, 255, 0), rgb(0, 0, 0))",
  duration: 1,
  ease: "none",
  paused: true,
});

tween.progress(0.5);

// prueba: fondo.style.backgroundImage === "linear-gradient(135deg, rgb(128, 128, 0), rgb(0, 0, 128))"
```

Con destino HSL la mezcla sigue el círculo cromático, no la línea recta en RGB: [E]

```html
<div class="tono" style="color:hsl(0,100%,50%)"></div>
```

```js
const tono = document.querySelector(".tono");
const color = gsap.to(tono, { color: "hsl(120,100%,50%)", duration: 1, ease: "none", paused: true });

color.progress(0.5);

// prueba: tono.style.color === "rgb(255, 255, 0)"
```

## Trampas

- **Desde `none`, una sombra pasa por negro.** Sin sombra previa, el color parte de `rgba(0,0,0,0)` y el rojo se oscurece a mitad de camino. Define un inicio equivalente con el mismo color y alfa 0. [E]

```html
<div class="brillo"></div>
<div class="brillo-limpio" style="box-shadow:0 0 0 0 rgba(255,0,0,0)"></div>
```

```js
const brillo = document.querySelector(".brillo");
const limpio = document.querySelector(".brillo-limpio");

gsap.to(brillo, { boxShadow: "0 0 0 2px rgb(255, 0, 0)", duration: 1, ease: "none", paused: true }).progress(0.5);
gsap.to(limpio, { boxShadow: "0 0 0 2px rgb(255, 0, 0)", duration: 1, ease: "none", paused: true }).progress(0.5);

// prueba: brillo.style.boxShadow.startsWith("rgba(128, 0, 0, 0.5)")
// prueba: limpio.style.boxShadow.startsWith("rgba(255, 0, 0, 0.5)")
```

- **Filtros en otro orden se mezclan sin aviso.** Con `brightness(1)` a `blur(10px) brightness(2)`, el 1 se empareja con el 10: durante el tween `blur` parte de 1. Escribe las mismas funciones, en el mismo orden, en los dos extremos. [E]

```html
<div class="foto" style="filter:brightness(1)"></div>
<div class="foto-bien" style="filter:blur(0px) brightness(1)"></div>
```

```js
const foto = document.querySelector(".foto");
const fotoBien = document.querySelector(".foto-bien");

gsap.to(foto, { filter: "blur(10px) brightness(2)", duration: 1, ease: "none", paused: true }).progress(0.5);
gsap.to(fotoBien, { filter: "blur(10px) brightness(2)", duration: 1, ease: "none", paused: true }).progress(0.5);

// prueba: foto.style.filter === "blur(5.5px) brightness(1)"
// prueba: fotoBien.style.filter === "blur(5px) brightness(1.5)"
```

- **Un degradado desde `none` anima también el ángulo** desde 0: `linear-gradient(90deg, ...)` arranca girando. Parte de un degradado con el mismo ángulo y colores con alfa 0. [E]
- **Entre dos imágenes no hay intermedio.** `backgroundImage` de una URL a otra se cambia de golpe. Superpón dos capas y anima su opacidad. [O]
- **`borderRadius` no admite `quickTo`** porque se descompone. Anima una esquina. Ver [quickTo](../02-nucleo/nuc-quickto.md). [C]
- **`filter` y `boxShadow` son caros de pintar.** Evita animarlos en muchos elementos a la vez. Ver [rendimiento](../13-calidad/cal-rendimiento.md). [P]
- **Solo conoce 18 nombres de color** y `transparent`: `aqua`, `lime`, `silver`, `black`, `maroon`, `teal`, `blue`, `navy`, `white`, `olive`, `yellow`, `orange`, `gray`, `purple`, `green`, `red`, `pink` y `cyan`. Cualquier otro, como `rebeccapurple`, no es un color para GSAP: no hay interpolación: se mantiene el color inicial y cambia de golpe al final del tween. Usa valores hexadecimales, `rgb()` o `hsl()`. [C] [E]

```html
<div class="ciruela" style="color:rgb(0, 0, 0)"></div>
```

```js
const ciruela = document.querySelector(".ciruela");
const cambio = gsap.to(ciruela, { color: "rebeccapurple", duration: 1, ease: "none", paused: true });

cambio.progress(0.5);
const aMitad = ciruela.style.color;
cambio.progress(1);

// prueba: aMitad === "rgb(0, 0, 0)"
// prueba: ciruela.style.color === "rebeccapurple"
```

- **`oklch()` y similares se tratan como números sueltos.** No son colores para GSAP: cada cifra se interpola por su cuenta, sin convertir el origen, así que el camino no es una mezcla real de color. [E]
