---
id: rec-seguidor-cursor
titulo: Seguidor de cursor con quickTo
capa: 14-recetas
tipo: patron
ambito: core
resumen: Elemento decorativo que sigue al puntero con retardo, sin crear un tween por evento y sin viajar desde la esquina al aparecer.
api: [gsap.quickTo, gsap.matchMedia, Tween.resetTo]
requiere: [nuc-quickto]
relacionadas: [nuc-quicksetter, rec-boton-magnetico, cal-rendimiento, cal-accesibilidad]
etiquetas: [puntero, interaccion, rendimiento, plantilla]
fuentes:
  - docs/v3/GSAP/gsap.quickTo().md
  - docs/v3/GSAP/gsap.matchMedia().md
estado: verificado
version: 3.15.1
---
# Seguidor de cursor con quickTo

Un punto o halo que persigue al puntero con un ligero retraso. Plantilla: `plantillas/seguidorCursor.js`. [E]

## Problema

`pointermove` llega decenas de veces por segundo: un `gsap.to` por evento crea tweens que compiten. Al aparecer, el elemento está en 0,0 y cruza la pantalla hasta el puntero. En dispositivos táctiles no hay nada que seguir.

## Solución

Dos funciones `quickTo`, creadas una vez. El primer movimiento coloca el seguidor sin viaje, gracias al segundo argumento de la función, el valor inicial, y después lo muestra. [C] [E]

```html
<div class="halo" style="position:fixed;left:0;top:0;width:16px;height:16px"></div>
```

```js
const halo = document.querySelector(".halo");
gsap.set(halo, { xPercent: -50, yPercent: -50, autoAlpha: 0 });

const moverX = gsap.quickTo(halo, "x", { duration: 0.12, ease: "power3" });
const moverY = gsap.quickTo(halo, "y", { duration: 0.12, ease: "power3" });
let visible = false;

window.addEventListener("pointermove", (e) => {
  if (!visible) {
    visible = true;
    moverX(e.clientX, e.clientX);
    moverY(e.clientY, e.clientY);
    gsap.to(halo, { autoAlpha: 1, duration: 0.1 });
    return;
  }
  moverX(e.clientX);
  moverY(e.clientY);
});

const mover = (x, y) => window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y }));
mover(400, 300);
const sinViaje = gsap.getProperty(halo, "x");
mover(200, 100);
await new Promise((r) => setTimeout(r, 200));
const destino = gsap.getProperty(halo, "x");
// prueba: sinViaje === 400
// prueba: destino === 200 && gsap.getProperty(halo, "y") === 100
```

## Parámetros ajustables

| Opción | Por defecto | Efecto |
|---|---|---|
| `duracion` | `0.4` | Retardo: 0.15 es pegado; 0.6, perezoso |
| `ease` | `"power3"` | Curva de cada redirección |
| `zona` | `window` | Limita el seguimiento a un contenedor |

## Variante con prefers-reduced-motion

El seguidor es decoración: con `reduce` o sin `hover` queda oculto y no se escucha el puntero. La condición combina ambas consultas en la misma cadena. [P] [E]

```js
window.matchMedia = (q) => ({ matches: /: reduce\)/.test(q), addListener() {}, removeListener() {} });
const mm = gsap.matchMedia();
let activo = false;
mm.add({
  activo: "(prefers-reduced-motion: no-preference) and (hover: hover)",
  inactivo: "(prefers-reduced-motion: reduce), (hover: none)",
}, (c) => {
  gsap.set(".estela", { autoAlpha: 0 });
  activo = c.conditions.activo;
});
// prueba: activo === false && document.querySelector(".estela").style.visibility === "hidden"
```

## Limpieza

`limpiar()` quita el listener y revierte los estilos, incluidos `position`, `pointerEvents` y transforms que puso la plantilla. Después, mover el puntero ya no afecta al elemento. [E]

```js fragmento
const limpiar = seguidorCursor(raiz.querySelector(".punto"), { duracion: 0.25 });
limpiar();
```

## Trampas

- **Crear `quickTo` dentro del manejador.** Elimina toda la ventaja: crea un tween nuevo en cada evento. [P]
- **Sin `pointerEvents: "none"`.** El seguidor queda bajo el puntero y captura los clics y el `hover` de lo que hay debajo. [P]
- **Seguidor animado por CSS.** Una `transition` sobre `transform` pelea con cada frame de GSAP y añade retardo doble. [P]
- **Olvidar `xPercent`/`yPercent`.** El punto queda con la esquina, no el centro, en el puntero. [P]
- **Coordenadas de `pointermove` y scroll.** `clientX/Y` son del viewport: el seguidor debe ser `position: fixed`. Con `absolute`, se separa al hacer scroll. [P]
- **`(hover: hover)` en pruebas automáticas.** Un navegador sin interfaz puede no cumplirla; la prueba simula `matchMedia`, así que esa consulta real no está ejercitada en Chrome headless. [E]
