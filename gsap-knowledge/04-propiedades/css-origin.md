---
id: css-origin
titulo: transformOrigin, svgOrigin y smoothOrigin
capa: 04-propiedades
tipo: api
ambito: CSSPlugin
resumen: Elegir el punto alrededor del que giran y escalan los elementos, en HTML y SVG. No se interpola, admite profundidad y en SVG evita saltos al cambiar.
api: [gsap.CSSProperties.svgOrigin, gsap.CSSProperties.smoothOrigin]
requiere: [css-transforms]
relacionadas: [css-rotacion, svg-guia]
etiquetas: [css, transform, svg, origen]
fuentes:
  - docs/v3/GSAP/CorePlugins/CSS.md
estado: verificado
version: 3.15.1
---
# transformOrigin

Punto alrededor del que ocurren las transformaciones. Por defecto es el centro, `"50% 50%"`. En SVG, GSAP hace que funcione igual en todos los navegadores. [O]

## Firma

```text
transformOrigin: "x y z?"     palabras clave, %, px; z solo en px
svgOrigin: "x y"              coordenadas globales del SVG, sin %
smoothOrigin: true | false    evita el salto al cambiar el origen en SVG
```

| Valor | Resultado |
|---|---|
| `"left top"`, `"top left"` | `0% 0%`: GSAP reordena las palabras invertidas [C] [E] |
| `"bottom right"` | `100% 100%` |
| `"center"` | `50% 50%` |
| `"50px 20px"` | Desde la esquina superior izquierda del elemento |
| `"50% 50% -400px"` | Con profundidad, para giros 3D en torno a un punto lejano |

| | `transformOrigin` | `svgOrigin` |
|---|---|---|
| Sistema de referencia | Caja del propio elemento | Sistema global del `<svg>` |
| Unidades | `%`, px, palabras | Números, sin unidades; **no** admite `%` [O] |
| Uso | Cada uno gira sobre sí | Varios elementos giran alrededor de un punto común |

Define `svgOrigin` o `transformOrigin`, no ambos. `svgOrigin` queda registrado en el atributo `data-svg-origin`. [O]

## Ejemplo

```js
const hoja = document.querySelector(".hoja");
gsap.set(hoja, { transformOrigin: "left bottom" });

const bisagra = document.querySelector(".bisagra");
gsap.set(bisagra, { transformOrigin: "top left" });

const origen = (el) => getComputedStyle(el).transformOrigin; // en px y sin z: igual en todos los motores

// prueba: origen(hoja) === "0px " + hoja.offsetHeight + "px"
// prueba: origen(bisagra) === "0px 0px"
```

Varios elementos SVG alrededor del centro del lienzo:

```html
<svg width="200" height="200"><rect class="aspa" x="10" y="10" width="50" height="50"/></svg>
```

```js
const aspa = document.querySelector(".aspa");
gsap.set(aspa, { svgOrigin: "100 100", rotation: 90 });

// prueba: aspa.getAttribute("data-svg-origin") === "100 100"
// prueba: aspa.getAttribute("transform").startsWith("matrix(0,1,-1,0,")
```

Giro en 3D con origen lejano. GSAP no pasa la `z` al navegador, porque Safari la renderiza mal: la guarda y compensa con traslaciones. [C] [E]

```html
<div class="giro" style="width:100px;height:50px"></div>
```

```js
const giro = document.querySelector(".giro");
gsap.set(giro, { transformOrigin: "50% 50% -100px", rotationY: 30 });

// prueba: getComputedStyle(giro).transformOrigin === "50px 25px"
// prueba: giro.style.transform === "translate3d(50px, 0px, -13.3975px) rotateY(30deg)"
```

## Trampas

- **`transformOrigin` no se interpola.** Es un valor no animable para GSAP: salta al destino en el primer render del tween y solo vuelve al original en la posición 0. Para mover el pivote de forma gradual, anima un contenedor o compensa con `x`/`y`. [E]

```js
const pivote = document.querySelector(".pivote");
const tween = gsap.to(pivote, {
  transformOrigin: "100% 100%",
  rotation: 10,
  duration: 1,
  paused: true,
});

tween.progress(0.1);

// prueba: getComputedStyle(pivote).transformOrigin === pivote.offsetWidth + "px " + pivote.offsetHeight + "px"
```

- **En HTML, cambiar el origen con el elemento ya rotado lo hace saltar.** Es el comportamiento del estándar. `smoothOrigin` solo funciona en SVG. [O]
- **En SVG, GSAP fija `transform-origin: 0px 0px` en el estilo** y escribe el origen dentro de la matriz del atributo `transform`. Si inspeccionas, no verás tu origen en CSS. [C] [E]
- **`CSSPlugin.defaultSmoothOrigin` no existe en 3.15.1**, aunque la documentación lo cita. Control por tween: `smoothOrigin: false`. [C]
- **SVG no admite 3D oficialmente,** así que un origen con tercer valor en SVG no es fiable. [O]
- **`style.transformOrigin` depende del motor.** Chrome devuelve `0% 100%` y Firefox `0% 100% 0px`. Para comparar, usa `getComputedStyle()`, en píxeles. Ver [depuración](../13-calidad/cal-depuracion.md#trampas). [E]
- **`gsap.getProperty(el, "transformOrigin")`** devuelve píxeles calculados y la `z`, no lo que escribiste. [E]
