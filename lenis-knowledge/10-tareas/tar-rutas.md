---
id: tar-rutas
titulo: Rutas por intención, síntoma, decisión y tecnología
capa: 10-tareas
tipo: referencia
ambito: transversal
resumen: Punto de entrada del sistema. Lleva de lo que quieres hacer, o de lo que falla, a la ficha exacta y a la plantilla reutilizable.
relacionadas: [fun-que-es, int-contrato, cal-errores]
etiquetas: [indice, diagnostico, decision]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Rutas

Busca lo que quieres hacer o lo que falla. Todo vale para cualquier tecnología salvo la última sección, que dice dónde conectarlo. Las decisiones de esta página son criterio del sistema `[P]`; los hechos están en cada ficha.

## Quiero hacer

| Objetivo | Ficha | Plantilla |
|---|---|---|
| Decidir si necesito Lenis | [cuándo usarlo](../01-fundamentos/fun-cuando-usarlo.md) | |
| Cargar Lenis, con o sin empaquetador | [instalación](../01-fundamentos/fun-instalacion.md), [CSS](../01-fundamentos/fun-css.md) | |
| Arrancar con limpieza correcta | [contrato](../06-integracion/int-contrato.md), [raf](../04-comportamiento/com-raf.md) | `iniciarScroll` |
| Ajustar la sensación del scroll | [suavizado](../02-opciones/opc-suavizado.md), [gestos](../02-opciones/opc-gestos.md) | |
| Ir a una posición o sección | [scrollTo](../03-api/api-scrollto.md) | |
| Enlaces de menú a secciones | [anclas](../04-comportamiento/com-anclas.md), [receta](../08-recetas/rec-menu-anclas.md) | `menuAnclas` |
| Volver arriba | [receta](../08-recetas/rec-scroll-to-top.md) | `botonArriba` |
| Barra de progreso | [receta](../08-recetas/rec-barra-progreso.md) | `barraProgreso` |
| Ocultar la cabecera al bajar | [receta](../08-recetas/rec-nav-direccion.md) | `navDireccion` |
| Parallax | [receta](../08-recetas/rec-parallax.md) | `parallax` |
| Bloquear el fondo con un modal, en ventana o contenedor | [parar](../04-comportamiento/com-stop-start.md), [receta](../08-recetas/rec-modal.md) | `bloqueoModal` |
| Área con scroll propio dentro de la página | [anidado](../04-comportamiento/com-anidado.md), [filtros](../02-opciones/opc-filtros.md) | |
| Lenis en un contenedor, no en la ventana | [contenedores](../02-opciones/opc-contenedores.md), [contrato](../06-integracion/int-contrato.md) | Todas: pasa `lenis` con `wrapper` |
| Scroll horizontal | [horizontal](../04-comportamiento/com-horizontal.md), [receta](../08-recetas/rec-horizontal.md) | `scrollHorizontal` |
| Scroll infinito | [infinito](../04-comportamiento/com-infinito.md) | |
| Encajar en secciones | [Snap](../05-snap/snp-snap.md), [receta](../08-recetas/rec-secciones-snap.md) | `seccionesSnap` |
| Sincronizar canvas 2D, WebGL o un motor | [escenas](../06-integracion/int-canvas-webgl.md), [receta](../08-recetas/rec-canvas-sync.md) | `sincronizarCanvas`, con su opción `contexto` |
| Usarlo junto con GSAP | [GSAP](../06-integracion/int-gsap.md) | |
| Cambiar de vista sin recargar | [navegación](../06-integracion/int-navegacion.md), [receta](../08-recetas/rec-navegacion.md) | `navegacionScroll` |
| Personalizar la entrada | [filtros](../02-opciones/opc-filtros.md), [eventos](../03-api/api-eventos.md) | |
| Soporte táctil | [táctil](../02-opciones/opc-tactil.md) | |
| Hacerlo accesible | [accesibilidad](../07-calidad/cal-accesibilidad.md) | |

## Algo falla

| Síntoma | Empieza por |
|---|---|
| La rueda no mueve nada | [errores](../07-calidad/cal-errores.md), [raf](../04-comportamiento/com-raf.md) |
| El scroll va muy rápido o muy lento | [raf](../04-comportamiento/com-raf.md), [errores](../07-calidad/cal-errores.md) |
| `lerp` no tiene efecto | [suavizado](../02-opciones/opc-suavizado.md) |
| Valores `NaN` | [raf](../04-comportamiento/com-raf.md) |
| No llega al final tras cambiar el contenido | [dimensiones](../04-comportamiento/com-dimensiones.md) |
| No se detiene con `stop()` o el teclado sigue moviendo | [parar](../04-comportamiento/com-stop-start.md), [CSS](../01-fundamentos/fun-css.md) |
| Un área interna no se desplaza | [anidado](../04-comportamiento/com-anidado.md) |
| Un elemento `fixed` o `sticky` tiembla | [sticky y fixed](../04-comportamiento/com-sticky-fixed.md), [conflictos](../07-calidad/cal-conflictos.md) |
| Saltos con ScrollTrigger | [GSAP](../06-integracion/int-gsap.md) |
| Escena desincronizada del scroll | [escenas](../06-integracion/int-canvas-webgl.md) |
| El cambio de vista no vuelve arriba | [navegación](../06-integracion/int-navegacion.md), [restauración](../04-comportamiento/com-restauracion.md) |
| Se acumulan instancias o bucles | [contrato](../06-integracion/int-contrato.md), [depuración](../07-calidad/cal-depuracion.md) |
| `lenis.css` desaparece en producción | [instalación](../01-fundamentos/fun-instalacion.md) |
| `Lenis is not defined`, `Unexpected token 'export'` o `Failed to resolve module specifier` | [instalación](../01-fundamentos/fun-instalacion.md) |
| `Cannot use import statement outside a module` | Cargaste una plantilla como `<script>` clásico: usa `plantillas/globales/`. [Plantillas](../plantillas/README.md#copiar-a-un-proyecto) |
| `Identifier 'lenis' has already been declared` | Script incluido dos veces con `const` global. [Plantillas](../plantillas/README.md#copiar-a-un-proyecto), [int-vanilla](../06-integracion/int-vanilla.md) |
| `sincronizarCanvas: no se obtuvo el contexto` | El canvas ya tiene otro contexto. [Receta](../08-recetas/rec-canvas-sync.md) |
| `window` no definido en servidor | [contrato](../06-integracion/int-contrato.md) |
| Falla en iOS o en un dispositivo táctil | [táctil](../02-opciones/opc-tactil.md), [limitaciones](../07-calidad/cal-limitaciones.md) |
| Snap se comporta de forma extraña | [elementos](../05-snap/snp-elementos.md), [contradicciones](../00-indice/contradicciones.md) |
| Algo no hace lo que dice la documentación | [contradicciones](../00-indice/contradicciones.md) |
| Código antiguo con `@studio-freight/lenis` | [migración](../09-versiones/ver-migracion.md) |

## Elegir

| Duda | Respuesta |
|---|---|
| ¿Lenis o scroll nativo? | Si no hay nada que sincronizar con el scroll, normalmente el nativo. [fun-cuando-usarlo](../01-fundamentos/fun-cuando-usarlo.md) |
| ¿`lerp` o `duration`? | `lerp` para gestos; ojo: si hay `duration`, gana casi siempre. [opc-suavizado](../02-opciones/opc-suavizado.md) |
| ¿`autoRaf` o bucle propio? | `autoRaf` si Lenis va solo; bucle propio si comparte reloj con GSAP o una escena. [com-raf](../04-comportamiento/com-raf.md) |
| ¿`stop()` o `overflow`? | Ver [com-stop-start](../04-comportamiento/com-stop-start.md) |
| ¿`lenis/snap` o CSS scroll-snap? | [cal-conflictos](../07-calidad/cal-conflictos.md), [snp-snap](../05-snap/snp-snap.md) |
| ¿Adoptar la 2.0? | Aún solo hay versiones de desarrollo. [ver-v2](../09-versiones/ver-v2.md) |

## Integrarlo en mi tecnología

1. Lee siempre el [contrato](../06-integracion/int-contrato.md): entrar, cambiar y salir, bucle único y el adaptador común.
2. Si existe, añade la ficha de tu tecnología, con lo exclusivo de ella:

| Tecnología | Ficha |
|---|---|
| Sin framework, PHP, plantillas de servidor, CDN | [int-vanilla](../06-integracion/int-vanilla.md) |
| Web Components y Lit | [int-webcomponents](../06-integracion/int-webcomponents.md) |
| WordPress | [int-wordpress](../06-integracion/int-wordpress.md) |
| Webflow y sin código | [int-webflow](../06-integracion/int-webflow.md) |
| React | [int-react](../06-integracion/int-react.md) |
| Next.js | [int-nextjs](../06-integracion/int-nextjs.md) |
| Vue y Nuxt | [int-vue-nuxt](../06-integracion/int-vue-nuxt.md) |
| Svelte y SvelteKit | [int-svelte](../06-integracion/int-svelte.md) |
| Angular | [int-angular](../06-integracion/int-angular.md) |
| TypeScript, con cualquiera | [int-typescript](../06-integracion/int-typescript.md) |
| Canvas, WebGL, Three.js | [int-canvas-webgl](../06-integracion/int-canvas-webgl.md) |
| Otra | El contrato basta: conecta su adaptador en los ganchos equivalentes |
