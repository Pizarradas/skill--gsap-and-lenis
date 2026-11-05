---
id: svg-motionpath
titulo: MotionPathPlugin, animar a lo largo de una ruta
capa: 09-svg
tipo: plugin
ambito: MotionPathPlugin
resumen: Mueve cualquier objetivo por un path SVG, datos de ruta o puntos, con autoRotate, align y start/end. También suaviza transiciones entre valores de otras propiedades.
api: [MotionPathPlugin, MotionPath.Vars.path, MotionPath.Vars.align, MotionPath.Vars.alignOrigin, MotionPath.Vars.autoRotate, MotionPath.Vars.curviness, MotionPath.Vars.start, MotionPath.Vars.end, MotionPath.Vars.offsetX, MotionPath.Vars.offsetY, MotionPath.Vars.relative, MotionPath.Vars.resolution, MotionPath.Vars.type, MotionPath.Vars.useRadians, MotionPath.Vars.fromCurrent]
relacionadas: [svg-motionpath-api, svg-motionpathhelper, svg-guia, scr-scrub]
etiquetas: [svg, ruta, movimiento]
fuentes:
  - docs/v3/Plugins/MotionPathPlugin.md
estado: verificado
version: 3.15.1
---
# MotionPathPlugin

Anima un objetivo DOM, SVG o un objeto cualquiera a lo largo de una ruta: un `<path>`, una cadena de datos o una lista de puntos por los que plotea una curva. Con `align` coloca el objetivo sobre la ruta aunque estén en contenedores transformados distintos. [O]

## Para qué sirve

Objetos que recorren un trazado, elementos que siguen una curva al hacer scroll, trayectorias con puntos calculados, y transiciones suaves entre varios valores de cualquier propiedad.

## Registro

```js fragmento
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(MotionPathPlugin);
```

**Sin empaquetador:** `<script>` con `dist/MotionPathPlugin.min.js` (global `MotionPathPlugin`), o entrada `gsap/MotionPathPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

`motionPath` acepta la ruta directamente o un objeto de opciones. [O]

| Forma de `path` | Interpretación |
|---|---|
| `"#ruta"` o elemento | Un `<path>` del DOM |
| `"M9,100c0,0,18-41,49-65"` | Datos de ruta |
| `[{x, y}, …]` | Curva **a través** de esos puntos, con el valor actual añadido al inicio |
| `[{x, y}, …]` + `type: "cubic"` | Puntos de Bézier: ancla, control, control, ancla… |
| `[{scale, rotation}, …]` | Curva entre valores de otras propiedades |

| Opción | Defecto | Efecto |
|---|---|---|
| `align` | — | Selector, elemento o `"self"`. Encaja el objetivo con esa referencia [O] |
| `alignOrigin` | — | `[0.5, 0.5]`: punto del objetivo que sigue la ruta. Fija también `transformOrigin`. Solo actúa con `align` hacia otro elemento: sin `align` o con `"self"` no se lee [C] [E] |
| `autoRotate` | `false` | `true` sigue la tangente; un número suma ese desfase en grados [O] [E] |
| `start` `end` | `0` `1` | Tramo de la ruta. Admite negativos, mayores que 1 y `end < start` para ir hacia atrás [O] [E] |
| `curviness` | `1` | Solo con arrays: 0 son rectas, 2 muy curvo [O] |
| `offsetX` `offsetY` | `0` | Ajuste fino, que se suma a las coordenadas [E] |
| `fromCurrent` | `true` | `false` no antepone el valor actual a un array [O] [E] |
| `relative` | `false` | Solo con arrays: cada valor es relativo al anterior [O] [E] |
| `type` | — | `"cubic"` para arrays de Bézier [O] |
| `resolution` | `12` | Subdivisiones para igualar la velocidad. Con arrays y `curviness: 0`, 20 [C] |
| `useRadians` | `false` | `autoRotate` en radianes. Para Pixi y similares [O] |

`start` y `end` también aceptan una función `(i, objetivo)` por objetivo, según los tipos. [C] Aceptados sin tipar: `unitX`, `unitY`, `x`, `y` y `rotation` para renombrar propiedades, y `matrix`. [C]

## Ejemplo

Ruta con puntos, comprobando la posición a mitad:

```html
<div class="pieza" style="width:20px;height:20px"></div>
```

```js
const pieza = document.querySelector(".pieza");
const t = gsap.to(pieza, {
  motionPath: { path: [{ x: 100, y: 0 }, { x: 100, y: 100 }], curviness: 0 },
  duration: 1,
  paused: true,
  ease: "none",
});
t.progress(0.5);
const enMedio = [gsap.getProperty(pieza, "x"), gsap.getProperty(pieza, "y")];
t.progress(1);
// prueba: enMedio.join() === "100,0"
// prueba: gsap.getProperty(pieza, "y") === 100
```

Alinear un elemento HTML con un `<path>` situado en otro sitio, centrado en la ruta:

```html
<svg width="200" height="100" style="position:absolute;left:400px;top:50px">
  <path id="ruta" d="M20 30 L120 30" fill="none" stroke="#333" />
</svg>
<div id="punto" style="position:absolute;left:10px;top:300px;width:10px;height:10px"></div>
```

```js
const punto = document.querySelector("#punto");
const recorrido = gsap.to(punto, {
  motionPath: { path: "#ruta", align: "#ruta", alignOrigin: [0.5, 0.5], autoRotate: true },
  duration: 1,
  paused: true,
  ease: "none",
});
recorrido.progress(1);
const caja = punto.getBoundingClientRect();
// prueba: Math.round(caja.left + caja.width / 2) === 520
// prueba: Math.round(caja.top + caja.height / 2) === 80
```

Sin `align`, las coordenadas del `<path>` van directas a `x` e `y`: el objetivo salta a la primera ancla desde el primer render. `align: "self"` traslada la ruta hasta el objetivo y evita el salto. [E]

```html
<div class="ficha" style="width:20px;height:20px"></div>
```

```js
const ficha = document.querySelector(".ficha");
const sinSalto = gsap.to(ficha, { motionPath: { path: "M50 50 L150 50", align: "self" }, duration: 1, paused: true, ease: "none" });
sinSalto.progress(0);
const alEmpezar = gsap.getProperty(ficha, "x");
sinSalto.progress(1);
// prueba: alEmpezar === 0
// prueba: gsap.getProperty(ficha, "x") === 100
```

Suavizar varios valores de otras propiedades:

```html
<div class="latido" style="width:20px;height:20px"></div>
```

```js
const latido = document.querySelector(".latido");
const curva = gsap.to(latido, {
  motionPath: { path: [{ scale: 2, rotation: 10 }, { scale: 1, rotation: -10 }], curviness: 1.5 },
  duration: 1,
  paused: true,
});
curva.progress(1);
// prueba: gsap.getProperty(latido, "scale") === 1 && gsap.getProperty(latido, "rotation") === -10
```

Comprobaciones de la tabla de opciones y de las trampas:

```html
<svg width="100" height="100"><path id="guia" d="M0 30 L90 30" fill="none" stroke="#333" /></svg>
<div class="sin-align" style="width:40px;height:20px"></div>
<div class="con-align" style="width:40px;height:20px"></div>
<div class="sin-ruta" style="width:20px;height:20px"></div>
<div class="plano" style="position:relative;left:0;top:0;width:20px;height:20px"></div>
<div class="automatico" style="width:20px;height:20px"></div>
```

```js
const origen = (s) => getComputedStyle(document.querySelector(s)).transformOrigin;
const opciones = { duration: 1, paused: true, ease: "none" };
const recta = [{ x: 100, y: 0 }];

gsap.to(".sin-align", { motionPath: { path: "#guia", alignOrigin: [0, 0] }, ...opciones }).progress(0.5);
gsap.to(".con-align", { motionPath: { path: "#guia", align: "#guia", alignOrigin: [0, 0] }, ...opciones }).progress(0.5);

const tramo = { x: 0, y: 0 };
const atras = gsap.to(tramo, { motionPath: { path: recta, curviness: 0, start: 0.5, end: 0.25 }, ...opciones });
atras.progress(0);
const inicioTramo = tramo.x;
atras.progress(1);

const giro = { x: 0, y: 0, rotation: 0 };
gsap.to(giro, { motionPath: { path: "M0 0 L100 100", autoRotate: 45 }, ...opciones }).progress(1);

const conOffset = { x: 0, y: 0 };
gsap.to(conOffset, { motionPath: { path: recta, curviness: 0, offsetX: 7 }, ...opciones }).progress(1);

const conCurrent = { x: 5, y: 0 };
gsap.to(conCurrent, { motionPath: { path: [{ x: 50, y: 0 }, { x: 100, y: 0 }], curviness: 0, fromCurrent: false }, ...opciones }).progress(0);

const relativo = { x: 0, y: 0 };
gsap.to(relativo, { motionPath: { path: [{ x: 10, y: 0 }, { x: 10, y: 0 }], curviness: 0, relative: true }, ...opciones }).progress(1);

gsap.to(".sin-ruta", { motionPath: { path: "M50 50 L150 50" }, ...opciones }).progress(0);

const radianes = { x: 0, y: 0, rotation: 0 };
gsap.to(radianes, { motionPath: { path: "M0 0 L0 100", autoRotate: true, useRadians: true }, ...opciones }).progress(1);

const plano = document.querySelector(".plano");
gsap.to(plano, { motionPath: { path: [{ left: 100, top: 40 }], curviness: 0 }, ...opciones }).progress(1);
const automatico = document.querySelector(".automatico");
gsap.to(automatico, { motionPath: { path: [{ left: 100, top: 40 }], curviness: 0 }, ...opciones }).progress(1);


// prueba: origen(".sin-align") === "20px 10px" && origen(".con-align") === "0px 0px"
// prueba: inicioTramo === 50 && Math.round(tramo.x) === 25
// prueba: Math.round(giro.rotation) === 90
// prueba: conOffset.x === 107
// prueba: conCurrent.x === 50
// prueba: relativo.x === 20
// prueba: gsap.getProperty(".sin-ruta", "x") === 50
// prueba: Math.abs(radianes.rotation - Math.PI / 2) < 0.001
// prueba: plano.style.left === "100px" && plano.style.top === "40px"
// prueba: automatico.style.left !== "100px"
```

## Trampas

- **`autoRotate` gira desde el origen actual.** Con `align` hacia otro elemento, pon `alignOrigin: [0.5, 0.5]`. Sin `align`, esa opción se ignora: usa `xPercent: -50, yPercent: -50` junto con `transformOrigin: "50% 50%"`. Si no, el objetivo orbitará la ruta. [O] [C] [E]
- **`align` no es responsive.** Se calcula una vez al iniciar. Si cambia el layout, guarda `progress()`, revierte y crea el tween de nuevo. [O]
- **Ruta inexistente.** `path: "#noexiste"` avisa `Expecting a <path> element…` y después lanza un `TypeError`, en cada tick si el tween sigue vivo. Comprueba el selector. [C]
- **`useRadians` en elementos DOM** aplica radianes como si fueran grados: `rotation` vale 1,57 y el giro apenas se nota. Úsalo solo con objetos que esperan radianes. [E]
- **`curviness`, `relative` y `fromCurrent` no afectan a rutas SVG:** solo a arrays. [O] [C] `resolution` sí se usa también con rutas, aunque la documentación diga lo contrario. [C]
- **`fromCurrent: false`** salta al primer punto al primer render, incluso a progreso 0. [E]
- **Propiedades de layout.** `{ left, top }` se detectan como par x/y, igual que `marginLeft`, `translateX` y `xPercent`. [C] Para `left` y `top` el elemento debe tener valor numérico, no `auto`; si no, el valor no se aplica. Son además peores en rendimiento que `x` e `y`. [E] [P]
- **Ruta con varios `M`.** Se recorre segmento a segmento, saltando entre ellos sin interpolar el hueco. [C]
- **`ease` por defecto.** Se aplica sobre el progreso de la ruta: `power1.out` frena al final del recorrido. Usa `ease: "none"` si quieres velocidad constante. [P]
