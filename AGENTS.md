# GSAP + Lenis: guía para agentes

Sistema para aplicar GSAP, Lenis o los dos en cualquier proyecto y tecnología **sin que se contradigan**. Es la **entrada única**: no entres directamente en `gsap-knowledge/` ni en `lenis-knowledge/`, porque ninguna conoce el perfil del proyecto y sus consejos pueden chocar. `gsap-knowledge` ni siquiera menciona Lenis.

Versiones: gsap 3.15.1 + lenis 1.3.27. Comprueba las del proyecto: una versión distinta anula las mediciones.

## Procedimiento

1. **Perfil.** Si el proyecto tiene `movimiento.perfil`, úsalo: es una decisión tomada. Si no, marca las necesidades del encargo y resuelve:
   ```bash
   python3 herramientas/decidir.py --lista
   python3 herramientas/decidir.py pin secuencia scroll-suave
   ```
   Si no puedes ejecutarlo, aplica [`orq-que-usar`](01-decidir/orq-que-usar.md) y [`orq-por-tarea`](01-decidir/orq-por-tarea.md). Por defecto, lo mínimo. Di qué perfil eliges y por qué antes de escribir código.
2. **Dueños.** Lee la columna del perfil en [`orq-propiedad`](02-reglas/orq-propiedad.md). Es la respuesta a "¿con qué se hace esto?".
3. **Detalle.** Lee en las bases solo las fichas que da `decidir.py`, siguiendo la ruta de `gsap-knowledge/16-tareas/tar-rutas.md` o `lenis-knowledge/10-tareas/tar-rutas.md`. **Antes de aplicar una, búscala en [`orq-anulaciones`](02-reglas/orq-anulaciones.md)**; en `gsap+lenis`, mira también `04-combinaciones/`.
4. **Código.** Usa [`plantillas/orquestador.js`](plantillas/README.md) y deja declarado el perfil. Las plantillas de las bases se usan según su sección en `orq-anulaciones`: en perfiles con Lenis, casi todas piden `{ lenis: mov.lenis }`.
5. **Comprobación.** Antes de dar el trabajo por terminado:
   ```bash
   python3 herramientas/auditar_proyecto.py <ruta del proyecto>
   ```
   Lee [`orq-ciclo`](03-ciclo/orq-ciclo.md) si hay vistas que se crean y se retiran.

## Precedencia

Si dos fuentes discrepan, gana la primera:

1. `datos/reglas.json` y `02-reglas/orq-propiedad.md`
2. `02-reglas/orq-anulaciones.md`
3. `04-combinaciones/` y `03-ciclo/`
4. `gsap-knowledge/` y `lenis-knowledge/`
5. La documentación oficial de cada biblioteca

## Reglas

- **A1. Un perfil, y se declara.** Nada de mezclar perfiles en una vista.
- **A2. Un dueño por responsabilidad.** Reloj, posición, suavizado, medición, scroll programático, ajuste, bloqueo, anclas, velocidad, movimiento reducido y limpieza. Nada fuera de la tabla, salvo sus cuatro excepciones cerradas.
- **A3. Nunca dos suavizados** (O03): ni Lenis con ScrollSmoother, ni `normalizeScroll` con Lenis (O07).
- **A4. Una regla bloqueante no se negocia.** Si el encargo la exige, dilo y cambia de perfil. No la sortees.
- **A5. No inventes API.** Compruébala en `gsap-knowledge/datos/api.json` o `lenis-knowledge/datos/api.json`.
- **A6. Conserva las marcas** `[O]`, `[C]`, `[E]`, `[P]`, y el alcance de lo medido. `[O]` solo significa que lo dice la documentación.
- **A7. Di lo que no se probó.** Toque real, iOS y Safari no están verificados: ver [`00-indice/sin-verificar.md`](00-indice/sin-verificar.md).

## Tareas habituales

| Tarea | Qué hacer |
|---|---|
| Implementar | Procedimiento completo |
| Elegir tecnología | Paso 1 y [`orq-perfiles`](01-decidir/orq-perfiles.md) |
| Revisar un proyecto | `auditar_proyecto.py`, y contrastar con `orq-propiedad` |
| Diagnosticar | `auditar_proyecto.py`; si sale limpio, `cal-depuracion` de cada base |
| Añadir una biblioteca a un proyecto | "Cuándo cambiar de perfil" en `orq-perfiles`; después, el auditor |
| Mantener | Ver abajo |

## Mantenimiento

`gsap-knowledge/` y `lenis-knowledge/` se mantienen con sus propias herramientas y no se modifican desde aquí. Si cambian, `comprobar_bases.py` dice qué volver a verificar. Las fichas, `datos/reglas.json` y `datos/necesidades.json` son la fuente de verdad; lo marcado GENERADO se reescribe solo. Reglas en [`00-indice/convenciones.md`](00-indice/convenciones.md). Desde `herramientas/`:

```bash
python3 comprobar_bases.py            # ¿cambió una base? ¿qué afecta?
python3 generar_indices.py            # regenera tabla, mapa y reglas
python3 validar.py                    # estructura, referencias y sintaxis
python3 probar_decision.py            # casos de la decisión
python3 probar_auditor.py             # casos del auditor
python3 probar_bloques.py --plantillas   # ejecuta en Chrome; repítelo
python3 probar_bloques.py --plantillas --firefox
python3 plantillas_globales.py        # regenera plantillas/globales
python3 empaquetar.py                 # dist/
```
