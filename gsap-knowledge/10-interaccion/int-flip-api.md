---
id: int-flip-api
titulo: Flip, métodos estáticos, FlipState y ElementState
capa: 10-interaccion
tipo: api
ambito: Flip
resumen: Flip.fit, to, makeAbsolute, killFlipsOf, isFlipping, getByTarget y convertCoordinates, más los métodos de FlipState y los datos de ElementState.
api: [Flip.fit, Flip.to, Flip.makeAbsolute, Flip.killFlipsOf, Flip.isFlipping, Flip.getByTarget, Flip.convertCoordinates, Flip.register, Flip.FitVars.fitChild, Flip.FitVars.getVars, Flip.FitReturnVars.width, Flip.FlipState.compare, Flip.FlipState.add, Flip.FlipState.clear, Flip.FlipState.update, Flip.FlipState.fit, Flip.FlipState.recordInlineStyles, Flip.FlipState.interrupt, Flip.FlipState.getProperty, Flip.FlipState.getElementState, Flip.FlipState.makeAbsolute, Flip.ElementState.isDifferent, Flip.StateCompare.changed, Flip.StateCompare.unchanged, Flip.StateCompare.enter, Flip.StateCompare.leave]
requiere: [int-flip]
relacionadas: [int-flip, int-flip-batch, svg-motionpath-api]
etiquetas: [layout, referencia]
fuentes:
  - docs/v3/Plugins/Flip/*
estado: verificado
version: 3.15.1
---
# Flip: referencia

Métodos fuera del flujo `getState` → `from`, y estructura de los objetos de estado. El flujo principal está en [int-flip](int-flip.md).

## Firma

| Método | Devuelve | Nota |
|---|---|---|
| `Flip.fit(el, destino, vars?)` | `null`, Tween u objeto | Instantáneo, con `duration` o con `getVars` |
| `Flip.to(estado, vars)` | Timeline | Inverso de `from`. `vars` es **obligatorio** [E] |
| `Flip.makeAbsolute(objetivos)` | `Element[]` | `position: absolute` sin que se muevan |
| `Flip.killFlipsOf(objetivos, completar?)` | — | Por defecto completa y mata |
| `Flip.isFlipping(el)` | boolean | |
| `Flip.getByTarget(el)` | Timeline o `undefined` | Sin página en la documentación [C] |
| `Flip.convertCoordinates(desde, hasta, punto?)` | punto o Matrix2D | Como el de [MotionPathPlugin](../09-svg/svg-motionpath-api.md) [C] [E] |
| `Flip.register(core)` | — | Interno; lo usa `registerPlugin` [C] |

También existen `Flip.fromTo(estadoA, estadoB, vars)` y `Flip.getElementState(el, props)`, sin tipos ni documentación. [C]

### Flip.fit

Coloca y redimensiona un elemento sobre otro, o sobre un estado anterior, aunque no compartan contenedor. Por defecto altera `x`, `y`, `rotation`, `skewX`, `width` y `height`. [O]

| Opción | Efecto |
|---|---|
| `duration` y demás de tween | Devuelve un tween en lugar de aplicarlo al instante [O] |
| `scale` | `scaleX/scaleY` en lugar de tamaño. Forzado con `fitChild` [O] |
| `absolute` | `position: absolute` [O] |
| `fitChild` | Encaja un hijo en el destino, moviendo al padre [O] |
| `getVars` | No aplica nada: devuelve `FitReturnVars` (`x`, `y`, `rotation`, `skewX`, `width`, `height`, `scaleX`, `scaleY`) [E] |
| `props` | Propiedades extra que se copian del destino [O] |
| `simple` | Omite cálculos con contenedores transformados [O] |

## Ejemplo

```html
<style>
  .uno { position: absolute; left: 0; top: 0; width: 50px; height: 50px; }
  .dos { position: absolute; left: 300px; top: 200px; width: 200px; height: 50px; }
</style>
<div class="uno"></div>
<div class="dos"></div>
```

```js
const uno = document.querySelector(".uno");

const calculo = Flip.fit(uno, ".dos", { scale: true, getVars: true });
const sinCambio = uno.getBoundingClientRect().left;

const devuelto = Flip.fit(uno, ".dos");
const encaja = uno.getBoundingClientRect();

const relativo = Flip.convertCoordinates(uno, document.querySelector(".dos"), { x: 0, y: 0 });
// prueba: calculo.scaleX === 4 && calculo.scaleY === 1
// prueba: sinCambio === 0
// prueba: devuelto === null
// prueba: encaja.left === 300 && encaja.top === 200 && encaja.width === 200 && encaja.height === 50
// prueba: relativo.x === 0 && relativo.y === 0
```

Comparar dos estados y consultar datos, sin animar:

```html
<style>
  .lista { display: flex; }
  .item { width: 50px; height: 50px; flex: none; }
  .item.ancho { width: 100px; }
</style>
<div class="lista"><div class="item" id="i1"></div><div class="item" id="i2"></div></div>
<div class="item" id="fijo" style="position:absolute;left:400px;top:0"></div>
```

```js
const i1 = document.querySelector("#i1");
const i2 = document.querySelector("#i2");
const antes = Flip.getState(".item");
i2.classList.add("ancho");
const despues = Flip.getState(".item");

const cmp = antes.compare(despues);
const dato = antes.getElementState(i2);
const dif = dato.isDifferent(despues.getElementState(i2));
const anchoPrevio = antes.getProperty(i2, "width");
// prueba: cmp.changed.map(e => e.id).join() === "i2"
// prueba: cmp.unchanged.map(e => e.id).sort().join() === "fijo,i1"
// prueba: cmp.enter.length === 0 && cmp.leave.length === 0
// prueba: dato.width === 50 && dato.position === "static" && dato.isVisible === true
// prueba: dif === true && anchoPrevio === 50
```

`makeAbsolute` y `prune` con el mismo cuidado:

```html
<style>.pila > div { width: 50px; height: 50px; } .pila .abajo { margin-top: 100px; }</style>
<div class="pila" style="position:relative"><div class="p1"></div><div class="p2"></div></div>
```

```js
const p1 = document.querySelector(".p1");
const p2 = document.querySelector(".p2");
const topAntes = p2.getBoundingClientRect().top;
const estado = Flip.getState(".p1, .p2");
p2.classList.add("abajo");

const vuelo = Flip.from(estado, { duration: 0.1, ease: "none", prune: true, paused: true });
const animados = gsap.utils.toArray(vuelo.getChildren().flatMap((t) => (t.targets ? t.targets() : []))).filter((t) => t instanceof Element);
vuelo.progress(1);

const hechos = Flip.makeAbsolute(".p2");
const topDespues = p2.getBoundingClientRect().top;
// prueba: animados.length === 1 && animados[0] === p2
// prueba: hechos.length === 1 && getComputedStyle(p2).position === "absolute"
// prueba: topDespues === topAntes + 100
```

## Interrumpir y limpiar

| Acción | Dónde queda | Estilos en línea |
|---|---|---|
| `Flip.killFlipsOf(el)` | Estado final | Limpios |
| `Flip.killFlipsOf(el, false)` | **Donde iba** | Quedan los desplazamientos [E] |
| `flip.revert()` | Estado **final**, a diferencia de otras animaciones | Limpios [E] |
| `flip.kill()` | Donde iba | Quedan [C] |

```html
<style>.hueco { position: absolute; left: 300px; top: 0; } .bola { width: 40px; height: 40px; }</style>
<div class="bola"></div>
<div class="hueco"></div>
```

```js
const bola = document.querySelector(".bola");
const foto = Flip.getState(bola);
document.querySelector(".hueco").appendChild(bola);

const vuelta = Flip.from(foto, { duration: 1, ease: "none" });
const nadaAun = Flip.isFlipping(bola); // false: el timeline aún no ha renderizado
const mismo = Flip.getByTarget(bola) === vuelta;
await new Promise((r) => setTimeout(r, 60));
const yaVuela = Flip.isFlipping(bola);

vuelta.revert();
// prueba: nadaAun === false && mismo === true && yaVuela === true
// prueba: vuelta.progress() === 1
// prueba: !bola.getAttribute("style") || !bola.getAttribute("style").includes("transform")
// prueba: bola.getBoundingClientRect().left === 300
```

`killFlipsOf`, `fit` en un Context y los casos de error:

```html
<style>.hueco { position: absolute; left: 300px; top: 300px; } .a, .b, .c { width: 40px; height: 40px; }</style>
<div class="a"></div><div class="b"></div><div class="c"></div>
<div class="hueco"></div>
```

```js
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const hueco = document.querySelector(".hueco");
const volar = (selector) => {
  const estado = Flip.getState(selector);
  hueco.appendChild(document.querySelector(selector));
  return Flip.from(estado, { duration: 1, ease: "none" });
};
const izquierda = (selector) => document.querySelector(selector).getBoundingClientRect().left;

const uno = volar(".a");
const otro = volar(".b");
await espera(60);
const antes = izquierda(".a");
Flip.killFlipsOf(".a", false);
const congelada = [izquierda(".a") === antes, document.querySelector(".a").getAttribute("style").includes("transform")];
Flip.killFlipsOf(".b");
const completada = [izquierda(".b"), document.querySelector(".b").getAttribute("style")];

const ctx = gsap.context(() => { Flip.fit(".c", ".hueco"); });
const ajustada = document.querySelector(".c").getAttribute("style");
ctx.revert();
const restaurada = document.querySelector(".c").getAttribute("style") || "";

const final = Flip.to(Flip.getState(".c"), { duration: 0.01 });

let error = null;
try { Flip.to(Flip.getState(".c")); } catch (e) { error = e; }

const avisos = [];
const avisoReal = console.warn;
console.warn = (m) => avisos.push(m);
Flip.from({});
console.warn = avisoReal;

// prueba: congelada.join() === "true,true"
// prueba: completada[0] === 300 && !completada[1]
// prueba: ajustada.includes("transform") && !restaurada.includes("translate")
// prueba: final instanceof gsap.core.Timeline
// prueba: error instanceof TypeError
// prueba: avisos.join() === "Not a valid state object."
```

## Objetos de estado

**FlipState**, resultado de `getState`:

| Miembro | Uso |
|---|---|
| `targets` `elementStates` | Elementos y sus registros |
| `idLookup` `alt` | Por `data-flip-id`; `alt` guarda el segundo si hay dos con el mismo id |
| `props` `simple` | Configuración de captura |
| `add(estado)` `clear()` | Combinar o vaciar |
| `compare(otro)` | `{ changed, unchanged, enter, leave }` |
| `update(soft?)` | Volver a medir los mismos objetivos |
| `fit(estado, scale?, nested?)` | Encajar en otro estado |
| `makeAbsolute()` | Como `Flip.makeAbsolute` |
| `interrupt(soft?)` | Matar vuelos de sus objetivos |
| `recordInlineStyles()` | Guardar estilos en línea actuales |
| `getProperty(el, prop)` | Valor capturado |
| `getElementState(el)` | Su `ElementState` |

**ElementState**, uno por elemento: `element`, `id`, `parent`, `position`, `display`, `isVisible`, `x`, `y`, `width`, `height`, `scaleX`, `scaleY`, `rotation`, `skewX`, `opacity`, `bounds`, `matrix`, `cache`, `simple`, `getProp()` e `isDifferent(otro)`. [C]

## Trampas

- **`Flip.to()` casi nunca es lo que quieres.** Al terminar se eliminan los estilos en línea, y si no coincide con el estado real del DOM, el elemento salta. Usa `from()`. [O]
- **`Flip.to(estado)` sin `vars` lanza un `TypeError`**, aunque los tipos lo marquen opcional. El mensaje depende del motor: `Cannot read properties of undefined (reading 'targets')` en V8. [E]
- **Un estado inválido** no lanza: avisa `Not a valid state object.`. [E]
- **`isFlipping` da `false` justo después de `from()`.** El timeline aún no ha renderizado. Comprueba con `Flip.getByTarget(el)` si necesitas saberlo en el mismo tick. [E]
- **La documentación de `killFlipsOf` se contradice.** Según el parámetro, `false` fuerza la finalización; según el texto y el código, `false` la evita. Gana el código. [C] [E]
- **`Flip.fit` deja estilos en línea** (`transform`, `width`, `height`): no los limpia. Dentro de `gsap.context()` se restauran al revertir. [C] [E]
- **`fit` es una foto.** Si el destino cambia, vuelve a llamarlo. [P]
