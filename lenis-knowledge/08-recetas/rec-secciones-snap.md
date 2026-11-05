---
id: rec-secciones-snap
titulo: Secciones con ajuste de scroll
capa: 08-recetas
tipo: patron
ambito: snap
resumen: Ajuste a secciones con lenis/snap, con limpieza segura, lista que cambia y soluciones para eje horizontal y contenedores desplazados.
api: [Snap, Snap.addElements, Snap.add, Snap.goTo, Snap.stop, Snap.start, Snap.destroy, SnapOptions.type, SnapOptions.debounce, SnapOptions.distanceThreshold, SnapOptions.onSnapComplete]
requiere: [snp-snap, snp-api]
relacionadas: [snp-elementos, rec-horizontal, cal-accesibilidad]
etiquetas: [snap, secciones, plantilla]
fuentes:
  - packages/snap/README.md
estado: verificado
version: 1.3.27
---
# Secciones con ajuste de scroll

Cada gesto termina alineado con una sección. Plantilla: `plantillas/seccionesSnap.js` con módulos, o `plantillas/globales/seccionesSnap.js` con `<script>` clásico, que expone `Plantillas.seccionesSnap`. Ver [cómo copiarla](../plantillas/README.md#copiar-a-un-proyecto).

## Problema

`scroll-snap-type` de CSS no funciona bien con un scroll guiado por JavaScript. Hay que decidir el ajuste al terminar el gesto, y además retirarlo sin dejar un ajuste pendiente.

## Solución

Crea `Snap` sobre la instancia y registra las secciones. En `<script>` clásico es el global `Snap`; con módulos, `import Snap from "lenis/snap"`.

```html
<section class="pagina" style="height:700px">Uno</section>
<section class="pagina" style="height:700px">Dos</section>
<section class="pagina" style="height:700px">Tres</section>
<div style="height:3000px"></div>
```

```js
import Lenis from "lenis";
import Snap from "lenis/snap";

const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
const llegadas = [];
const snap = new Snap(lenis, {
  type: "mandatory",
  debounce: 60,
  duration: 0.2,
  onSnapComplete: ({ value }) => llegadas.push(value),
});
snap.addElements(document.querySelectorAll(".pagina"));

rueda(500); // queda más cerca de la segunda sección
for (let i = 0; lenis.scroll !== 700 && i < 150; i++) await espera(20);

// prueba: lenis.scroll === 700
// prueba: llegadas.at(-1) === 700
```

| `type` | Conducta [C] |
|---|---|
| `proximity` (por defecto) | Se ajusta a la más cercana si está dentro de `distanceThreshold` (`"50%"` de la ventana) |
| `mandatory` | Siempre a la más cercana. Ignora el umbral |
| `lock` | Salta a la siguiente en la dirección del gesto y bloquea los gestos durante el ajuste |

Para botones, usa `snap.next()`, `snap.previous()` o `snap.goTo(indice)` [C]. El índice cuenta sobre los puntos ordenados, también los añadidos con `snap.add(valor)`.

## Parámetros

| Plantilla | Por defecto | Uso |
|---|---|---|
| `lenis` | crea una | Instancia compartida |
| `tipo` | `"proximity"` | `type` |
| `alinear` | `"start"` | `align`. Solo en vertical y sin contenedor |
| `espera` | `500` | `debounce`, en ms |
| `umbral` | `"50%"` | `distanceThreshold` |
| `duracion` | la de la instancia | Segundos |
| `alAjustar` | — | `onSnapComplete` |

Si la lista cambia, pasa una función como objetivo y llama a `limpiar.actualizar()`. El método `limpiar.snap()` da la instancia en uso, para `goTo` [E].

## Movimiento reducido

Con `prefers-reduced-motion` Lenis convierte el ajuste en `immediate`: un salto brusco tras cada gesto, medio segundo después [C]. Desactívalo con `snap.stop()`, que deja el scroll libre, y usa `snap.start()` si la preferencia cambia. La plantilla escucha ese cambio [E].

```js
const preferencia = { matches: true, addEventListener() {}, removeEventListener() {} };
window.matchMedia = () => preferencia; // solo para la prueba

const lenis = new Lenis({ autoRaf: true });
const snap = new Snap(lenis, { type: "mandatory", debounce: 40 });
snap.addElements(document.querySelectorAll(".pagina"));
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) snap.stop();

rueda(300);
await espera(400);

// prueba: lenis.scroll === 300
```

## Limpieza

Llama primero a `snap.stop()` y luego a `snap.destroy()`, antes de `lenis.destroy()`.

```js
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
const snap = new Snap(lenis, { type: "mandatory", debounce: 80, duration: 0.1 });
snap.addElements(document.querySelectorAll(".pagina"));

rueda(500);
await espera(10);
snap.stop();
snap.destroy();
await espera(500);

// prueba: lenis.scroll === 500
```

## Trampas

- **`snap.destroy()` no cancela la espera en curso.** Con un gesto reciente, el ajuste se ejecuta después de destruir: en el arnés la página saltó a 700. `snap.stop()` antes lo evita, porque el ajuste comprueba `isStopped`. [E, prueba abajo]
- **En horizontal, `align: "start"` no funciona.** El código usa `rect.top` también en ese eje: todas las secciones de una fila dan el mismo punto y `goTo(1)` no se mueve. Usa `center` o `end`, o registra números con `snap.add()`. [C] [E, abajo]
- **Dentro de un contenedor separado del borde, los puntos salen desplazados.** Se miden respecto a la página, no al contenedor: `rect.top` más el scroll acumulado de los ancestros y `window.scrollY` [C]. Con el contenedor a 100 px del borde, las secciones dan 100, 500 y 900, en vez de 0, 400 y 800. [E, abajo]
- **Quitar un elemento no libera sus observadores.** La función de `addElement` borra la entrada y deja vivos sus `ResizeObserver`. Si la lista cambia a menudo, destruye la instancia `Snap` y crea otra, como hace `limpiar.actualizar()`. [C]
- **`ignoreTransform: false` con secciones animadas** mide la posición transformada. Si una sección entra con `translateY`, el punto queda corrido; usa `ignoreTransform: true`. [C]
- **`debounce` corto con trackpad:** la inercia sigue emitiendo gestos, y un valor bajo ajusta antes de que acabe. El valor por defecto es 500 ms desde 1.3.7. [C] [P]
- **Cambió el valor por defecto de `type`.** Era `mandatory` hasta 1.3.7, y es `proximity` desde 1.3.8: ver [migración](../09-versiones/ver-migracion.md). [C]

```js
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
const snap = new Snap(lenis, { type: "mandatory", debounce: 80, duration: 0.1 });
snap.addElements(document.querySelectorAll(".pagina"));

rueda(500);
await espera(10);
snap.destroy(); // sin stop()
await espera(500);

// prueba: lenis.scroll === 700
```

```html
<div style="height:100px"></div>
<div id="caja" style="height:400px;overflow:auto"><div id="interior">
  <div class="tramo" style="height:400px">a</div><div class="tramo" style="height:400px">b</div><div class="tramo" style="height:400px">c</div>
</div></div>
```

```js
const caja = document.querySelector("#caja");
const lenis = new Lenis({ wrapper: caja, content: document.querySelector("#interior"), autoRaf: true });
const snap = new Snap(lenis);
snap.addElements(document.querySelectorAll(".tramo"));
const puntos = [...snap.elements.values()].map(({ rect }) => rect.top);

// prueba: puntos.join() === "100,500,900"
```

```html
<div id="fila" style="width:600px;height:300px;overflow:auto;position:relative"><div id="pista" style="display:flex;width:max-content">
  <div class="panel" style="flex:none;width:600px;height:280px">1</div><div class="panel" style="flex:none;width:600px;height:280px">2</div>
</div></div>
```

```js
const fila = document.querySelector("#fila");
const lenis = new Lenis({ wrapper: fila, content: document.querySelector("#pista"), orientation: "horizontal", autoRaf: true });
const snap = new Snap(lenis, { type: "mandatory", duration: 0.1 });
snap.addElements(document.querySelectorAll(".panel"));
snap.goTo(1);
await espera(300);

// prueba: lenis.scroll === 0
```
