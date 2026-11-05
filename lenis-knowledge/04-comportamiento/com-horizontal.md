---
id: com-horizontal
titulo: Scroll horizontal
capa: 04-comportamiento
tipo: concepto
ambito: core
resumen: orientation horizontal: maquetación necesaria, conversión de la rueda vertical, medidas en X y posición de objetivos, en ventana y en contenedor.
api: [LenisOptions.orientation, LenisOptions.gestureOrientation, Lenis.isHorizontal, Lenis.limit, Lenis.scrollTo, Lenis.overflow]
requiere: [fun-modelo, opc-gestos]
relacionadas: [opc-gestos, rec-horizontal, snp-elementos]
etiquetas: [horizontal, orientacion, eje]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Scroll horizontal

`orientation: 'horizontal'` hace que Lenis lea y escriba el eje X. No cambia la maquetación: la página debe desbordar en horizontal por sí misma. [C]

## Modelo mental

| Aspecto | Vertical | Horizontal |
|---|---|---|
| Posición | `scrollY`, `scrollTop` | `scrollX`, `scrollLeft` |
| Escritura | `{ top }` | `{ left }` |
| `limit` | `dimensions.limit.y` | `dimensions.limit.x` |
| Objetivo en `scrollTo` | `rect.top`, `scroll-margin-top` | `rect.left`, `scroll-margin-left` |
| Gesto por defecto | `vertical` | `both`: la rueda vertical mueve en X |
| `overflow` | `overflow-y` | `overflow-x` |

Con `both`, un ratón normal desplaza la página a lo ancho, y un trackpad funciona en cualquier dirección. La marca `window.lenis.horizontal` se activa al crear la instancia. [C] [E]

`syncTouch` también es válido en horizontal, y el ejemplo del repositorio lo combina con `allowNestedScroll` y `anchors`, en `playground/horizontal/test.ts`. [C]

## Ejemplo

```html
<div id="tira" style="display:flex;width:3000px;height:200px">
  <div style="width:1500px"></div>
  <div id="panel" style="width:200px;height:50px"></div>
</div>
```

```js
const lenis = new Lenis({ orientation: "horizontal" });
const r = { eje: lenis.isHorizontal, gesto: lenis.options.gestureOrientation, marca: window.lenis.horizontal };
const limite = lenis.limit;

rueda(100); // rueda vertical normal
const destino = lenis.targetScroll;
let t = 1000;
lenis.raf(t);
for (let i = 0; i < 300; i++) lenis.raf((t += 16));
const x = window.scrollX;
const y = window.scrollY;

lenis.scrollTo("#panel", { immediate: true });
const alPanel = window.scrollX;
lenis.destroy();
// prueba: r.eje && r.gesto === "both" && r.marca === true
// prueba: limite === 2000 && destino === 100 && x === 100 && y === 0
// prueba: alPanel === 1500
```

## Trampas

- **Esperar que Lenis gire la página.** No hay `transform`: si el documento no desborda a lo ancho, `limit` es 0 o negativo. Crea primero la maquetación horizontal. [C]
- **Snap con `align: 'start'`.** En horizontal usa `rect.top`: va a un punto equivocado. Usa `center`, `end` o `snap.add()`. [E] en [`snp-elementos`](../05-snap/snp-elementos.md)
- **Una altura propia en el contenido** crea doble eje: la página puede seguir teniendo scroll vertical nativo que Lenis no controla. Limita la altura de la vista. [P]
- **`gestureOrientation: 'horizontal'`.** Deja la rueda de ratón sin efecto, porque esta solo produce `deltaY`, salvo `Shift`. Solo tiene sentido en trackpad. [C]
- **Barra de scroll inferior.** `dimensions.height` es `innerHeight`, que incluye la barra; en vertical, una barra horizontal descuadra `limit`. Ver [`com-dimensiones`](com-dimensiones.md). [C]
