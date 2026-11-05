<!-- GENERADO por herramientas/generar_indices.py: no editar a mano -->

# 04 · Propiedades y CSS

| Ficha | Tipo | Ámbito | Resumen |
|---|---|---|---|
| [AttrPlugin, animar atributos](css-attr.md) | plugin | AttrPlugin | Anima atributos numéricos de HTML y SVG con attr. Cuándo usarlo en lugar de CSS y qué ocurre con unidades, colores y rutas. |
| [autoAlpha, opacidad con visibilidad](css-autoalpha.md) | api | CSSPlugin | autoAlpha combina opacity y visibility para que un elemento a 0 no reciba eventos. Es la base para evitar parpadeos al cargar. |
| [clearProps, limpiar estilos en línea](css-clearprops.md) | api | CSSPlugin | Quita estilos en línea al terminar un tween para que vuelvan a mandar las clases. Por qué un componente de transform los borra todos y qué pasa en timelines y yoyo. |
| [Valores complejos, sombras, filtros, degradados y clip-path](css-complejas.md) | concepto | CSSPlugin | Cómo interpola GSAP cadenas con varios números y colores. Por qué ambos extremos deben tener la misma estructura y cómo preparar el valor inicial. |
| [EndArrayPlugin, animar arrays de números](css-endarray.md) | api | EndArrayPlugin | Interpola un array de números hacia otro con easing. Útil para datos de gráficas o buffers. Qué ocurre con longitudes distintas. |
| [ModifiersPlugin, interceptar cada valor](css-modifiers.md) | api | ModifiersPlugin | Función por propiedad que recibe el valor de cada tick y devuelve el que se aplica. Sirve para envolver, limitar y derivar. Reglas de tipos y de unidades. |
| [transformOrigin, svgOrigin y smoothOrigin](css-origin.md) | api | CSSPlugin | Elegir el punto alrededor del que giran y escalan los elementos, en HTML y SVG. No se interpola, admite profundidad y en SVG evita saltos al cambiar. |
| [CSSPlugin, animar propiedades CSS](css-plugin.md) | plugin | CSSPlugin | Qué propiedades CSS anima GSAP, cómo trata nombres, unidades y valores no animables, y las trampas de autoRound, display y height auto. |
| [Rotación direccional](css-rotacion.md) | api | CSSPlugin | Sufijos _short, _cw y _ccw para elegir el sentido de giro, y qué unidades acepta realmente rotation. |
| [SnapPlugin, ajustar valores durante el tween](css-snap.md) | api | SnapPlugin | snap en vars redondea en cada render a incrementos, listas o radios. Diferencia con gsap.utils.snap y por qué el tween puede no terminar en su destino. |
| [Transformaciones, orden, x/y frente a xPercent/yPercent](css-transforms.md) | concepto | CSSPlugin | Cómo guarda y recompone GSAP las transformaciones, en qué orden fijo, por qué usar x/y/rotation en lugar de transform, y cuándo xPercent. Incluye 3D, force3D y la lectura de CSS. |
| [Variables CSS](css-variables.md) | concepto | CSSPlugin | Animar variables CSS con GSAP y usar var() como destino. Permite actualizar muchos elementos con un solo valor, y tiene reglas propias para colores y unidades. |
