---
id: fra-agnostico
titulo: Contrato de integración de GSAP con cualquier tecnología
capa: 12-frameworks
tipo: patron
ambito: transversal
resumen: Entrar, cambiar y salir sobre lo que se anima (nodo, objeto o escena): adaptador montar(raiz), tabla de ganchos por tecnología, orden de ejecución, servidor y entornos sin window.
api: [gsap.context, gsap.Context.revert, gsap.Context.add, gsap.registerPlugin, ScrollTrigger.refresh, gsap.TweenVars.overwrite]
relacionadas: [fra-vanilla, fra-webcomponents, fra-canvas-webgl, fra-react-usegsap, fra-vue-nuxt, fra-svelte, fra-angular, fra-nextjs, nuc-context, nuc-limpieza, nuc-immediate-render, rec-salida, scr-refresh, cal-fouc]
etiquetas: [agnostico, ciclo-de-vida, limpieza, ssr, canvas, webgl, worker]
fuentes:
  - resources/frameworks.md
  - docs/v3/GSAP/gsap.context().md
  - https://github.com/greensock/gsap-skills
  - https://react.dev/reference/react/useLayoutEffect
  - https://vuejs.org/api/composition-api-lifecycle.html
  - https://svelte.dev/docs/svelte/lifecycle-hooks
  - https://angular.dev/api/core/afterNextRender
  - https://angular.dev/api/core/DestroyRef
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
  - https://docs.astro.build/en/guides/client-side-scripts/
  - https://docs.astro.build/en/guides/view-transitions/
  - https://docs.solidjs.com/reference/lifecycle/on-mount
  - https://docs.solidjs.com/reference/lifecycle/on-cleanup
  - https://lit.dev/docs/components/lifecycle/
  - https://htmx.org/events/
  - https://alpinejs.dev/globals/alpine-data
  - https://turbo.hotwired.dev/reference/events
  - https://livewire.laravel.com/docs/navigate
  - https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks
  - https://developer.wordpress.org/themes/customize-api/tools-for-improved-user-experience/
estado: verificado
version: 3.15.1
---
# Contrato de integración de GSAP con cualquier tecnología

GSAP necesita saber tres cosas de **lo que se anima**, sea un nodo, un objeto o una escena: cuándo entra, cuándo cambia y cuándo sale. Cada tecnología da nombres distintos a esos momentos; el contrato es siempre el mismo. Las demás fichas de esta capa solo lo traducen. [P]

## Problema

Una vista puede montarse, actualizarse, salir, volver o ver sustituidos sus nodos mientras GSAP sigue activo. Sin un contrato aparecen animaciones duplicadas, tweens sobre nodos muertos, saltos al actualizar, salidas que nunca se ven, posiciones de scroll viejas y recursos sin liberar.

## Solución

### a) El contrato: entrar, cambiar y salir

| Momento | Qué exige | Herramienta |
|---|---|---|
| **Entrar** | Que lo animado exista antes de crear las animaciones | `gsap.context(fn, raiz)` |
| **Cambiar** | Decidir si sigues desde el valor actual, reinicias o rehaces | [Apartado c](#c-cambiar-tres-respuestas) |
| **Salir** | Retener lo que se va mientras anima, y después limpiar | [rec-salida](../14-recetas/rec-salida.md), `ctx.revert()` |

"Lo que se anima" no siempre es DOM. En una escena de canvas o WebGL, entrar es crear los objetos y salir incluye liberar la GPU: ver [fra-canvas-webgl](fra-canvas-webgl.md).

1. **Registra los plugins una vez, en el ámbito del módulo.** Es inocuo en servidor: sin `window` el registro se pospone. Ver el apartado h. [C]
2. **Crea las animaciones cuando lo animado exista,** nunca en la evaluación del módulo ni durante el render. [O]
3. **Acótalas** con `gsap.context(fn, raiz)`: los selectores se buscan solo dentro de `raiz` y todo queda registrado. [O]
4. **Reviértelas al retirar la vista** con `ctx.revert()`. Quita listeners propios en la función de limpieza. [O]
5. **Refresca ScrollTrigger cuando cambie la altura** sin recrear triggers: `ScrollTrigger.refresh()`. [O]
6. **Separa lo animado de lo renderizado.** Si un render reescribe un nodo, anima un contenedor estable o una envoltura que el render no toque. [P]
7. **Si un render reemplaza nodos, vuelve a montar.** Desmonta antes del cambio y monta después: los tweens viejos apuntan a nodos muertos. [P]

La prueba de un buen contrato: `montar → desmontar → montar` debe dejar lo mismo que un solo `montar`. Ocurre de verdad si tu inicialización corre dos veces, por un script incluido dos veces, una recarga en caliente o un modo de desarrollo. Ver [immediateRender](../02-nucleo/nuc-immediate-render.md). [P]

### b) El adaptador

Una función de unas líneas, sin dependencias, que encaja en cualquier ciclo de vida:

```js
function crearMontaje(configurar) {
  return function montar(raiz) {
    const ctx = gsap.context((self) => configurar(raiz, self), raiz);
    let activo = true;
    return function desmontar() {
      if (activo) ctx.revert();
      activo = false;
    };
  };
}

const montar = crearMontaje((raiz) => {
  gsap.from(".pieza", { opacity: 0, x: -30, duration: 0.2 });
  gsap.to(raiz, { y: 10, scrollTrigger: { trigger: raiz, scrub: true } });

  const avisar = () => raiz.classList.toggle("tocada");
  raiz.addEventListener("click", avisar);
  return () => raiz.removeEventListener("click", avisar);
});

const raiz = document.querySelector(".vista");
const primera = document.createElement("div");
primera.className = "pieza";
raiz.appendChild(primera);

montar(raiz)();              // ciclo extra: montar y desmontar en seguida
const desmontar = montar(raiz);
const triggers = ScrollTrigger.getAll().length;

await new Promise((r) => setTimeout(r, 300));
const opacidad = getComputedStyle(primera).opacity;

raiz.click();
const marcada = raiz.classList.contains("tocada");
desmontar();
desmontar();                 // idempotente
raiz.click();
const sigueMarcada = raiz.classList.contains("tocada");
// prueba: triggers === 1 && opacidad === "1" && Math.round(gsap.getProperty(primera, "x")) === 0
// prueba: ScrollTrigger.getAll().length === 0
// prueba: marcada === true && sigueMarcada === true
```

La función de retorno de `configurar` se ejecuta al revertir: de ahí que el segundo clic ya no alterne la clase. [O]

### c) Cambiar: tres respuestas

Cuando cambia un dato, la vista sigue montada. Elige según lo que cambió: [P]

| Cambió | Respuesta | Efecto |
|---|---|---|
| Un valor continuo: progreso, posición, tema | Tween nuevo con `overwrite: "auto"`, dentro de `ctx.add()` | Sigue desde el valor actual, sin saltos, y se limpia con el resto |
| La animación debe volver a empezar | `ctx.revert()` y crear de nuevo | Parte del estado original |
| La estructura: otros nodos u objetos | Desmontar y montar | Todo se mide y selecciona de nuevo |

La diferencia entre las dos primeras se ve en el valor de partida. Con la barra en 100 y destino 200, sin revertir el tween va de 100 a 200; revirtiendo, de 0 a 200: [E]

```html
<div class="sin-revertir"></div>
<div class="revirtiendo"></div>
```

```js
const sigue = document.querySelector(".sin-revertir");
const rehace = document.querySelector(".revirtiendo");
gsap.set(sigue, { x: 0 });
gsap.set(rehace, { x: 0 });

const ctxSigue = gsap.context(() => { gsap.to(sigue, { x: 100, duration: 0.05 }); });
let ctxRehace = gsap.context(() => { gsap.to(rehace, { x: 100, duration: 0.05 }); });
await new Promise((r) => setTimeout(r, 150));

const nuevo = ctxSigue.add(() => gsap.to(sigue, { x: 200, duration: 1, ease: "none", overwrite: "auto", paused: true }));
ctxRehace.revert();
let rehecho;
ctxRehace = gsap.context(() => {
  rehecho = gsap.to(rehace, { x: 200, duration: 1, ease: "none", paused: true });
});

nuevo.progress(0.5);
rehecho.progress(0.5);
const mitades = [gsap.getProperty(sigue, "x"), gsap.getProperty(rehace, "x")];
ctxSigue.revert();
// prueba: mitades[0] === 150 && mitades[1] === 100
// prueba: gsap.getProperty(sigue, "x") === 0
```

Sin `ctx.add()`, un tween nacido de un cambio queda fuera del contexto y sobrevive a la retirada. Si el cambio llega muy a menudo, reutiliza [`quickTo`](../02-nucleo/nuc-quickto.md): lo grabado no sale del contexto hasta revertir. [E]

### Renders que reemplazan o reescriben nodos

Dos fallos distintos, con síntomas diferentes:

```html
<div class="lista"><span class="fila">a</span></div>
<div class="celda" style="color: red"></div>
```

```js
const lista = document.querySelector(".lista");
const vieja = lista.querySelector(".fila");
gsap.set(vieja, { x: 40 });

// Un render sustituye el contenido: el nodo nuevo no sabe nada de GSAP
lista.innerHTML = '<span class="fila">a</span>';
const nueva = lista.querySelector(".fila");

// Un render reescribe el atributo style: el nodo es el mismo, pero la caché de GSAP no se entera
const celda = document.querySelector(".celda");
gsap.set(celda, { x: 40 });
celda.setAttribute("style", "color: blue");
const cacheCelda = gsap.getProperty(celda, "x");
// prueba: gsap.getProperty(nueva, "x") === 0
// prueba: cacheCelda === 40 && celda.style.transform === ""
```

| Síntoma | Causa | Actuación |
|---|---|---|
| La animación deja de verse tras actualizar | Nodo sustituido | Desmonta y vuelve a montar, o conserva el nodo con una clave estable |
| El elemento vuelve a su sitio y luego salta | El render reescribió `style` | Anima una envoltura sin estilos gestionados, o usa `gsap.set(el, { clearProps: "transform" })` antes de animar |
| Hay duplicados | Se montó de nuevo sin desmontar | Guarda `desmontar` y llámalo siempre antes |
| Las posiciones de scroll fallan tras actualizar | Altura cambiada | `ScrollTrigger.refresh()` tras el cambio |

### d) Salir: animar y limpiar son dos pasos

Salir es una animación optativa; desmontar es obligatorio. Lo que se va se retiene hasta acabar, y solo entonces se quita y se limpia. El patrón completo, con corte a mitad de salida y reapertura, está en [rec-salida](../14-recetas/rec-salida.md). Cada `fra-*` indica en su tabla cómo se retiene el nodo. [P]

Conviene conocer el orden real, porque varía. En laboratorio, 2026-11-05, al salir de una ruta con transición:

| Tecnología | Orden |
|---|---|
| Vue, Angular | La limpieza corre **antes** de la salida: el nodo sigue, pero los valores de GSAP ya se deshicieron |
| SvelteKit con `onNavigate` | La navegación espera a la salida, y la limpieza corre **después** |

### e) Dónde conectar `montar` y `desmontar`

Consultado en la documentación oficial de cada tecnología el 2026-11-05. Solo figura lo verificado ese día.

| Tecnología | Montar | Desmontar | Nota |
|---|---|---|---|
| React | `useLayoutEffect`, o `useGSAP` | Retorno del efecto | Los efectos no corren en servidor. En desarrollo, Strict Mode añade un ciclo extra. Ver [fra-react-usegsap](fra-react-usegsap.md) |
| Vue | `onMounted` | `onBeforeUnmount` | No se llaman en SSR. Ver [fra-vue-nuxt](fra-vue-nuxt.md) |
| Svelte | `onMount`, `$effect` | Retorno de ambos | Solo con `onMount` síncrono. Ver [fra-svelte](fra-svelte.md) |
| Angular | `afterNextRender` | `inject(DestroyRef).onDestroy()` | Solo en navegador. Ver [fra-angular](fra-angular.md) |
| Web Components | `connectedCallback` | `disconnectedCallback` | Se llaman en cada inserción. Ver [fra-webcomponents](fra-webcomponents.md) |
| Lit | `firstUpdated` | `disconnectedCallback` | `connectedCallback` llega antes del render. Ver [fra-webcomponents](fra-webcomponents.md) |
| Solid | `onMount` | `onCleanup` dentro de `onMount` | El retorno de `onMount` **no** limpia. `onMount` no corre en servidor |
| Astro | `<script>` con un Custom Element y su `connectedCallback` | `disconnectedCallback` | El script se empaqueta y corre una vez por página |
| Astro con `<ClientRouter />` | Evento `astro:page-load` | Evento `astro:before-swap` | Los módulos no se reejecutan al navegar |
| htmx | `htmx.onLoad((elt) => …)` | Evento `htmx:beforeCleanupElement` | `onLoad` también corre al iniciar, sobre `body`. `detail.elt` es el nodo |
| Alpine | `init()` en `Alpine.data`, con `this.$nextTick` | `destroy()` | `init()` corre antes de renderizar. `this.$el` es el nodo |
| Canvas, WebGL | Al crear la escena | Liberar la GPU además de revertir | Ver [fra-canvas-webgl](fra-canvas-webgl.md) |
| PHP, CMS, plantillas | `alEstarListo` (abajo) | Nada, si la página entera se descarta | Ver [fra-vanilla](fra-vanilla.md) |
| Turbo | Evento `turbo:load` | Evento `turbo:before-cache` | Conserva `body` en caché: revierte antes o volverá con estilos a medias [P] |
| Livewire con `wire:navigate` | Evento `livewire:navigated` | Evento `livewire:navigating` | `DOMContentLoaded` solo se dispara en la primera visita |
| Editor de temas de Shopify | Evento `shopify:section:load`, con `event.target` | Evento `shopify:section:unload` | Las secciones se rerenderizan sin recargar |
| Personalizador de WordPress | `partial-content-rendered` en `wp.customize.selectiveRefresh` | Sin equivalente documentado | Vuelve a montar sobre el contenido parcial |

Turbo, Livewire y los editores no se han ejecutado: sus filas salen de su documentación. "La página se descarta" solo vale si de verdad recarga: un editor visual o una navegación sin recarga la mantienen viva. [P]

`DOMContentLoaded` **no se dispara para quien llega tarde**: un script `async`, un gestor de etiquetas o un optimizador que retrasa el JavaScript registran el listener cuando ya pasó, y no ocurre nada. Comprueba `document.readyState`: [E]

```js
function alEstarListo(fn) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
  else fn();
}

if (document.readyState !== "complete") await new Promise((r) => addEventListener("load", r));
let ingenuo = 0;
let seguro = 0;
document.addEventListener("DOMContentLoaded", () => { ingenuo++; });
alEstarListo(() => { seguro++; });
// prueba: ingenuo === 0 && seguro === 1
```

Forma mínima, con cualquier par de ganchos:

```js fragmento
let desmontar;
alEntrar(() => { desmontar = montar(nodoRaiz); });
alSalir(() => desmontar?.());
```

### f) Orden de ejecución y DOM diferido

- **El DOM se actualiza después de tu código.** Muchas tecnologías aplican los cambios más tarde. Un `Flip.from()` lanzado justo tras cambiar el estado mide el DOM viejo y no anima: en laboratorio dio 0 px de recorrido con Vue, Svelte y Angular, y 23 a 30 px esperando a la actualización. Cada `fra-*` indica cómo esperar. [P]
- **El orden entre padre e hijos no es universal.** En laboratorio, los hijos arrancan antes que el padre en Vue (`onMounted`) y Svelte (`onMount`), y después en Angular (`afterNextRender`). No hagas que un hijo dependa de lo que el padre crea al arrancar: el padre crea el timeline y los hijos aportan sus partes cuando lo reciben, como en [timelines anidadas](../03-timeline/tim-anidado.md). [P]
- **Una vista que persiste no desmonta.** Lo que vive en una plantilla común a varias rutas sigue montado al navegar: sus ScrollTrigger siguen vivos con medidas viejas. Llama a `ScrollTrigger.refresh()` al cambiar de ruta. Sin ejecutar. [P]
- **Hidratación.** El HTML del servidor se ve antes de que corra tu código, y lo que hagas al hidratar llega sobre contenido ya pintado: oculta en CSS lo que anima de entrada ([cal-fouc](../13-calidad/cal-fouc.md)). Las imágenes y fuentes pueden llegar después: refresca ScrollTrigger tras cargarlas. [O]

### g) Lo que se anima sin DOM

GSAP anima propiedades numéricas de cualquier objeto: `onUpdate` o un render en `gsap.ticker` son el puente con el motor de dibujo. Bucle, color, uniforms, tamaño, pausa y liberación de recursos están en [fra-canvas-webgl](fra-canvas-webgl.md). [O]

**Qué exige DOM.** Comprobado leyendo cada `src/*.js`, y con los bloques indicados.

| Funciona con objetos normales | Exige elementos del DOM |
|---|---|
| Núcleo, `gsap.utils`, `snap`, `modifiers`, `roundProps`, `endArray` | `CSSPlugin` (solo si el objetivo es un elemento), `attr` |
| `CustomEase`, `CustomBounce`, `CustomWiggle`, `EasePack` | `ScrollTrigger`, `ScrollSmoother`, `ScrollToPlugin`, `Observer` |
| `Physics2DPlugin`, `PhysicsPropsPlugin` [E] | `Draggable`, `Flip`, `SplitText`, `TextPlugin`, `ScrambleTextPlugin` |
| `MotionPathPlugin` con ruta de puntos [E] | `DrawSVGPlugin`, `MorphSVGPlugin`, `CSSRulePlugin` |
| `InertiaPlugin`, con `velocity` explícita [E] | `GSDevTools`, `MotionPathHelper` |
| `PixiPlugin`, `EaselPlugin`, sobre sus objetos | |

La demostración con plugins y sus límites están en [objetivos](../01-fundamentos/fun-objetivos.md).

### h) Servidor, trabajadores y entornos sin `window`

Probado con Node 27 (versión alfa) y gsap 3.15.1, `dist/*.js` y ESM, y en un `Worker` real de Chrome 156, el 2026-11-05, fuera de `probar_bloques.py`. [E]

| En Node, sin `window` | Resultado |
|---|---|
| Importar `gsap` y los 24 plugins | Correcto, en CommonJS y ESM (`index.js`, `ScrollTrigger.js`, `SplitText.js`) |
| `gsap.registerPlugin(...)` con los 24 | Correcto: sin `window` se encola salvo los `headless` [C] |
| Tween de objeto, `onUpdate`, `onComplete` | Correcto: el ticker funciona con temporizador |
| `snap`, `modifiers`, `endArray`, `CustomEase`, `gsap.utils`, `parseEase` | Correcto |
| `gsap.context()` con objetos | Correcto |
| `physics2D`, `physicsProps`, `motionPath` | **Sin efecto**: `Invalid property … Missing plugin?`, porque siguen en la cola |
| `gsap.parseEase("rough")` | `undefined`: `EasePack` no quedó activo |
| `gsap.to(".selector")` | **Lanza** `Cannot read properties of undefined (reading 'querySelectorAll')` |
| `gsap.matchMedia().add()` | **Lanza** al leer `matchMedia` |
| `ScrollTrigger.create()`, `Flip.getState()`, `SplitText.create()` | **Lanzan** |

La regla práctica: importar y registrar es seguro; **ejecutar animaciones con selectores, medir o crear instancias de plugins de DOM no lo es**. Por eso esas llamadas van en el `montar`, que solo corre en cliente.

**En un `Worker`** con `importScripts("gsap.min.js")`, la versión UMD crea `self.window = {}` y deja GSAP en `self.window.gsap`: `self.gsap` es `undefined`. Un tween de objeto completó su duración de 0,1 s con 7 actualizaciones. Sirve para calcular y enviar valores con `postMessage`, o con un canvas transferido; sin `document`, no toca el DOM. No se probó OffscreenCanvas.

## Trampas

- **GSAP escribe `_gsap` en el objeto animado.** Es una propiedad enumerable y circular: `JSON.stringify(objeto)` lanza un `TypeError` (`Converting circular structure` en V8, `cyclic object value` en Firefox), y `Object.keys` la lista. No animes directamente un objeto de estado serializable: anima un proxy y copia en `onUpdate`. [E]

```js
const estado = { nivel: 0 };
gsap.to(estado, { nivel: 1, duration: 0.05 });
await new Promise((r) => setTimeout(r, 200));

let fallo = null;
try { JSON.stringify(estado); } catch (e) { fallo = e; }
const claves = Object.keys(estado).join();
// prueba: fallo instanceof TypeError && claves === "nivel,_gsap"
```

- **Limpieza que no se llama.** Si tu tecnología retira nodos sin avisar, una vista nunca desmontada conserva sus tweens y ScrollTriggers. Comprueba `ScrollTrigger.getAll().length` tras navegar. [P]
- **Montar antes de tener los hijos.** Si los datos llegan después, el selector no encuentra nada: monta tras el render que los trae, o vuelve a montar. [P]
- **Código asíncrono en `configurar`.** Lo creado tras un `await` queda fuera del contexto. Usa `self.add()` en la continuación. [C]
- **Contenido del servidor.** El HTML llega sin los estados iniciales de GSAP. Ver [cal-fouc](../13-calidad/cal-fouc.md). [P]
- **Estado reactivo.** Guardar tweens en un sistema reactivo basado en proxies puede interferir: usa variables normales. [P]
