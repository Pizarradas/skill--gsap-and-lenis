---
id: cmb-css
titulo: CSS con GSAP y Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [ninguno, gsap, lenis, gsap+lenis]
resumen: scroll-behavior smooth no estorba a la combinación. overflow-x hidden en html y body rompe sticky; usa clip. html y body con overflow hidden no bloquean si hay Lenis.
relacionadas: [orq-propiedad, cmb-snap, cmb-modal, cmb-pin]
fuentes:
  - gsap:scr-scrolltrigger
  - gsap:scr-scrollto
  - lenis:cal-conflictos
  - lenis:fun-css
  - lab:conflictos-lab/j-css.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# CSS con GSAP y Lenis

Alcance: ventana, rueda real, Chrome, con `lenis.css`. [E]

| CSS | `gsap+lenis` | Sin Lenis | Veredicto |
|---|---|---|---|
| `scroll-behavior: smooth` en `html` | Rueda, `lenis.scrollTo` y `refresh` en inercia, bien | | Compatible |
| El mismo, con `ScrollToPlugin` en reposo | Llega, 67 pasos en un tween de 0,5 s | Igual | Compatible, retrasado. Se usa `lenis.scrollTo` |
| `snap` de ScrollTrigger con él | Escribe `auto` en línea y no lo restaura | Igual | Cuidado si otro código cuenta con `smooth` |
| `overflow-x: hidden` en `html` o en `body` | Pin, `scrub` y `sticky` bien | Igual | Compatible |
| `overflow-x: hidden` en `html, body` | Pin y `scrub` bien, **`sticky` roto** | Igual | Usa `clip` (O26) |
| `overflow-x: clip` en `html, body` | Todo bien | Igual | Recomendado |
| `html, body { height: 100%; overflow: hidden }` | **Se mueve: 2000**, `lenis.css` deshace el alto y Lenis escribe | No se mueve | No bloquea: `lenis.stop()` |
| `html { overflow: hidden } body { overflow: auto; height: 100% }` | La ventana se mueve: 2000 | El que desplaza es `body`: 2000 | Con Lenis cambia el desplazador |
| `height: 100%` en `html, body` | Fondo alcanzado | | Compatible |
| `scroll-snap-type` | Ver [`cmb-snap`](cmb-snap.md) | | `mandatory` prohibido |

La base GSAP pide quitar `scroll-behavior: smooth` en páginas con ScrollTrigger. En `gsap+lenis` no hace falta: Lenis escribe con `behavior: "instant"` y ScrollTrigger lo neutraliza al medir.

## Ejemplo

```html
<style>html, body { overflow-x: clip }</style>
<div style="height:800px"><div id="pega" style="position:sticky;top:0;height:50px"></div></div><div style="height:2000px"></div>
```

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
await espera(30);
lenis.scrollTo(300, { immediate: true });
await espera(60);
const arriba = Math.round(document.querySelector("#pega").getBoundingClientRect().top);
gsap.ticker.remove(paso);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: arriba === 0
```

## Contraejemplo

```html
<style>html, body { overflow-x: hidden }</style>
<div style="height:800px"><div id="pega2" style="position:sticky;top:0;height:50px"></div></div><div style="height:2000px"></div>
```

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
await espera(30);
lenis.scrollTo(300, { immediate: true });
await espera(60);
const arriba = Math.round(document.querySelector("#pega2").getBoundingClientRect().top);
gsap.ticker.remove(paso);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: arriba < -100
```

## Trampas

- `body` que desplaza en lugar de la ventana: el perfil `gsap` lee 0 en `scrollY`; revisa antes de añadir Lenis.
- La bandera `html.lenis { height: auto }` solo actúa con la clase puesta: una hoja cargada sin instancia no cambia nada.
