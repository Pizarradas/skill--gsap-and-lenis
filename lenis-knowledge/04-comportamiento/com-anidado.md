---
id: com-anidado
titulo: Scroll anidado
capa: 04-comportamiento
tipo: concepto
ambito: core
resumen: Áreas con scroll propio dentro de una página con Lenis: allowNestedScroll, data-lenis-prevent, prevent o una segunda instancia, y qué hace overscroll.
api: [LenisOptions.allowNestedScroll, LenisOptions.prevent, LenisOptions.overscroll, LenisOptions.wrapper, Lenis.scrollTo]
requiere: [fun-modelo, opc-filtros]
relacionadas: [opc-filtros, opc-contenedores, com-stop-start, rec-modal]
etiquetas: [scroll, anidado, overscroll, modal]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Scroll anidado

Sin configuración, Lenis cancela la rueda aunque esté sobre un área con scroll propio: el puntero está sobre la lista y lo que se mueve es la página. Hay que decidir quién gestiona cada área. [C] (laboratorio: área en 0, página en 99 px tras una rueda de 100)

## Modelo mental

| Herramienta | Quién desplaza el área | Cuándo |
|---|---|---|
| `data-lenis-prevent` | Navegador | Lo normal: pocas áreas conocidas |
| `prevent(node)` | Navegador | Áreas de terceros o por regla |
| `allowNestedScroll` | Navegador; Lenis retoma en el límite | Muchas áreas, o desconocidas |
| Segunda instancia | Lenis, con suavizado | El área debe suavizarse también |

Resultados con entrada real (laboratorio: Chrome 156, 2026-11-05; área de 200 px con 800 px de recorrido):

| Configuración | Rueda en medio del área | Rueda con el área en su final |
|---|---|---|
| Sin nada | Se mueve la página | Se mueve la página |
| `data-lenis-prevent` con `lenis.css` | Área, nativa | **Nada**: `overscroll-behavior: contain` |
| `data-lenis-prevent` sin `lenis.css` | Área, nativa | Página, nativa y sin suavizar |
| `allowNestedScroll` | Área, nativa | Página, suavizada: Lenis retoma el gesto |

### `overscroll` en una segunda instancia

Cuando un Lenis anidado procesa un gesto, marca el evento con `event.lenisStopPropagation`, de modo que la instancia exterior lo ignora. `overscroll` decide si esa marca se pone **en el límite** del área:

| `overscroll` | Área en medio | Área en un extremo, empujando hacia fuera |
|---|---|---|
| `true` (por defecto) | Solo el área | **Las dos**: encadena, como el CSS `overscroll-behavior: auto` |
| `false` | Solo el área | Solo el área: como `contain` |

Para que esto funcione la instancia interior tiene que ver el evento antes: su `eventsTarget` es el área, y la exterior escucha en `window`, más arriba en la propagación. [C] [E]

## Ejemplo

```html
<div id="area" style="height:200px;overflow:auto"><div style="height:800px"></div></div>
```

```js
const area = document.getElementById("area");
const crear = (overscroll) => ({
  fuera: new Lenis(),
  dentro: new Lenis({ wrapper: area, content: area.firstElementChild, overscroll }),
});
const quitar = ({ fuera, dentro }) => {
  dentro.destroy();
  fuera.destroy();
};

const a = crear(true);
rueda(100, area);
const medio = [a.dentro.targetScroll, a.fuera.targetScroll];
a.dentro.scrollTo("bottom", { immediate: true });
rueda(100, area);
const limiteTrue = [a.dentro.targetScroll, a.fuera.targetScroll];
quitar(a);

const b = crear(false);
b.dentro.scrollTo("bottom", { immediate: true });
rueda(100, area);
const limiteFalse = [b.dentro.targetScroll, b.fuera.targetScroll];
quitar(b);
// prueba: medio[0] === 100 && medio[1] === 0
// prueba: limiteTrue[0] === 600 && limiteTrue[1] === 100
// prueba: limiteFalse[0] === 600 && limiteFalse[1] === 0
```

`data-lenis-prevent` sigue actuando con la página parada, que es lo que necesita un modal:

```html
<div id="modal" data-lenis-prevent style="height:200px;overflow:auto"><div style="height:800px"></div></div>
```

```js
const lenis = new Lenis();
lenis.stop();
const prevenidos = [];
addEventListener("wheel", (e) => prevenidos.push(e.defaultPrevented));
rueda(100, document.getElementById("modal"));
rueda(100, document.documentElement);
lenis.destroy();
// prueba: prevenidos[0] === false && prevenidos[1] === true
```

## Trampas

- **`data-lenis-prevent` en un área sin scroll propio.** La rueda no la mueve Lenis. Sin `overflow`, encadena a la página sin suavizar: 300 en laboratorio. Con `overflow: auto` sin desborde y `lenis.css`, queda muerta: 0, por `contain`. Sin la hoja, encadena: 300. Ver [`opc-filtros`](../02-opciones/opc-filtros.md). (laboratorio)
- **Sin `lenis.css`, el final del área arrastra la página**, sin suavizado y de golpe. [C] (laboratorio)
- **`overscroll` solo mira `deltaY`.** En una instancia interior horizontal, la comprobación de extremos usa `deltaY`: el encadenado horizontal es poco fiable. Usa `overscroll: false` y resuélvelo aparte. [C]
- **`overscroll` en una instancia de ventana** no tiene efecto salvo `false`, que solo marca el evento. El fin de la página no encadena a ningún sitio. [C]
- **`allowNestedScroll` con contenido nuevo.** Hay caché de 2 s. Ver [`opc-filtros`](../02-opciones/opc-filtros.md). [E]
- **`isScrolling` no refleja el área.** Un gesto filtrado se corta antes de tocar el estado: la página sigue en `false` mientras el área se mueve. [C] (laboratorio)
