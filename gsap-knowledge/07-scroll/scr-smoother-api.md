---
id: scr-smoother-api
titulo: Métodos y propiedades de ScrollSmoother
capa: 07-scroll
tipo: referencia
ambito: ScrollSmoother
resumen: Referencia de la instancia, scrollTo, offset, scrollTop, paused, smooth, progress, content, wrapper, getVelocity, kill, y las diferencias entre scroll nativo y suavizado.
api: [ScrollSmoother.scrollTo, ScrollSmoother.offset, ScrollSmoother.scrollTop, ScrollSmoother.paused, ScrollSmoother.smooth, ScrollSmoother.progress, ScrollSmoother.scrollTrigger, ScrollSmoother.normalizer, ScrollSmoother.content, ScrollSmoother.wrapper, ScrollSmoother.getVelocity, ScrollSmoother.kill, ScrollSmoother.refresh]
requiere: [scr-smoother]
relacionadas: [scr-smoother-efectos, scr-scrollto, scr-instancia]
etiquetas: [scroll, referencia]
fuentes:
  - docs/v3/Plugins/ScrollSmoother/scrollTo().md
  - docs/v3/Plugins/ScrollSmoother/offset().md
  - docs/v3/Plugins/ScrollSmoother/scrollTop().md
  - docs/v3/Plugins/ScrollSmoother/paused().md
  - docs/v3/Plugins/ScrollSmoother/smooth().md
  - docs/v3/Plugins/ScrollSmoother/progress.md
  - docs/v3/Plugins/ScrollSmoother/scrollTrigger.md
  - docs/v3/Plugins/ScrollSmoother/vars.md
  - docs/v3/Plugins/ScrollSmoother/content().md
  - docs/v3/Plugins/ScrollSmoother/wrapper().md
  - docs/v3/Plugins/ScrollSmoother/getVelocity().md
  - docs/v3/Plugins/ScrollSmoother/kill().md
  - docs/v3/Plugins/ScrollSmoother/static.get().md
estado: verificado
version: 3.15.1
---
# Métodos y propiedades de ScrollSmoother

Dos posiciones conviven: la **nativa** (`window.scrollY`) y la **suavizada** (`smoother.scrollTop()`), que la persigue. Con `speed` distinto de 1 tampoco coinciden al terminar. [C] [E]

| Miembro | Devuelve | Nota |
|---|---|---|
| `scrollTo(destino, smooth?, posicion?)` | | Número, selector o elemento. `posicion` es como `start`: `"top 100px"`. Con `smooth` falso salta [O] |
| `offset(objetivo, posicion?, ignoreSpeed?)` | número | Píxel de scroll en que el elemento llega a `posicion`, tras tener en cuenta los efectos. Por defecto `"top top"` [O] [C] |
| `scrollTop(valor?)` | número o instancia | Lee o fija **al instante** la posición suavizada [O] |
| `paused(valor?)` | booleano o instancia | Bloquea el scroll del usuario, para modales. Admite un segundo argumento, `allowNestedScroll` [O] [C] |
| `smooth(valor?)` | número | Lee o cambia la duración [O] |
| `progress` | 0-1 | De toda la página. Se anima con el suavizado [O] |
| `getVelocity()` | px/s | Del scroll suavizado [O] |
| `effects(...)` | array | [scr-smoother-efectos](scr-smoother-efectos.md) |
| `content(el?)`, `wrapper(el?)` | elemento o instancia | Leer o cambiar [O] |
| `scrollTrigger` | ScrollTrigger | Instancia interna de la página. `id: "ScrollSmoother"` [O] [C] |
| `normalizer` | Observer | Solo con `normalizeScroll` [C] |
| `vars` | objeto | Configuración [O] |
| `refresh(soft?, force?)` | | También estático: `ScrollSmoother.refresh(safe?)` [C] |
| `kill()` | | Elimina efectos y restaura el DOM [O] [C] |
| `ScrollSmoother.get()` | instancia o `undefined` | La activa [O] |
| `ScrollSmoother.create(vars)` | instancia | Mata la anterior [O] |

## Ejemplo

```html
<div id="smooth-wrapper">
  <div id="smooth-content">
    <div class="uno" style="height:1000px"></div>
    <div class="dos" style="height:2000px"></div>
  </div>
</div>
```

`scrollTo` sin suavizado es síncrono. `offset` da el píxel sin mover nada:

```js
const smoother = ScrollSmoother.create({ smooth: 0.05 });

const arriba = smoother.offset(".dos", "top top");
const centrado = smoother.offset(".dos", "top center");

smoother.scrollTo(400, false);
const numerico = [window.scrollY, smoother.scrollTop()];

smoother.scrollTo(".dos", false, "top 100px");
const aElemento = [window.scrollY, smoother.scrollTop()];

// prueba: arriba === 1000 && centrado === 650
// prueba: numerico.join() === "400,400"
// prueba: aElemento.join() === "900,900"
```

`scrollTo(destino, true)` no anima el contenido: mueve la posición nativa al destino, y el suavizado hace el resto. Si necesitas controlar duración o ease, anima la propiedad [C]:

```js
const smoother = ScrollSmoother.create({ smooth: 0.05 });

gsap.to(smoother, {
  scrollTop: smoother.offset(".dos", "top top"),
  duration: 0.1,
  ease: "power2.inOut",
});

// prueba: smoother.scrollTop() === 1000
// prueba: window.scrollY === 1000
```

`paused()` para un modal. Cancela el scroll de usuario, pero `scrollTop()` y `scrollTo()` siguen funcionando:

```js
const smoother = ScrollSmoother.create({ smooth: 0.05 });
smoother.scrollTo(300, false);

smoother.paused(true);
const bloqueado = smoother.paused();
smoother.scrollTop(200);
const porCodigo = smoother.scrollTop();
smoother.paused(false);

// prueba: bloqueado === true
// prueba: porCodigo === 200
// prueba: smoother.paused() === false
```

Ciclo de vida, y `speed`:

```js
const a = ScrollSmoother.create({ smooth: 1 });
const b = ScrollSmoother.create({ smooth: 1 }); // mata a "a"
b.smooth(0.3);
const duracion = b.smooth();
const principal = b.scrollTrigger.vars.id;

b.kill();
const sinInstancia = ScrollSmoother.get();
const alturaBody = document.body.style.height;

const rapido = ScrollSmoother.create({ smooth: 0.2, speed: 2 });
window.scrollTo(0, 100);
ScrollTrigger.update();

// prueba: duracion === 0.3
// prueba: principal === "ScrollSmoother"
// prueba: sinInstancia === undefined || sinInstancia === null
// prueba: alturaBody === ""
// prueba: Math.abs(rapido.scrollTop() - 200) < 1
```

Con `speed: 2`, 100 px de scroll nativo son 200 px de contenido. [E]

## Trampas

- **Anclas:** `scrollTo(".x", true)` calcula con la velocidad descontada; si cruzas `speed` y `offset`, usa `offset(objetivo, posicion, true)` para ignorar el efecto de `speed`. [C]
- **`smoother.scrollTop()` no es `window.scrollY`** durante el suavizado, ni nunca con `speed` distinto de 1. Para decisiones de interfaz, usa la suavizada. [E]
- **`scrollTop(v)` mueve al instante,** sin suavizado. Para animarlo, `gsap.to(smoother, { scrollTop })`. [O]
- **`paused(true)` también impide la barra.** Quita el bloqueo al cerrar el modal. Un `return` temprano que se lo salte deja la página muerta. [O] [P]
- **Scroll dentro del modal.** Por defecto se permite el anidado; `paused(true, false)` lo bloquea también. [C]
- **`ScrollToPlugin` sobre `window` con el smoother:** funciona, porque mueve la posición nativa; pero los tiempos se suman al `smooth`. [C] [P]
- **`progress` no es `scrollTrigger.progress`** durante el suavizado: el primero sigue a la animación suavizada, y el segundo, a la barra. [O] [C]
