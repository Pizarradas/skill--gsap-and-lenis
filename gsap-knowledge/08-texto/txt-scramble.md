---
id: txt-scramble
titulo: ScrambleTextPlugin, texto que se descifra
capa: 08-texto
tipo: plugin
ambito: ScrambleTextPlugin
resumen: Sustituye el texto de un elemento mostrando caracteres aleatorios que se van resolviendo, como un descifrado. Admite conjuntos propios, retardo y clases.
api: [ScrambleTextPlugin, ScrambleTextPlugin.Vars.text, ScrambleTextPlugin.Vars.chars, ScrambleTextPlugin.Vars.speed, ScrambleTextPlugin.Vars.delimiter, ScrambleTextPlugin.Vars.tweenLength, ScrambleTextPlugin.Vars.newClass, ScrambleTextPlugin.Vars.oldClass, ScrambleTextPlugin.Vars.revealDelay, ScrambleTextPlugin.Vars.rightToLeft]
relacionadas: [txt-text, txt-splittext, cal-accesibilidad]
etiquetas: [texto, hover]
fuentes:
  - docs/v3/Plugins/ScrambleTextPlugin.md
estado: verificado
version: 3.15.1
---
# ScrambleTextPlugin

Reescribe el texto de un elemento durante un tween: la parte aún no resuelta muestra caracteres aleatorios que cambian a intervalos, y el texto final aparece de izquierda a derecha. [O] Se usa en rollovers, contadores de aspecto técnico o titulares tipo terminal.

## Para qué sirve

| Efecto | Herramienta |
|---|---|
| Revelar con ruido aleatorio | `scrambleText` |
| Máquina de escribir, sin ruido | [`text`](txt-text.md) |
| Animar cada letra con transformaciones | [SplitText](txt-splittext.md) |

## Registro

```js fragmento
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrambleTextPlugin);
```

**Sin empaquetador:** `<script>` con `dist/ScrambleTextPlugin.min.js` (global `ScrambleTextPlugin`), o entrada `gsap/ScrambleTextPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

`scrambleText` acepta una cadena (el texto final) o un objeto. [O]

| Opción | Defecto | Efecto |
|---|---|---|
| `text` | `""` | Texto final. `"{original}"` reutiliza el texto actual [E]; `true` también [C] |
| `chars` | `"upperCase"` | `"upperCase"`, `"lowerCase"`, `"upperAndLowerCase"` o una cadena propia como `"01"` [O] |
| `speed` | `1` | Frecuencia de refresco de los caracteres. Menor es más lento [O] |
| `revealDelay` | `0` | Segundos en los que todo sigue revuelto antes de empezar a resolver [O] |
| `tweenLength` | `true` | Interpola la longitud entre texto viejo y nuevo. Con `false`, salta a la longitud final desde el inicio [C] [E] |
| `newClass` `oldClass` | — | Envuelven la parte nueva y la revuelta en un `<span>` con esa clase [E] |
| `delimiter` | `""` | Con `" "`, revela palabra a palabra [O] |
| `rightToLeft` | `false` | Revela de derecha a izquierda [O] |

El fuente también acepta `value` como alias de `text`, `trim: false` y `fillChar`, sin documentar ni tipar: no te apoyes en ellos. [C]

## Ejemplo

```html
<button class="clave">ACCESO</button>
```

```js
const boton = document.querySelector(".clave");
const descifrar = gsap.to(boton, {
  duration: 0.3,
  ease: "none",
  scrambleText: { text: "ENTRAR", chars: "01", newClass: "listo" },
});
// prueba: boton.textContent === "ENTRAR"
// prueba: boton.querySelector(".listo") !== null
// prueba: gsap.isTweening(boton) === false
```

Pasos de un tween pausado, con `revealDelay` y texto final distinto:

```html
<p class="panel">abcdef</p>
```

```js
const panel = document.querySelector(".panel");
const t = gsap.to(panel, {
  duration: 1,
  paused: true,
  ease: "none",
  scrambleText: { text: "hola mundo", chars: "X", revealDelay: 0.5, tweenLength: false },
});
t.progress(0.25);
const antes = panel.textContent;   // aún no revela nada
t.progress(0.75);
const durante = panel.textContent; // 50 % de la parte de revelado
t.progress(1);
// prueba: /^X+$/.test(antes)
// prueba: durante.startsWith("hola ")
// prueba: panel.textContent === "hola mundo"
```

Repetir el texto actual al pasar el ratón, sin escribirlo dos veces:

```html
<a class="enlace" href="#">Portfolio</a>
```

```js
const enlace = document.querySelector(".enlace");
const repaso = gsap.to(enlace, {
  duration: 0.2,
  paused: true,
  scrambleText: { text: "{original}", chars: "lowerCase" },
});
enlace.addEventListener("pointerenter", () => repaso.restart());
repaso.restart();
// prueba: enlace.textContent === "Portfolio"
```

## Trampas

- **Omitir `text` borra el contenido.** La documentación dice que se usaría el original, pero el código resuelve `value.text || value.value || ""` y la cadena vacía no activa ese caso: el elemento acaba vacío. Escribe `text: "{original}"`. [E]
- **Destruye el marcado interior.** Lee el texto plano y escribe `innerHTML`: un `<b>` dentro del elemento no vuelve ni siquiera al rebobinar a 0. Aplica el efecto a un elemento hoja o usa [`text`](txt-text.md), que sí conserva etiquetas. [E]
- **`newClass` y `oldClass` dejan `<span>` en el DOM** al terminar y también al rebobinar. Quítalos en `onComplete` si te estorban. [E]
- **Lectores de pantalla.** Durante el efecto el contenido real es ruido. En textos importantes pon el definitivo en `aria-label` u oculta el animado con `aria-hidden`. [P]
- **Salto de ancho.** Los caracteres aleatorios cambian de ancho en fuentes proporcionales y el texto vecino baila. Usa una fuente monoespaciada o `display: inline-block` con ancho fijo. [P]
- **`chars` con espacio** activa el relleno con `&nbsp;` para que los espacios seguidos no colapsen. [C]
