---
id: cal-st-errores
titulo: Errores de ScrollTrigger, por síntoma
capa: 13-calidad
tipo: diagnostico
ambito: ScrollTrigger
resumen: Síntomas de scroll con causa y corrección probada, ScrollTrigger anidado, valores viejos, orden de creación, refresh, saltos al cargar y navegación sin recarga.
api: [ScrollTrigger.refresh, ScrollTrigger.create, ScrollTrigger.getAll, ScrollTrigger.update, ScrollTrigger.Vars.refreshPriority, ScrollTrigger.Vars.invalidateOnRefresh, gsap.TweenVars.immediateRender]
relacionadas: [scr-scrolltrigger, scr-refresh, scr-scrub, scr-pin, scr-start-end, cal-errores-comunes, cal-depuracion]
etiquetas: [scroll, errores, diagnostico, refresh, pin]
fuentes:
  - resources/st-mistakes.md
estado: verificado
version: 3.15.1
---
# Errores de ScrollTrigger, por síntoma

Antes de nada: desactiva ScrollTrigger y comprueba que la animación funciona sola. Muchos fallos no son de scroll. Luego activa `markers: true` para ver dónde están realmente `start` y `end`. [O]

## Síntoma

| Lo que ves | Apartado |
|---|---|
| Un tween de un timeline no se mueve con scroll, y el timeline "termina" solo | [1](#1-scrolltrigger-en-un-tween-anidado) |
| La animación vuelve a 0 y luego salta | [2](#2-varios-to-sobre-la-misma-propiedad) |
| Todas las secciones animan juntas | [3](#3-un-tween-para-varias-secciones) |
| Tras redimensionar, `end` queda desfasado | [4](#4-medidas-fijadas-al-crear) |
| Quiero activar a mitad de pantalla y reiniciar fuera de ella | [5](#5-activar-y-reiniciar-en-puntos-distintos) |
| Un elemento se activa antes de verse, con un pin más arriba | [6](#6-creación-fuera-de-orden-con-pin) |
| Tras cargar contenido, todo se dispara en el sitio equivocado | [7](#7-contenido-nuevo-sin-refresh) |
| La animación con `scrub` aparece ya avanzada al cargar | [8](#8-salto-inicial-con-scrub) |
| Se sospecha de `scroll-behavior: smooth` | [9](#9-scroll-behavior-smooth) |
| Subir `duration` no alarga la animación | [10](#10-duración-con-scrub) |
| Al volver a una vista tras navegar sin recargar, falla | [11](#11-navegación-sin-recarga-y-sin-limpieza) |

## Causa

Tres ideas explican casi todo:

- Un ScrollTrigger **controla el cabezal** de su animación, y un tween anidado ya tiene cabezal: el del timeline padre. [O]
- Las posiciones se calculan en `refresh()`, no continuamente. Lo que cambia después no se ve hasta el siguiente. [O]
- `start` y `end` se fijan en orden de creación, teniendo en cuenta los pins anteriores. [O]

## Solución

### 1. ScrollTrigger en un tween anidado

Un tween no puede obedecer a la vez al scroll y al timeline padre. GSAP no avisa: el timeline llega al final mientras el tween queda parado. [E]

```js
const linea = gsap.timeline();
linea.to(".nido", {
  x: 100,
  duration: 0.1,
  scrollTrigger: { trigger: ".nido", start: "top -2000" },
});

await new Promise((r) => setTimeout(r, 300));
// prueba: linea.progress() === 1 && gsap.getProperty(".nido", "x") === 0
```

Corrección: el ScrollTrigger va en el timeline, o los tweens quedan sueltos. [O]

```js
const linea = gsap.timeline({ scrollTrigger: { trigger: ".nido-bien", scrub: true } });
linea.to(".nido-bien", { x: 100 }).to(".nido-bien", { y: 50 });
// prueba: linea.scrollTrigger !== undefined && ScrollTrigger.getAll().length === 1
```

### 2. Varios `to()` sobre la misma propiedad

Los ScrollTrigger renderizan su animación al crearse, para situarla. Así, el segundo tween graba como inicio el `x: 0` original, y al llegar a él salta. [O]

Las dos cajas de este bloque tienen la misma secuencia. La primera falla; la segunda lleva `immediateRender: false` en el tween posterior. Al 12,5 % de ese tramo, la primera ha saltado a -37 y la segunda ha partido de 100. [E]

```js
const mala = document.querySelector(".mala");
const buena = document.querySelector(".buena");
gsap.set([mala, buena], { position: "fixed", top: 0 });

const tramo1 = { start: 100, end: 300, scrub: true };
const tramo2 = { start: 400, end: 800, scrub: true };

gsap.to(mala, { x: 100, ease: "none", scrollTrigger: tramo1 });
gsap.to(mala, { x: -300, ease: "none", scrollTrigger: tramo2 });

gsap.to(buena, { x: 100, ease: "none", scrollTrigger: tramo1 });
gsap.to(buena, { x: -300, ease: "none", immediateRender: false, scrollTrigger: tramo2 });

for (const y of [200, 350, 450]) {
  window.scrollTo(0, y);
  ScrollTrigger.update();
  await new Promise((r) => setTimeout(r, 80));
}
const xMala = Math.round(gsap.getProperty(mala, "x"));
const xBuena = Math.round(gsap.getProperty(buena, "x"));
// prueba: xMala === -37 && xBuena === 50
```

Otras correcciones: `fromTo()` en los tweens posteriores, o un timeline con un único ScrollTrigger. [O]

### 3. Un tween para varias secciones

Con un selector general dentro o fuera de un bucle, se anima todo a la vez, y `trigger` toma el primer elemento. Crea un ScrollTrigger por elemento. [O]

```js
const secciones = gsap.utils.toArray(".sec");
secciones.forEach((sec) => {
  gsap.to(sec, { x: 100, scrollTrigger: { trigger: sec, scrub: true } });
});
// prueba: ScrollTrigger.getAll().length === 3
// prueba: new Set(ScrollTrigger.getAll().map((s) => s.trigger)).size === 3
```

### 4. Medidas fijadas al crear

ScrollTrigger hace `refresh()` al redimensionar, pero un valor ya calculado no se recalcula. Escribe `end` como función. Para que también se actualicen los **valores de la animación**, añade `invalidateOnRefresh: true`. [O]

```js
const bloque = document.querySelector(".bloque");
const fijo = ScrollTrigger.create({ trigger: bloque, end: "+=" + bloque.offsetHeight });
const vivo = ScrollTrigger.create({ trigger: bloque, end: () => "+=" + bloque.offsetHeight });

bloque.style.height = "200px";
ScrollTrigger.refresh();
// prueba: fijo.end - fijo.start === 80
// prueba: vivo.end - vivo.start === 200
```

### 5. Activar y reiniciar en puntos distintos

Un solo `toggleActions` usa un solo punto para ambas cosas. Usa dos ScrollTriggers: uno reproduce en el centro, y otro reinicia cuando el elemento ya salió. [O]

```js
const pieza = document.querySelector(".pieza");
const animacion = gsap.to(pieza, { x: 100, paused: true, duration: 0.1 });

ScrollTrigger.create({ trigger: pieza, start: "center 70%", onEnter: () => animacion.play() });
ScrollTrigger.create({ trigger: pieza, start: "top bottom", onLeaveBack: () => animacion.pause(0) });
// prueba: ScrollTrigger.getAll().length === 2
```

### 6. Creación fuera de orden con pin

Un pin con `pinSpacing` empuja lo que hay debajo. Si un trigger inferior se crea antes, calcula sin esa distancia. Crea por orden de aparición o asigna `refreshPriority`: el valor más alto se calcula antes. [O]

```html
<section class="uno" style="height:100px"></section>
<section class="dos" style="height:100px"></section>
```

```js
const fuera = ScrollTrigger.create({ trigger: ".dos", start: "top 50%" });
const pin = ScrollTrigger.create({ trigger: ".uno", start: "top top", end: "+=500", pin: true });
ScrollTrigger.refresh();
const mal = fuera.start;
fuera.kill();
pin.kill();

const pinPrimero = ScrollTrigger.create({ trigger: ".uno", start: "top top", end: "+=500", pin: true });
const despues = ScrollTrigger.create({ trigger: ".dos", start: "top 50%" });
ScrollTrigger.refresh();
const bien = despues.start;
// prueba: bien - mal === 500
```

### 7. Contenido nuevo sin `refresh`

Imágenes sin `width`/`height` o contenido cargado con `fetch` cambian la altura sin que ScrollTrigger lo sepa. Llama a `ScrollTrigger.refresh()` cuando termine la carga. Para páginas con muchas imágenes, reserva el espacio en el HTML. [O]

```js
const relleno = document.createElement("div");
const objetivo = document.querySelector(".objetivo");
document.body.insertBefore(relleno, document.body.firstChild);

const disparador = ScrollTrigger.create({ trigger: objetivo, start: "top 80%" });
const antes = disparador.start;

relleno.style.height = "400px";
ScrollTrigger.refresh();
// prueba: disparador.start - antes === 400
```

### 8. Salto inicial con `scrub`

Con `start: "top bottom"` en un elemento ya visible, el inicio queda antes del scroll 0 y la animación nace avanzada. Ajusta `start`, o usa `clamp()`, disponible desde 3.12, que limita `start` y `end` a los límites de la página. [O]

```js
const sinClamp = gsap.to(".sin-clamp", {
  x: 100, ease: "none",
  scrollTrigger: { trigger: ".sin-clamp", start: "top bottom", end: "bottom top", scrub: true },
});
const conClamp = gsap.to(".con-clamp", {
  x: 100, ease: "none",
  scrollTrigger: { trigger: ".con-clamp", start: "clamp(top bottom)", end: "clamp(bottom top)", scrub: true },
});
await new Promise((r) => setTimeout(r, 100));
// prueba: sinClamp.scrollTrigger.start < 0 && gsap.getProperty(".sin-clamp", "x") > 0
// prueba: conClamp.scrollTrigger.start === 0 && gsap.getProperty(".con-clamp", "x") === 0
```

### 9. `scroll-behavior: smooth`

`refresh()` lleva el scroll a 0 para medir, y la documentación pide anular `scroll-behavior: smooth`, que algunas librerías activan por defecto. En 3.15.1 ya no hace falta para medir: ScrollTrigger lo pone en `auto` durante el refresco y lo restaura, y con `scroll-behavior: smooth` y scroll a media página, `refresh()` calculó el `start` correcto. [C] [E]

Si los marcadores siguen desplazados tras redimensionar, busca otra causa: contenido que cambió sin `refresh()` (sección 7) o valores cacheados. Conserva `scroll-behavior: auto` solo si tu propio código mide durante un desplazamiento suave.

### 10. Duración con `scrub`

Con `scrub`, la duración se ajusta al tramo entre `start` y `end`. Solo importa como proporción dentro de un timeline. Para alargarla, empuja `end`. [O]

```js
const larga = gsap.to(".larga", { x: 100, ease: "none", duration: 5, scrollTrigger: { start: 0, end: 500, scrub: true } });
const corta = gsap.to(".corta", { x: 100, ease: "none", duration: 1, scrollTrigger: { start: 0, end: 500, scrub: true } });

window.scrollTo(0, 250);
ScrollTrigger.update();
await new Promise((r) => setTimeout(r, 100));
// prueba: larga.progress() === 0.5 && corta.progress() === 0.5
```

### 11. Navegación sin recarga y sin limpieza

Si la página no se recarga al navegar, nadie recrea ni retira tus triggers. Créalos al entrar en la vista y revierte al retirarla con `gsap.context()`, que también mata los ScrollTriggers. Si solo cambian medidas, basta `ScrollTrigger.refresh()`. Ver [fra-agnostico](../12-frameworks/fra-agnostico.md). [O]

```js
const vista = gsap.context(() => {
  gsap.to(".vista", { x: 50, scrollTrigger: { trigger: ".vista", scrub: true } });
});
const activos = ScrollTrigger.getAll().length;
vista.revert();
// prueba: activos === 1 && ScrollTrigger.getAll().length === 0
```

Si `refreshPriority`, `sort()` o varios scrollers siguen sin cuadrar, revisa [scr-refresh](../07-scroll/scr-refresh.md).
