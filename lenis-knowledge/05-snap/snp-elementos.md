---
id: snp-elementos
titulo: Encajar en elementos, align, sticky y transform
capa: 05-snap
tipo: api
ambito: snap
resumen: addElement mide el elemento y aplica align. Incluye fallos reales de la versión: start en horizontal, contenedores y ancestros sticky que quedan rotos.
api: [Snap.addElement, Snap.addElements, Snap.resize, SnapElementOptions.align, SnapElementOptions.ignoreSticky, SnapElementOptions.ignoreTransform]
requiere: [snp-snap]
relacionadas: [snp-api, com-sticky-fixed, com-horizontal, opc-contenedores, rec-secciones-snap]
etiquetas: [snap, elementos, align, sticky]
fuentes:
  - packages/snap/README.md
estado: verificado
version: 1.3.27
---
# Encajar en elementos

`addElement` crea un punto ligado a un elemento: guarda su posición y tamaño, las actualiza con observadores, y al encajar aplica `align`. Funciona bien en ventana vertical. Fuera de ese caso, esta versión tiene fallos, verificados abajo. [C] [E]

## Firma

```text
snap.addElement(elemento: HTMLElement, opciones?: SnapElementOptions) → quitar
snap.addElements(lista, opciones?: SnapElementOptions) → quitarTodos
```

| Opción | Tipo | Defecto | Efecto |
|---|---|---|---|
| `align` | `string \| string[]` | `['start']` | `'start'`, `'center'`, `'end'`. Cada valor crea un punto. Un valor desconocido no crea ninguno si va solo, y **repite el anterior** si va en lista: `value` se declara por elemento, no por valor |
| `ignoreSticky` | `boolean` | `true` | Quita `sticky` para medir la posición original |
| `ignoreTransform` | `boolean` | `false` | `true`: usa `offsetTop`, que no incluye `transform` |

| `align` | Vertical | Horizontal |
|---|---|---|
| `start` | Borde superior arriba | **Fallo**: usa `rect.top` |
| `center` | Centro con centro de ventana | Correcto |
| `end` | Borde inferior abajo | Correcto |

El valor se redondea con `Math.ceil`. Las medidas de `center` y `end` usan `snap.viewport`, es decir, la **ventana**. [C]

Cuándo se actualiza la medida [C] [E]:

| Cambio | Cómo se detecta | Retardo |
|---|---|---|
| Tamaño del elemento | `ResizeObserver` del elemento: solo ancho y alto | Inmediato; no cambia `top` |
| Algo mueve el documento | `ResizeObserver` de `body` | 500 ms |
| Lo demás | `snap.resize()` | Manual |

## Ejemplo

```html
<div style="height:600px"></div>
<div id="bloque" style="height:400px"></div>
```

```js
const lenis = new Lenis({ autoRaf: true });
const bloque = document.getElementById("bloque");
const posiciones = async (align) => {
  const snap = new Snap(lenis, { duration: 0.05 });
  snap.addElement(bloque, { align });
  const r = [];
  for (let i = 0; i < [align].flat().length; i++) {
    snap.goTo(i);
    await espera(200);
    r.push(lenis.scroll);
  }
  snap.destroy();
  return r.join();
};
const inicio = await posiciones("start");
const centro = await posiciones("center"); // 600 + 200 - 350
const fin = await posiciones("end"); // 600 + 400 - 700
const dos = await posiciones(["end", "start"]); // se ordenan por valor
lenis.destroy();
// prueba: inicio === "600" && centro === "450" && fin === "300" && dos === "300,600"
```

`ignoreTransform`, y actualización con `resize()`:

```html
<div id="previo" style="height:300px"></div>
<div id="movido" style="height:50px;transform:translateY(100px)"></div>
```

```js
const lenis = new Lenis();
const movido = document.getElementById("movido");
const mide = (opciones) => {
  const snap = new Snap(lenis);
  snap.addElement(movido, opciones);
  const valor = [...snap.elements.values()][0].rect.top;
  snap.destroy();
  return valor;
};
const conTransform = mide({});
const sinTransform = mide({ ignoreTransform: true });

const snap = new Snap(lenis);
snap.addElement(movido);
const elemento = [...snap.elements.values()][0];
document.getElementById("previo").style.height = "500px";
const obsoleto = elemento.rect.top;
snap.resize();
const nuevo = elemento.rect.top;
snap.destroy();
lenis.destroy();
// prueba: conTransform - sinTransform === 100
// prueba: obsoleto === conTransform && nuevo === conTransform + 200
```

### Fallos de esta versión

Horizontal con `align: 'start'`: `computeSnaps` asigna `rect.top` sin mirar el eje.

```html
<div style="display:flex;width:4000px;height:300px">
  <div style="width:1500px"></div>
  <div id="panel" style="width:500px;height:100px;margin-top:40px"></div>
</div>
```

```js
const lenis = new Lenis({ autoRaf: true, orientation: "horizontal" });
const panel = document.getElementById("panel");
const prueba = async (align) => {
  const snap = new Snap(lenis, { duration: 0.05 });
  snap.addElement(panel, { align });
  snap.goTo(0);
  await espera(200);
  const x = lenis.scroll;
  snap.destroy();
  return x;
};
const inicio = await prueba("start"); // debería ser 1500
const centro = await prueba("center"); // correcto: 1500 + 250 - 500
lenis.destroy();
// prueba: inicio === 40 && centro === 1250
```

Ancestro `sticky`: `removeParentSticky` lo pasa a `static` y, como desde ese momento ya no es `offsetParent` del elemento, `addParentSticky` no lo encuentra y **nunca lo restaura**.

```html
<style>.fija { position: sticky; top: 0; height: 300px; }</style>
<div class="fija" id="padre"><div id="hijo" style="height:50px"></div></div>
<div class="fija" id="propia"></div>
<div style="position:sticky;top:0;height:40px" id="enLinea"></div>
```

```js
const lenis = new Lenis();
const pos = (id) => getComputedStyle(document.getElementById(id)).position;
const snap = new Snap(lenis);
snap.addElement(document.getElementById("propia"));
const propia = pos("propia"); // por hoja de estilos: se restaura
snap.addElement(document.getElementById("hijo"));
const padre = pos("padre"); // ancestro: se queda roto
snap.addElement(document.getElementById("enLinea"));
const enLinea = pos("enLinea"); // en línea: pierde el estilo
snap.destroy();
lenis.destroy();
// prueba: propia === "sticky" && padre === "static" && enLinea === "static"
```

Con `ignoreSticky: false` no se toca, a cambio de medir la posición actual:

```html
<style>.fija { position: sticky; top: 0; height: 300px; }</style>
<div class="fija" id="padre"><div id="hijo" style="height:50px"></div></div>
```

```js
const opciones = { ignoreSticky: false };
const lenis = new Lenis();
const snap = new Snap(lenis);
snap.addElement(document.getElementById("hijo"), opciones);
const padre = getComputedStyle(document.getElementById("padre")).position;
snap.destroy();
lenis.destroy();
// prueba: padre === "sticky"
```

Contenedores: la medida es relativa a la página, no al contenedor, y `center` usa la ventana.

```html
<div style="height:150px"></div>
<style>#caja { height: 300px; overflow: auto; }</style>
<div id="caja">
  <div id="interior"><div style="height:600px"></div><div id="meta" style="height:100px"></div><div style="height:1500px"></div></div>
</div>
```

```js
const caja = document.getElementById("caja");
const meta = document.getElementById("meta");
const lenis = new Lenis({ autoRaf: true, wrapper: caja, content: document.getElementById("interior") });
const snap = new Snap(lenis, { duration: 0.05 });
snap.addElement(meta);
snap.goTo(0);
await espera(250);
const pasado = lenis.scroll; // debería ser 600: suma el desplazamiento de la caja
const error = meta.getBoundingClientRect().top - caja.getBoundingClientRect().top;
snap.destroy();

const manual = new Snap(lenis, { duration: 0.05 });
lenis.scrollTo(0, { immediate: true });
const valor = meta.offsetTop - caja.offsetTop;
manual.add(valor);
manual.goTo(0);
await espera(250);
const correcto = meta.getBoundingClientRect().top - caja.getBoundingClientRect().top;
manual.destroy();
lenis.destroy();
// prueba: pasado === 750 && error === -150
// prueba: Math.abs(correcto) < 1
```

Lista con un valor desconocido:

```html
<div style="height:300px"></div>
<div id="punto" style="height:50px"></div>
```

```js
const lenis = new Lenis({ autoRaf: true });
const snap = new Snap(lenis, { duration: 0.05 });
snap.addElement(document.getElementById("punto"), { align: ["start", "foo"] });
snap.goTo(1);                  // existe un segundo punto
const indice = snap.currentSnapIndex;
await espera(200);
const y = lenis.scroll;
lenis.destroy();
snap.destroy();
// prueba: indice === 1 && y === 300
```

## Trampas

- **`align: 'start'` en horizontal.** Encaja en el `top` del elemento. Usa `center`, `end`, o `snap.add(elemento.offsetLeft)`. [C] [E]
- **Elemento dentro de un ancestro `sticky`.** El ancestro deja de ser `sticky` para siempre, sin aviso, también en cada remedición. Pasa `ignoreSticky: false`, con el elemento en reposo, o usa `snap.add()`. [C] [E]
- **`position: sticky` escrito en `style`.** `removeProperty` lo borra junto con el `static` temporal. Decláralo en una hoja. [C] [E]
- **Snap en un contenedor con `addElement`.** La posición incluye el desplazamiento del contenedor [E], y si no está posicionado, tampoco suma su `scrollTop` [C]. Calcula y usa `snap.add()`.
- **Un valor desconocido en la lista de `align`.** `['start', 'foo']` da dos puntos iguales: 300 y 300 en el ejemplo. [C] [E]
- **`addElements` tipado para arrays.** Con `NodeList` funciona; en TypeScript, convierte con `[...lista]`. [C] [E]
- **Quitar un elemento con la función devuelta.** Sale del mapa, pero sus dos `ResizeObserver` siguen activos. [C]
- **Medidas al crear.** Si la fuente o una imagen cambian la altura después, espera a los 500 ms o llama a `snap.resize()`. [E]
- **El elemento debe existir.** Con `null`, `addElement` lanza excepción. [C]
