---
id: int-svelte
titulo: Lenis en Svelte y SvelteKit
capa: 06-integracion
tipo: guia
ambito: transversal
resumen: Sin paquete oficial: el adaptador entrar con onMount, {@attach} para un contenedor, afterNavigate en SvelteKit para la ruta y lo que cambia en SvelteKit 3.
api: [Lenis.destroy, Lenis.scrollTo, Lenis.resize, Lenis.raf, Lenis.on, LenisOptions.wrapper, LenisOptions.content]
requiere: [int-contrato]
relacionadas: [int-gsap, rec-navegacion]
etiquetas: [svelte, sveltekit, onmount, attach, afternavigate]
fuentes:
  - README.md
  - https://svelte.dev/docs/svelte/lifecycle-hooks
  - https://svelte.dev/docs/svelte/use
  - https://svelte.dev/docs/kit/$app-navigation
estado: verificado
version: 1.3.27
---
# Lenis en Svelte y SvelteKit

**No hay paquete oficial.** `lenis` solo publica entradas para React, Vue y Nuxt, y no hace falta más: `onMount` y `{@attach}` ya son los dos momentos del [contrato](int-contrato.md). La integración es el adaptador de `int-contrato`, en un módulo propio, y vale en Svelte con o sin SvelteKit. [C]

Documentación consultada el 2026-11-05: la de SvelteKit no indica versión en esa página. **Laboratorio del 2026-11-05:** Svelte 5.57.3, SvelteKit 3.1.1, `adapter-node` con SSR real, `vite build` y servidor Node, Chrome 156 headless, rueda real. El escenario común pasó entero, con `autoRaf` y con GSAP. Svelte sin SvelteKit no se ejecutó.

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| `onMount` en el layout; `{@attach}` en un contenedor | `resize()` si cambia el alto; `lenis.options`, o salir y entrar | `vista.salir`, como retorno de `onMount` o del adjunto | `afterNavigate` en SvelteKit, con [`colocar`](int-navegacion.md) | Nada, con `autoRaf`; con GSAP, `entrar({ reloj: relojGsap })` |

**Plantillas.** Las de [`plantillas/`](../plantillas/README.md) funcionan aquí: copia `plantillas/<nombre>.js`, y pásales la instancia como `opciones.lenis`. Si la instancia se recrea, vuelve a llamarlas: ver [ese caso](../plantillas/README.md#se-recrea-la-instancia).

## Pasos

### 1. Copia el adaptador

Módulo normal, sin nada de Svelte: `src/lib/scroll.js` con [`entrar`](int-contrato.md) y [`colocar`](int-navegacion.md) tal cual. Importar `lenis` en servidor es seguro; construir, no. Aquí nada se construye al importar: ver [entornos sin `window`](int-contrato.md).

### 2. Conéctalo

En Svelte, en el componente que persiste. `onMount` no corre en servidor, y solo limpia con un callback **síncrono**, porque uno `async` devuelve una promesa. [O]

```svelte
<script>
  import 'lenis/dist/lenis.css'
  import { onMount } from 'svelte'
  import { entrar } from './scroll.js'

  onMount(() => entrar().salir)
</script>
```

En SvelteKit, en el layout raíz, que persiste entre rutas, con `afterNavigate`:

```svelte
<script>
  import 'lenis/dist/lenis.css'
  import { onMount } from 'svelte'
  import { afterNavigate } from '$app/navigation'
  import { entrar, colocar } from '#lib/scroll.js'

  let { children } = $props()
  let vista

  onMount(() => {
    vista = entrar()
    return vista.salir
  })

  afterNavigate(() => {
    if (vista) colocar(vista.lenis)
  })
</script>

{@render children()}
```

`afterNavigate` corre al entrar y tras cada navegación. `vista` no existe en la primera pasada: el `if` lo cubre. [O]

SvelteKit coloca el scroll por su cuenta, arriba o en el hash [O]. En reposo fue a 0 sin ayuda, pero **en plena inercia quedó en 200**. Lo escribe antes de `afterNavigate`: `colocar` lo encontró en 0, justo el caso en el que `resize()` seguido de `scrollTo` no corta nada. Ver [`int-navegacion`](int-navegacion.md). Laboratorio.

Si necesitas respetar el hash o la posición al volver atrás, consulta `navigation.type` en `afterNavigate`, en lugar de ir siempre a 0: ver [`rec-navegacion`](../08-recetas/rec-navegacion.md). Sin ejecutar.

### 3. Un contenedor con su instancia

Svelte recomienda los adjuntos desde 5.29, en lugar de `use:`. [O] Un adjunto recibe el nodo ya en el DOM, y lo que devuelve es la salida. `#caja` necesita alto y `overflow: auto` en una hoja de estilo:

```svelte
<script>
  import { entrar } from '#lib/scroll.js'
  const lenisContenedor = (raiz) => entrar({ raiz }).salir
</script>

<div id="caja" {@attach lenisContenedor}>
  <div style="height: 2000px">contenido</div>
</div>
```

La acción equivalente, `use:lenisContenedor` devolviendo `{ destroy: salir }`, pasó el escenario con la firma anterior del adaptador. Ni adjuntos ni acciones corren en servidor. [O]

### 4. Con GSAP

Pasa [`relojGsap`](int-gsap.md#el-reloj-para-el-adaptador): `entrar({ reloj: relojGsap })`, y `entrar({ raiz, reloj: relojGsap })` en el contenedor. Añade `ScrollTrigger.refresh()` tras `colocar`. Pasó el escenario.

## Trampas

- **SvelteKit 3 cambia la configuración.** `svelte.config.js` ya no se admite: la opción va en `sveltekit({ adapter })` de `vite.config.js`. `$lib` se retiró: usa `#lib`, declarado en `imports` de `package.json`, o `alias`. Son errores de compilación explícitos, y no afectan a Lenis. Laboratorio, 3.1.1. La documentación consultada aún no distingue versiones en la página de navegación: comprueba la tuya.
- **`onMount` asíncrono.** Con `onMount(async () => { ... return limpiar })`, la limpieza se pierde: Lenis y el reloj quedan vivos al salir. Si cargas algo de forma diferida, hazlo dentro y marca una bandera `cancelado` en el retorno síncrono. [O]
- **Crear en el cuerpo de `<script>`.** Corre también en servidor: `new Lenis()` lanza `window is not defined` en el render, no al compilar. Ver [`int-contrato`](int-contrato.md).
- **`data-sveltekit-preload-data`.** Precarga al pasar el puntero, sin insertar nada. No cambia nada en Lenis. En laboratorio estuvo desactivado para aislar la prueba de navegación. [P]
- **Sin `useLenis`.** Para compartir la instancia, ver [`int-contrato`](int-contrato.md). Aquí: `setContext` en el layout, o un módulo `.svelte.js`, sin `$state`. Sin ejecutar. [P]
