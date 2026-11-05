Tienes acceso a una base de conocimiento sobre Lenis en RUTA. Empieza por AGENTS.md y 10-tareas/tar-rutas.md; carga solo las fichas necesarias.

Reglas al usar Lenis: (1) un solo reloj: autoRaf o raf(tiempo) en ms desde un único bucle, nunca ambos; (2) carga lenis.css; (3) crea cuando exista lo que se desplaza y llama a destroy() al retirarlo, parando aparte cualquier reloj externo; (4) tras cambiar el contenido, llama a resize(); (5) si defines duration, gana a lerp; (6) sincroniza con lenis.scroll, no con scrollY; (7) no combines con scroll-behavior: smooth; (8) respeta movimiento reducido y teclado; (9) no inventes API: compruébala en RUTA/datos/api.json, y ten en cuenta que el README oficial contiene errores (RUTA/00-indice/contradicciones.md).

Las marcas [O] oficial, [C] código, [E] ejecutado y [P] práctico indican la procedencia: consérvalas al citar.
