---
id: rec-horizontal
titulo: Scroll horizontal, de página y por sección
capa: 08-recetas
tipo: patron
ambito: core
resumen: Dos soluciones de scroll horizontal, orientation para una página o contenedor y sticky más transform para una sección de una página vertical.
api: [LenisOptions.orientation, LenisOptions.gestureOrientation, Lenis.isHorizontal, LenisOptions.wrapper, LenisOptions.content]
requiere: [com-horizontal, opc-gestos]
relacionadas: [opc-contenedores, com-sticky-fixed, cal-accesibilidad, rec-secciones-snap]
etiquetas: [horizontal, sticky, plantilla]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Scroll horizontal, de página y por sección

Hay dos casos distintos. Si todo el contenedor se desplaza en horizontal, basta `orientation`. Si es una sección de una página vertical, Lenis no interviene en el eje y hay que convertir el avance. Plantilla del segundo caso: `plantillas/scrollHorizontal.js` con módulos, o `plantillas/globales/scrollHorizontal.js` con `<script>` clásico, que expone `Plantillas.scrollHorizontal`. Ver [cómo copiarla](../plantillas/README.md#copiar-a-un-proyecto).

## Problema

La rueda da `deltaY`, y el contenido pide moverse en X. Con `orientation: "horizontal"` Lenis lo resuelve para todo su contenedor, pero no para una parte de la página.

## Solución

**Contenedor o página entera.** `gestureOrientation` vale `"both"` por defecto en horizontal desde 1.3.10, así que la rueda vertical y la horizontal avanzan a la vez [C] [E].

```html
<div id="fila" style="width:600px;height:300px;overflow:auto"><div id="pista" style="display:flex;width:max-content">
  <div class="panel" style="flex:none;width:600px;height:280px">1</div><div class="panel" style="flex:none;width:600px;height:280px">2</div><div class="panel" style="flex:none;width:600px;height:280px">3</div>
</div></div>
```

```js
const fila = document.querySelector("#fila");
const lenis = new Lenis({
  wrapper: fila,
  content: document.querySelector("#pista"),
  orientation: "horizontal",
  autoRaf: true,
  lerp: 0.3,
});

rueda(300, fila); // rueda vertical
await espera(500);
const conVertical = lenis.scroll;
rueda(0, fila, 200); // gesto horizontal de trackpad
await espera(500);

// prueba: lenis.isHorizontal && lenis.options.gestureOrientation === "both"
// prueba: conVertical > 290 && lenis.scroll > 490
// prueba: Math.abs(fila.scrollLeft - lenis.scroll) < 1
```

**Sección dentro de una página vertical.** La pista se fija con `sticky` y se traslada según el avance vertical. La sección mide lo que recorre la pista más la altura de la vista. `overflow-x: clip` recorta sin crear un contenedor de scroll, cosa que `hidden` haría, y anularía `sticky`.

```html
<div style="height:300px"></div>
<div id="galeria">
  <div id="carril" style="display:flex;width:max-content;height:700px">
    <div style="flex:none;width:1000px">1</div><div style="flex:none;width:1000px">2</div>
  </div>
</div>
<div style="height:2000px"></div>
```

```js
const galeria = document.querySelector("#galeria");
const carril = document.querySelector("#carril");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });

const recorrido = carril.scrollWidth - galeria.clientWidth;
galeria.style.overflowX = "clip";
galeria.style.height = `${recorrido + lenis.dimensions.height}px`;
carril.style.position = "sticky";
carril.style.top = "0";
const inicio = galeria.getBoundingClientRect().top + lenis.actualScroll;
lenis.resize(); // la sección ha cambiado de altura

const quitar = lenis.on("scroll", () => {
  const avance = Math.min(1, Math.max(0, (lenis.scroll - inicio) / recorrido));
  carril.style.transform = `translate3d(${-avance * recorrido}px, 0, 0)`;
});

rueda(300 + 400);
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);

// prueba: Math.abs(parseFloat(carril.style.transform.slice(12)) + 400) < 2
// prueba: Math.abs(carril.getBoundingClientRect().top) < 2
```

## Parámetros

| Plantilla | Por defecto | Uso |
|---|---|---|
| `lenis` | crea una | Instancia compartida |
| `pista` | primer hijo | Elemento que se traslada. Con `display: flex` y `width: max-content` |

Un `ResizeObserver` recalcula si cambia el ancho. `limpiar.actualizar()` lo fuerza [E]. La plantilla lleva la pieza a la vista al recibir el foco con Tab [E].

## Movimiento reducido

Convertir vertical en horizontal cambia la relación entre gesto y movimiento. Con `prefers-reduced-motion` la plantilla no fija nada, y deja un carrusel con `overflow-x: auto` que se desplaza de forma nativa. Responde si la preferencia cambia [E]. En el caso de contenedor, Lenis ya sigue la rueda sin suavizar [C].

## Limpieza

Devuelve las alturas y estilos en línea, y llama a `lenis.resize()` si la instancia sigue viva: la página acaba de encogerse y su `limit` está obsoleto [E].

## Trampas

- **En un contenedor, medir antes de recortar da una altura errónea.** Sin `overflow-x: clip`, la pista crea una barra horizontal: `lenis.dimensions.height` da 285 en vez de 300, y la sección queda 15 px corta. La plantilla recorta, llama a `resize()` y mide dos veces, porque la nueva altura puede hacer aparecer una barra vertical que estrecha la sección. [E]
- **Sin `lenis.resize()` tras cambiar la altura,** `limit` es el anterior hasta que termine la espera de 250 ms del reajuste, y `scrollTo` recorta el destino. [C] [E: [navegación](rec-navegacion.md)]
- **`overflow: hidden` en la sección anula `sticky`.** Usa `overflow-x: clip`. [P]
- **`orientation: "horizontal"` en la ventana mueve `scrollX`, no el eje del gesto.** Hace falta contenido más ancho que la ventana. [C]
- **El toque en horizontal va por otra ruta.** Sin `syncTouch`, Lenis no lo anima y lo deja al navegador, de modo que solo avanza con el dedo en horizontal: la conversión de vertical a horizontal es de la rueda. [C]
- **Con `lenis/snap` y `align: "start"` en horizontal no hay ajuste:** ver [secciones](rec-secciones-snap.md). [E]
- **Elementos enfocables en una pista trasladada quedan invisibles.** El navegador no puede desplazar un `overflow: clip`. Escucha `focusin` y mueve el scroll, como hace la plantilla [E].
