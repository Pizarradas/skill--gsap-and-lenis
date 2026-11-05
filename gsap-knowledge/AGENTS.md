# GSAP: guía para agentes

Base de conocimiento sobre GSAP y sus plugins, válida para cualquier modelo o herramienta y **para cualquier tecnología de proyecto**: el conocimiento no depende de ningún framework. Versión de referencia: la indicada en `00-indice/estados.md`.

## Cómo consultar

1. Identifica la intención o el síntoma en [`16-tareas/tar-rutas.md`](16-tareas/tar-rutas.md).
2. Si no aparece, busca el símbolo en [`00-indice/api.md`](00-indice/api.md) o recorre [`00-indice/mapa.md`](00-indice/mapa.md).
3. Lee solo las fichas necesarias, más las de su campo `requiere`. Para un vistazo barato de todo el sistema: `datos/contexto-compacto.md`.
4. Para código reutilizable, mira antes [`plantillas/`](plantillas/README.md) y [`14-recetas/`](14-recetas/README.md).

## Reglas al escribir código con GSAP

- **R1. Limpia lo que sobrevive a su vista.** Toda animación ligada a algo que se retira sin recargar la página vive en un `gsap.context()` y se revierte al retirarla, sea cual sea la tecnología; una escena de canvas o WebGL libera además su GPU. Solo en una página que se descarta entera al navegar puede omitirse la limpieza. Ver `nuc-context`, `nuc-limpieza`, `fra-agnostico`, `fra-canvas-webgl`.
- **R2. Registra los plugins** una vez con `gsap.registerPlugin()`, antes de usarlos. Es seguro también en servidor. Ver `fun-plugins`, `fra-agnostico`.
- **R3. Minimiza el coste de pintar.** En el DOM, anima transformaciones y opacidad (`x`, `y`, `scale`, `rotation`, `autoAlpha`) antes que propiedades que recalculan el layout. En canvas o WebGL, dibuja una sola vez por tick, o solo cuando algo cambie. Ver `css-transforms`, `cal-rendimiento`, `fra-canvas-webgl`.
- **R4. Respeta `prefers-reduced-motion`** con `gsap.matchMedia()`. Ver `cal-accesibilidad`, `nuc-matchmedia`.
- **R5. ScrollTrigger en el nivel superior.** Se coloca en el tween o en el timeline padre, nunca en un hijo de un timeline. Ver `cal-st-errores`.
- **R6. No crees animaciones en un manejador de alta frecuencia**: usa `quickTo` o `quickSetter`. Ver `nuc-quickto`.
- **R7. Un solo dueño por valor.** Nada de CSS `transition` sobre lo que anima GSAP, ni de otro bucle o motor escribiendo el mismo valor de un objeto. Ver `cal-errores-comunes`, `fra-canvas-webgl`.
- **R8. Verifica antes de afirmar.** No inventes métodos ni opciones: comprueba en `datos/api.json`. Si algo no está en este sistema, dilo y consulta la fuente oficial.
- **R9. Distingue la procedencia.** Conserva las marcas `[O]`, `[C]`, `[E]` y `[P]` al citar: un criterio `[P]` no es una regla oficial.
- **R10. Comprueba la versión.** Si el proyecto usa otra versión de GSAP, revisa `15-versiones/ver-historial.md`.

## Tareas habituales

| Tarea | Qué hacer |
|---|---|
| H1. Implementar una animación | Ruta en `tar-rutas` → ficha → plantilla si existe → aplicar R1–R7 |
| H2. Diagnosticar un fallo | Sección de síntomas de `tar-rutas` → `13-calidad` |
| H3. Elegir plugin o enfoque | Tablas de decisión de `tar-rutas` |
| H4. Revisar código GSAP | Contrastar con R1–R7 y `cal-errores-comunes`, `cal-st-errores` |
| H5. Integrar en cualquier tecnología | `fra-agnostico` (entrar, cambiar y salir) y, si existe, la ficha `fra-*` de esa tecnología. Canvas o WebGL: `fra-canvas-webgl` |
| H6. Migrar o actualizar | `15-versiones` |
| H7. Mantener este sistema | Ver abajo |

## Mantenimiento

Las fichas son la fuente de verdad; todo lo marcado como GENERADO se reescribe solo. Las reglas están en [`00-indice/convenciones.md`](00-indice/convenciones.md). Desde `herramientas/`:

```bash
python actualizar.py            # ¿hay versión o documentación nueva? ¿qué fichas afecta?
python actualizar.py --aplicar  # actualiza la caché local y datos/api.json
python generar_indices.py       # regenera índices
python validar.py               # estructura, API, sintaxis, anticopia y cobertura
python probar_bloques.py        # ejecuta los ejemplos en Chrome o Edge
python probar_bloques.py --plantillas   # todo; repítelo varias veces
python probar_bloques.py --plantillas --firefox   # lo mismo en Firefox
```

Necesita Python 3.8 o superior; solo usa la biblioteca estándar. Node (sintaxis) y Chrome o Edge (ejecución) son opcionales. La caché con las fuentes vive en `~/.cache/gsap-conocimiento`: si falta, créala con `actualizar.py --aplicar`.
