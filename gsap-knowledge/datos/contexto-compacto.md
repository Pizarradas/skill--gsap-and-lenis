# GSAP 3.15.1: contexto compacto

Índice para agentes: abre la ficha completa solo cuando la necesites.

## 01-fundamentos
- 01-fundamentos/fun-instalacion.md: Las tres vías de carga (empaquetador, script clásico y módulos con import map), qué archivo usar en cada una, SSR y cómo evitar dos copias de GSAP.
- 01-fundamentos/fun-licencia.md: Resumen de la licencia estándar sin coste - qué permite, la restricción sobre constructores visuales sin código, revocación y cambios. No es asesoramiento legal.
- 01-fundamentos/fun-modelo.md: Cómo piensa GSAP - un árbol de animaciones con cabezales, valores iniciales leídos en el primer render, escritura diferida y liberación automática al terminar.
- 01-fundamentos/fun-objetivos.md: Formas válidas de indicar targets - selector, elemento, lista, objeto propio, métodos y setters - y los errores típicos al mezclarlos.
- 01-fundamentos/fun-plugins.md: Mapa de plugins y claves de vars, gsap.registerPlugin y guía para crear un plugin propio con init, render, this.add, kill y soporte de revert.
- 01-fundamentos/fun-que-es.md: Mapa de GSAP - núcleo, plugins, Tween y Timeline, qué sabe animar y cuándo compensa frente a CSS. Punto de entrada del sistema.
- 01-fundamentos/fun-valores.md: Formas de escribir un valor destino - número, unidades, relativo, función por objetivo, random(), colores y cadenas complejas.

## 02-nucleo
- 02-nucleo/nuc-callbacks.md: onStart, onUpdate, onComplete, onRepeat, onReverseComplete y onInterrupt, sus parámetros, this, callbackScope y cuándo se disparan de verdad.
- 02-nucleo/nuc-consulta.md: gsap.getById, getTweensOf, isTweening y killTweensOf para localizar animaciones sin guardar variables, y sus límites tras completarse.
- 02-nucleo/nuc-context.md: Recoge animaciones y ScrollTriggers para revertirlos juntos y limita selectores a un ámbito. Qué registra de verdad, limpiezas, contextSafe y fugas.
- 02-nucleo/nuc-control.md: play, pause, resume, reverse, restart, seek, paused, reversed e isActive; sus argumentos, diferencias y patrón de hover con timeScale.
- 02-nucleo/nuc-defaults-config.md: Valores heredados por los tweens frente a ajustes globales del motor; autoSleep, force3D, units, nullTargetWarn, stringFilter y claves que añaden plugins.
- 02-nucleo/nuc-delayedcall.md: Llama a una función tras un retardo, dentro del reloj de GSAP. Alternativa a setTimeout que se pausa, se escala y se limpia con el resto.
- 02-nucleo/nuc-efectos.md: gsap.registerEffect y gsap.effects para empaquetar animaciones con nombre, defaults y métodos directos en Timeline.
- 02-nucleo/nuc-getproperty.md: Lee el valor actual de una propiedad como número, con unidad convertida o mediante una función reutilizable. Conoce transformaciones que getComputedStyle no separa.
- 02-nucleo/nuc-global.md: Pausar o ralentizar todo, separar lo que ya existe de lo nuevo con exportRoot, manejar el reloj a mano y otros miembros de gsap.
- 02-nucleo/nuc-immediate-render.md: Por qué from() y fromTo() pintan al crearse, cómo rompe eso varios from() sobre la misma propiedad y cuándo poner immediateRender en false.
- 02-nucleo/nuc-keyframes.md: Las tres sintaxis (array de objetos, porcentajes, arrays por propiedad), cómo se combinan ease y easeEach, y sus diferencias de herencia.
- 02-nucleo/nuc-limpieza.md: Qué deja kill y qué deshace revert, inline styles, reutilización, muerte parcial, callbacks y cuál usar en cada situación.
- 02-nucleo/nuc-matchmedia.md: Ejecuta código según media queries y lo revierte al dejar de coincidir. Condiciones, prefers-reduced-motion, scope, refresh y diferencias entre revert y kill.
- 02-nucleo/nuc-overwrite.md: Qué pasa cuando dos tweens tocan lo mismo y cómo se comportan overwrite true, auto y false, incluidos tweens pausados, retrasados y en timelines.
- 02-nucleo/nuc-promesas.md: Esperar animaciones con then y await, y los casos en que la promesa no se resuelve nunca - kill, revert y repeat infinito.
- 02-nucleo/nuc-quicksetter.md: Función optimizada que escribe un valor al instante, sin crear tweens. Para pointermove o bucles donde gsap.set sería costoso.
- 02-nucleo/nuc-quickto.md: Crea una función reutilizable que reorienta un mismo tween hacia un valor nuevo. Ideal para seguir el ratón sin crear un tween por evento.
- 02-nucleo/nuc-repeat-yoyo.md: Repetir, alternar sentido, pausas entre vueltas, repeatRefresh y easeReverse, que reemplaza a yoyoEase desde 3.15.0.
- 02-nucleo/nuc-stagger.md: Número, objeto o función; each frente a amount, from, grid, axis y ease; repeat y callbacks a nivel de tween o de cada elemento.
- 02-nucleo/nuc-ticker.md: Añadir lógica por frame, parámetros del listener, prioridad, fps, deltaRatio, lagSmoothing, sleep y wake.
- 02-nucleo/nuc-tiempo.md: Diferencia entre time y totalTime, progress y totalProgress, duration y totalDuration; timeScale, delay, startTime, endTime y globalTime.
- 02-nucleo/nuc-tween-metodos.md: Firmas de gsap.to, from, fromTo y set, miembros propios de Tween y qué método elegir en cada caso.
- 02-nucleo/nuc-vars-especiales.md: Catálogo de claves reservadas de vars - tiempo, ease, repetición, render, control y callbacks - con valor por defecto y ficha donde se detallan.

## 03-timeline
- 03-timeline/tim-anidado.md: Componer una secuencia larga con funciones que devuelven timelines. Cómo interactúan posición, pausa, repeat y defaults entre madre e hija.
- 03-timeline/tim-basico.md: Qué es una timeline, cómo se crea y se llena, y por qué sustituye a los delays. Incluye las opciones de gsap.timeline() y las trampas de from() y set() dentro de ella.
- 03-timeline/tim-control.md: Reproducir, saltar, repetir, cambiar duración y pausar en puntos concretos. addPause, removePause, tweenTo, tweenFromTo y las diferencias con un tween.
- 03-timeline/tim-etiquetas.md: addLabel, removeLabel, labels, currentLabel, nextLabel y previousLabel. Dar nombre a instantes para colocar hijos y navegar sin números mágicos.
- 03-timeline/tim-gestion.md: Añadir, quitar, buscar y desplazar hijos. add, remove, clear, getChildren, getById, getTweensOf, killTweensOf, recent y shiftChildren, con sus desajustes frente a la documentación.
- 03-timeline/tim-herencia.md: defaults e inherit, cómo se sincronizan los cabezales, y qué cambian smoothChildTiming y autoRemoveChildren.
- 03-timeline/tim-posicion.md: Gramática completa de la posición en una timeline (número, +=, -=, <, >, etiquetas, porcentajes), qué referencia usa cada forma y qué métodos no la admiten entera.

## 04-propiedades
- 04-propiedades/css-attr.md: Anima atributos numéricos de HTML y SVG con attr. Cuándo usarlo en lugar de CSS y qué ocurre con unidades, colores y rutas.
- 04-propiedades/css-autoalpha.md: autoAlpha combina opacity y visibility para que un elemento a 0 no reciba eventos. Es la base para evitar parpadeos al cargar.
- 04-propiedades/css-clearprops.md: Quita estilos en línea al terminar un tween para que vuelvan a mandar las clases. Por qué un componente de transform los borra todos y qué pasa en timelines y yoyo.
- 04-propiedades/css-complejas.md: Cómo interpola GSAP cadenas con varios números y colores. Por qué ambos extremos deben tener la misma estructura y cómo preparar el valor inicial.
- 04-propiedades/css-endarray.md: Interpola un array de números hacia otro con easing. Útil para datos de gráficas o buffers. Qué ocurre con longitudes distintas.
- 04-propiedades/css-modifiers.md: Función por propiedad que recibe el valor de cada tick y devuelve el que se aplica. Sirve para envolver, limitar y derivar. Reglas de tipos y de unidades.
- 04-propiedades/css-origin.md: Elegir el punto alrededor del que giran y escalan los elementos, en HTML y SVG. No se interpola, admite profundidad y en SVG evita saltos al cambiar.
- 04-propiedades/css-plugin.md: Qué propiedades CSS anima GSAP, cómo trata nombres, unidades y valores no animables, y las trampas de autoRound, display y height auto.
- 04-propiedades/css-rotacion.md: Sufijos _short, _cw y _ccw para elegir el sentido de giro, y qué unidades acepta realmente rotation.
- 04-propiedades/css-snap.md: snap en vars redondea en cada render a incrementos, listas o radios. Diferencia con gsap.utils.snap y por qué el tween puede no terminar en su destino.
- 04-propiedades/css-transforms.md: Cómo guarda y recompone GSAP las transformaciones, en qué orden fijo, por qué usar x/y/rotation en lugar de transform, y cuándo xPercent. Incluye 3D, force3D y la lectura de CSS.
- 04-propiedades/css-variables.md: Animar variables CSS con GSAP y usar var() como destino. Permite actualizar muchos elementos con un solo valor, y tiene reglas propias para colores y unidades.

## 05-easing
- 05-easing/eas-catalogo.md: Todos los eases del núcleo con su cadena, equivalencias, parámetros y valores de referencia, más los objetos antiguos Back, Elastic, Power o Linear.
- 05-easing/eas-custombounce.md: Crea un ease de rebote configurable y, opcionalmente, un segundo ease sincronizado para aplastar y estirar el objeto.
- 05-easing/eas-customease.md: Crea un ease a partir de un path SVG o de valores cubic-bezier. create, get, setData y getSVGData, con el formato de datos admitido.
- 05-easing/eas-customwiggle.md: Ease que oscila y regresa al punto de partida, para sacudidas, avisos y enjambres. Tipos, amplitudeEase y timingEase, y su sintaxis en cadena.
- 05-easing/eas-easepack.md: Tres eases extra del archivo EasePack, slow para cámara lenta, rough para irregularidades y expoScale para corregir el zoom.
- 05-easing/eas-guia.md: Qué es un ease, cómo se escribe en GSAP, cuál elegir para cada caso, y cómo funcionan easeReverse y yoyoEase al invertir.
- 05-easing/eas-registro.md: gsap.registerEase y gsap.parseEase. Dar nombre a una función de ease, obtener la función de una cadena y evitar los fallos silenciosos.
- 05-easing/eas-stepped.md: steps(n) cuantifica el progreso en saltos. Cuántos tramos resultan realmente y cómo aplicarlo a sprites o a un cronómetro.

## 06-utilidades
- 06-utilidades/utl-cadenas.md: getUnit, splitColor y checkPrefix. Extraer la unidad de un valor, descomponer colores y resolver prefijos, con los límites de cada una.
- 06-utilidades/utl-colecciones.md: toArray, selector, shuffle y distribute. Convertir objetivos en arrays, acotar selectores a un contenedor, barajar y repartir valores como un stagger.
- 06-utilidades/utl-funciones.md: Mapa de gsap.utils con qué devuelve cada función al omitir el último argumento, cómo encadenarlas con pipe y unitize, y el fallo silencioso de pasar un valor vacío.
- 06-utilidades/utl-numeros.md: clamp, mapRange, normalize, interpolate, snap, wrap, wrapYoyo y random, con su forma curried, sus configuraciones y sus casos límite.

## 07-scroll
- 07-scroll/scr-batch.md: Crea una instancia por elemento y agrupa en arrays los callbacks ocurridos casi a la vez. Ideal para revelar rejillas con escalonado sin un bucle de animaciones.
- 07-scroll/scr-estaticos.md: Tabla de los métodos globales de ScrollTrigger con config, defaults, búsqueda de instancias, medición del viewport, activación y métodos obsoletos.
- 07-scroll/scr-horizontal.md: Dos horizontales distintos, horizontal true para scroll real y pin más tween para el simulado, con containerAnimation para disparar animaciones dentro de la pista.
- 07-scroll/scr-instancia.md: Tabla de lectura de una instancia (progress, direction, isActive, start, end) y sus métodos (kill, disable, enable, scroll, getVelocity, next, previous, tweenTo).
- 07-scroll/scr-normalize.md: Intercepta rueda y toque para desplazar desde JavaScript. Evita saltos de pin, oculta menos la barra de direcciones móvil y corrige jitter de iOS, a cambio de ser scroll-jacking.
- 07-scroll/scr-observer-api.md: Todas las opciones de ObserverVars, los callbacks, las propiedades de la instancia y los métodos estáticos de Observer.
- 07-scroll/scr-observer.md: Detecta rueda, toque, puntero y scroll con una sola API, con direcciones, deltas y velocidad. Base de las páginas que cambian de sección sin scroll real.
- 07-scroll/scr-pin.md: Qué hace pin en el DOM (pin-spacer, position fixed, padding), opciones pinSpacing, pinType, pinReparent, anticipatePin, y causas de pines que saltan.
- 07-scroll/scr-refresh.md: Diferencia entre refresh y update, qué dispara un refresco, orden de creación, sort, refreshPriority, invalidateOnRefresh, saveStyles y memoria del scroll.
- 07-scroll/scr-scrollerproxy.md: Sustituye los getters y setters de scroll de un elemento para que ScrollTrigger funcione con librerías de scroll suave o desplazamientos propios.
- 07-scroll/scr-scrollto.md: Anima el scroll de ventana o contenedor hasta un valor, selector o elemento, con desfases, autoKill y relativos. Incluye su relación con scroll-behavior y anclas.
- 07-scroll/scr-scrolltrigger.md: Mapa del plugin. Cómo funciona por dentro, formas de crearlo, tabla completa de ScrollTrigger.Vars y a qué ficha ir para cada problema.
- 07-scroll/scr-scrub.md: Diferencia entre scrub true y numérico, cómo se reparten las duraciones de un timeline, valores iniciales cacheados y por qué ease none es casi obligatorio.
- 07-scroll/scr-smoother-api.md: Referencia de la instancia, scrollTo, offset, scrollTop, paused, smooth, progress, content, wrapper, getVelocity, kill, y las diferencias entre scroll nativo y suavizado.
- 07-scroll/scr-smoother-efectos.md: Parallax con data-speed, retardo con data-lag, valores auto y clamp, método effects(), prefijo y padding, y cómo se reparte el desplazamiento respecto al centro.
- 07-scroll/scr-smoother.md: Qué hace, estructura wrapper y content, cuándo compensa frente al scroll nativo, su límite en móvil y las interacciones con pin y position fixed.
- 07-scroll/scr-snap.md: Formas de snap (incremento, array, función, etiquetas, objeto), opciones de SnapVars, snapDirectional y cuándo un ajuste se cancela o no arranca.
- 07-scroll/scr-start-end.md: Sintaxis de start y end (palabras, porcentajes, relativos, max, clamp, funciones), valores por defecto y fórmula con la que salen los píxeles.
- 07-scroll/scr-toggle.md: Las cuatro transiciones del tramo, acciones sobre la animación, clases, callbacks, once, y cómo evitar solapes con fastScrollEnd y preventOverlaps.

## 08-texto
- 08-texto/txt-scramble.md: Sustituye el texto de un elemento mostrando caracteres aleatorios que se van resolviendo, como un descifrado. Admite conjuntos propios, retardo y clases.
- 08-texto/txt-splittext-api.md: Referencia de SplitText.Vars con valores por defecto y comportamiento real de split(), revert() y kill(), incluida la restauración de ARIA y las animaciones.
- 08-texto/txt-splittext.md: Envuelve líneas, palabras o caracteres en elementos propios para animarlos, con máscaras, ARIA automático y repartido responsive con autoSplit y onSplit.
- 08-texto/txt-text.md: Reemplaza el contenido de un elemento carácter a carácter o palabra a palabra, conservando HTML sencillo y permitiendo rebobinar. Efecto máquina de escribir.

## 09-svg
- 09-svg/svg-drawsvg.md: Revela u oculta el trazo de formas SVG controlando stroke-dasharray y stroke-dashoffset. El valor describe el segmento visible, no un porcentaje de avance.
- 09-svg/svg-guia.md: Qué normaliza GSAP en SVG (transforms, transformOrigin, svgOrigin, smoothOrigin), qué plugin elegir y qué límites del formato conviene conocer antes de animar.
- 09-svg/svg-morphsvg-api.md: El formato RawPath con los tipos de 3.15.1, y convertToPath, getRawPath, stringToRawPath, rawPathToString y normalizeStrings con sus trampas.
- 09-svg/svg-morphsvg.md: Interpola el atributo d de un path hacia otra forma aunque tengan distinto número de puntos. Opciones de calidad, rendimiento y salida a canvas.
- 09-svg/svg-motionpath-api.md: Utilidades de rutas y coordenadas, sin tween. RawPath, posición en ruta, cortes, y conversión entre sistemas de coordenadas con transformaciones anidadas.
- 09-svg/svg-motionpath.md: Mueve cualquier objetivo por un path SVG, datos de ruta o puntos, con autoRotate, align y start/end. También suaviza transiciones entre valores de otras propiedades.
- 09-svg/svg-motionpathhelper.md: Herramienta de desarrollo para editar visualmente una ruta de motionPath y copiar el resultado. También hace editable cualquier path con editPath().

## 10-interaccion
- 10-interaccion/int-draggable-api.md: Referencia completa de Draggable.Vars, propiedades de instancia, métodos, eventos y formas de bounds, con el orden real de callbacks.
- 10-interaccion/int-draggable.md: Hace arrastrable cualquier elemento con ratón o táctil, con límites, ajuste, ejes bloqueados, detección de solape, autoscroll e inercia.
- 10-interaccion/int-flip-api.md: Flip.fit, to, makeAbsolute, killFlipsOf, isFlipping, getByTarget y convertCoordinates, más los métodos de FlipState y los datos de ElementState.
- 10-interaccion/int-flip-batch.md: Ordena getState, cambios y animaciones de varias partes independientes para que no se contaminen. Pensado para vistas formadas por partes que se actualizan por separado.
- 10-interaccion/int-flip.md: Captura posición y tamaño, deja que cambies el DOM como quieras y anima desde el estado anterior al nuevo, incluso con reparenting, flex, grid y scrollTrigger.
- 10-interaccion/int-inertia.md: Lleva cualquier propiedad numérica a reposo desde una velocidad inicial, con duración automática, límites y puntos de ajuste. Es lo que da el lanzamiento a Draggable.
- 10-interaccion/int-velocitytracker.md: Rastrea la velocidad de cualquier propiedad numérica en cada tick. Base de inertia con velocity auto, y accesible desde InertiaPlugin sin importar nada más.

## 11-especializados
- 11-especializados/esp-cssrule.md: Anima una regla CSS, incluidos ::before y ::after. Obsoleto en favor de variables CSS, pero sigue en el paquete.
- 11-especializados/esp-easel.md: Anima tint, exposure, brightness, saturation, contrast, hue y colorize en objetos de EaselJS, además de frame en MovieClip, mediante easel.
- 11-especializados/esp-gsdevtools.md: Barra de control visual para reproducir, cortar y ralentizar animaciones, con selector por id, atajos de teclado y persistencia entre recargas.
- 11-especializados/esp-physics2d.md: Mueve x e y con velocidad, ángulo, gravedad, aceleración y fricción. Sin colisiones, pero reversible y exacto. Ideal para partículas y proyectiles.
- 11-especializados/esp-physicsprops.md: Anima propiedades numéricas con velocidad, aceleración y fricción propias, sin valor final definido. Cada propiedad lleva sus parámetros.
- 11-especializados/esp-pixi.md: Simplifica animar PixiJS. Propiedades planas, rotación en grados, colores como en CSS, y filtros de color y desenfoque sin crearlos a mano.

## 12-frameworks
- 12-frameworks/fra-agnostico.md: Entrar, cambiar y salir sobre lo que se anima (nodo, objeto o escena): adaptador montar(raiz), tabla de ganchos por tecnología, orden de ejecución, servidor y entornos sin window.
- 12-frameworks/fra-angular.md: Entrar, cambiar y salir en Angular: afterNextRender, DestroyRef, effect, animate.leave, Flip con afterNextRender y rutas, probados en una app real de Angular 22.
- 12-frameworks/fra-canvas-webgl.md: Aplicar entrar, cambiar y salir a una escena sin DOM: un render por tick, bucle propio, color, uniforms, resize, pausa, Observer y Draggable, y liberar recursos.
- 12-frameworks/fra-nextjs.md: Qué se ejecuta en servidor y qué no, dónde registrar plugins y por qué un tween en el módulo rompe la build. Comprobado con una build real de Next 16.4.5.
- 12-frameworks/fra-react-avanzado.md: Compartir timelines entre componentes, efectos reutilizables, animaciones de salida, FLIP con listas y cierres obsoletos en callbacks de GSAP.
- 12-frameworks/fra-react-usegsap.md: El hook de @gsap/react, sus opciones (scope, dependencies, revertOnUpdate), contextSafe y su comportamiento real leído del código 2.1.2 y probado con React 19.
- 12-frameworks/fra-svelte.md: Entrar, cambiar y salir en Svelte 5 y SvelteKit: onMount, $effect, transiciones gobernadas por GSAP, Flip con tick y onNavigate, probados en app real.
- 12-frameworks/fra-typescript.md: Qué tipos usar (gsap.TweenVars, gsap.core.Timeline, ScrollTrigger.Vars), cómo resuelve TS los plugins según moduleResolution y qué rompió el renombrado de archivos de 3.15.0.
- 12-frameworks/fra-vanilla.md: Aplicar el contrato en páginas sin framework: PHP, plantillas, HTML estático, carga por CDN y transiciones de página con Barba o Swup.
- 12-frameworks/fra-vue-nuxt.md: Entrar, cambiar y salir en Vue: onMounted, watch post, Transition con done, Flip con nextTick y rutas, probado en app real; plugin de cliente en Nuxt 4.
- 12-frameworks/fra-webcomponents.md: Aplicar el contrato en Custom Elements, cuando connectedCallback corre varias veces o sin hijos, Shadow DOM como ámbito y los ganchos de Lit.
- 12-frameworks/fra-webflow.md: Integración de GSAP desde los ajustes del sitio, dónde poner código propio, registro de plugins y cómo convive con las Interactions visuales.
- 12-frameworks/fra-wordpress.md: Encolar GSAP y plugins con dependencias en functions.php, tema hijo, espera al DOM y a load, y correcciones al ejemplo oficial.

## 13-calidad
- 13-calidad/cal-accesibilidad.md: prefers-reduced-motion con gsap.matchMedia, interruptor propio con matchMediaRefresh, cuándo reducir o quitar, y SplitText con lectores de pantalla.
- 13-calidad/cal-conflictos.md: Qué pasa cuando dos tweens animan lo mismo, cómo elegir entre false, true y auto, y cuándo actúa cada modo.
- 13-calidad/cal-depuracion.md: Método en cinco pasos, avisos de consola y su causa, inspección de tweens activos, ralentizar todo, marcadores y GSDevTools.
- 13-calidad/cal-errores-comunes.md: Síntomas reconocibles con su causa y corrección probada, from() que se queda a medias, saltos en timelines, valores duplicados, transiciones CSS y bucles.
- 13-calidad/cal-fouc.md: Ocultar en CSS y revelar con autoAlpha, la trampa de from() con visibility hidden, noscript y SSR.
- 13-calidad/cal-rendimiento.md: Qué cuesta de verdad al animar: propiedades, número de elementos, quickTo, force3D, lazy y ticker. Separa datos medidos de criterio práctico.
- 13-calidad/cal-st-errores.md: Síntomas de scroll con causa y corrección probada, ScrollTrigger anidado, valores viejos, orden de creación, refresh, saltos al cargar y navegación sin recarga.

## 14-recetas
- 14-recetas/rec-acordeon.md: Abre y cierra paneles animando hasta height auto, con aria-expanded, hidden, interrupción sin saltos y altura libre al terminar.
- 14-recetas/rec-boton-magnetico.md: Atrae un botón hacia el puntero con quickTo y lo devuelve al salir, midiendo una referencia estable para evitar temblores.
- 14-recetas/rec-contador.md: Cuenta hasta una cifra con un objeto proxy y formato local con Intl.NumberFormat, al entrar en el viewport y sin perder el texto.
- 14-recetas/rec-helpers.md: Las 28 helper functions de gsap.com, agrupadas por problema, con cuándo usarlas, qué requieren y qué alternativa nativa existe.
- 14-recetas/rec-marquee.md: Cinta de logos o texto en bucle continuo, con clones accesibles, pausa, remedición al redimensionar y versión estática reducida.
- 14-recetas/rec-parallax.md: Desplaza imágenes o fondos a otra velocidad que el scroll, con disparador en el padre y sin saltos al cargar.
- 14-recetas/rec-pin-horizontal.md: Fija una sección y convierte el scroll vertical en movimiento horizontal, responsive, con scroll nativo como alternativa reducida.
- 14-recetas/rec-revelar-scroll.md: Aparición por lotes con ScrollTrigger.batch, sin parpadeo inicial, con movimiento reducido y limpieza completa de estilos.
- 14-recetas/rec-salida.md: Retrasar la retirada hasta que la animación termine, con promesa que siempre resuelve, salida interrumpida, reapertura, orden frente a revert y movimiento reducido.
- 14-recetas/rec-secuencia-imagenes.md: Reproduce fotogramas en canvas según el scroll, con objeto proxy, snap al entero, recorte cover y fotograma fijo en modo reducido.
- 14-recetas/rec-seguidor-cursor.md: Elemento decorativo que sigue al puntero con retardo, sin crear un tween por evento y sin viajar desde la esquina al aparecer.
- 14-recetas/rec-titular-texto.md: Divide y anima un titular con máscara, que se recompone al cambiar el ancho o las fuentes y no daña a lectores de pantalla.
- 14-recetas/rec-transicion-flip.md: Anima cambios de disposición de flex o grid guardando el estado, aplicando el cambio y dejando a Flip animar la diferencia.
- 14-recetas/rec-transicion-paginas.md: Navegación sin recarga con salida, sustitución, historial, foco y entrada, sin fugas de ScrollTrigger entre páginas.

## 15-versiones
- 15-versiones/ver-historial.md: Cambios reales leídos en los diffs de código y tipos, separados en API nueva, corrección e interno, y a quién afecta el renombrado de tipos de 3.15.0.
- 15-versiones/ver-migracion-v3.md: Equivalencias de TweenMax, duración, eases, staggers, overwrite y plugins, qué sigue funcionando en 3.15.1 y qué ya no compila en TypeScript.
- 15-versiones/ver-repo-privado.md: GSAP es gratuito y público en npm. Cómo retirar .npmrc, token y paquetes de Club como @gsap/business, con npm y Yarn, y limpiar cachés.

## 16-tareas
- 16-tareas/tar-rutas.md: Punto de entrada del sistema. Lleva de lo que quieres hacer, o de lo que falla, a la ficha exacta y a la plantilla reutilizable.
