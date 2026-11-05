---
id: orq-por-tarea
titulo: De la tarea al perfil y a las fichas
capa: 01-decidir
tipo: decision
perfiles: [ninguno, gsap, gsap-smoother, lenis, gsap+lenis]
resumen: Cada necesidad habitual, cómo se resuelve con lo mínimo, si exige GSAP, qué pide al scroll y qué fichas leer. Tabla generada desde datos/necesidades.json.
relacionadas: [orq-que-usar, orq-perfiles, orq-propiedad]
fuentes:
  - gsap:tar-rutas
  - lenis:tar-rutas
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# De la tarea al perfil y a las fichas

Marca lo que pide el encargo y pásalo a `decidir.py`, que da el perfil y filtra las lecturas que no apliquen. El nombre de cada fila es el que acepta la herramienta. Combina varias: el perfil sale del conjunto, no de una fila.

La columna "Scroll" significa: **indiferente**, no influye; **pide suavizado**; **veta suavizado**; **exige Lenis**; **prefiere ScrollSmoother**; **descarta ScrollSmoother**, que no pide suavizado por sí solo.

<!-- GENERADO: necesidades -->
### Tipo de proyecto

| Necesidad | Qué es | Con lo mínimo | GSAP | Scroll | Lee |
|---|---|---|---|---|---|
| `sitio-contenido` | Blog, documentación, comercio o aplicación con datos | Scroll del navegador | No | veta suavizado | `lenis:fun-cuando-usarlo` |
| `formulario-largo` | Formulario largo o flujo de trabajo | Scroll del navegador | No | veta suavizado | `lenis:fun-cuando-usarlo` |
| `lista-virtual` | La página es una tabla enorme o una lista virtualizada | Scroll del navegador | No | veta suavizado | `lenis:fun-cuando-usarlo`, `lenis:cal-rendimiento` |
| `zona-scroll-propio` | Una zona interior conserva su scroll nativo: tabla, mapa o panel | Nativo; con Lenis, `data-lenis-prevent` | No | indiferente | `lenis:com-anidado`, `cmb-gestos` |

### Resolver sin biblioteca

| Necesidad | Qué es | Con lo mínimo | GSAP | Scroll | Lee |
|---|---|---|---|---|---|
| `transicion-simple` | `hover`, foco o un cambio de estado | CSS `transition` | No | indiferente | — |
| `revelar-simple` | Aparecer al entrar en pantalla, sin secuencia | `IntersectionObserver` y CSS | No | indiferente | `lenis:fun-cuando-usarlo` |
| `ir-a-punto` | Ir suavemente a un punto o un ancla | `scrollIntoView`; con biblioteca, `mov.irA` | No | indiferente | `orq-propiedad`, `cmb-scroll-programatico`, `cmb-anclas` |
| `encajar-secciones` | Secciones que encajan al desplazar | CSS `scroll-snap`; con Lenis, `lenis/snap` | No | indiferente | `orq-propiedad`, `cmb-snap`, `gsap:scr-snap`, `lenis:snp-snap` |
| `progreso-lectura` | Barra de progreso de lectura | `animation-timeline: scroll()` o evento `scroll` | No | indiferente | `lenis:rec-barra-progreso` |
| `modal` | Modal con el fondo bloqueado | `<dialog>`; con biblioteca, `mov.bloquear` | No | indiferente | `orq-propiedad`, `cmb-modal`, `lenis:rec-modal` |

### Animación que exige GSAP

| Necesidad | Qué es | Con lo mínimo | GSAP | Scroll | Lee |
|---|---|---|---|---|---|
| `secuencia` | Secuencia coordinada de varios elementos | `gsap.timeline` | Sí | indiferente | `gsap:tim-basico`, `gsap:tim-posicion` |
| `scrub` | Animación ligada a la posición del scroll | ScrollTrigger `scrub` | Sí | indiferente | `gsap:scr-scrub`, `cmb-scrub` |
| `pin` | Fijar una sección mientras se avanza | ScrollTrigger `pin` | Sí | indiferente | `gsap:scr-pin`, `cmb-pin` |
| `pista-horizontal` | Tramo horizontal dentro de una página vertical | Pista con `pin` y `containerAnimation` | Sí | indiferente | `gsap:rec-pin-horizontal`, `gsap:scr-horizontal`, `cmb-horizontal` |
| `parallax` | Parallax | `scrub`; en `gsap-smoother`, `data-speed` | Sí | indiferente | `gsap:rec-parallax`, `cmb-scrub` |
| `cambio-layout` | Animar un cambio de disposición | Flip | Sí | indiferente | `gsap:int-flip`, `cmb-flip-split` |
| `texto` | Animar texto por letras, palabras o líneas | SplitText | Sí | indiferente | `gsap:txt-splittext`, `cmb-flip-split` |
| `svg` | Morfismo, trazado o recorrido SVG | MorphSVG, DrawSVG, MotionPath | Sí | indiferente | `gsap:svg-guia` |
| `arrastre` | Arrastrar, con o sin inercia | Draggable e Inertia | Sí | indiferente | `gsap:int-draggable`, `cmb-gestos` |
| `paginar-gestos` | Pasar de sección a sección por gesto | Observer | Sí | indiferente | `gsap:scr-observer`, `cmb-observer` |
| `transicion-vistas` | Transición animada entre vistas | Timeline y `mov.navegar` | Sí | indiferente | `orq-navegacion`, `gsap:rec-transicion-paginas` |

### Scroll que exige suavizado

| Necesidad | Qué es | Con lo mínimo | GSAP | Scroll | Lee |
|---|---|---|---|---|---|
| `scroll-suave` | El encargo pide scroll suave en toda la página | Lenis, salvo preferencia por ScrollSmoother | No | pide suavizado | `orq-perfiles`, `cmb-smoother` |
| `canvas-dom` | Escena `canvas` o WebGL alineada con el DOM | Una posición única; con GSAP, `gsap.ticker` manda | No | pide suavizado | `lenis:int-canvas-webgl`, `lenis:rec-canvas-sync`, `gsap:fra-canvas-webgl`, `cmb-reloj` |
| `suave-contenedor` | Suavizar el scroll de un contenedor | Lenis con `wrapper` y `content` | No | exige Lenis | `lenis:opc-contenedores`, `cmb-contenedor` |
| `eje-horizontal` | Toda la página se desplaza en horizontal | Lenis con `orientation` | No | exige Lenis | `lenis:com-horizontal`, `cmb-horizontal` |
| `infinito` | Scroll infinito en bucle | Lenis con `infinite` | No | exige Lenis | `lenis:com-infinito`, `cmb-infinito` |

### Inclina hacia ScrollSmoother

| Necesidad | Qué es | Con lo mínimo | GSAP | Scroll | Lee |
|---|---|---|---|---|---|
| `teclado-barra-suave` | Teclado y barra deben suavizarse como la rueda | ScrollSmoother, si el proyecto ya usa GSAP | No | prefiere ScrollSmoother | `cmb-smoother` |
| `efectos-data` | Efectos declarativos `data-speed` y `data-lag` | ScrollSmoother `effects`; si queda descartado, `scrub` | Sí | pide ScrollSmoother si es posible, prefiere ScrollSmoother | `gsap:scr-smoother-efectos`, `cmb-smoother` |
| `terceros-escriben` | Código ajeno escribe el scroll sin coordinarse | Con suavizado, ScrollSmoother tolera esas escrituras | No | prefiere ScrollSmoother | `cmb-smoother`, `cmb-scroll-programatico` |

### Descarta ScrollSmoother

| Necesidad | Qué es | Con lo mínimo | GSAP | Scroll | Lee |
|---|---|---|---|---|---|
| `sticky-fixed` | `sticky` o `fixed` dentro del contenido que no se pueden sacar | Funcionan con Lenis y con nativo | No | descarta ScrollSmoother | `lenis:com-sticky-fixed`, `cmb-smoother` |
| `marcado-fijo` | No se puede envolver el marcado | Lenis no pide marcado | No | descarta ScrollSmoother | `cmb-smoother` |
| `pagina-pesada` | Página pesada: sombras, filtros, muchas capas | Mide en tu página: traslada una capa entera | No | descarta ScrollSmoother | `cmb-smoother`, `lenis:cal-rendimiento` |
| `timeline-css` | Se usa `animation-timeline: scroll()` | ScrollSmoother la adelanta al contenido | No | descarta ScrollSmoother | `cmb-smoother` |

### Lo que el proyecto ya tiene

| Necesidad | Qué es | Con lo mínimo | GSAP | Scroll | Lee |
|---|---|---|---|---|---|
| `ya-gsap` | El proyecto ya usa GSAP | Se mantiene | Sí | indiferente | — |
| `ya-lenis` | El proyecto ya usa Lenis | Se mantiene | No | exige Lenis | — |
| `ya-smoother` | El proyecto ya usa ScrollSmoother | Se mantiene | Sí | exige ScrollSmoother | — |
<!-- FIN GENERADO -->

## Ejemplos

| Encargo | Necesidades | Perfil |
|---|---|---|
| Blog con titulares que aparecen | `sitio-contenido revelar-simple` | `ninguno` |
| Web corporativa con una sección fijada y un contador | `pin secuencia` | `gsap` |
| Portada de marca, sin más animación, con scroll cuidado | `scroll-suave` | `lenis` |
| Portfolio con WebGL y titulares partidos | `canvas-dom texto` | `gsap+lenis` |
| Portada con `pin` que además pide scroll suave | `scroll-suave pin` | `gsap+lenis` |
| Campaña con `data-speed`, sin `sticky` | `efectos-data` | `gsap-smoother` |
| Tienda que pide scroll suave | `sitio-contenido scroll-suave` | `ninguno`, con aviso |
