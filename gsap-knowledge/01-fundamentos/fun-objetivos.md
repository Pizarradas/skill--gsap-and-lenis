---
id: fun-objetivos
titulo: Objetivos - qué se puede animar
capa: 01-fundamentos
tipo: concepto
ambito: core
resumen: Formas válidas de indicar targets - selector, elemento, lista, objeto propio, métodos y setters - y los errores típicos al mezclarlos.
api: [Tween.targets, gsap.GSAPConfig.nullTargetWarn, gsap.TweenVars.endArray]
relacionadas: [fun-valores, fun-modelo, nuc-context, css-plugin, utl-colecciones, fra-agnostico]
etiquetas: [targets, selectores, objetos]
fuentes:
  - docs/v3/GSAP/gsap.to().md
  - docs/v3/GSAP/Tween/targets().md
  - resources/get-started.md
estado: verificado
version: 3.15.1
---
# Objetivos (targets)

El primer argumento de `gsap.to()` y similares dice **qué** se anima. GSAP lo normaliza a un array, que `tween.targets()` devuelve; a partir de ahí, cada objetivo es un objeto cuyas propiedades se leen y escriben. [O]

## Modelo mental

| Forma | Ejemplo | Nota |
|---|---|---|
| Selector | `".tarjeta"`, `"#menu li"` | Usa `querySelectorAll`. Dentro de un `gsap.context()` con `scope`, busca solo ahí [O] |
| Elemento | `document.querySelector(".a")`, una variable que lo guarde | Referencia directa |
| Lista | `NodeList`, `HTMLCollection` | Se convierte a array [C] |
| Array | `[el, ".otra", otroEl]` | Se aplana, también si hay listas anidadas [C] [E] |
| Objeto propio | `{ x: 0 }`, `mesh.position` | Anima sus propiedades; útil en [canvas y WebGL](../12-frameworks/fra-canvas-webgl.md) [O] |
| Función | `gsap.delayedCall` la usa como objetivo interno | Ver [delayedCall](../02-nucleo/nuc-delayedcall.md) [O] |

Cómo se escribe cada propiedad depende del objetivo [C]:

- En un **elemento**, CSSPlugin intercepta casi todo (`x`, `opacity`, `color`).
- En un **objeto**, se asigna `objeto[prop]`. Si esa propiedad es una **función**, GSAP la usa como par getter/setter: la llama sin argumentos para leer y con el valor para escribir.
- Los `get` y `set` de una clase funcionan como una propiedad normal.
- Un método que solo escribe (`setAlto(v)`) también se llama sin argumentos para leer: ver trampas.

## Ejemplo

Objetos propios, con propiedad normal, accessor y método:

```js
class Cubo {
  constructor() { this._giro = 1; this._alto = 1; }
  get giro() { return this._giro; }
  set giro(v) { this._giro = v; }
  alto(v) {                       // lee sin argumento, escribe con él
    if (arguments.length) this._alto = v;
    return this._alto;
  }
}
const cubo = new Cubo();
const camara = { zoom: 1 };

gsap.to(cubo, { giro: 7, duration: 0.05 });
gsap.to(cubo, { alto: 5, duration: 0.05 });
gsap.to(camara, { zoom: 2, duration: 0.05 });

// prueba: cubo.giro === 7
// prueba: cubo.alto() === 5
// prueba: camara.zoom === 2
```

Selector, lista y array terminan en el mismo tipo de resultado:

```html
<ul><li class="fila"></li><li class="fila"></li><li class="fila"></li></ul>
```

```js
const porSelector = gsap.to(".fila", { x: 10, duration: 0.05 });
const porLista = gsap.to(document.querySelectorAll(".fila"), { y: 10, duration: 0.05 });
const porArray = gsap.to([document.querySelector(".fila"), ".fila"], { z: 1, duration: 0.05 });

// prueba: porSelector.targets().length === 3
// prueba: porLista.targets().length === 3
// prueba: Array.isArray(porLista.targets())
// prueba: porArray.targets().length === 4
```

Un método que solo escribe no sirve de lectura: se invoca una vez sin argumento, el tween parte de 0 en lugar de 10, y los valores intermedios llegan como cadena.

```js
const figura = {
  alto: 10,
  llamadas: [],
  setAlto(v) { this.llamadas.push(v); this.alto = v; },
};
const estira = gsap.to(figura, { setAlto: 20, duration: 1, ease: "none", paused: true });
estira.progress(0.5);

// prueba: figura.llamadas[0] === undefined
// prueba: figura.alto === "10"
```

El caso `porArray` prueba que GSAP **no deduplica**: un mismo elemento citado dos veces cuenta dos veces. [E]

Un array de números es un objetivo; se anima con `endArray`:

```js
const serie = [1, 2, 3];
gsap.to(serie, { endArray: [10, 20, 30], duration: 0.05 });
// prueba: serie[2] === 30
```

Con objetos normales también funcionan varios plugins. Qué plugin exige DOM está en la tabla del [contrato](../12-frameworks/fra-agnostico.md). [E]

```js
const puntos = { x: 0, y: 0 };
const fisica = { x: 0, y: 0 };
const propiedades = { x: 0 };
const inercia = { x: 0 };

gsap.to(puntos, { motionPath: { path: [{ x: 10, y: 10 }, { x: 20, y: 0 }] }, duration: 0.05 });
gsap.to(fisica, { physics2D: { velocity: 100, angle: 0 }, duration: 0.05 });
gsap.to(propiedades, { physicsProps: { x: { velocity: 100 } }, duration: 0.05 });
gsap.to(inercia, { inertia: { x: { velocity: 100, end: 40 } } });

await new Promise((r) => setTimeout(r, 250));
// prueba: puntos.x === 20 && fisica.x > 0 && propiedades.x > 0 && inercia.x > 0
```

`text: "hola"` sobre un objeto sin `nodeName` lanza `Cannot read properties of undefined (reading 'toUpperCase')` en cada tick. [E] `scrambleText` no hace nada si el objetivo no tiene `innerHTML` ni `textContent`. [C] `InertiaPlugin` calcula su propia duración: la `duration` del tween se ignora. [E]

## Trampas

- **Elementos y objetos mezclados en un mismo tween.** GSAP decide el modo de escritura mirando el **primer** objetivo. `gsap.to([elemento, { v: 0 }], ...)` hace que CSSPlugin procese el objeto y lanza `getComputedStyle: parameter 1 is not of type 'Element'` en cada tick. Crea un tween por tipo. [C] [E]
- **Objetivo inexistente.** Si no hay coincidencias avisa `GSAP target ... not found` y el tween queda vacío. Suele indicar que se ejecutó antes de que el elemento existiera en el DOM, o que el `scope` no contiene ese elemento. Con `gsap.config({ nullTargetWarn: false })` se silencia, lo cual oculta el síntoma. [O] [C]
- **Propiedad que no existe en un objeto propio.** `gsap.to(obj, { y: 10 })` sobre un objeto sin `y` avisa `Invalid property y ... Missing plugin?`. Declara la propiedad antes. [E]
- **`JSON.stringify` tras animar un objeto.** GSAP añade a cada objetivo una propiedad enumerable `_gsap` con una referencia circular. Serializar el objeto lanza un `TypeError` (`Converting circular structure` en V8), y aparece también en `Object.keys()`. Anima un objeto auxiliar y copia los valores, o excluye `_gsap` con un replacer. [E]
- **Objetos congelados.** `Object.freeze()` hace que el tween lance `Cannot add property _gsap`. Afecta a estados inmutables de algunas librerías: anima una copia. [E]
- **Objetos envueltos en un `Proxy`.** Si una biblioteca de estado envuelve tus objetos, anima el elemento DOM o el objeto crudo, no el proxy: GSAP escribiría `_gsap` en él y cada frame dispararía la reactividad. Ver `fra-agnostico`. [P]
- **Métodos solo de escritura.** `{ setAlto: 20 }` llama a `setAlto()` sin argumento para leer, con lo que tu método recibe `undefined`, y luego interpola desde 0 con cadenas en lugar de números. Usa una función que lea y escriba, o accessors `get`/`set`. [C] [E]
- **Selector ejecutado demasiado pronto.** El selector se resuelve **al crear** el tween. Elementos añadidos después no se incorporan. [O] [C]
