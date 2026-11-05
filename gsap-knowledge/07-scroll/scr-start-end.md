---
id: scr-start-end
titulo: start y end, cómo se calcula el tramo activo
capa: 07-scroll
tipo: concepto
ambito: ScrollTrigger
resumen: Sintaxis de start y end (palabras, porcentajes, relativos, max, clamp, funciones), valores por defecto y fórmula con la que salen los píxeles.
api: [ScrollTrigger.Vars.start, ScrollTrigger.Vars.end, ScrollTrigger.Vars.endTrigger, ScrollTrigger.Vars.trigger]
relacionadas: [scr-scrolltrigger, scr-refresh, scr-pin, scr-horizontal, cal-st-errores]
etiquetas: [scroll, posicion, medidas]
fuentes:
  - docs/v3/Plugins/ScrollTrigger.md
  - docs/v3/Plugins/ScrollTrigger/start.md
  - docs/v3/Plugins/ScrollTrigger/end.md
  - docs/v3/Plugins/ScrollTrigger/progress.md
  - docs/v3/Plugins/ScrollTrigger/trigger.md
estado: verificado
version: 3.15.1
---
# start y end

`start` y `end` son dos posiciones de scroll en píxeles. `progress` vale 0 en `start`, 1 en `end`, y crece linealmente entre ambos. Todo lo demás (`scrub`, `pin`, callbacks) se apoya en esos dos números.

## Modelo mental

Una cadena con dos partes dice "cuando **este punto del trigger** alcance **este punto del scroller**". [O]

```text
"top center"
  │    └─ punto del scroller (viewport): top, center, bottom, "80%", "100px", "bottom-=100px"
  └────── punto del trigger:              top, center, bottom, "20%", "50px"
```

La fórmula real, tomada de `_parsePosition` [C]:

```text
scroll = (borde superior del trigger en el documento) + (punto en el trigger) − (punto en el scroller)
```

Con un trigger a 500 px de 200 px de alto y un viewport de 700 px, `"top center"` da 500 + 0 − 350 = 150. Se mide con el DOM en reposo: es una foto, no un seguimiento. Mover o animar el trigger después no cambia los números hasta el siguiente `refresh()`. [O]

| Forma | Ejemplo | Significado |
|---|---|---|
| Dos palabras | `"top center"` | punto del trigger, punto del scroller |
| Porcentaje o píxeles | `"20% 80%"`, `"10px 100px"` | desde arriba/izquierda de cada uno |
| Ajuste relativo en cualquier parte | `"top bottom-=100px"`, `"bottom 50%+=100px"` | desplaza ese punto [O] |
| Número | `300` | posición de scroll exacta |
| Relativo al `start` (solo `end`) | `"+=400"`, `"+=100%"` | píxeles, o % del tamaño del scroller [O] |
| Máximo | `"clamp(max)"`, `"clamp(max-=100)"` | máximo de scroll, con ajuste opcional. Sin `clamp()` da problemas: ver Trampas [E] |
| Acotado | `"clamp(top bottom)"` | limita a la página: entre 0 y el máximo (desde 3.12) [O] |
| Función | `(self) => "top " + alto` | se reevalúa en cada `refresh()`, recibe la instancia [O] |

**Por defecto** [C] [E]: `start` es `"top bottom"` y `end` es `"bottom top"`. Con `pin`, `start` pasa a `"top top"`. Sin `trigger`, `start` es `0` y `end` es el máximo de scroll. Además `end` nunca queda por debajo de `start`: se fuerza con `Math.max`. [C]

## Ejemplo

```html
<div style="height:500px"></div>
<div class="bloque" style="height:200px"></div>
<div style="height:1200px"></div>
<div class="cierre" style="height:300px"></div>
```

Medidas: `.bloque` en 500-700, `.cierre` en 1900-2200, viewport de 700 px y máximo de scroll de 4500 con los 3000 px que añade el arnés.

```js
const medir = (v) => { const s = ScrollTrigger.create({ trigger: ".bloque", ...v }); return [s.start, s.end]; };

const porDefecto = medir({});
const centro = medir({ start: "top center", end: "bottom center" });
const ajustado = medir({ start: "top bottom-=100px", end: "bottom 50%+=100px" });
const relativo = medir({ start: "top center", end: "+=300" });
const relativoPct = medir({ start: "top center", end: "+=100%" });
const conOtroFin = medir({ start: "bottom 80%", endTrigger: ".cierre", end: "top top" });
const funcion = medir({ start: () => "top " + 100, end: () => "+=" + 50 });

// prueba: porDefecto.join() === "-200,700"
// prueba: centro.join() === "150,350"
// prueba: ajustado.join() === "-100,250"
// prueba: relativo.join() === "150,450"
// prueba: relativoPct.join() === "150,850"
// prueba: conOtroFin.join() === "140,1900"
// prueba: funcion.join() === "400,450"
```

Los números de `start` negativos son legítimos: el trigger ya está en pantalla al cargar y el tramo arranca "antes" de la página. Eso implica que la animación comienza con progreso parcial. `clamp()` lo evita:

```js
const libre = ScrollTrigger.create({ trigger: ".bloque" });
const acotado = ScrollTrigger.create({ trigger: ".bloque", start: "clamp(top bottom)", end: "clamp(bottom top)" });
const hastaMax = ScrollTrigger.create({ trigger: ".bloque", start: 300, end: "clamp(max-=100)" });
const pagina = ScrollTrigger.create({});

// prueba: libre.start === -200 && acotado.start === 0
// prueba: Math.abs(libre.progress - 2 / 9) < 0.001 || libre.progress === 0
// prueba: hastaMax.start === 300 && hastaMax.end === ScrollTrigger.maxScroll(window) - 100
// prueba: pagina.start === 0 && pagina.end === ScrollTrigger.maxScroll(window)
```

Progreso con scroll real:

```js
const tramo = ScrollTrigger.create({ trigger: ".bloque", start: "top center", end: "bottom top" }); // 150-700

window.scrollTo(0, 425);
ScrollTrigger.update();
const mitad = tramo.progress;

window.scrollTo(0, 2000);
ScrollTrigger.update();
const pasado = tramo.progress;

// prueba: tramo.start === 150 && tramo.end === 700
// prueba: mitad === 0.5
// prueba: pasado === 1 && tramo.isActive === false
```

## Trampas

- **El primer valor es del trigger, el segundo del viewport.** `"top 80%"` no es "al 80 % del elemento". Invertirlos no da error, solo un tramo equivocado. Usa `markers: true` para verlo. [P]
- **`"max"` y `"max-=100"` a secas fallan en 3.15.1.** La documentación los admite, pero `_parseClamp` trata toda cadena con `max` como si fuera `clamp(...)` y le recorta seis caracteres. Con `trigger`, `end: "max"` empieza valiendo `"bottom top"` y solo se corrige en el siguiente `ScrollTrigger.refresh()` global (un `st.refresh()` lo devuelve al valor malo). `"max-=100"`, en `end` o en `start`, no se corrige nunca. Escribe `"clamp(max)"`, `"clamp(max-=100)"` o una función con `ScrollTrigger.maxScroll(window)`. Sin `trigger`, `"max"` no da problema porque el valor por defecto ya es el máximo; `"max-=100"` falla igualmente: `end` queda en torno a 0, también tras `refresh()`. [C] [E]

```js
const dudoso = ScrollTrigger.create({ trigger: ".bloque", end: "max" });
const alCrear = dudoso.end;
const roto = ScrollTrigger.create({ trigger: ".bloque", end: "max-=100" });
const bien = ScrollTrigger.create({ trigger: ".bloque", end: "clamp(max-=100)" });
const tambien = ScrollTrigger.create({ trigger: ".bloque", end: () => ScrollTrigger.maxScroll(window) - 100 });
const altura = ScrollTrigger.maxScroll(window);

ScrollTrigger.refresh();

// prueba: alCrear === 700
// prueba: dudoso.end === altura
// prueba: roto.end < 0
// prueba: bien.end === altura - 100
// prueba: tambien.end === altura - 100
```

- **`self.start` no existe aún dentro de `end`.** En el primer cálculo vale `0`, de modo que `end: (self) => self.start + 50` da 50 y el tramo colapsa. Usa `"+=50"`. [E]
- **`"+=100%"` se refiere al tamaño del scroller, no del trigger.** Para la altura del trigger usa `"bottom top"` o una función. [O]
- **`"+=300"` solo funciona en `end`.** El prefijo se interpreta en la rama de `end`; `start` no lo trata como relativo. [C]
- **Valores precalculados con medidas del DOM** se quedan viejos al redimensionar. Escribe `end: () => "+=" + el.offsetHeight`, no `end: "+=" + el.offsetHeight`: la función se reevalúa en cada `refresh()`. [O]
- **Animar el trigger con `y`** desplaza el punto de referencia en la siguiente medición. ScrollTrigger mide con las animaciones `scrub` revertidas, pero un `gsap.set` previo cuenta. Anima un hijo o reinicia en `onRefreshInit`. [O] [P]
- **`end` cerca del final de la página** puede no alcanzarse: si `end` supera el máximo de scroll, `progress` nunca llega a 1. Usa `"clamp(...)"`. [O]
- **`display: none` en el trigger.** ScrollTrigger lo muestra un instante para medir, pero si un padre está oculto no hay medida útil. Crea la instancia al mostrarlo o llama a `refresh()`. [C]
- **Con `containerAnimation`**, `start` y `end` no son píxeles sino tiempo de esa animación; ver [scr-horizontal](scr-horizontal.md). [E]
