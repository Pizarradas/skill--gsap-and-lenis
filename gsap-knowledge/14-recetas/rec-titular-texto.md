---
id: rec-titular-texto
titulo: Titular animado por líneas, palabras o letras
capa: 14-recetas
tipo: patron
ambito: SplitText
resumen: Divide y anima un titular con máscara, que se recompone al cambiar el ancho o las fuentes y no daña a lectores de pantalla.
api: [SplitText.create, SplitText.Vars.autoSplit, SplitText.Vars.onSplit, SplitText.Vars.mask, SplitText.Vars.aria]
requiere: [txt-splittext]
relacionadas: [txt-splittext-api, rec-revelar-scroll, cal-fouc, cal-accesibilidad]
etiquetas: [texto, entrada, responsive, plantilla]
fuentes:
  - docs/v3/Plugins/SplitText.md
  - resources/a11y.md
estado: verificado
version: 3.15.1
---
# Titular animado por líneas, palabras o letras

Entrada de un titular con cada unidad saliendo de detrás de una máscara. Plantilla: `plantillas/titularTexto.js`. [E]

## Problema

Partir un texto en líneas depende del ancho y de la fuente: si la fuente carga después o cambia el viewport, las líneas partidas ya no corresponden al layout. Además, llenar el titular de `div` puede hacer que un lector de pantalla lo deletree.

## Solución

`autoSplit: true` vuelve a dividir cuando cambia el ancho o terminan de cargar las fuentes. La animación se crea en `onSplit` y se **devuelve**: así SplitText la sustituye por otra nueva, en el mismo punto de tiempo, tras cada división [O]. `mask` envuelve cada unidad en un contenedor con `overflow: clip` [C]. Con `aria: "auto"`, por defecto, el texto va a `aria-label` y las unidades llevan `aria-hidden`. [C]

```html
<h1 class="cabecera" style="width:320px;font-size:32px">Una frase con <em>énfasis largo</em> que ocupa varias líneas del bloque</h1>
```

```js
const h1 = document.querySelector(".cabecera");
const htmlOriginal = h1.innerHTML;

const ctx = gsap.context(() => {
  SplitText.create(h1, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    onSplit: (dividido) => gsap.from(dividido.lines, { yPercent: 110, duration: 0.15, stagger: 0.02 }),
  });
});

const lineas = h1.children.length;
await new Promise((r) => setTimeout(r, 300));
const unidad = h1.firstElementChild.firstElementChild;
const llegada = gsap.getProperty(unidad, "yPercent");
const conAria = h1.getAttribute("aria-label");
ctx.revert();
// prueba: lineas >= 3
// prueba: llegada === 0
// prueba: conAria === h1.textContent.trim()
// prueba: h1.innerHTML === htmlOriginal && !h1.hasAttribute("aria-label")
```

Para esperar al viewport, añade `scrollTrigger: { trigger: el, start: "top 85%", once: true }` al tween devuelto por `onSplit`. [E]

## Parámetros ajustables

| Opción | Por defecto | Efecto |
|---|---|---|
| `tipo` | `"lines"` | `"words"` o `"chars"`; también fija `mask` |
| `duracion` / `ease` | `0.7` / `"power3.out"` | Cada unidad |
| `stagger` | `0.08` | Baja a 0.02 con `chars` |
| `desplazamiento` | `110` | `yPercent` inicial; 100 o más deja la unidad bajo la máscara |
| `alEntrar` / `inicio` | `false` / `"top 85%"` | Espera a entrar en el viewport |

## Variante con prefers-reduced-motion

No se divide nada: el HTML queda intacto y el titular se ve desde el inicio. Dividir sin animar no aporta y empeora el texto para quien usa tecnologías de apoyo. [P] [E]

```js
window.matchMedia = (q) => ({ matches: /: reduce\)/.test(q), addListener() {}, removeListener() {} });
const titulo = document.querySelector(".lema");
const antes = titulo.innerHTML;
const mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: no-preference)", () => {
  SplitText.create(titulo, { type: "words", autoSplit: true, onSplit: (s) => gsap.from(s.words, { y: 20 }) });
});
// prueba: titulo.innerHTML === antes
```

## Limpieza

`limpiar()` revierte cada SplitText: vuelve el HTML original y los atributos `aria`, y desaparecen la animación y su disparador. [E]

```js fragmento
const limpiar = titularTexto(raiz.querySelector("h1"), { tipo: "words", stagger: 0.04 });
limpiar();
```

## Trampas

- **Animación creada fuera de `onSplit`.** Tras redividir, apunta a elementos que ya no existen: el texto queda sin animar o a medias. [O]
- **No devolver el tween en `onSplit`.** Sin `return`, SplitText no lo revierte ni conserva su tiempo; se acumulan tweens. [O]
- **`chars` sin `words`.** Las letras en línea pueden partir una palabra al final de línea. La plantilla pide `"words,chars"`; la otra salida es `smartWrap: true`. [O]
- **Máscara y descendentes.** Con `line-height` ajustado, `overflow: clip` corta la `g` y la `p`. Sube `line-height` o añade `padding-bottom` a las líneas. [P]
- **`aria-label` en un `div` o `p` sin rol.** Algunas combinaciones de lector y navegador lo ignoran; en encabezados funciona mejor. Si hay enlaces dentro del texto, usa `aria: "none"` y una copia solo para lectores. [O] [P]
- **Destello antes de dividir.** El titular se ve un instante completo. Oculta con `visibility: hidden` en CSS y muéstralo con `gsap.set(el, { autoAlpha: 1 })` tras crear el split y también en la rama reducida. [O]
- **`lines` con elementos anidados.** `deepSlice`, activo por defecto, parte un `<em>` que ocupa dos líneas para que no estire el bloque [O]. En la prueba, el `<em>` se conserva y sigue habiendo varias líneas. [E]
