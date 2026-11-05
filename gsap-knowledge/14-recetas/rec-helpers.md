---
id: rec-helpers
titulo: Catálogo de funciones auxiliares oficiales
capa: 14-recetas
tipo: referencia
ambito: transversal
resumen: Las 28 helper functions de gsap.com, agrupadas por problema, con cuándo usarlas, qué requieren y qué alternativa nativa existe.
api: [ScrollTrigger.snapDirectional, SplitText.Vars.deepSlice, Flip.from, gsap.delayedCall, gsap.utils.pipe, gsap.utils.shuffle]
relacionadas: [rec-marquee, rec-secuencia-imagenes, rec-contador, rec-transicion-flip, svg-motionpathhelper, eas-guia, utl-funciones]
etiquetas: [catalogo, helpers, referencia]
fuentes:
  - docs/v3/HelperFunctions.md
  - docs/v3/HelperFunctions/helpers/*
  - docs/v3/MotionPathHelper/*
estado: verificado
version: 3.15.1
---
# Catálogo de funciones auxiliares oficiales

Funciones sueltas que GreenSock publica en gsap.com para problemas frecuentes. No forman parte del paquete: se copian de su página. **Aquí no se reproduce su código**, porque no consta licencia para ello. Cada nombre enlaza a la página oficial. La descripción de cada una es [O]; las alternativas y recomendaciones son [P], salvo las marcadas. Todas dependen del core, y la columna *Requiere* lista el resto.

## Cómo elegir

1. Mira primero si hay una alternativa nativa: una función mantenida con el paquete gana a un fragmento copiado. [P]
2. Si copias un helper, conserva la URL en un comentario y revísalo al actualizar GSAP: no tiene versión ni pruebas. [P]
3. Los helpers son globales de usuario y no saben de `gsap.context()`, salvo lo que creen dentro de él. Llámalos dentro del contexto si crean tweens o `ScrollTrigger`, y comprueba qué queda tras `revert()`. [P]

## Bucles, carruseles y scroll

| Helper | Qué resuelve | Cuándo usarlo | Requiere | Alternativa |
|---|---|---|---|---|
| [seamlessLoop](https://gsap.com/docs/v3/HelperFunctions/helpers/seamlessLoop) | Bucle infinito de elementos con métodos `next()`, `previous()`, `toIndex()`, `current()` y tiempos por elemento; incluye variante con Draggable y una vertical, `verticalLoop` | Carruseles navegables, con arrastre o centrado | — (Draggable e InertiaPlugin en sus variantes) | [rec-marquee](rec-marquee.md) si solo es una cinta |
| [getScrollLookup](https://gsap.com/docs/v3/HelperFunctions/helpers/getScrollLookup) | Devuelve una función que da la posición de scroll de cada elemento, con pin y `containerAnimation` en cuenta | Menús que saltan a secciones con pin de por medio | ScrollTrigger | `ScrollTrigger.create` propio y `.start` |
| [getScrollPosition](https://gsap.com/docs/v3/HelperFunctions/helpers/getScrollPosition) | Da el scroll exacto de un punto de una animación con ScrollTrigger, también con `containerAnimation` | Saltar al inicio o a un % de una animación | ScrollTrigger | `animation.scrollTrigger.labelToScroll()` si hay etiquetas |
| [stopOverscroll](https://gsap.com/docs/v3/HelperFunctions/helpers/stopOverscroll) | Evita el rebote de scroll, también en iOS Safari, donde `overscroll-behavior` no bastaba al escribirse la página | Rebote visible en iOS | — | `overscroll-behavior: none`; comprueba primero si basta |
| [LottieScrollTrigger](https://gsap.com/docs/v3/HelperFunctions/helpers/LottieScrollTrigger) | Liga el progreso de una animación Lottie al scroll | Animaciones de After Effects exportadas | ScrollTrigger, lottie-web | — |
| [imageSequenceScrub](https://gsap.com/docs/v3/HelperFunctions/helpers/imageSequenceScrub) | Recorre una lista de imágenes en un `<canvas>` con scrub | Secuencia simple sin requisitos de adaptación | ScrollTrigger | [rec-secuencia-imagenes](rec-secuencia-imagenes.md) añade recorte, densidad y limpieza |

## Texto y números

| Helper | Qué resuelve | Cuándo usarlo | Requiere | Alternativa |
|---|---|---|---|---|
| [nestedLinesSplit](https://gsap.com/docs/v3/HelperFunctions/helpers/nestedLinesSplit) | Divide en líneas el texto dentro de elementos anidados | Solo si `deepSlice` no resuelve tu estructura | SplitText | `deepSlice`, activo por defecto (ver abajo) |
| [splitTextAnimator](https://gsap.com/docs/v3/HelperFunctions/helpers/splitTextAnimator) | SplitText con método `animate()`, para reinsertar en un timeline la animación regenerada al redividir | SplitText responsive dentro de un timeline | SplitText | `onSplit` si la animación no va anidada |
| [splitArabicText](https://gsap.com/docs/v3/HelperFunctions/helpers/splitArabicText) | Separa letras árabes conservando su forma contextual | Animar árabe por caracteres | SplitText | — |
| [formatNumber](https://gsap.com/docs/v3/HelperFunctions/helpers/formatNumber) | Número con comas y decimales limitados; la página incluye además `getFormatter`, con incrementos | Formato `en-US` fijo | — | `Intl.NumberFormat`, ver [rec-contador](rec-contador.md) |

## Easing y aleatoriedad

| Helper | Qué resuelve | Cuándo usarlo | Requiere | Alternativa |
|---|---|---|---|---|
| [addWeightedEases](https://gsap.com/docs/v3/HelperFunctions/helpers/addWeightedEases) | Añade a las eases estándar un parámetro de -1 a 1 que carga la curva hacia un extremo | Afinar una curva sin dibujarla | — | CustomEase |
| [blendEases](https://gsap.com/docs/v3/HelperFunctions/helpers/blendEases) | Mezcla dos eases: una al principio y otra al final | Arranque de una curva y final de otra | — | CustomEase con la curva final |
| [easeToLinear](https://gsap.com/docs/v3/HelperFunctions/helpers/easeToLinear) | Estima en qué progreso lineal una ease alcanza un valor | Sincronizar algo con un valor intermedio | — | — |
| [weightedRandom](https://gsap.com/docs/v3/HelperFunctions/helpers/weightedRandom) | Elige al azar de un array, sesgado por una ease | Distribuciones no uniformes | — | `gsap.utils.random` si es uniforme |
| [pluckRandomFrom](https://gsap.com/docs/v3/HelperFunctions/helpers/pluckRandomFrom) | Extrae sin repetir hasta agotar, y empieza de nuevo; también trae `getRandomFrom`, que solo evita repetir el anterior | Listas de colores o frases sin repetición | — | `gsap.utils.shuffle` más un índice |
| [getDirectionalSnapFunc](https://gsap.com/docs/v3/HelperFunctions/helpers/getDirectionalSnapFunc) | Ajuste a un incremento o array en una dirección dada | Snap que respeta el sentido | — | `ScrollTrigger.snapDirectional()` (ver abajo) |

## Transforms y CSS

| Helper | Qué resuelve | Cuándo usarlo | Requiere | Alternativa |
|---|---|---|---|---|
| [smoothOriginChange](https://gsap.com/docs/v3/HelperFunctions/helpers/smoothOriginChange) | Cambia `transformOrigin` compensando `x`/`y` para que no salte | Rotar o escalar desde otro punto en plena animación | — | — |
| [alignOrigins](https://gsap.com/docs/v3/HelperFunctions/helpers/alignOrigins) | Alinea el `transformOrigin` de un elemento con el de otro, sin salto | Dos elementos que deben girar sobre el mismo punto | MotionPathPlugin | — |
| [compensatedSkew](https://gsap.com/docs/v3/HelperFunctions/helpers/compensatedSkew) | Reproduce el `skewType: "compensated"` de GSAP 2 desde `onUpdate`; la propia página dice que no tiene soporte oficial | Migrar animaciones antiguas | — | Revisar el diseño del skew |
| [bgSize](https://gsap.com/docs/v3/HelperFunctions/helpers/bgSize) | Anima `backgroundSize` desde o hasta `cover`/`contain`, traducidos a px; la página ofrece además un `BackgroundSizePlugin` no oficial | Fondos con zoom | — | Imagen con `object-fit` y `scale` |
| [FLIP](https://gsap.com/docs/v3/HelperFunctions/helpers/FLIP) | Versión mínima de la técnica FLIP | Casos muy básicos sin el plugin | — | Flip, gratuito y más completo: [rec-transicion-flip](rec-transicion-flip.md) |
| [anchorsToProgress](https://gsap.com/docs/v3/HelperFunctions/helpers/anchorsToProgress) | Calcula el progreso de cada punto de anclaje de un trazado | Dibujar con DrawSVG tramo a tramo | MotionPathPlugin | — |

## Control de animaciones y tiempo

| Helper | Qué resuelve | Cuándo usarlo | Requiere | Alternativa |
|---|---|---|---|---|
| [trackDirection](https://gsap.com/docs/v3/HelperFunctions/helpers/trackDirection) | Sigue la dirección del cabezal, incluso anidado, y avisa al invertirse: el `onReverse` que no existe | Reaccionar a un cambio de sentido | — | — |
| [getNestedLabelTime](https://gsap.com/docs/v3/HelperFunctions/helpers/getNestedLabelTime) | Traduce una etiqueta de un timeline anidado al tiempo de un ancestro | `seek()` a una etiqueta interna | — | Etiqueta en el padre |
| [killChildTweensOf](https://gsap.com/docs/v3/HelperFunctions/helpers/killChildTweensOf) | Mata los tweens de los descendientes de un elemento | Desmontar una zona sin referencia a sus tweens | — | `gsap.context()` con su `revert()` |
| [progressiveBuild](https://gsap.com/docs/v3/HelperFunctions/helpers/progressiveBuild) | Encadena funciones que devuelven animaciones, y crea cada paso al acabar el anterior | Pasos que dependen del estado final del anterior | — | `await` sobre cada tween |
| [callAfterResize](https://gsap.com/docs/v3/HelperFunctions/helpers/callAfterResize) | Ejecuta una función cuando cesa el `resize` | Recalcular algo caro | — | `ScrollTrigger.addEventListener("refresh", …)` si el trabajo va ligado a ScrollTrigger |
| [tickGSAPWhileHidden](https://gsap.com/docs/v3/HelperFunctions/helpers/tickGSAPWhileHidden) | Mantiene GSAP actualizando con la pestaña oculta, a unos 2 fps | Procesos que no deben parar, como audio | — | — |

## Alternativas nativas comprobadas

`ScrollTrigger.snapDirectional()` cubre el caso de `getDirectionalSnapFunc` [O]. Con incremento y con array: [E]

```js
const haciaMultiplo = ScrollTrigger.snapDirectional(5);
const haciaLista = ScrollTrigger.snapDirectional([0, 10, 25]);
// prueba: haciaMultiplo(11, 1) === 15 && haciaMultiplo(14, -1) === 10
// prueba: haciaLista(11, 1) === 25 && haciaLista(11, -1) === 10
```

La página de `nestedLinesSplit` dice que SplitText no divide en líneas el contenido anidado, pero la de SplitText describe `deepSlice`, y este sí funciona: un `<em>` que ocupa dos líneas se parte en dos, sin estirar el bloque. [E]

```html
<p class="parrafo" style="width:220px;font-size:20px;line-height:24px">Texto con <em>una parte destacada bastante larga en cursiva</em> y un cierre</p>
```

```js
const parrafo = document.querySelector(".parrafo");
const trozos = SplitText.create(parrafo, { type: "lines" });
const lineas = trozos.lines.length;
const enfasis = parrafo.querySelectorAll("em").length;
// prueba: lineas >= 3
// prueba: enfasis >= 2
// prueba: Math.max(...trozos.lines.map((l) => l.offsetHeight)) <= 24
```

## Notas sobre el catálogo

- El índice oficial titula *Change transformOrigin without a jump* tanto a `alignOrigins` como a `smoothOriginChange`. Son distintos: el primero alinea con otro elemento y necesita MotionPathPlugin. [O]
- El índice describe `seamlessLoop` para «x or y axis», y la página se titula solo con el eje x; la versión vertical aparece más abajo como `verticalLoop`. [O]
- La página de `formatNumber` contiene `getFormatter` junto a un comentario interno sin editar: parece un borrador publicado. [O]
- `formatNumber` usa `toLocaleString("en-US")` y corta los decimales como texto, por lo que trunca en lugar de redondear al número pedido. [C]
- `MotionPathHelper` no es de este catálogo: es un plugin, documentado en [su ficha](../09-svg/svg-motionpathhelper.md). `kill()` y `MotionPathHelper.editPath()` son los miembros cubiertos por sus páginas. [O]
