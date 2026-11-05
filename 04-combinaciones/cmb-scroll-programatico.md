---
id: cmb-scroll-programatico
titulo: Mover el scroll por programa con Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [lenis, gsap+lenis]
resumen: Solo lenis.scrollTo sobrevive a la inercia. ScrollToPlugin, tweenTo, st.scroll y window.scrollTo se pierden en plena animación y solo funcionan en reposo.
relacionadas: [orq-propiedad, cmb-anclas, cmb-modal, cmb-reducido]
fuentes:
  - gsap:scr-scrollto
  - gsap:scr-instancia
  - lenis:api-scrollto
  - lenis:cal-conflictos
  - lab:conflictos-lab/f-prog.out
  - lab:conflictos-lab/z-ff.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Mover el scroll por programa con Lenis

**Veredicto:** `lenis.scrollTo` es el único dueño (O08). Las demás vías están prohibidas en `gsap+lenis`, no porque fallen siempre, sino porque fallan según el momento, y el momento lo decide el usuario.

Alcance: ventana y contenedor, `lerp` y `duration`, rueda real en Chrome; ventana y contenedor con `lerp` en Firefox. Rueda de 2500 y orden de ir a 300 a los 150 ms. [E]

| Orden | En plena inercia | En reposo |
|---|---|---|
| `lenis.scrollTo(300)` | **300** | 300 |
| `lenis.scrollTo(300, { immediate: true })` | **300** | 300 |
| `gsap.to(window, { scrollTo: 300 })` | Se pierde: 2500 | 300 |
| Con `autoKill: true` | Se pierde: 2500 | 300 |
| `st.tweenTo(300, { duration })` | Se pierde: 2500 | 300 |
| `st.scroll(300)` | Se pierde: 2500 | 300 |
| `window.scrollTo` o `caja.scrollTo` | Se pierde: 2500 | 300 |

En un contenedor, `window.scrollTo` no es el scroll de Lenis: no es O08. Lo mismo un `window.scrollTo` justo tras `lenis.destroy()` o antes de crear la instancia, que no compiten con nada.

Igual en los cuatro cruces. Lenis ignora el scroll nativo mientras `isScrolling` es `"smooth"` y lo pisa en el fotograma siguiente. En reposo el siguiente gesto parte de la posición correcta: 300 más una rueda de 100 dio 400.

## Ejemplo

Destinos de GSAP, movimiento de Lenis: `labelToScroll`, `st.start` y `st.end` dan píxeles, y Lenis los recorre.

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const tl = gsap.timeline({ scrollTrigger: { start: 0, end: 1000, scrub: true } });
tl.to({}, { duration: 1 }).addLabel("mitad").to({}, { duration: 1 });
await espera(40);

rueda(2400);
await espera(120);
lenis.scrollTo(tl.scrollTrigger.labelToScroll("mitad"), { duration: 0.2 });
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);

const y = Math.round(window.scrollY);
gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
window.scrollTo(0, 0);
// prueba: y === 500
```

## Contraejemplo

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
await espera(40);

rueda(1500);
await espera(100);
gsap.to(window, { scrollTo: 300, duration: 0.2 });
await espera(1500);
for (let i = 0; lenis.isScrolling === "smooth" && i < 200; i++) await espera(20);

const y = Math.round(window.scrollY);
gsap.ticker.remove(paso);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: y === 1500
```

## Si quieres la curva de GSAP

`lenis.scrollTo(destino, { duration, easing })` admite cualquier función, y `gsap.parseEase("power3.inOut")` devuelve una.

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
await espera(40);
lenis.scrollTo(800, { duration: 0.3, easing: gsap.parseEase("power3.inOut") });
await espera(600);
const y = window.scrollY;
gsap.ticker.remove(paso);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: y === 800
```

**La solución que parece buena y falla:** `lenis.stop()`, tween de `ScrollToPlugin` y `lenis.start()` en `onComplete`. En ventana funciona. En contenedor, `stop()` anula el scroll: acabó en 1582 con `lenis.scroll` en 0 ([`cmb-modal`](cmb-modal.md)).

## Trampas

- `lenis.scrollTo` se ignora en silencio con la instancia parada, salvo `force: true`.
- Una rueda en mitad de `lenis.scrollTo` se suma al destino; en mitad de un tween de `ScrollToPlugin`, el tween se pierde y el resultado no es predecible (1751-1783).
- Si algo ajeno escribe el scroll y no puedes cambiarlo, como un enrutador: `lenis:int-navegacion`.
- `ScrollToPlugin` no consulta `prefers-reduced-motion`: ver [`cmb-reducido`](cmb-reducido.md).
