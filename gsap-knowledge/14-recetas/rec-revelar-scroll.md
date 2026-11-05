---
id: rec-revelar-scroll
titulo: Revelar elementos al hacer scroll
capa: 14-recetas
tipo: patron
ambito: ScrollTrigger
resumen: Aparición por lotes con ScrollTrigger.batch, sin parpadeo inicial, con movimiento reducido y limpieza completa de estilos.
api: [ScrollTrigger.batch, ScrollTrigger.Vars.once, ScrollTrigger.Vars.onLeaveBack, gsap.matchMedia, gsap.context, gsap.matchMediaRefresh]
requiere: [nuc-context, nuc-matchmedia]
relacionadas: [scr-batch, scr-toggle, cal-fouc, cal-accesibilidad, rec-titular-texto]
etiquetas: [scroll, entrada, accesibilidad, plantilla]
fuentes:
  - docs/v3/Plugins/ScrollTrigger/static.batch().md
  - docs/v3/GSAP/gsap.matchMedia().md
  - resources/a11y.md
  - resources/fouc.md
estado: verificado
version: 3.15.1
---
# Revelar elementos al hacer scroll

Hace aparecer tarjetas, bloques o imágenes cuando entran en el viewport. Los que entran a la vez forman un lote y salen escalonados. Plantilla lista para copiar: `plantillas/revelarScroll.js`. [E]

## Problema

Un `ScrollTrigger` por elemento anima cada uno por su cuenta: una fila de tarjetas que entra a la vez arranca en bloque, y el `stagger` de un solo tween no sirve, porque los elementos llegan en momentos distintos. Además, ocultar con JavaScript deja ver el contenido un instante antes de que se ejecute, y limpiar mal deja elementos invisibles al retirar la vista.

## Solución

`ScrollTrigger.batch()` crea un disparador por elemento y agrupa los que se activan dentro de un intervalo. El callback recibe el array del lote [O]. El estado oculto se aplica con `gsap.set` dentro del contexto, y lo que nace en el callback pasa por `contextSafe` (segundo argumento de `gsap.context` y `matchMedia().add`) para quedar registrado. [E]

```html
<div style="height:100px"></div>
<div class="bloque" style="height:80px">uno</div>
<div class="bloque" style="height:80px">dos</div>
<div style="height:900px"></div>
<div class="bloque" style="height:80px">tres</div>
```

```js
const bloques = gsap.utils.toArray(".bloque");

const ctx = gsap.context((_, seguro) => {
  gsap.set(".bloque", { autoAlpha: 0, y: 30 });
  const mostrar = seguro((lote) =>
    gsap.to(lote, { autoAlpha: 1, y: 0, duration: 0.1, stagger: 0.02 })
  );
  ScrollTrigger.batch(".bloque", { start: "top 85%", interval: 0.02, once: true, onEnter: mostrar });
});

await new Promise((r) => setTimeout(r, 300));
// prueba: gsap.getProperty(bloques[0], "opacity") === 1 && gsap.getProperty(bloques[1], "y") === 0
// prueba: gsap.getProperty(bloques[2], "opacity") === 0
```

Para evitar el destello antes de ejecutar JS: `visibility: hidden` en CSS y `autoAlpha` en GSAP, que escribe `opacity` y `visibility` juntos [O]. Si el CSS oculta, añade un respaldo para quien no ejecuta JS (`<noscript>` o una clase `.js` en `<html>`) y muestra el contenido en la rama reducida. [P]

## Parámetros ajustables

| Opción de la plantilla | Por defecto | Efecto |
|---|---|---|
| `y` | `40` | Desplazamiento inicial en px |
| `duracion` / `ease` | `0.6` / `"power2.out"` | Entrada de cada elemento |
| `stagger` | `0.08` | Separación dentro del lote |
| `inicio` | `"top 85%"` | `start` de cada disparador |
| `intervalo` | `0.1` | Ventana en segundos para agrupar (`interval`) |
| `maximoLote` | sin límite | `batchMax`: corta el lote, útil en rejillas por filas |
| `repetir` | `false` | Oculta al volver arriba y revela otra vez |

## Variante con prefers-reduced-motion

La rama reducida no oculta nada: el contenido está visible desde el principio. Con `gsap.matchMedia()` el cambio de preferencia se aplica sin recargar: revierte una rama y ejecuta la otra. [O] [E]

```js
// Solo para la prueba: simula la preferencia del sistema.
let reducir = false;
window.matchMedia = (q) => ({ matches: reducir ? /: reduce\)/.test(q) : /no-preference/.test(q), addListener() {}, removeListener() {} });

const mm = gsap.matchMedia();
mm.add({ normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" }, (c) => {
  if (c.conditions.reducido) return; // sin ocultar, sin ScrollTrigger
  gsap.set(".pieza", { autoAlpha: 0, y: 30 });
});

const ocultaAntes = gsap.getProperty(".pieza", "opacity") === 0;
reducir = true;
gsap.matchMediaRefresh();
const visibleDespues = document.querySelector(".pieza").style.opacity === "";
// prueba: ocultaAntes && visibleDespues
```

## Limpieza

`limpiar()` revierte el contexto y restaura el `style` guardado al empezar. Tras llamarla: `ScrollTrigger.getAll().length === 0` y los elementos conservan su `style` original. [E]

```js fragmento
const limpiar = revelarScroll(raiz.querySelectorAll(".tarjeta"), { y: 24 });
// al retirar la vista
limpiar();
```

## Listas que crecen

La plantilla actúa sobre los elementos que existen al llamarla. Con "cargar más" o scroll infinito, llámala solo con los nuevos y guarda todas las limpiezas. Volver a llamarla con la lista entera ocultaría lo que ya estaba a la vista. Si insertas en medio y no al final, añade `ScrollTrigger.refresh()`. [E] [P]

```js fragmento
const limpiezas = [revelarScroll(lista.querySelectorAll(".tarjeta"))];

function alRecibir(nuevos) {
  lista.append(...nuevos);
  limpiezas.push(revelarScroll(nuevos));
}

// al retirar la vista
limpiezas.forEach((limpiar) => limpiar());
```

## Trampas

- **`overwrite: true` tras un `gsap.set`, con GSDevTools en la página.** Un `set` acabado ya no está en la raíz, y `overwrite: true` no lo alcanza: `revert()` lo deshace igual. Con GSDevTools cargado, que desactiva `autoRemoveChildren`, sí lo encuentra y lo mata, y el elemento queda oculto tras limpiar. Solo se ve mientras depuras; con `overwrite: "auto"` no ocurre en ningún caso. [E]
- **`revert()` con lotes y `stagger`.** En `ScrollTrigger.batch` con `stagger`, el contexto dejó el estado oculto (`visibility: hidden`, `translate(0, 30px)`) tras revertir. La plantilla restaura `style.cssText` a mano. No se ha aislado la causa interna; sin `stagger` no ocurre. [E]
- **Tween creado en el callback sin `contextSafe`.** No se registra en el contexto y sobrevive a `revert()`. [O]
- **`once: true` no mata el disparador al activarse.** Solo lo hace al pasar `end`; antes, anula ese callback. `ScrollTrigger.getAll()` sigue contándolo hasta entonces. [C]
- **Los elementos desplazados miden con su `y`.** `start` se calcula con el elemento ya movido, así que el disparo llega `y` píxeles tarde. Con 40 px no se nota; con 200 px sí. [P]
- **Volver arriba.** Sin `repetir`, el elemento sigue visible al subir, que suele ser lo deseable; con `repetir`, `onLeaveBack` lo oculta y se revela de nuevo. [E]
