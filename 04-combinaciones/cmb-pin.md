---
id: cmb-pin
titulo: Fijar secciones con Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis]
resumen: pin funciona sin scrollerProxy ni anticipatePin si ScrollTrigger.update va en el scroll de Lenis. Sin él, en contenedor el elemento fijado deriva 110 px en cada fotograma.
relacionadas: [orq-propiedad, cmb-reloj, cmb-contenedor, cmb-medidas, cmb-snap, cmb-anclas]
fuentes:
  - gsap:scr-pin
  - lenis:com-sticky-fixed
  - lenis:com-dimensiones
  - lab:conflictos-lab/e-pin.out
  - lab:conflictos-lab/z-ff.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Fijar secciones con Lenis

**Veredicto:** compatible con condición: `lenis.on("scroll", ScrollTrigger.update)` (O04) y, si creas el pin después de Lenis y vas a moverte de inmediato, sincronizar medidas (O18, en [`cmb-medidas`](cmb-medidas.md)).

Alcance: ventana y contenedor con `overflow` en hoja, `lerp` y `duration`, con y sin `lenis.css`, rueda real en Chrome y Firefox. El toque nativo sin `syncTouch` sigue en el hilo del compositor: sin medir. [P]

## Ejemplo

```html
<style>.caja { height: 400px; overflow: auto; position: relative }</style>
<div class="caja"><div class="relleno" style="height:500px"></div><div class="escena" style="height:300px"></div><div style="height:2000px"></div></div>
```

```js
const caja = document.querySelector(".caja");
const lenis = new Lenis({ wrapper: caja, content: caja });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const st = ScrollTrigger.create({ scroller: caja, trigger: ".escena", pin: true, start: "top top", end: "+=400" });
await espera(300);
lenis.resize();

const escena = document.querySelector(".escena");
const arriba = caja.getBoundingClientRect().top;
const derivas = [];
const mirar = () => {
  if (caja.scrollTop > st.start + 1 && caja.scrollTop < st.end - 1) derivas.push(Math.abs(escena.getBoundingClientRect().top - arriba));
};
gsap.ticker.add(mirar);
rueda(1100, caja);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
gsap.ticker.remove(mirar);

const y = caja.scrollTop;
gsap.ticker.remove(paso);
lenis.destroy();
st.kill();
// prueba: y === 1100
// prueba: derivas.length > 2 && Math.max(...derivas) < 1
```

## Contraejemplo: sin `update`

Deriva del elemento fijado en lo pintado, rueda de 2800, pin de 800. [E]

| | Con `update` | Sin `update` |
|---|---|---|
| Ventana, Chrome | 0 px | 62 px, en 1 fotograma, al entrar |
| Ventana, `duration` | 0 px | 19-26 px |
| Contenedor, Chrome | 0 px | **103-116 px en todos los fotogramas** |
| Contenedor, Firefox | 0 px | 36 px |
| Horizontal en contenedor | 0 px | 110 px |

La diferencia entre ventana y contenedor es el mecanismo: en ventana el pin es `fixed` y solo falla el fotograma de entrada; en contenedor es `transform`, y cada fotograma llega tarde. [C] [E]

Esta deriva es del laboratorio: el arnés no la reproduce con fiabilidad, porque su evento `scroll` llega tarde por otras razones.

## Opciones

| Opción | Con Lenis | Por qué |
|---|---|---|
| `pinType` | Déjalo por defecto | `fixed` forzado en un contenedor en el origen no derivó, y no aportó nada. Con contenedor desplazado, sin probar [P] |
| `anticipatePin` | Innecesario | 0 px de deriva sin él: Lenis escribe en el hilo principal |
| `pinSpacing` | Libre | `false` no cambia `limit`, `"margin"` lo sube 800 px como el padding |
| `normalizeScroll` | Prohibido | La base GSAP lo sugiere para tirones. Ver [`cmb-normalize`](cmb-normalize.md) |
| `scrollerProxy` | Innecesario | [`cmb-contenedor`](cmb-contenedor.md) |

`lenis.css` no afecta a `.pin-spacer`: `html.lenis { height: auto }` da las mismas posiciones, y con `html, body { height: 100% }` el fondo se alcanzó con y sin hoja (8100). Un `iframe` dentro del pin queda con `pointer-events: none` solo durante la animación.

## Trampas

- `limit` no ve el pin nuevo hasta 250 ms después: `scrollTo("bottom")` llegó a 7300 de 11300. Ver [`cmb-medidas`](cmb-medidas.md).
- Lenis con `Snap.addElement` sobre un elemento fijado se atasca: ver [`cmb-snap`](cmb-snap.md).
- Un ancla al propio elemento fijado no va a `start`: ver [`cmb-anclas`](cmb-anclas.md).
