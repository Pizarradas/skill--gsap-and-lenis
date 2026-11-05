---
id: rec-barra-progreso
titulo: Barra de progreso de lectura
capa: 08-recetas
tipo: patron
ambito: core
resumen: Una barra que refleja cuánto se ha recorrido, ligada a lenis.progress, sin reflujo y al día cuando cambia la longitud del contenido.
api: [Lenis.progress, Lenis.limit, Lenis.on, Lenis.off, Lenis.resize]
requiere: [api-eventos]
relacionadas: [api-instancia, com-dimensiones, cal-rendimiento, rec-parallax]
etiquetas: [scroll, progreso, plantilla]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Barra de progreso de lectura

Muestra cuánto se ha recorrido de la página o de un contenedor. Plantilla: `plantillas/barraProgreso.js` con módulos, o `plantillas/globales/barraProgreso.js` con `<script>` clásico, que expone `Plantillas.barraProgreso`. Ver [cómo copiarla](../plantillas/README.md#copiar-a-un-proyecto).

## Problema

Hace falta un indicador que avance con el scroll suavizado, en el mismo paso que el contenido. Leer `window.scrollY` en un evento `scroll` propio funciona, pero recalcula medidas por su cuenta y puede ir un paso por detrás de Lenis.

## Solución

Suscríbete a `scroll` y escribe `transform`, que no provoca reflujo. El valor sale de `lenis.progress`, que es `scroll / limit` [C].

```html
<div id="progreso" style="position:fixed;inset:0 0 auto 0;height:4px;background:#111;transform-origin:left;transform:scaleX(0)"></div>
<div style="height:4000px"></div>
```

```js
const barra = document.querySelector("#progreso");
const lenis = new Lenis({ autoRaf: true, lerp: 0.2 });

function pintar() {
  const avance = lenis.limit > 0 ? lenis.progress : 0;
  barra.style.transform = `scaleX(${avance})`;
}

const quitar = lenis.on("scroll", pintar);
pintar();

rueda(1500);
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);
const pintado = parseFloat(barra.style.transform.slice(7));

// prueba: lenis.scroll > 1400
// prueba: Math.abs(pintado - lenis.progress) < 0.01
```

La variante táctil es la misma: `scroll` se emite también con scroll nativo, que es lo que hace el dedo cuando `syncTouch` está apagado [C]. Se comprueba aquí con un desplazamiento nativo, que es lo que el navegador produciría tras el gesto:

```js
const barra = document.querySelector("#progreso");
const lenis = new Lenis({ autoRaf: true });
const quitar = lenis.on("scroll", () => {
  barra.style.transform = `scaleX(${lenis.progress})`;
});

toque("touchstart", 100, 400);
toque("touchmove", 100, 300);
toque("touchend", 100, 300);
const sinAnimar = lenis.isSmooth === false; // sin syncTouch, Lenis no anima el toque

window.scrollTo(0, 900);
for (let i = 0; lenis.scroll !== 900 && i < 100; i++) await espera(20);

// prueba: sinAnimar
// prueba: parseFloat(barra.style.transform.slice(7)) > 0.1
```

## Parámetros

| Plantilla | Por defecto | Uso |
|---|---|---|
| `lenis` | crea una | Instancia compartida. Pásala siempre que ya exista |
| `eje` | `"x"` | `"y"` para una barra vertical |

## Movimiento reducido

La barra informa de la posición: no es movimiento decorativo, y debe seguir funcionando. Con `prefers-reduced-motion`, Lenis continúa emitiendo `scroll` [C]; la prueba `conReducido` de la plantilla lo ejecuta [E]. Si la barra tiene `transition` en CSS, quítala en esa preferencia.

## Limpieza

Al retirar la vista, `quitar()` y, si la instancia es tuya, `lenis.destroy()`. La plantilla devuelve además `transform` y `transform-origin` a sus valores previos [E].

## Trampas

- **Sin recorrido, `progress` vale 1, no 0.** Con `limit === 0` Lenis devuelve 1 para evitar `NaN`: la barra sale llena en una página corta. Comprueba `lenis.limit > 0`. [C] [E]
- **Crecer el contenido no actualiza la barra.** El reajuste automático mide de nuevo, pero no emite `scroll`: en Chrome real, con el contenido 2000 px más alto, `limit` cambió y hubo 0 emisiones (laboratorio: Chrome real sobre HTTP local, Lenis 1.3.27, 2026-11-05). La barra queda obsoleta hasta el siguiente gesto. Llama a `lenis.resize()`, que sí emite. [C] [E]
- **Cambio con `lenis.resize()`, no con un `pintar()` suelto.** `pintar()` usaría el `limit` antiguo mientras dure la espera de 250 ms del reajuste automático. [C]
- **Animar `width` provoca reflujo en cada paso.** Usa `transform: scaleX()`. [P]
- **`lenis.progress` con `infinite` vuelve a 0 en cada vuelta.** `scroll` es el módulo del límite: la barra salta al completar el ciclo, y ahí no indica lectura. [C]

```js
const lenis = new Lenis({ autoRaf: true });
const barra = document.querySelector("#progreso");
const anterior = lenis.limit;
let emisiones = 0;
lenis.on("scroll", () => emisiones++);

const extra = document.createElement("div");
extra.style.height = "1000px";
document.body.append(extra);
lenis.resize(); // mide y emite

// prueba: lenis.limit === anterior + 1000
// prueba: emisiones === 1
```
