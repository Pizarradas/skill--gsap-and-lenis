---
id: int-vue-nuxt
titulo: Lenis en Vue y Nuxt
capa: 06-integracion
tipo: guia
ambito: vue
resumen: Paquetes lenis/vue y lenis/nuxt: VueLenis, plugin, useLenis, LenisExposed, opciones en línea que recrean la instancia, cambio de ruta, GSAP aparte y Vue 3.5 obligatorio.
api: [LenisExposed.wrapper, LenisExposed.content, LenisExposed.lenis, funciones.useLenis, Lenis.scrollTo, Lenis.resize, Lenis.on]
requiere: [int-contrato]
relacionadas: [int-gsap, int-typescript, rec-navegacion]
etiquetas: [vue, nuxt, vuelenis, plugin, useLenis]
fuentes:
  - packages/vue/README.md
  - https://vuejs.org/api/reactivity-core.html
  - https://router.vuejs.org/guide/advanced/scroll-behavior.html
  - https://nuxt.com/docs/4.x/api/advanced/hooks
  - https://nuxt.com/docs/4.x/guide/recipes/custom-routing
estado: verificado
version: 1.3.27
---
# Lenis en Vue y Nuxt

`lenis/vue` trae `VueLenis` (también exportado como `Lenis`), `useLenis` y `vueLenisPlugin` como exportación por defecto. `lenis/nuxt` es un módulo que los registra. El componente hace de [contrato](int-contrato.md): crea y destruye. Con `autoRaf` por defecto, solo falta unirlo a las rutas, si las hay.

Documentación consultada el 2026-11-05. **Laboratorio del 2026-11-05:** Vue 3.5.45, Vue Router 5.4.0, Vite 8.3, y Nuxt 4.6.4 con SSR, `nuxt build` y servidor real, Chrome 156 headless, rueda real. El escenario común pasó entero en las dos apps, con `autoRaf` y con GSAP.

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| `<VueLenis root />` | `resize()` si cambia el alto; cambiar `options` recrea, también al mutarlo; para evitarlo, `lenis.options` | Automática | Vigilar la ruta con [`colocar`](int-navegacion.md), y en Nuxt el gancho `page:finish` | Nada, con `autoRaf`, activo por defecto; con GSAP, `watchEffect` con el reloj |

**Plantillas.** Las de [`plantillas/`](../plantillas/README.md) funcionan aquí: copia `plantillas/<nombre>.js`, y pásales la instancia como `opciones.lenis`. Si la instancia se recrea, vuelve a llamarlas: ver [ese caso](../plantillas/README.md#se-recrea-la-instancia).

## Pasos

### 1. Instala

Exige **Vue 3.5 o posterior**. El paquete declara `vue >=3.0.0`, pero importa `onWatcherCleanup`, que llegó en 3.5: con Vue 3.4, la importación falla con `does not provide an export named 'onWatcherCleanup'`. Laboratorio. [O]

```js fragmento
// main.js
import { createApp } from 'vue'
import LenisVue from 'lenis/vue'
import 'lenis/dist/lenis.css'
import App from './App.vue'

createApp(App).use(LenisVue).mount('#app')
```

| | `app.use(LenisVue)` | Módulo `lenis/nuxt` |
|---|---|---|
| Etiqueta global | `<vue-lenis>` | `<vue-lenis>` y `<VueLenis>` |
| `useLenis` sin importar | No | Sí |
| Silencia el aviso de `inject` | Sí | Sí |

El README dice que están disponibles "como importaciones globales": es cierto solo en Nuxt. En Vue, `<VueLenis>` sin importar se renderizó como una etiqueta `<vuelenis>` desconocida, sin instancia ni aviso en producción. Importa `VueLenis`, o usa `<vue-lenis>`. Laboratorio.

```js fragmento
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['lenis/nuxt'],
  css: ['lenis/dist/lenis.css'],
})
```

El módulo no admite opciones: `configKey` es `lenis`, pero `ModuleOptions` está vacío. El plugin corre también en servidor, sin riesgo: `VueLenis` comprueba `typeof window`. [C]

### 2. Colócalo tras cada ruta

Sin enrutador, basta `<VueLenis root />`. Con Vue Router, esta forma pasó todo el escenario:

```vue
<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { VueLenis } from 'lenis/vue'
import { colocar } from './scroll'

const lenisRef = ref()
const ruta = useRoute()
watch(() => ruta.path, async () => {
  await nextTick()
  const lenis = lenisRef.value?.lenis
  if (lenis) colocar(lenis)
})
</script>

<template>
  <VueLenis root ref="lenisRef" />
  <RouterView />
</template>
```

`ref` expone `LenisExposed`: `lenis`, `wrapper` y `content`, ya sin envolver. Como tipo no se puede importar: ver [`int-typescript`](int-typescript.md).

**En Nuxt,** cambia el `watch` por el gancho de cliente `page:finish`, que llega con la página nueva resuelta. En Nuxt, `onMounted` del README funciona porque se importa solo. [O]

```vue
<script setup>
const lenisRef = ref()
useNuxtApp().hook('page:finish', () => {
  const lenis = lenisRef.value?.lenis
  if (lenis) colocar(lenis)
})
</script>
```

Vue Router no coloca el scroll sin `scrollBehavior` [O]: en laboratorio, una vista corta heredó 200. Nuxt sí define uno, y fue a 0. **Ninguno de los dos sobrevive a la inercia:** en plena inercia, ambos quedaron en 200. Por eso hace falta `colocar`.

Una plantilla recibe la instancia de `useLenis`. Con `watchPostEffect`, porque en `setup` el objetivo aún no existe. En laboratorio, la barra siguió funcionando tras salir de la vista y volver:

```vue
<script setup>
const lenis = useLenis()
watchPostEffect((alLimpiar) => {
  if (lenis.value) alLimpiar(barraProgreso('.barra', { lenis: lenis.value }))
})
</script>
```

### 3. Un contenedor con su instancia

```vue
<script setup>
import { VueLenis } from 'lenis/vue'
</script>

<template>
  <VueLenis id="caja">
    <div style="height: 2000px">contenido</div>
  </VueLenis>
</template>
```

`#caja` necesita alto y `overflow: auto` en una hoja de estilo: ver [`com-stop-start`](../04-comportamiento/com-stop-start.md#ventana-y-contenedor). Los atributos caen en el `div` exterior. También existe la prop `props`, sin documentar, que hace lo mismo. A diferencia de `new Lenis()`, `autoRaf` está activo por defecto. Sin `root`, renderiza siempre las dos envolturas, incluso sin hijos: en laboratorio, `<VueLenis />` creó un contenedor vacío, no una instancia en la ventana. La prop `autoRaf` también existe, y `options.autoRaf` tiene preferencia.

### 4. Lee Lenis con `useLenis`

`useLenis(fn, prioridad)` devuelve un `ComputedRef`, y en `setup` vale `undefined`: vigílalo. Corre `fn` una vez al conectar y luego en cada `scroll`; menor `prioridad`, antes (−1, 0, 5 en laboratorio). Sin instancia, en desarrollo avisa `No lenis instance found`, a los dos ticks. Funciona por encima de `<VueLenis root>`. No hay lista de dependencias: el callback se fija al llamar. En Nuxt también funciona sin importar. Laboratorio.

### Con GSAP

Con `autoRaf: false` eres el dueño del reloj, y `relojGsap` es el de [`int-gsap`](int-gsap.md#el-reloj-para-el-adaptador). Pasó el escenario en Vue y en Nuxt, también en una caja con esta misma forma. Añade `ScrollTrigger.refresh()` tras `colocar`.

```vue
<script setup>
import { ref, watchEffect } from 'vue'
import { VueLenis } from 'lenis/vue'
import { relojGsap } from './reloj'

const opciones = { autoRaf: false } // constante: ver Trampas
const lenisRef = ref()
watchEffect((alLimpiar) => {
  const lenis = lenisRef.value?.lenis
  if (lenis) alLimpiar(relojGsap((ms) => lenis.raf(ms), lenis))
})
</script>

<template>
  <VueLenis root ref="lenisRef" :options="opciones" />
</template>
```

## Trampas

- **`:options` en línea recrea la instancia.** Un objeto literal en la plantilla es nuevo en cada render, y `VueLenis` lo vigila: cada render del padre destruye y crea. En laboratorio, un contador en el padre cortó la inercia a medio camino, en 953 de 1400. Declara las opciones fuera de la plantilla. Con `ref`, mutar una propiedad también recrea, porque la vigilancia es profunda. [C]

```vue invalido
<VueLenis root :options="{ autoRaf: false }" />
```

- **El ejemplo de GSAP del README falla fuera de Nuxt.** Usa `onMounted` sin importarlo, y da `ReferenceError` al ejecutarse. El `registerPlugin` dentro de `onMounted` llega además tarde: mejor en el ámbito del módulo. [C]
- **Sin `off`.** `watchEffect` se vuelve a ejecutar al recrearse la instancia, y la vieja se destruye vaciando su emisor. Aun así, la baja en `alLimpiar` deja claro el contrato. [C]
- **`motion-v`.** Es otro reloj externo: ver [`int-contrato`](int-contrato.md). Sin ejecutar. [O]
- **Transiciones de página.** Lo general está en [`int-navegacion`](int-navegacion.md#trampas). En Nuxt, comprueba `page:transition:finish` en vez de `page:finish`. Sin ejecutar. [P]
- **Hidratación.** `VueLenis` con `root` crea la instancia en `setup`, antes de hidratar, solo en cliente, y mide lo que haya: en laboratorio, los `ResizeObserver` dejaron `limit` correcto. [C]
