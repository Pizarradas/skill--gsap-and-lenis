---
id: txt-splittext-api
titulo: SplitText, opciones, propiedades y métodos
capa: 08-texto
tipo: api
ambito: SplitText
resumen: Referencia de SplitText.Vars con valores por defecto y comportamiento real de split(), revert() y kill(), incluida la restauración de ARIA y las animaciones.
api: [SplitText.create, SplitText.split, SplitText.revert, SplitText.kill, SplitText.isSplit, SplitText.elements, SplitText.Vars.type, SplitText.Vars.linesClass, SplitText.Vars.wordsClass, SplitText.Vars.charsClass, SplitText.Vars.tag, SplitText.Vars.propIndex, SplitText.Vars.deepSlice, SplitText.Vars.smartWrap, SplitText.Vars.specialChars, SplitText.Vars.reduceWhiteSpace, SplitText.Vars.ignore, SplitText.Vars.prepareText, SplitText.Vars.wordDelimiter, SplitText.Vars.onRevert, SplitText.Vars.overwrite, SplitText.WordDelimiterConfig.delimiter, SplitText.WordDelimiterConfig.replaceWith]
requiere: [txt-splittext]
relacionadas: [txt-splittext, nuc-limpieza, nuc-context]
etiquetas: [texto, referencia]
fuentes:
  - docs/v3/Plugins/SplitText.md
  - docs/v3/Plugins/SplitText/*
estado: verificado
version: 3.15.1
---
# SplitText: referencia

Opciones de `SplitText.Vars` y ciclo `split()` → `revert()`. La guía de uso, con `autoSplit`, máscaras y accesibilidad, está en [txt-splittext](txt-splittext.md).

## Firma

```text
SplitText.create(objetivo, vars) → SplitText        (= new SplitText(objetivo, vars))
split.split(vars?) → split        split.revert() → split        split.kill() → void
```

`objetivo`: selector, elemento, NodeList o array. Se queda solo con nodos de tipo elemento. [C] Los tipos declaran `type` obligatorio y `revert(): void`, pero `type` tiene valor por defecto y `revert()` devuelve la instancia. [C]

## Opciones

| Opción | Tipo | Defecto | Comportamiento |
|---|---|---|---|
| `type` | string | `"chars,words,lines"` | Cualquier combinación. Un valor sin esas palabras no parte nada, pero `isSplit` queda `true` [E] |
| `mask` | `"lines"` `"words"` `"chars"` | — | Envoltorio `overflow: clip` para ese tipo; debe estar en `type` [E] |
| `autoSplit` | boolean | `false` | Repartir al cambiar el ancho o cargar fuentes; exige `lines` en `type` [C] [E] |
| `onSplit` | función `(self)` | — | Tras cada reparto. Si devuelve una animación, se gestiona sola [O] |
| `onRevert` | función `(self)` | — | Tras cada `revert()`, también el interno de `split()` [C] |
| `aria` | `"auto"` `"hidden"` `"none"` | `"auto"` | `auto`: `aria-label` arriba y `aria-hidden` en trozos. `hidden`: `aria-hidden` en todo. `none`: nada [E] |
| `linesClass` `wordsClass` `charsClass` | string | — | Clase por trozo. Con `"++"` añade también una numerada desde 1: `"p++"` da `p p1`, `p p2` [E] |
| `tag` | string | `"div"` | Con `"span"` no se aplica `position` ni `display` [C] |
| `propIndex` | boolean | `false` | Añade `--line`, `--word` o `--char` con el índice, desde 1 [E] |
| `deepSlice` | boolean | `true` | Subdivide un `<strong>` que cruza líneas para que no estire la línea; solo cuenta al partir `lines` o solo `chars` [C] |
| `smartWrap` | boolean | `false` | Solo sin `words` ni `lines`: agrupa cada palabra en un `<span style="white-space:nowrap">` [E] |
| `wordDelimiter` | string, RegExp o `{ delimiter, replaceWith }` | `" "` | Sustituye al espacio como separador; `replaceWith` es el texto que queda en su lugar [C] [E] |
| `specialChars` | string[] o RegExp | — | Secuencias que cuentan como un carácter: `["ch"]`. Sin documentar en la tabla oficial [C] [E] |
| `prepareText` | función `(texto, elemento)` | — | Reescribe cada nodo de texto antes de partirlo; útil para insertar separadores en chino o japonés [O] |
| `reduceWhiteSpace` | boolean | `true` | Con `false` conserva espacios seguidos y, dentro de `white-space: pre*`, convierte saltos en `<br>` [C] [E] |
| `ignore` | selector, elemento o array | — | Descendientes que se conservan sin partir [O] |
| `overwrite` | boolean | activo salvo `false` | Antes de partir restaura el HTML que dejó otra instancia en ese elemento. Con `false` parte lo ya partido, anidando elementos [C] [E] |

`split.vars` guarda la configuración, y SplitText ignora las claves que no conoce, así que puedes etiquetar instancias. [O] `vars` no aparece en los tipos de la clase; en TypeScript hay que forzar el acceso. [C]

## Ejemplo

```html
<p class="ciclo">Hola <em>mundo</em> entero</p>
```

```js
const el = document.querySelector(".ciclo");
const html = el.innerHTML;
const eventos = [];

const s = SplitText.create(el, {
  type: "words,chars",
  wordsClass: "pal++",
  propIndex: true,
  onSplit: () => eventos.push("split"),
  onRevert: () => eventos.push("revert"),
});
const palabras = s.words.length;
const clase = s.words[1].className;
const indice = s.words[2].style.getPropertyValue("--word");

s.split({ type: "lines" }); // revierte y parte, pero estas vars SUSTITUYEN a las anteriores
const lineas = s.lines.length;
const sinPalabras = s.words.length;

s.revert();
// prueba: palabras === 3 && clase === "pal pal2" && indice === "3"
// prueba: lineas === 1 && sinPalabras === 0
// prueba: eventos.join() === "split,revert"
// prueba: el.innerHTML === html && el.getAttribute("aria-label") === null
// prueba: s.isSplit === false && s.chars.length === 0
```

## revert, kill y split

| Método | Restaura HTML | Quita observadores | Revierte animación devuelta | Dispara `onRevert` |
|---|---|---|---|---|
| `revert()` | Sí, y también `aria-label` y `aria-hidden` previos | Sí | Sí | Sí, al final |
| `kill()` | No | Sí, y cancela un reparto pendiente desde 3.15.1 | No | No |
| `split(vars?)` | Primero llama a `revert()` si está partido | Vuelve a instalarlos | Sí | Sí |

Todo esto está leído en el fuente. [C] Detalles que cambian el resultado:

- `revert()` sin estar partido no hace nada, ni siquiera `onRevert`. [C]
- `split(vars)` **sustituye** la configuración, no la combina: se pierden `onSplit`, `onRevert`, `autoSplit` y `mask` si no los repites. Usa `s.split({ ...s.vars, type: "lines" })`. [E]
- `split()` sin argumentos reutiliza `vars` y funciona, aunque los tipos pidan el parámetro. [E]
- `kill()` no impide un `split()` posterior, y ese `split()` reactiva `autoSplit`. [O]
- `revert()` restaura el HTML de cuando se partió, en forma de cadena: los nodos originales no vuelven, se crean otros. Listeners puestos en hijos del elemento se pierden. [C]
- `isSplit` queda `false` tras `revert()`, y los métodos no destruyen la instancia: `split()` la reactiva. [E]

## Palabras y caracteres especiales

```html
<p class="especial">uno-dos tres</p>
<p class="digrafo">xchyz</p>
```

```js
const a = SplitText.create(".especial", {
  type: "words",
  wordDelimiter: { delimiter: /-/, replaceWith: "–" },
});
const b = SplitText.create(".digrafo", { type: "chars", specialChars: ["ch"] });
// prueba: a.words.map(w => w.textContent).join("|") === "uno|dos tres"
// prueba: document.querySelector(".especial").textContent === "uno–dos tres"
// prueba: b.chars.map(c => c.textContent).join("|") === "x|ch|y|z"
```

Los emojis compuestos cuentan como un carácter: se segmentan con `Intl.Segmenter` si existe y con una expresión regular si no. [C] [E]

Comprobaciones de la tabla de opciones y de las trampas:

```html
<p class="t1">uno dos</p>
<p class="t2">uno dos</p>
<p class="t3">uno dos</p>
<p class="t4">uno dos</p>
<p class="t5">uno dos</p>
<p class="t6">uno  dos</p>
<p class="t7">uno dos</p>
<p class="t8">uno<br>dos</p>
<p class="t9">a👍🏽b</p>
```

```js
const sinTipo = SplitText.create(".t1", { type: "nada" });
const conMascara = SplitText.create(".t2", { type: "words", mask: "words" });
const oculto = SplitText.create(".t3", { type: "words", aria: "hidden" });
const crudo = SplitText.create(".t4", { type: "words", aria: "none" });
const envuelto = SplitText.create(".t5", { type: "chars", smartWrap: true });
const espacios = SplitText.create(".t6", { type: "words", reduceWhiteSpace: false });

const primero = SplitText.create(".t7", { type: "words" });
const tercero = SplitText.create(".t7", { type: "words" });

const lineas = SplitText.create(".t8", { type: "lines" });
const brPartido = document.querySelectorAll(".t8 br").length;
lineas.revert();

const emoji = SplitText.create(".t9", { type: "chars" });

const reutiliza = SplitText.create(".t1", { type: "words" });
reutiliza.revert();
reutiliza.split();

// prueba: sinTipo.isSplit === true && sinTipo.words.length === 0
// prueba: conMascara.masks.length === 2 && conMascara.masks[0].style.overflow === "clip"
// prueba: document.querySelector(".t3").getAttribute("aria-hidden") === "true"
// prueba: oculto.words[0].getAttribute("aria-hidden") === "true" && !document.querySelector(".t3").hasAttribute("aria-label")
// prueba: !crudo.words[0].hasAttribute("aria-hidden") && !document.querySelector(".t4").hasAttribute("aria-label")
// prueba: document.querySelectorAll(".t5 span").length === 2 && document.querySelector(".t5 span").style.whiteSpace === "nowrap"
// prueba: espacios.words.length === 2 && document.querySelector(".t6").textContent === "uno  dos"
// prueba: tercero.words.length === 2
// prueba: brPartido === 0 && document.querySelectorAll(".t8 br").length === 1
// prueba: emoji.chars.length === 3
// prueba: reutiliza.isSplit === true && reutiliza.words.length === 2
// prueba: typeof SplitText.getAll === "undefined"
```

`overwrite: false` anida sobre lo ya partido:

```html
<p class="n1">uno dos</p>
```

```js
const base = SplitText.create(".n1", { type: "words" });
SplitText.create(".n1", { type: "chars", overwrite: false });
const anidado = base.words[0].querySelector("div") !== null;

// prueba: anidado === true
```

## Trampas

- **Un `wordDelimiter` personalizado sustituye al espacio**, no se suma: en el ejemplo, `"dos tres"` queda como una sola palabra. [E]
- **`<br>` y `lines`.** Al partir por líneas se eliminan los `<br>`, porque cada línea ya es un bloque; `revert()` los recupera. [C] [E]
- **`split.position` no existe.** La página de `split()` menciona `position` como opción; viene de versiones anteriores y el fuente no la lee. [C]
- **`SplitText.getAll()` no existe**, aunque la página de `vars` lo usa en un ejemplo: da `undefined`. Si necesitas agrupar instancias, guárdalas tú en un array. [E]
- **`prepareText` debe devolver texto.** Si olvidas el `return`, el reparto lanza un `TypeError` al intentar dividir `undefined`. [C]
- **`onSplit` devuelve algo que no es animación:** se ignora; solo cuenta si tiene `totalTime`. [C]
