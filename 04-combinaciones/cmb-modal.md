---
id: cmb-modal
titulo: Modal y bloqueo con ScrollTrigger y Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [lenis, gsap+lenis]
resumen: lenis.stop() bloquea y ScrollTrigger sigue bien en ventana. En contenedor con overflow en hoja lleva scrollTop a 0, y scrub y pin saltan. Observer no se entera.
relacionadas: [orq-propiedad, cmb-contenedor, cmb-observer, cmb-normalize]
fuentes:
  - lenis:com-stop-start
  - lenis:rec-modal
  - gsap:scr-smoother-api
  - lab:conflictos-lab/h-gestos.out
  - lab:conflictos-lab/l-extra.out
  - lab:conflictos-lab/o-barra.out
  - lab:conflictos-lab/z-ff.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Modal y bloqueo

**Veredicto:** `lenis.stop()` es el dueño. Compatible en ventana. En contenedor, compatible con condición: el contenedor debe seguir siendo contenedor de scroll (O13). Además, lo demás que escuche gestos no se detiene solo (O15, O07).

Alcance: ventana y contenedor con `overflow` en hoja, con `lenis.css`, `lerp`, rueda y `AvPág` reales, Chrome y Firefox. Con scrub, pin en 3500 y progreso 0,3. [E]

| Paso | Ventana | Contenedor, hoja | Contenedor, con la regla |
|---|---|---|---|
| `stop()` | `y` 3500, `scrub` 3000 | **`y` 0, `scrub` 0, pin fuera de sitio** | 3500, 3000 |
| Rueda y `AvPág` | No mueven | No mueven | No mueven |
| `ScrollTrigger.refresh()` parado | Bien | Mide con 0: progreso 0 | Bien |
| `start()` | Coherente | `y` 3500, `lenis.scroll` 0 | Coherente |
| Rueda de 100 | 3600 | **Salta a 100** | 3600 |

La causa es `overflow: clip` de `lenis.css`, que quita al contenedor el scroll, y ScrollTrigger lee ese 0 con todo lo que depende de él. Ver `lenis:com-stop-start`.

## Ejemplo

```html
<style>
.caja { height: 300px; overflow: auto }
.caja.lenis-stopped:not(.lenis-autoToggle) { overflow: hidden !important }
</style>
<div class="caja"><div style="height:3000px"></div></div>
```

```js
const caja = document.querySelector(".caja");
const lenis = new Lenis({ wrapper: caja, content: caja });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const e = { v: 0 };
gsap.to(e, { v: 1000, ease: "none", scrollTrigger: { scroller: caja, start: 0, end: 1000, scrub: true } });
lenis.scrollTo(500, { immediate: true });
await espera(100);

lenis.stop();
await espera(100);
const parado = [caja.scrollTop, Math.round(e.v)];
lenis.start();
await espera(60);
rueda(100, caja);
await espera(900);
const fin = [Math.round(caja.scrollTop), Math.round(lenis.scroll)];

gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
// prueba: parado.join() === "500,500"
// prueba: fin.join() === "600,600"
```

`overflow: hidden` en línea sobre el contenedor, antes de `stop()`, da lo mismo y es lo que hacen las plantillas.

## La especificidad lo cambia (O13)

`.lenis:not(.lenis-autoToggle).lenis-stopped` vale tres clases. Un `overflow` declarado con menos, `.caja { overflow: auto }`, pierde, y `clip` lleva `scrollTop` a 0. Declarado con un selector de id, gana: el contenedor sigue siendo de scroll y `scrollTop` se conserva, sin la regla. Depende de cómo se escribió el selector, así que no te apoyes en ello: un cambio de `#panel` a `.panel` rompe el bloqueo sin tocar JavaScript.

```html
<style>#panel-id { height: 300px; overflow: auto }</style>
<div id="panel-id"><div style="height:3000px"></div></div>
```

```js
const panel = document.querySelector("#panel-id");
const lenis = new Lenis({ wrapper: panel, content: panel, autoRaf: true });
lenis.scrollTo(500, { immediate: true });
await espera(60);
lenis.stop();
await espera(60);
const parado = [panel.scrollTop, getComputedStyle(panel).overflowY];
lenis.start();
lenis.destroy();
// prueba: parado.join() === "500,auto"
```

El auditor no ve la especificidad: con `lenis.stop()` en un contenedor y sin la regla, O13 salta igual, con una nota que pide comprobarlo en el navegador. Es un falso positivo inevitable en análisis estático, y la corrección sigue siendo buena: añade la regla.

## Contraejemplo

Misma caja, sin la regla:

```html
<style>.caja2 { height: 300px; overflow: auto }</style>
<div class="caja2"><div style="height:3000px"></div></div>
```

```js
const caja = document.querySelector(".caja2");
const lenis = new Lenis({ wrapper: caja, content: caja });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const e = { v: 0 };
gsap.to(e, { v: 1000, ease: "none", scrollTrigger: { scroller: caja, start: 0, end: 1000, scrub: true } });
lenis.scrollTo(500, { immediate: true });
await espera(100);

lenis.stop();
await espera(100);
const parado = [caja.scrollTop, Math.round(e.v)];
lenis.start();
await espera(60);
const trasStart = [caja.scrollTop, lenis.scroll];

gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
// prueba: parado.join() === "0,0"
// prueba: trasStart[0] === 500 && trasStart[1] === 0
```

## Quién no se detiene con `stop()`

| Pieza | Durante `stop()` | Haz esto |
|---|---|---|
| Observer | Sigue recibiendo gestos (O15) | `observer.disable()` al abrir, `enable()` al cerrar: con `disable` no llegó ninguno |
| `normalizeScroll` | **Mueve la página**: 600 con rueda, 554 con toque | Prohibido con Lenis, O07 |
| `ScrollToPlugin` | Mueve el fondo: 900 | Prohibido, O08 |
| `autoToggle` con `overflow` en `html` | Se detiene, y `refresh()` sigue bien | Válido en ventana |
| `overflow: hidden` en `body` | No bloquea | Ver `lenis:cal-conflictos` |

## La barra desaparece (O27)

En ventana, `clip` quita la barra clásica. En Chrome en Windows, el contenido pasó de 985 a 1000 px con el modal abierto, y un pin conservó 985 en línea. `html { scrollbar-gutter: stable }` lo evita: 985 antes y después, sin liberar el teclado. Forzar `overflow-y: scroll` conserva el ancho pero **libera `AvPág`**: 3500 pasó a 4112. Firefox headless usa barras superpuestas: no se aplica.

```html
<style>html { scrollbar-gutter: stable }</style>
```

```js
const lenis = new Lenis({ autoRaf: true });
const antes = document.body.getBoundingClientRect().width;
lenis.stop();
await espera(60);
const durante = document.body.getBoundingClientRect().width;
lenis.start();
lenis.destroy();
// prueba: antes === durante
```

## Trampas

- `lenis.scrollTo` necesita `force: true` con la instancia parada.
- Un `refresh()` parado es seguro solo si el contenedor conserva el scroll.
- El contenido del modal con scroll propio: `data-lenis-prevent`, ver `lenis:rec-modal`.
