---
id: tim-gestion
titulo: Gestionar los hijos de una timeline
capa: 03-timeline
tipo: api
ambito: core
resumen: Añadir, quitar, buscar y desplazar hijos. add, remove, clear, getChildren, getById, getTweensOf, killTweensOf, recent y shiftChildren, con sus desajustes frente a la documentación.
api: [Timeline.add, Timeline.remove, Timeline.clear, Timeline.getChildren, Timeline.getById, Timeline.getTweensOf, Timeline.recent, Timeline.shiftChildren, Timeline.updateRoot, Animation.kill, Animation.revert, Animation.invalidate]
requiere: [tim-posicion]
relacionadas: [tim-anidado, tim-control, nuc-limpieza, nuc-consulta]
etiquetas: [timeline, hijos, gestion]
fuentes:
  - docs/v3/GSAP/Timeline/*
estado: verificado
version: 3.15.1
---
# Gestionar los hijos

Métodos para modificar o consultar lo que hay dentro de una timeline ya creada. El índice de la API de `Timeline` está al final. [O]

## Firma

```text
tl.add(hijo, posicion?)                    → tl
tl.remove(hijo)                            → tl
tl.clear(etiquetas = true)                 → tl
tl.getChildren(anidados, tweens, timelines, ignorarAntesDe)  → array
tl.getById(id)                             → animado o undefined
tl.getTweensOf(objetivos, soloActivos?)    → array de tweens
tl.killTweensOf(objetivos, props?, soloActivos?)  → tl
tl.recent()                                → último insertado
tl.shiftChildren(cantidad, ajustarEtiquetas?, ignorarAntesDe = 0)  → tl
```

| `add(hijo)` acepta | Efecto |
|---|---|
| Tween o Timeline | Lo mueve aquí desde su padre actual |
| Función | Crea un `delayedCall(0, funcion)` |
| Cadena | Crea una etiqueta |
| Array | Inserta cada elemento **en la misma posición** |

`getChildren()` tiene todos sus booleanos a `true` por defecto, e `ignorarAntesDe` descarta hijos que empiezan antes de ese tiempo. Un `call()` cuenta como tween de duración 0. [O] [C]

## Ejemplo

```js
const maestra = gsap.timeline({ paused: true });
const hija = gsap.timeline();
const objeto = { x: 0 };

hija.to(objeto, { x: 1, duration: 1 });
maestra.add(hija).to({ y: 0 }, { y: 1, duration: 1 });

const todos = maestra.getChildren().length;
const nivel = maestra.getChildren(false).length;
const soloTimelines = maestra.getChildren(true, false, true).length;
const soloTweens = maestra.getChildren(true, true, false).length;
const tardios = maestra.getChildren(true, true, true, 1).length;
const deObjeto = maestra.getTweensOf(objeto).length;

// prueba: todos === 3 && nivel === 2 && soloTimelines === 1 && soloTweens === 2
// prueba: tardios === 1
// prueba: deObjeto === 1
```

Abrir un hueco para intercalar una pieza nueva. `shiftChildren()` mueve desde un punto, y opcionalmente también las etiquetas: [E]

```js
const montaje = gsap.timeline({ paused: true });
montaje
  .addLabel("inicio", 0.5)
  .to({ a: 0 }, { a: 1, duration: 1 }, 0)
  .to({ b: 0 }, { b: 1, duration: 1 }, 1);

montaje.shiftChildren(5, true, 1);

const inicios = montaje.getChildren().map((t) => t.startTime());

// prueba: inicios.join() === "0,6"
// prueba: montaje.labels.inicio === 0.5
// prueba: montaje.duration() === 7
```

## Trampas

- **`remove()` con un array no hace nada.** La documentación lo incluye y los tipos lo admiten, pero el código no itera: ni quita hijos ni etiquetas, y tampoco avisa. Recorre el array tú. [E]

```js
const a = gsap.to({ x: 0 }, { x: 1, duration: 1 });
const b = gsap.to({ x: 0 }, { x: 1, duration: 1 });
const tl = gsap.timeline({ paused: true });
tl.add(a).add(b).addLabel("marca", 0);

tl.remove([a, b, "marca"]);
const trasArray = tl.getChildren().length;

[a, b, "marca"].forEach((hijo) => tl.remove(hijo));

// prueba: trasArray === 2
// prueba: tl.getChildren().length === 0
// prueba: !("marca" in tl.labels)
```

- **`getById()` devuelve el último, no el primero.** La documentación habla del primer descendiente, pero recorre al revés. Con `id` duplicados devuelve el más tardío. [E]

```js
const dobles = gsap.timeline({ paused: true });
dobles.to({ a: 0 }, { a: 1, duration: 1, id: "paso" }).to({ b: 0 }, { b: 1, duration: 1, id: "paso" });

// prueba: dobles.getById("paso").startTime() === 1
```

- **`getTweensOf(objetivos, x)`: el segundo argumento es `onlyActive`.** La documentación lo llama `nested` y dice que por defecto es `true`, pero el código y los tipos lo tratan como "solo activos". Con `true` en una timeline pausada devuelve vacío. Los tweens anidados se incluyen siempre. [E]

```js
const objetivo = { x: 0 };
const madre = gsap.timeline({ paused: true });
madre.add(gsap.timeline().to(objetivo, { x: 1, duration: 1 }));

// prueba: madre.getTweensOf(objetivo).length === 1
// prueba: madre.getTweensOf(objetivo, true).length === 0
```

- **`remove(funcion)` elimina los `call()` de esa función**, porque el objetivo de un `delayedCall` es la propia función. Una función anónima no se puede referenciar: guárdala. [E]

```js
const avisar = () => {};
const conLlamada = gsap.timeline({ paused: true });
conLlamada.call(avisar).to({ a: 0 }, { a: 1 });
conLlamada.remove(avisar);

// prueba: conLlamada.getChildren().length === 1
```

- **`clear()` no quita los callbacks de la propia timeline**, y `clear(false)` conserva las etiquetas. Para retirar un evento usa `tl.eventCallback("onComplete", null)`. [O] [E]

```js
const tl2 = gsap.timeline({ paused: true, onComplete() {} });
tl2.addLabel("a", 1).to({ a: 0 }, { a: 1, duration: 1 });
tl2.clear(false);

// prueba: tl2.getChildren().length === 0
// prueba: tl2.labels.a === 1
// prueba: typeof tl2.eventCallback("onComplete") === "function"
```

- **`killTweensOf()` con propiedades** las elimina del tween y deja las demás. Es destructivo: no se recuperan con `restart()`. [E]

```js
const punto = { x: 0, y: 0 };
const parcial = gsap.timeline({ paused: true });
parcial.to(punto, { x: 1, y: 1, duration: 1 });
parcial.killTweensOf(punto, "x");
parcial.progress(1);

// prueba: punto.x === 0
// prueba: punto.y === 1
```

- **`shiftChildren()` no ajusta las etiquetas** salvo `adjustLabels: true`. `ignorarAntesDe` filtra hijos y etiquetas por igual. [E]
- **`kill()` y `revert()` no son lo mismo.** `kill()` detiene y deja los estilos como estén. `revert()` además devuelve el estado previo y quita los estilos en línea que añadió. Es la limpieza adecuada al desmontar. No reutilices una timeline tras ninguno de los dos. [O]

```html
<div class="ficha" style="width:80px;height:80px"></div>
```

```js
const limpia = gsap.timeline();
limpia.to(".ficha", { x: 100, duration: 0.01 });
await new Promise((r) => setTimeout(r, 100));
const conEstilo = new DOMMatrix(document.querySelector(".ficha").style.transform);
limpia.revert();

// prueba: conEstilo.m41 === 100 && conEstilo.m42 === 0
// prueba: document.querySelector(".ficha").getAttribute("style") === "width:80px;height:80px" || document.querySelector(".ficha").getAttribute("style") === "width: 80px; height: 80px;"
```

- **`recent()` vacío:** en una timeline sin hijos devuelve `undefined`. Tampoco cuentan las etiquetas. [E]

## Índice de la API de Timeline

| Grupo | Miembros | Ficha |
|---|---|---|
| Crear hijos | `to`, `from`, `fromTo`, `set`, `call`, `add`, `staggerTo`, `staggerFrom`, `staggerFromTo` | [básico](tim-basico.md) |
| Posición | `recent`, `shiftChildren` | [posición](tim-posicion.md) |
| Etiquetas | `addLabel`, `removeLabel`, `labels`, `currentLabel`, `nextLabel`, `previousLabel` | [etiquetas](tim-etiquetas.md) |
| Pausa y paseo | `addPause`, `removePause`, `tweenTo`, `tweenFromTo` | [control](tim-control.md) |
| Consulta | `getChildren`, `getById`, `getTweensOf`, `isActive` | esta ficha |
| Limpieza | `remove`, `clear`, `kill`, `killTweensOf`, `revert`, `invalidate` | esta ficha |
| Política | `autoRemoveChildren`, `smoothChildTiming`, `vars`, `data`, `parent`, `scrollTrigger` | [herencia](tim-herencia.md) |
| Heredados | `delay`, `duration`, `endTime`, `eventCallback`, `globalTime`, `iteration`, `pause`, `paused`, `play`, `progress`, `repeat`, `repeatDelay`, `restart`, `resume`, `reverse`, `reversed`, `seek`, `startTime`, `then`, `time`, `timeScale`, `totalDuration`, `totalProgress`, `totalTime`, `yoyo` | [control](../02-nucleo/nuc-control.md), [tiempo](../02-nucleo/nuc-tiempo.md) |

`Timeline.updateRoot(tiempo)` es estático y avanza la timeline raíz a mano. Solo tiene sentido si desconectas el ticker para integrar GSAP en otro bucle de render. Ver [ticker](../02-nucleo/nuc-ticker.md). [C]
