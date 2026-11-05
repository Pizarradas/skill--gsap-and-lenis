---
id: txt-splittext
titulo: SplitText, partir texto en líneas, palabras y caracteres
capa: 08-texto
tipo: plugin
ambito: SplitText
resumen: Envuelve líneas, palabras o caracteres en elementos propios para animarlos, con máscaras, ARIA automático y repartido responsive con autoSplit y onSplit.
api: [SplitText.create, SplitText.chars, SplitText.words, SplitText.lines, SplitText.masks, SplitText.revert, SplitText.Vars.autoSplit, SplitText.Vars.onSplit, SplitText.Vars.mask, SplitText.Vars.aria]
requiere: []
relacionadas: [txt-splittext-api, nuc-stagger, nuc-context, cal-accesibilidad, cal-fouc, rec-titular-texto]
etiquetas: [texto, stagger, accesibilidad, responsive]
fuentes:
  - docs/v3/Plugins/SplitText.md
  - docs/v3/Plugins/SplitText/masks.md
  - docs/v3/Plugins/SplitText/static.create().md
estado: verificado
version: 3.15.1
---
# SplitText

Parte el texto de un elemento en elementos nuevos (por línea, palabra o carácter) para animarlos por separado, normalmente con `stagger`. Se reescribió por completo en la 3.13: lo que encuentres anterior a esa versión (sin `autoSplit`, `onSplit`, `mask`, `aria`) está desactualizado. [O]

## Para qué sirve

| Necesidad | Configuración |
|---|---|
| Titular que entra letra a letra | `type: "words,chars"` y animar `chars` |
| Revelado de líneas desde una máscara | `type: "lines"`, `mask: "lines"`, `yPercent` |
| Texto en un contenedor fluido | `autoSplit: true` y crear la animación en `onSplit` |
| Solo letras sin cortes raros de palabra | `type: "chars"`, `smartWrap: true` |
| Dejar intacto un `<sup>` o un icono | `ignore` |

Divide solo lo que vayas a animar: cada línea, palabra o carácter es un nodo más. [O] No sirve para `<text>` de SVG. [O]

## Registro

```js fragmento
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);
```

**Sin empaquetador:** `<script>` con `dist/SplitText.min.js` (global `SplitText`), o entrada `gsap/SplitText` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

Viene incluido en el paquete `gsap`. [C] Puede funcionar sin el núcleo de GSAP; si este está presente, usa `gsap.utils.toArray` y se integra en `gsap.context()`. [C]

## API

- `SplitText.create(objetivo, vars)` equivale a `new SplitText(objetivo, vars)`. `vars` **es obligatorio en la práctica**: ver Trampas. [E]
- Colecciones: `split.lines`, `split.words`, `split.chars`, `split.masks`, `split.elements`.
- Métodos: `split.split(vars?)`, `split.revert()`, `split.kill()`.
- Estado: `split.isSplit`, `split.vars`.

Tabla completa de opciones en [txt-splittext-api](txt-splittext-api.md).

## Ejemplo

Revelado de líneas con máscara, responsive y limpio:

```html
<div style="width:320px">
  <h2 class="lema">Un titular lo bastante largo para que ocupe varias líneas en este contenedor estrecho</h2>
</div>
```

```js
let animacion;
const partido = SplitText.create(".lema", {
  type: "lines,words",
  mask: "lines",
  linesClass: "linea",
  autoSplit: true,
  onSplit(self) {
    animacion = gsap.from(self.lines, { yPercent: 100, duration: 0.3, stagger: 0.02, ease: "power3.out" });
    return animacion; // al devolverla, SplitText la revierte y sincroniza en cada repartido
  },
});
const lema = document.querySelector(".lema");
// prueba: partido.lines.length > 1
// prueba: partido.masks.length === partido.lines.length
// prueba: partido.masks[0].style.overflow === "clip"
// prueba: partido.masks[0].classList.contains("linea-mask")
// prueba: lema.getAttribute("aria-label").startsWith("Un titular")
// prueba: partido.lines[0].getAttribute("aria-hidden") === "true"
```

Efímero: animar y devolver el HTML original al terminar, para no dejar cientos de nodos vivos [P]:

```html
<p class="aviso">Texto que entra y vuelve a su <strong>marcado</strong> original</p>
```

```js
const original = document.querySelector(".aviso").innerHTML;
const trozos = SplitText.create(".aviso", { type: "words" });
gsap.from(trozos.words, { opacity: 0, duration: 0.1, stagger: 0.01, onComplete: () => trozos.revert() });
// prueba: document.querySelector(".aviso").innerHTML === original
// prueba: trozos.isSplit === false
```

### Cómo funciona autoSplit

1. Con `autoSplit: true` **y** `lines` en `type`, un `ResizeObserver` vigila cada elemento y, 200 ms después del último cambio, compara `offsetWidth`. Si cambió, revierte y parte de nuevo. También escucha el evento `loadingdone` de `document.fonts`. [C]
2. Cada repartido crea elementos nuevos, así que una animación creada fuera de `onSplit` se queda animando nodos desconectados. [O]
3. Si `onSplit` **devuelve** un tween o timeline, SplitText guarda su `totalTime()`, lo revierte y aplica ese tiempo al que devuelvas después. La animación sigue por donde iba. [O] Comprobado: tras `split()` a mitad de animación, la nueva arranca en el mismo `totalTime` y la anterior vuelve a progreso 0. [E]
4. Sin `lines` en `type`, `autoSplit` no hace nada: palabras y caracteres refluyen solos. Tampoco se instala la escucha de fuentes, aunque la documentación da a entender que sí. [C] [E]

### Máscaras

`mask: "lines" | "words" | "chars"` clona cada elemento como envoltorio con `overflow: clip` y `vertical-align: top`. Solo se admite un tipo, y debe estar en `type`. [C] Con `linesClass: "linea"`, el envoltorio recibe `linea-mask`; con `"linea++"`, `linea-mask linea1-mask`. [E]

### Accesibilidad

Por defecto (`aria: "auto"`), el elemento recibe `aria-label` con su `textContent` y los trozos, `aria-hidden="true"`. Un lector de pantalla oye la frase, no letra a letra. [E] El coste es que **los enlaces y énfasis anidados dejan de existir para el lector**. [O] Si importan, usa `aria: "hidden"` o `"none"` en la versión animada y añade una copia solo para lectores. [O]

```html
<div>
  <p class="efecto" aria-hidden="true">Lee los <a href="#t">términos</a> antes</p>
  <p class="solo-lector">Lee los <a href="#t">términos</a> antes</p>
</div>
```

```js
const efecto = SplitText.create(".efecto", { type: "words", aria: "hidden" });
gsap.from(efecto.words, { opacity: 0, duration: 0.1, stagger: 0.01 });
// prueba: document.querySelector(".efecto").getAttribute("aria-hidden") === "true"
// prueba: document.querySelector(".efecto").getAttribute("aria-label") === null
// prueba: document.querySelector(".solo-lector a").getAttribute("href") === "#t"
```

## Trampas

- **`SplitText.create(".x")` sin `vars` lanza una excepción** (`Cannot read properties of undefined (reading 'overwrite')`), aunque la documentación muestra esa llamada y dice que hay tipos por defecto. Pasa al menos `{}` o `{ type: "words" }`. [E]
- **Fuentes web.** Partir antes de que carguen deja líneas erróneas. Usa `autoSplit: true` con `lines`, o espera a `document.fonts.ready`. La documentación promete un `console.warn` si te adelantas, pero el fuente de 3.15.1 no contiene ninguno: no cuentes con ese aviso. [C]
- **`autoSplit` y animación fuera de `onSplit`.** Tras el repartido animas nodos muertos y el texto real queda sin animar. Créala siempre en `onSplit` y devuélvela. [O]
- **Al repartir tras terminar, no se repite.** Si la animación devuelta ya acabó, la nueva se coloca al final: no se reproduce otra vez al redimensionar. Es lo deseable en entradas; si quieres repetirla, llama a `.restart()` tú. [E]
- **`revert()` vacía los arrays en su sitio.** Una referencia guardada a `split.words` queda con `length` 0. Copia con `[...split.words]` si la necesitas después, y recuerda que esos nodos ya están fuera del DOM. [E]
- **Partir dos veces el mismo elemento** restaura primero el HTML original (`overwrite` activo por defecto): la instancia anterior sigue con `isSplit: true` y arrays de nodos muertos. Revierte la vieja o reutilízala con `.split(nuevasVars)`. [E]
- **`tag: "span"` rompe transformaciones.** SplitText no aplica entonces `display: inline-block` ni `position: relative`; `rotation`, `scale` o `x` no se ven en un inline. Añade esa regla en tu CSS o mantén `div`. [E]
- **`mask` de un tipo no partido** no crea nada: `{ type: "words", mask: "lines" }` da `masks` vacío, sin error. [E]
- **Cambios de espaciado.** El kerning entre letras se pierde al separarlas. Si se nota el salto, usa `font-kerning: none` y `text-rendering: optimizeSpeed`. [O]
- **`text-wrap: balance`** interfiere en el cálculo de líneas: evítalo en elementos partidos. [O]
- **FOUC.** Oculta el texto con CSS hasta partir y anima con `autoAlpha`; ver la ficha `cal-fouc`. [P]
- **Vistas que se retiran.** Créalo dentro de `gsap.context()`: `context.revert()` revierte el reparto y dispara `onRevert`. [E]
