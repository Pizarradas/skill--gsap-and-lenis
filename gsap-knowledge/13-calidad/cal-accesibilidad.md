---
id: cal-accesibilidad
titulo: Animación accesible, reduced motion y texto dividido
capa: 13-calidad
tipo: guia
ambito: transversal
resumen: prefers-reduced-motion con gsap.matchMedia, interruptor propio con matchMediaRefresh, cuándo reducir o quitar, y SplitText con lectores de pantalla.
api: [gsap.matchMedia, gsap.matchMediaRefresh, gsap.MatchMedia.add, gsap.Context.conditions, SplitText.Vars.aria]
relacionadas: [nuc-matchmedia, txt-splittext, cal-fouc, css-autoalpha]
etiquetas: [accesibilidad, a11y, reduced-motion, matchmedia]
fuentes:
  - resources/a11y.md
  - docs/v3/GSAP/gsap.matchMediaRefresh().md
estado: verificado
version: 3.15.1
---
# Animación accesible

Hay personas a las que el movimiento les causa mareo, náusea o dolor de cabeza, por trastornos vestibulares, y destellos rápidos pueden provocar crisis epilépticas. El sistema operativo expone esa preferencia con `prefers-reduced-motion`, y `gsap.matchMedia()` permite responder a ella. [O]

## Pasos

### 1. Da dos versiones

Solo se ejecuta la función cuya consulta coincide. Cuando la preferencia cambia, GSAP revierte lo creado y ejecuta la otra. [O]

```js fragmento
const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  gsap.from(".panel", { x: -200, rotation: 10, opacity: 0, ease: "back.out" });
});

mm.add("(prefers-reduced-motion: reduce)", () => {
  gsap.from(".panel", { opacity: 0 });
});
```

Con la sintaxis de condiciones, una única función decide los valores. Este bloque simula un usuario con *reducir movimiento*, sustituyendo `window.matchMedia`, y comprueba la rama:

```js
const consultaReal = window.matchMedia;
window.matchMedia = (q) => ({
  matches: q.includes("reduce"),
  media: q,
  addListener() {},
  removeListener() {},
});

const mm = gsap.matchMedia();
let ramaReducida;

mm.add({
  reducir: "(prefers-reduced-motion: reduce)",
  normal: "(prefers-reduced-motion: no-preference)",
}, (context) => {
  const { reducir } = context.conditions;
  ramaReducida = reducir;
  gsap.fromTo(".panel", { x: reducir ? 0 : -200, opacity: 0 }, { x: 0, opacity: 1, duration: 0.2 });
});

window.matchMedia = consultaReal;
await new Promise((r) => setTimeout(r, 300));
// prueba: ramaReducida === true
// prueba: gsap.getProperty(".panel", "x") === 0 && gsap.getProperty(".panel", "opacity") === 1
```

Comprobado también sin simulación, el 2026-11-05: Chrome 156 con `--force-prefers-reduced-motion` ejecutó solo la rama `reduce` y dio `{"reducir":true,"normal":false}`; sin la bandera, la rama `no-preference`.

### 2. Decide: reducir o quitar

| Pregunta | Respuesta | Acción |
|---|---|---|
| ¿Es arriesgada? | Destellos o grandes desplazamientos en x/y | Quitarla o sustituirla por un fundido [O] |
| | Cambios pequeños, opacidad | Suelen ser seguros [O] |
| ¿Qué aporta? | Decoración | Quitarla [O] |
| | Información: progreso, descarga | Conservarla, simplificada [O] |

Quitar no significa ocultar: si la animación revelaba contenido, el estado final debe seguir visible. Asegúrate de que el contenido se vea sin animar. [P]

### 3. Ofrece un interruptor propio

No todo el mundo sabe que existe el ajuste del sistema. Un control en la interfaz da esa elección. `gsap.matchMediaRefresh()` revierte y vuelve a ejecutar todo lo que coincide. [O]

```html
<label><input type="checkbox" id="menos-movimiento"> Reducir animación</label>
<div class="decorado"></div>
```

```js
const interruptor = document.querySelector("#menos-movimiento");
interruptor.checked = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const mm = gsap.matchMedia();
let ejecuciones = 0;

mm.add("all", () => {
  ejecuciones++;
  if (!interruptor.checked) {
    gsap.to(".decorado", { rotation: 360, duration: 2, repeat: -1, ease: "none" });
  }
});

await new Promise((r) => setTimeout(r, 100));
const giroInicial = gsap.getProperty(".decorado", "rotation");

interruptor.checked = true;
gsap.matchMediaRefresh();
const giroTrasMarcar = gsap.getProperty(".decorado", "rotation");
// prueba: ejecuciones === 2 && giroInicial > 0 && giroTrasMarcar === 0
```

Guarda la elección, por ejemplo en `localStorage`, y aplícala antes de crear las animaciones. [P]

### 4. Texto dividido

Desde 3.13.0, `SplitText` pone por defecto `aria-label` con el texto en el elemento y `aria-hidden` en sus hijos. Así el lector de pantalla no deletrea letra a letra. [O]

```html
<h2 class="lema">Texto <strong>simple</strong></h2>
```

```js
const partes = SplitText.create(".lema", { type: "words" });
const titulo = document.querySelector(".lema");
const etiqueta = titulo.getAttribute("aria-label");
const primerHijoOculto = partes.words[0].getAttribute("aria-hidden");
partes.revert();
// prueba: etiqueta === "Texto simple" && primerHijoOculto === "true"
// prueba: titulo.getAttribute("aria-label") === null
```

`aria-label` solo contiene texto, por lo que **se pierde el significado de los elementos anidados**: un enlace deja de ser enlace para quien usa lector. En ese caso, desactiva el aria automático y añade un duplicado solo para lectores: [O]

```html
<div class="animar" aria-hidden="true">Lee las <a href="/guia" tabindex="-1">condiciones</a></div>
<p class="solo-lector">Lee las <a href="/guia">condiciones</a></p>
```

```css
.solo-lector:not(:focus):not(:active) {
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
```

```js
const duplicado = SplitText.create(".animar", { type: "words", aria: "none" });
// prueba: !document.querySelector(".animar").hasAttribute("aria-label")
```

`aria` admite `"auto"`, `"hidden"` y `"none"`: `"none"` no toca los atributos, y `"hidden"` pone `aria-hidden` en el elemento. La demo oficial usa `"hidden"`, cómodo si el duplicado ya está y el original aún no tiene `aria-hidden`. [C]

## Trampas

- **`from()` con `reduce` sin alternativa.** Si la rama reducida no anima y el CSS oculta el contenido, nunca aparece. Revela también en esa rama. Ver [cal-fouc](cal-fouc.md). [P]
- **Un enlace `tabindex` duplicado.** El bloque `aria-hidden` no debe contener elementos enfocables: añade `tabindex="-1"`, o quedan paradas de tabulación sin nombre. La demo oficial no lo hace. [P]
- **`matchMedia` no vigila tu casilla.** Hay que llamar a `gsap.matchMediaRefresh()` al cambiar. El listener de sistema solo reacciona a consultas de medios. [O]
- **Lo creado fuera de la función no se revierte.** Un clic que crea tweens después de arrancar la vista necesita `context.add()`. Ver [nuc-matchmedia](../02-nucleo/nuc-matchmedia.md). [O]
- **`scrub` y parallax también son movimiento.** `ScrollSmoother` y pins largos deben ir en la rama `no-preference`. [P]
- **Foco en contenido animado.** Un elemento con `autoAlpha: 0` tiene `visibility: hidden` y no recibe foco, lo cual es deseable en ocultos. Con solo `opacity: 0` sigue siendo enfocable. [P]
- **Parpadeo.** Evita más de tres destellos por segundo: es el umbral de WCAG 2.3.1. [P]
