---
id: cmb-scrub
titulo: scrub con Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis]
resumen: scrub true sigue a Lenis sin retraso. scrub numérico suaviza por segunda vez, 285 ms de cola y 540 px de retraso con scrub 1. Es un efecto, no un arreglo.
relacionadas: [orq-propiedad, cmb-reloj, cmb-velocidad]
fuentes:
  - gsap:scr-scrub
  - lenis:int-gsap
  - lab:conflictos-lab/d-scroll.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# `scrub` con Lenis

**Veredicto:** `scrub: true` es lo compatible y lo que se usa por defecto. Un `scrub` numérico es compatible con condición: suaviza por segunda vez y hay que quererlo (O16).

Alcance: ventana, `lerp` y `duration`, rueda real de 1500. En contenedor se midió `scrub: true`, con el mismo resultado ([`cmb-reloj`](cmb-reloj.md)).

## Ejemplo

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const e = { v: 0 };
gsap.to(e, { v: 1000, ease: "none", scrollTrigger: { start: 0, end: 1000, scrub: true } });
await espera(60);
let peor = 0;
const mirar = () => { peor = Math.max(peor, Math.abs(window.scrollY - e.v)); };
gsap.ticker.add(mirar);
rueda(700);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
gsap.ticker.remove(mirar);
gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
window.scrollTo(0, 0);
// prueba: peor < 1.5
```

## Contraejemplo: `scrub` numérico

La animación persigue a un scroll que ya está suavizado. [E]

| `scrub` | Lenis termina | Animación termina | Cola | Retraso máximo |
|---|---|---|---|---|
| `true` | 1148 ms | 1148 ms | 0 | 0 px |
| `0.3` | 1149 ms | 1199 ms | 50 ms | 294 px |
| `1` | 1146 ms | 1431 ms | 285 ms | 543 px |
| `1`, con `duration: 1.2` | 1065 ms | 1381 ms | 316 ms | 533 px |

Sin Lenis, `scrub: 1` es la única suavidad, y es lo que recomienda la base GSAP: esa recomendación no se traslada. Con Lenis, el retraso de `scrub: 1` es visible frente a un elemento que va con el scroll. Si buscas un arrastre deliberado en un elemento, `scrub` hasta `0.3` da 50 ms de cola.

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const e = { v: 0 };
gsap.to(e, { v: 1000, ease: "none", scrollTrigger: { start: 0, end: 1000, scrub: 1 } });
await espera(560);   // en el arranque el scrub numérico se omite
let peor = 0;
const mirar = () => { peor = Math.max(peor, window.scrollY - e.v); };
gsap.ticker.add(mirar);
rueda(700);
await espera(900);
gsap.ticker.remove(mirar);
gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
window.scrollTo(0, 0);
// prueba: peor > 50
```

## Trampas

- `onUpdate` de ScrollTrigger deja de llamarse al parar el scroll. Con `scrub` numérico la animación sigue: para seguirla, usa el `onUpdate` del tween.
- Con `infinite`, un `scrub` numérico rebobina toda la animación en cada vuelta: ver [`cmb-infinito`](cmb-infinito.md).
- `lagSmoothing` no altera `scrub: true`: 0 fotogramas desincronizados en todos los casos ([`cmb-reloj`](cmb-reloj.md)).
