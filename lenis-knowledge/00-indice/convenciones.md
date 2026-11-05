# Convenciones del sistema

Reglas de todas las fichas. Las comprueba `herramientas/validar.py`; `herramientas/probar_bloques.py` ejecuta los bloques.

## La ficha

Un archivo `.md` en una capa (`NN-nombre/<prefijo>-<slug>.md`). Trata **un solo tema**, se entiende sola y no pasa de 320 líneas. El front matter es la **fuente de verdad**: mapa, índices y `datos/` se generan de él.

```yaml
---
id: com-anidado             # = nombre de archivo sin .md
titulo: Scroll anidado
capa: 04-comportamiento
tipo: concepto              # concepto | api | plugin | guia | patron | diagnostico | referencia
ambito: core                # core, snap, react, vue o transversal
resumen: Una línea, máximo 180 caracteres.
api: [LenisOptions.allowNestedScroll, Lenis.scrollTo]   # símbolos de datos/api.json
requiere: [fun-modelo]
relacionadas: [opc-filtros]
etiquetas: [scroll, anidado]
fuentes:                    # rutas del corpus (admiten *) o URLs
  - README.md
estado: verificado          # verificado | revisar | borrador
version: 1.3.27
---
```

La URL pública de una fuente es `https://github.com/darkroomengineering/lenis/blob/main/` + ruta. Nombres en `api`: `Lenis.scrollTo`, `LenisOptions.lerp`, `ScrollToOptions.offset`, `Snap.add`, `SnapOptions.type`.

## Secciones por tipo

Tras el título, un párrafo breve: qué es y para qué.

| Tipo | Secciones obligatorias |
|---|---|
| `concepto` | Modelo mental · Ejemplo · Trampas |
| `api` | Firma · Ejemplo · Trampas |
| `plugin` | Para qué sirve · Registro · API · Ejemplo · Trampas |
| `guia` | Pasos · Trampas |
| `patron` | Problema · Solución · Trampas |
| `diagnostico` | Síntoma · Causa · Solución |
| `referencia` | — |

Títulos exactos con `##`.

## Procedencia

| Marca | Significado |
|---|---|
| `[O]` | **Oficial.** Lo dice la documentación del repositorio. No garantiza que sea cierto |
| `[C]` | **Código.** Comprobado leyendo el fuente o los tipos de esta versión |
| `[E]` | **Ejecutado.** Lo demuestra una `// prueba:` de esta ficha o de otra enlazada |
| `[P]` | **Práctico.** Criterio propio, razonado, no oficial |

Si la documentación y el código discrepan, gana el código, y va a `00-indice/contradicciones.md`. Un `[E]` sin prueba en el sistema debe ser `[C]`. No marques `[O]` sin contrastarlo con el código.

Lo probado fuera del arnés (apps reales, otro navegador) se indica como "laboratorio", con versión y fecha.

## Licencia

Lenis es MIT: su documentación y su código se pueden adaptar conservando el aviso de copyright (ver `README.md`). Aun así, escribe en español con estructura y ejemplos propios: una traducción del README no aporta nada.

## Agnosticismo tecnológico

El conocimiento vale para **cualquier tecnología**. Los frameworks son casos particulares, no la referencia.

- **Capas 01 a 05, 07 y 08** no dependen de ningún framework: JavaScript estándar y DOM. Sin JSX ni plantillas.
- **El ciclo es universal:** entrar, cambiar, salir, sobre aquello que se desplaza o se sincroniza (ventana, contenedor, escena). Di "al retirar la vista", nunca "al desmontar el componente". Evita: componente, hook, ref, montar, props, SPA, bundle, SSR como supuesto, efecto.
- **Tres vías de carga con el mismo rango:** empaquetador, `<script>` clásico y módulos nativos con import map.
- **Una trampa propia de un framework va a su ficha `int-*`.** Lo general se explica en general y enlaza [`int-contrato`](../06-integracion/int-contrato.md).
- **La capa 06 es de traducción.** `int-contrato` define lo común; cada `int-*` usa la misma tabla (entrar | cambiar | salir | ruta | sincronizar) y añade solo lo exclusivo, sin usar otro framework como referencia.
- **Plantillas:** JavaScript sin framework; reciben un objetivo y devuelven una función de limpieza.
- `validar.py` rechaza nombres de frameworks fuera de las capas 06, 09 y 10. Si una ficha debe nombrarlos, declara `excepcion_agnostica: <motivo>`.

## Estilo

Español neutro y directo. Identificadores sin traducir. Tablas para opciones, listas para trampas, sin relleno. **Trampas** es la sección más valiosa: error real, consecuencia y corrección. Enlaces relativos: `[anidado](../04-comportamiento/com-anidado.md)`.

## Código

Todo bloque lleva lenguaje. Los ```` ```js ```` **se ejecutan** en Chrome real, con Lenis y Snap globales (`Lenis`, `Snap`), y GSAP con ScrollTrigger si el bloque contiene `gsap`.

- El DOM sale de los selectores del código o del último ```` ```html ```` anterior de la ficha. Para que haya scroll, pon contenido alto: `<div style="height:4000px"></div>`.
- Fallan las excepciones y los `console.warn` o `console.error`.
- `// prueba: <expresión>` se evalúa dentro del bloque, 700 ms después de que termine, incluidos sus `await`, y ve el valor actual de cualquier variable.
- ```` ```js fragmento ```` no se ejecuta. ```` ```js invalido ```` es un contraejemplo.
- `import` y `export` se eliminan al ejecutar. Al final del bloque, llama a `lenis.destroy()` si la prueba lo permite.

Ayudas del arnés, solo para pruebas:

| Función | Uso |
|---|---|
| `rueda(deltaY, elemento?, deltaX?)` | `WheelEvent` real sobre el elemento, por defecto `documentElement` |
| `toque(tipo, x, y, elemento?)` | `TouchEvent` real: `"touchstart"`, `"touchmove"`, `"touchend"` |
| `espera(ms)` | Promesa con espera |

Límites del arnés: iframe de 1000×700 fuera de pantalla; `requestAnimationFrame` es un temporizador de 16 ms; `prefers-reduced-motion` es `no-preference`; `ResizeObserver` y el evento `scroll` pueden llegar tarde; un selector citado en el código genera ese elemento. Si Lenis no recibe `raf`, nada se mueve: usa `autoRaf: true`.

## Herramientas

Desde `herramientas/`: `python validar.py --capa NN-nombre` y `python probar_bloques.py --capa NN-nombre`. Para terminar: `generar_indices.py`, `validar.py` sin argumentos (exige cobertura total) **varias** pasadas de `probar_bloques.py --plantillas`, porque una sola pasada verde no descarta inestabilidad, y otra con `--firefox`, que ejecuta todo en un motor distinto. En Firefox, un iframe sin foco de ventana no dispara `focusin`.
