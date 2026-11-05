---
id: fun-instalacion
titulo: Instalar Lenis por las tres vías
capa: 01-fundamentos
tipo: guia
ambito: core
resumen: Mismo rango de versión por empaquetador, script clásico y módulos con import map. Rutas exactas probadas en Chrome, y trampas de CSS y Snap.
api: [Lenis, Snap, LenisOptions.autoRaf]
requiere: []
relacionadas: [fun-css, fun-licencia, com-raf, snp-snap]
etiquetas: [instalacion, cdn, importmap, empaquetador]
fuentes:
  - README.md
  - packages/snap/README.md
estado: verificado
version: 1.3.27
---
# Instalar Lenis

Todo viene en un único paquete npm: `lenis` incluye el núcleo, `lenis/snap`, `lenis/react`, `lenis/vue` y la hoja de estilos. Fija siempre la versión. [C]

Lo ejecutado consta en la [tabla de resultados](#resultado-de-las-pruebas), y lo demás se indica allí (laboratorio: Chrome 156 sobre página servida por HTTP local, con unpkg y jsDelivr reales; npm, esbuild, Vite y webpack 5.112; 2026-11-05).

## Pasos

### Vía 1: empaquetador

Con el gestor de paquetes que uses:

```bash
npm i lenis@1.3.27
```

```js fragmento
import Lenis from "lenis";
import Snap from "lenis/snap";
import "lenis/dist/lenis.css";

const lenis = new Lenis({ autoRaf: true });
```

| Importación | Resuelve a (`exports` de `package.json`) |
|---|---|
| `lenis` | `dist/lenis.mjs`, exportación por defecto |
| `lenis/snap` | `dist/lenis-snap.mjs`, exportación por defecto |
| `lenis/dist/lenis.css` | `dist/lenis.css`, por la regla `./dist/*` |

Con esbuild y Vite la compilación produjo JS y CSS. Con webpack hay una trampa: ver abajo.

### Vía 2: script clásico

```html
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.27/dist/lenis.css">
<script src="https://unpkg.com/lenis@1.3.27/dist/lenis.min.js"></script>
<script src="https://unpkg.com/lenis@1.3.27/dist/lenis-snap.min.js"></script>
<script>
  {
    const lenis = new Lenis({ autoRaf: true });
    const snap = new Snap(lenis);
  }
</script>
```

El bloque `{ }` evita un `const` global: incluir dos veces el mismo script daría `Identifier 'lenis' has already been declared`, y el segundo no correría. Con `defer`, o con un script que pueda llegar antes del DOM, usa `alEstarListo`: ver [`int-vanilla`](../06-integracion/int-vanilla.md).

Crea los globales `Lenis` y `Snap`. `lenis-snap.min.js` no depende del global `Lenis` para cargarse, así que el orden entre ambos es indiferente; solo hace falta `Lenis` al crear la instancia. Existen también las versiones sin minificar `dist/lenis.js` y `dist/lenis-snap.js`.

### Vía 3: módulos nativos con import map

```html
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.27/dist/lenis.css">
<script type="importmap">
{
  "imports": {
    "lenis": "https://unpkg.com/lenis@1.3.27/dist/lenis.mjs",
    "lenis/snap": "https://unpkg.com/lenis@1.3.27/dist/lenis-snap.mjs"
  }
}
</script>
<script type="module">
  import Lenis from "lenis";
  import Snap from "lenis/snap";

  const lenis = new Lenis({ autoRaf: true });
  const snap = new Snap(lenis);
</script>
```

También funcionó con `https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/...`. Esta vía no crea globales: `globalThis.Lenis` queda `undefined`. Sin import map, `import "lenis"` falla con `Failed to resolve module specifier`.

### Resultado de las pruebas

| Vía | Núcleo | `lenis.css` aplicada | `Snap` encaja a la rueda |
|---|---|---|---|
| Clásico, unpkg | Sí | Sí | Sí |
| Módulos con import map, unpkg | Sí | Sí, con `<link>` | Sí |
| Módulos con import map, jsDelivr | Sí | Sí, con `<link>` | Sí |
| Vite | Sí, en las apps de [`int-contrato`](../06-integracion/int-contrato.md), sin Snap | Sí | Instancia creada; rueda no probada |
| esbuild 0.28.2 | Sí, con las plantillas: ver [`plantillas`](../plantillas/README.md) | Emite la hoja | Sí |
| webpack, producción | Compila | **No**, salvo el arreglo de abajo | No probado |

### Autoalojar, integridad y CSP

Copiar `dist/` a tu servidor funciona en las vías 2 y 3, sin CDN. Con CDN, añade `integrity` y `crossorigin`. Los valores para 1.3.27, los archivos por vía y una política CSP probada están en [`plantillas`](../plantillas/README.md#integridad-y-autoalojar).

### Primer arranque común

Elige un reloj: `autoRaf: true` o tu propio bucle. Ver [`com-raf`](../04-comportamiento/com-raf.md). La versión cargada se lee en `window.lenis.version`.

```js
const lenis = new Lenis({ autoRaf: true });
const leida = window.lenis.version;
const estilos = [...document.styleSheets].some((h) => (h.href || "").includes("lenis.css"));
lenis.destroy();
// prueba: leida === "1.3.27" && estilos
```

## Trampas

- **Un empaquetador puede eliminar `lenis.css`, sin error.** Medido con webpack en producción. `package.json` declara `"sideEffects": false`, así que `import "lenis/dist/lenis.css"` se considera prescindible: la compilación termina bien y no genera CSS. Y sin esa hoja, `stop()` y `autoToggle` fallan. Corrige con `sideEffects: true` en la regla `test: /\.css$/`, comprobado, o con `<link>`. esbuild y Vite conservaron el CSS. (laboratorio)
- **`import "lenis/dist/lenis.css"` en módulos nativos falla:** `Failed to fetch dynamically imported module`. El navegador exige `with { type: "css" }` y una hoja construible. Usa `<link>`. (laboratorio)
- **Mezclar formatos.** `lenis.mjs` con `<script>` clásico da `Unexpected token 'export'`; `lenis.min.js` como módulo da `Cannot assign to read only property 'prototype'`. `.min.js` va con `<script>` y `.mjs` con `type="module"`. (laboratorio)
- **Olvidar `lenis/snap` en el import map.** Es una clave aparte. Un prefijo `"lenis/": ".../lenis@1.3.27/"` también resolvió en unpkg, por redirección del propio CDN; en otro servidor no valdría. Mejor clave explícita. (laboratorio)
- **Sin versión en la URL** obtienes la última: un cambio entra en producción sin que lo decidas. Fija `@1.3.27`, igual en todas las URL. [P]
- **`file://` no sirve para módulos.** Los `import` requieren HTTP(S). Sirve la página, aunque sea en local. [P]
- **`new Lenis` antes de que exista el contenedor.** Con `wrapper` nulo lanza `TypeError`: `Cannot read properties of null`. Crea la instancia después de tener el DOM. Ver [`opc-contenedores`](../02-opciones/opc-contenedores.md). [E]
- **El README enlaza `packages/core/lenis.css`.** Esa ruta es del repositorio; en npm y en el CDN es `dist/lenis.css`. [C]
