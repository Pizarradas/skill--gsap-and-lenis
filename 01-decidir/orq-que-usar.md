---
id: orq-que-usar
titulo: Qué usar según lo que se pide
capa: 01-decidir
tipo: decision
perfiles: [ninguno, gsap, gsap-smoother, lenis, gsap+lenis]
resumen: Dos preguntas independientes, qué anima y quién lleva el scroll, dan uno de cinco perfiles. Por defecto, lo mínimo que resuelve el encargo. Un proyecto, un perfil.
relacionadas: [orq-por-tarea, orq-perfiles, orq-propiedad, cmb-smoother]
fuentes:
  - gsap:fun-que-es
  - gsap:scr-pin
  - gsap:scr-smoother
  - lenis:fun-cuando-usarlo
  - lenis:fun-modelo
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Qué usar según lo que se pide

**GSAP y Lenis no compiten.** GSAP decide cómo cambian las cosas; Lenis decide cómo se mueve el scroll. Por eso la elección son dos preguntas independientes, y no "uno u otro".

| | Scroll nativo | ScrollSmoother | Lenis |
|---|---|---|---|
| **Sin GSAP** | `ninguno` | No existe | `lenis` |
| **Con GSAP** | `gsap` | `gsap-smoother` | `gsap+lenis` |

La regla por defecto es **lo mínimo que resuelve el encargo**. Cada biblioteca añadida es peso, un dueño más y reglas nuevas: `gsap+lenis` tiene 17 prohibiciones que `ninguno` no tiene. Añade algo solo si se puede nombrar lo que se perdería sin ello.

Para decidir sin interpretar, pasa las necesidades a la herramienta. Aplica este mismo árbol:

```bash
python3 herramientas/decidir.py pin secuencia scroll-suave
```

## Pregunta 1: ¿hace falta GSAP?

Sí, si se pide algo de esto: secuencia coordinada, animación ligada al scroll, `pin`, Flip, SplitText, SVG avanzado, arrastre o gestos. El proyecto ya lo usa, también.

No, si basta con CSS: `hover`, una transición de estado, o aparecer al entrar en pantalla con `IntersectionObserver`.

## Pregunta 2: ¿hace falta suavizar el scroll?

**El error típico es responder sí por haber dicho sí a la anterior.** `pin`, `scrub` y parallax funcionan con scroll nativo: son `gsap`, no `gsap+lenis`. El suavizado se añade solo si alguien lo pide o lo exige lo que se construye: [P]

| Respuesta | Cuándo |
|---|---|
| **Sí** | El encargo pide esa sensación; una escena `canvas` o WebGL debe seguir al DOM; contenedor suave, eje horizontal o `infinite` |
| **No, aunque lo pidan** | Blog, documentación, comercio, aplicación con datos, formulario largo, tabla enorme o lista virtualizada. `decidir.py` deja nativo y lo avisa: si tras valorarlo se mantiene, se quita esa necesidad de la lista |
| **No** | Cualquier otro caso |

Una **zona** con tabla, mapa o panel no veta nada: conserva su scroll con `data-lenis-prevent`.

## Pregunta 3: si hay suavizado y hay GSAP, ¿cuál?

Nunca los dos (O03). Sin GSAP, Lenis, aunque se pierda algo: `decidir.py` lo avisa. Con GSAP, **Lenis por defecto**. ScrollSmoother solo si se cumple todo:

1. Es vertical y en la ventana.
2. No hay `sticky` ni `fixed` dentro del contenido, o se pueden sacar.
3. Se puede envolver el marcado, y la página no es pesada.
4. Además importa algo que Lenis no da: teclado y barra suavizados, `data-speed` y `data-lag`, o que código ajeno escriba el scroll sin coordinarse.

Cada punto está medido en [`cmb-smoother`](../04-combinaciones/cmb-smoother.md).

## Lo que ya existe

Un proyecto con una biblioteca la conserva: no se migra por gusto, tampoco si es un sitio de contenido donde hoy no se elegiría. Lo anterior vale para añadir suavizado, no para retirarlo. Lenis y un `pin` nuevo dan `gsap+lenis`, no un cambio a ScrollSmoother. Solo se migra si lo pedido es imposible: ScrollSmoother con un contenedor suave pasa a Lenis, y hay que retirarlo del todo. Si ya están los dos juntos, el proyecto incumple O03: `decidir.py` se niega a dar perfil hasta retirar uno.

## Un proyecto, un perfil

Se declara **un** perfil en `movimiento.perfil`, y todo pasa por `orquestador.js`. No se mezclan dentro de una misma vista.

Si dos partes piden cosas distintas, como una portada con `gsap+lenis` y un panel de datos con `gsap`:

| Caso | Solución |
|---|---|
| Páginas que cargan por separado | Cada una decide su perfil; el auditor se pasa por partes con `--perfil` |
| Aplicación de una sola página | `mov.salir()` y un nuevo `iniciarMovimiento`. Probado entre perfiles, sin residuos |
| Salir de `gsap-smoother` en una sola página | Recarga, o usa nodos distintos: [`orq-ciclo`](../03-ciclo/orq-ciclo.md) |

## Trampas

- **Elegir por la lista de deseos.** Marca lo que el encargo necesita, no lo que podría usar.
- **"Ya que está GSAP, ScrollSmoother".** Compartir autor no es razón: cuesta marcado, `sticky`, `fixed` y tiempo de hilo. Lo decide la pregunta 3.
- **Suavizar para arreglar un pin que tiembla.** Con `gsap`, primero `gsap:scr-pin`. No se resuelve añadiendo otra biblioteca.
- **Olvidar el toque.** Ni Lenis ni ScrollSmoother suavizan el toque por defecto, y es lo correcto. Sin medir en dispositivo real. [P]
