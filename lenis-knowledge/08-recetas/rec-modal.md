---
id: rec-modal
titulo: Modal con el fondo bloqueado
capa: 08-recetas
tipo: patron
ambito: core
resumen: Detiene el scroll de fondo con un dialog abierto y deja desplazarse su contenido, con rueda y toque, incluso con varios modales.
api: [Lenis.stop, Lenis.start, Lenis.isStopped, LenisOptions.autoToggle, LenisOptions.prevent]
requiere: [com-stop-start, opc-filtros]
relacionadas: [com-anidado, com-clases, cal-accesibilidad, fun-css]
etiquetas: [modal, dialog, stop, anidado, plantilla]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Modal con el fondo bloqueado

Bloquea la página mientras un diálogo está abierto y deja que el diálogo se desplace por sí mismo. Plantilla: `plantillas/bloqueoModal.js` con módulos, o `plantillas/globales/bloqueoModal.js` con `<script>` clásico, que expone `Plantillas.bloqueoModal`. Ver [cómo copiarla](../plantillas/README.md#copiar-a-un-proyecto).

## Problema

Con Lenis activo hay dos fallos típicos: la rueda sigue moviendo el fondo, o, tras `lenis.stop()`, la rueda deja de funcionar también dentro del modal, porque Lenis cancela el evento.

## Solución

Combina `stop()` con `data-lenis-prevent` en el diálogo. El orden del código lo hace posible: Lenis descarta primero los gestos sobre elementos con `data-lenis-prevent` y solo después comprueba si está parado, así que esos gestos no se cancelan [C]. Usa `<dialog>` con `showModal()`: trae foco atrapado, Escape y fondo inerte.

```html
<dialog id="ficha" style="height:200px;overflow:auto" data-lenis-prevent>
  <div style="height:900px">Contenido largo</div>
</dialog>
<div style="height:3000px"></div>
```

```js
const dialogo = document.querySelector("#ficha");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });

function abrir() {
  lenis.stop();
  dialogo.showModal();
}
dialogo.addEventListener("close", () => lenis.start()); // Escape incluido

abrir();

// Rueda fuera: Lenis la cancela y no se mueve nada
const fuera = new WheelEvent("wheel", { deltaY: 300, bubbles: true, cancelable: true });
document.documentElement.dispatchEvent(fuera);
await espera(150);

// Rueda dentro: queda para el navegador
const dentro = new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true });
dialogo.firstElementChild.dispatchEvent(dentro);

// Toque dentro: tampoco se cancela
let toqueCancelado = null;
const mirar = (e) => { toqueCancelado = e.defaultPrevented; };
window.addEventListener("touchmove", mirar);
toque("touchstart", 50, 300, dialogo.firstElementChild);
toque("touchmove", 50, 260, dialogo.firstElementChild);
window.removeEventListener("touchmove", mirar);

dialogo.close();
for (let i = 0; lenis.isStopped && i < 100; i++) await espera(20); // close llega en otra tarea
rueda(300);
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);

// prueba: fuera.defaultPrevented && !dentro.defaultPrevented
// prueba: toqueCancelado === false
// prueba: lenis.isStopped === false && lenis.scroll > 200
```

Sin atributo en el marcado, la opción `prevent` da el mismo resultado, y evita tocar el HTML [C]:

```js
const dialogo = document.querySelector("#ficha");
dialogo.removeAttribute("data-lenis-prevent");
const lenis = new Lenis({ autoRaf: true, prevent: (nodo) => nodo.matches("dialog") });
lenis.stop();
dialogo.showModal();

const dentro = new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true });
dialogo.firstElementChild.dispatchEvent(dentro);

// prueba: !dentro.defaultPrevented
```

## Parámetros

| Plantilla | Por defecto | Uso |
|---|---|---|
| `lenis` | crea una | Instancia compartida. Con varios diálogos, la misma en todos |

Devuelve `limpiar`, con `limpiar.abrir()` y `limpiar.cerrar()`. La plantilla cuenta los diálogos abiertos por instancia, de modo que cerrar uno no reanuda el fondo mientras quede otro [E].

## Movimiento reducido

`stop()` no anima nada, y el bloqueo es igual con `prefers-reduced-motion` [E, prueba `reducidoQuieto` de la plantilla]. Si animas la entrada del diálogo, redúcela en CSS.

## Limpieza

Si la vista se retira con el diálogo abierto, ciérralo y llama a `start()`: de lo contrario la instancia compartida queda parada. La plantilla lo hace en `limpiar()` y retira el atributo que añadió [E].

## Con una instancia de contenedor

`stop()` actúa sobre `rootElement`: con `wrapper` en un contenedor, la ventana sigue libre y además `lenis.css` recorta el contenedor con `overflow: clip`, que lo lleva a `scrollTop` 0. La plantilla resuelve ambas cosas: pone `overflow: hidden` en línea en el contenedor, que conserva la posición, y en `<html>` mientras dure el modal, con un contador si hay varias instancias. Al cerrar devuelve los valores anteriores. [E, prueba de la plantilla]

La rueda real, dentro y fuera del contenedor, y AvPág no mueven nada (laboratorio, Chrome real por CDP, 2026-11-05). Al quitar `overflow` de `<html>` desaparece la barra de la ventana, y el ancho útil pasó de 985 a 1000 px.

## Trampas

- **`stop()` sin `lenis.css` no frena el teclado.** Lenis solo cancela rueda y toque; lo que bloquea el resto es `.lenis-stopped { overflow: clip }`. Sin esa hoja, Espacio y las flechas siguen moviendo el fondo. [C]
- **Un `overflow` en línea o con selector de id gana a esa regla.** `.lenis:not(.lenis-autoToggle).lenis-stopped` tiene especificidad de tres clases: un `style="overflow:auto"` o `#caja { overflow:auto }` la anula. [C]
- **`close` llega en otra tarea.** Cerrar y reabrir seguido entrega el `close` antiguo con el diálogo ya abierto; quien lo trate como cierre libera el fondo con el modal delante. La plantilla comprueba `dialogo.open`. [E]
- **En Shadow DOM, `lenis.css` no llega.** Si el contenedor o su contenido están dentro de una sombra, sus reglas no los alcanzan. `plantillas/iniciarScroll.js` adopta el CSS mínimo en esa raíz. `data-lenis-prevent` sí funciona, porque Lenis usa `composedPath()` [C] [E].
- **Con `autoToggle`, `stop()` no es inmediato.** Pone `overflow: clip` en línea y `isStopped` cambia al acabar una transición de 1 ms. Si llamas a `start()` en el mismo paso, `isStopped` aún es `false`, `start()` no hace nada y la página queda parada con `overflow: clip` (laboratorio: Chrome real, 1.3.27, 2026-11-05; el arnés no dispara esa transición). Retira ese estilo tú mismo, como hace la plantilla. [C]
- **`destroy()` no retira el listener de `autoToggle`.** `transitionend` queda en la raíz y retiene la instancia. Se ve en la prueba de abajo; `plantillas/iniciarScroll.js` lo quita. [C] [E]
- **Si ya estaba parada, `start()` al cerrar la reanuda.** Un cargador que paró la instancia queda anulado por el modal. Guarda `isStopped` antes de abrir. La plantilla lo hace [E].
- **`lenis.scrollTo()` también se ignora con la instancia parada,** en silencio. Para mover el fondo con el modal abierto, usa `force: true`. [C]

Y la fuga de `autoToggle`:

```js
const html = document.documentElement;
const puestos = [];
let quitados = 0;
const poner = html.addEventListener;
const quitar = html.removeEventListener;
html.addEventListener = function (tipo, ...resto) {
  if (tipo === "transitionend") puestos.push(tipo);
  return poner.call(this, tipo, ...resto);
};
html.removeEventListener = function (tipo, ...resto) {
  if (tipo === "transitionend") quitados++;
  return quitar.call(this, tipo, ...resto);
};

const lenis = new Lenis({ autoToggle: true });
lenis.destroy();

// prueba: puestos.length === 1 && quitados === 0
```
