# GSAP + Lenis: orquestación

Decide en cada proyecto si usar GSAP, Lenis, los dos o ninguno, y evita que se contradigan. No repite lo que enseñan las bases: añade lo que aparece **al combinarlas**, demostrado ejecutando ambas a la vez en navegadores reales.

Gsap 3.15.1 + lenis 1.3.27, en Chrome 156 y Firefox 159.

## Uso en un minuto

```bash
python3 herramientas/decidir.py --lista
python3 herramientas/decidir.py scroll-suave pin
python3 herramientas/auditar_proyecto.py /ruta/del/proyecto
```

`decidir.py` da el perfil, el arranque, qué leer y qué queda prohibido. `auditar_proyecto.py` compara el perfil declarado con lo que hace el código y señala cada conflicto con su regla.

| Perfil | Para qué | Peso gzip |
|---|---|---|
| `ninguno` | CSS y JavaScript nativos bastan | 0 |
| `gsap` | Secuencias, `pin`, `scrub`, Flip, texto, SVG, con scroll nativo | 28-46 kB |
| `lenis` | Scroll suave sin animación compleja | 5 kB |
| `gsap+lenis` | Animación compleja y scroll suave | 52 kB |
| `gsap-smoother` | Como el anterior, si importan teclado y barra suavizados o `data-speed` | 52 kB |

El orden real de elección está en [`orq-que-usar`](01-decidir/orq-que-usar.md): empieza por lo mínimo, y `pin` o `scrub` no piden scroll suave.

## Estructura

| Carpeta | Contenido |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Entrada única para modelos y personas |
| [`01-decidir/`](01-decidir/orq-que-usar.md) | Qué usar según lo que se pide |
| [`02-reglas/`](02-reglas/orq-propiedad.md) | Un dueño por responsabilidad, y qué cambia de cada ficha de las bases |
| [`03-ciclo/`](03-ciclo/orq-ciclo.md) | Entrar, cambiar, salir, navegar y movimiento reducido en cada perfil |
| `04-combinaciones/` | Cada interacción, con su medida: ver el [mapa](00-indice/mapa.md) |
| [`plantillas/`](plantillas/README.md) | `orquestador.js`, una sola API para los cinco perfiles |
| [`00-indice/`](00-indice/reglas.md) | Reglas O01–O33, mapa, [lo no verificado](00-indice/sin-verificar.md) |
| `datos/` | `reglas.json`, `necesidades.json`, `bases.lock.json` |
| `herramientas/` | Decisión, auditoría, validación y pruebas. Solo Python 3 estándar; las pruebas de navegador piden Chrome o Firefox |
| [`adaptadores/`](adaptadores/README.md) | Conexión con Claude, Cursor, Copilot y otros |
| `gsap-knowledge/`, `lenis-knowledge/` | Las dos bases, sin modificar |

## En un proyecto

Copia `plantillas/orquestador.js` y crea `movimiento.perfil` con el nombre del perfil. La aplicación llama a `mov.irA`, `mov.bloquear` o `mov.añadir`, y cambiar de perfil es cambiar el arranque. Funciona con empaquetador, `<script>` clásico y módulos nativos, en cualquier tecnología.

## Licencia y atribución

Sistema independiente, sin relación oficial con GSAP, Webflow ni los autores de Lenis, publicado para uso propio. No redistribuye el código de ninguna biblioteca: se instalan aparte, cada una con su licencia.

- **GSAP** y sus nombres pertenecen a sus titulares. Su uso se rige por la [licencia estándar](https://gsap.com/standard-license), resumida en [`fun-licencia`](gsap-knowledge/01-fundamentos/fun-licencia.md), que es gratuita pero no de código abierto.
- **Lenis** es MIT, © darkroom.engineering. Ver [`fun-licencia`](lenis-knowledge/01-fundamentos/fun-licencia.md).

El texto de las bases es una síntesis propia a partir de la documentación oficial. Lo que no está probado se recoge en [`sin-verificar`](00-indice/sin-verificar.md).
