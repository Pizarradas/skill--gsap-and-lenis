# Lenis 1.3.27: contexto compacto

Índice para agentes: abre la ficha completa solo cuando la necesites.

## 01-fundamentos
- 01-fundamentos/fun-css.md: Qué hace cada regla de lenis.css, cuál es imprescindible y qué falla sin ella. autoToggle no funciona sin la hoja, y stop() deja de bloquear el teclado.
- 01-fundamentos/fun-cuando-usarlo.md: Criterios para decidir: sincronizar escenas y efectos justifica Lenis; una web de contenido o una tabla de datos rara vez. Costes y alternativas nativas.
- 01-fundamentos/fun-instalacion.md: Mismo rango de versión por empaquetador, script clásico y módulos con import map. Rutas exactas probadas en Chrome, y trampas de CSS y Snap.
- 01-fundamentos/fun-licencia.md: Lenis y sus paquetes se distribuyen con licencia MIT: uso comercial libre, conservando el aviso de copyright en las copias.
- 01-fundamentos/fun-modelo.md: Flujo completo: evento, VirtualScroll, filtros, targetScroll, Animate en raf, escritura en el scroll nativo y evento scroll. Por qué no usa transform.
- 01-fundamentos/fun-que-es.md: Biblioteca de scroll suave que anima el scroll nativo del navegador. Nació para sincronizar WebGL y DOM; el suavizado fue una consecuencia.

## 02-opciones
- 02-opciones/opc-automatico.md: autoRaf, autoResize, anchors, autoToggle, allowNestedScroll, naiveDimensions, stopInertiaOnNavigate y respectReducedMotion, y la línea única sin compilación.
- 02-opciones/opc-contenedores.md: Qué elemento se desplaza, cuál se mide y cuál escucha gestos. Diferencias entre ventana y contenedor, y errores de creación.
- 02-opciones/opc-filtros.md: Orden exacto de los filtros de Lenis, qué consecuencias tiene cortar en cada uno, y cómo usar prevent, virtualScroll, allowNestedScroll y atributos data-lenis-*.
- 02-opciones/opc-gestos.md: Cómo se elige el delta según orientation y gestureOrientation, qué hace smoothWheel, por qué un gesto lateral queda nativo y cuándo actúan los multiplicadores.
- 02-opciones/opc-referencia.md: Las 26 opciones de Lenis con valor por defecto contrastado con el constructor, cuándo se leen y qué ficha las explica.
- 02-opciones/opc-suavizado.md: Si hay duration, gana a lerp en todas las rutas: rueda, scrollTo y Snap. Qué calcula cada modo, cómo forzar lerp y por qué lerp no es una fracción por fotograma.
- 02-opciones/opc-tactil.md: Las dos rutas de toque, inercia de syncTouch, parada al tocar y selección en iOS. Separa lo ejecutado con toque() de lo que exige un dispositivo real.

## 03-api
- 03-api/api-eventos.md: Eventos scroll y virtual-scroll, cuándo se emiten y datos que reciben, además del scrollend propio, que no llega a document.
- 03-api/api-instancia.md: Constructor y todas las propiedades de la instancia: posiciones, velocidad, dirección, estado, globales. Corrige direction, time e isStopped del README.
- 03-api/api-metodos.md: raf, on, off, resize, stop, start y destroy: qué hace cada uno de verdad, qué efectos laterales tiene y qué deja sin limpiar.
- 03-api/api-scrollto.md: Tabla completa de objetivos y opciones de scrollTo, con lock, force, programmatic, immediate y userData probados, y qué callbacks se ejecutan en cada caso.

## 04-comportamiento
- 04-comportamiento/com-anclas.md: Sin anchors, un enlace #id salta de forma nativa y durante una animación se pierde. Con anchors se anima, conserva la URL y admite opciones de scrollTo.
- 04-comportamiento/com-anidado.md: Áreas con scroll propio dentro de una página con Lenis: allowNestedScroll, data-lenis-prevent, prevent o una segunda instancia, y qué hace overscroll.
- 04-comportamiento/com-clases.md: Clases que Lenis pone en la raíz según su estado, cuándo cambian y por qué borra cualquier otra clase tuya que empiece por lenis-.
- 04-comportamiento/com-dimensiones.md: limit se guarda en caché con 250 ms de retardo: consecuencias tras cambiar contenido, y las salidas: resize(), autoResize y naiveDimensions.
- 04-comportamiento/com-horizontal.md: orientation horizontal: maquetación necesaria, conversión de la rueda vertical, medidas en X y posición de objetivos, en ventana y en contenedor.
- 04-comportamiento/com-infinito.md: infinite elimina el límite y envuelve la posición con módulo. Qué parte hace Lenis, qué contenido hay que duplicar y cómo cambian scroll, progress y scrollTo.
- 04-comportamiento/com-raf.md: Lenis no se mueve solo: necesita autoRaf o llamadas a raf(time) en milisegundos. Independencia de fotogramas, pausas, y qué pasa de verdad al mezclar relojes.
- 04-comportamiento/com-restauracion.md: Lenis no toca history.scrollRestoration. Qué pasa al recargar, cómo fijar la posición al cambiar de vista sin recarga y el estado que puede quedar colgado.
- 04-comportamiento/com-sticky-fixed.md: sticky y fixed funcionan sin adaptación porque Lenis escribe el scroll real. Excepciones: ancestros, contenedores y el efecto de Snap en sticky.
- 04-comportamiento/com-stop-start.md: Parar frente a bloquear, qué impide cada uno, papel de overflow y lenis.css, y el funcionamiento asíncrono de autoToggle.

## 05-snap
- 05-snap/snp-api.md: add, addElement, addElements, next, previous, goTo, start, stop, resize y destroy. Orden de puntos, currentSnapIndex y fallos de destroy.
- 05-snap/snp-elementos.md: addElement mide el elemento y aplica align. Incluye fallos reales de la versión: start en horizontal, contenedores y ancestros sticky que quedan rotos.
- 05-snap/snp-snap.md: Clase Snap: añade encaje a Lenis tras un gesto. Tipos mandatory, proximity y lock, distanceThreshold, debounce y cómo se calcula el destino.

## 06-integracion
- 06-integracion/int-angular.md: Sin paquete oficial: adaptador entrar con afterNextRender y DestroyRef, directiva para contenedores, NavigationEnd, zone.js y detección de cambios por fotograma.
- 06-integracion/int-canvas-webgl.md: Patrón motor.alDibujar para cualquier motor: un bucle para Lenis y el dibujo, leer scroll, alinear con el DOM en ventana y contenedor, y liberar. Three.js como caso.
- 06-integracion/int-contrato.md: Entrar, cambiar y salir sobre ventana, contenedor o escena: las cinco columnas, bucle único, adaptador entrar y salir, compartir la instancia y entornos sin window.
- 06-integracion/int-gsap.md: Un solo reloj con gsap.ticker, unidad de tiempo de raf, por qué ScrollTrigger.update y qué hace realmente lagSmoothing(0), medido con rueda real y scrub.
- 06-integracion/int-navegacion.md: Por qué un cambio de vista deja inercia y límites viejos, la función colocar (cortar, medir y colocar) y qué orden falla, probado en ventana y contenedor.
- 06-integracion/int-nextjs.md: App Router: ReactLenis ya es de cliente, funciones en options desde el servidor, reinicio de scroll con usePathname, y por qué Link no basta en plena inercia.
- 06-integracion/int-react.md: Paquete oficial lenis/react: ReactLenis, useLenis, LenisRef, cambio de ruta, opciones que no recrean, GSAP aparte y un bucle del README que no funciona.
- 06-integracion/int-svelte.md: Sin paquete oficial: el adaptador entrar con onMount, {@attach} para un contenedor, afterNavigate en SvelteKit para la ruta y lo que cambia en SvelteKit 3.
- 06-integracion/int-typescript.md: Qué exporta cada entrada, qué resolución de módulos funciona, LenisRef y LenisExposed, por qué LenisExposed no se puede importar y los globales de window.
- 06-integracion/int-vanilla.md: Las tres vías de carga, cuándo está listo el DOM, páginas que se descartan, instancia única, navegación parcial desde servidor y bfcache.
- 06-integracion/int-vue-nuxt.md: Paquetes lenis/vue y lenis/nuxt: VueLenis, plugin, useLenis, LenisExposed, opciones en línea que recrean la instancia, cambio de ruta, GSAP aparte y Vue 3.5 obligatorio.
- 06-integracion/int-webcomponents.md: Custom Elements como contrato nativo: connectedCallback sin hijos, mover el nodo, Shadow DOM y scrollTo, y los ganchos de Lit.
- 06-integracion/int-webflow.md: Fragmento sin compilación del README en el código personalizado, qué resuelve cada opción, contrastado una a una. Webflow no se ejecutó; el fragmento, sí.
- 06-integracion/int-wordpress.md: Encolar Lenis y su CSS, el código en línea cancela defer, editor y personalizador, y constructores. Basado en documentación: WordPress no se ejecutó.

## 07-calidad
- 07-calidad/cal-accesibilidad.md: Qué hace respectReducedMotion de verdad, medido con prefers-reduced-motion real; teclado y Tab con rueda real; foco perdido en plena inercia y al usar stop().
- 07-calidad/cal-conflictos.md: scroll-behavior, CSS scroll-snap, overflow en body, scroll nativo en plena animación, y ScrollSmoother, normalizeScroll y ScrollToPlugin de GSAP, medido.
- 07-calidad/cal-depuracion.md: Orden de inspección: clases de la raíz, estado de la instancia, relojes por fotograma, oyentes, medidas y eventos, con utilidades que se pueden pegar en consola.
- 07-calidad/cal-errores.md: Síntoma, causa y solución probados: la rueda no mueve nada, scroll lento, NaN con la página clavada, sin desplazarse, límite viejo, scrollTo mudo, modales y clases perdidas.
- 07-calidad/cal-limitaciones.md: Las seis limitaciones del README frente al código y a pruebas reales: cuáles se confirman, cuáles matizar y cuáles no se pudieron ejecutar.
- 07-calidad/cal-rendimiento.md: Coste real de raf, resize, oyente wheel no pasivo y tamaño, medido en una máquina concreta. Qué consume de verdad y qué no, y cuándo el coste no es de Lenis.

## 08-recetas
- 08-recetas/rec-barra-progreso.md: Una barra que refleja cuánto se ha recorrido, ligada a lenis.progress, sin reflujo y al día cuando cambia la longitud del contenido.
- 08-recetas/rec-canvas-sync.md: Dibuja un canvas con el valor exacto de Lenis y en su mismo paso, con bucle externo o por eventos, sin gastar en reposo.
- 08-recetas/rec-horizontal.md: Dos soluciones de scroll horizontal, orientation para una página o contenedor y sticky más transform para una sección de una página vertical.
- 08-recetas/rec-menu-anclas.md: Enlaces internos con scroll suave, foco accesible, URL al día y sección activa marcada, también dentro de Shadow DOM.
- 08-recetas/rec-modal.md: Detiene el scroll de fondo con un dialog abierto y deja desplazarse su contenido, con rueda y toque, incluso con varios modales.
- 08-recetas/rec-nav-direccion.md: Oculta la cabecera al bajar y la muestra al subir, sin parpadeo, con foco de teclado y scroll nativo.
- 08-recetas/rec-navegacion.md: Coloca el scroll al cambiar de vista, arriba, en el hash o en la posición guardada, cortando inercia y con el límite actualizado.
- 08-recetas/rec-parallax.md: Elementos que se mueven a otra velocidad que el scroll, en el mismo paso que Lenis, midiendo una sola vez.
- 08-recetas/rec-scroll-to-top.md: Botón que aparece tras un umbral, vuelve arriba con Lenis y deja el foco en un lugar útil.
- 08-recetas/rec-secciones-snap.md: Ajuste a secciones con lenis/snap, con limpieza segura, lista que cambia y soluciones para eje horizontal y contenedores desplazados.

## 09-versiones
- 09-versiones/ver-historial.md: Qué cambió de verdad entre 1.0.43 y 1.3.27, separado en API, conducta, correcciones e interno, con cambios que RELEASES.md no menciona.
- 09-versiones/ver-migracion.md: Paquetes renombrados, opciones retiradas que se ignoran sin avisar, cambios de valores por defecto y pasos para actualizar a 1.3.27.
- 09-versiones/ver-v2.md: V2-ROADMAP.md es un plan. En npm solo hay prereleases 2.0.0-dev con la etiqueta dev, y latest sigue en 1.3.27. No migres producción.

## 10-tareas
- 10-tareas/tar-rutas.md: Punto de entrada del sistema. Lleva de lo que quieres hacer, o de lo que falla, a la ficha exacta y a la plantilla reutilizable.
