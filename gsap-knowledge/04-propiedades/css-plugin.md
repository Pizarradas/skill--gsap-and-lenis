---
id: css-plugin
titulo: CSSPlugin, animar propiedades CSS
capa: 04-propiedades
tipo: plugin
ambito: CSSPlugin
resumen: Qué propiedades CSS anima GSAP, cómo trata nombres, unidades y valores no animables, y las trampas de autoRound, display y height auto.
api: [gsap.TweenVars.css, gsap.plugins.css, gsap.config]
requiere: [fun-valores]
relacionadas: [css-transforms, css-autoalpha, css-clearprops, css-complejas, css-variables, css-attr, fun-plugins, int-flip]
etiquetas: [css, unidades, dom]
fuentes:
  - docs/v3/GSAP/CorePlugins/CSS.md
estado: verificado
version: 3.15.1
---
# CSSPlugin

Plugin interno que aplica las propiedades de `vars` a los elementos del DOM. No hay lista cerrada: anima cualquier propiedad CSS con valores intermedios válidos, también algunas que el CSS no considera animables. [O]

## Para qué sirve

Es lo que hace funcionar `gsap.to(".caja", { opacity: 0 })`. Interpreta el nombre, lee el valor actual, convierte unidades y escribe el estilo en línea en cada tick. Las transformaciones tienen tratamiento aparte: [transformaciones](css-transforms.md). [O]

## Registro

Viene con `gsap`. No hay que importarlo ni registrarlo. El envoltorio `css: { ... }` es histórico y ya no hace falta, aunque sigue funcionando. [O] [E]

```js
gsap.set(".caja-a", { css: { x: 10 } });
gsap.set(".caja-b", { x: 10 });

// prueba: document.querySelector(".caja-a").style.transform === document.querySelector(".caja-b").style.transform
```

## API

### Nombres y valores

| Regla | Ejemplo |
|---|---|
| Con guion pasa a camelCase | `backgroundColor`, `fontSize` [O] |
| Sin unidad, GSAP aplica un valor por defecto | `x: 24` son px, `rotation: 90` son grados [O] |
| Otra unidad, como cadena | `x: "20vw"`, `rotation: "1.25rad"` [O] |
| Unidad distinta a la actual | Convierte, por ejemplo de `%` a `px` [O] |
| Relativos | `x: "+=30"`, y también `"*=2"` y `"/=2"` [E] |
| Alias | `alpha` es `opacity`; `autoAlpha` añade visibilidad [C] |

Unidades por defecto: `px` en `x`, `y`, `z`, `top`, `right`, `bottom`, `left`, `width`, `height`, `fontSize`, `padding`, `margin` y `perspective`. `deg` en rotaciones y `skew*`. `lineHeight` queda sin unidad. Se cambian con `gsap.config({ units: { left: "%" } })`. [C] [E]

```js
gsap.config({ units: { left: "%" } });
gsap.set(".marca", { position: "absolute", left: 50 });
const izquierda = document.querySelector(".marca").style.left;
gsap.config({ units: { left: "px" } });

const otra = document.querySelectorAll(".marca")[1];
gsap.set(otra, { skewX: 10, rotation: 5, lineHeight: 2, top: 3 });

// prueba: izquierda === "50%"
// prueba: new DOMMatrix(otra.style.transform).toString() === new DOMMatrix("rotate(5deg) skew(10deg, 0deg)").toString()
// prueba: otra.style.lineHeight === "2" && otra.style.top === "3px"
```

Los relativos multiplicativos existen en el código, aunque la documentación solo cita `+=` y `-=`: [E]

```html
<div class="doblar" style="width:50px"></div>
```

```js
gsap.set(".doblar", { width: "*=2" });
const doblado = document.querySelector(".doblar").style.width;
gsap.set(".doblar", { width: "/=4", x: 10 });
gsap.set(".doblar", { x: "*=3" });

// prueba: doblado === "100px"
// prueba: document.querySelector(".doblar").style.width === "25px"
// prueba: gsap.getProperty(".doblar", "x") === 30
```

### Valores no animables

Si un valor no tiene intermedios, como `position: "absolute"` o `borderStyle: "solid"`, se aplica de golpe. [O]

| Valor | Cuándo se aplica |
|---|---|
| General | Al primer render del tween, tras su `delay` [C] |
| `display: "none"` | Al final [O] |

El layout real no se interpola bien. Para mover un elemento entre contenedores o reordenar una rejilla, usa [Flip](../10-interaccion/int-flip.md). [O]

### Quién resuelve cada clave

Por cada clave de `vars`, en este orden: [C]

1. Si existe un plugin con ese nombre, el plugin (`attr`, `motionPath`, `scrollTo`…).
2. Si es especial, su tratamiento (`clearProps`, `borderRadius`, `padding`, `margin`, `borderWidth`).
3. Si empieza por `--`, [variable CSS](css-variables.md).
4. Si es transformación, la caché de [transformaciones](css-transforms.md).
5. Si está en `element.style`, CSS normal.
6. Si existe en el elemento, propiedad JS: `scrollTop`, o cualquier propiedad propia.
7. Si nada coincide, aviso `Invalid property`.

### Objeto `gsap.plugins`

Son los plugins registrados, por el nombre de su clave en `vars`: `css`, `cssRule`, `drawSVG`, `easel`, `attr`, `modifiers`, `snap`, `inertia`, `morphSVG`, `motionPath`, `physics2D`, `physicsProps`, `pixi`, `scrambleText`, `text`. Además existen `endArray`, `roundProps` y `scrollTo` en ejecución. Los internos son `css`, `attr`, `endArray`, `modifiers`, `snap` y `roundProps`; este último es la forma antigua de `snap`. [C] [E]

```js
const nombres = Object.keys(gsap.plugins);

// prueba: ["css", "cssRule", "drawSVG", "easel", "attr", "modifiers", "snap", "inertia", "morphSVG", "motionPath", "physics2D", "physicsProps", "pixi", "scrambleText", "text", "endArray", "roundProps", "scrollTo"].every((n) => nombres.includes(n))
```

## Ejemplo

```html
<div class="panel" style="width:50px;height:50px;font-size:10px"></div>
```

```js
const panel = document.querySelector(".panel");

gsap.to(panel, {
  width: "50vw",
  fontSize: "2em",
  backgroundColor: "rgb(0, 128, 0)",
  duration: 0.2,
});

// prueba: panel.style.width === "50vw"
// prueba: panel.style.fontSize === "2em"
// prueba: getComputedStyle(panel).backgroundColor === "rgb(0, 128, 0)"
```

Animar hasta la altura natural. GSAP mide `auto`, anima en px y al final deja `auto`, de modo que el contenido puede crecer después. [O] [E]

```html
<div class="pliego" style="height:0;overflow:hidden"><div style="height:100px"></div></div>
```

```js
const pliego = document.querySelector(".pliego");
const abrir = gsap.to(pliego, { height: "auto", duration: 1, ease: "none", paused: true });

abrir.progress(0.5);
const enMedio = pliego.style.height;
abrir.progress(1);

// prueba: enMedio === "50px"
// prueba: pliego.style.height === "auto"
```

## Trampas

- **Los px no-transform se redondean, también el valor final.** `autoRound` actúa sobre propiedades en px y `zIndex`, en cada render y no solo en los intermedios: `width: 100.5` termina en `101px`. Pasa `autoRound: false` si necesitas la fracción. `x` y `y` no se redondean. [E]

```html
<div class="medida"></div>
```

```js
const medida = document.querySelector(".medida");
gsap.set(medida, { width: 100.5 });
const redondeado = medida.style.width;

gsap.set(medida, { width: 100.5, autoRound: false });
const exacto = medida.style.width;

gsap.set(medida, { x: 100.5 });

// prueba: redondeado === "101px"
// prueba: exacto === "100.5px"
// prueba: new DOMMatrix(medida.style.transform).m41 === 100.5
```

- **`display: "none"` escribe `display` durante el tween.** Mientras dura, el elemento recibe en línea el valor inicial que leyó, por ejemplo `block`, aunque viniera de una hoja de estilos. Con `display: "flex"` en una regla posterior puede romper el layout. Al revertir se restaura. [E]

```html
<div class="aviso"></div>
```

```js
const aviso = document.querySelector(".aviso");
const ocultar = gsap.to(aviso, { display: "none", opacity: 0, duration: 1, paused: true });

ocultar.progress(0.5);
const durante = aviso.style.display;
ocultar.progress(1);
const final = aviso.style.display;
ocultar.revert();

// prueba: durante === "block"
// prueba: final === "none"
// prueba: aviso.style.display === ""
```

- **Una clave desconocida no rompe nada, solo avisa.** `Invalid property` en consola suele ser un plugin sin registrar o un nombre con guion sin entrecomillar. Ver [errores comunes](../13-calidad/cal-errores-comunes.md). [C]
- **Los estilos quedan en línea** al acabar y ganan a las clases. Si una clase debe mandar luego, usa [clearProps](css-clearprops.md) o `revert()`. [O]
- **Animar `width`, `height`, `top` o `left` provoca layout en cada frame.** Para mover cosas usa `x`, `y` y `scale`. Ver [rendimiento](../13-calidad/cal-rendimiento.md). [P]
- **Las transiciones CSS en la misma propiedad compiten** con GSAP, que escribe en cada tick. Quita `transition` de lo que anima GSAP. Ver [conflictos](../13-calidad/cal-conflictos.md). [P]
- **`CSSPlugin.defaultSmoothOrigin`** aparece en la documentación pero no existe en 3.15.1. [C]
