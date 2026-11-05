---
id: rec-canvas-sync
titulo: Canvas sincronizado con el scroll
capa: 08-recetas
tipo: patron
ambito: core
resumen: Dibuja un canvas con el valor exacto de Lenis y en su mismo paso, con bucle externo o por eventos, sin gastar en reposo.
api: [Lenis.raf, LenisOptions.autoRaf, Lenis.scroll, Lenis.progress, Lenis.velocity, Lenis.on]
requiere: [com-raf, api-eventos]
relacionadas: [int-canvas-webgl, cal-rendimiento, rec-parallax]
etiquetas: [canvas, webgl, sincronizacion, plantilla]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Canvas sincronizado con el scroll

Lenis ejecuta el scroll en el hilo principal, y por eso una escena puede pintarse con el mismo valor que el DOM. Sirve con 2D, WebGL o un motor de dibujo. Plantilla: `plantillas/sincronizarCanvas.js` con módulos, o `plantillas/globales/sincronizarCanvas.js` con `<script>` clásico, que expone `Plantillas.sincronizarCanvas`. Ver [cómo copiarla](../plantillas/README.md#copiar-a-un-proyecto).

## Problema

Si el bucle de dibujo se ejecuta antes que el de Lenis, usa el valor del paso anterior y la escena queda un fotograma detrás del DOM.

## Solución

Elige uno de dos modelos.

**Por eventos.** Dibuja al emitir `scroll`, que ocurre dentro de `raf()`, justo después de aplicar el valor [C]. En reposo no se ejecuta nada.

```html
<canvas id="lienzo" style="position:fixed;top:0;left:0;width:200px;height:100px"></canvas>
<div style="height:4000px"></div>
```

```js
const lienzo = document.querySelector("#lienzo");
const ctx = lienzo.getContext("2d");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
let desfase = 0;

function dibujar() {
  desfase = Math.max(desfase, Math.abs(lenis.scroll - window.scrollY));
  ctx.clearRect(0, 0, lienzo.width, lienzo.height);
  ctx.fillRect(0, 0, lienzo.width * lenis.progress, lienzo.height);
}
const quitar = lenis.on("scroll", dibujar);

rueda(800);
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);

// prueba: lenis.scroll > 790
// prueba: desfase <= 1
```

**Bucle único.** Si la escena se anima sola, un reloj gobierna ambas cosas: primero `lenis.raf()`, después el dibujo. Crea la instancia sin `autoRaf`.

```js
const lienzo = document.querySelector("#lienzo");
const ctx = lienzo.getContext("2d");
const lenis = new Lenis({ lerp: 0.3 });
let desfase = 0;
let activo = true;

function bucle(ms) {
  if (!activo) return;
  lenis.raf(ms); // primero el scroll
  desfase = Math.max(desfase, Math.abs(lenis.scroll - window.scrollY));
  ctx.fillRect(0, 0, 10, 10); // después la escena
  requestAnimationFrame(bucle);
}
requestAnimationFrame(bucle);

rueda(800);
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);
activo = false;

// prueba: lenis.scroll > 790
// prueba: desfase <= 1
```

## Parámetros

| Plantilla | Por defecto | Uso |
|---|---|---|
| `dibujar` | obligatoria | `(ctx, { scroll, progreso, velocidad, ancho, alto })` |
| `contexto` | `"2d"` | `"2d"`, `"webgl"`, `"webgl2"`, o `null` si el canvas es de un motor |
| `lenis` | crea una | Instancia compartida |
| `densidadMaxima` | `2` | Tope de `devicePixelRatio` |

| `contexto` | `ctx` en `dibujar` | Tamaño del canvas | Antes de `dibujar` |
|---|---|---|---|
| `"2d"` | Contexto 2D | Lo ajusta la plantilla | Limpia, y escala a píxeles CSS |
| `"webgl"`, `"webgl2"` | Contexto WebGL | Lo ajusta la plantilla | Ajusta `viewport`; limpiar es tuyo |
| `null` | `null` | Lo gestiona el motor: usa `ancho` y `alto` | Nada |

Si el canvas ya tiene otro contexto, `getContext` devuelve `null`: la plantilla lanza un `TypeError` que lo dice, sin crear instancia [E]. Sin esa comprobación, el fallo sería `Cannot read properties of null` en `setTransform`.

Esta plantilla cubre el modelo por eventos. Una escena que se anima sola necesita bucle único: ver [`int-canvas-webgl`](../06-integracion/int-canvas-webgl.md).

Mide con `ResizeObserver` y redibuja al cambiar de tamaño. Si cambian tus datos, llama a `limpiar.redibujar()` [E].

## Movimiento reducido

El modelo por eventos no añade movimiento propio: la escena solo sigue al scroll [E]. Si la escena se anima sola, detén ese bucle con `prefers-reduced-motion` y dibuja un fotograma estático. `lenis.velocity` sigue teniendo valor, porque la rueda pasa por el mismo cálculo; no lo uses para deformar la escena con esa preferencia [C].

## Limpieza

Quita la suscripción, desconecta el observador y, con bucle propio, corta su `requestAnimationFrame`. La plantilla devuelve `width` y `height` del canvas a sus atributos originales [E]. Libera aquí tus recursos de escena.

## Trampas

- **`autoRaf: true` más tu propio `lenis.raf()` multiplica bucles.** Cada llamada a `raf()` con `autoRaf` programa otro `requestAnimationFrame`, y `destroy()` solo cancela el último: las cadenas siguen vivas tras destruir. Usa uno de los dos. [C] [E, abajo]
- **Dibujar antes de `raf()`** muestra el valor del paso anterior. [C]
- **`scroll` no se emite en cada fotograma:** solo si hay movimiento. Un bucle que dependa de ese evento se para en reposo; tras un gesto puede llegar alguna emisión tardía sin cambio de valor, del scroll nativo y del reinicio de `velocity` a los 400 ms. No cuentes emisiones. [C] [E]
- **Fijar `canvas.width` borra el lienzo** y reinicia la transformación. Redibuja siempre tras medir. [P]
- **Sin `ctx.setTransform`, con densidad 2 se pinta en un cuarto.** [P]
- **Un `ResizeObserver` puede dispararse sin cambio real** en su primera observación. Compara el tamaño antes de borrar el canvas. La plantilla lo hace [E].
- **`window.scrollY` puede diferir en décimas de `lenis.scroll`.** Para colocar objetos, usa `lenis.scroll`, que es el valor animado. [E]

```js
const original = window.requestAnimationFrame;
let programados = 0;
window.requestAnimationFrame = (f) => {
  programados++;
  return original(f);
};
const medir = async () => {
  const inicio = programados;
  await espera(200);
  return programados - inicio;
};

const lenis = new Lenis({ autoRaf: true });
const normal = await medir();
for (let i = 0; i < 5; i++) lenis.raf(performance.now()); // error: bucle duplicado
const duplicado = await medir();
lenis.destroy();
const trasDestruir = await medir();

// prueba: duplicado > normal * 3
// prueba: trasDestruir > 0
```
