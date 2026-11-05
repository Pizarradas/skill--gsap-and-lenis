---
id: orq-navegacion
titulo: Cambio de vista sin recarga con ambas bibliotecas
capa: 03-ciclo
tipo: ciclo
perfiles: [ninguno, gsap, gsap-smoother, lenis, gsap+lenis]
resumen: colocar de Lenis combinado con ScrollTrigger: revertir, sustituir, colocar arriba, montar, medir y colocar. Qué falla en cada otro orden y qué aporta clearScrollMemory.
relacionadas: [orq-ciclo, orq-reducido, cmb-scroll-programatico, cmb-medidas]
fuentes:
  - lenis:int-navegacion
  - lenis:rec-navegacion
  - lenis:int-gsap
  - gsap:scr-refresh
  - gsap:cal-st-errores
  - gsap:rec-transicion-paginas
  - gsap:scr-smoother-api
  - lab:orquestador-lab
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Cambio de vista sin recarga

Cada base resuelve su mitad. [`lenis:int-navegacion`](../lenis-knowledge/06-integracion/int-navegacion.md) da `colocar` (cortar, medir, colocar), y dice que después va `ScrollTrigger.refresh()`. [`gsap:cal-st-errores`](../gsap-knowledge/13-calidad/cal-st-errores.md) da revertir, sustituir, crear y refrescar. Juntas no bastan: ninguna dice **dónde está el scroll cuando se crean los disparadores de la vista nueva**.

`api.navegar(destino, { cambiar, montar })` hace todo esto.

Laboratorio del 2026-11-05: Chrome 156, rueda real, inercia en curso hacia arriba desde 5900, ventana y contenedor con `overflow` en hoja, `lerp` y `duration`, con `lenis.css`.

## El orden

```text
1. cortar        la inercia, sin mover la página
2. revertir      las animaciones de la vista que sale
3. cambiar       sustituye el DOM, puede ser asíncrono
4. colocar(0)    cortar, resize, scrollTo
5. montar        crea los disparadores de la vista nueva, con el scroll ya en 0
6. refresh       y después resize
7. colocar(destino)
```

Sin `cambiar` ni `montar`, porque el enrutador ya sustituyó la vista: solo 1, 6 y 7, en un turno, sin esperar un fotograma. El paso 6 es O18. Mover el scroll por otra vía en estos pasos es O08.

| Orden probado | Destino 0 | Destino `#dest` | `end` que cambia al refrescar |
|---|---|---|---|
| Sustituir, crear, `colocar`, `refresh` (`lenis:int-gsap`) | **`once` disparado en contenedor**, 2 de 6 | Bien, 6 de 6 | **Destino 3000 px antes**, 6 de 6 |
| Sustituir, crear, `refresh`, `colocar` | **`once` disparado en contenedor**, 2 de 6 | Bien, 6 de 6 | Bien, 6 de 6 |
| `colocar` antes de sustituir, crear, `colocar`, sin `refresh` | Bien, 6 de 6 | `isScrolling` colgado en `"native"`, 6 de 6 | **Destino 3000 px antes**, 6 de 6 |
| El de arriba | Bien, 10 de 10 | Bien, 10 de 10 | Bien, 10 de 10 |

### Colocar antes de crear

Un disparador nuevo mide y se actualiza con la posición que encuentre. Un `once` del final de la vista nueva se gasta sin que nadie lo haya visto, y al volver a bajar no pasa nada. En un contenedor es el caso normal, porque el enrutador solo reinicia la ventana. En ventana ocurre si la inercia pisó ese reinicio y el scroll viejo cae dentro de la vista nueva. En la tabla no aparece en ventana porque allí la vista nueva, antes del pin, era más corta que el scroll viejo: el navegador lo recortó por debajo del disparador.

```html
<style>.caja-nav { position: relative; height: 300px; overflow: auto; }</style>
<div class="caja-nav"><div class="dentro-nav"><div style="height:6000px"></div></div></div>
```

```js
const caja = document.querySelector(".caja-nav");
const dentro = document.querySelector(".dentro-nav");
function colocar(lenis, destino = 0) {
  const salto = { immediate: true, force: true };
  lenis.scrollTo(lenis.targetScroll ? 0 : 1, salto);
  lenis.resize();
  lenis.scrollTo(destino, salto);
}
async function prueba(colocarPrimero, enCaja) {
  caja.classList.toggle("caja-nav", enCaja);
  const marco = enCaja ? caja : document.documentElement;
  dentro.innerHTML = '<div style="height:6000px"></div>';
  const lenis = new Lenis(enCaja ? { wrapper: caja, content: dentro, lerp: 0.5 } : { lerp: 0.5 });
  const tick = (t) => lenis.raf(t * 1000);
  const quitar = lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  lenis.scrollTo(2000, { immediate: true });
  await espera(40);
  rueda(600, enCaja ? caja : undefined);
  await espera(40);

  let visto = 0;
  dentro.innerHTML = '<div style="height:1500px"></div><div class="final-nav" style="height:100px"></div><div style="height:1500px"></div>';
  if (colocarPrimero) colocar(lenis);
  const ctx = gsap.context(() => {
    ScrollTrigger.create({ trigger: ".final-nav", scroller: enCaja ? caja : window, start: "top 80%", once: true, onEnter: () => visto++ });
  });
  ScrollTrigger.refresh();
  lenis.resize();
  colocar(lenis);
  await espera(60);
  const y = marco.scrollTop;
  gsap.ticker.remove(tick);
  quitar();
  lenis.destroy();
  ctx.revert();
  return { visto, y };
}
const r = [await prueba(false, true), await prueba(true, true), await prueba(false, false), await prueba(true, false)];
// prueba: r.map((x) => x.visto).join() === "1,0,1,0"
// prueba: r.every((x) => x.y === 0)
```

### Colocar después de medir

Un destino puede depender de lo que solo `refresh()` sabe: el largo de un pin en función, que da otra altura. `colocar` antes de medir usa la posición vieja. Aquí el segundo caso es la secuencia entera:

```html
<div class="vista-nav"><div style="height:300px"></div><div class="pin-nav" style="height:100px"></div><div style="height:1200px"></div><div class="destino-nav" style="height:200px"></div><div style="height:900px"></div></div>
```

```js
function colocar(lenis, destino = 0) {
  const salto = { immediate: true, force: true };
  lenis.scrollTo(lenis.targetScroll ? 0 : 1, salto);
  lenis.resize();
  lenis.scrollTo(destino, salto);
}
async function prueba(medirAntes) {
  const lenis = new Lenis({ lerp: 0.5 });
  const tick = (t) => lenis.raf(t * 1000);
  const quitar = lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  let largo = 500;
  const ctx = gsap.context(() => {
    gsap.to(".pin-nav", { x: 5, scrollTrigger: { trigger: ".pin-nav", pin: true, start: "top top", end: () => "+=" + largo, scrub: true } });
  });
  largo = 2500;                       // lo que una fuente o una imagen cambia antes de medir
  if (medirAntes) { ScrollTrigger.refresh(); lenis.resize(); colocar(lenis, ".destino-nav"); }
  else { colocar(lenis, ".destino-nav"); ScrollTrigger.refresh(); }
  const top = Math.round(document.querySelector(".destino-nav").getBoundingClientRect().top);
  gsap.ticker.remove(tick);
  quitar();
  lenis.destroy();
  ctx.revert();
  window.scrollTo(0, 0);
  return top;
}
const mal = await prueba(false);
const bien = await prueba(true);
// prueba: Math.abs(mal - 2000) < 2 && Math.abs(bien) < 2
```

## `clearScrollMemory`

[`gsap:scr-refresh`](../gsap-knowledge/07-scroll/scr-refresh.md) la recomienda para que `refresh()` no devuelva la página a la posición anterior. En 3.15.1 **no cambió nada en ningún caso**: ventana, contenedor, ScrollSmoother, nativo, y una transacción de `matchMedia`. La causa está en el código: `_refreshAll` graba la posición al empezar y la borra al terminar, y `kill()` la borra si era el último disparador del scroller. Fuera de esa ventana, `rec` vale 0. [C] [E]

La plantilla la llama en `navegar`, sin argumentos, porque es inocua y una versión futura podría cambiar esto. **No le pases un valor.** Con `"manual"` se recuerda en una variable interna y cada `refresh` lo vuelve a aplicar: después de salir, nadie puede devolver `history.scrollRestoration`:

```js
const previa = history.scrollRestoration;
ScrollTrigger.clearScrollMemory("manual");
history.scrollRestoration = previa;
ScrollTrigger.refresh();
const tras = history.scrollRestoration;
ScrollTrigger.clearScrollMemory("auto");
history.scrollRestoration = previa;
// prueba: previa === "auto" && tras === "manual"
```

Por eso `navegar` escribe `history.scrollRestoration` directamente, solo con la ventana como raíz, y `salir` lo devuelve. Escribirlo una vez no se sostiene: cada `refresh` repone el valor que ScrollTrigger leyó al registrarse, `auto`, y al volver atrás el navegador restaura la vista vieja antes de `popstate`: `scrollY` pasa por 800, 1500 y 0. La plantilla lo reescribe después de cada `refresh`, el suyo o uno ajeno: 800 y 0, en `gsap`, `gsap-smoother` y `gsap+lenis`. Laboratorio `e16`. [E]

## Por perfil

Lo que cambia es cortar y colocar; el orden es el mismo.

| Perfil | Cortar | Colocar |
|---|---|---|
| `ninguno` | `scrollTo({ top: actual, behavior: "instant" })` | `scrollTo({ top, behavior: "instant" })` |
| `gsap` | Además, `gsap.killTweensOf(ventana o contenedor)`: un `ScrollToPlugin` en curso seguiría | Igual |
| `gsap-smoother` | Matar el tween sobre `smoother`, y saltar a la posición actual | `smoother.scrollTo(y, false)`, reanudando si está en pausa |
| `lenis`, `gsap+lenis` | `scrollTo(y - 1, { immediate, force })`, solo si `isScrolling === "smooth"` | `colocar` |

El corte del paso 1 no usa `colocar`: su primer `scrollTo` va a 0 o a 1, y con un `cambiar` asíncrono se vería la vista vieja saltar arriba. El de `y - 1` difiere de `targetScroll` también en un `scrollTo` animado, donde `targetScroll` sigue a la posición. [C]

Destinos con número, selector o elemento dan la misma posición en los cinco perfiles: `navegar` e `irA` calculan el número ellos, con `scroll-margin` y `scroll-padding`, como Lenis. Con ScrollSmoother usan `smoother.offset`, que descuenta los efectos.

Laboratorio con la plantilla, rueda real de 2500, los cinco perfiles en ventana y contenedor, y el destino debajo de un pin: `rect.top` 0 en los 10 casos, sin `once` disparado, sin excepciones.

## Vistas que entran y salen

- `añadir(fn)` registra una entrada de la vista: `navegar` con `cambiar` la retira. `añadir(fn, { persistente: true })` sobrevive.
- En un enrutador que sustituye él mismo la vista, retira con la función que devuelve `añadir`, en el gancho de desmontar, y llama a `navegar(destino)` en el gancho posterior a la navegación. Monta los disparadores **después** de `navegar`, o en contenedores repite el fallo del `once`.
- Dos `navegar` seguidos: el primero resuelve `false` tras su fase asíncrona, sin colocar.
- `navegar` no mueve el foco. Hazlo en `montar`, con `{ preventScroll: true }`: [`gsap:rec-transicion-paginas`](../gsap-knowledge/14-recetas/rec-transicion-paginas.md).

## Limitaciones

- **Arranque de ScrollSmoother.** En sus primeros 500 ms, `startupPhase` hace que un refresco no restaure el progreso. Si además hubo un scrub en la última duración de `smooth`, el contenido vuelve a deslizarse hasta el destino. Se vio solo navegando **sin un fotograma** después de otro salto, en esos 500 ms, y de forma intermitente: 1 de 18 con 60 ms de margen, 1000 px durante unos 75 ms con `smooth: 0.1` (`e9b.txt`). Llega al sitio, y con 200 ms no se dio, 18 de 18, ni con 700 ms, 36 de 36 (`e9.txt`). No hay API para evitarlo. [C] [E]
- **Anclas en ScrollSmoother.** Un enlace `#id` nativo parece funcionar y deja la página rota: el navegador desplaza el `wrapper` a 3040 mientras `scrollY` y `smoother.scrollTop()` siguen en 0, y una rueda posterior no lo corrige. La plantilla intercepta el enlace y llama a `irA`: `wrapper` 0, `scrollY` 3040 y `top` 0. Sin plantilla, hazlo tú. Laboratorio `e16`. [E]
- **Vistas que cambian de alto después.** Si llega contenido tras `navegar`, llama a `actualizar()`. Con ScrollSmoother, `autoResize` lo corrige solo a los 200 ms. [C]
- Sin probar: Safari, iOS, toque real, y `colocar` con `infinite`. [P]
