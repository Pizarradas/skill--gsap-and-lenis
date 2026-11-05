---
id: rec-transicion-paginas
titulo: Transición entre páginas
capa: 14-recetas
tipo: patron
ambito: transversal
resumen: Navegación sin recarga con salida, sustitución, historial, foco y entrada, sin fugas de ScrollTrigger entre páginas.
api: [gsap.to, gsap.fromTo, gsap.killTweensOf, ScrollTrigger.refresh, Animation.then]
relacionadas: [nuc-context, nuc-promesas, scr-refresh, fra-agnostico, fra-vanilla, cal-accesibilidad, cal-st-errores]
etiquetas: [navegacion, sin-recarga, accesibilidad, plantilla]
fuentes:
  - docs/v3/GSAP/Tween/then().md
  - resources/st-mistakes.md
  - resources/a11y.md
estado: verificado
version: 3.15.1
---
# Transición entre páginas

Anima la salida del contenido, lo sustituye y anima la entrada, sin recargar. Sirve en sitios multipágina sencillos. Si otra capa ya gestiona la navegación, conserva la idea y conecta los ganchos que ofrezca: cada `fra-*` lo indica en su columna "ruta". Plantilla: `plantillas/transicionPaginas.js`. [E]

## Problema

Cambiar de contenido por JavaScript rompe lo que el navegador hacía solo: historial, título, posición de scroll y foco. Además, los `ScrollTrigger` de la página anterior apuntan a elementos ya inexistentes, y las posiciones de cualquier disparador superviviente quedan mal.

## Solución

Orden fijo. La carga empieza con la salida, sin esperar a que acabe, y `Promise.all` sincroniza ambas. Los tweens son *thenables*. [O] [E]

```html
<main id="vista"><h1>Portada</h1></main>
```

```js
const vista = document.getElementById("vista");
const paginas = { "/datos": "<h1>Datos</h1>" };
const cargar = async (ruta) => paginas[ruta];

async function ir(ruta) {
  const carga = cargar(ruta);
  const salida = gsap.to(vista, { opacity: 0, y: -10, duration: 0.05, overwrite: "auto" });
  const [html] = await Promise.all([carga, salida.then()]);

  vista.innerHTML = html;
  window.scrollTo(0, 0);
  ScrollTrigger.refresh();

  vista.setAttribute("tabindex", "-1");
  vista.focus({ preventScroll: true });
  gsap.fromTo(vista, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.05, overwrite: "auto" });
}

await new Promise((r) => setTimeout(r, 20));
await ir("/datos");
await new Promise((r) => setTimeout(r, 120));
// prueba: vista.textContent === "Datos"
// prueba: document.activeElement === vista
// prueba: gsap.getProperty(vista, "opacity") === 1
```

La plantilla añade delegación de clics, respaldo con navegación normal si la carga falla, `popstate` y un turno que descarta navegaciones superadas. Cada página se inicia en `alCambiar`, y lo que devuelva ese gancho (una función de limpieza, como las de estas plantillas) se llama antes del siguiente cambio:

```js fragmento
const limpiar = transicionPaginas("#contenido", {
  alCambiar: (raiz) => {
    const bajas = [revelarScroll(raiz.querySelectorAll(".tarjeta")), contador(raiz.querySelectorAll("[data-hasta]"))];
    return () => bajas.forEach((baja) => baja());
  },
});
```

## Parámetros ajustables

| Opción | Por defecto | Efecto |
|---|---|---|
| `cargar` | `fetch` + `DOMParser` por `id` | Devuelve HTML o `{ html, titulo }` |
| `enlaces` | `"a[data-transicion]"` | Selector de los enlaces interceptados |
| `salida` / `entrada` | `0.25` / `0.35` | Duraciones; mantenlas cortas: la navegación debe sentirse rápida |
| `y` | `16` | Desplazamiento |
| `registrar` | `history.pushState` | Integra con otro historial |
| `alCambiar` | — | Inicia la página nueva |

## Variante con prefers-reduced-motion

Duración 0 y sin desplazamiento, con todo lo demás igual: historial, título, foco y `alCambiar`. Reduce el movimiento, no la función. [P] [E]

```js
window.matchMedia = (q) => ({ matches: /: reduce\)/.test(q), addListener() {}, removeListener() {} });
const area = document.querySelector(".area");
const mm = gsap.matchMedia();
mm.add({ normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" }, (c) => {
  const breve = c.conditions.reducido;
  gsap.to(area, { opacity: 0, y: breve ? 0 : -16, duration: breve ? 0 : 0.25 });
});
// prueba: gsap.getProperty(area, "opacity") === 0 && gsap.getProperty(area, "y") === 0
```

## Limpieza

`limpiar()` quita los listeners, invalida la navegación en curso, mata los tweens, restaura `style` y `tabindex`, y llama a la limpieza de la página activa. El contenido actual se queda. [E]

```js fragmento
limpiar();
```

## Trampas

- **`autoAlpha` en la salida.** Con `visibility: hidden`, `focus()` no surte efecto, y el foco se pierde. Usa `opacity`, o enfoca al acabar la entrada. [E]
- **Salida y entrada dentro del contexto.** Tras varias navegaciones sobre el mismo elemento, `revert()` dejó `opacity: 0` y `translate(0, -10px)`. La plantilla crea esos tweens fuera del contexto y limpia a mano. [E]
- **`overwrite: true` en la entrada, con GSDevTools en la página.** La salida acabada ya no está en la raíz y puede revertirse igual; con GSDevTools cargado, que conserva lo terminado, `overwrite: true` la mata y deja de poder revertirse. Con `"auto"` no ocurre. [E]
- **Dentro de Shadow DOM.** Desde `document`, `e.target` de un clic en una sombra abierta es el anfitrión. La plantilla busca el enlace con `e.composedPath()`. Pasa el contenedor como elemento e inyecta `cargar`: la carga por defecto lo busca por `id` en el HTML de la página, donde no está. [E] Según el estándar DOM, una sombra cerrada no expone su ruta y la delegación no vería el enlace; esto no se ha probado.
- **`contextSafe` tras un `await`.** Solo cubre lo síncrono: `_context` se restaura al volver de la función, y lo que se cree después de `await` no se registra. [C]
- **Disparadores de la página anterior.** Limpia antes de sustituir el HTML, y no después. Refresca tras insertar lo nuevo: sin refresh, las posiciones son las de la página anterior. [O]
- **Sin `preventScroll`.** `focus()` desplaza la página y anula el `scrollTo(0, 0)`. [P]
- **Ctrl+clic, `target="_blank"`, enlaces externos y anclas.** Hay que dejarlos pasar. Interceptar todo rompe los hábitos del usuario. [P]
- **`pushState` en `file://`.** Cambiar la ruta lanza `SecurityError`; cambiar solo la query funciona. Por eso la prueba inyecta `registrar`, y el `pushState` y el `fetch` por defecto de la plantilla no se han ejercitado. [E]
- **`<head>` de la página nueva.** La plantilla solo cambia el título: meta, CSS y scripts propios de cada página exigen más trabajo. Valora un enrutador. [P]
