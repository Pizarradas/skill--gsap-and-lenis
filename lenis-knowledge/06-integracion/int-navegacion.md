---
id: int-navegacion
titulo: Navegación sin recarga con Lenis
capa: 06-integracion
tipo: patron
ambito: transversal
resumen: Por qué un cambio de vista deja inercia y límites viejos, la función colocar (cortar, medir y colocar) y qué orden falla, probado en ventana y contenedor.
api: [Lenis.resize, Lenis.scrollTo, Lenis.limit, Lenis.targetScroll, LenisOptions.stopInertiaOnNavigate, ScrollToOptions.immediate, ScrollToOptions.force]
requiere: [int-contrato]
relacionadas: [rec-navegacion, com-restauracion, com-dimensiones, api-scrollto, int-gsap]
etiquetas: [navegacion, rutas, inercia, resize, reinicio]
fuentes:
  - README.md
  - https://router.vuejs.org/guide/advanced/scroll-behavior.html
  - https://nuxt.com/docs/4.x/api/advanced/hooks
  - https://nextjs.org/docs/app/api-reference/components/link
  - https://svelte.dev/docs/kit/$app-navigation
estado: verificado
version: 1.3.27
---
# Navegación sin recarga con Lenis

Si el contenido cambia sin recargar, el navegador no coloca el scroll y Lenis no se entera a tiempo. Esta ficha fija la receta común a cualquier tecnología: la función `colocar`, que cada [`int-*`](int-contrato.md) conecta en su gancho de ruta. La receta completa, con hash y posición guardada, está en [`rec-navegacion`](../08-recetas/rec-navegacion.md).

Alcance: lo probado vale para ventana y contenedor con `overflow` en hoja de estilo, con `lerp` y con `duration`, con y sin `lenis.css`, salvo donde se indica. Laboratorio del 2026-11-05: ver [`int-contrato`](int-contrato.md).

## Problema

Tres hechos, sobre la instancia que sobrevive al cambio de vista:

- **`limit` llega tarde.** Los `ResizeObserver` esperan 250 ms sin cambios. Al sustituir el contenido, `limit` siguió en 4718 con 1106 reales a los 120 ms, y se corrigió a los 520 ms. Laboratorio.
- **El reinicio del enrutador se pierde en plena inercia.** Durante una animación, Lenis escribe la posición en cada fotograma e ignora el scroll nativo: un `window.scrollTo(0, 0)` en mitad de la inercia acabó en 3000. [E]
- **`resize()` no corta la inercia, e iguala `targetScroll` al scroll real.** Deja la animación en marcha. Si después pides el mismo sitio en el que ya está el scroll, `scrollTo` sale por la rama `destino === targetScroll`, que va **antes** de mirar `immediate`, y no corta nada. [C] [E]

Por eso `resize()` seguido de `scrollTo(0, { immediate: true, force: true })` falla justo en el caso real: **el enrutador ya colocó el scroll en 0 y no hay un fotograma de por medio**. Fuera de ese caso funciona, y por eso pasa desapercibido.

## Solución

```js fragmento
function colocar(lenis, destino = 0) {
  const salto = { immediate: true, force: true };
  lenis.scrollTo(lenis.targetScroll ? 0 : 1, salto); // 1. corta: un valor distinto de targetScroll
  lenis.resize();                                    // 2. mide la vista nueva
  lenis.scrollTo(destino, salto);                    // 3. coloca con el limit nuevo
}
```

Va después de que la vista nueva esté en el DOM, en una sola pasada. `force` hace que funcione aunque la instancia esté parada. `destino` admite lo mismo que `scrollTo`, también un elemento.

Se comprueba en la rama que fallaba: el enrutador ya llevó el scroll a 0, y la receta corre sin fotogramas entre medias.

```js
function colocar(lenis, destino = 0) {
  const salto = { immediate: true, force: true };
  lenis.scrollTo(lenis.targetScroll ? 0 : 1, salto);
  lenis.resize();
  lenis.scrollTo(destino, salto);
}
const relleno = document.createElement("div");
relleno.style.height = "6000px";
document.body.append(relleno);
const lenis = new Lenis({ autoRaf: true });
lenis.resize();

// El orden que falla: medir primero
rueda(3000);
await espera(80);
window.scrollTo(0, 0);                 // lo que hace un enrutador
lenis.resize();
lenis.scrollTo(0, { immediate: true, force: true });
const sigue = lenis.isScrolling;
await espera(900);
const mal = Math.round(window.scrollY);

// colocar, en el mismo punto
lenis.scrollTo(0, { immediate: true });
await espera(50);
rueda(3000);
await espera(80);
window.scrollTo(0, 0);
relleno.style.height = "1500px";
colocar(lenis);
const cortada = lenis.isScrolling;
await espera(900);
const r = { y: window.scrollY, estado: lenis.isScrolling, destino: lenis.targetScroll, limite: lenis.limit };
lenis.destroy();
relleno.remove();
window.scrollTo(0, 0);
// prueba: sigue === "smooth" && mal > 2000
// prueba: cortada !== "smooth" && r.y === 0 && r.estado !== "smooth" && r.destino === 0 && r.limite > 0
```

Igual dentro de un contenedor, con la rueda sobre él y un destino que el `limit` viejo recortaría. Aquí el contenido aún no se ha medido, y el último `scrollTo` lo necesita:

```html
<style>.caja { height: 300px; overflow: auto; }</style>
<div class="caja"><div style="height:1200px"></div></div>
```

```js
function colocar(lenis, destino = 0) {
  const salto = { immediate: true, force: true };
  lenis.scrollTo(lenis.targetScroll ? 0 : 1, salto);
  lenis.resize();
  lenis.scrollTo(destino, salto);
}
const caja = document.querySelector(".caja");
const dentro = caja.firstElementChild;
const lenis = new Lenis({ wrapper: caja, content: dentro, autoRaf: true, duration: 1.2 });
rueda(800, caja);
await espera(80);
const enMarcha = lenis.isScrolling;

dentro.style.height = "6000px";
caja.scrollTop = 2500;                 // ya en destino
colocar(lenis, 2500);
await espera(900);
const r = { y: caja.scrollTop, estado: lenis.isScrolling, destino: lenis.targetScroll };
lenis.destroy();
// prueba: enMarcha === "smooth"
// prueba: r.y === 2500 && r.estado !== "smooth" && r.destino === 2500
```

### Qué orden funciona

Chrome 156, rueda real, 2026-11-05. Combinaciones: ventana y contenedor con `overflow` en hoja, `lerp` y `duration`, con y sin `lenis.css`. Inicio: rueda de 3000, 120 ms de inercia, y la vista encoge.

| Orden | Scroll ya en destino | Scroll sin colocar |
|---|---|---|
| `resize()`, `scrollTo(0)` | **Mal, 8 de 8:** termina en el `limit` | Bien, 8 de 8 |
| `scrollTo(0)`, `resize()` | Bien, 8 de 8 | Bien, 8 de 8 |
| `resize()`, `stop()`, `start()`, `scrollTo(0)` | Llega a 0 con `isScrolling` colgado en `"native"`, 8 de 8 | En contenedor con hoja acaba en el `limit`: `stop()` deja `scrollTop` a 0 |
| `colocar` | Bien | Bien |

`colocar` dio 40 de 40. Esos casos incluyen el `destino` 0 y 2500, con `limit` viejo y con el scroll ya en destino, e inercia hacia arriba que iba a 0. También se comprobó con un `scrollTo` animado en curso, con `infinite`, con instancia parada y en un contenedor horizontal.

Por qué no bastan dos pasos:

| Caso | `scrollTo(destino)`, `resize()` |
|---|---|
| Destino más allá del `limit` viejo | Se recorta: 900 en vez de 2500 |
| La inercia ya iba a ese destino, como rueda arriba hacia 0 | No corta: desde 0, la página salta a 181 y vuelve a bajar a 0 |

Un `requestAnimationFrame` entre el reinicio y `resize()` también funciona, pero solo porque Lenis alcanza a escribir un fotograma: enseña un salto y depende del orden de los bucles. No lo uses. [P]

### En apps reales

Base con `autoRaf` y sin GSAP, en producción, en plena inercia hacia 1500 y yendo a una vista de 200 de límite. "En destino" es lo que encontró `colocar` al entrar. Control negativo con `resize()` antes de `scrollTo`:

| App | Scroll al llegar a `colocar` | `colocar`, a los 60 ms y a los 1460 ms | Control negativo |
|---|---|---|---|
| Next 16.4 | **0, ya en destino** | 0, `limit` 200, sin `smooth` | **200, se pierde** |
| SvelteKit 3.1 | **0, ya en destino** | Igual | **200, se pierde** |
| React Router 8.5 | 200 | Igual | 0 |
| Vue Router 5.4 | 200 | Igual | 0 |
| Nuxt 4.6 | 200 | Igual | 0 |
| Angular 22.2 | 200 | Igual | 0 |

Las seis completaron el escenario común con `colocar`: una instancia viva, 1 `raf` por fotograma e instancia, oyentes de `window` iguales tras cinco ciclos, sin avisos ni excepciones. Se repitió con GSAP, y un `ScrollTrigger` con `scrub`, en las seis.

Sin ningún reinicio, en laboratorio, desde `scrollY` 1500 y yendo a una vista de 900 px de alto:

| Enrutador | En reposo | En plena inercia |
|---|---|---|
| React Router, Vue Router sin `scrollBehavior` | Queda en 200, recortado | 200 |
| Next, Nuxt, SvelteKit | Va a 0 | **200: se pierde** |
| Angular, por defecto | 0, pero por accidente: ver [`int-angular`](int-angular.md) | **200: se pierde** |

### Enlaces y clics

`stopInertiaOnNavigate: true` corta la inercia al pulsar un `<a>` de otra ruta, y solo eso: no cubre las navegaciones por código, no coloca el scroll y no mide. [C] Lenis no toca `history.scrollRestoration`: ver [`com-restauracion`](../04-comportamiento/com-restauracion.md).

## Trampas

- **Llamar a `colocar` antes de que exista la vista nueva.** Mide lo que hay. Busca el gancho posterior a la navegación, no el anterior. [C]
- **Vista provisional.** Si un estado de carga o datos diferidos cambian el alto después, `resize()` midió la vista provisional. Los `ResizeObserver` lo corrigen a los 250 ms; si necesitas el `limit` antes, llama otra vez a `resize()` al llegar el contenido final. Sin ejecutar. [P]
- **Contenedor que persiste entre rutas.** Una instancia en un contenedor que no sale al cambiar de ruta no se entera: sus medidas no se rehacen y su inercia sigue. Llama a `colocar` también sobre esa instancia. Sin ejecutar. [P]
- **Transición de salida.** Si la vista anterior se anima al salir, `colocar` debe correr cuando la vista nueva ya mida lo definitivo: normalmente al terminar la transición, y no al empezar. Sin ejecutar. [P]
- **Conservar la posición.** Si una navegación debe quedarse donde está, no llames a `colocar` con 0: pasa `lenis.actualScroll`. [C]
- **Otra lectura del scroll al mismo tiempo.** `colocar` emite `scroll` dos o tres veces seguidas, con el valor de corte incluido, antes de pintar. Un oyente que reaccione a saltos los verá. [C]
- **`infinite`.** `colocar` funcionó en la prueba, pero con `scroll` exactamente en un múltiplo de `limit`, la primera rama vuelve a coincidir con `targetScroll`. Sin ejecutar ese caso. [C]
