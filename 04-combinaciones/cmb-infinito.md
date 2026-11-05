---
id: cmb-infinito
titulo: Lenis infinite con ScrollTrigger
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis]
resumen: infinite salta de limit a 0: scrub true salta con él y un scrub numérico rebobina toda la animación. getVelocity da picos de 64000 px/s: aquí manda lenis.velocity.
relacionadas: [orq-propiedad, cmb-scrub, cmb-velocidad, cmb-pin]
fuentes:
  - lenis:com-infinito
  - gsap:scr-scrub
  - lab:conflictos-lab/g-medida.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Lenis `infinite` con ScrollTrigger

**Veredicto:** compatible con condición: efectos periódicos y `scrub: true`. Prohibido `scrub` numérico sobre el recorrido que da la vuelta (O21).

Alcance: ventana, `lerp`, rueda real, Chrome. Toque con `syncTouch` y contenedor, sin ejecutar. [P]

| Al pasar de `limit` a 0 | Medido |
|---|---|
| `scrub: true` | Salta de 996 a 2 en un fotograma: correcto si el principio y el final son iguales |
| `scrub: 1` | **Rebobina durante 33 fotogramas**, de 857 hacia atrás, a la vista |
| `self.getVelocity()` | **−64100 px/s**, con Lenis a 21 px por paso |
| `lenis.velocity` | Sin pico: máximo 358 |
| `onLeave`, `onEnterBack` | No se disparan: 0 |
| `pin` a mitad de recorrido | Deriva menor de 1 px, en cada vuelta |

ScrollTrigger ve un salto hacia atrás de toda la página, porque el scroll real lo es. Por eso aquí la velocidad la da Lenis, y `getVelocity()` queda fuera.

## Ejemplo

```js
const lenis = new Lenis({ infinite: true });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const e = { v: 0 };
gsap.to(e, { v: 100, ease: "none", scrollTrigger: { start: 0, end: () => lenis.limit, scrub: true } });
await espera(60);
const limite = lenis.limit;
rueda(limite + 300);
for (let i = 0; lenis.isScrolling !== false && i < 300; i++) await espera(20);
const r = [Math.round(window.scrollY), Math.round(e.v)];
gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
window.scrollTo(0, 0);
// prueba: Math.abs(r[0] - 300) < 3
// prueba: Math.abs(r[1] - 300 / limite * 100) < 1
```

## Contraejemplo

```js
const lenis = new Lenis({ infinite: true });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const e = { v: 0 };
gsap.to(e, { v: 100, ease: "none", scrollTrigger: { start: 0, end: () => lenis.limit, scrub: 1 } });
await espera(560);
const limite = lenis.limit;
lenis.scrollTo(limite - 40, { immediate: true });
await espera(1300);
const antes = e.v;
rueda(100);
const valores = [];
for (let i = 0; i < 30; i++) { await espera(20); valores.push(e.v); }
const intermedios = valores.filter((v) => v > 5 && v < antes - 2).length;
gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
window.scrollTo(0, 0);
// prueba: intermedios > 3
```

## Trampas

- `end: "max"` dio el recorrido correcto, y `() => lenis.limit` lo deja explícito. `lenis.limit` incluye la copia final.
- Un pin añade alto: `ScrollTrigger.refresh()` y `lenis.resize()` antes de empezar.
- Teclado y barra no dan la vuelta: `lenis:com-infinito`.
