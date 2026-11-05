# Convenciones del sistema

Reglas de redacción y formato de todas las fichas. Las comprueba `herramientas/validar.py`; los bloques de código los ejecuta `herramientas/probar_bloques.py`.

## Unidad de conocimiento: la ficha

Una ficha es un archivo `.md` en una capa (`NN-nombre/<prefijo>-<slug>.md`). Trata **un solo tema**, se entiende sola y no pasa de 320 líneas. Si crece más, se divide. El front matter es la **fuente de verdad**: mapa, índices y `datos/` se generan a partir de él.

```yaml
---
id: scr-pin                 # = nombre de archivo sin .md; prefijo de la capa
titulo: Fijar elementos con pin
capa: 07-scroll
tipo: concepto              # concepto | api | plugin | guia | patron | diagnostico | referencia
ambito: ScrollTrigger       # core, nombre del plugin o "transversal"
resumen: Una línea, máximo 180 caracteres. Sirve para decidir si abrir la ficha.
api: [ScrollTrigger.Vars.pin, ScrollTrigger.Vars.pinSpacing]   # símbolos que documenta, deben existir en datos/api.json
requiere: [fun-modelo]      # ids que conviene leer antes (solo si es necesario de verdad)
relacionadas: [scr-scrub]   # ids vecinos
etiquetas: [scroll, layout]
fuentes:                    # rutas del corpus oficial (admiten *) o URLs completas
  - docs/v3/Plugins/ScrollTrigger.md
estado: verificado          # verificado | revisar | borrador
version: 3.15.1             # versión de GSAP contra la que se comprobó
---
```

La URL pública de una fuente es `https://gsap.com/` + ruta sin `.md`.

Nombres en `api`: `gsap.to`, `gsap.utils.clamp`, `gsap.ticker.add`, `Timeline.addLabel`, `Tween.resetTo`, `Animation.progress`, `ScrollTrigger.create`, `ScrollTrigger.Vars.pin`, `gsap.TweenVars.stagger`, etc.

## Secciones por tipo

Obligatorias (se pueden añadir otras). Tras el título va siempre un párrafo breve que responde "qué es y para qué".

| Tipo | Secciones obligatorias | Uso |
|---|---|---|
| `concepto` | Modelo mental · Ejemplo · Trampas | Ideas que explican cómo funciona |
| `api` | Firma · Ejemplo · Trampas | Método o grupo pequeño de métodos |
| `plugin` | Para qué sirve · Registro · API · Ejemplo · Trampas | Ficha de entrada de un plugin |
| `guia` | Pasos · Trampas | Procedimiento |
| `patron` | Problema · Solución · Trampas | Solución reutilizable con código probado |
| `diagnostico` | Síntoma · Causa · Solución | Algo falla y hay que saber por qué |
| `referencia` | — | Tablas y catálogos |

Títulos exactos, con `##`: `## Modelo mental`, `## Firma`, `## Para qué sirve`, `## Registro`, `## API`, `## Ejemplo`, `## Trampas`, `## Pasos`, `## Problema`, `## Solución`, `## Síntoma`, `## Causa`.

## Procedencia: oficial, técnico, práctico

Cada afirmación que no sea trivial lleva una marca, para que quien lea sepa cuánto fiarse:

| Marca | Significado |
|---|---|
| `[O]` | **Oficial.** Lo dice la documentación o los recursos de gsap.com |
| `[C]` | **Código.** Comprobado leyendo los tipos o el fuente de `gsap` en la versión indicada |
| `[E]` | **Ejecutado.** Comprobado en navegador real con `probar_bloques.py` |
| `[P]` | **Práctico.** Criterio propio de este sistema; razonado, pero no oficial |

Sin marca solo van definiciones triviales. No se marca cada oración: basta al final de la frase o de la lista a la que se aplica. Nunca presentes un criterio propio como oficial. Si la documentación y el código discrepan, gana el código, y la discrepancia se anota en `00-indice/contradicciones.md`.

## Licencia y redacción

La documentación de GSAP no declara una licencia que permita reutilizarla, así que se trata como protegida:

- **Síntesis propia.** Nada de traducir o parafrasear párrafo a párrafo: entender y explicar con estructura y palabras propias. Los nombres de API, valores y hechos técnicos sí son libres.
- **Ejemplos originales.** No copies los de la documentación. Escribe los tuyos, mínimos y con otros nombres de clases.
- `validar.py` rechaza secuencias de 9 palabras idénticas al texto oficial.
- `gsap-skills` es MIT: se puede adaptar citándolo. Si se usa, añade su URL a `fuentes`.

## Agnosticismo tecnológico

El conocimiento se escribe para **cualquier tecnología**, no para un framework. React, Vue, Next y compañía son casos particulares, no la referencia.

- **Las capas 01 a 11, 13 y 14 no dependen de ningún framework.** Explican GSAP con JavaScript estándar y el DOM. Sus ejemplos son `js`, sin JSX ni sintaxis de plantillas.
- **El concepto se nombra por lo que es.** Di "al retirar la vista", "un render diferido" o "un cambio de estado que se aplica después", nunca "en React". La herramienta universal de limpieza es `gsap.context()`.
- **Lo que se anima no siempre es DOM.** El contrato habla de un nodo, un objeto o una escena, y de tres momentos: entrar, cambiar y salir.
- **Una trampa propia de un framework va a su ficha de `12-frameworks`.** Si la causa es general (el DOM cambia después de tu código), se explica en términos generales en la capa que corresponda y se enlaza [`fra-agnostico`](../12-frameworks/fra-agnostico.md).
- **La capa 12 es de traducción.** [`fra-agnostico`](../12-frameworks/fra-agnostico.md) define el contrato de integración válido para cualquier tecnología; cada `fra-*` solo indica cómo se aplica allí y lo que sea exclusivo de esa tecnología. Cada ficha de framework lleva la misma tabla (`cambio | evento | salida | Flip tras actualizar | ruta`), se entiende sola y no toma otra tecnología como referencia.
- **Lo ejecutado fuera del arnés es "laboratorio", no `[E]`.** Indica versión, navegador y fecha, y conserva las fuentes en `_notas/`.
- **Las plantillas son JavaScript sin framework**: reciben un objetivo y devuelven una función de limpieza, y así encajan en cualquier ciclo de vida. Actúan sobre lo que existe al llamarlas: `plantillas/README.md` indica qué hacer si el contenido cambia. `plantillas/globales/` es su versión generada para `<script>` clásico.
- **La carga tiene tres vías del mismo rango**: empaquetador, `<script>` clásico y módulos con import map. El bloque `## Registro` de una ficha `plugin` muestra el `import` y, justo después, una línea fija `**Sin empaquetador:**` con su archivo de `dist/`, su global y su entrada del import map.
- `validar.py` rechaza nombres de frameworks y sus API fuera de las capas 12 y 15. Una ficha que deba nombrarlos de verdad (p. ej., para enumerar compatibilidades) declara el motivo en `excepcion_agnostica: <motivo>`.

Términos a evitar fuera de la capa 12, porque suponen una forma concreta de proyecto:

| No uses | Usa |
|---|---|
| SPA | navegación sin recarga |
| componente | vista, parte |
| hook, efecto (de un framework) | gancho, inicialización |
| ref | referencia, elemento |
| props | datos, opciones |
| bundle, bundler | tu JavaScript, empaquetador |
| build | compilación |
| en cliente | en el navegador |
| hidratación | arranque sobre HTML del servidor |
| "al montar" como momento de un framework | al entrar, cuando la vista exista |
| "los efectos corren dos veces" | tu inicialización corre dos veces (script incluido dos veces, recarga en caliente, modo de desarrollo) |

## Estilo

- Español neutro, directo, en impersonal o segunda persona. Identificadores, opciones y nombres de API sin traducir.
- Densidad alta: tablas para opciones, listas para trampas, sin relleno, sin introducciones ni "en resumen".
- Las **Trampas** son la parte más valiosa: errores reales, con su consecuencia y su corrección.
- Solo opciones que importan: lo exhaustivo va en una tabla compacta; no redactes prosa para cada opción.
- Enlaces entre fichas con ruta relativa: `[pin](../07-scroll/scr-pin.md)`.

## Código

Todo bloque lleva lenguaje. Los ```` ```js ```` **se ejecutan** en Chrome con GSAP y todos los plugins ya registrados:

- El bloque debe funcionar solo. El DOM se genera a partir de los selectores del código, o se toma del último bloque ```` ```html ```` anterior de la misma ficha.
- Fallan las excepciones y los avisos de GSAP (`Invalid property`, `target not found`).
- `// prueba: <expresión>` añade una aserción, evaluada dentro del bloque 700 ms después de que termine, incluidos sus `await`. Ve el valor actual de cualquier variable del bloque. Úsala siempre que el resultado sea comprobable: así un ejemplo pasa a ser `[E]`.
- ```` ```js fragmento ```` no se ejecuta: para trozos incompletos a propósito.
- ```` ```js invalido ```` es un contraejemplo: no se ejecuta ni se valida. Úsalo solo para mostrar qué no hacer.
- Con scroll, usa `window.scrollTo()` seguido de `ScrollTrigger.update()`: el evento `scroll` puede llegar con retraso en el arnés.
- Un selector citado en el código genera ese elemento, así que no sirve para probar un objetivo inexistente. Un bloque `html` con `<script>` se ejecuta.
- En el arnés `prefers-reduced-motion` vale `no-preference`. GSDevTools solo se carga en los bloques que lo nombran, porque desactiva `autoRemoveChildren` en la raíz y altera el comportamiento.
- Las aserciones deben valer también en Firefox (`--firefox`, en tiempo real): nada de cadenas de `transform` ni textos de error, y el ancho de barra, medido. Ver [depuración](../13-calidad/cal-depuracion.md#trampas).
- `[O]` significa que lo dice la documentación, no que sea cierto: los fallos detectados se concentran en afirmaciones oficiales no contrastadas con el código. Si un `[E]` no tiene `// prueba:` en la ficha, márcalo `[C]` o escribe la prueba.
- `import` y `export` se eliminan al ejecutar, así que se pueden incluir por realismo. `registerPlugin` también es inocuo.
- JSX, Vue y Svelte (`jsx`, `tsx`, `vue`, `svelte`) no se ejecutan, pero sí se comprueba que los métodos existan.

## Herramientas

Tras editar: `python validar.py --capa NN-nombre` y `python probar_bloques.py --capa NN-nombre`, desde `herramientas/`. Para terminar: `generar_indices.py` y `validar.py` sin argumentos, que además exige la cobertura total.
