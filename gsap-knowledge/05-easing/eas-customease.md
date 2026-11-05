---
id: eas-customease
titulo: CustomEase, dibujar cualquier curva
capa: 05-easing
tipo: plugin
ambito: CustomEase
resumen: Crea un ease a partir de un path SVG o de valores cubic-bezier. create, get, setData y getSVGData, con el formato de datos admitido.
api: [CustomEase.create, CustomEase.get, CustomEase.getSVGData, CustomEase.setData, CustomEase.ease, CustomEase.data, CustomEase.id, CustomEase.segment, CustomEase.register, CustomEaseConfig.precision, CustomEaseConfig.height, CustomEaseConfig.originY, CustomEaseConfig.width, CustomEaseConfig.x, CustomEaseConfig.y, CustomEaseConfig.invert, CustomEaseConfig.path]
requiere: [eas-guia]
relacionadas: [eas-custombounce, eas-customwiggle, eas-registro, fun-plugins]
etiquetas: [easing, curvas, plugin, svg]
fuentes:
  - docs/v3/Eases/CustomEase.md
estado: verificado
version: 3.15.1
---
# CustomEase

Convierte un trazado en un ease: la X del trazado es el tiempo y la Y el progreso. Se usa cuando la curva viene de un diseño o del Ease Visualizer de gsap.com, y es la base de CustomBounce y CustomWiggle. [O]

## Para qué sirve

Replicar exactamente un `cubic-bezier()` de CSS, importar una curva dibujada en un editor vectorial o crear formas sin fórmula conocida, que incluso vuelven atrás o superan 1. [O]

## Registro

```js fragmento
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);
```

**Sin empaquetador:** `<script>` con `dist/CustomEase.min.js` (global `CustomEase`), o entrada `gsap/CustomEase` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

Está en el paquete público `gsap`. Ver [plugins](../01-fundamentos/fun-plugins.md). [O]

## API

```text
CustomEase.create(id, datos, config?)        → función de ease
new CustomEase(id, datos, config?)           → instancia
CustomEase.get(id)                           → función de ease
CustomEase.getSVGData(ease, config?)         → cadena para el atributo d
instancia.setData(datos, config?)            → instancia
instancia.getSVGData(config?)                → cadena
```

Propiedades de la instancia, también accesibles como `funcion.custom`: `id`, `ease` (la función), `data` (lo pasado) y `segment` (los puntos normalizados). `register` es el método interno que usa `gsap.registerPlugin()`. [C]

| Formato de `datos` | Ejemplo |
|---|---|
| Path normalizado 0 a 1 | `"M0,0 C0.5,0 0.5,1 1,1"` |
| `cubic-bezier` | `".17,.67,.83,.67"` |
| Path en otro tamaño | `"M0,500 C100,500 200,0 500,0"`, se normaliza solo |
| Comandos admitidos | `M`, `C`, `S`, `L`, `Z` [O] |

Si el trazado no empieza en 0 y acaba en 1, GSAP lo normaliza invirtiendo la Y, porque en SVG crece hacia abajo. [C] [E]

| `CustomEaseConfig` | En | Efecto |
|---|---|---|
| `precision` | `create`, `getSVGData` | Muestreo: mayor, más exacto. Por defecto 1 |
| `height`, `originY` | `create` | Altura y origen Y del trazado de entrada, para normalizar |
| `width`, `height` | `getSVGData` | Tamaño del trazado de salida. 100 por defecto |
| `x`, `y` | `getSVGData` | Desplazamiento del trazado |
| `invert` | `getSVGData` | Lo dibuja con la Y hacia abajo |
| `path` | `getSVGData` | Elemento `<path>` al que escribir `d` |

## Ejemplo

```js
const salto = CustomEase.create("salto", "M0,0 C0.2,0 0.3,1.2 0.5,1.2 0.7,1.2 0.8,1 1,1");

const objeto = { y: 0 };
gsap.to(objeto, { y: 100, duration: 1, ease: "salto", paused: true }).progress(0.5);

// prueba: Math.abs(objeto.y - 120) < 0.5
// prueba: gsap.parseEase("salto") === salto
// prueba: CustomEase.get("salto") === salto
// prueba: salto.custom.id === "salto"
```

Desde `cubic-bezier`, también sin crear nombre, al pasar la cadena directamente: [E]

```js
const css = new CustomEase("suave", ".17,.67,.83,.67");
const directa = gsap.parseEase(".17,.67,.83,.67");
const objeto = { x: 0 };
gsap.to(objeto, { x: 100, duration: 0.1, ease: "M0,0 C0.5,0 0.5,1 1,1" });

await new Promise((r) => setTimeout(r, 300));

// prueba: Math.abs(css.ease(0.5) - directa(0.5)) < 1e-6
// prueba: css.id === "suave" && css.data === ".17,.67,.83,.67"
// prueba: css.segment.length === 8
// prueba: objeto.x === 100
```

Dibujar una curva en la página. Los eases normales se muestrean y solo las `CustomEase` devuelven su trazado exacto: [E]

```html
<svg width="200" height="200"><path id="grafica" fill="none" stroke="black"/></svg>
```

```js
CustomEase.create("demo", "M0,0 C0.5,0 0.5,1 1,1");

const d = CustomEase.getSVGData("demo", { width: 200, height: 200, path: "#grafica" });
const normal = CustomEase.getSVGData("power2.out", { width: 200, height: 200 });

// prueba: document.querySelector("#grafica").getAttribute("d") === d
// prueba: d.trim() === "M0,200 C100,200 100,0 200,0"
// prueba: normal.startsWith("M0,200,")
```

Normalización con `height` y `originY`, y cambio en caliente: [E]

```js
const propia = CustomEase.create("alta", "M0,100 C50,100 50,0 100,0", { height: 100, originY: 100 });
const editable = new CustomEase("editable", "0,0,1,1");
const antes = editable.ease(0.25);
const misma = editable.setData(".5,0,.5,1");

// prueba: propia.custom.segment.join() === "0,0,0.5,0,0.5,1,1,1"
// prueba: Math.abs(antes - 0.25) < 0.001
// prueba: misma === editable
// prueba: editable.ease(0.25) !== antes
// prueba: gsap.parseEase("editable") === editable.ease
```

## Trampas

- **Crea el ease una vez, al cargar.** Calcular los puntos es lo caro; evaluarlos es barato. No lo llames dentro de un manejador. [O]
- **`setData()` crea una función nueva y la registra.** Los tweens ya creados conservan la anterior. [C]
- **Un `id` igual a un ease estándar lo sustituye.** `CustomEase.create("power1", ...)` reemplaza `power1` en toda la página, incluido el ease por defecto en cadena. Usa nombres propios. [O] [E]
- **Datos inválidos lanzan una cadena,** no un `Error`: `"Invalid CustomEase"`. El `catch` debe contemplarlo. [E]

```js
let capturado;
try {
  CustomEase.create("rota", "1,2,3");
} catch (e) {
  capturado = e;
}

// prueba: capturado === "Invalid CustomEase"
```

- **La cadena directa exige CustomEase cargado.** Sin él, un `"M0,0 C..."` en `ease` no se reconoce y se usa el ease por defecto. [C]
- **Si el trazado retrocede en X,** esos puntos se descartan: el tiempo no puede volver atrás. [C]
- **Una curva que no acaba en 1** deja el tween fuera del destino. Es útil solo si se busca, como en CustomWiggle. [C]
- **Un `path` que no encuentra nada no avisa:** `getSVGData()` solo devuelve la cadena. [C]
