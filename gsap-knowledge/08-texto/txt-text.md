---
id: txt-text
titulo: TextPlugin, reemplazar texto poco a poco
capa: 08-texto
tipo: plugin
ambito: TextPlugin
resumen: Reemplaza el contenido de un elemento carácter a carácter o palabra a palabra, conservando HTML sencillo y permitiendo rebobinar. Efecto máquina de escribir.
api: [TextPlugin, TextPlugin.Vars.value, TextPlugin.Vars.type, TextPlugin.Vars.rtl, TextPlugin.Vars.speed, TextPlugin.Vars.delimiter, TextPlugin.Vars.padSpace, TextPlugin.Vars.newClass, TextPlugin.Vars.oldClass, TextPlugin.Vars.preserveSpaces]
relacionadas: [txt-scramble, txt-splittext]
etiquetas: [texto]
fuentes:
  - docs/v3/Plugins/TextPlugin.md
estado: verificado
version: 3.15.1
---
# TextPlugin

Sustituye el texto de un elemento durante un tween, posición a posición: al avanzar el progreso, cada carácter o palabra del texto nuevo reemplaza al antiguo. Al rebobinar vuelve el original. [O] Es el efecto de máquina de escribir, sin crear un elemento por letra.

## Para qué sirve

Para cambiar el contenido con un efecto escrito. Si necesitas transformar cada letra, usa [SplitText](txt-splittext.md); si quieres ruido aleatorio, [ScrambleTextPlugin](txt-scramble.md).

## Registro

```js fragmento
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(TextPlugin);
```

**Sin empaquetador:** `<script>` con `dist/TextPlugin.min.js` (global `TextPlugin`), o entrada `gsap/TextPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

`text` acepta una cadena (el valor final) o un objeto:

| Opción | Efecto |
|---|---|
| `value` | Texto o HTML sencillo final. **Requerido** en la forma de objeto [O] |
| `delimiter` | Unidad de sustitución: `""` por carácter, `" "` por palabra [O] |
| `type` | `"diff"` salta las posiciones idénticas entre texto viejo y nuevo [O] |
| `speed` | Calcula la duración: `0.05 / speed * cambios`. Sustituye a `duration` [C] |
| `rtl` | Introduce el texto de derecha a izquierda [O] |
| `newClass` `oldClass` | `<span>` con esa clase alrededor de la parte nueva y la vieja [E] |
| `padSpace` | Si el nuevo es más corto, rellena con `&nbsp;` para no colapsar [O] |
| `preserveSpaces` | Mantiene espacios extra convirtiéndolos en `&nbsp;` [E] |

Sin documentar ni tipar, el fuente lee `fillChar` (carácter de relleno) y `maxDuration` (tope para `speed`). [C]

Usa `ease: "none"`: con una curva, el ritmo de escritura se acelera y frena. [P]

## Ejemplo

```html
<p class="maquina">Cargando</p>
```

```js
const maquina = document.querySelector(".maquina");
const escribir = gsap.to(maquina, { duration: 1, paused: true, ease: "none", text: "Terminado" });

escribir.progress(0.5);
const mitad = maquina.textContent;
escribir.progress(1);
const fin = maquina.textContent;
escribir.progress(0);
// prueba: mitad === "Termindo"
// prueba: fin === "Terminado"
// prueba: maquina.textContent === "Cargando"
```

`speed` fija la duración según la longitud, pero se calcula al inicializarse el tween, no al crearlo:

```html
<p class="rapido">x</p>
```

```js
const rapido = document.querySelector(".rapido");
const t = gsap.to(rapido, { duration: 5, ease: "none", text: { value: "123456", speed: 2 } });
const alCrear = t.duration();
t.pause().progress(0.01);
const trasIniciar = t.duration();
// prueba: alCrear === 5
// prueba: Math.abs(trasIniciar - 0.15) < 0.001
```

`type: "diff"` y conservación de etiquetas:

```html
<p class="precio">Total: <b>10</b> EUR</p>
```

```js
const precio = document.querySelector(".precio");
const original = precio.innerHTML;
const cambio = gsap.to(precio, { duration: 1, paused: true, ease: "none", text: { value: "Total: <b>25</b> EUR", type: "diff" } });
cambio.progress(1);
const final = precio.querySelector("b").textContent;
cambio.progress(0);
// prueba: final === "25"
// prueba: precio.innerHTML === original
```

## Trampas

- **Las opciones van dentro de `text`.** `{ text: "Hola", delimiter: " " }` no funciona: `delimiter` es una clave del tween y GSAP avisa de propiedad inválida. Escribe `text: { value: "Hola", delimiter: " " }`. [O]
- **Sin `value`, vacía el elemento.** `text: { newClass: "x" }` deja el contenido en blanco. [E]
- **`duration()` no refleja `speed` hasta el primer render.** Si encadenas en un timeline por posición relativa, el cálculo llega tarde: fija `duration` tú o fuerza la inicialización. [E]
- **`newClass` y `oldClass` dejan el `<span>`** al terminar. [E]
- **Solo elementos DOM.** Con un objeto normal lanza un `TypeError` en cada tick, porque espera `nodeName`. [E] En SVG solo admite `<text>` y `<tspan>`, y escribe `textContent`. [C]
- **HTML sencillo.** Reconoce nodos como `<br>`, pero no es un parser de estructura: los anidamientos profundos pueden desincronizar la sustitución. [P]
- **Salto de altura.** El texto cambia de longitud y empuja el contenido. Reserva altura con `min-height`. [P]
