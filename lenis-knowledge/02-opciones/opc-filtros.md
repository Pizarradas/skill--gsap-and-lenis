---
id: opc-filtros
titulo: Filtros de gestos, prevent, virtualScroll y data-lenis-*
capa: 02-opciones
tipo: concepto
ambito: core
resumen: Orden exacto de los filtros de Lenis, qué consecuencias tiene cortar en cada uno, y cómo usar prevent, virtualScroll, allowNestedScroll y atributos data-lenis-*.
api: [LenisOptions.prevent, LenisOptions.virtualScroll, LenisOptions.allowNestedScroll, VirtualScrollData.deltaX, VirtualScrollData.deltaY, VirtualScrollData.event, Lenis.on]
requiere: [fun-modelo]
relacionadas: [com-anidado, opc-gestos, opc-tactil, com-stop-start, api-eventos]
etiquetas: [filtros, prevent, virtualScroll, atributos]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Filtros de gestos

Cada gesto recorre una cadena fija en `onVirtualScroll`. Saber su orden explica por qué un área con `data-lenis-prevent` se desplaza con Lenis parado, o por qué Snap reacciona a una rueda filtrada. [C] [E]

## Modelo mental

| # | Comprobación | Si se cumple | `preventDefault` |
|---|---|---|---|
| 1 | Opción `virtualScroll` devuelve exactamente `false` | Corta, **sin emitir** `virtual-scroll` | No |
| 2 | Emite el evento `virtual-scroll` | Sigue | |
| 3 | `event.ctrlKey` | Corta: zoom | No |
| 4 | `event.lenisStopPropagation`, marca de una instancia anidada | Corta | No |
| 5 | iOS, tirador de selección | Corta | No |
| 6 | Toque tipo tap con `syncTouch` | Detiene la animación y corta | No |
| 7 | Delta nulo, o gesto fuera de `gestureOrientation` | Corta | No |
| 8 | Algún nodo de la ruta, hasta `rootElement`, cumple `prevent`, `data-lenis-*` o `allowNestedScroll` | Corta | No |
| 9 | `isStopped` o `isLocked` | Corta | **Sí, si es cancelable** |
| 10 | Ni `smoothWheel` ni `syncTouch` aplican | `isScrolling = 'native'`; marca el evento; corta | No |
| 11 | Sigue: calcula delta, cancela y hace `scrollTo` | | Sí, si es cancelable |

Conclusiones [C] [E]:

- El **evento** `virtual-scroll` se emite antes de casi todo. Lo reciben gestos filtrados, gestos con Lenis parado y gestos en áreas excluidas. Snap se basa en él.
- Filtrar con `prevent` o atributos no anula el gesto: lo **devuelve al navegador**.
- El paso 8 va antes del 9: un área excluida sigue desplazándose con `lenis.stop()`. Es la base de un modal con scroll propio; ver [`rec-modal`](../08-recetas/rec-modal.md).

### Atributos

| Atributo | Excluye |
|---|---|
| `data-lenis-prevent` | Todo gesto |
| `data-lenis-prevent-wheel` | Rueda |
| `data-lenis-prevent-touch` | Toque |
| `data-lenis-prevent-vertical` | Gesto con `|deltaY| > |deltaX|` |
| `data-lenis-prevent-horizontal` | Gesto con `|deltaX| >= |deltaY|` |

### `prevent` y `virtualScroll`

`prevent(node)` se llama por cada `HTMLElement` de la ruta, desde el objetivo hacia `rootElement`, sin incluirlo. Los nodos SVG no se evalúan. [C]

`virtualScroll(data)` recibe `{ deltaX, deltaY, event }` y permite dos cosas: devolver `false`, o **mutar** `data`, porque Lenis lee los deltas después de llamarla. Devolver `undefined` no corta: solo `false` estricto. [C] [E]

### `allowNestedScroll`

Para cada nodo de la ruta comprueba si tiene `overflow` `auto`, `overlay` o `scroll`, desborda y puede seguir moviéndose en la dirección del gesto. Si llega a su límite y su `overscroll-behavior` es `auto`, devuelve el gesto a Lenis y la página continúa. [C] (laboratorio)

No inspecciona el DOM en cada evento como sugiere el README: guarda las medidas por nodo durante 2 segundos. El coste es menor, pero aparece otra trampa: el dato queda obsoleto. [C] [E]

## Ejemplo

Matriz de atributos con rueda y toque:

```html
<div id="todo" data-lenis-prevent style="height:50px"></div>
<div id="rueda" data-lenis-prevent-wheel style="height:50px"></div>
<div id="dedo" data-lenis-prevent-touch style="height:50px"></div>
<div id="vert" data-lenis-prevent-vertical style="height:50px"></div>
<div id="horiz" data-lenis-prevent-horizontal style="height:50px"></div>
<div id="libre" style="height:50px"></div>
```

```js
const el = (id) => document.getElementById(id);
const lenis = new Lenis({ gestureOrientation: "both", syncTouch: true });

const mueveRueda = (id, dy, dx = 0) => {
  const antes = lenis.targetScroll;
  rueda(dy, el(id), dx);
  return lenis.targetScroll !== antes;
};
const mueveToque = (id) => {
  lenis.scrollTo(0, { immediate: true });
  toque("touchstart", 100, 100, el(id));
  toque("touchmove", 100, 60, el(id));
  const movido = lenis.targetScroll !== 0;
  toque("touchend", 100, 60, el(id));
  return movido;
};
const r = {
  todoR: mueveRueda("todo", 50), ruedaR: mueveRueda("rueda", 50), dedoR: mueveRueda("dedo", 50),
  vertY: mueveRueda("vert", 50), vertX: mueveRueda("vert", 0, 50),
  horizY: mueveRueda("horiz", 50), horizX: mueveRueda("horiz", 0, 50), libreR: mueveRueda("libre", 50),
  todoT: mueveToque("todo"), ruedaT: mueveToque("rueda"), dedoT: mueveToque("dedo"),
};
lenis.destroy();
// prueba: r.todoR === false && r.ruedaR === false && r.dedoR === true && r.libreR === true
// prueba: r.vertY === false && r.vertX === true && r.horizY === true && r.horizX === false
// prueba: r.todoT === false && r.ruedaT === true && r.dedoT === false
```

`virtualScroll`: cortar frente a mutar.

```js
const vistos = [];
const lenis = new Lenis({
  virtualScroll: (data) => {
    if (data.deltaY === 111) return false;
    data.deltaY *= 2; // sin return: sigue, con el valor modificado
  },
});
lenis.on("virtual-scroll", ({ deltaY }) => vistos.push(deltaY));
const prevenidos = [];
addEventListener("wheel", (e) => prevenidos.push(e.defaultPrevented));

rueda(111);
const cortado = lenis.targetScroll;
rueda(100);
const mutado = lenis.targetScroll;
lenis.destroy();
// prueba: cortado === 0 && mutado === 200
// prueba: vistos.length === 1 && vistos[0] === 200
// prueba: prevenidos[0] === false && prevenidos[1] === true
```

`prevent` actúa antes que `stop()`: el gesto queda libre en el área excluida y cancelado en el resto.

```html
<div id="panel" class="modal" style="height:100px"></div>
<div id="fondo" style="height:100px"></div>
```

```js
const lenis = new Lenis({ prevent: (nodo) => nodo.classList.contains("modal") });
lenis.stop();
const prevenidos = [];
addEventListener("wheel", (e) => prevenidos.push(e.defaultPrevented));
rueda(50, document.getElementById("panel"));
rueda(50, document.getElementById("fondo"));
lenis.destroy();
// prueba: prevenidos[0] === false && prevenidos[1] === true
```

La caché de `allowNestedScroll` dura 2 segundos:

```html
<div id="lista" style="overflow:auto;height:100px"><div id="filas" style="height:50px"></div></div>
```

```js
const lista = document.getElementById("lista");
const lenis = new Lenis({ allowNestedScroll: true });
rueda(100, lista); // aún no desborda: Lenis mueve la página
const primero = lenis.targetScroll;
document.getElementById("filas").style.height = "800px"; // ahora sí desborda
rueda(50, lista); // pero la medida guardada dice que no
const obsoleto = lenis.targetScroll;
await espera(2100);
rueda(50, lista); // medida nueva: gesto para la lista
const renovado = lenis.targetScroll;
lenis.destroy();
// prueba: primero === 100 && obsoleto === 150 && renovado === 150
```

## Trampas

- **Filtrar y esperar que no pase nada.** `prevent` no bloquea: el área recibe scroll nativo. Si no tiene scroll, depende de su CSS. Sin `overflow`, encadena a la página **sin suavizar**, y el salto es visible. Con `overflow: auto` sin desborde y `lenis.css`, la rueda **queda muerta**: el área sigue siendo contenedor de scroll y `overscroll-behavior: contain` corta el encadenado. Sin `lenis.css`, encadena. (laboratorio) [C]
- **`return false` en todos los caminos de `virtualScroll`.** Corta la emisión: Snap deja de reaccionar. Devuelve `false` solo en lo que quieras excluir. [E]
- **Mutar `deltaY` por el camino de `wheelMultiplier`.** El valor ya viene multiplicado. [C]
- **`prevent` caro.** Se ejecuta por cada nodo y evento: una consulta de estilos dentro multiplica el coste. Usa clase, id o atributo. [P]
- **Carrusel horizontal con `overscroll-behavior: contain` y `allowNestedScroll`.** `overflow-x: auto` calcula `overflow-y: auto`; con `contain` y sin desborde vertical, `scroll >= maxScroll` se cumple y la rueda vertical se considera anidada: Lenis no la procesa. Sin `contain`, funciona. [C] [E]
- **`allowNestedScroll` tras cargar contenido.** Durante 2 s puede decidir con medidas viejas. [E]
- **El atributo en un elemento del propio `rootElement`.** La ruta se corta antes de él: `data-lenis-prevent` en `<html>` no hace nada. [C]

```html
<div id="conten" style="overflow-x:auto;overscroll-behavior:contain;height:60px;width:300px"><div style="width:900px;height:20px"></div></div>
<div id="normal" style="overflow-x:auto;height:60px;width:300px"><div style="width:900px;height:20px"></div></div>
```

```js
const lenis = new Lenis({ allowNestedScroll: true });
rueda(100, document.getElementById("conten"));
const conContain = lenis.targetScroll;
rueda(100, document.getElementById("normal"));
const conAuto = lenis.targetScroll;
lenis.destroy();
// prueba: conContain === 0 && conAuto === 100
```
