---
id: fun-css
titulo: La hoja lenis.css, regla por regla
capa: 01-fundamentos
tipo: referencia
ambito: core
resumen: Qué hace cada regla de lenis.css, cuál es imprescindible y qué falla sin ella. autoToggle no funciona sin la hoja, y stop() deja de bloquear el teclado.
api: [LenisOptions.autoToggle, Lenis.stop, Lenis.isStopped, Lenis.className]
requiere: [fun-instalacion]
relacionadas: [com-stop-start, com-clases, com-anidado]
etiquetas: [css, estilos, overflow]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# La hoja `lenis.css`

Son cinco grupos de reglas, 26 líneas. Actúan sobre las [clases](../04-comportamiento/com-clases.md) que Lenis pone en su elemento raíz. Cárgala siempre: varias funciones dependen de ella sin avisar. Las rutas exactas están en [`fun-instalacion`](fun-instalacion.md). [C]

| Regla | Para qué | Sin ella |
|---|---|---|
| `html.lenis, html.lenis body { height: auto }` | Anula `height: 100%` del documento, que recorta el cálculo de alturas | Límite y `sticky` pueden fallar según tu CSS [P] |
| `.lenis:not(.lenis-autoToggle).lenis-stopped { overflow: clip }` | Bloquea el scroll nativo durante `stop()`. En un contenedor con `overflow` en hoja, además anula su `scrollTop`: ver [`com-stop-start`](../04-comportamiento/com-stop-start.md#ventana-y-contenedor) | **`stop()` no bloquea el teclado** [C] (laboratorio) |
| `.lenis [data-lenis-prevent...] { overscroll-behavior: contain }` | Impide que un área anidada encadene su scroll a la página | Al llegar al final del área, se mueve la página [C] (laboratorio) |
| `.lenis.lenis-smooth iframe { pointer-events: none }` | Durante el suavizado, el `iframe` no se traga la rueda | La rueda sobre un `iframe` la recibe el `iframe`, y la página no suma ese gesto; la animación en curso **no se corta** (laboratorio). Ver [`cal-limitaciones`](../07-calidad/cal-limitaciones.md) |
| `.lenis.lenis-autoToggle { transition: overflow 1ms allow-discrete }` | Convierte el cambio de `overflow` en un `transitionend` | **`stop()` no detiene la instancia.** Si se crea con `overflow` ya oculto, nace parada y no se reanuda: `checkOverflow` corre al crear, sin transición [C] (laboratorio) |

El bloque de `transition-behavior: allow-discrete` requiere Safari > 17.3, Chrome > 116 y Firefox > 128, según la documentación oficial. Solo se probó en Chrome. [O]

Los resultados de laboratorio se obtuvieron con Chrome 156 real, sin arnés, entrada por protocolo de depuración, el 2026-11-05:

| Situación | Con `lenis.css` | Sin `lenis.css` |
|---|---|---|
| `stop()` y tecla `AvPág` | `overflow: clip`; no se mueve | `overflow: visible`; la página **se mueve** |
| `autoToggle`, `stop()` | `isStopped` pasa a `true` tras la transición | `isStopped` sigue en `false`, el teclado queda bloqueado y la rueda **sigue animando** |
| Rueda en `data-lenis-prevent` al final de su área | La página no se mueve | La página se mueve 300 px |

## Ejemplo

La hoja gana a un `height: 100%` típico y aplica sus reglas según las clases:

```html
<style>html, body { height: 100%; }</style>
<div data-lenis-prevent id="area"></div>
```

```js
const lenis = new Lenis({ autoRaf: true });
const altoDocumento = getComputedStyle(document.documentElement).height;
const contencion = getComputedStyle(document.getElementById("area")).overscrollBehaviorY;
lenis.stop();
const clip = getComputedStyle(document.documentElement).overflowY;
lenis.destroy();
// prueba: parseFloat(altoDocumento) > 700
// prueba: contencion === "contain"
// prueba: clip === "clip"
```

## Trampas

- **Copiar solo una parte.** Si la incrustas a mano, copia todos los bloques: `autoToggle` y `stop()` dependen de reglas distintas. [C]
- **Cargarla con `import` en módulos nativos.** Un `import` de CSS falla en el navegador sin empaquetador; usa `<link>`. Ver [`fun-instalacion`](fun-instalacion.md). (laboratorio)
- **Un empaquetador puede eliminarla sin error**, porque el paquete declara `sideEffects: false`. Ver [`fun-instalacion`](fun-instalacion.md#trampas). (laboratorio)
- **`overflow: clip` no detiene `force` en ventana.** En el documento, `clip` se comporta como `hidden` para el scroll programático: `lenis.scrollTo(x, { force: true })` y `window.scrollTo()` siguen moviendo la página. En un contenedor es al revés. [E] en [`com-stop-start`](../04-comportamiento/com-stop-start.md)
- **El bloque de `iframe` solo cubre la animación.** En reposo, la rueda sobre un `iframe` la recibe el `iframe`. Ver [`cal-limitaciones`](../07-calidad/cal-limitaciones.md).
