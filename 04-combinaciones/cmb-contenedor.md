---
id: cmb-contenedor
titulo: ScrollTrigger con Lenis en un contenedor
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis]
resumen: Sin scroller, ScrollTrigger mira la ventana y no avanza. Con scroller o defaults funciona sin scrollerProxy. ScrollSmoother no vale para contenedores.
relacionadas: [orq-propiedad, cmb-pin, cmb-modal, cmb-horizontal, cmb-smoother]
fuentes:
  - gsap:scr-scrollerproxy
  - gsap:scr-scrolltrigger
  - lenis:opc-contenedores
  - lenis:int-gsap
  - lab:conflictos-lab/d-scroll.out
  - lab:conflictos-lab/e-pin.out
  - lab:conflictos-lab/n-extra.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# ScrollTrigger con Lenis en un contenedor

**Veredicto:** compatible con condición: `scroller` en cada instancia que siga al contenedor, o en `ScrollTrigger.defaults`, antes de crearlas (O12). `scrollerProxy` no hace falta: el scroll es nativo (O30). La base Lenis lo daba por razonado; aquí se ejecutó.

O12 es un aviso: un disparador que deba seguir a la ventana, con Lenis en un cajón, es correcto sin `scroller`, y el análisis estático no distingue uno de otro.

Alcance: contenedor con `overflow` en hoja, rueda real, `lerp` y `duration`.

| Montaje | `y` | Progreso | Valor |
|---|---|---|---|
| Sin `scroller` | 2100 | **0** | 0 |
| `scroller: caja` | 2100 | 0,5 | 500 |
| `ScrollTrigger.defaults({ scroller: caja })` | 2100 | 0,5 | 500 |

Sin `scroller`, las medidas salen bien, 1600 y 2600, y por eso no se detecta al leer las medidas: lo que falta es escuchar el contenedor. [P]

## Ejemplo

```html
<style>.marco { height: 300px; overflow: auto }</style>
<div class="marco"><div class="hueco" style="height:600px"></div><div class="dentro" style="height:200px"></div><div style="height:2000px"></div></div>
```

```js
const marco = document.querySelector(".marco");
const lenis = new Lenis({ wrapper: marco, content: marco });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const e = { v: 0 };
const st = gsap.to(e, { v: 100, ease: "none", scrollTrigger: { scroller: marco, trigger: ".dentro", start: "top top", end: "+=400", scrub: true } }).scrollTrigger;
await espera(40);
rueda(800, marco);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
const r = [marco.scrollTop, Math.round(e.v)];
gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
// prueba: r.join() === "800,50"
```

## Con la plantilla

Con `raiz` en un contenedor, la plantilla pone ese `scroller` por defecto mientras dure, sin avisar. Un disparador de la página, fuera del contenedor, queda capturado por él: **lleva `scroller: window`**. Chrome real, cajón con `raiz`, `ScrollTrigger.create` con `trigger` en la página y rueda de 1000 sobre la ventana: sin `scroller`, `scroller` es el cajón y `toggleClass` no llega a activarse; con `scroller: window`, se activa. [E, laboratorio]

```js fragmento
const mov = iniciarMovimiento({ perfil: "gsap+lenis", gsap, ScrollTrigger, Lenis, raiz: "#panel", content: "#panel-interior" });
mov.añadir(() => {
  gsap.to(".dentro", { x: 100, scrollTrigger: { trigger: ".dentro", scrub: true } });                 // sigue al cajón
  ScrollTrigger.create({ scroller: window, trigger: "#marca", start: "top center", toggleClass: "on" }); // sigue a la página
});
```

## Contraejemplo

```js
const marco = document.querySelector(".marco");
const lenis = new Lenis({ wrapper: marco, content: marco });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const e = { v: 0 };
gsap.to(e, { v: 100, ease: "none", scrollTrigger: { start: 0, end: 400, scrub: true } });
await espera(40);
rueda(800, marco);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
const r = [marco.scrollTop, Math.round(e.v)];
gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
// prueba: r.join() === "800,0"
```

## `scrollerProxy` heredado

Un proxy que llama a `lenis.scrollTo` no rompió nada en ventana: mismo pin, misma posición. Es código de bibliotecas que simulan el scroll, y aquí solo añade una vía que mantener. Se borra.

## Lo que cambia en un contenedor

| Tema | Diferencia | Ficha |
|---|---|---|
| Pin | `transform`, y sin `update` deriva 110 px en cada fotograma | [`cmb-pin`](cmb-pin.md) |
| Bloqueo | `stop()` lleva `scrollTop` a 0 | [`cmb-modal`](cmb-modal.md) |
| `refresh()` en plena inercia | Sin efecto, igual que en ventana | [`cmb-medidas`](cmb-medidas.md) |
| `normalizeScroll` | Sin `allowNestedScroll`, el toque no entra | [`cmb-normalize`](cmb-normalize.md) |
| ScrollSmoother | No es de contenedor: acepta el elemento, lo pone en `position: fixed` y da a `body` 8000 px | [`cmb-smoother`](cmb-smoother.md) |

## Trampas

- `Observer` debe apuntar al contenedor, no a `window`, salvo que quieras toda la ventana.
- `anchors` solo escucha dentro de `wrapper`.
- `Snap.addElement` en contenedores mide mal: usa posiciones. Ver `lenis:snp-elementos`.
