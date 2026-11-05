---
id: int-gsap
titulo: Lenis con GSAP y ScrollTrigger
capa: 06-integracion
tipo: patron
ambito: transversal
resumen: Un solo reloj con gsap.ticker, unidad de tiempo de raf, por qué ScrollTrigger.update y qué hace realmente lagSmoothing(0), medido con rueda real y scrub.
api: [Lenis.raf, Lenis.on, Lenis.destroy, Lenis.resize, Lenis.limit, LenisOptions.autoRaf]
requiere: [int-contrato, com-raf]
relacionadas: [int-canvas-webgl, com-dimensiones, com-sticky-fixed, rec-parallax, cal-conflictos, cal-errores]
etiquetas: [gsap, scrolltrigger, ticker, scrub, lagsmoothing]
fuentes:
  - README.md
  - packages/react/README.md
  - packages/vue/README.md
estado: verificado
version: 1.3.27
---
# Lenis con GSAP y ScrollTrigger

Lenis mueve el scroll nativo, así que ScrollTrigger funciona sin `scrollerProxy`. Lo único que hay que resolver es el tiempo: que ambos avancen con un solo reloj y que ScrollTrigger lea la posición del mismo fotograma. [C]

GSAP es un caso de [reloj externo](int-contrato.md): sin él, Lenis no necesita nada de esta ficha. Laboratorio del 2026-11-05: gsap 3.15.1, Chrome 156 headless, rueda real, ver [`int-contrato`](int-contrato.md). ScrollTrigger se leyó del paquete `gsap` de esa versión.

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| `entrar({ reloj: relojGsap })` | `lenis.resize()` y `ScrollTrigger.refresh()`, cada uno por su lado; `lenis.options` | `salir()`, que quita el ticker; `ScrollTrigger`, aparte | [`colocar`](int-navegacion.md) y después `ScrollTrigger.refresh()` | Sin GSAP, nada, con `autoRaf`. Con GSAP, `gsap.ticker` es el dueño de `raf` |

## Problema

GSAP y Lenis tienen cada uno su bucle. Sin unirlos, `raf` corre en otra parte del fotograma, ScrollTrigger recibe la posición un fotograma después y los `scrub` quedan por detrás del contenido.

## Solución

```js
const lenis = new Lenis();                              // sin autoRaf
const paso = (time) => lenis.raf(time * 1000);          // segundos a milisegundos

lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add(paso);
gsap.ticker.lagSmoothing(0);

const estado = { z: 0 };
gsap.to(estado, { z: 100, ease: "none", scrollTrigger: { start: 0, end: 1000, scrub: true } });

await espera(60);
rueda(500);
await espera(60);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
const r = { y: Math.round(window.scrollY), z: Math.round(estado.z) };

gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
window.scrollTo(0, 0);
// prueba: r.y === 500 && r.z === 50
```

Para retirar el ticker necesitas **la misma función**: guárdala. `destroy()` no la quita, y un `raf` vivo sigue moviendo la página: ver [`int-contrato`](int-contrato.md#trampas). `destroy()` sí retira el `on("scroll")`, porque vacía su emisor. [C]

### El reloj para el adaptador

`relojGsap` es lo que recibe `entrar({ reloj })` del [adaptador](int-contrato.md), y se ejecutó con él en Svelte y Angular, y con la misma forma en Vue y Nuxt. `iniciarScroll({ bucle })` solo entrega `paso`: con esa plantilla, conecta `ScrollTrigger.update` aparte. [E]

```js
const relojGsap = (paso, lenis) => {
  const tick = (t) => paso(t * 1000);
  const quitar = lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    quitar();
  };
};

const lenis = new Lenis({ lerp: 0.5 });
const quitarReloj = relojGsap((ms) => lenis.raf(ms), lenis);
lenis.scrollTo(300);
await espera(500);
const y = window.scrollY;
quitarReloj();
lenis.scrollTo(600);
await espera(200);
const sinReloj = window.scrollY;
lenis.destroy();
window.scrollTo(0, 0);
// prueba: y === 300 && sinReloj === 300
```

### Cada pieza, medida

| Pieza | Sin ella | Con ella |
|---|---|---|
| `time * 1000` | `raf` recibe segundos: ver abajo | `dt` correcto |
| Quitar `autoRaf` | Dos relojes: un paso de más por fotograma. Si GSAP arranca más de unos 118 s después que la página, salto o `NaN`: ver [`com-raf`](../04-comportamiento/com-raf.md) | Un reloj |
| `lenis.on("scroll", ScrollTrigger.update)` | ScrollTrigger va **un fotograma por detrás** | Mismo fotograma |
| `lagSmoothing(0)` | Tras un bloqueo, el tiempo se recorta | El tiempo es el real, y el scroll salta |

**La unidad.** El ticker da segundos y `raf` espera milisegundos. Sin multiplicar, cada `dt` es mil veces menor y el scroll apenas avanza, sin error. [E]

```js
const lenis = new Lenis();
const mal = (time) => lenis.raf(time);
gsap.ticker.add(mal);
rueda(500);
await espera(500);
const y = window.scrollY;
gsap.ticker.remove(mal);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: y < 20
```

**`ScrollTrigger.update`.** ScrollTrigger ya escucha el evento `scroll`, pero ese evento llega al inicio del fotograma siguiente. El oyente de Lenis lo adelanta. Laboratorio, en 60 fotogramas de movimiento, leyendo tras `raf` dentro del ticker: [C]

| | Fotogramas con `st.scroll()` distinto de `scrollY` | Ejemplo: `scrollY`, `st.scroll()` |
|---|---|---|
| Con `on("scroll", update)` | 0 de 60 | 497, 497 |
| Sin él | 60 de 60 | 503, 402 |

Al terminar, los dos llegan al mismo valor: el defecto solo se ve en movimiento, y es peor cuanto más rápido. `ScrollTrigger.update` recibe la instancia de Lenis como argumento `force`, y es inocuo: solo fuerza con `force === true`. [C]

**`lagSmoothing(0)`.** Por defecto, si un fotograma tarda más de 500 ms, GSAP finge que pasaron 33 ms. `lagSmoothing(0)` lo desactiva. Laboratorio, con un bloqueo real de 800 ms del hilo principal:

| Prueba | Por defecto | `lagSmoothing(0)` |
|---|---|---|
| `scrollTo` de 1 s, duración real | 1757 ms | 1102 ms |
| Rueda con `lerp`, tras el bloqueo | Sigue suave: 1657, 1899, 1905 | Salta: 1780, 2990 |

La documentación dice que evita retrasos, y es cierto, pero el precio es un salto tras cada bloqueo. Ninguna opción desincroniza ScrollTrigger. Es un ajuste **global** del ticker: afecta a todas las animaciones GSAP de la página y `lenis.destroy()` no lo revierte. Si lo quieres restaurar al salir: `gsap.ticker.lagSmoothing(500, 33)`. [P]

### Dimensiones

ScrollTrigger y Lenis miden por separado. `pin` añade alto a la página: `limit` lo recoge con hasta 250 ms de retraso. Si creas animaciones justo al entrar y necesitas llegar al final de inmediato, sincroniza a mano. `ScrollTrigger.refresh()` no llama a `lenis.resize()`, ni al revés. [C] [E]

```js
const lenis = new Lenis({ autoRaf: true });
document.body.insertAdjacentHTML("beforeend", '<div id="fijo" style="height:300px"></div>');
gsap.to("#fijo", { x: 10, scrollTrigger: { trigger: "#fijo", pin: true, end: "+=4000", scrub: true } });
ScrollTrigger.refresh();
const real = document.documentElement.scrollHeight - innerHeight;
const viejo = lenis.limit;
lenis.resize();
const nuevo = lenis.limit;
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
// prueba: viejo < real && nuevo === real
```

Si cambia la vista sin recarga: [`colocar(lenis)`](int-navegacion.md), que corta, mide y coloca, y después `ScrollTrigger.refresh()`. Laboratorio: pasó el escenario común, con un `ScrollTrigger` con `scrub`, en las seis apps.

Un contenedor con `wrapper` necesita que ScrollTrigger sepa cuál es su `scroller`: pásalo a cada animación. Sin `scrollerProxy`, porque el scroll sigue siendo nativo. [P]

## Trampas

- **`time` no es el `dt`.** `gsap.ticker.add((time, deltaTime) => ...)` también pasa el delta, en milisegundos. `lenis.raf(deltaTime)` falla: `raf` necesita un reloj creciente y calcula el `dt` él mismo. [C]
- **Registrar el plugin.** `gsap.registerPlugin(ScrollTrigger)` va una vez, en el ámbito del módulo, y `lenis.on` en el gancho de entrar: importar es seguro en servidor, construir Lenis no. [P]
- **Orden en el ticker.** `gsap.ticker.add` añade al final: los tweens corren antes que `raf`, y `ScrollTrigger.update` actualiza los `scrub` en el mismo tick, dentro del `emit` de Lenis. Con `scrub: 0.5`, el retardo es el que pides, no el de Lenis. [C]
- **Efectos de velocidad.** `lenis.velocity` son píxeles **por llamada a `raf`**, no por segundo: ver [`api-instancia`](../03-api/api-instancia.md). Lo escalado a mano cambia con la frecuencia de la pantalla. [C]
- **ScrollSmoother encima.** Es otro suavizado, y los dos se apilan: ver [`cal-conflictos`](../07-calidad/cal-conflictos.md).
- **Pestaña oculta.** `gsap.ticker` se apoya en `requestAnimationFrame`; con la pestaña oculta el `dt` al volver es enorme, y con `lagSmoothing(0)` llega entero a Lenis: la animación termina de golpe. Ver [`com-raf`](../04-comportamiento/com-raf.md). [C]
