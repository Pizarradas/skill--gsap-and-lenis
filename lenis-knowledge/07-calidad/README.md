<!-- GENERADO por herramientas/generar_indices.py: no editar a mano -->

# 07 · Calidad y diagnóstico

| Ficha | Tipo | Ámbito | Resumen |
|---|---|---|---|
| [Accesibilidad de Lenis: movimiento reducido, foco y teclado](cal-accesibilidad.md) | guia | core | Qué hace respectReducedMotion de verdad, medido con prefers-reduced-motion real; teclado y Tab con rueda real; foco perdido en plena inercia y al usar stop(). |
| [Conflictos de Lenis con CSS y otras bibliotecas](cal-conflictos.md) | patron | transversal | scroll-behavior, CSS scroll-snap, overflow en body, scroll nativo en plena animación, y ScrollSmoother, normalizeScroll y ScrollToPlugin de GSAP, medido. |
| [Depurar Lenis](cal-depuracion.md) | guia | transversal | Orden de inspección: clases de la raíz, estado de la instancia, relojes por fotograma, oyentes, medidas y eventos, con utilidades que se pueden pegar en consola. |
| [Errores comunes de Lenis](cal-errores.md) | diagnostico | transversal | Síntoma, causa y solución probados: la rueda no mueve nada, scroll lento, NaN con la página clavada, sin desplazarse, límite viejo, scrollTo mudo, modales y clases perdidas. |
| [Limitaciones oficiales de Lenis, contrastadas una a una](cal-limitaciones.md) | referencia | transversal | Las seis limitaciones del README frente al código y a pruebas reales: cuáles se confirman, cuáles matizar y cuáles no se pudieron ejecutar. |
| [Rendimiento de Lenis, medido](cal-rendimiento.md) | concepto | core | Coste real de raf, resize, oyente wheel no pasivo y tamaño, medido en una máquina concreta. Qué consume de verdad y qué no, y cuándo el coste no es de Lenis. |
