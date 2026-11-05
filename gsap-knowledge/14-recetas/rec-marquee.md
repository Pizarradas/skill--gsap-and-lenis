---
id: rec-marquee
titulo: Marquesina infinita sin saltos
capa: 14-recetas
tipo: patron
ambito: core
resumen: Cinta de logos o texto en bucle continuo, con clones accesibles, pausa, remedición al redimensionar y versión estática reducida.
api: [gsap.fromTo, gsap.delayedCall, gsap.matchMedia, Animation.timeScale, Animation.progress, gsap.TweenVars.repeat]
requiere: [nuc-repeat-yoyo]
relacionadas: [rec-helpers, nuc-delayedcall, nuc-tiempo, cal-accesibilidad, utl-funciones]
etiquetas: [bucle, carrusel, ticker, plantilla]
fuentes:
  - docs/v3/HelperFunctions/helpers/seamlessLoop.md
  - docs/v3/GSAP/Tween.md
  - resources/a11y.md
estado: verificado
version: 3.15.1
---
# Marquesina infinita sin saltos

Cinta que se desplaza en bucle continuo, sin hueco ni salto al reiniciar. Plantilla: `plantillas/marquee.js`. El código es original; si necesitas ir a un índice, arrastrar o centrar, el catálogo oficial trae `seamlessLoop` (ver [rec-helpers](rec-helpers.md)). [E]

## Problema

Un tween que mueve la lista hasta su final deja la cinta vacía antes de reiniciar, y `repeat: -1` salta al volver al inicio si el contenido visible al acabar no coincide con el del principio.

## Solución

Clonar la serie hasta cubrir el contenedor más una serie, y mover la pista exactamente **una serie**: al reiniciar, lo que se ve coincide píxel a píxel. El ancho se mide como la distancia entre el primer original y su primer clon, lo que incluye el `gap`. La velocidad se fija en px/s, y la duración es el ancho entre la velocidad. [E]

```html
<div class="cinta" style="width:600px;overflow:hidden">
  <div class="rail" style="display:flex;gap:20px;width:max-content">
    <div style="width:130px">alfa</div>
    <div style="width:130px">beta</div>
  </div>
</div>
```

```js
const rail = document.querySelector(".rail");
const originales = [...rail.children];

const clonar = () => originales.map((el) => {
  const copia = el.cloneNode(true);
  copia.setAttribute("aria-hidden", "true");
  copia.inert = true;
  return rail.appendChild(copia);
});

const [primerClon] = clonar();
const serie = primerClon.offsetLeft - originales[0].offsetLeft;
const series = Math.ceil(600 / serie) + 1;
for (let i = 1; i + 1 < series; i++) clonar();

const tween = gsap.fromTo(rail, { x: 0 }, { x: -serie, duration: serie / 2000, ease: "none", repeat: -1 });
await new Promise((r) => setTimeout(r, 120));
const x = gsap.getProperty(rail, "x");
// prueba: serie === 300
// prueba: rail.children.length * 150 >= 600 + 300
// prueba: x <= 0 && x >= -300 && tween.isActive()
```

Pausa suave: un tween sobre el `timeScale` del tween. [E]

```js
const giro = gsap.to(".banda", { x: -100, duration: 1, ease: "none", repeat: -1 });
gsap.to(giro, { timeScale: 0, duration: 0.1 });
await new Promise((r) => setTimeout(r, 160));
// prueba: giro.timeScale() === 0
```

## Parámetros ajustables

| Opción | Por defecto | Efecto |
|---|---|---|
| `velocidad` | `80` | Píxeles por segundo, independiente del ancho del contenido |
| `direccion` | `"izquierda"` | `"derecha"` invierte origen y destino |
| `pausar` | `true` | Frena con `pointerenter` y `focusin`, y sigue al salir |

## Variante con prefers-reduced-motion

Sin clones ni animación: el contenedor pasa a `overflow-x: auto` y el usuario recorre la lista por sí mismo. Una marquesina no aporta contenido que justifique el movimiento. [P] [E]

```js
window.matchMedia = (q) => ({ matches: /: reduce\)/.test(q), addListener() {}, removeListener() {} });
const mm = gsap.matchMedia();
mm.add({ normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" }, (c) => {
  if (c.conditions.reducido) gsap.set(".marco", { overflowX: "auto" });
  else gsap.to(".marco", { x: -100, repeat: -1 });
});
// prueba: gsap.getTweensOf(".marco").length === 0 && document.querySelector(".marco").style.overflowX === "auto"
```

## Limpieza

`limpiar()` retira clones y listeners, desconecta el `ResizeObserver` y devuelve el `style` de contenedor y pista. [E]

```js fragmento
const limpiar = marquee(raiz.querySelector(".logos"), { velocidad: 60, direccion: "derecha" });
limpiar();
```

## Trampas

- **Clones visibles para lectores y teclado.** Sin `aria-hidden` y `inert`, el contenido se anuncia varias veces y los enlaces clonados reciben foco. [P]
- **Medir antes de que carguen las imágenes.** El ancho sale corto y aparece un hueco. La plantilla observa originales y contenedor con `ResizeObserver` y reconstruye con 150 ms de retardo, conservando progreso y `timeScale`. Da a las imágenes `width` y `height` igualmente. [P] [E]
- **Serie más corta que el contenedor.** Con una sola copia queda hueco en pantallas anchas: el número de clones depende de `clientWidth`, y debe recalcularse al crecer. [E]
- **Movimiento continuo sin control.** WCAG 2.2.2 exige poder pausar lo que se mueve más de 5 s; la pausa con puntero y foco ayuda, pero un botón visible es lo correcto en contenido relevante. [P]
- **`ResizeObserver` en iframes fuera de pantalla.** Sus callbacks dependen del pintado. La prueba lo sustituye por un doble y lo invoca a mano, así que el disparo real del observador no está ejercitado. [E]
