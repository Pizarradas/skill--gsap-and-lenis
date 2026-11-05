# gsap-conocimiento

Base de conocimiento en español sobre GSAP y todos sus plugins, pensada para reutilizarse en cualquier proyecto, **sea cual sea su tecnología**, tanto por personas como por agentes de IA.

- **Oficial.** Sintetiza toda la documentación de gsap.com; cada ficha cita sus fuentes.
- **Técnico.** Contrastado con el código y los tipos del paquete. Donde la documentación no coincide con el código, gana el código y queda anotado en [`contradicciones`](00-indice/contradicciones.md).
- **Práctico.** Trampas reales, recetas y plantillas, con los ejemplos ejecutados en un navegador real.
- **Agnóstico.** El conocimiento se explica con JavaScript estándar. Cada tecnología es una traducción de un único [contrato de integración](12-frameworks/fra-agnostico.md).

## Cómo empezar

| Si quieres | Ve a |
|---|---|
| Resolver algo concreto | [`16-tareas/tar-rutas.md`](16-tareas/tar-rutas.md) |
| Aprender desde cero | [`01-fundamentos`](01-fundamentos/README.md) → [`02-nucleo`](02-nucleo/README.md) → [`03-timeline`](03-timeline/README.md) |
| Ver todo | [`00-indice/mapa.md`](00-indice/mapa.md) |
| Buscar un método | [`00-indice/api.md`](00-indice/api.md) |
| Copiar código a un proyecto | [`plantillas/`](plantillas/README.md) |
| Usarlo con un agente de IA | [`AGENTS.md`](AGENTS.md) y [`adaptadores/`](adaptadores/README.md) |

## Estructura

| Carpeta | Contenido |
|---|---|
| `00-indice` | Mapa, API, fuentes, etiquetas, estado, convenciones, contradicciones, lista para dispositivo real y reportes para los autores |
| `01-fundamentos` | Qué es, instalación, licencia, modelo mental, objetivos, valores y plugins |
| `02-nucleo` | Tweens, control, stagger, keyframes, limpieza, `context`, `matchMedia`, ticker |
| `03-timeline` | Secuencias, parámetro de posición, etiquetas y anidado |
| `04-propiedades` | CSSPlugin, transformaciones y plugins internos |
| `05-easing` | Eases y curvas propias |
| `06-utilidades` | `gsap.utils` |
| `07-scroll` | ScrollTrigger, ScrollSmoother, ScrollTo y Observer |
| `08-texto` | SplitText, ScrambleText y Text |
| `09-svg` | DrawSVG, MorphSVG y MotionPath |
| `10-interaccion` | Flip, Draggable, Inertia y VelocityTracker |
| `11-especializados` | Physics2D, PhysicsProps, Pixi, Easel, CSSRule y GSDevTools |
| `12-frameworks` | Contrato universal y su aplicación en cada tecnología |
| `13-calidad` | Rendimiento, accesibilidad, FOUC, errores y depuración |
| `14-recetas` | Patrones listos para usar |
| `15-versiones` | Historial, migración y paso a los paquetes públicos |
| `16-tareas` | Rutas por intención, síntoma y decisión |
| `plantillas` | Módulos JavaScript reutilizables, con su prueba |
| `adaptadores` | Conexión con Claude Code, Cursor, Copilot o cualquier modelo |
| `datos` | Inventario de API e índices para máquinas |
| `herramientas` | Validación, pruebas, índices y actualización |

## Cuánto fiarse de cada dato

Cada afirmación relevante lleva una marca: `[O]` oficial, `[C]` comprobado en el código, `[E]` ejecutado en navegador, `[P]` criterio práctico propio. Las cifras actuales están en [`00-indice/estados.md`](00-indice/estados.md).

Límites conocidos: la ejecución automática se hace en Chrome y Firefox de escritorio. El comportamiento en Safari y en dispositivos táctiles consta por documentación o código, no por prueba: usa la [lista para dispositivo real](00-indice/pruebas-dispositivo.md). Cada ficha indica qué no se pudo verificar.

## Mantenimiento

Las fichas son la fuente de verdad, y los índices se generan a partir de ellas. Ver [`AGENTS.md`](AGENTS.md) y [`convenciones`](00-indice/convenciones.md). Cuando salga una versión de GSAP, `herramientas/actualizar.py` indica qué páginas han cambiado y qué fichas revisar.

## Licencia y atribución

Sistema independiente, sin relación oficial con GSAP ni Webflow. GSAP y sus nombres pertenecen a sus titulares; su uso se rige por la [licencia estándar](https://gsap.com/standard-license), resumida en [`fun-licencia`](01-fundamentos/fun-licencia.md). El texto es síntesis original a partir de la documentación oficial, y no redistribuye esa documentación ni el código de GSAP. Algunas partes se apoyan en [`gsap-skills`](https://github.com/greensock/gsap-skills) (MIT, © GreenSock).
