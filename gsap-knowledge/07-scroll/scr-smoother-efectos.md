---
id: scr-smoother-efectos
titulo: Efectos de ScrollSmoother, data-speed y data-lag
capa: 07-scroll
tipo: concepto
ambito: ScrollSmoother
resumen: Parallax con data-speed, retardo con data-lag, valores auto y clamp, método effects(), prefijo y padding, y cómo se reparte el desplazamiento respecto al centro.
api: [ScrollSmoother.effects, ScrollSmoother.EffectsVars.speed, ScrollSmoother.EffectsVars.lag, ScrollSmoother.EffectsVars.effectsPadding, ScrollSmoother.Vars.effectsPrefix, ScrollSmoother.Vars.effectsPadding]
requiere: [scr-smoother]
relacionadas: [scr-smoother-api, rec-parallax]
etiquetas: [scroll, parallax]
fuentes:
  - docs/v3/Plugins/ScrollSmoother.md
  - docs/v3/Plugins/ScrollSmoother/effects().md
estado: verificado
version: 3.15.1
---
# Efectos de ScrollSmoother

`effects: true` busca `data-speed` y `data-lag` y crea un ScrollTrigger por elemento para aplicarlos, sin escribir animaciones. Es el motivo habitual para usar ScrollSmoother. [O]

## Modelo mental

| Atributo u opción | Valor | Resultado |
|---|---|---|
| `data-speed="0.5"` | número | Se mueve a media velocidad del scroll |
| `data-speed="2"` | número | Al doble |
| `data-speed="1"` | | Sin efecto: no se crea instancia [C] |
| `data-speed="auto"` | | Calcula cuánto cabe moverse dentro de su padre: imagen mayor que el contenedor, con `overflow: hidden` |
| `data-speed="clamp(0.5)"` | | No empieza desplazado si está en la primera pantalla (desde 3.12) |
| `data-lag="0.5"` | segundos | Tarda ese tiempo en alcanzar la posición suavizada |

**Punto de encaje.** Un elemento con `data-speed` está en su posición natural cuando queda **centrado** en el viewport. Antes va desplazado en un sentido y después, en el otro. Por eso un elemento de la parte alta de la página aparece movido al cargar, y por eso existe `clamp()`. [O]

Fórmula de `y` [C]: `desplazamiento = (recorrido del tramo) × (1 − speed) × (progreso − 0.5)`. El tramo va de `"top bottom"` a `"bottom top"`, ajustado por la velocidad.

`effects()` hace lo mismo por código, y admite funciones `(indice, elemento)`, que se reevalúan al refrescar. Con `config` omitido, lee los atributos. Devuelve las instancias creadas, y sin argumentos devuelve todas. [O]

## Ejemplo

```html
<div id="smooth-wrapper">
  <div id="smooth-content">
    <div style="height:900px"></div>
    <div class="lento" data-speed="0.5" style="height:100px"></div>
    <div class="retardado" data-lag="0.05" style="height:100px"></div>
    <div class="normal" data-speed="1" style="height:100px"></div>
    <div style="height:1800px"></div>
  </div>
</div>
```

`.lento` empieza en 900. Su centro natural (950) coincide con el del viewport en el scroll 600: ahí su `y` es 0. Más allá se desplaza en sentido contrario.

```js
const smoother = ScrollSmoother.create({ smooth: 0, effects: true });
const efectos = smoother.effects();

window.scrollTo(0, 600);
ScrollTrigger.update();
const enCentro = gsap.getProperty(".lento", "y");

window.scrollTo(0, 800);
ScrollTrigger.update();
const pasado = gsap.getProperty(".lento", "y");

// prueba: efectos.length === 2
// prueba: Math.abs(enCentro) < 1
// prueba: pasado > 0
// prueba: Math.abs(pasado - 100) < 1
```

El elemento a media velocidad va 100 px por detrás al cabo de 200 px de scroll. Esa es la proporción `(1 − 0.5)`.

Por código, y con funciones:

```js
const smoother = ScrollSmoother.create({ smooth: 0 });
const nuevos = smoother.effects(".lento, .normal", {
  speed: (i) => 0.5 + i * 0.25,
  lag: 0,
});
const valor = document.querySelector(".normal").getAttribute("data-speed");

smoother.effects(".lento", { speed: 1, lag: 0 }); // quitar: valores neutros

// prueba: nuevos.length === 2
// prueba: valor === "0.75"
// prueba: smoother.effects().length === 1
```

Prefijo propio para evitar colisiones con atributos existentes:

```html
<div id="smooth-wrapper">
  <div id="smooth-content">
    <div style="height:900px"></div>
    <div class="mio" data-efecto-speed="0.5" style="height:100px"></div>
    <div class="ajeno" data-speed="0.5" style="height:100px"></div>
    <div style="height:2000px"></div>
  </div>
</div>
```

```js
const smoother = ScrollSmoother.create({ smooth: 0, effects: true, effectsPrefix: "efecto-" });

// prueba: smoother.effects().length === 1
// prueba: smoother.effects()[0].trigger === document.querySelector(".mio")
```

`effects` admite también un selector para limitar la búsqueda: `effects: ".galeria img"`. [O]

`effectsPadding` (número, o función en `effects()`) amplía en píxeles el tramo por ambos lados, para los raros casos en que el elemento debe seguir moviéndose fuera de su zona natural. [O] [C]

```js
const smoother = ScrollSmoother.create({ smooth: 0 });
const sinPadding = smoother.effects(".mio", { speed: 0.5 })[0];
const conPadding = smoother.effects(".ajeno", { speed: 0.5, effectsPadding: 100 })[0];

// prueba: Number.isFinite(sinPadding.start)
// prueba: conPadding.end - conPadding.start > sinPadding.end - sinPadding.start
```

## Trampas

- **Efectos anidados no.** No pongas `data-speed` dentro de otro elemento con `data-speed`: los transforms se suman y las medidas no. [O]
- **Elemento de la parte alta que aparece movido.** Es por el encaje al centro. Usa `data-speed="clamp(0.5)"`. [O]
- **`auto` sin `overflow: hidden`** en el padre, o con un hijo igual de alto que el padre, no tiene dónde moverse. [O]
- **Efectos dentro de un elemento fijado.** ScrollSmoother detecta el pin y ajusta (`pinnedContainer` interno), pero crea los pines antes del primer `refresh()` para que los vea. [C] [P]
- **`y` en el mismo elemento.** El efecto escribe `y`: una animación tuya en `y` entra en conflicto. Anima un hijo o usa `yPercent`. [C] [P]
- **Quitar un efecto** se hace con `{ speed: 1, lag: 0 }` o matando la instancia; con esos valores, `effects()` no crea ninguna y el efecto anterior desaparece. [O] [E]
- **Texto con `data-speed` distinto** dentro de un bloque legible separa las líneas. Resérvalo para imágenes y decoración. [P]
- **`data-speed` en móvil** sin `smoothTouch` puede temblar. Ver [scr-smoother](scr-smoother.md). [C] [P]
