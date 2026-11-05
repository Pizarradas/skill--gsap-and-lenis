# Convenciones de la capa de orquestación

Esta capa decide, no enseña. El detalle de cada biblioteca vive en `gsap-knowledge/` y `lenis-knowledge/`; aquí solo está lo que aparece **al combinarlas**: qué usar, quién manda en cada cosa y qué no puede coexistir.

## Ficha

Archivo `.md` en `01-decidir`, `02-reglas`, `03-ciclo` o `04-combinaciones`, con prefijo `orq-` o `cmb-`, máximo 320 líneas y un tema.

```yaml
---
id: cmb-pin
titulo: Fijar secciones con Lenis
capa: 04-combinaciones
tipo: combinacion          # decision | regla | ciclo | combinacion
perfiles: [gsap+lenis]
resumen: Una línea, máximo 180 caracteres.
relacionadas: [orq-propiedad]
fuentes:                   # gsap:<id>, lenis:<id> o lab:<ruta bajo _notas>
  - gsap:scr-pin
  - lenis:int-gsap
estado: verificado         # verificado | revisar
version: gsap 3.15.1 + lenis 1.3.27
---
```

No copies conocimiento de las bases: enlaza `gsap:<id>` o `lenis:<id>`. Si lo que dice una base cambia por el perfil, va a `02-reglas/orq-anulaciones.md`.

## Perfiles

| Perfil | Contenido |
|---|---|
| `ninguno` | CSS y JavaScript nativos |
| `gsap` | GSAP con scroll nativo |
| `gsap-smoother` | GSAP con ScrollSmoother |
| `lenis` | Lenis sin GSAP |
| `gsap+lenis` | GSAP con scroll suave de Lenis |

## Reglas

`datos/reglas.json` es la fuente de verdad. Cada regla: `id` (`O01`…), `titulo`, `severidad` (`bloqueante` | `aviso`), `perfiles`, `correccion`, `evidencia` (id de la ficha que la demuestra y que debe citar el id), y `detecta`, patrones para el auditor de proyectos. Solo es `bloqueante` lo demostrado por ejecución. Sin evidencia ejecutada es `aviso` y lo dice.

## Procedencia y rigor

Mismas marcas que las bases: `[O]`, `[C]`, `[E]`, `[P]`. Lo decisivo aquí es que **cada conflicto se ejecuta con ambas bibliotecas a la vez**; una regla razonada pero no ejecutada se marca `[P]`. El alcance se declara siempre (ventana o contenedor, `lerp` o `duration`, con o sin `lenis.css`, rueda o toque): el fallo sistemático de estos sistemas es generalizar un caso probado. Comprueba cualquier afirmación de una base antes de apoyarte en ella: pueden contener errores residuales.

## Agnosticismo

Todo vale para cualquier tecnología: JavaScript estándar, sin frameworks salvo que una ficha lo justifique. Di "al retirar la vista". Ciclo: entrar, cambiar, salir. Sin empaquetador como supuesto.

## Código

Los ```` ```js ```` se ejecutan en Chrome y Firefox con todo cargado: `gsap`, `ScrollTrigger`, `ScrollToPlugin`, `ScrollSmoother`, `Observer`, `Draggable`, `InertiaPlugin`, `Flip`, `SplitText` (registrados), `Lenis`, `Snap`, y `lenis.css`. Ayudas: `rueda(dy, el?, dx?)`, `toque(tipo, x, y, el?)`, `espera(ms)`. `// prueba: <expr>` se evalúa dentro del bloque 700 ms después de que termine. `js fragmento` no se ejecuta; `js invalido` es un contraejemplo. Con scroll usa `ScrollTrigger.update()` tras `window.scrollTo` si Lenis no está. Compara con margen y sin cadenas de `transform`: varían entre motores.

Límites: `requestAnimationFrame` es un temporizador de 16 ms, iframe de 1000×700 fuera de pantalla, `prefers-reduced-motion` es `no-preference`, `ResizeObserver` y `scroll` pueden llegar tarde, y Firefox corre en tiempo real. Lo que dependa de eso se comprueba en laboratorio (Chrome real por CDP, con rueda real) antes de afirmarlo.

Desde `herramientas/`: `python3 validar.py`, `python3 probar_bloques.py --plantillas` varias veces y `--firefox`.
