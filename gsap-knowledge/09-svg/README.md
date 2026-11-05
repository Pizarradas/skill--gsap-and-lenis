<!-- GENERADO por herramientas/generar_indices.py: no editar a mano -->

# 09 · SVG

| Ficha | Tipo | Ámbito | Resumen |
|---|---|---|---|
| [DrawSVGPlugin, dibujar trazos](svg-drawsvg.md) | plugin | DrawSVGPlugin | Revela u oculta el trazo de formas SVG controlando stroke-dasharray y stroke-dashoffset. El valor describe el segmento visible, no un porcentaje de avance. |
| [Animar SVG con GSAP, guía y trampas](svg-guia.md) | guia | transversal | Qué normaliza GSAP en SVG (transforms, transformOrigin, svgOrigin, smoothOrigin), qué plugin elegir y qué límites del formato conviene conocer antes de animar. |
| [RawPath y utilidades de MorphSVGPlugin](svg-morphsvg-api.md) | api | MorphSVGPlugin | El formato RawPath con los tipos de 3.15.1, y convertToPath, getRawPath, stringToRawPath, rawPathToString y normalizeStrings con sus trampas. |
| [MorphSVGPlugin, transformar una forma en otra](svg-morphsvg.md) | plugin | MorphSVGPlugin | Interpola el atributo d de un path hacia otra forma aunque tengan distinto número de puntos. Opciones de calidad, rendimiento y salida a canvas. |
| [MotionPathPlugin, métodos estáticos](svg-motionpath-api.md) | api | MotionPathPlugin | Utilidades de rutas y coordenadas, sin tween. RawPath, posición en ruta, cortes, y conversión entre sistemas de coordenadas con transformaciones anidadas. |
| [MotionPathPlugin, animar a lo largo de una ruta](svg-motionpath.md) | plugin | MotionPathPlugin | Mueve cualquier objetivo por un path SVG, datos de ruta o puntos, con autoRotate, align y start/end. También suaviza transiciones entre valores de otras propiedades. |
| [MotionPathHelper, editar rutas en el navegador](svg-motionpathhelper.md) | plugin | MotionPathHelper | Herramienta de desarrollo para editar visualmente una ruta de motionPath y copiar el resultado. También hace editable cualquier path con editPath(). |
