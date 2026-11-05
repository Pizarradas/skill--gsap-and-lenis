---
applyTo: "**/*.{js,mjs,cjs,ts,jsx,tsx,vue,svelte,astro,html,htm,php,liquid,twig,erb,ejs,hbs,njk,cshtml,razor}"
---
Consulta RUTA/AGENTS.md y RUTA/16-tareas/tar-rutas.md antes de escribir animaciones con GSAP.

Reglas al usar GSAP: (1) crea las animaciones dentro de gsap.context() y revierte al retirar lo animado, sea cual sea la tecnología, salvo en páginas que se descartan enteras al navegar; (2) registra plugins una vez, antes de usarlos; (3) en el DOM prioriza x, y, scale, rotation y autoAlpha, y en canvas o WebGL dibuja una vez por tick o solo si algo cambia; (4) respeta prefers-reduced-motion con gsap.matchMedia(); (5) pon ScrollTrigger en el tween o timeline de nivel superior, nunca en un hijo; (6) usa quickTo o quickSetter en eventos de alta frecuencia; (7) da un solo dueño a cada valor: nada de CSS transition ni otro bucle sobre lo que anima GSAP; (8) no inventes API: compruébala en RUTA/datos/api.json.
