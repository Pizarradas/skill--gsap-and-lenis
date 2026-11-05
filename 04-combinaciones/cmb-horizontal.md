---
id: cmb-horizontal
titulo: Scroll horizontal con GSAP y Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis]
resumen: Hay dos horizontales. Pista con pin y containerAnimation sobre Lenis vertical funciona igual. Lenis con orientation horizontal exige horizontal true en ScrollTrigger.
relacionadas: [orq-propiedad, cmb-pin, cmb-contenedor]
fuentes:
  - gsap:scr-horizontal
  - gsap:rec-pin-horizontal
  - lenis:com-horizontal
  - lenis:rec-horizontal
  - lab:conflictos-lab/g-medida.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Scroll horizontal con GSAP y Lenis

**Veredicto:** los dos son compatibles. Con `orientation: "horizontal"`, a condición de `horizontal: true` en ScrollTrigger (O17).

Alcance: ventana y contenedor con `overflow` en hoja, rueda vertical real, `lerp`. Chrome.

| Forma | Quién mueve | Resultado |
|---|---|---|
| Pista: `pin` y `x` con `scrub`, Lenis vertical | ScrollTrigger traduce vertical en `x` | Ventana y contenedor: progreso 0,5, `x` −1500, `containerAnimation` disparó |
| `orientation: "horizontal"` con `horizontal: true` | Lenis escribe `scrollLeft` | Ventana y contenedor: progreso 0,5 |
| `orientation: "horizontal"` sin `horizontal: true` | | **Progreso 0**, inicio 0: mide y lee el eje vertical |
| `ScrollTrigger.defaults({ horizontal: true })` | | Igual que `horizontal: true` |
| `pin` horizontal con `update` | | Deriva 0 |
| `pin` horizontal sin `update` | | 13 px en ventana, **110 px** en contenedor |

Elige pista si la página es vertical con un tramo lateral: no toca la orientación de Lenis. Elige `orientation` si toda la página o el contenedor es lateral.

## Ejemplo

```html
<style>
.fila { width: 600px; height: 200px; overflow: auto }
.tira { display: flex; width: 4000px; height: 100% }
.tira > div { width: 800px; flex: none }
</style>
<div class="fila"><div class="tira"><div></div><div id="uno"></div><div></div><div></div><div></div></div></div>
```

```js
const fila = document.querySelector(".fila");
const lenis = new Lenis({ wrapper: fila, content: fila, orientation: "horizontal" });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const e = { v: 0 };
gsap.to(e, { v: 100, ease: "none", scrollTrigger: { scroller: fila, horizontal: true, trigger: "#uno", start: "left left", end: "+=800", scrub: true } });
await espera(40);
rueda(1200, fila);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
const r = [Math.round(fila.scrollLeft), Math.round(e.v)];
gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
// prueba: r.join() === "1200,50"
```

## Contraejemplo

```js
const fila = document.querySelector(".fila");
const lenis = new Lenis({ wrapper: fila, content: fila, orientation: "horizontal" });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const e = { v: 0 };
gsap.to(e, { v: 100, ease: "none", scrollTrigger: { scroller: fila, start: 0, end: 800, scrub: true } });
await espera(40);
rueda(1200, fila);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
const r = [Math.round(fila.scrollLeft), Math.round(e.v)];
gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
// prueba: r.join() === "1200,0"
```

## Trampas

- `containerAnimation` necesita `ease: "none"`, y `pin` y `snap` van en la instancia que mueve la pista, no en las de dentro: base GSAP, sin cambio con Lenis.
- `Snap.addElement` con `align: "start"` en horizontal usa `rect.top`: ver `lenis:snp-elementos`.
- ScrollSmoother no tiene horizontal: solo vertical en ventana.
