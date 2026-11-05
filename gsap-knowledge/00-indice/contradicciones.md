# Contradicciones entre documentación, tipos y código

Lugares donde la documentación oficial o los tipos no coinciden con lo que hace `gsap` 3.15.1. **Gana el código**: las fichas describen el comportamiento real. Salvo indicación, cada punto se comprobó ejecutándolo en Chrome `[E]` o leyendo el fuente `[C]`. Revísalo al cambiar de versión: algunos se corregirán.

## Posibles fallos del paquete

Parecen errores reales, no solo de documentación. No están notificados a GSAP.

| Comportamiento | Evidencia | Ficha |
|---|---|---|
| `end: "max-=100"` y `start` equivalente no funcionan; sí `"clamp(max-=100)"`. `end: "max"` con `trigger` vale `"bottom top"` hasta un `ScrollTrigger.refresh()` global | [C] [E] | scr-start-end |
| `Flip.from` en contextos anidados: `revert()` no termina el vuelo y deja `position: absolute`. `Context.kill` busca `data === "isFlip"` solo en su nivel directo | [C] [E] | rec-transicion-flip |
| `Timeline.remove(array)` no hace nada, sin aviso | [E] | tim-gestion |
| El peso `"power2.inOut(0.8)"` no tiene efecto: `createConfig` no lo asigna | [E] | eas-guia |
| `"<+=50%"` lanza `TypeError`; `"+=50%"` en `addLabel()`, `set()` y `addPause()` significa 50 segundos | [E] | tim-posicion |
| `positionInViewport(el, 20)` con número lanza; con `"20"` funciona | [E] | scr-estaticos |
| `st.tweenTo(pos)` sin segundo argumento lanza `TypeError` | [E] | scr-instancia |
| `SplitText.create(sel)` sin `vars` lanza `TypeError` | [E] | txt-splittext |
| `Flip.to(state)` sin `vars` y `normalizeStrings()` sin tercer argumento lanzan, aunque los tipos los dan por opcionales | [E] | int-flip-api, svg-morphsvg-api |
| `quickSetter` con `scale` o `autoAlpha` no hace nada y no avisa | [E] | nuc-quicksetter |
| `ScrollToPlugin.max()` en un elemento resta `offsetWidth`/`offsetHeight`: con barra clásica, `"max"` queda 15 px antes del tope | [C] [E] | scr-scrollto |
| `revert()` borra una variable CSS que ya estaba en línea: la guarda como `style["--x"]`, que es `undefined` | [C] [E] | css-variables |
| `ctx.revert()` deshace en distinto orden según el motor. `Context.kill` ordena con `b.g - a.g \|\| -Infinity`, un comparador inconsistente que da por hecho el resultado de V8: en un empate, V8 invierte el orden de creación y SpiderMonkey lo conserva. Empatan los `set`, los `startAt` de `fromTo` y `from`, y los tweens creados en el mismo tick. En Firefox, con varios de ellos sobre la misma propiedad, queda el valor capturado por el último y no el original. Comprobado en Chrome 156 y Firefox 159; Safari, sin probar | [C] [E] | nuc-context |

## Comportamiento distinto del documentado

| Tema | Documentación | Realidad en 3.15.1 | Ficha |
|---|---|---|---|
| `time(-n)`, `totalTime(-n)`, `reverse(-1)` | Negativos cuentan desde el final | Se recortan a 0 | nuc-tiempo, nuc-control |
| `play()`/`resume()` tras `timeScale(0)` | Lo pasan a 1 | Sigue en 0 | nuc-control |
| `gsap.ticker.lagSmoothing()` | Getter y setter | Sin retorno; sin argumentos, lo desactiva | nuc-ticker |
| `kill()` en un timeline | Lo presenta como definitivo | Timeline no propaga a los hijos, y `restart()` la reanuda | nuc-limpieza |
| `ScrollSmoother.create()` | Mata la anterior | Con el mismo `content`, devuelve la existente e ignora los `vars` | scr-smoother |
| `scroll-behavior: smooth` y ScrollTrigger | Hay que anularlo | ScrollTrigger ya lo pone en `auto` durante el refresco y lo restaura | cal-st-errores |
| `refresh(true)` | Hasta unos 200 ms | 200 ms fijos y, si hay scroll, hasta que termine | scr-refresh |
| `gsap.getProperty()` de algo inexistente | `null` | `0` en elementos, `undefined` en objetos | nuc-getproperty |
| `getProperty(el, "rotation", "rad")` | Convierte unidades | Concatena `"45rad"` | nuc-getproperty |
| `gsap.config({ trialWarn })` | Aparece en un ejemplo | No existe | nuc-defaults-config |
| `Timeline.removeLabel()` | Devuelve el tiempo o self, según el párrafo | Devuelve la timeline | tim-etiquetas |
| `Timeline.removePause()` | Devuelve self | `undefined` | tim-control |
| `Timeline.getById()` | Primer descendiente | Último | tim-gestion |
| `Timeline.getTweensOf(x, nested)` | Segundo parámetro `nested` | Es `onlyActive` | tim-gestion |
| `skew` | Listado como propiedad | No existe: `Invalid property`; usa `skewX`, `skewY` | css-transforms |
| Orden de transformaciones | translation, scale, rotationX/Y, skew, rotation | perspective, translate, rotate, rotateY, rotateX, skew, scale | css-transforms |
| `CSSPlugin.defaultSmoothOrigin`, `DirectionalRotationPlugin` | Citados | No existen | css-origin, css-rotacion |
| `autoRound` | Valores intermedios | También redondea el final | css-plugin |
| ModifiersPlugin | `x` llega como número | En DOM, `"135px"`; número solo en objetos planos | css-modifiers |
| EndArrayPlugin | Solo índices comunes | Crea y anima desde 0 los que faltan | css-endarray |
| `gsap.parseEase(n, defecto)` | Resuelve el defecto | Lo devuelve sin procesar | eas-registro |
| `SlowMo` `"slow"` y `"slow(0.5, 0.8)"` | Mismo efecto | Difieren | eas-easepack |
| `checkPrefix` inexistente | `undefined` | `null` | utl-cadenas |
| `syncInterval` | 200 ms | 250 ms | scr-estaticos |
| `ignoreMobileResize` | Opción | Ya activo en dispositivos solo táctiles | scr-estaticos |
| `killAll()` | No menciona oyentes | Los borra salvo `killAll(true)` | scr-estaticos |
| `clearMatchMedia()` sin argumento | Limpia todos | Solo compara con el query recibido | scr-estaticos |
| `immediateRender` dentro de `scrollTrigger` | Sin aclarar | Para el caso de dos `to()`, solo sirve en las vars del tween | cal-st-errores |
| `ScrollToPlugin.offset()` | En los tipos | No existe; hay `getOffset()` | scr-scrollto |
| SplitText `mask` | `visibility: clip` | `overflow: clip` | txt-splittext |
| SplitText: aviso por fuentes sin cargar | Prometido | No existe | txt-splittext |
| SplitText `autoSplit` con fuentes | Siempre | Exige `lines` en `type` | txt-splittext |
| `SplitText.getAll()`, opción `position` de `split()` | Citados | No existen o no se leen | txt-splittext-api |
| ScrambleText sin `text` | Usa el original | Vacía el elemento | txt-scramble |
| `DrawSVGPlugin.getPosition()` | Number | Array `[inicio, fin]` | svg-drawsvg |
| MorphSVG `revert()` | — | Deja el equivalente en cúbicas, no la `d` original | svg-morphsvg |
| `killFlipsOf` | Texto y parámetro se contradicen | `false` no completa | int-flip-api |
| Draggable `dragClickables` | Se ignoran por defecto | Se arrastran salvo con `false` | int-draggable-api |
| Draggable `onDragEnd` | Siempre | Sin arrastre no se dispara; va tras `onRelease` | int-draggable-api |
| Draggable `snap` | — | No actúa sin `inertia: true` | int-draggable |
| VelocityTracker `isTracking(obj)` | Sin propiedad, comprueba todo | `false` | int-velocitytracker |
| VelocityTracker `addProp`, `removeProp`, `isTrackingProp` | Documentados | Son `add`, `remove`, `isTracking` | int-velocitytracker |
| Página `nestedLinesSplit` | SplitText no divide anidados | `deepSlice` sí lo hace | rec-helpers |
| `mistakes.md`: tween añadido a un timeline terminado | No se reproduce | El timeline se reactiva y lo reproduce; lo que ocurre es que las adiciones se encolan | cal-errores-comunes |
| `a11y.md`: `aria: false` en SplitText | Recomendado | No existe: los valores son `"auto"`, `"hidden"` y `"none"` | cal-accesibilidad |
| `@gsap/react`: `dependencies: null` | Admitido | Funciona en ejecución, pero no compila en TypeScript | fra-react-usegsap |
| Skill oficial `gsap-react`: `contextSafe` tras desmontar | Queda sin efecto | Se ejecuta | fra-react-usegsap |
| `Wordpress.md`, `react-advanced.md`, `frameworks.md` | Ejemplos | Contienen errores: falta una `/` y una dependencia; variables sin definir; un `onMounted` sin cerrar | fra-wordpress, fra-react-avanzado, fra-vue-nuxt |
| `ScrollTrigger.md` | ScrollSmoother "members-only" | Gratuito, como todo | scr-smoother |
| `st.kill()`, `st.disable()` | `revert` es `true` por defecto y revierte la animación | Sin argumentos solo revierte el pin y, con `scrub`, el progreso; la animación se revierte con `kill(true)` | scr-instancia |
| `fastScrollEnd` | Fuerza la animación a completarse | Solo al salir por `end`; por `start`, o con acción `reverse`, la lleva a 0. En ambos casos la pausa | scr-toggle |
| ScrollToPlugin `onAutoKill` | Avisa cuando `autoKill` actúa | Solo cuando ya no queda ningún eje activo | scr-scrollto |
| Observer `debounce` | No afecta a `onDragStart` | Le afecta: va en la actualización diferida, con `onDrag` | scr-observer |
| `onReverseComplete`, `onComplete` | Dependen del sentido | Dependen de la posición: `progress(0)` sin invertir dispara el primero, y `progress(1)` invertido, el segundo | nuc-callbacks |
| `fromVars` de `fromTo()` | Las especiales van en `toVars` | `duration`, `delay` y `ease` se ignoran, pero los callbacks se ejecutan, incluso más de una vez | nuc-tween-metodos |
| `quickSetter` y `translateX` | Dice que no funciona | Funciona, con unidad, igual que `rotateX` | nuc-quicksetter |
| `DrawSVGPlugin` `getPercentage` | `getPosition(el)[1] / getLength(el)` | Solo vale si el tramo empieza en 0: hay que restar el inicio | svg-drawsvg |

## Existe pero no está documentado o tipado

- **Núcleo:** `ctx.kill()` descarta las limpiezas sin ejecutarlas; `contextSafe` como segundo argumento; `revert({ kill: false })`; relativos `"*="` y `"/="`; `stagger.base`; tercer argumento de `killTweensOf`; `globalTime()` sin tipar; `delayedCall` con cuarto parámetro `scope`.
- **Timeline y CSS:** `*=` y `/=` también en CSS; `SteppedEase.config` con `immediateStart`.
- **Utilidades:** `interpolate(a, b, p, true)`, `splitColor(c, hsl, true)`, `snap(funcion)`, `distribute({ length })`.
- **Scroll:** `snapDirectional(v, dir, threshold)`, `getScrollFunc`, `st.enabled`, `ScrollSmoother.sections()`, `wholePixels`, `scrollSpeed` en Observer (documentado, sin tipar). Con `containerAnimation`, `start` y `end` están en segundos de esa animación.
- **Plugins:** `split(vars)` sustituye toda la configuración; `Flip.fromTo`, `getElementState`, `custom`, y `scrollTrigger` en Flip (3.15.1); `MotionPathPlugin.getLength` sin tipar; `getRawPath` y `normalizeStrings` sin página; `MotionPathHelper.getString`; `GSDevTools.getByAnimation`; `value`, `trim` y `fillChar` en ScrambleText; `nowrap` en DrawSVG; `smooth`, `curveMode` y `precision` ausentes de `MorphSVGVars`.

## Tipos inexactos

`Animation.version` no existe en ejecución (solo Tween y Timeline). El cuarto argumento del ticker no es `elapsed`, sino el timestamp de rAF. `SplitText.revert()` devuelve la instancia. `batch.kill()`, `action.kill()` y `batch.clear()` devuelven `undefined`. `GSDevTools` solo acepta `vars`.

## Comportamiento observado sin causa confirmada

Reproducible, pero no aislado. Trátalo como aviso, no como explicación.

| Observación | Ficha |
|---|---|
| `pin` + `invalidateOnRefresh`: tras `revert()` queda un `transform` residual en el objetivo | rec-pin-horizontal |
| `ScrollTrigger.batch` + `stagger` tras un `gsap.set`: `revert()` deja los elementos ocultos | rec-revelar-scroll |
| Tras `refresh()` a mitad de pista, una instancia con `containerAnimation` queda con `isActive` en `false`, pierde la clase de `toggleClass` y conserva `progress`. Mover la pista recupera `isActive`, pero no la clase | scr-horizontal |
| Dos `from()` seguidos terminan en 1 y no en 0 si el primer tick de la página llega tras acabar el primero; depende solo de ese salto de tiempo | nuc-immediate-render |
| `color: "rebeccapurple"` cambia al final del tween, no en el primer render | css-complejas |

## Comportamiento confirmado que sorprende

- `then` y `await` nunca se resuelven tras `kill()` o `revert()`.
- `mm.revert()` deja de escuchar las queries, y `ctx.data` crece hasta el `revert`. Tras un `await`, el contexto deja de grabar.
- Dos `from()` seguidos pueden dejar el elemento invisible.
- Mezclar elementos y objetos propios en un tween lanza una excepción en cada tick.
- GSAP añade a los objetos planos que anima la propiedad `_gsap`, enumerable y circular: `JSON.stringify` falla sobre ellos.
- La página de licencia conserva en comentarios HTML un resumen antiguo: un extractor de texto puede presentarlo como vigente.
