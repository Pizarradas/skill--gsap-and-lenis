---
id: css-variables
titulo: Variables CSS
capa: 04-propiedades
tipo: concepto
ambito: CSSPlugin
resumen: Animar variables CSS con GSAP y usar var() como destino. Permite actualizar muchos elementos con un solo valor, y tiene reglas propias para colores y unidades.
requiere: [css-plugin]
relacionadas: [css-complejas, cal-rendimiento, fra-vanilla]
etiquetas: [css, variables, custom-properties]
fuentes:
  - docs/v3/GSAP/CorePlugins/CSS.md
estado: verificado
version: 3.15.1
---
# Variables CSS

GSAP anima propiedades personalizadas entre comillas, como `"--color"`. Es la forma de que un solo tween actualice todo lo que dependa de esa variable, y de exponer un valor a pseudoelementos, que no tienen objetivo propio. [O]

## Modelo mental

La variable se escribe con `style.setProperty()` en el elemento objetivo, y por herencia alcanza a sus descendientes. Hay dos usos, que no son lo mismo: [C]

| Forma | Qué hace |
|---|---|
| `gsap.to(el, { "--giro": "90deg" })` | Anima la variable. CSS la usa donde se referencie |
| `gsap.to(el, { width: "var(--destino)" })` | Lee el valor calculado y anima la propiedad hasta ahí. Al final escribe el texto `var(--destino)`, que sigue vivo |

Reglas al animar la variable: [C] [E]

| Valor inicial | Resultado |
|---|---|
| Color | Se interpola por canales, y al final queda el texto pedido |
| Número sin unidad | Número; destino sin unidad toma la de origen |
| Otra unidad | Convierte a la del destino |
| No definida | Parte de 0 |

## Ejemplo

Cambiar el acento de todo un bloque con un tween:

```html
<div class="tema" style="--acento:#ff0000;--tam:10">
  <span class="etiqueta" style="color:var(--acento)">texto</span>
</div>
```

```js
const tema = document.querySelector(".tema");
const cambio = gsap.to(tema, { "--acento": "#00ff00", duration: 1, ease: "none", paused: true });

cambio.progress(0.5);
const enMedio = tema.style.getPropertyValue("--acento");
cambio.progress(1);

const numero = gsap.to(tema, { "--tam": 20, duration: 1, ease: "none", paused: true });
numero.progress(0.5);

// prueba: enMedio === "rgba(128,128,0,1)"
// prueba: tema.style.getPropertyValue("--acento") === "#00ff00"
// prueba: tema.style.getPropertyValue("--tam") === "15"
```

Variable como destino. La propiedad se anima con el valor calculado y conserva la referencia al final: [E]

```html
<div class="barra" style="--destino:200px;width:100px"></div>
```

```js
const barra = document.querySelector(".barra");
const crecer = gsap.to(barra, { width: "var(--destino)", duration: 1, ease: "none", paused: true });

crecer.progress(0.5);
const mitad = barra.style.width;
crecer.progress(1);

// prueba: mitad === "150px"
// prueba: barra.style.width === "var(--destino)"
```

Otra unidad, variable sin definir y valor de origen con unidad:

```html
<div class="unidades" style="--mide:10px"></div>
```

```js
const caja = document.querySelector(".unidades");
const leer = (nombre) => caja.style.getPropertyValue(nombre);

const aRem = gsap.to(caja, { "--mide": "2rem", duration: 1, ease: "none", paused: true });
aRem.progress(0);
const convertida = leer("--mide");

const nueva = gsap.to(caja, { "--nueva": 20, duration: 1, ease: "none", paused: true });
nueva.progress(0.5);
const desdeCero = leer("--nueva");

gsap.set(caja, { "--borde": "5px" });
gsap.to(caja, { "--borde": 15, duration: 1, paused: true }).progress(1);

// prueba: convertida === "0.625rem"
// prueba: desdeCero === "10"
// prueba: leer("--borde") === "15px"
```

Variable global, en la raíz:

```js
gsap.set("html", { "--escala": 5 });

// prueba: document.documentElement.style.getPropertyValue("--escala") === "5"
```

## Trampas

- **`var()` en una transformación se lee como texto.** Con `x: "var(--dx)"` el tween acaba con esa cadena: `translate(var(--dx), 0px)`, y `gsap.getProperty(el, "x")` devuelve la cadena `"var(--dx)"`, no un número. Es correcto en pantalla, pero rompe cálculos posteriores con ese valor. [E]

```html
<div class="ficha" style="--dx:40px"></div>
```

```js
const ficha = document.querySelector(".ficha");
gsap.to(ficha, { x: "var(--dx)", duration: 1, paused: true }).progress(1);

// prueba: ficha.style.transform === "translate(var(--dx), 0px)"
// prueba: gsap.getProperty(ficha, "x") === "var(--dx)"
```

`revert()` no recupera el valor en línea previo:

```html
<div class="enlinea" style="--giro:10"></div>
```

```js
const caja = document.querySelector(".enlinea");
const tween = gsap.to(caja, { "--giro": 20, "--otra": 5, duration: 1, paused: true });
tween.progress(1);
tween.revert();

// prueba: caja.style.getPropertyValue("--giro") === ""
// prueba: caja.style.getPropertyValue("--otra") === ""
```

- **Sin nombre entre comillas es un error de sintaxis.** `--color: 1` no es una clave válida: `"--color": 1`. [P]
- **Animar variable provoca recálculo de estilos** en todo lo que hereda. Con muchos descendientes, una variable en la raíz puede costar más que animar los elementos. Colócala en el contenedor más cercano. Ver [rendimiento](../13-calidad/cal-rendimiento.md). [P]
- **El color intermedio es `rgba()`**, aunque origen y destino sean hexadecimales. Si la variable se usa en `color-mix()` o por partes, tenlo en cuenta. [E]
- **`revert()` borra la variable del estilo en línea,** y vuelve a mandar la de la hoja de estilos. Si la variable ya estaba en línea antes del tween, ese valor se pierde: GSAP lo guarda como `style["--x"]`, que siempre es `undefined`. [C] [E]
