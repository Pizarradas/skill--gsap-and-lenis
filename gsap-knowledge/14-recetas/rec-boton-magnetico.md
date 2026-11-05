---
id: rec-boton-magnetico
titulo: Botón magnético
capa: 14-recetas
tipo: patron
ambito: core
resumen: Atrae un botón hacia el puntero con quickTo y lo devuelve al salir, midiendo una referencia estable para evitar temblores.
api: [gsap.quickTo, gsap.getProperty, gsap.matchMedia]
requiere: [nuc-quickto]
relacionadas: [rec-seguidor-cursor, nuc-getproperty, cal-accesibilidad]
etiquetas: [puntero, interaccion, boton, plantilla]
fuentes:
  - docs/v3/GSAP/gsap.quickTo().md
  - docs/v3/GSAP/gsap.getProperty().md
estado: verificado
version: 3.15.1
---
# Botón magnético

Al pasar el puntero, el botón se inclina hacia él y al salir vuelve a su sitio. Plantilla: `plantillas/botonMagnetico.js`. [E]

## Problema

Si se mide el rectángulo en cada `pointermove`, el centro se mueve con el propio botón y la atracción se realimenta: tiembla. Además, el botón desplazado puede dejar de estar bajo el puntero, lo que dispara `pointerleave` y hace que vuelva y salte en bucle.

## Solución

Medir el centro una vez, al entrar, descontando el desplazamiento actual. El destino es una fracción de la distancia al centro, y esa fracción (`fuerza` < 1) mantiene el botón bajo el puntero. [E]

```html
<button class="enviar" style="position:absolute;left:100px;top:100px;width:200px;height:60px;padding:0;border:0">Enviar</button>
```

```js
const boton = document.querySelector(".enviar");
const moverX = gsap.quickTo(boton, "x", { duration: 0.1, ease: "power3" });
const moverY = gsap.quickTo(boton, "y", { duration: 0.1, ease: "power3" });
let cx = 0, cy = 0;

boton.addEventListener("pointerenter", () => {
  const caja = boton.getBoundingClientRect();
  cx = caja.left + caja.width / 2 - gsap.getProperty(boton, "x");
  cy = caja.top + caja.height / 2 - gsap.getProperty(boton, "y");
});
boton.addEventListener("pointermove", (e) => {
  moverX((e.clientX - cx) * 0.5);
  moverY((e.clientY - cy) * 0.5);
});
boton.addEventListener("pointerleave", () => {
  moverX(0);
  moverY(0);
});

const lanzar = (tipo, x, y) => boton.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: y }));
lanzar("pointerenter", 300, 130);
lanzar("pointermove", 300, 150);
await new Promise((r) => setTimeout(r, 180));
const atraido = gsap.getProperty(boton, "x");
lanzar("pointerleave", 0, 0);
await new Promise((r) => setTimeout(r, 180));
const devuelto = gsap.getProperty(boton, "x");
// prueba: Math.abs(atraido - 50) < 0.1
// prueba: devuelto === 0
```

## Parámetros ajustables

| Opción | Por defecto | Efecto |
|---|---|---|
| `fuerza` | `0.35` | Fracción de la distancia que se desplaza; por encima de 0.6 puede escaparse del puntero |
| `duracion` | `0.3` | Inercia del movimiento |
| `ease` | `"power3"` | Curva, usada también en la vuelta |

## Variante con prefers-reduced-motion

Sin efecto: el callback solo corre con `no-preference` y `hover: hover`. Un botón no necesita moverse para funcionar, y en pantallas táctiles el dedo no tiene estado de hover. [P] [E]

```js
window.matchMedia = (q) => ({ matches: /: reduce\)/.test(q), addListener() {}, removeListener() {} });
let creado = false;
const mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: no-preference) and (hover: hover)", () => {
  creado = true;
});
// prueba: creado === false
```

## Limpieza

`limpiar()` quita los tres listeners de cada botón y devuelve el `transform` original, en cualquier motor. [E]

```js fragmento
const limpiar = botonMagnetico(raiz.querySelectorAll(".cta"), { fuerza: 0.25 });
limpiar();
```

## Trampas

- **`revert()` con dos `quickTo` en el mismo botón.** El de `y` nace cuando el de `x` ya escribió `transform`, así que captura `translate(0px)`. Como empatan, en Firefox ese valor se restaura el último y queda en línea. La plantilla crea antes `gsap.set(boton, { x: "+=0" })`: captura el original y se deshace después de los dos. [C] [E]
- **Botón con `transform` propio en línea.** Vuelve entero, pero GSAP deja `translate: none; rotate: none; scale: none`, solo cuando hay `transform` en línea que conservar. No cambia nada visible. [E]
- **Medir en `pointermove`.** Realimentación: el centro se mueve con el botón. Mide en `pointerenter`. [E]
- **`getBoundingClientRect` incluye el transform.** Si el puntero reentra antes de que el botón vuelva, el centro sale desplazado. Por eso se resta `gsap.getProperty(boton, "x")`. [E]
- **Mezclar `quickTo` y `gsap.to` en la misma propiedad.** Compiten sobre `x`. Para una vuelta elástica, usa otra propiedad (un envoltorio) o mata el `quickTo` con `moverX.tween.pause()` antes. [P]
- **`transition` en el botón.** Muchos botones ya la traen para `all`: pelea con cada frame. Limítala a color y fondo. [P]
- **Sin foco de teclado.** El efecto solo existe con puntero; el estado `:focus-visible` debe seguir siendo evidente. [P]
- **Muchos botones.** Cada uno crea dos tweens en pausa y tres listeners: reserva el efecto para llamadas a la acción. [P]
