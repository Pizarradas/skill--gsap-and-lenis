---
id: opc-gestos
titulo: Gestos de rueda, orientación y multiplicadores
capa: 02-opciones
tipo: concepto
ambito: core
resumen: Cómo se elige el delta según orientation y gestureOrientation, qué hace smoothWheel, por qué un gesto lateral queda nativo y cuándo actúan los multiplicadores.
api: [LenisOptions.orientation, LenisOptions.gestureOrientation, LenisOptions.smoothWheel, LenisOptions.wheelMultiplier, LenisOptions.touchMultiplier, VirtualScrollData.deltaX, VirtualScrollData.deltaY]
requiere: [fun-modelo]
relacionadas: [opc-tactil, com-horizontal, opc-filtros]
etiquetas: [gestos, rueda, multiplicador, orientacion]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Gestos, orientación y multiplicadores

`orientation` dice **qué eje se desplaza**. `gestureOrientation` dice **qué componente del gesto se usa**. Son independientes: con orientación vertical y gesto horizontal, mover el trackpad a los lados desplaza la página hacia abajo. [C] [E]

## Modelo mental

| `gestureOrientation` | Delta usado | Si el delta "suyo" es 0 |
|---|---|---|
| `vertical` (por defecto) | `deltaY` | Corta: gesto nativo |
| `horizontal` | `deltaX` | Corta: gesto nativo |
| `both` | El de mayor valor absoluto; si empatan, `deltaX` | Nunca corta por este motivo |

Con `orientation: 'horizontal'`, `gestureOrientation` vale `both`, de modo que una rueda vertical normal desplaza en horizontal. El README y el JSDoc solo mencionan `vertical`. [C] [E]

El corte del gesto desconocido conserva funciones del sistema: en un trackpad, deslizar en lateral puede ser "atrás" en el historial, y no se llama a `preventDefault`. [C] [E]

| Opción | Efecto | Detalle |
|---|---|---|
| `smoothWheel: true` | Suaviza la rueda | Con `false`, la rueda es nativa, pero Lenis sigue escuchando: `isScrolling` pasa a `'native'` y **detiene cualquier animación en curso** [E] |
| `wheelMultiplier` | Multiplica el delta de rueda | Se aplica en `VirtualScroll`: el evento `virtual-scroll` ya lo ve multiplicado [E] |
| `touchMultiplier` | Multiplica el delta del dedo | **Solo surte efecto con `syncTouch`**: sin él, el navegador mueve la página [C] |

Tampoco se suaviza un gesto con `ctrlKey`: es zoom, y se respeta. El evento `virtual-scroll` sí se emite antes. [C] [E]

Los valores de rueda también se normalizan: `deltaMode` 1 usa 16,67 px por línea, y `deltaMode` 2, el alto de ventana por página. [C] [E]

## Ejemplo

```js
const lenis = new Lenis();
const prevenidos = [];
addEventListener("wheel", (e) => prevenidos.push(e.defaultPrevented)); // tras Lenis, para ver su decisión
rueda(0, undefined, 100); // solo lateral con gesto vertical
const lateral = lenis.targetScroll;
rueda(100, undefined, 300); // diagonal: usa deltaY
const diagonal = lenis.targetScroll;
lenis.destroy();

const ambos = new Lenis({ gestureOrientation: "both" });
rueda(0, undefined, 50);
const soloX = ambos.targetScroll;
rueda(20, undefined, 20); // empate: toma deltaX
const empate = ambos.targetScroll;
rueda(30, undefined, 5); // mayor valor absoluto: deltaY
const mayor = ambos.targetScroll;
ambos.destroy();

const cruzado = new Lenis({ gestureOrientation: "horizontal" });
rueda(100);
const ignorado = cruzado.targetScroll;
rueda(0, undefined, 40);
const usado = cruzado.targetScroll;
cruzado.destroy();
// prueba: lateral === 0 && prevenidos[0] === false
// prueba: diagonal === 100 && prevenidos[1] === true
// prueba: soloX === 50 && empate === 70 && mayor === 100
// prueba: ignorado === 0 && usado === 40
```

Multiplicador, zoom y unidades de la rueda:

```js
const vistos = [];
const lenis = new Lenis({ wheelMultiplier: 2 });
lenis.on("virtual-scroll", ({ deltaY }) => vistos.push(deltaY));
rueda(100);
const multiplicado = lenis.targetScroll;

const raiz = document.documentElement;
raiz.dispatchEvent(new WheelEvent("wheel", { deltaY: 100, ctrlKey: true, bubbles: true, cancelable: true }));
const conCtrl = lenis.targetScroll;

raiz.dispatchEvent(new WheelEvent("wheel", { deltaY: 3, deltaMode: 1, bubbles: true, cancelable: true }));
const enLineas = lenis.targetScroll - conCtrl;
lenis.destroy();
// prueba: multiplicado === 200 && vistos[0] === 200
// prueba: conCtrl === 200 && vistos[1] === 200
// prueba: enLineas === 100
```

`smoothWheel: false` cede la rueda y corta una animación programática:

```js
const lenis = new Lenis({ smoothWheel: false, duration: 2, easing: (t) => t });
const prevenidos = [];
addEventListener("wheel", (e) => prevenidos.push(e.defaultPrevented));
lenis.scrollTo(1000);
lenis.raf(1000);
lenis.raf(1100);
const antes = lenis.animatedScroll;
rueda(100);
lenis.raf(1200);
lenis.raf(1300);
const despues = lenis.animatedScroll;
const estado = lenis.isScrolling;
lenis.destroy();
// prueba: antes > 0 && despues === antes && estado === "native" && prevenidos[0] === false
```

## Trampas

- **`orientation` horizontal con `gestureOrientation: 'vertical'` en un ratón.** Sí funciona, pero el trackpad lateral queda nativo. Si quieres ambos, deja el valor por defecto. [P]
- **Cambiar `lenis.options.orientation` en vivo.** `gestureOrientation` se calculó al crear la instancia y `dimensions.limit` depende del eje. Recrea la instancia. [C]
- **`Shift` + rueda.** Lenis no lo trata: depende de si el navegador convierte el delta a `deltaX`. Si lo hace, con gesto `vertical` queda nativo. [C]
- **`touchMultiplier` sin `syncTouch`.** No hace nada visible. Para acelerar el dedo necesitas tomar la ruta sincronizada. [C]
- **Un `wheelMultiplier` alto con Snap.** Snap suma el último delta a la posición: los deltas grandes desplazan la predicción. Ver [`snp-snap`](../05-snap/snp-snap.md). [E]
