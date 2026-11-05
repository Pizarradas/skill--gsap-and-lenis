# Plantillas

Código listo para copiar a un proyecto, con o sin empaquetador. Cada plantilla es un archivo sin más dependencia que `lenis` (y `lenis/snap` en `seccionesSnap`), y sigue el mismo contrato:

```js fragmento
const { lenis, limpiar: terminar } = iniciarScroll();
const limpiar = barraProgreso(raiz.querySelector(".barra"), { lenis });
// ...
limpiar();   // al retirar la vista
terminar();  // al retirar el scroll
```

- **Devuelve una función de limpieza.** Tras llamarla no quedan listeners, observadores, clases ni estilos o atributos añadidos. Llamarla dos veces no hace nada. La excepción es `iniciarScroll`, que devuelve `{ lenis, limpiar }`.
- **Recibe la instancia o la crea.** Con `opciones.lenis` la usa y la deja viva. Sin ella crea una con `autoRaf: true` y la destruye al limpiar. Si combinas varias plantillas, pásales la misma: dos instancias sobre la ventana compiten por el scroll.
- **`objetivo`** acepta elemento o selector, y lista donde tiene sentido. Un selector busca en todo el documento y no atraviesa Shadow DOM: allí pasa elementos. Si no encuentra el objetivo, lanza `TypeError`.
- **Respeta `prefers-reduced-motion`,** según su receta. Las que aplican movimiento propio responden si la preferencia cambia.
- **Se llama en cliente,** con el DOM presente: `new Lenis()` usa `window` nada más crearse.

## Catálogo

| Plantilla | Receta | Con movimiento reducido |
|---|---|---|
| `iniciarScroll.js` | [Instancia y bucle](../06-integracion/int-contrato.md) | Lo decide Lenis |
| `barraProgreso.js` | [Barra de progreso](../08-recetas/rec-barra-progreso.md) | Sigue informando |
| `bloqueoModal.js` | [Modal](../08-recetas/rec-modal.md) | Igual: no anima nada |
| `menuAnclas.js` | [Menú de anclas](../08-recetas/rec-menu-anclas.md) | Salto inmediato, mismo foco |
| `navDireccion.js` | [Cabecera por dirección](../08-recetas/rec-nav-direccion.md) | Cambia la clase; anula la transición en CSS |
| `seccionesSnap.js` | [Secciones](../08-recetas/rec-secciones-snap.md) | Sin ajuste |
| `parallax.js` | [Parallax](../08-recetas/rec-parallax.md) | Sin desplazamiento |
| `scrollHorizontal.js` | [Horizontal](../08-recetas/rec-horizontal.md) | Carrusel nativo |
| `sincronizarCanvas.js` | [Canvas](../08-recetas/rec-canvas-sync.md) | Sigue al scroll, sin bucle propio |
| `botonArriba.js` | [Volver arriba](../08-recetas/rec-scroll-to-top.md) | Salto inmediato |
| `navegacionScroll.js` | [Cambio de vista](../08-recetas/rec-navegacion.md) | Igual: ya es inmediato |

## Opciones

| Plantilla | Opciones (valor por defecto) |
|---|---|
| `iniciarScroll` | Las de Lenis, más `bucle` (`"propio"`; función de reloj externo, o `false`). `autoRaf` se ignora: lo fija `bucle` |
| `barraProgreso` | `lenis`, `eje` ("x") |
| `bloqueoModal` | `lenis`. Devuelve además `abrir()` y `cerrar()` |
| `menuAnclas` | `lenis`, `desplazamiento` (0), `duracion`, `actualizarUrl` (true), `linea` (0.33). Devuelve además `actualizar()` |
| `navDireccion` | `lenis`, `clase` ("nav-oculta"), `umbral` (8), `margen` (80) |
| `seccionesSnap` | `lenis`, `tipo` ("proximity"), `alinear` ("start"), `espera` (500), `umbral`, `duracion`, `alAjustar`. Devuelve además `actualizar()` y `snap()` |
| `parallax` | `lenis`, `velocidad` (0.2). Por elemento: `data-velocidad`. Devuelve además `actualizar()` |
| `scrollHorizontal` | `lenis`, `pista` (primer hijo). Devuelve además `actualizar()` |
| `sincronizarCanvas` | `dibujar` (obligatoria), `contexto` ("2d"; "webgl", "webgl2" o `null` si el canvas es de un motor), `lenis`, `densidadMaxima` (2). Devuelve además `redibujar()` |
| `botonArriba` | `lenis`, `umbral` (600), `foco` (primer `main`), `duracion` |
| `navegacionScroll` | `lenis`, `clave` (ruta y consulta). Devuelve además `antes()` y `despues()` |

El detalle está en el JSDoc de cada archivo, y las trampas, en su receta.

## Copiar a un proyecto

Elige la vía por cómo llega tu JavaScript al navegador.

| Vía | Copia | Carga Lenis con | Llamas a |
|---|---|---|---|
| Empaquetador | `plantillas/<nombre>.js` | Tu gestor de paquetes: `npm i lenis@1.3.27`, o su equivalente | `import { nombre } from "./<nombre>.js"` |
| `<script>` clásico | `plantillas/globales/<nombre>.js` | `dist/lenis.min.js`, y `dist/lenis-snap.min.js` si la plantilla lo usa, antes | `Plantillas.nombre(...)` |
| Módulos nativos | `plantillas/<nombre>.js`, sin tocarlo | import map, con `lenis` y `lenis/snap` | `import { nombre } from "./<nombre>.js"` |

Copia solo ese archivo: `.html` y `.prueba.js` son del arnés de pruebas. No edites las copias de `globales/`: las genera `herramientas/plantillas_globales.py` y llevan en la cabecera lo que debes cargar antes. Cargar `plantillas/<nombre>.js` con `<script>` clásico da `Cannot use import statement outside a module`. Quitar a mano `import` y `export` es frágil: si queda un `export`, el script entero falla con `Unexpected token 'export'`.

En las tres vías carga `lenis.css`: aporta `overflow: clip` al detener el scroll, entre otras reglas. Ver [CSS](../01-fundamentos/fun-css.md).

Las tres vías se ejecutaron en Chrome 156 real con `iniciarScroll`, `barraProgreso` y `seccionesSnap`, rueda real y las copias tal como están aquí: empaquetador con esbuild 0.28.2, clásico y módulos con unpkg, y las dos sin empaquetar autoalojadas. Las cinco dieron lo mismo: scroll en la segunda sección, en 700, barra en `scaleX(0.5)` y `overflow: clip` al detener. Los dos bloques de abajo se ejecutaron literales, con su `integrity`, y el clásico también incluido dos veces. Otros empaquetadores: ver [instalación](../01-fundamentos/fun-instalacion.md) (laboratorio, 2026-11-05).

Con empaquetador:

```js fragmento
import "lenis/dist/lenis.css";
import { iniciarScroll } from "./scroll/iniciarScroll.js";
import { barraProgreso } from "./scroll/barraProgreso.js";

const { lenis, limpiar: terminar } = iniciarScroll();
const limpiar = barraProgreso(raiz.querySelector(".barra"), { lenis });
```

Con `<script>` clásico:

```text
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.27/dist/lenis.css"
      integrity="sha384-gvLq/iOMNnPchdosgVym5huSVkKipHCQaqSw2Eg0V52Mzmlf169ZOsXcNc2cNu8x" crossorigin="anonymous">
<script src="https://unpkg.com/lenis@1.3.27/dist/lenis.min.js"
        integrity="sha384-R18XzqnxvVLEF+BYfhpmDx30v7eP83fAckyfoRzK7/Uf6nGqufcmsk0eAKo7S3RU" crossorigin="anonymous"></script>
<script src="/js/iniciarScroll.js"></script>
<script src="/js/barraProgreso.js"></script>
<script>
  {
    function alEstarListo(fn) {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
      else fn();
    }
    alEstarListo(() => {
      window.salirDelScroll?.();
      const raiz = document.querySelector("#vista");
      const { lenis, limpiar: terminar } = Plantillas.iniciarScroll();
      const limpiar = Plantillas.barraProgreso(raiz.querySelector(".barra"), { lenis });
      window.salirDelScroll = () => { limpiar(); terminar(); };
    });
  }
</script>
```

El bloque `{ }` evita los `const` globales: incluir dos veces un script con `const lenis` en la raíz da `Identifier 'lenis' has already been declared` y el segundo no se ejecuta. `salirDelScroll` evita dos instancias si el script entra dos veces. Un script tardío no recibe `DOMContentLoaded`: de ahí `alEstarListo`. Ver [`int-vanilla`](../06-integracion/int-vanilla.md).

Con módulos nativos:

```text
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.27/dist/lenis.css"
      integrity="sha384-gvLq/iOMNnPchdosgVym5huSVkKipHCQaqSw2Eg0V52Mzmlf169ZOsXcNc2cNu8x" crossorigin="anonymous">
<script type="importmap">
{
  "imports": {
    "lenis": "https://unpkg.com/lenis@1.3.27/dist/lenis.mjs",
    "lenis/snap": "https://unpkg.com/lenis@1.3.27/dist/lenis-snap.mjs"
  },
  "integrity": {
    "https://unpkg.com/lenis@1.3.27/dist/lenis.mjs": "sha384-sh2UAgCT70jxAYOIxzVdzkb3IjUXlL2L4XDT5l4h9AGvQuleyOvKxOvbDQr6wMG1",
    "https://unpkg.com/lenis@1.3.27/dist/lenis-snap.mjs": "sha384-i+aw8DJFWhNs6hrDj3gM1Cs2Ou0fdoZBxmFLnFC/7hVvGmpSaAMaZt3uLi4rJooZ"
  }
}
</script>
<script type="module">
  import { iniciarScroll } from "/js/iniciarScroll.js";
  import { barraProgreso } from "/js/barraProgreso.js";

  const raiz = document.querySelector("#vista");
  const { lenis, limpiar: terminar } = iniciarScroll();
  const limpiar = barraProgreso(raiz.querySelector(".barra"), { lenis });
</script>
```

Un módulo se evalúa una sola vez y sus `const` no son globales: esta vía no necesita bloque. Al retirar la vista, en el punto que ofrezca tu tecnología, llama a `limpiar()`, y a `terminar()` cuando deba desaparecer el scroll. Dónde conectar ambos puntos: [contrato de integración](../06-integracion/int-contrato.md).

### Integridad y autoalojar

Los `integrity` de arriba son de `lenis@1.3.27`, calculados sobre el paquete de npm: unpkg y jsDelivr sirvieron esos mismos bytes para `lenis.min.js`, `lenis-snap.min.js`, `lenis.mjs`, `lenis-snap.mjs` y `lenis.css` (comprobado el 2026-11-05). Con otra versión, recalcúlalos: `openssl dgst -sha384 -binary lenis.min.js | base64`. Un `integrity` que no coincide bloquea el archivo y Lenis no llega a existir: fija siempre la versión exacta. `crossorigin="anonymous"` es obligatorio con `integrity` en otro origen.

| Archivo | `integrity` |
|---|---|
| `lenis-snap.min.js` | `sha384-oq0TWGBcl0kQ4r07ikUsxvFYrNOoNpeM/mZPXt5FVZJuDS/l0bjZRlBqgKM3fEcg` |

Para **autoalojar**, copia de `node_modules/lenis/dist/` a tu servidor los archivos de la tabla y cambia las URL: sin CDN, sin `integrity` ni `crossorigin`.

| Vía | Archivos |
|---|---|
| `<script>` clásico | `lenis.min.js`, `lenis-snap.min.js` si usas Snap, `lenis.css` |
| Módulos nativos | `lenis.mjs`, `lenis-snap.mjs` si usas Snap, `lenis.css` |

Con **CSP**, autoalojar permite una política sin orígenes externos. En laboratorio, las vías clásica y de módulos funcionaron con `default-src 'none'; script-src 'self'; style-src 'self'`, con el JavaScript de la página en archivos propios y sin violaciones. Un import map en línea es un script en línea: añade su hash a `script-src`, `'sha256-...'`, calculado sobre el texto exacto del bloque. Los estilos que escriben Lenis y las plantillas van por CSSOM, y la hoja que `iniciarScroll` adopta en una sombra se aplicó con esa misma `style-src`. Con CDN, sin ejecutar: la política debería incluir su origen en `script-src` y `style-src`.

### Se recrea la instancia

Una plantilla sigue atada a la instancia que recibió. Si un envoltorio recrea Lenis, por ejemplo al cambiar una opción, la plantilla se queda escuchando a la instancia destruida, sin error: la barra se congela en su último valor. [E, en `barraProgreso`]

Limpia y vuelve a llamar con la nueva instancia, en el punto en que tu tecnología te la entrega:

```js fragmento
let limpiar;
function alCambiarInstancia(lenis) {
  limpiar?.();
  limpiar = lenis ? barraProgreso(".barra", { lenis }) : undefined;
}
```

Cómo obtener la instancia de un envoltorio: `useLenis()` o `ref.current.lenis` en [`int-react`](../06-integracion/int-react.md), y `lenisRef.value.lenis` en [`int-vue-nuxt`](../06-integracion/int-vue-nuxt.md). Puede valer `undefined` al principio: por eso `alCambiarInstancia` lo comprueba. Sin ejecutar con esos envoltorios: la prueba usa instancias de `Lenis`.

## Cuando cambia el contenido

Lenis mide con `ResizeObserver` y una espera de 250 ms, pero ese reajuste no emite `scroll`: lo que dependa del evento no se entera. En Chrome real, al crecer el contenido 2000 px, `limit` cambió y hubo 0 emisiones (laboratorio, 2026-11-05).

| Cambio | Plantillas | Qué hacer |
|---|---|---|
| Cambia la altura | `iniciarScroll` | Nada, o `lenis.resize()` si necesitas el dato ya. [E] |
| Cambia la altura | `barraProgreso` | `limpiar.actualizar()`. [E] |
| Cambian las posiciones | `parallax`, `menuAnclas` | `limpiar.actualizar()`. [E] en `parallax` |
| Cambia la lista | `seccionesSnap` | Función o elemento como objetivo, y `limpiar.actualizar()`. [E] |
| Elementos nuevos | `parallax` | Una llamada más para los nuevos, y guarda todas las limpiezas. [P] |
| Enlaces nuevos | `menuAnclas` | Nada: usa delegación. [E] |
| Cambia el ancho de la pista | `scrollHorizontal` | Nada, por `ResizeObserver`, o `limpiar.actualizar()`. [E] |
| Cambia el tamaño | `sincronizarCanvas` | Nada, por `ResizeObserver` |
| Cambian tus datos | `sincronizarCanvas` | `limpiar.redibujar()`. [E] |
| Cambia la vista | `navegacionScroll` | `limpiar.antes()` y `limpiar.despues()`. [E] |
| Se sustituye el elemento | `barraProgreso`, `bloqueoModal`, `navDireccion`, `botonArriba` | Limpia y llama de nuevo. [P] |
| Se recrea la instancia | Todas las que reciben `lenis` | Limpia y llama de nuevo con la nueva: ver [arriba](#se-recrea-la-instancia). [E] en `barraProgreso` |
| Cambia el tamaño del contenedor | `parallax`, `scrollHorizontal`, `seccionesSnap` | Nada: observan `lenis.rootElement` si `wrapper` es un contenedor. Laboratorio |

## Requisitos de marcado y CSS

| Plantilla | Hace falta |
|---|---|
| `bloqueoModal` | Un `<dialog>`. Marca `overflow: auto` en él o en un hijo |
| `scrollHorizontal` | Pista con `display: flex` y `width: max-content`, hijos con `flex: none`, altura igual a la vista |
| `sincronizarCanvas` | Canvas con tamaño fijado por CSS. Con un motor, `contexto: null` |
| `parallax` | Padre con `overflow: hidden` si el elemento no debe salirse |
| `navDireccion` | Regla CSS para `clase`, con su `transition` anulada en `prefers-reduced-motion` |

## Contenedor

Las once plantillas funcionan con `wrapper` en un contenedor: crea la instancia con `iniciarScroll({ wrapper, content })` y pásala como `lenis`. Sin `lenis`, crean una sobre la ventana. Cada prueba cubre este caso con el `overflow` en una hoja de estilo, no en línea, porque `lenis.css` solo le gana a una hoja. [E]

| Plantilla | Qué cambia en un contenedor |
|---|---|
| `bloqueoModal` | Fija el contenedor con `overflow: hidden` en línea y bloquea también `<html>`: `stop()` no alcanza la ventana. Mientras, desaparece la barra de la ventana: en laboratorio, el ancho útil pasó de 985 a 1000 px. Si te molesta, reserva el hueco con `scrollbar-gutter: stable` en tu CSS (sin ejecutar) |
| `navegacionScroll` | No toca `history.scrollRestoration`, que es de la ventana. Pasa como objetivo la vista interior |
| `parallax`, `scrollHorizontal`, `seccionesSnap` | Observan `lenis.rootElement`, porque un contenedor cambia de tamaño sin que cambie la ventana |
| Las demás | Nada |

Fuera de las plantillas, `lenis.stop()` a secas en un contenedor con `overflow` en hoja lo lleva a `scrollTop` 0: ver [parar](../04-comportamiento/com-stop-start.md).

## Shadow DOM

Cada plantilla se prueba con su objetivo dentro de una sombra abierta. Puntos clave, todos ejecutados:

- `lenis.css` no atraviesa la sombra. Si `wrapper` o `content` viven en una, `iniciarScroll` adopta en esa raíz el CSS mínimo y lo retira al limpiar. Con `new Lenis()` directo, copia esas reglas.
- Con el anfitrión como `wrapper` y el contenido en su sombra, las clases `lenis` van en el anfitrión y `.lenis [data-lenis-prevent]` no llega dentro. El CSS adoptado añade `:host(.lenis) [data-lenis-prevent]` y sus equivalentes.
- `lenis.scrollTo("#id")` usa `document.getElementById` y no alcanza la sombra. `menuAnclas` y `navegacionScroll` buscan con `getRootNode()` y pasan el elemento.
- `menuAnclas` sube por los anfitriones: un menú en una sombra alcanza secciones de fuera. Lee el clic con `composedPath()`, así que también ve un enlace en la sombra de un hijo del menú. Ese enlace funciona, pero `aria-current` solo marca los del árbol del menú. Un menú fuera no alcanza secciones dentro de una sombra: sin solución en la plantilla.
- `data-lenis-prevent` funciona dentro de la sombra, porque Lenis lee `composedPath()`.
- Sin cubrir: `wrapper` en la ventana con el contenido en una sombra. `:host-context()` no está en todos los navegadores, así que `overscroll-behavior` no se adopta en ese caso. Con sombra cerrada, sin ejecutar.

## Pruebas

```bash
cd herramientas
python3 probar_bloques.py --plantillas --capa 08-recetas
python3 plantillas_globales.py            # regenera globales/ tras editar una plantilla
python3 plantillas_globales.py --comprobar # falla si alguna copia está desfasada
python3 plantillas_globales.py --probar    # pasa cada .prueba.js contra su copia global
```

El arnés concatena `<nombre>.js` y `<nombre>.prueba.js`, quita `import`/`export` y ejecuta en Chrome real con el DOM de `<nombre>.html`. Las aserciones son los comentarios `// prueba: <expr>`, evaluados 700 ms después de que termine el bloque.

Cada prueba usa gestos reales (`rueda()`, `toque()`) y cubre la rama normal, la reducida (simulando `window.matchMedia`), un contenedor con `overflow` en hoja, Shadow DOM, el cambio de contenido y la limpieza. Esta última registra cada `addEventListener` y `ResizeObserver`, y exige que no quede ninguno.

Límites conocidos:

- El arnés no dispara la transición de `autoToggle`: `bloqueoModal` comprueba solo el estilo en línea; la carrera con `stop()` y `start()` se vio en laboratorio.
- `ResizeObserver` no llega de forma fiable en iframes fuera de pantalla: por eso las pruebas usan `actualizar()` y `redibujar()`, y `avisarTamano()` entrega el aviso del contenedor a su observador. Con rAF real, el aviso del contenedor se comprobó en laboratorio. La rama automática de `sincronizarCanvas` y del ancho de pista queda sin ejecutar.
- El foco real puede robarlo otra prueba en paralelo. `navDireccion` usa `focusin` sintético para la parte sostenida en el tiempo.
- El cambio de preferencia se simula con un doble de `matchMedia`.
