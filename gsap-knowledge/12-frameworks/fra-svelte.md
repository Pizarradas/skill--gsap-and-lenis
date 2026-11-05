---
id: fra-svelte
titulo: GSAP en Svelte 5 y SvelteKit
capa: 12-frameworks
tipo: guia
ambito: transversal
resumen: Entrar, cambiar y salir en Svelte 5 y SvelteKit: onMount, $effect, transiciones gobernadas por GSAP, Flip con tick y onNavigate, probados en app real.
api: [gsap.context, gsap.Context.revert, gsap.Context.add, gsap.registerPlugin, Flip.getState, Flip.from, Animation.progress]
requiere: [fra-agnostico]
relacionadas: [nuc-context, cal-fouc, rec-salida, int-flip]
etiquetas: [svelte, sveltekit, ssr]
fuentes:
  - resources/frameworks.md
  - https://github.com/greensock/gsap-skills
  - https://svelte.dev/docs/svelte/lifecycle-hooks
  - https://svelte.dev/docs/svelte/$effect
  - https://svelte.dev/docs/svelte/transition
  - https://svelte.dev/docs/svelte/svelte
  - https://svelte.dev/docs/svelte/@attach
  - https://svelte.dev/docs/kit/$app-navigation
estado: verificado
version: 3.15.1
---
# GSAP en Svelte 5 y SvelteKit

Traducción del [contrato común](fra-agnostico.md) a Svelte. En Svelte, `onMount` y `$effect` no se ejecutan en servidor, así que el ciclo de vida ya resuelve el SSR.

Consultado el 2026-11-05: npm publica Svelte 5.57.3. **Laboratorio del mismo día:** app real con Svelte 5.57.3, SvelteKit 3.1.1 y Vite 8.3.6, gsap 3.15.1 y Chrome 156, sin pasar por el arnés: montaje, cambio, evento, salida, Flip, ruta y limpieza (fuentes en `_notas/contrato-lab/svelte/`). Se compiló con `ssr = false`: el renderizado en servidor **no** se ejecutó.

| Cambio | Evento | Salida | Flip tras actualizar | Ruta |
|---|---|---|---|---|
| `$effect` y `ctx.add()` | `ctx.add()` en el manejador | `out:` con `tick` que gobierna un tween pausado | `Flip.getState()`, cambio, `await tick()`, `Flip.from()` | `onNavigate` que devuelve una promesa, y `afterNavigate` para entrar |

## Pasos

### 1. Componente

```svelte
<script>
  import { onMount } from "svelte";
  import gsap from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";

  gsap.registerPlugin(ScrollTrigger);

  let raiz;

  onMount(() => {
    const ctx = gsap.context(() => {
      gsap.from(".pieza", { y: 20, autoAlpha: 0, stagger: 0.1 });
      gsap.to(".fondo", {
        yPercent: 15,
        ease: "none",
        scrollTrigger: { trigger: raiz, scrub: true },
      });
    }, raiz);

    return () => ctx.revert();
  });
</script>

<section bind:this={raiz}>
  <div class="fondo"></div>
  <div class="pieza">Uno</div>
  <div class="pieza">Dos</div>
</section>
```

`bind:this` da el nodo, disponible dentro de `onMount` y `$effect`. La función que devuelve `onMount` se llama al desmontar.

### 2. Reaccionar a estado con `$effect`

Un `$effect` corre tras montar y tras cada actualización del DOM. Su función de retorno se ejecuta antes de cada nueva ejecución, y al destruirse. Devolver `ctx.revert()` hace que cada cambio **reinicie** desde el estado original:

```svelte
<script>
  import gsap from "gsap";

  let { valor = 0 } = $props();
  let barra;

  $effect(() => {
    const ctx = gsap.context(() => {
      gsap.to(barra, { scaleX: valor / 100, duration: 0.3 });
    });
    return () => ctx.revert();
  });
</script>

<div bind:this={barra} class="barra"></div>
```

Para seguir desde el valor actual, conserva un único contexto creado en `onMount` y usa `ctx.add()` dentro de un `$effect` declarado **después** del `onMount`. En laboratorio, una barra que iba a 1 y recibió 0,2 siguió desde su valor sin saltos. Solo se rastrea el estado leído de forma síncrona: un valor leído tras `await` no cuenta.

```js fragmento
$effect(() => {
  const v = valor;
  ctx?.add(() => gsap.to(".barra", { scaleX: v / 100, overwrite: "auto" }));
});

function pulsar() {
  ctx.add(() => gsap.to(".boton", { rotation: "+=90" }));   // evento
}
```

### 3. Acción reutilizable

Las acciones reciben el nodo y devuelven `destroy`, lo que encaja con el contexto. Desde Svelte 5.29, `{@attach fn}` hace lo mismo y además es reactivo: `fn` recibe el nodo y devuelve la limpieza. Los dos revirtieron al salir de la ruta en laboratorio.

```js fragmento
export function aparecer(nodo, opciones = {}) {
  const ctx = gsap.context(() => {
    gsap.from(nodo, { autoAlpha: 0, y: 20, ...opciones });
  }, nodo);

  return { destroy: () => ctx.revert() };
}
```

```svelte
<script>
  import { aparecer } from "./aparecer.js";
</script>

<h2 use:aparecer={{ duration: 0.4 }}>Título</h2>
```

### 4. Salida

Svelte retiene el nodo mientras dura una transición, pero no espera promesas externas. La forma directa es que **Svelte marque el tiempo y GSAP pinte**: un tween pausado que `tick` recorre. En laboratorio, el nodo siguió en el DOM a mitad y se fue al acabar.

```svelte
<script>
  import gsap from "gsap";

  let { visible = true } = $props();

  function salidaGsap(nodo) {
    const animacion = gsap.to(nodo, { autoAlpha: 0, y: -10, duration: 0.2, ease: "none", paused: true });
    return { duration: animacion.duration() * 1000, tick: (t) => animacion.progress(1 - t) };
  }
</script>

{#if visible}<div class="aviso" out:salidaGsap>Guardado</div>{/if}
```

En salida `t` baja de 1 a 0, de ahí `1 - t`. La alternativa, también comprobada, es aplazar el estado: `gsap.to(nodo, { onComplete() { visible = false; } })`. Es lo indicado si la salida es una timeline con varios nodos. Ver [rec-salida](../14-recetas/rec-salida.md).

### 5. Flip tras actualizar

Svelte aplica el DOM después de tu código. Sin `await tick()`, Flip midió el DOM viejo: 0 px de recorrido. Con `tick()`, 30 px y final en 0. Laboratorio. Usa `{#each filas as n (n)}` con clave.

```js fragmento
async function reordenar() {
  const estado = Flip.getState(raiz.querySelectorAll(".fila"));
  filas = [...filas].reverse();
  await tick();
  ctx.add(() => { Flip.from(estado, { duration: 0.3 }); });
}
```

### 6. SvelteKit: entre rutas

Si `onNavigate` devuelve una promesa, SvelteKit espera antes de completar la navegación. `afterNavigate` corre al montar y tras cada navegación. Ambos se declaran durante la inicialización, en este caso en el layout común:

```svelte
<script>
  import { onNavigate, afterNavigate } from "$app/navigation";
  import gsap from "gsap";

  let { children } = $props();
  let contenedor = $state();

  onNavigate(() => new Promise((listo) => {
    gsap.to(contenedor, { opacity: 0, duration: 0.15, onComplete: listo });
  }));

  afterNavigate(() => gsap.to(contenedor, { opacity: 1, duration: 0.15 }));
</script>

<div bind:this={contenedor}>{@render children()}</div>
```

Orden en laboratorio: `onNavigate`, fin de la salida, limpieza de `{@attach}`, `destroy` de la acción, retorno de `onMount` y `afterNavigate`. La limpieza llega **después** de la salida, así que la vista sale intacta. El contenedor del layout persiste entre rutas: sin el `afterNavigate`, la opacidad se quedaría en 0. Al volver a la ruta hubo un solo ScrollTrigger. Una promesa lenta bloquea la navegación: mantenla corta.

SvelteKit 3.1.1 ya no lee `svelte.config.js`: la configuración va en `sveltekit({ … })`, dentro de `vite.config.js`, y la compilación falló con `config_file_unsupported` hasta moverla. `$lib` pasa a `#lib`, y da `module_removed_lib` si no se ajusta. Laboratorio.

## Trampas

- **`onMount` asíncrono pierde la limpieza.** Una función `async` devuelve una promesa, no la limpieza, así que nunca se ejecuta. Guarda el contexto fuera y llama a un `async` interno, o usa `onDestroy` comprobando que exista. [O]
- **`onDestroy` sí corre en servidor.** Es el único hook clásico que se ejecuta en SSR, y allí `ctx` aún no existe. Escribe `ctx?.revert()`. Con `onMount` más retorno te ahorras el problema.
- **Clases sin CSS.** Svelte elimina como "no usados" los selectores `.pieza` que solo manipulas por JS si no aparecen en la plantilla; en contenido dinámico, usa `:global(...)`. [P]
- **`transition:` y GSAP sobre la misma propiedad** compiten por el valor. Elige uno por elemento. [P]
