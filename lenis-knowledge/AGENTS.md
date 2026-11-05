# Lenis: guía para agentes

Base de conocimiento sobre Lenis y sus paquetes `lenis/snap`, `lenis/react` y `lenis/vue`, válida para cualquier modelo o herramienta y **para cualquier tecnología de proyecto**. Versión de referencia: la indicada en `00-indice/estados.md`.

## Cómo consultar

1. Identifica la intención o el síntoma en [`10-tareas/tar-rutas.md`](10-tareas/tar-rutas.md).
2. Si no aparece, busca el símbolo en [`00-indice/api.md`](00-indice/api.md) o recorre [`00-indice/mapa.md`](00-indice/mapa.md).
3. Lee solo las fichas necesarias. Para un vistazo barato: `datos/contexto-compacto.md`.
4. Para código reutilizable, mira antes [`plantillas/`](plantillas/README.md).
5. **El README oficial tiene errores.** Antes de confiar en él, revisa [`contradicciones`](00-indice/contradicciones.md).

## Reglas al escribir código con Lenis

- **R1. Un solo reloj.** `autoRaf: true` o llamadas a `raf(tiempo)` en milisegundos desde un único bucle; nunca ambos ni dos relojes. Ver `com-raf`, `int-gsap`.
- **R2. Carga `lenis.css`.** Sin él fallan `stop()` y `autoToggle`. Ver `fun-css`.
- **R3. Entrar, cambiar, salir.** Crea cuando exista lo que se desplaza, comunica los cambios y llama a `destroy()` al retirarlo, salvo en páginas que se descartan enteras. Un reloj externo hay que pararlo aparte. Ver `int-contrato`.
- **R4. Tras cambiar el contenido, `resize()`.** `limit` se guarda en caché. Ver `com-dimensiones`.
- **R5. `duration` gana a `lerp`.** Si defines `duration`, `lerp` deja de actuar casi siempre. Ver `opc-suavizado`.
- **R6. Sincroniza con `lenis.scroll`**, no con `window.scrollY`, y dentro del mismo paso. Ver `int-canvas-webgl`.
- **R7. Sin otro suavizado.** No combines Lenis con `scroll-behavior: smooth`, ni con CSS scroll-snap sin revisarlo. Ver `cal-conflictos`.
- **R8. Respeta el movimiento reducido y el teclado.** Ver `cal-accesibilidad`.
- **R9. Verifica antes de afirmar.** Comprueba la API en `datos/api.json`, conserva las marcas `[O]`, `[C]`, `[E]`, `[P]`, y recuerda que `[O]` solo significa que lo dice la documentación.
- **R10. Comprueba la versión.** Revisa `09-versiones/ver-historial.md`; las 2.0.0-dev no son estables. Ver `ver-v2`.

## Tareas habituales

| Tarea | Qué hacer |
|---|---|
| H1. Implementar | Ruta en `tar-rutas` → ficha → plantilla si existe → aplicar R1–R8 |
| H2. Diagnosticar | Síntomas de `tar-rutas` → `cal-depuracion`, `cal-errores` |
| H3. Decidir | Sección "Elegir" de `tar-rutas` |
| H4. Revisar código | Contrastar con R1–R8 y `cal-errores` |
| H5. Integrar en cualquier tecnología | `int-contrato` y, si existe, su ficha `int-*` |
| H6. Migrar o actualizar | `09-versiones` |
| H7. Mantener este sistema | Ver abajo |

## Mantenimiento

Las fichas son la fuente de verdad; lo marcado GENERADO se reescribe solo. Reglas en [`00-indice/convenciones.md`](00-indice/convenciones.md). Desde `herramientas/`:

```bash
python actualizar.py            # ¿hay versión o documentación nueva? ¿qué fichas afecta?
python actualizar.py --aplicar  # actualiza la caché local y datos/api.json
python generar_indices.py       # regenera índices
python validar.py               # estructura, API, sintaxis y cobertura
python probar_bloques.py --plantillas   # ejecuta los ejemplos; repítelo varias veces
python probar_bloques.py --plantillas --firefox   # lo mismo en Firefox
python plantillas_globales.py   # regenera plantillas/globales
```

Necesita Python 3.8 o superior, solo biblioteca estándar. Node (sintaxis) y Chrome o Edge (ejecución) son opcionales. La caché vive en `~/.cache/lenis-conocimiento`. Las pruebas que combinan con GSAP usan `~/.cache/gsap-conocimiento/pkg` si existe.
