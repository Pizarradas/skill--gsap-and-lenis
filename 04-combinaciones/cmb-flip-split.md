---
id: cmb-flip-split
titulo: Flip y SplitText con ScrollTrigger y Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap, gsap-smoother, gsap+lenis]
resumen: Flip deja el layout final solo al terminar: refresh en onComplete, no al lanzarlo. SplitText con autoSplit no duplica instancias y Lenis recoge el nuevo alto.
relacionadas: [orq-propiedad, cmb-medidas]
fuentes:
  - gsap:int-flip
  - gsap:txt-splittext
  - lenis:com-dimensiones
  - lab:conflictos-lab/l-extra.out
  - lab:conflictos-lab/h-gestos.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Flip y SplitText con Lenis

**Veredicto:** compatibles. Flip, con condición: `ScrollTrigger.refresh()` en `onComplete` (O28).

Alcance: ventana y contenedor, `lerp`, Chrome. SplitText, con cambio real de ancho de ventana.

## Flip

Un bloque pasa de 100 a 1500 px sobre un ScrollTrigger situado debajo. [E]

| `refresh` | `limit` al acabar | `st.start` al acabar |
|---|---|---|
| Ninguno | 8001, solo | 4901: **viejo** |
| Justo tras `Flip.from` | 8001 | 4901: **viejo** |
| En `onComplete` | 8001 | 6301 |

Mientras vuela, Flip mantiene el elemento al tamaño de partida: un `refresh` inmediato mide el pasado. Lenis se corrige solo por su `ResizeObserver`, ScrollTrigger no. Durante el vuelo `limit` sigue en 6601: un `scrollTo` al fondo se queda ahí.

```html
<style>#bloque { height: 100px } #bloque.grande { height: 900px }</style>
<div id="bloque"></div><div id="tras" style="height:100px"></div>
```

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const sincronizar = () => lenis.resize();
ScrollTrigger.addEventListener("refresh", sincronizar);
const st = ScrollTrigger.create({ trigger: "#tras", start: "top top", end: "+=50" });
await espera(60);

const ini = st.start;
const estado = Flip.getState("#bloque");
document.querySelector("#bloque").classList.add("grande");
let alLanzar;
await new Promise((ok) => {
  Flip.from(estado, { duration: 0.1, onComplete: () => { ScrollTrigger.refresh(); ok(); } });
  ScrollTrigger.refresh();
  alLanzar = st.start;
});
const fin = st.start;

ScrollTrigger.removeEventListener("refresh", sincronizar);
gsap.ticker.remove(paso);
lenis.destroy();
st.kill();
// prueba: alLanzar === ini
// prueba: fin === ini + 800
```

El bloque contiene los dos momentos: `alLanzar` es el contraejemplo, y `fin`, la solución. Un `refresh` en vuelo no estropea nada: dentro de un pin, Flip acabó a 400 px con el elemento en su sitio.

## SplitText

`autoSplit` con `onSplit` que devuelve la animación, al pasar la ventana de 1000 a 600 px en plena inercia, en ventana y contenedor: líneas de 12 a 18, una nueva división, 2 instancias de ScrollTrigger antes y después, y `limit` igual al real a los 2 s. Con `lenis.resize()` colgado de `refresh`, a los 300 ms `limit` aún era 7647 frente a 7377: es transitorio y se corrige con el `ResizeObserver` de Lenis.

```html
<h2 id="titulo" style="width:300px">palabra larga de prueba palabra larga de prueba palabra larga de prueba</h2>
```

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const ctx = gsap.context(() => {
  SplitText.create("#titulo", {
    type: "lines",
    autoSplit: true,
    onSplit: (self) => gsap.from(self.lines, { opacity: 0, scrollTrigger: { trigger: "#titulo", scrub: true } }),
  });
});
await document.fonts.ready;
await espera(60);
const instancias = ScrollTrigger.getAll().length;
ctx.revert();
const tras = ScrollTrigger.getAll().length;
gsap.ticker.remove(paso);
lenis.destroy();
// prueba: instancias === 1 && tras === 0
```

## Trampas

- Si la altura cambia por una fuente que carga tarde, nadie avisa a ScrollTrigger salvo `autoSplit` si divide por líneas: ver `gsap:txt-splittext`.
- `Flip` en contextos anidados: ver `gsap:rec-transicion-flip`.
