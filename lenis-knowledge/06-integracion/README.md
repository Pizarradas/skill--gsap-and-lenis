<!-- GENERADO por herramientas/generar_indices.py: no editar a mano -->

# 06 · Integración

| Ficha | Tipo | Ámbito | Resumen |
|---|---|---|---|
| [Lenis en Angular](int-angular.md) | guia | transversal | Sin paquete oficial: adaptador entrar con afterNextRender y DestroyRef, directiva para contenedores, NavigationEnd, zone.js y detección de cambios por fotograma. |
| [Sincronizar una escena de canvas o WebGL con Lenis](int-canvas-webgl.md) | patron | transversal | Patrón motor.alDibujar para cualquier motor: un bucle para Lenis y el dibujo, leer scroll, alinear con el DOM en ventana y contenedor, y liberar. Three.js como caso. |
| [Contrato de integración de Lenis con cualquier tecnología](int-contrato.md) | patron | transversal | Entrar, cambiar y salir sobre ventana, contenedor o escena: las cinco columnas, bucle único, adaptador entrar y salir, compartir la instancia y entornos sin window. |
| [Lenis con GSAP y ScrollTrigger](int-gsap.md) | patron | transversal | Un solo reloj con gsap.ticker, unidad de tiempo de raf, por qué ScrollTrigger.update y qué hace realmente lagSmoothing(0), medido con rueda real y scrub. |
| [Navegación sin recarga con Lenis](int-navegacion.md) | patron | transversal | Por qué un cambio de vista deja inercia y límites viejos, la función colocar (cortar, medir y colocar) y qué orden falla, probado en ventana y contenedor. |
| [Lenis en Next.js](int-nextjs.md) | guia | react | App Router: ReactLenis ya es de cliente, funciones en options desde el servidor, reinicio de scroll con usePathname, y por qué Link no basta en plena inercia. |
| [Lenis en React](int-react.md) | guia | react | Paquete oficial lenis/react: ReactLenis, useLenis, LenisRef, cambio de ruta, opciones que no recrean, GSAP aparte y un bucle del README que no funciona. |
| [Lenis en Svelte y SvelteKit](int-svelte.md) | guia | transversal | Sin paquete oficial: el adaptador entrar con onMount, {@attach} para un contenedor, afterNavigate en SvelteKit para la ruta y lo que cambia en SvelteKit 3. |
| [Tipos de Lenis en TypeScript](int-typescript.md) | guia | transversal | Qué exporta cada entrada, qué resolución de módulos funciona, LenisRef y LenisExposed, por qué LenisExposed no se puede importar y los globales de window. |
| [Lenis sin framework](int-vanilla.md) | guia | core | Las tres vías de carga, cuándo está listo el DOM, páginas que se descartan, instancia única, navegación parcial desde servidor y bfcache. |
| [Lenis en Vue y Nuxt](int-vue-nuxt.md) | guia | vue | Paquetes lenis/vue y lenis/nuxt: VueLenis, plugin, useLenis, LenisExposed, opciones en línea que recrean la instancia, cambio de ruta, GSAP aparte y Vue 3.5 obligatorio. |
| [Lenis en Web Components y Lit](int-webcomponents.md) | guia | transversal | Custom Elements como contrato nativo: connectedCallback sin hijos, mover el nodo, Shadow DOM y scrollTo, y los ganchos de Lit. |
| [Lenis en Webflow](int-webflow.md) | guia | transversal | Fragmento sin compilación del README en el código personalizado, qué resuelve cada opción, contrastado una a una. Webflow no se ejecutó; el fragmento, sí. |
| [Lenis en WordPress](int-wordpress.md) | guia | transversal | Encolar Lenis y su CSS, el código en línea cancela defer, editor y personalizador, y constructores. Basado en documentación: WordPress no se ejecutó. |
