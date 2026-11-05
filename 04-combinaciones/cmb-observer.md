---
id: cmb-observer
titulo: Observer y secciones por gestos con Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis]
resumen: preventDefault de Observer no detiene a Lenis, que ignora defaultPrevented. Para paginar con gestos, lenis.stop() y lenis.scrollTo con force; en contenedor, además, la regla de overflow.
relacionadas: [orq-propiedad, cmb-modal, cmb-contenedor, cmb-scroll-programatico]
fuentes:
  - gsap:scr-observer
  - gsap:scr-observer-api
  - lenis:com-stop-start
  - lab:conflictos-lab/h-gestos.out
  - lab:conflictos-lab/z-ff.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Observer con Lenis

**Veredicto:** compatible con condición. Observer solo lee sin problema. Para sustituir el scroll hay que parar Lenis: `preventDefault: true` no basta (O14).

Alcance: ventana y contenedor, rueda real, Chrome y Firefox; toque real en Chrome. [E]

| Montaje, rueda de 600 | Scroll | Observer |
|---|---|---|
| Sin Lenis, `preventDefault: true` | 0 | 1 llamada |
| Lenis activo, `preventDefault: true` | **600** | 1 llamada |
| Lenis activo, `preventDefault: false` | 600 | 1 llamada |
| `lenis.stop()` | 0 | 1 llamada |
| Elemento con `data-lenis-prevent` y Observer en él | 0 | 1 llamada |
| El mismo elemento, sin el atributo | **500**, la página se mueve | 1 llamada |

Lenis no consulta `defaultPrevented`. Con `lenis.stop()`, Observer sigue recibiendo gestos: rueda y toque, 12 `onUp` en un deslizamiento. `type: "scroll"` también funciona: 54 llamadas en una rueda de 800.

## Ejemplo: secciones

```html
<style>
.pase { height: 300px; overflow: auto }
.pase.lenis-stopped:not(.lenis-autoToggle) { overflow: hidden !important }
</style>
<div class="pase"><div style="height:3000px"></div></div>
```

```js
const caja = document.querySelector(".pase");
const lenis = new Lenis({ wrapper: caja, content: caja, duration: 0.2 });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
lenis.stop();

let i = 0, ocupado = false;
const ir = (d) => {
  if (ocupado) return;
  i = Math.max(0, i + d);
  ocupado = true;
  lenis.scrollTo(i * 300, { force: true, onComplete: () => { ocupado = false; } });
};
const obs = Observer.create({ target: caja, type: "wheel,touch", preventDefault: true, tolerance: 10, onDown: () => ir(1), onUp: () => ir(-1) });

await espera(40);
rueda(120, caja);
await espera(500);
rueda(120, caja);
await espera(500);
const y = Math.round(caja.scrollTop);

obs.kill();
gsap.ticker.remove(paso);
lenis.destroy();
// prueba: y === 600
```

Secciones de 800 px, rueda real: 800, 1600 y vuelta a 800, en ventana y en contenedor con la regla.

## Contraejemplo

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
let llamadas = 0;
const obs = Observer.create({ target: window, type: "wheel", preventDefault: true, onChange: () => llamadas++ });
await espera(40);
rueda(400);
await espera(60);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
const y = Math.round(window.scrollY);
obs.kill();
gsap.ticker.remove(paso);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: llamadas >= 1
// prueba: y === 400
```

En contenedor sin la regla, `force` no mueve nada: `y` 0 en las tres pasadas, con el índice avanzando. Ver [`cmb-modal`](cmb-modal.md).

## Trampas

- `overflow: hidden` en la página, que propone la base GSAP para paginar, no detiene a Lenis si va en `body`. Usa `lenis.stop()`.
- La navegación por teclado sigue siendo tuya: con `stop()` no hay scroll nativo. Añade flechas y controles.
- Con un modal, `observer.disable()`: ver [`cmb-modal`](cmb-modal.md).
