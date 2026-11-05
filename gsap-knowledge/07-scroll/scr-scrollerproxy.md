---
id: scr-scrollerproxy
titulo: ScrollTrigger.scrollerProxy(), integrar otro scroll
capa: 07-scroll
tipo: api
ambito: ScrollTrigger
resumen: Sustituye los getters y setters de scroll de un elemento para que ScrollTrigger funcione con librerías de scroll suave o desplazamientos propios.
api: [ScrollTrigger.scrollerProxy, ScrollTrigger.ScrollerProxyVars.scrollTop, ScrollTrigger.ScrollerProxyVars.scrollLeft, ScrollTrigger.ScrollerProxyVars.scrollWidth, ScrollTrigger.ScrollerProxyVars.scrollHeight, ScrollTrigger.ScrollerProxyVars.getBoundingClientRect, ScrollTrigger.ScrollerProxyVars.pinType, ScrollTrigger.ScrollerProxyVars.fixedMarkers, ScrollTrigger.ScrollerProxyVars.content, ScrollTrigger.RectObj.top, ScrollTrigger.RectObj.left, ScrollTrigger.RectObj.width, ScrollTrigger.RectObj.height]
relacionadas: [scr-smoother, scr-pin, scr-refresh]
etiquetas: [scroll, integracion, librerias]
fuentes:
  - docs/v3/Plugins/ScrollTrigger/static.scrollerProxy().md
estado: verificado
version: 3.15.1
---
# ScrollTrigger.scrollerProxy()

ScrollTrigger lee `scrollTop` y `getBoundingClientRect()` del scroller. Las librerías con scroll simulado no cambian esos valores reales: mueven contenido con transforms. Un proxy le dice a ScrollTrigger de dónde sacar esas cifras. Si puedes usar [ScrollSmoother](scr-smoother.md), no lo necesitas. [O]

## Firma

```text
ScrollTrigger.scrollerProxy(scroller, vars?)
```

Se necesita al menos `scrollTop` o `scrollLeft`; lo demás es opcional. Llamarla sin `vars` retira el proxy de ese scroller. [O] [C]

| Clave | Tipo | Uso |
|---|---|---|
| `scrollTop`, `scrollLeft` | función getter y setter | Con argumento, escribe; sin él, devuelve la posición [O] |
| `getBoundingClientRect` | función que devuelve `RectObj` | `{ top, left, width, height }` del scroller. Casi siempre el tamaño de la ventana [O] |
| `scrollHeight`, `scrollWidth` | función getter y setter | Tamaño del contenido si el real no sirve [O] |
| `pinType` | `"fixed"`, `"transform"` | Pin con tirones: `"fixed"`. Pin que no se queda: `"transform"` [O] |
| `fixedMarkers` | booleano | Si los marcadores se mueven con el contenido [O] |
| `content` | elemento o selector | Elemento que se desplaza. Está en los tipos, y ScrollSmoother lo pasa; sin documentar [C] |

Dos requisitos: definir el proxy **antes** de crear instancias con ese scroller, y avisar a ScrollTrigger con `ScrollTrigger.update` en cada movimiento de la librería. [O]

## Ejemplo

Un desplazamiento propio con `y`. El bloque `.seccion` está a 400 px dentro de `.lienzo`; el visor mide 300 px:

```html
<div class="visor" style="height:300px;overflow:hidden">
  <div class="lienzo" style="height:1500px">
    <div style="height:400px"></div>
    <div class="seccion" style="height:100px"></div>
  </div>
</div>
```

```js
const lienzo = document.querySelector(".lienzo");
let posicion = 0;

ScrollTrigger.scrollerProxy(".visor", {
  scrollTop(valor) {
    if (arguments.length) {
      posicion = valor;
      gsap.set(lienzo, { y: -valor });
    }
    return posicion;
  },
  getBoundingClientRect() {
    return { top: 0, left: 0, width: 1000, height: 300 };
  },
  scrollHeight() {
    return 1500;
  },
  pinType: "transform",
});

const st = ScrollTrigger.create({
  trigger: ".seccion",
  scroller: ".visor",
  start: "top top",
  end: "+=200",
  pin: true,
});

st.scroll(500);       // pasa por el setter del proxy
ScrollTrigger.update();

// prueba: st.start === 400 && st.end === 600
// prueba: st.progress === 0.5 && st.isActive === true
// prueba: gsap.getProperty(lienzo, "y") === -500
// prueba: document.querySelector(".seccion").style.transform === "translate(0px, 100px)"
// prueba: ScrollTrigger.maxScroll(document.querySelector(".visor")) === 1200
```

Con una librería real el esqueleto es igual. La librería no está cargada en el arnés, por eso es un fragmento:

```js fragmento
const barra = LibreriaScroll.init(document.body);

ScrollTrigger.scrollerProxy(document.body, {
  scrollTop(valor) {
    if (arguments.length) barra.scrollTop = valor;
    return barra.scrollTop;
  },
  getBoundingClientRect() {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
  },
});

barra.addListener(ScrollTrigger.update);
```

## Trampas

- **Olvidar `ScrollTrigger.update`.** El proxy solo responde cuando ScrollTrigger pregunta. Sin el aviso, nada se actualiza al moverse. [O]
- **Proxy creado después de las instancias.** Las que ya existen conservan los accesos nativos. Créalo primero y refresca si hace falta. [O] [P]
- **El proxy del viewport afecta a `window`, `body` y `documentElement` a la vez.** Se registra para los tres. [C]
- **`overflow` en el scroller con librerías que simulan scrollbar.** ScrollTrigger pone `overflow: auto` durante la medición. Locomotive y similares necesitan forzar `overflow-y: hidden !important`. [O]
- **Pin que vibra.** El contenedor se traslada con transform, en ese caso `position: fixed` no sirve de nada: `pinType: "transform"`. Si el `scroller` es el `body` con scroll real, `"fixed"`. [O]
- **No se da soporte a librerías de terceros.** Las demos oficiales son cortesía, y las APIs de esas librerías cambian: revisa su versión. [O]
