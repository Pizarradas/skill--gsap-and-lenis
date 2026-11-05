# lenis-conocimiento

Base de conocimiento en español sobre [Lenis](https://github.com/darkroomengineering/lenis), la biblioteca de scroll suave, y sus paquetes `lenis/snap`, `lenis/react` y `lenis/vue`. Pensada para reutilizarse en cualquier proyecto, **sea cual sea su tecnología**, tanto por personas como por agentes de IA.

- **Oficial.** Cubre toda la documentación del repositorio.
- **Técnico.** Contrastado línea a línea con el fuente. El README oficial contiene errores: están en [`contradicciones`](00-indice/contradicciones.md), junto con fallos reales del paquete.
- **Práctico.** Trampas, recetas y plantillas, ejecutadas con eventos reales de rueda y toque.
- **Agnóstico.** El conocimiento usa JavaScript estándar. Cada tecnología es una traducción de un único [contrato](06-integracion/int-contrato.md).

## Cómo empezar

| Si quieres | Ve a |
|---|---|
| Resolver algo concreto | [`10-tareas/tar-rutas.md`](10-tareas/tar-rutas.md) |
| Aprender desde cero | [`01-fundamentos`](01-fundamentos/README.md) → [`02-opciones`](02-opciones/README.md) → [`04-comportamiento`](04-comportamiento/README.md) |
| Ver todo | [`00-indice/mapa.md`](00-indice/mapa.md) |
| Buscar un método u opción | [`00-indice/api.md`](00-indice/api.md) |
| Copiar código a un proyecto | [`plantillas/`](plantillas/README.md) |
| Usarlo con un agente de IA | [`AGENTS.md`](AGENTS.md) y [`adaptadores/`](adaptadores/README.md) |

## Estructura

| Carpeta | Contenido |
|---|---|
| `00-indice` | Mapa, API, fuentes, estado, convenciones, contradicciones, lista para dispositivo real y reportes para los autores |
| `01-fundamentos` | Qué es, cuándo usarlo, instalación, licencia, modelo y CSS |
| `02-opciones` | Las 26 opciones con su valor real |
| `03-api` | Propiedades, métodos, `scrollTo` y eventos |
| `04-comportamiento` | Bucle, anidado, horizontal, infinito, anclas, parada, medidas |
| `05-snap` | `lenis/snap` |
| `06-integracion` | Contrato universal y su aplicación en cada tecnología |
| `07-calidad` | Accesibilidad, rendimiento, limitaciones, errores y conflictos |
| `08-recetas` | Patrones listos para usar |
| `09-versiones` | Historial real, migración y estado de la 2.0 |
| `10-tareas` | Rutas por intención, síntoma y decisión |
| `plantillas` | Módulos JavaScript reutilizables, con su prueba |
| `adaptadores` | Conexión con Claude Code, Cursor, Copilot o cualquier modelo |
| `datos`, `herramientas` | Inventario de API, índices, validación, pruebas y actualización |

## Cuánto fiarse de cada dato

Cada afirmación relevante lleva marca: `[O]` oficial, `[C]` comprobado en el código, `[E]` ejecutado con prueba, `[P]` criterio práctico. Lo probado en apps reales consta como "laboratorio", con versión y fecha. Las cifras están en [`00-indice/estados.md`](00-indice/estados.md).

**Límites:** todos los bloques se ejecutan en Chrome y en Firefox de escritorio. Safari, iOS, Android y los lectores de pantalla no se han probado, y eso importa especialmente en una biblioteca de scroll: usa la [lista para dispositivo real](00-indice/pruebas-dispositivo.md). Lo táctil se probó con eventos sintéticos y emulación. Cada ficha indica qué quedó sin verificar.

## Licencia y atribución

Sistema independiente, sin relación oficial con los autores de Lenis. Lenis es MIT, © darkroom.engineering. Este sistema adapta su documentación a una síntesis propia en español y no redistribuye su código. Ver [`fun-licencia`](01-fundamentos/fun-licencia.md).
