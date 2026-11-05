---
id: opc-contenedores
titulo: wrapper, content y eventsTarget
capa: 02-opciones
tipo: concepto
ambito: core
resumen: Qué elemento se desplaza, cuál se mide y cuál escucha gestos. Diferencias entre ventana y contenedor, y errores de creación.
api: [LenisOptions.wrapper, LenisOptions.content, LenisOptions.eventsTarget, Lenis.rootElement, Lenis.limit]
requiere: [fun-modelo]
relacionadas: [com-dimensiones, com-anidado, com-clases, opc-referencia]
etiquetas: [wrapper, contenedor, eventos]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# `wrapper`, `content` y `eventsTarget`

Por defecto Lenis controla la ventana. Las tres opciones permiten aplicarlo a un contenedor con `overflow` propio y separar quién escucha de quién se mueve. [C]

## Modelo mental

| Opción | Pregunta que responde | Usos internos |
|---|---|---|
| `wrapper` | ¿Quién tiene el scroll? | `scrollTo`, `scroll`, `scrollend`, `click`, `pointerdown`, clases |
| `content` | ¿Qué se observa si cambia de tamaño? | `ResizeObserver`; en ventana, también aporta `scrollHeight` |
| `eventsTarget` | ¿Quién recibe rueda y toque? | Listeners de `VirtualScroll` |

`rootElement` es `document.documentElement` con ventana, y `wrapper` en otro caso: ahí van las [clases](../04-comportamiento/com-clases.md) y de él se lee `overflow`. [C]

| Medida | Ventana | Contenedor |
|---|---|---|
| Alto visible | `window.innerHeight` | `wrapper.clientHeight` |
| Alto total | `content.scrollHeight` | `wrapper.scrollHeight`: `content` **no se mide** |
| Cambios de tamaño | evento `resize` + `ResizeObserver` de `content` | `ResizeObserver` de ambos |

`wrapper: document.documentElement` se convierte en `window`, pero `eventsTarget` conserva el valor original: el parámetro por defecto se evalúa antes. Funciona igual porque `<html>` recibe los eventos de todo el documento. [C] [E]

Los enlaces de `anchors` y `stopInertiaOnNavigate` se escuchan en `wrapper`, no en `eventsTarget`. Con un contenedor, un enlace situado fuera de él no se procesa. [C]

## Ejemplo

```html
<style>#caja { height: 300px; overflow: auto; margin-top: 100px; }</style>
<div id="caja">
  <div id="interior"><div style="height:1400px"></div></div>
</div>
```

```js
const caja = document.getElementById("caja");
const lenis = new Lenis({
  wrapper: caja,
  content: document.getElementById("interior"),
});
const raiz = lenis.rootElement === caja;
const clase = caja.classList.contains("lenis");
const claseHtml = document.documentElement.classList.contains("lenis");
const limite = lenis.limit;

rueda(100, document.documentElement); // fuera: eventsTarget es caja
const fuera = lenis.targetScroll;
rueda(100, caja);
const dentro = lenis.targetScroll;
lenis.destroy();
// prueba: raiz && clase && claseHtml === false && limite === 1100
// prueba: fuera === 0 && dentro === 100
```

Una zona más grande que el contenedor escucha los gestos: toda la ventana desplaza la caja.

```html
<style>#caja { height: 300px; overflow: auto; }</style>
<div id="caja"><div style="height:1400px"></div></div>
```

```js
const caja = document.getElementById("caja");
const lenis = new Lenis({ wrapper: caja, content: caja.firstElementChild, eventsTarget: window });
rueda(100, document.documentElement);
const destino = lenis.targetScroll;
lenis.destroy();
// prueba: destino === 100
```

Un contenedor dentro de una página con scroll nativo **atrapa la rueda** en sus extremos: Lenis llama a `preventDefault` también en el límite, y la opción `overscroll` no lo evita, porque solo marca el evento para otra instancia. Devuelve `false` en `virtualScroll` cuando el gesto empuja contra un extremo, y la página sigue. Con rueda real, en el límite 700: sin el filtro, la página se quedó en 0; con él, llegó a 300, y también subiendo desde el extremo superior, con `lerp` y con `duration`. (laboratorio) [C]

```html
<style>#caja { height: 300px; overflow: auto; }</style>
<div id="caja"><div style="height:1000px"></div></div>
```

```js
const caja = document.getElementById("caja");
const lenis = new Lenis({
  wrapper: caja,
  content: caja.firstElementChild,
  virtualScroll: ({ deltaY }) =>
    !((lenis.scroll >= lenis.limit - 1 && deltaY > 0) || (lenis.scroll <= 0 && deltaY < 0)),
});
const prevenido = [];
addEventListener("wheel", (e) => prevenido.push(e.defaultPrevented));

rueda(100, caja);                       // dentro: lo gestiona Lenis
lenis.scrollTo("bottom", { immediate: true });
rueda(100, caja);                       // en el límite: para la página
rueda(-100, caja);                      // subiendo: otra vez Lenis
lenis.destroy();
// prueba: prevenido.join() === "true,false,true"
```

Errores al crear:

```js
const html = new Lenis({ wrapper: document.documentElement });
const convertido = html.options.wrapper === window;
const escucha = html.options.eventsTarget === document.documentElement;
html.destroy();

let mensaje = "";
try {
  new Lenis({ wrapper: null });
} catch (e) {
  mensaje = e.message;
}
document.documentElement.classList.remove("lenis");
// prueba: convertido && escucha
// prueba: mensaje.includes("addEventListener")
```

## Trampas

- **`wrapper` nulo.** El código parece admitirlo (`if (!wrapper) wrapper = window`), pero `eventsTarget` ya tomó el valor nulo y `VirtualScroll` lanza `TypeError`, dejando la clase `lenis` puesta. Un `querySelector` que no encuentra nada produce esto. [C] [E]
- **Contenedor sin `overflow: auto` o `scroll`, o sin altura.** `limit` será 0 y Lenis no moverá nada: comprueba antes que el contenedor se desplaza por sí solo. [P]
- **`stop()` en un contenedor.** Con `overflow` en hoja y `lenis.css`, salta a 0 y deja de aceptar `force`: ver [`com-stop-start`](../04-comportamiento/com-stop-start.md#ventana-y-contenedor). [E]
- **`content` que no es hijo real del scroll.** En contenedores, `content` solo avisa de cambios: si observas otro elemento, `limit` queda obsoleto hasta el siguiente aviso. [C]
- **`eventsTarget` más pequeño que `wrapper`.** Fuera de esa zona la rueda queda nativa, sin suavizar. [C]
- **Filtros con `eventsTarget` externo.** El recorrido se corta en `rootElement`. Si el gesto nace fuera del contenedor, ese elemento no está en la ruta y se revisan todos los ancestros hasta el documento: un `data-lenis-prevent` en `body` cortaría. [C]
- **Snap y contenedores no se llevan bien.** `addElement` mide respecto a la página. Ver [`snp-elementos`](../05-snap/snp-elementos.md). [E]
