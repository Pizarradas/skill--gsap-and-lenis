---
id: fra-vue-nuxt
titulo: GSAP en Vue 3 y Nuxt
capa: 12-frameworks
tipo: guia
ambito: transversal
resumen: Entrar, cambiar y salir en Vue: onMounted, watch post, Transition con done, Flip con nextTick y rutas, probado en app real; plugin de cliente en Nuxt 4.
api: [gsap.context, gsap.Context.revert, gsap.Context.add, gsap.registerPlugin, ScrollTrigger.refresh, Flip.getState, Flip.from]
requiere: [fra-agnostico]
relacionadas: [nuc-context, cal-fouc, rec-salida, int-flip]
etiquetas: [vue, nuxt, ssr]
fuentes:
  - resources/frameworks.md
  - https://github.com/greensock/gsap-skills
  - https://vuejs.org/guide/essentials/template-refs.html
  - https://vuejs.org/api/composition-api-lifecycle.html
  - https://nuxt.com/docs/4.x/directory-structure/app/plugins
  - https://nuxt.com/docs/4.x/getting-started/upgrade
  - https://nuxt.com/docs/4.x/getting-started/transitions
  - https://vuejs.org/guide/built-ins/transition.html
  - https://vuejs.org/api/reactivity-core.html
estado: verificado
version: 3.15.1
---
# GSAP en Vue 3 y Nuxt

Traducción del [contrato común](fra-agnostico.md) a Vue y Nuxt. Las reglas generales están allí; aquí va solo lo propio de esta tecnología.

Consultado el 2026-11-05: npm publica Vue 3.5.44 y Nuxt 4.6.4. **Laboratorio del mismo día:** app real con Vue 3.5.44, vue-router 5.4.0 y Vite 8.3.6, gsap 3.15.1 y Chrome 156, sin pasar por el arnés: montaje, cambio, evento, salida, Flip, ruta y limpieza (fuentes en `_notas/contrato-lab/vue/`). Nuxt y SSR **no** se ejecutaron: sigue su documentación.

| Cambio | Evento | Salida | Flip tras actualizar | Ruta |
|---|---|---|---|---|
| `watch(v, fn, { flush: "post" })` y `ctx.add()` | `ctx.add()` en el manejador | `<Transition :css="false" @leave>` y `done` en `onComplete` | `Flip.getState()`, cambio, `await nextTick()`, `Flip.from()` | `<Transition mode="out-in" @leave>` alrededor de la vista de `RouterView` |

## Pasos

### 1. Componente Vue

```vue
<script setup>
import { onMounted, onBeforeUnmount, useTemplateRef } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const raiz = useTemplateRef("raiz");
let ctx;

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.from(".pieza", { y: 20, autoAlpha: 0, stagger: 0.1 });
    gsap.to(".fondo", {
      yPercent: 15,
      ease: "none",
      scrollTrigger: { trigger: raiz.value, scrub: true },
    });
  }, raiz.value);
});

onBeforeUnmount(() => ctx?.revert());
</script>

<template>
  <section ref="raiz">
    <div class="fondo"></div>
    <div class="pieza">Uno</div>
    <div class="pieza">Dos</div>
  </section>
</template>
```

- `useTemplateRef()` requiere Vue 3.5. En versiones anteriores declara `const raiz = ref(null)` con el mismo nombre que el atributo `ref`.
- El ref vale `null` hasta montar: nunca crees animaciones en el cuerpo de `setup`.
- `onMounted`, `onBeforeUnmount` y `onUnmounted` no se llaman en SSR, por lo que este componente ya es seguro para Nuxt.

`onBeforeUnmount` revierte con el componente aún funcional. La skill oficial usa `onUnmounted`, también válido. [P] Con una salida en curso, ver el apartado 5.

### 2. Reaccionar a cambios

`watch` con `{ flush: "post" }` se ejecuta tras actualizar el DOM. Para que lo creado se limpie con el resto, entra en el contexto con `ctx.add()`. En laboratorio, una barra que iba a 1 y recibió 0,2 a mitad siguió desde su valor actual sin saltos:

```js fragmento
watch(valor, (nuevo) => {
  ctx.add(() => gsap.to(".barra", { scaleX: nuevo / 100, overwrite: "auto" }));
}, { flush: "post" });
```

Tras cargar contenido que cambia la altura, espera a `nextTick()` y llama a `ScrollTrigger.refresh()`. [O]

Los eventos siguen la misma regla: en el manejador, `ctx.add(() => gsap.to(".boton", { rotation: "+=90" }))`. En laboratorio, `revert` lo devolvió a 0 al retirar la vista.

### 3. Salida con `<Transition>`

Vue retiene el nodo hasta que llamas a `done`. Con `:css="false"`, `done` es obligatorio: sin él, la transición termina de inmediato. Comprobado en laboratorio: el nodo siguió en el DOM a mitad de salida y desapareció al acabar.

```vue
<script setup>
import gsap from "gsap";

function salida(el, done) {
  gsap.to(el, { autoAlpha: 0, y: -10, duration: 0.2, onComplete: done });
}
</script>

<template>
  <Transition :css="false" @leave="salida">
    <div v-if="visible" class="aviso">Guardado</div>
  </Transition>
</template>
```

Si la vista se retira con la salida en curso, no se cuelga nada: la navegación se completó y el nodo se fue con su padre. Lo que no sale de un `<Transition>` sigue el patrón de [rec-salida](../14-recetas/rec-salida.md).

### 4. Flip tras actualizar

Vue aplica el DOM después de tu código. Sin `await nextTick()`, `Flip.from()` midió el DOM viejo y no animó nada (0 px); con él, la fila recorrió 23 px y terminó en 0. Laboratorio. Usa `:key` estable: Flip reconoce el elemento por su identidad.

```js fragmento
async function reordenar() {
  const estado = Flip.getState(raiz.value.querySelectorAll(".fila"));
  filas.value = [...filas.value].reverse();
  await nextTick();
  ctx.add(() => { Flip.from(estado, { duration: 0.3 }); });
}
```

No devuelvas el timeline desde una función `async`: es un objeto con `then()`, así que quien la espere se queda hasta que acabe la animación. Laboratorio.

### 5. Entre rutas

```vue
<template>
  <RouterView v-slot="{ Component }">
    <Transition :css="false" mode="out-in" @leave="salirRuta" @after-leave="limpiar">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>
```

El orden real en laboratorio fue `onBeforeUnmount`, limpieza, inicio de `@leave`, `onUnmounted` y fin de `@leave`. Es decir, un `ctx.revert()` en `onBeforeUnmount` **deshace los valores de GSAP cuando la salida empieza**: el botón girado volvió a 0 a los pocos milisegundos. Si la vista debe salir tal como está, no reviertas ahí. Guarda la limpieza por nodo y ejecútala en `@after-leave`. En laboratorio, `x` siguió en 50 durante la salida, y al acabar quedó en 0 sin ScrollTriggers:

```js fragmento
// retirar.js
export const retirar = new WeakMap();

// en la vista, dentro de onMounted
retirar.set(raiz.value, () => ctx.revert());

// en el contenedor de rutas
const limpiar = (el) => retirar.get(el)?.();
```

Al volver a la ruta quedó un solo ScrollTrigger: no se duplicó. Crea el tween de `salirRuta` fuera del contexto de la vista.

### 6. Registrar plugins en Nuxt

Nuxt 4 resuelve el código desde `app/`. Los archivos de `app/plugins/` se registran solos, y el sufijo `.client` hace que solo se carguen en el navegador:

```ts
// app/plugins/gsap.client.ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger);
  return { provide: { gsap, ScrollTrigger } };
});
```

En un componente se obtiene con `const { $gsap, $ScrollTrigger } = useNuxtApp()`, dentro de `onMounted`. También vale importar `gsap` directamente, porque en el resto de código de cliente el registro ya está hecho.

Para cargar poco a poco un plugin raro, usa un import dinámico y regístralo antes de usarlo:

```ts
const { SplitText } = await import("gsap/SplitText");
gsap.registerPlugin(SplitText);
```

Para animar el cambio de página, Nuxt expone `definePageMeta({ pageTransition: { mode: "out-in", onEnter(el, done) { … } } })`, basado en `<Transition>`. Su guía lista `onBeforeEnter`, `onEnter` y `onAfterEnter`, y no menciona `onLeave`: no se ejecutó. Si un layout persiste al navegar, ver [orden de ejecución](fra-agnostico.md).

## Trampas

- **`onMounted` no espera a los hijos asíncronos** ni a imágenes y fuentes. Si la medida importa, llama a `ScrollTrigger.refresh()` tras la carga. [O]
- **`.client` y consumo en servidor.** Con un plugin `.client`, `$gsap` no existe en SSR. Úsalo solo en `onMounted` o bajo `import.meta.client`. Eso se deduce del sufijo descrito por Nuxt. [P]
- **Un plugin no se registra en un `ref` reactivo.** No guardes tweens o contextos en `ref()` o `reactive()`: Vue los envolvería en proxies. Usa una variable normal o `shallowRef`. [P]
- **`<KeepAlive>`.** Un componente en caché no se desmonta: `onBeforeUnmount` no corre. Pausa en `onDeactivated` y reanuda en `onActivated`. [P]
- **FOUC en Nuxt.** El HTML llega del servidor sin los estados iniciales de GSAP. Ver [cal-fouc](../13-calidad/cal-fouc.md).
