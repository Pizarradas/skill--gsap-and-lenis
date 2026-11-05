---
id: orq-ciclo
titulo: Orden de entrar, cambiar y salir en cada perfil
capa: 03-ciclo
tipo: ciclo
perfiles: [ninguno, gsap, gsap-smoother, lenis, gsap+lenis]
resumen: Secuencia exacta para iniciar, volver a medir y retirar cada perfil, qué inversión falla de verdad y cuáles dan igual, ejecutado con ambas bibliotecas.
relacionadas: [orq-navegacion, orq-reducido, orq-propiedad, cmb-salida, cmb-medidas]
fuentes:
  - gsap:nuc-context
  - gsap:scr-refresh
  - gsap:scr-smoother
  - gsap:scr-smoother-api
  - lenis:int-gsap
  - lenis:int-contrato
  - lenis:com-dimensiones
  - lenis:com-stop-start
  - lab:orquestador-lab
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Orden de entrar, cambiar y salir

`plantillas/orquestador.js` aplica estos órdenes: si la usas, no los escribes. Esta ficha dice cuáles importan y por qué. Hay menos de los que parece: `salir` corre en un solo turno, sin fotogramas, y varias inversiones no cambian nada.

Laboratorio del 2026-11-05: Chrome 156 con rueda real, gsap 3.15.1, lenis 1.3.27. Guiones y salidas en `_notas/orquestador-lab/`, cada `eN.cjs` con su `eN.txt`. Alcance salvo aviso: ventana y contenedor con `overflow` en hoja, `lerp` y `duration`, con `lenis.css`, rueda.

## Secuencias

| Perfil | Entrar | Cambiar | Salir |
|---|---|---|---|
| `ninguno` | Nada | Nada | Soltar el bloqueo |
| `gsap` | `registerPlugin`; contexto; animaciones | `ScrollTrigger.refresh()` | Soltar el bloqueo; `ctx.revert()` |
| `gsap-smoother` | `registerPlugin`; `ScrollSmoother.create` **fuera de todo contexto**; contexto; animaciones | `ScrollTrigger.refresh()` | `paused(false)`; `ctx.revert()`; `smoother.kill()`; limpiar lo que `kill` deja |
| `lenis` | `new Lenis({ autoRaf: true })` con el contenido en el DOM; con motor propio, `autoRaf: false` y su bucle llama a `lenis.raf(t)` | `lenis.resize()` | Soltar el bloqueo; `lenis.destroy()`; quitar `transitionend` |
| `gsap+lenis` | `registerPlugin`; `new Lenis()` sin `autoRaf`; `on("scroll", ScrollTrigger.update)`; `resize()` en cada `refresh` de ScrollTrigger; `gsap.ticker.add`; animaciones; `actualizar` | `ScrollTrigger.refresh()` y **después** `lenis.resize()` | Soltar el bloqueo; `ctx.revert()`; `gsap.ticker.remove`; `lenis.destroy()`; quitar `transitionend` |

## Qué inversión falla

| Orden | Si se invierte | Prueba |
|---|---|---|
| `refresh()` antes que `resize()` (O18) | `limit` se queda en el alto anterior | Abajo |
| ScrollSmoother fuera del contexto | `ctx.revert()` lo mata: la página pierde el suavizado al retirar una vista | Abajo |
| `ticker.remove` junto a `destroy()` (O22) | Si falta, la página sigue moviéndose tras `destroy()` | Abajo |
| Colocar antes de crear disparadores | Se disparan con el scroll viejo | [`orq-navegacion`](orq-navegacion.md) |

| Orden | Si se invierte | Prueba |
|---|---|---|
| `ctx.revert()` y `smoother.kill()` | **Nada.** Mismo DOM, mismos estilos, mismo scroll, en 0, 800 y 1500 | Laboratorio `e12` |
| `ctx.revert()` y `lenis.destroy()` | **Nada**, en plena inercia | Laboratorio `e12` |
| `ticker.remove` y `destroy()`, en el mismo turno | **Nada**: entre uno y otro no hay fotograma | Laboratorio `e12` |
| Pin creado antes o después de ScrollSmoother | **Nada**: `ScrollSmoother` reinicia los disparadores que ya existen | Abajo |

El orden de la tabla de secuencias sigue siendo el recomendado, porque se lee mejor y porque un cambio de versión podría volverlo necesario. No lo presentes como causa de un fallo.

### `refresh()` antes que `resize()`

`refresh()` puede cambiar el alto: un `end` en función da otro largo de pin. `resize()` antes de él mide el alto viejo, y `limit` tarda 250 ms en corregirse. Se comprueba en las dos raíces, con un `end` que cambia de 1000 a 4000:

```html
<style>.caja-ciclo { position: relative; height: 300px; overflow: auto; }</style>
<div class="caja-ciclo"><div class="dentro-ciclo"><div style="height:500px"></div><div class="fijo-ciclo" style="height:100px"></div><div style="height:1500px"></div></div></div>
```

```js
const caja = document.querySelector(".caja-ciclo");
const dentro = document.querySelector(".dentro-ciclo");
async function prueba(orden, enCaja) {
  caja.classList.toggle("caja-ciclo", enCaja);   // sin la clase, la página es la que se desplaza
  const lenis = new Lenis(enCaja ? { wrapper: caja, content: dentro } : {});
  const tick = (t) => lenis.raf(t * 1000);
  gsap.ticker.add(tick);
  let largo = 1000;
  const ctx = gsap.context(() => {
    gsap.to(".fijo-ciclo", { x: 10, scrollTrigger: { trigger: ".fijo-ciclo", scroller: enCaja ? caja : window, pin: true, start: "top top", end: () => "+=" + largo, scrub: true } });
  });
  ScrollTrigger.refresh();
  lenis.resize();
  largo = 4000;
  orden(lenis);
  const real = enCaja ? caja.scrollHeight - caja.clientHeight : document.documentElement.scrollHeight - innerHeight;
  const r = lenis.limit === real;
  gsap.ticker.remove(tick);
  lenis.destroy();
  ctx.revert();
  return r;
}
const bien = (l) => { ScrollTrigger.refresh(); l.resize(); };
const mal = (l) => { l.resize(); ScrollTrigger.refresh(); };
const r = [await prueba(bien, false), await prueba(mal, false), await prueba(bien, true), await prueba(mal, true)];
// prueba: r.join() === "true,false,true,false"
```

Laboratorio, con rueda real: 12 combinaciones de raíz, `lerp` o `duration` y orden. Tras `resize()` y `refresh()`, un destino en el final se recorta a 2500 de 5500 en ventana, y a 2800 de 5800 en contenedor. Con `refresh()` y `resize()`, llega.

**En plena inercia**, `actualizar` no estorba: la rueda de 1000 terminó en 1000 en los 12 casos. `resize()` iguala `targetScroll` al scroll real, así que un segundo gesto parte de ahí. [C]

**En reposo con scroll distinto de 0**, `refresh()` escribe 0 y la posición, y el evento `scroll` llega después: `isScrolling` queda en `"native"`, con la clase `lenis-scrolling`, hasta el siguiente gesto. Laboratorio `e15`. La plantilla lo evita tras cada `refresh`, también los que hace ScrollTrigger al redimensionar y los de `fijarReducido`, con un salto de ida y vuelta de 1 px, porque Lenis ignora el evento que sigue a un `immediate`. Laboratorio `e16`.

Crear un `pin` no necesita `refresh()` para que `limit` salga bien: el espaciador entra al crearlo. Hace falta `resize()`, o esperar 250 ms: [`lenis:int-gsap`](../lenis-knowledge/06-integracion/int-gsap.md).

### ScrollSmoother fuera del contexto

El constructor llama a `_context(this)`: dentro de un `gsap.context`, queda registrado y `revert()` lo mata. Si ese contexto es el de una vista, la página entera pierde el suavizado. [C]

```html
<div id="smooth-wrapper"><div id="smooth-content"><div style="height:3000px"></div></div></div>
```

```js
const dentro = gsap.context(() => { ScrollSmoother.create({ smooth: 0.1 }); });
const antes = !!ScrollSmoother.get();
dentro.revert();
const tras = !!ScrollSmoother.get();

const fuera = ScrollSmoother.create({ smooth: 0.1 });
const vista = gsap.context(() => { gsap.to(".x-ciclo", { x: 10 }); });
vista.revert();
const sigue = ScrollSmoother.get() === fuera;
fuera.kill();
// prueba: antes === true && tras === false && sigue === true
```

Da igual crear el pin antes o después:

```js
const st = gsap.to(".x-ciclo", { x: 10, scrollTrigger: { trigger: ".x-ciclo", pin: true, start: "top top", end: "+=300", scrub: true } }).scrollTrigger;
const s = ScrollSmoother.create({ smooth: 0.1 });
ScrollTrigger.refresh();
const adoptado = ScrollTrigger.getAll().includes(st) && st.pin !== undefined && s.scrollTrigger.end > 0;
st.kill();
s.kill();
// prueba: adoptado === true
```

### Lo que `kill()` deja atrás

`smoother.kill()` no devuelve dos cosas. [C] [E]

- `scroll-behavior: auto` en línea sobre `html` y `body`, que el constructor escribe con `gsap.set`.
- Tras cada `refresh`, ScrollSmoother encola un `requestAnimationFrame` que pone `overflow: visible` en `content`. Si `kill()` llega en ese hueco, aparece **después** de `kill()`.

```html
<div id="smooth-wrapper"><div id="smooth-content"><div style="height:3000px"></div></div></div>
```

```js
const s = ScrollSmoother.create({ smooth: 0.1 });
const contenido = s.content();
await espera(60);
ScrollTrigger.refresh();
s.kill();
const inmediato = contenido.style.overflow;
await espera(60);
const tarde = contenido.style.overflow;
const enHtml = document.documentElement.style.scrollBehavior;
document.documentElement.style.removeProperty("scroll-behavior");
document.body.style.removeProperty("scroll-behavior");
contenido.style.removeProperty("overflow");
// prueba: inmediato === "" && tarde === "visible" && enHtml === "auto"
```

Por eso `salir` recuerda esos estilos y repone `overflow` un fotograma después.

### El reloj vivo

`destroy()` no retira la función del ticker, y un `raf` vivo sigue avanzando la animación: en laboratorio, con inercia, 534 pasó a 898 después de `destroy()`, `e12.txt`. [E] Ver [`lenis:int-gsap`](../lenis-knowledge/06-integracion/int-gsap.md).

```js
const lenis = new Lenis();
const tick = (t) => lenis.raf(t * 1000);
gsap.ticker.add(tick);
await espera(40);
rueda(900);
await espera(60);
lenis.destroy();
const justo = window.scrollY;
await espera(300);
const despues = window.scrollY;
gsap.ticker.remove(tick);
window.scrollTo(0, 0);
// prueba: despues > justo
```

## Bloquear

`bloquear()` escribe `overflow: hidden` en línea **antes** de `lenis.stop()`. Invertido en un contenedor con hoja, `lenis.css` aplica `overflow: clip`, que lleva `scrollTop` a 0: ver [`lenis:com-stop-start`](../lenis-knowledge/04-comportamiento/com-stop-start.md). Con barra de scroll clásica, añade `scrollbar-gutter: stable` (O27): sin él, el contenido pasó de 985 a 1000 px; con él, 985, y las teclas no movieron la página, con `lenis.css` y sin ella. Laboratorio `e13`. Con ScrollSmoother usa `paused(true)`, y estando en pausa `scrollTop` no pinta: `navegar` reanuda, coloca y vuelve a pausar. [C] [E, prueba de la plantilla]

No se ha probado en iOS: `overflow: hidden` en `html` puede no frenar el dedo. [P]

## Trampas

- **`lagSmoothing`.** La plantilla no lo toca (O06): es global y no se puede leer el valor anterior, porque no tiene *getter*. [C]
- **`autoRaf` en `gsap+lenis`.** Se ignora y se avisa: ver la detección en [`plantillas/README.md`](../plantillas/README.md). En `lenis`, `opciones.lenis.autoRaf: false` se respeta para un motor propio. Un `raf` por fotograma, y lo dibujado coincide con lo pintado; con `autoRaf` y un bucle del motor creado antes que Lenis, 142 px de desfase en 60 de 127 fotogramas. Laboratorio `e16`. [E]
- **Medio segundo de arranque en ScrollSmoother.** Durante los primeros 500 ms tras crearlo, un refresco suyo no restaura el progreso: ver [`orq-navegacion`](orq-navegacion.md#limitaciones). [C] [E]
- **ScrollSmoother con Lenis.** O03: se avisa en ejecución. Dos instancias: O02.
- **Un nodo, dos papeles.** ScrollTrigger conserva el proxy de un `wrapper` de ScrollSmoother: usar luego ese nodo como `scroller` con otro perfil lee posiciones de la instancia muerta, y escribe `height` en `body`. Cambia de perfil recargando, o usa nodos distintos. [E, en el desarrollo de la plantilla]
