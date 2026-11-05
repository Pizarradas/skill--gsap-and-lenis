<!-- GENERADO por herramientas/generar_indices.py: no editar a mano -->

# 13 · Calidad y diagnóstico

| Ficha | Tipo | Ámbito | Resumen |
|---|---|---|---|
| [Animación accesible, reduced motion y texto dividido](cal-accesibilidad.md) | guia | transversal | prefers-reduced-motion con gsap.matchMedia, interruptor propio con matchMediaRefresh, cuándo reducir o quitar, y SplitText con lectores de pantalla. |
| [Tweens en conflicto y modos de overwrite](cal-conflictos.md) | concepto | transversal | Qué pasa cuando dos tweens animan lo mismo, cómo elegir entre false, true y auto, y cuándo actúa cada modo. |
| [Depurar animaciones GSAP](cal-depuracion.md) | guia | transversal | Método en cinco pasos, avisos de consola y su causa, inspección de tweens activos, ralentizar todo, marcadores y GSDevTools. |
| [Errores comunes con GSAP, por síntoma](cal-errores-comunes.md) | diagnostico | transversal | Síntomas reconocibles con su causa y corrección probada, from() que se queda a medias, saltos en timelines, valores duplicados, transiciones CSS y bucles. |
| [Evitar el flash de contenido sin estilo (FOUC)](cal-fouc.md) | patron | transversal | Ocultar en CSS y revelar con autoAlpha, la trampa de from() con visibility hidden, noscript y SSR. |
| [Rendimiento de animaciones con GSAP](cal-rendimiento.md) | concepto | transversal | Qué cuesta de verdad al animar: propiedades, número de elementos, quickTo, force3D, lazy y ticker. Separa datos medidos de criterio práctico. |
| [Errores de ScrollTrigger, por síntoma](cal-st-errores.md) | diagnostico | ScrollTrigger | Síntomas de scroll con causa y corrección probada, ScrollTrigger anidado, valores viejos, orden de creación, refresh, saltos al cargar y navegación sin recarga. |
