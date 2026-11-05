---
id: int-contrato
titulo: Contrato de integración de Lenis con cualquier tecnología
capa: 06-integracion
tipo: patron
ambito: transversal
resumen: Entrar, cambiar y salir sobre ventana, contenedor o escena: las cinco columnas, bucle único, adaptador entrar y salir, compartir la instancia y entornos sin window.
api: [Lenis.destroy, Lenis.raf, Lenis.resize, Lenis.scrollTo, Lenis.limit, LenisOptions.autoRaf, LenisOptions.wrapper, LenisOptions.content, ScrollToOptions.immediate, ScrollToOptions.force]
requiere: [fun-modelo, com-raf]
relacionadas: [int-navegacion, int-vanilla, int-gsap, int-canvas-webgl, com-restauracion, com-dimensiones, rec-navegacion, cal-errores]
etiquetas: [agnostico, ciclo-de-vida, limpieza, bucle, navegacion, servidor]
fuentes:
  - README.md
  - packages/react/README.md
  - packages/vue/README.md
  - https://react.dev/reference/react/useEffect
  - https://vuejs.org/api/composition-api-lifecycle.html
  - https://svelte.dev/docs/svelte/lifecycle-hooks
  - https://angular.dev/api/core/afterNextRender
  - https://lit.dev/docs/components/lifecycle/
estado: verificado
version: 1.3.27
---
# Contrato de integración de Lenis

Lenis gobierna **algo que se desplaza**: la ventana, un contenedor, o una escena que lee su posición. Cada tecnología llama de otro modo a los mismos tres momentos: entra, cambia y sale. Este contrato los fija; las demás fichas de la capa solo lo traducen. [P]

**Laboratorio del 2026-11-05.** Lo que dice "laboratorio" se ejecutó fuera del arnés, en apps reales de producción, con Lenis 1.3.27 y gsap 3.15.1, en Chrome 156 headless, con `requestAnimationFrame` real y rueda real enviada por el protocolo de depuración. Fuentes en `_notas/integracion-lab/`.

**Escenario común de laboratorio.** Entrar, rueda, ir a una vista corta en plena inercia, ir a una vista con un contenedor con su propia instancia, volver, cinco ciclos más, comprobar que no sobra nada y que sigue funcionando. Se contaron instancias vivas, llamadas a `raf` por fotograma y los oyentes de `window` leídos del inspector. Se ejecutó en seis apps con dos variantes: la base, con `autoRaf` y sin GSAP, y otra con `gsap.ticker` y un `ScrollTrigger` con `scrub`.

## Problema

Una instancia registra oyentes en su `wrapper` y en `eventsTarget`, vigila tamaños y, con `autoRaf`, mantiene un `requestAnimationFrame` perpetuo. En ventana, los tamaños son un `ResizeObserver` de `content` más el evento `resize` de `window`; en un contenedor, dos `ResizeObserver`. [C] Si la vista cambia sin que nadie la avise, aparecen límites viejos, inercia que invade la vista nueva, bucles huérfanos y clases perdidas.

## Solución

### a) Entrar, cambiar y salir

| Momento | Ventana | Contenedor | Escena |
|---|---|---|---|
| **Entrar** | `new Lenis()`, una vez | Con `wrapper` y `content` ya en el DOM | Lenis más un único bucle de dibujo |
| **Cambiar** | `resize()` si cambia el alto y no puedes esperar | Igual; si cambian los nodos, sal y entra | Rehacer medidas de lo que se proyecta |
| **Salir** | Quitar el reloj externo y `destroy()` | Antes de retirar el nodo | Además, liberar la GPU: [escena](int-canvas-webgl.md) |

**Crea la instancia en lo que sobrevive a la navegación:** el nivel más alto que no se retira al cambiar de ruta. Se crea una vez y no hay que reconectar nada. Lo que sale con cada vista lleva su propia instancia. [P]

Cambiar `lerp` y compañía no exige recrear: `lenis.options` se lee en cada gesto. Recrear solo hace falta con `wrapper`, `content`, `eventsTarget`, `wheelMultiplier`, `touchMultiplier` y `autoResize`, que solo se usan al construir, y al encender `anchors`, `autoToggle` o `stopInertiaOnNavigate`, que registran su oyente al construir: ver [`opc-referencia`](../02-opciones/opc-referencia.md). [C] **Recrear corta la inercia** y deja la referencia vacía hasta la instancia nueva: si la posición debe seguir igual, escribe en `lenis.options`. [C]

La prueba de un buen contrato: entrar, salir y entrar deja lo mismo que entrar una vez. Ocurre de verdad con recargas en caliente, scripts incluidos dos veces y modos de desarrollo. [P]

### b) Las cinco columnas

Cada ficha `int-*` traduce el contrato con esta tabla, con el mismo significado en todas: [P]

| Columna | Responde a | Contenido |
|---|---|---|
| **Entrar** | ¿Dónde se crea? | El gancho que corre en cliente con lo que se desplaza ya en el DOM |
| **Cambiar** | ¿Qué pasa si, en la misma vista, cambia el alto o una opción? | Primero el alto (`resize()`), después las opciones (`lenis.options`, o salir y entrar) |
| **Salir** | ¿Quién limpia? | El gancho de retirada, o "nada" si la página se descarta entera |
| **Ruta** | ¿Y si cambia la vista sin recargar? | El gancho posterior a la navegación, que llama a [`colocar`](int-navegacion.md); "una recarga" si no hay navegación propia |
| **Sincronizar** | ¿Quién más lee o mueve el scroll? | Empieza por "nada, con `autoRaf`"; después, cómo entra otro reloj |

La traducción de este contrato, sin tecnología concreta:

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| `entrar()` con el DOM listo | `lenis.resize()` si cambia el alto; `lenis.options` para una opción en vivo, y salir y entrar para las de creación | `salir()` | `colocar(lenis)` tras cambiar la vista | Nada, con `autoRaf`; si otro bucle manda, pásalo como `reloj` |

### c) Regla del bucle único: quién llama a `raf`

**Cada instancia recibe exactamente una llamada a `raf` por fotograma, de un solo reloj, en milisegundos.** Elige un dueño; los detalles del reloj están en [`com-raf`](../04-comportamiento/com-raf.md). [C]

| Hay en la página | Dueño de `raf` | Código |
|---|---|---|
| Nada más | Lenis | `autoRaf: true` |
| Un bucle de dibujo | Ese bucle | Primero `lenis.raf(t)`, después dibujar: ver [`int-canvas-webgl`](int-canvas-webgl.md) |
| GSAP | `gsap.ticker` | `time * 1000`: ver [`int-gsap`](int-gsap.md) |
| Otro planificador, como Motion o Tempus | Ese planificador | Comprueba la unidad de su marca de tiempo, y guarda su baja para `salir`. Motion documenta `frame.update(fn, true)` con `data.timestamp` en ms, y `cancelFrame`. Sin ejecutar [O] |

Mezclar `autoRaf: true` con un reloj externo no siempre rompe: depende de **lo lejos que estén sus orígenes**, de `lerp` o `duration`, y de qué bucle corre antes en el fotograma. Con orígenes cercanos, como el ticker de GSAP, llega al destino con un paso de más por fotograma. Con orígenes separados más de unos 118 s, como `Date.now()`, hay un salto sin suavizado o, con `lerp`, un `NaN` que deja la página **clavada arriba**, sin error. La tabla, y cómo recuperarse, en [`com-raf`](../04-comportamiento/com-raf.md). [C] [E]

### d) El adaptador

Unas líneas sin dependencias que encajan en cualquier ciclo de vida. Es **la única firma** de esta capa: todas las fichas `int-*` que no tienen paquete oficial la reutilizan. `raiz` es lo que se desplaza, `content` solo hace falta si no es el primer hijo, y `reloj` tiene la forma de la opción `bucle` de [`iniciarScroll`](../plantillas/README.md): recibe `paso(ms)` y devuelve su baja. Como segundo argumento recibe la instancia.

```html
<style>.vista { height: 200px; overflow: auto; }</style>
<div class="vista"><div style="height:1500px">contenido</div></div>
```

```js
function entrar({ raiz = window, content, opciones = {}, reloj } = {}) {
  const propio = raiz === window ? {} : {
    wrapper: raiz,
    content: content ?? raiz.shadowRoot?.firstElementChild ?? raiz.firstElementChild,
  };
  const lenis = new Lenis({ ...propio, ...opciones, autoRaf: !reloj });
  const quitarReloj = reloj?.((ms) => lenis.raf(ms), lenis);
  let activo = true;
  return {
    lenis,
    salir() {
      if (!activo) return;
      activo = false;
      quitarReloj?.();
      lenis.destroy();
    },
  };
}

const raiz = document.querySelector(".vista");
entrar({ raiz }).salir();             // ciclo extra: entra y sale en seguida
const vista = entrar({ raiz });
let pasos = 0;
vista.lenis.on("scroll", () => pasos++);
const claseDentro = raiz.className;

rueda(300, raiz);
await espera(500);
const recorrido = raiz.scrollTop;

vista.salir();
vista.salir();                        // idempotente
const claseFuera = raiz.className;
const antes = pasos;
rueda(300, raiz);
await espera(150);
// prueba: claseDentro.includes("lenis") && recorrido > 250
// prueba: claseFuera === "vista" && pasos === antes && raiz.scrollTop === recorrido
```

`reloj` admite cualquier bucle. Este es el de `requestAnimationFrame`; el de GSAP está en [`int-gsap`](int-gsap.md). Con un `shadowRoot`, el adaptador toma su primer elemento. [C] [E]

```js
function entrar({ raiz = window, content, opciones = {}, reloj } = {}) {
  const propio = raiz === window ? {} : {
    wrapper: raiz,
    content: content ?? raiz.shadowRoot?.firstElementChild ?? raiz.firstElementChild,
  };
  const lenis = new Lenis({ ...propio, ...opciones, autoRaf: !reloj });
  const quitarReloj = reloj?.((ms) => lenis.raf(ms), lenis);
  return { lenis, salir() { quitarReloj?.(); lenis.destroy(); } };
}
const relojPropio = (paso) => {
  let id = requestAnimationFrame(function f(t) {
    paso(t);
    id = requestAnimationFrame(f);
  });
  return () => cancelAnimationFrame(id);
};

const vista = entrar({ opciones: { lerp: 0.5 }, reloj: relojPropio });
const conReloj = vista.lenis.options.autoRaf;
vista.lenis.scrollTo(300);
await espera(400);
const y = window.scrollY;
vista.salir();
window.scrollTo(0, 0);

const anfitrion = document.createElement("div");
anfitrion.className = "anfitrion";
anfitrion.attachShadow({ mode: "open" }).innerHTML = '<div style="height:1500px"></div>';
document.body.prepend(anfitrion);
const conSombra = entrar({ raiz: anfitrion });
const observado = conSombra.lenis.options.content === anfitrion.shadowRoot.firstElementChild;
conSombra.salir();
anfitrion.remove();
// prueba: conReloj === false && y === 300 && observado === true
```

### e) Dónde conectar `entrar` y `salir`

Consultado en la documentación oficial de cada tecnología el 2026-11-05. Ejecutadas en laboratorio: todas salvo las dos filas finales. Las plantillas de [`plantillas/`](../plantillas/README.md) siguen esta firma de salida: reciben un objetivo y devuelven su limpieza.

| Tecnología | Paquete | Entrar | Salir | Ficha |
|---|---|---|---|---|
| JavaScript sin framework | `lenis` | `alEstarListo` | Nada si la página se descarta | [`int-vanilla`](int-vanilla.md) |
| Custom Elements | `lenis` | `connectedCallback` | `disconnectedCallback` | [`int-webcomponents`](int-webcomponents.md) |
| Lit | `lenis` | `firstUpdated`, y `connectedCallback` al volver | `disconnectedCallback` | [`int-webcomponents`](int-webcomponents.md) |
| React | `lenis/react` | `<ReactLenis>`, o `useEffect` | Lo hace `<ReactLenis>`, o el retorno | [`int-react`](int-react.md) |
| Next.js | `lenis/react` | Lo mismo, en un archivo de cliente | Igual | [`int-nextjs`](int-nextjs.md) |
| Vue | `lenis/vue` | `<VueLenis>`, o `onMounted` | Lo hace `<VueLenis>`, o `onBeforeUnmount` | [`int-vue-nuxt`](int-vue-nuxt.md) |
| Nuxt | `lenis/nuxt` | `<VueLenis>` global | Igual | [`int-vue-nuxt`](int-vue-nuxt.md) |
| Svelte, SvelteKit | Ninguno | `onMount`, o `{@attach}` en un contenedor | Retorno de ambos | [`int-svelte`](int-svelte.md) |
| Angular | Ninguno | `afterNextRender` | `inject(DestroyRef).onDestroy()` | [`int-angular`](int-angular.md) |
| Canvas, WebGL | `lenis` | Al crear la escena | Parar el bucle, `destroy()`, liberar GPU | [`int-canvas-webgl`](int-canvas-webgl.md) |
| WordPress | `lenis` | `wp_enqueue_script` y archivo propio | Nada si la página se descarta | [`int-wordpress`](int-wordpress.md) |
| Webflow | `lenis` | Código personalizado de pie de página | Nada si la página se descarta | [`int-webflow`](int-webflow.md) |

Forma mínima, con cualquier par de ganchos:

```js fragmento
let vista;
alEntrar(() => { vista = entrar(); });
alSalir(() => vista?.salir());
```

### f) Compartir la instancia

Si varias vistas necesitan la misma instancia, **una sola parte la crea y la destruye**, y las demás solo la leen: [P]

| Dónde guardarla | Cuándo |
|---|---|
| El mecanismo del paquete oficial | Si tu tecnología lo tiene, como `useLenis` |
| El contexto o la inyección de tu tecnología | Si la instancia vive en el nivel raíz |
| Un módulo propio que exporte `obtener()` | Sin paquete ni contexto, y siempre en servidor con cuidado: el módulo se comparte entre peticiones |
| Un nombre propio en `window` | Con scripts clásicos. `window.lenis` no sirve: es diagnóstico |

Quien solo lee se suscribe con `lenis.on()` y guarda la baja para su propia salida. No metas la instancia en un estado reactivo profundo: un proxy interceptaría cada lectura en cada fotograma. Sin ejecutar. [P]

### g) Navegación sin recarga

Si el contenido cambia sin recargar, llama a `colocar(lenis)` tras cambiar la vista: corta la inercia, mide y coloca, en ese orden y sin esperar un fotograma. Por qué ese orden, y su comprobación, en [`int-navegacion`](int-navegacion.md). Con hash y posición guardada: [`rec-navegacion`](../08-recetas/rec-navegacion.md).

### h) Entornos sin `window`

Laboratorio: Node 24.14 de Windows, 2026-11-05, ESM, con `lenis` 1.3.27 real. No pasa por el arnés.

| En Node, sin `window` | Resultado |
|---|---|
| `import Lenis from "lenis"` | Correcto: el módulo no toca `window` al evaluarse |
| `import Snap from "lenis/snap"` | Correcto |
| `import ... from "lenis/react"` | Correcto, exige `react`. Lleva la directiva `"use client"` |
| `import ... from "lenis/vue"` | Correcto, exige `vue` 3.5 o posterior |
| `import "lenis/nuxt"` | Correcto con `@nuxt/kit` instalado; sin él, `Cannot find package` |
| `new Lenis()` | **Lanza** `ReferenceError: window is not defined`, por `window.matchMedia` en un campo de clase |
| `new Snap(lenis)` | **Lanza** el mismo error |
| `import "lenis/dist/lenis.css"` | **Lanza** `Unknown file extension ".css"` en Node puro; los empaquetadores lo resuelven |

La regla: **importar es seguro; construir, no**. Construye en el gancho de entrar, que en servidor no corre. No hay nada que hacer dentro de un `Worker`: sin `window`, `new Lenis()` falla por lo mismo. [C]

## Trampas

- **`destroy()` no para un reloj externo.** No detiene la animación en curso: solo cancela su propio `autoRaf`. Si tu bucle sigue llamando a `raf`, el scroll continúa con la instancia ya destruida. Quita primero el reloj. [E]

```js
const lenis = new Lenis();
let id = requestAnimationFrame(function paso(t) {
  lenis.raf(t);
  id = requestAnimationFrame(paso);
});
lenis.scrollTo(2000, { duration: 0.6, easing: (t) => t });
await espera(150);
lenis.destroy();
const alDestruir = window.scrollY;
await espera(500);
const despues = window.scrollY;
cancelAnimationFrame(id);
window.scrollTo(0, 0);
// prueba: alDestruir < 1500 && despues > alDestruir + 300
```

- **Dos instancias sobre la misma raíz se pisan las clases.** Si la nueva entra antes de que salga la vieja, el `destroy()` de la vieja borra todas las clases `lenis*` de la raíz, también las de la nueva. Sal antes de entrar. [E]

```js
const vieja = new Lenis();
const nueva = new Lenis();
const antes = document.documentElement.className;
vieja.destroy();
const despues = document.documentElement.className;
nueva.destroy();
// prueba: antes === "lenis" && despues === ""
```

- **Retirar el nodo sin `destroy()`.** Lo que escuchaba el nodo muere con él, pero no el oyente de `resize` de `window` ni el bucle: en laboratorio, `lenis.time` siguió avanzando y `window` conservó un `resize` de más hasta llamar a `destroy()`. [E]

```js
const caja = document.createElement("div");
caja.innerHTML = "<div></div>";
document.body.append(caja);
const lenis = new Lenis({ wrapper: caja, content: caja.firstElementChild, autoRaf: true });
await espera(50);
caja.remove();
const t1 = lenis.time;
await espera(100);
const sigue = lenis.time > t1;
lenis.destroy();
const t2 = lenis.time;
await espera(100);
// prueba: sigue === true && lenis.time === t2
```

- **`destroy()` es idempotente, pero la instancia no queda inutilizable.** Llamarlo dos veces es seguro, y tras él `resize()`, `raf()` y `scrollTo()` no lanzan: un `scrollTo` inmediato sigue moviendo la página. Suelta la referencia. Laboratorio.
- **`window.lenis` no es tu instancia.** Es un objeto de diagnóstico, `{ version }`, y sobrevive a `destroy()`. Laboratorio.
- **`destroy()` no devuelve el scroll a su sitio** ni restaura estilos: solo retira oyentes y clases. Si `stop()` estaba activo con `autoToggle`, el `overflow` escrito en la raíz se queda. [C]
- **Rueda anterior a la entrada.** Hasta que exista la instancia, la rueda es scroll nativo: `new Lenis()` adopta la posición que encuentre y sigue desde ahí. Pasa entre el HTML del servidor y la hidratación, o con un script diferido. Nada que corregir. [C]
- **`autoToggle` deja un oyente por instancia.** `destroy()` no retira el `transitionend` de la raíz: tras cuatro ciclos, el inspector mostró 4 en `<html>`, y cada uno retiene su instancia. No se nota en una página, pero se acumula si entras y sales muchas veces sin recargar: en esos casos, crea una instancia y consérvala. Laboratorio. [C]
