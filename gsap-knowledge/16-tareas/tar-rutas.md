---
id: tar-rutas
titulo: Rutas por intención, síntoma, decisión y tecnología
capa: 16-tareas
tipo: referencia
ambito: transversal
resumen: Punto de entrada del sistema. Lleva de lo que quieres hacer, o de lo que falla, a la ficha exacta y a la plantilla reutilizable.
relacionadas: [fun-que-es, fra-agnostico, cal-errores-comunes, cal-st-errores]
etiquetas: [indice, diagnostico, decision]
fuentes:
  - resources/get-started.md
estado: verificado
version: 3.15.1
---
# Rutas

Busca lo que quieres hacer o lo que falla. Todo es independiente de la tecnología del proyecto salvo la última sección, que dice dónde conectarlo. Las decisiones de este documento son criterio del sistema `[P]`; los hechos están en cada ficha.

## Quiero hacer

| Objetivo | Ficha | Plantilla |
|---|---|---|
| Cargar GSAP, con o sin empaquetador | [vías de carga](../01-fundamentos/fun-instalacion.md), [archivo por plugin](../01-fundamentos/fun-plugins.md) | Las tres vías: [plantillas](../plantillas/README.md) |
| Animar algo por primera vez | [tweens](../02-nucleo/nuc-tween-metodos.md), [modelo](../01-fundamentos/fun-modelo.md) | |
| Encadenar pasos | [timeline](../03-timeline/tim-basico.md), [posición](../03-timeline/tim-posicion.md) | |
| Aparecer al hacer scroll | [revelar](../14-recetas/rec-revelar-scroll.md), [batch](../07-scroll/scr-batch.md) | `revelarScroll` |
| Parallax | [parallax](../14-recetas/rec-parallax.md), [data-speed](../07-scroll/scr-smoother-efectos.md) | `parallax` |
| Fijar una sección | [pin](../07-scroll/scr-pin.md) | |
| Scroll horizontal dentro del vertical | [pista](../14-recetas/rec-pin-horizontal.md), [horizontal](../07-scroll/scr-horizontal.md) | `pinHorizontal` |
| Ligar una animación al scroll | [scrub](../07-scroll/scr-scrub.md), [start y end](../07-scroll/scr-start-end.md) | |
| Ir a una sección con animación | [ScrollTo](../07-scroll/scr-scrollto.md) | |
| Secciones que cambian por gesto | [Observer](../07-scroll/scr-observer.md) | |
| Scroll suavizado | [ScrollSmoother](../07-scroll/scr-smoother.md) | |
| Secuencia de fotogramas con scroll | [receta](../14-recetas/rec-secuencia-imagenes.md) | `secuenciaImagenes` |
| Animar texto por líneas, palabras o letras | [SplitText](../08-texto/txt-splittext.md), [titular](../14-recetas/rec-titular-texto.md) | `titularTexto` |
| Efecto máquina de escribir o descifrado | [Text](../08-texto/txt-text.md), [Scramble](../08-texto/txt-scramble.md) | |
| Cifra que cuenta | [contador](../14-recetas/rec-contador.md) | `contador` |
| Dibujar un trazo SVG | [DrawSVG](../09-svg/svg-drawsvg.md) | |
| Transformar una forma en otra | [MorphSVG](../09-svg/svg-morphsvg.md) | |
| Mover por una ruta | [MotionPath](../09-svg/svg-motionpath.md) | |
| Animar cambios de layout | [Flip](../10-interaccion/int-flip.md), [receta](../14-recetas/rec-transicion-flip.md) | `transicionFlip` |
| Arrastrar | [Draggable](../10-interaccion/int-draggable.md), [inercia](../10-interaccion/int-inertia.md) | |
| Seguir al puntero | [seguidor](../14-recetas/rec-seguidor-cursor.md), [quickTo](../02-nucleo/nuc-quickto.md) | `seguidorCursor` |
| Botón magnético | [receta](../14-recetas/rec-boton-magnetico.md) | `botonMagnetico` |
| Cinta en bucle | [marquee](../14-recetas/rec-marquee.md) | `marquee` |
| Acordeón hasta `height: auto` | [acordeón](../14-recetas/rec-acordeon.md) | `acordeon` |
| Transición entre páginas sin recarga | [receta](../14-recetas/rec-transicion-paginas.md) | `transicionPaginas` |
| Animar la salida antes de retirar algo | [salida](../14-recetas/rec-salida.md) | |
| Reaccionar a un dato que cambia | [cambiar](../12-frameworks/fra-agnostico.md), [overwrite](../02-nucleo/nuc-overwrite.md) | |
| Curva de movimiento propia | [guía](../05-easing/eas-guia.md), [CustomEase](../05-easing/eas-customease.md) | |
| Partículas o física simple | [Physics2D](../11-especializados/esp-physics2d.md) | |
| Animar en canvas o WebGL, con o sin Three.js | [canvas y WebGL](../12-frameworks/fra-canvas-webgl.md), [objetivos](../01-fundamentos/fun-objetivos.md) | |
| Adaptar por pantalla o preferencia | [matchMedia](../02-nucleo/nuc-matchmedia.md) | |
| Hacerlo accesible | [accesibilidad](../13-calidad/cal-accesibilidad.md) | |
| Crear mi propio plugin | [plugins](../01-fundamentos/fun-plugins.md) | |

## Algo falla

| Síntoma | Empieza por |
|---|---|
| `gsap is not defined` | [vías de carga](../01-fundamentos/fun-instalacion.md) |
| `Failed to resolve module specifier "gsap"` | [import map](../01-fundamentos/fun-instalacion.md) |
| `Cannot use import statement outside a module` | [vías de carga](../01-fundamentos/fun-instalacion.md) |
| `Unexpected token 'export'` | [vías de carga](../01-fundamentos/fun-instalacion.md), [plantillas](../plantillas/README.md) |
| `does not provide an export named 'default'` | [import map](../01-fundamentos/fun-instalacion.md) |
| No pasa nada, o `target not found` | [depuración](../13-calidad/cal-depuracion.md), [objetivos](../01-fundamentos/fun-objetivos.md) |
| `Invalid property` o `Missing plugin` | [depuración](../13-calidad/cal-depuracion.md), [registro](../01-fundamentos/fun-plugins.md) |
| Parpadeo al cargar | [FOUC](../13-calidad/cal-fouc.md) |
| `from()` acaba en el valor equivocado | [immediateRender](../02-nucleo/nuc-immediate-render.md) |
| El elemento se queda invisible | [immediateRender](../02-nucleo/nuc-immediate-render.md), [errores](../13-calidad/cal-errores-comunes.md) |
| Dos animaciones se pelean | [conflictos](../13-calidad/cal-conflictos.md), [overwrite](../02-nucleo/nuc-overwrite.md) |
| Saltos o tirones | [errores](../13-calidad/cal-errores-comunes.md), [rendimiento](../13-calidad/cal-rendimiento.md) |
| Quedan estilos en línea | [clearProps](../04-propiedades/css-clearprops.md), [limpieza](../02-nucleo/nuc-limpieza.md) |
| Las animaciones se duplican al volver a una vista | [context](../02-nucleo/nuc-context.md), [contrato](../12-frameworks/fra-agnostico.md) |
| Fuga de memoria o ScrollTriggers acumulados | [limpieza](../02-nucleo/nuc-limpieza.md), [contrato](../12-frameworks/fra-agnostico.md) |
| Un `await` no termina nunca | [promesas](../02-nucleo/nuc-promesas.md), [salida](../14-recetas/rec-salida.md) |
| El nodo desaparece antes de animar su salida, o nunca se quita | [salida](../14-recetas/rec-salida.md) |
| Flip no anima tras un cambio de estado | [DOM diferido](../12-frameworks/fra-agnostico.md), [Flip](../10-interaccion/int-flip.md) |
| El lienzo queda en blanco o se agotan los contextos WebGL | [canvas y WebGL](../12-frameworks/fra-canvas-webgl.md) |
| Los puntos de ScrollTrigger no coinciden | [refresh](../07-scroll/scr-refresh.md), [errores de scroll](../13-calidad/cal-st-errores.md) |
| El pin salta o rompe el layout | [pin](../07-scroll/scr-pin.md) |
| ScrollTrigger no se dispara | [errores de scroll](../13-calidad/cal-st-errores.md) |
| Falla solo en móvil | [normalizeScroll](../07-scroll/scr-normalize.md), [ScrollSmoother](../07-scroll/scr-smoother.md) |
| `document` o `window` no definidos en servidor | [contrato](../12-frameworks/fra-agnostico.md) |
| Errores de TypeScript | [TypeScript](../12-frameworks/fra-typescript.md), [historial](../15-versiones/ver-historial.md) |
| La API no hace lo que dice la documentación | [contradicciones](../00-indice/contradicciones.md) |
| Código antiguo: `TweenMax`, `Power2.easeOut`, token | [migración](../15-versiones/ver-migracion-v3.md), [repo privado](../15-versiones/ver-repo-privado.md) |

## Elegir

| Duda | Respuesta |
|---|---|
| ¿CSS o GSAP? | Transición simple de estado: CSS. Secuencias, control de reproducción, scroll o SVG: GSAP. [fun-que-es](../01-fundamentos/fun-que-es.md) |
| ¿Tween o timeline? | Un movimiento: tween. Dos o más coordinados: timeline. [tim-basico](../03-timeline/tim-basico.md) |
| ¿`kill` o `revert`? | Parar: `kill`. Volver al estado original: `revert`. [nuc-limpieza](../02-nucleo/nuc-limpieza.md) |
| ¿`to`, `quickTo` o `quickSetter`? | Puntual: `to`. Frecuente y suave: `quickTo`. Frecuente e inmediato: `quickSetter`. [nuc-quickto](../02-nucleo/nuc-quickto.md) |
| ¿ScrollTrigger u Observer? | Ligado a la posición: ScrollTrigger. Gestos sin scroll real: Observer. [scr-observer](../07-scroll/scr-observer.md) |
| ¿`scrub` o `toggleActions`? | Ligado a la posición: `scrub`. Se dispara y corre sola: `toggleActions`. [scr-scrub](../07-scroll/scr-scrub.md), [scr-toggle](../07-scroll/scr-toggle.md) |
| ¿ScrollSmoother o scroll nativo? | Ver el análisis en [scr-smoother](../07-scroll/scr-smoother.md) |
| ¿Flip o animar a mano? | Si el layout cambia: Flip. [int-flip](../10-interaccion/int-flip.md) |
| ¿Puedo usarlo gratis en un proyecto comercial? | Sí, con una restricción concreta. [fun-licencia](../01-fundamentos/fun-licencia.md) |

## Integrarlo en mi tecnología

1. Lee siempre el [contrato de integración](../12-frameworks/fra-agnostico.md): entrar, cambiar y salir, adaptador `montar(raiz)` → `desmontar` y tabla de dónde conectarlo.
2. Si existe, añade la ficha específica, que solo contiene lo exclusivo de esa tecnología:

| Tecnología | Ficha |
|---|---|
| Sin framework, PHP, plantillas de servidor, CDN | [fra-vanilla](../12-frameworks/fra-vanilla.md) |
| Web Components y Lit | [fra-webcomponents](../12-frameworks/fra-webcomponents.md) |
| WordPress | [fra-wordpress](../12-frameworks/fra-wordpress.md) |
| Webflow | [fra-webflow](../12-frameworks/fra-webflow.md) |
| React | [fra-react-usegsap](../12-frameworks/fra-react-usegsap.md), [avanzado](../12-frameworks/fra-react-avanzado.md) |
| Next.js | [fra-nextjs](../12-frameworks/fra-nextjs.md) |
| Vue y Nuxt | [fra-vue-nuxt](../12-frameworks/fra-vue-nuxt.md) |
| Svelte y SvelteKit | [fra-svelte](../12-frameworks/fra-svelte.md) |
| Angular | [fra-angular](../12-frameworks/fra-angular.md) |
| TypeScript, con cualquiera de ellas | [fra-typescript](../12-frameworks/fra-typescript.md) |
| Canvas, WebGL, Three.js, PixiJS | [fra-canvas-webgl](../12-frameworks/fra-canvas-webgl.md), [esp-pixi](../11-especializados/esp-pixi.md) |
| Otra | El contrato basta: conecta `montar` y `desmontar` en los ganchos equivalentes |
