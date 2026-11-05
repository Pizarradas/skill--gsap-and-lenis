---
id: cal-errores-comunes
titulo: Errores comunes con GSAP, por síntoma
capa: 13-calidad
tipo: diagnostico
ambito: transversal
resumen: Síntomas reconocibles con su causa y corrección probada, from() que se queda a medias, saltos en timelines, valores duplicados, transiciones CSS y bucles.
api: [gsap.from, gsap.fromTo, gsap.TweenVars.immediateRender, gsap.TweenVars.repeatRefresh, Timeline.to, gsap.getProperty]
relacionadas: [nuc-immediate-render, nuc-control, nuc-repeat-yoyo, css-transforms, cal-st-errores, cal-conflictos, cal-depuracion]
etiquetas: [errores, diagnostico, from, immediateRender, transforms]
fuentes:
  - resources/mistakes.md
estado: verificado
version: 3.15.1
---
# Errores comunes con GSAP, por síntoma

Busca el síntoma en la tabla y salta al apartado: cada uno trae causa, corrección y prueba.

## Síntoma

| Lo que ves | Apartado |
|---|---|
| Un `from()` repetido deja el elemento semitransparente o sin llegar | [1](#1-from-relanzado-se-queda-a-medias) |
| En un timeline el primer tween no se mueve y luego vuelve atrás | [2](#2-to-y-from-sobre-lo-mismo) |
| El fundido solo funciona en la primera repetición | [3](#3-from-con-repeatrefresh) |
| La rotación empieza en 0 pese al CSS, o el `%` se convierte en px | [4](#4-transformaciones-definidas-en-css) |
| El centrado se desplaza el doble | [5](#5-porcentajes-en-x-e-y) |
| Los clics se encolan: cada animación espera a la anterior | [6](#6-añadir-a-un-timeline-ya-creado) |
| Todos los elementos animan a la vez en lugar de uno | [7](#7-selector-general-dentro-de-un-bucle) |
| El tween termina, pero el elemento sigue moviéndose o va con retardo | [8](#8-transiciones-css-sobre-la-misma-propiedad) |
| `Invalid property … Missing plugin?` | [9](#9-plugin-sin-registrar-o-mal-importado) |
| `this.targets is not a function` en un callback | [10](#10-this-en-funciones-flecha) |

Si no aparece, consulta [depuración](cal-depuracion.md), y [errores de ScrollTrigger](cal-st-errores.md) para scroll.

## Causa

Casi todos nacen de lo mismo: GSAP **lee los valores de inicio la primera vez que un tween renderiza**, no cuando se escribe el código, y `from()` y `fromTo()` renderizan de inmediato por defecto. Si otra animación o CSS alteró el valor en ese momento, el tween guarda ese dato. [O]

## Solución

### 1. `from()` relanzado se queda a medias

`from()` anima hasta el valor *actual*. Si lo relanzas durante otro, el valor actual es uno intermedio, y ese será su destino. [O]

```js invalido
boton.addEventListener("click", () => gsap.from(".caja", { opacity: 0 })); // varios clics: no llega a 1
```

Corrección: `fromTo()`, que fija ambos extremos, o un tween creado una vez y `restart()`. [O]

```js
const caja = document.querySelector(".caja-a");
const entrar = () => gsap.fromTo(caja, { opacity: 0 }, { opacity: 1, duration: 0.2, overwrite: true });
entrar();
await new Promise((r) => setTimeout(r, 60));
entrar();
await new Promise((r) => setTimeout(r, 300));
// prueba: getComputedStyle(caja).opacity === "1"
```

### 2. `to()` y `from()` sobre lo mismo

`from()` renderiza ya su valor. Cuando el `to()` anterior arranca, en el siguiente tick, lee ese valor como inicio. Resultado: va de 100 a 100, sin moverse, y luego `from()` baja a 0. [E]

```js
const linea = gsap.timeline();
linea.to(".caja-b", { x: 100, duration: 0.15, ease: "none" });
linea.from(".caja-b", { x: 100, duration: 0.15, ease: "none" });

await new Promise((r) => setTimeout(r, 70));
const enElPrimerTween = gsap.getProperty(".caja-b", "x");
await new Promise((r) => setTimeout(r, 400));
// prueba: enElPrimerTween === 100
// prueba: gsap.getProperty(".caja-b", "x") === 0
```

Corrección: `immediateRender: false` en el `from()`. Va de 0 a 100, y el `from()` lee 100 como destino. [E]

```js
const linea = gsap.timeline();
linea.to(".caja-c", { x: 100, duration: 0.15, ease: "none" });
linea.from(".caja-c", { x: 0, duration: 0.15, ease: "none", immediateRender: false });

await new Promise((r) => setTimeout(r, 500));
// prueba: gsap.getProperty(".caja-c", "x") === 100
```

### 3. `from()` con `repeatRefresh`

`repeatRefresh` vuelve a leer los valores en cada repetición. Si el timeline acabó con `opacity: 0`, el `from()` siguiente anima de 0 a 0. [O]

```js
const opacidad = () => +getComputedStyle(document.querySelector(".texto-b")).opacity;
const maxima = { conFrom: 0, conFromTo: 0 };

const conFrom = gsap.timeline({
  repeat: 1,
  repeatRefresh: true,
  onUpdate() {
    if (this.iteration() === 2) maxima.conFrom = Math.max(maxima.conFrom, +getComputedStyle(document.querySelector(".texto-a")).opacity);
  },
});
conFrom.from(".texto-a", { opacity: 0, duration: 0.1, ease: "none" }).to(".texto-a", { opacity: 0, duration: 0.1, ease: "none" });

const conFromTo = gsap.timeline({
  repeat: 1,
  repeatRefresh: true,
  onUpdate() {
    if (this.iteration() === 2) maxima.conFromTo = Math.max(maxima.conFromTo, opacidad());
  },
});
conFromTo.fromTo(".texto-b", { opacity: 0 }, { opacity: 1, duration: 0.1, ease: "none" }).to(".texto-b", { opacity: 0, duration: 0.1, ease: "none" });

await new Promise((r) => setTimeout(r, 550));
// prueba: maxima.conFrom === 0
// prueba: maxima.conFromTo > 0.5
```

Corrección: `fromTo()`, o un `set()` previo. [O]

### 4. Transformaciones definidas en CSS

El navegador devuelve una matriz en píxeles. Giros de 0 y 720 grados dan la misma matriz, y `%` o `vw` se pierden. Fija en GSAP lo que vayas a animar: además es más rápido, por la caché interna. [O]

```js
const gira = document.querySelector(".gira");
gira.style.transform = "rotate(720deg) translateX(10%)";
const leido = gsap.getProperty(gira, "rotation");
const xLeido = gsap.getProperty(gira, "x");

const bien = document.querySelector(".gira-bien");
gsap.set(bien, { rotation: 720, xPercent: 10 });
// prueba: leido === 0 && xLeido === 8
// prueba: gsap.getProperty(bien, "rotation") === 720 && gsap.getProperty(bien, "xPercent") === 10
```

### 5. Porcentajes en `x` e `y`

`x: "-50%"` escribe un porcentaje en `x`, y `xPercent` añade el suyo: se suman. Usa siempre `xPercent`/`yPercent` para porcentajes, y `x`/`y` para píxeles, lo que además permite combinarlos. [O]

```js
const doble = document.querySelector(".doble");
gsap.set(doble, { x: "-50%" });
gsap.set(doble, { xPercent: -50 });

const limpio = document.querySelector(".limpio");
gsap.set(limpio, { xPercent: -50, x: 100 });
// prueba: doble.style.transform.startsWith("translate(-50%, 0%) translate(-50%")
// prueba: gsap.getProperty(limpio, "xPercent") === -50 && gsap.getProperty(limpio, "x") === 100
```

### 6. Añadir a un timeline ya creado

La guía oficial dice que un tween añadido a un timeline terminado no llega a reproducirse. En 3.15.1 no es así: el timeline se reactiva y el tween arranca en ese momento, a su ritmo normal. El fallo real es otro: **cada adición va al final**. Con clics seguidos, las animaciones se encolan en lugar de responder, y el timeline crece sin límite. [E]

```js
const linea = gsap.timeline();
linea.to(".caja-d", { x: 50, duration: 0.05 });
await new Promise((r) => setTimeout(r, 300));

const clic = (vars) => linea.to(".caja-d", vars);
clic({ x: 300, duration: 1, ease: "none" });
clic({ y: 100, duration: 0.05 });
await new Promise((r) => setTimeout(r, 200));

const x = gsap.getProperty(".caja-d", "x");
const y = gsap.getProperty(".caja-d", "y");
// prueba: x > 60 && x < 200
// prueba: y === 0
```

El segundo clic aún no ha tenido efecto: espera a que acabe el primer tween.

Corrección: un tween suelto con `overwrite: "auto"`, o un timeline creado una vez y controlado con `play()`, `reverse()` o `restart()`. [O]

### 7. Selector general dentro de un bucle

`gsap.to(".tarjeta")` selecciona todas, aunque esté dentro de un `forEach`. Usa la variable del bucle, y `querySelector` dentro de ella para sus hijos. [O]

```html
<div class="tarjeta"><span class="nota">a</span></div>
<div class="tarjeta"><span class="nota">b</span></div>
```

```js
const lineas = gsap.utils.toArray(".tarjeta").map((tarjeta) => {
  const nota = tarjeta.querySelector(".nota");
  return gsap.timeline({ paused: true }).to(nota, { x: 20, duration: 0.05 });
});

lineas[1].play();
await new Promise((r) => setTimeout(r, 200));
const notas = gsap.utils.toArray(".nota");
// prueba: gsap.getProperty(notas[0], "x") === 0 && gsap.getProperty(notas[1], "x") === 20
```

Crear los timelines por adelantado y controlarlos con `play()` y `reverse()` también ahorra instancias, y simplifica la lógica de interacción. La excepción son los destinos dinámicos, donde conviene crear cada vez, o usar [`quickTo`](../02-nucleo/nuc-quickto.md). [O]

### 8. Transiciones CSS sobre la misma propiedad

Cada tick GSAP escribe un valor y la transición CSS empieza de nuevo hacia él. El movimiento se retrasa y dura la suma. [O]

Medido el 2026-11-05 en Chrome 156, a nivel de página, porque el iframe del arnés no avanza transiciones: `left` a 100 en 0,3 s con `transition: left .4s linear`. En `onComplete` el valor era 28, y llegó a 100 hacia los 700 ms. Sin transición, ya estaba en 100.

Corrección: quita `transition` de esa propiedad, o aplícala en un elemento hijo o padre. Limita además `transition: all`, que es la causa habitual. [P]

### 9. Plugin sin registrar o mal importado

`Invalid property X set to Y Missing plugin? gsap.registerPlugin()` significa una errata en la propiedad, o un plugin no registrado. Sin empaquetador, el archivo del plugin no está cargado, o se registró en otra copia de GSAP: ver [vías de carga](../01-fundamentos/fun-instalacion.md). [C] Con empaquetador, si solo falla en producción, el *tree shaking* eliminó el import: `registerPlugin` lo mantiene. [O] [C]

```js fragmento
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
```

### 10. `this` en funciones flecha

Una flecha conserva el `this` exterior, de modo que `this.targets()` falla. Usa `function`. [O]

```js
let objetivos = 0;
gsap.to(".caja-e", {
  x: 10,
  duration: 0.05,
  onComplete: function () {
    objetivos = this.targets().length;
  },
});
await new Promise((r) => setTimeout(r, 200));
// prueba: objetivos === 3
```

### Hábitos de escritura

| En lugar de | Escribe | Por qué |
|---|---|---|
| `gsap.to(el, 1, { x: 100 })` | `gsap.to(el, { duration: 1, x: 100 })` | Sirve con `defaults` y efectos [O] |
| `Power2.easeOut` | `"power2"` | Sin imports; `.out` es el defecto [O] |
| `x: "100px"` | `x: 100` | Strings solo para otra unidad o valor compuesto [O] |
| `document.querySelectorAll(".a")` | `".a"` | GSAP ya lo hace [O] |
| `fromTo()` por defecto | `to()` o `from()` | Más dinámicos. `fromTo()` cuando hace falta fijar ambos extremos [O] |
