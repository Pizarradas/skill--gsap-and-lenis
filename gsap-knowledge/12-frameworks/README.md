<!-- GENERADO por herramientas/generar_indices.py: no editar a mano -->

# 12 · Frameworks e integración

| Ficha | Tipo | Ámbito | Resumen |
|---|---|---|---|
| [Contrato de integración de GSAP con cualquier tecnología](fra-agnostico.md) | patron | transversal | Entrar, cambiar y salir sobre lo que se anima (nodo, objeto o escena): adaptador montar(raiz), tabla de ganchos por tecnología, orden de ejecución, servidor y entornos sin window. |
| [GSAP en Angular](fra-angular.md) | guia | transversal | Entrar, cambiar y salir en Angular: afterNextRender, DestroyRef, effect, animate.leave, Flip con afterNextRender y rutas, probados en una app real de Angular 22. |
| [GSAP en canvas, WebGL y Three.js](fra-canvas-webgl.md) | patron | transversal | Aplicar entrar, cambiar y salir a una escena sin DOM: un render por tick, bucle propio, color, uniforms, resize, pausa, Observer y Draggable, y liberar recursos. |
| [GSAP en Next.js (SSR, "use client" y registro de plugins)](fra-nextjs.md) | guia | transversal | Qué se ejecuta en servidor y qué no, dónde registrar plugins y por qué un tween en el módulo rompe la build. Comprobado con una build real de Next 16.4.5. |
| [Patrones avanzados de GSAP en React](fra-react-avanzado.md) | patron | transversal | Compartir timelines entre componentes, efectos reutilizables, animaciones de salida, FLIP con listas y cierres obsoletos en callbacks de GSAP. |
| [useGSAP en React](fra-react-usegsap.md) | api | transversal | El hook de @gsap/react, sus opciones (scope, dependencies, revertOnUpdate), contextSafe y su comportamiento real leído del código 2.1.2 y probado con React 19. |
| [GSAP en Svelte 5 y SvelteKit](fra-svelte.md) | guia | transversal | Entrar, cambiar y salir en Svelte 5 y SvelteKit: onMount, $effect, transiciones gobernadas por GSAP, Flip con tick y onNavigate, probados en app real. |
| [GSAP con TypeScript](fra-typescript.md) | guia | transversal | Qué tipos usar (gsap.TweenVars, gsap.core.Timeline, ScrollTrigger.Vars), cómo resuelve TS los plugins según moduleResolution y qué rompió el renombrado de archivos de 3.15.0. |
| [GSAP sin framework: páginas de servidor y transiciones](fra-vanilla.md) | patron | transversal | Aplicar el contrato en páginas sin framework: PHP, plantillas, HTML estático, carga por CDN y transiciones de página con Barba o Swup. |
| [GSAP en Vue 3 y Nuxt](fra-vue-nuxt.md) | guia | transversal | Entrar, cambiar y salir en Vue: onMounted, watch post, Transition con done, Flip con nextTick y rutas, probado en app real; plugin de cliente en Nuxt 4. |
| [GSAP en Web Components y Lit](fra-webcomponents.md) | guia | transversal | Aplicar el contrato en Custom Elements, cuando connectedCallback corre varias veces o sin hijos, Shadow DOM como ámbito y los ganchos de Lit. |
| [GSAP en Webflow](fra-webflow.md) | guia | transversal | Integración de GSAP desde los ajustes del sitio, dónde poner código propio, registro de plugins y cómo convive con las Interactions visuales. |
| [GSAP en WordPress](fra-wordpress.md) | guia | transversal | Encolar GSAP y plugins con dependencias en functions.php, tema hijo, espera al DOM y a load, y correcciones al ejemplo oficial. |
