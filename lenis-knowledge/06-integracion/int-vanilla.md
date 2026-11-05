---
id: int-vanilla
titulo: Lenis sin framework
capa: 06-integracion
tipo: guia
ambito: core
resumen: Las tres vías de carga, cuándo está listo el DOM, páginas que se descartan, instancia única, navegación parcial desde servidor y bfcache.
api: [LenisOptions.autoRaf, LenisOptions.anchors, Lenis.destroy, Lenis.resize, Lenis.scrollTo]
requiere: [int-contrato]
relacionadas: [fun-instalacion, fun-css, int-wordpress, int-webflow]
etiquetas: [vanilla, script, importmap, multipagina, cms]
fuentes:
  - README.md
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap
estado: verificado
version: 1.3.27
---
# Lenis sin framework

Esta es la forma base de Lenis: JavaScript y DOM, con el [contrato](int-contrato.md) en su forma más simple. La página entera entra al cargar y sale al descartarse. Esta ficha recoge lo propio de páginas servidas, plantillas y CMS.

Laboratorio del 2026-11-05: Chrome 156 headless, rueda real, `unpkg.com` real, ver [`int-contrato`](int-contrato.md).

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| `new Lenis({ autoRaf: true })` con el DOM listo | `lenis.resize()` tras insertar contenido; `lenis.options` para una opción | Nada si la página se descarta | Una recarga: nada que hacer. Con sustitución parcial, [`colocar`](int-navegacion.md): [tabla abajo](#5-navegacion-parcial-desde-el-servidor) | Nada, con `autoRaf`; si otro bucle manda, [`int-contrato`](int-contrato.md) |

**Plantillas.** Las de [`plantillas/`](../plantillas/README.md) funcionan aquí. Con módulos o empaquetador, copia `plantillas/<nombre>.js`. Con `<script>` clásico, copia `plantillas/globales/<nombre>.js` y llama a `Plantillas.nombre(...)`: el archivo de `plantillas/` da `Cannot use import statement outside a module`.

## Pasos

### 1. Carga: tres vías del mismo rango

**Empaquetador.**

```js fragmento
import Lenis from "lenis";
import "lenis/dist/lenis.css";

const lenis = new Lenis({ autoRaf: true });
```

**`<script>` clásico.** `dist/lenis.min.js` crea el global `Lenis`, y `lenis-snap.min.js`, `Snap`.

```text
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.27/dist/lenis.css">
<script src="https://unpkg.com/lenis@1.3.27/dist/lenis.min.js"></script>
```

**Módulos nativos con import map.** `lenis.mjs` y `lenis-snap.mjs` no importan nada más. Probado en laboratorio, con los archivos servidos en local:

```text
<script type="importmap">
  { "imports": {
    "lenis": "/vendor/lenis.mjs",
    "lenis/snap": "/vendor/lenis-snap.mjs"
  } }
</script>
<script type="module">
  import Lenis from "lenis";
  import Snap from "lenis/snap";

  const lenis = new Lenis({ autoRaf: true });
  const snap = new Snap(lenis, { type: "mandatory" });
  snap.add(900);
</script>
```

### 2. Crea la instancia con cualquier estado del documento

Con `autoResize`, `new Lenis()` funciona incluso en `<head>`, antes de que exista `<body>`: en laboratorio, el fragmento oficial en `<head>` funcionó. Al terminar de cargar, los `ResizeObserver` corrigen las medidas. Aun así, un script tardío no recibe `DOMContentLoaded`: comprueba `readyState`. [E]

```js
function alEstarListo(fn) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
  else fn();
}

let lenis;
alEstarListo(() => { lenis = new Lenis({ autoRaf: true }); });
const creada = lenis instanceof Lenis;
lenis?.destroy();
// prueba: creada === true
```

### 3. Instancia única

Un script incluido dos veces, o un gestor de etiquetas, crea dos instancias: dos oyentes de `wheel`, dos relojes. Con `const` en la raíz de un script clásico, el segundo ni siquiera corre: `Identifier 'lenis' has already been declared`. Envuélvelo en un bloque `{ }`. Guárdala en un nombre propio y sal antes de entrar. `window.lenis` no sirve: es diagnóstico, no la instancia. [P]

```js
function scrollUnico() {
  window.miLenis?.destroy();
  window.miLenis = new Lenis({ autoRaf: true });
  return window.miLenis;
}
scrollUnico();
const segunda = scrollUnico();
const clase = document.documentElement.className;
segunda.destroy();
window.miLenis = undefined;
// prueba: clase === "lenis"
```

### 4. Contenido que llega después

Las imágenes sin tamaño y el contenido por AJAX cambian el alto de `content`: lo recogen los `ResizeObserver`, con 250 ms de retardo. Si necesitas el `limit` correcto al instante, `lenis.resize()`. Con `naiveDimensions: true`, `limit` se mide en cada lectura y no hay retardo: ver [`com-dimensiones`](../04-comportamiento/com-dimensiones.md). [C]

### 5. Navegación parcial desde el servidor

Estas bibliotecas sustituyen parte del DOM sin recargar. La instancia sobrevive en lo que no se sustituye, y `colocar` va en su evento posterior. Eventos leídos de su documentación el 2026-11-05. **Sin ejecutar con Lenis.**

| Biblioteca | Evento posterior | Nota |
|---|---|---|
| htmx | `htmx:afterSettle` | Una sustitución parcial no suele ser un cambio de vista: `lenis.resize()` y nada más. `colocar` si cambia la vista |
| Turbo | `turbo:load` | También corre en la carga inicial. Reemplaza `<body>`: un contenedor dentro sale con él, y la clase de `<html>` se conserva |
| Swup | `swup.hooks.on("visit:end", ...)` | `content:scroll` reinicia el scroll antes, y por eso `colocar` debe cortar primero |
| Livewire | `livewire:navigated` | También en la carga inicial. Conserva la posición al ir y volver: pasa `lenis.actualScroll` si la quieres mantener |

## Trampas

- **`DOMContentLoaded` ya pasó.** Con un gestor de etiquetas o un optimizador que retrasa el JavaScript, el oyente nunca salta y Lenis no llega a existir, sin error. Usa `alEstarListo`. [P]
- **`bfcache`.** Al volver atrás, la página regresa congelada, con la instancia viva y su posición. No se probó: `Page.navigate` headless no permite comprobarlo con fiabilidad. Si tu instancia se destruye en `pagehide`, debes recrearla en `pageshow`. Lo más simple es no destruirla. Sin ejecutar. [P]
- **Sin `lenis.css`.** `stop()` no bloquea el teclado, y hay otras diferencias: ver [`fun-css`](../01-fundamentos/fun-css.md) y [`cal-accesibilidad`](../07-calidad/cal-accesibilidad.md).
- **Versión sin fijar en el CDN.** Sin versión en la URL, una publicación nueva cambia tu sitio sin avisar. Fíjala, como en el ejemplo. [P]
