# Plantillas

Código listo para copiar a un proyecto, con o sin empaquetador. Cada plantilla es un archivo sin más dependencia que `gsap` y sus plugins, y sigue el mismo contrato:

```js
const limpiar = nombre(raiz.querySelectorAll(".pieza"), opciones);
// ...
limpiar(); // al retirar la vista
```

- **Devuelve una función de limpieza.** Tras llamarla no quedan estilos en línea, listeners, clones ni `ScrollTrigger`.
- **Usa `gsap.context()`**, y dentro `gsap.matchMedia()` para dos ramas según `prefers-reduced-motion`. Si la preferencia cambia, la rama se sustituye sin recargar.
- **`objetivo`** acepta selector, elemento, array o NodeList. Un selector busca en todo el documento: acota con elementos de tu raíz, como en el ejemplo. Dentro de Shadow DOM, pasar elementos es obligatorio, porque un selector no atraviesa la sombra.
- **La limpieza no depende del motor.** `ctx.revert()` deshace los empates en distinto orden en Chrome y Firefox ([detalle](../02-nucleo/nuc-context.md#trampas)). Si una plantilla captura varias veces la misma propiedad de un elemento, restaura ese estado por su cuenta.
- **Actúa sobre lo que existe al llamarla.** Ver [Cuando cambia el contenido](#cuando-cambia-el-contenido).

## Catálogo

| Plantilla | Receta | Plugins | Con movimiento reducido |
|---|---|---|---|
| `revelarScroll.js` | [Revelar al hacer scroll](../14-recetas/rec-revelar-scroll.md) | ScrollTrigger | Contenido visible, sin animar |
| `parallax.js` | [Parallax](../14-recetas/rec-parallax.md) | ScrollTrigger | Sin efecto |
| `pinHorizontal.js` | [Pin horizontal](../14-recetas/rec-pin-horizontal.md) | ScrollTrigger | Scroll horizontal nativo |
| `marquee.js` | [Marquesina](../14-recetas/rec-marquee.md) | — | Lista estática con scroll nativo |
| `titularTexto.js` | [Titular](../14-recetas/rec-titular-texto.md) | SplitText, ScrollTrigger | Texto intacto, sin dividir |
| `seguidorCursor.js` | [Seguidor de cursor](../14-recetas/rec-seguidor-cursor.md) | — | Seguidor oculto |
| `botonMagnetico.js` | [Botón magnético](../14-recetas/rec-boton-magnetico.md) | — | Sin efecto |
| `secuenciaImagenes.js` | [Secuencia de imágenes](../14-recetas/rec-secuencia-imagenes.md) | ScrollTrigger | Un fotograma fijo |
| `contador.js` | [Contador](../14-recetas/rec-contador.md) | ScrollTrigger | Valor final directo |
| `transicionFlip.js` | [Flip](../14-recetas/rec-transicion-flip.md) | Flip | Cambio sin animar |
| `acordeon.js` | [Acordeón](../14-recetas/rec-acordeon.md) | — | Abre y cierra al instante |
| `transicionPaginas.js` | [Páginas](../14-recetas/rec-transicion-paginas.md) | ScrollTrigger | Duración 0, misma navegación |

## Opciones

| Plantilla | Opciones (valor por defecto) |
|---|---|
| `revelarScroll` | `y` (40), `duracion` (0.6), `ease` ("power2.out"), `stagger` (0.08), `inicio` ("top 85%"), `intervalo` (0.1), `maximoLote`, `repetir` (false) |
| `parallax` | `distancia` (15), `suavizado` (true), `disparador` (el padre). Por elemento: `data-distancia` |
| `pinHorizontal` | `pista` (primer hijo), `suavizado` (1), `ajustar` (false), `alCrear` |
| `marquee` | `velocidad` (80 px/s), `direccion` ("izquierda"), `pausar` (true) |
| `titularTexto` | `tipo` ("lines"), `duracion` (0.7), `stagger` (0.08), `ease` ("power3.out"), `desplazamiento` (110), `alEntrar` (false), `inicio` ("top 85%") |
| `seguidorCursor` | `duracion` (0.4), `ease` ("power3"), `zona` (window) |
| `botonMagnetico` | `fuerza` (0.35), `duracion` (0.3), `ease` ("power3") |
| `secuenciaImagenes` | `urls` (obligatoria), `disparador`, `inicio` ("top top"), `fin` ("+=200%"), `fijar` (true), `suavizado` (0.5), `fotogramaEstatico` (último) |
| `contador` | `hasta` (o `data-hasta`), `desde` (0), `decimales` (0), `idioma`, `formato`, `duracion` (1.5), `ease` ("power1.out"), `alEntrar` (true), `inicio` ("top 85%") |
| `transicionFlip` | `cambio` (obligatoria; puede devolver una promesa), `disparador`, `evento` ("click"), `duracion` (0.5), `ease` ("power2.inOut"), `stagger` (0), `absolute` (true), `escala` (false). Devuelve además `limpiar.ejecutar()` |
| `acordeon` | `botones` ("[aria-controls]"), `duracion` (0.3), `ease` ("power2.inOut"), `unico` (true) |
| `transicionPaginas` | `cargar`, `enlaces` ("a[data-transicion]"), `salida` (0.25), `entrada` (0.35), `y` (16), `registrar`, `alCambiar` |

El detalle está en el JSDoc de cada archivo, y las trampas, en su receta.

## Copiar a un proyecto

Elige la vía por cómo llega tu JavaScript al navegador. Las tres están probadas, con la misma plantilla y el mismo resultado. Detalle y trampas: [vías de carga](../01-fundamentos/fun-instalacion.md).

| Vía | Copia | Carga GSAP con | Llamas a |
|---|---|---|---|
| Empaquetador | `plantillas/<nombre>.js` | `npm install gsap` | `import { nombre } from "./<nombre>.js"` |
| `<script>` clásico | `plantillas/globales/<nombre>.js` | `dist/gsap.min.js` y los plugins de la plantilla, antes | `Plantillas.nombre(...)` |
| Módulos nativos | `plantillas/<nombre>.js`, sin tocarlo | import map, con una entrada por plugin que use | `import { nombre } from "./<nombre>.js"` |

Copia solo ese archivo: `.html` y `.prueba.js` son del arnés de pruebas. No edites las copias de `globales/`: las genera `herramientas/plantillas_globales.py` y llevan en la cabecera lo que debes cargar antes. Quitar a mano `import` y `export` del módulo es frágil: si queda un `export`, el script entero falla con `Unexpected token 'export'`.

Con empaquetador:

```js fragmento
import { revelarScroll } from "./animacion/revelarScroll.js";

const limpiar = revelarScroll(raiz.querySelectorAll(".tarjeta"), { y: 24 });
```

Con `<script>` clásico:

```text
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js"></script>
<script src="/js/revelarScroll.js"></script>
<script>
  const raiz = document.querySelector("#vista");
  const limpiar = Plantillas.revelarScroll(raiz.querySelectorAll(".tarjeta"), { y: 24 });
</script>
```

Con módulos nativos:

```text
<script type="importmap">
{
  "imports": {
    "gsap": "https://cdn.jsdelivr.net/npm/gsap@3.15.1/index.js",
    "gsap/ScrollTrigger": "https://cdn.jsdelivr.net/npm/gsap@3.15.1/ScrollTrigger.js"
  }
}
</script>
<script type="module">
  import { revelarScroll } from "/js/revelarScroll.js";

  const raiz = document.querySelector("#vista");
  const limpiar = revelarScroll(raiz.querySelectorAll(".tarjeta"), { y: 24 });
</script>
```

Al retirar la vista, en el punto que ofrezca tu tecnología, llama a `limpiar()`. Hazlo siempre: la plantilla crea listeners y restaura estilos a mano, y revertir un contexto externo no cubre eso. Dónde conectar ambos puntos: [contrato de integración](../12-frameworks/fra-agnostico.md).

## Cuando cambia el contenido

Las plantillas capturan elementos y valores al llamarlas. Lo que aparezca o cambie después no se recoge solo:

| Cambio | Plantillas | Qué hacer |
|---|---|---|
| La lista crece | `revelarScroll` | Llama solo con los nuevos y guarda todas las limpiezas. Con la lista entera, ocultarías lo ya visible. [E] |
| La lista crece | `parallax`, `botonMagnetico`, `titularTexto` | Igual: una llamada por tanda de elementos nuevos. [P] |
| La lista cambia | `transicionFlip` | Pasa una función como objetivo: `() => lista.children`. [E] |
| Cambia el dato | `contador` | Limpia y llama de nuevo con `desde` igual al valor anterior. [E] |
| Cambia la estructura | `marquee`, `pinHorizontal`, `acordeon`, `secuenciaImagenes` | Limpia y llama de nuevo. `acordeon` vuelve al `aria-expanded` que tenía al llamarlo. [P] |
| Enlaces nuevos | `transicionPaginas` | Nada: escucha en `document`, y los enlaces nuevos ya cuentan. [C] |

## Requisitos de marcado y CSS

| Plantilla | Hace falta |
|---|---|
| `pinHorizontal` | Pista con `display: flex` y `width: max-content`, o hijos con `flex: none` |
| `marquee` | Primer hijo como pista, con `display: flex` y `width: max-content`; imágenes con `width` y `height` |
| `parallax` | Padre con `overflow: hidden`; hijo más alto y centrado |
| `secuenciaImagenes` | Canvas con tamaño fijado por CSS |
| `acordeon` | Botón con `aria-expanded` y `aria-controls`; panel con `id` y padding en un hijo interior |
| `transicionPaginas` | Contenedor con `id`, si se usa la carga por defecto; enlaces con `data-transicion` |

## Pruebas

```bash
cd herramientas
python3 probar_bloques.py --plantillas --capa 14-recetas
python3 plantillas_globales.py            # regenera globales/ tras editar una plantilla
python3 plantillas_globales.py --comprobar # falla si alguna copia está desfasada
python3 plantillas_globales.py --probar    # pasa cada .prueba.js contra su copia global
```

Con `python3 probar_bloques.py --plantillas --firefox` se ejecuta lo mismo en Firefox, en tiempo real.

El arnés concatena `<nombre>.js` y `<nombre>.prueba.js`, quita `import`/`export` y ejecuta en Chrome real con el DOM de `<nombre>.html`. Las aserciones son los comentarios `// prueba: <expr>`, evaluados 700 ms después de que termine el bloque, incluidos sus `await`.

Cada prueba cubre la rama normal, la reducida (simulando `window.matchMedia`) y la limpieza. `acordeon` y `botonMagnetico` repiten la limpieza forzando los dos órdenes de `revert()`, para que un fallo de Firefox se vea también en Chrome. Sus límites conocidos:

- `marquee`: el `ResizeObserver` está sustituido por un doble.
- `secuenciaImagenes`: el `ResizeObserver` real no llega a dispararse con cambios de tamaño.
- `transicionPaginas`: `fetch` y `history.pushState` por defecto no se ejecutan; se inyectan `cargar` y `registrar`.
- `seguidorCursor` y `botonMagnetico`: `(hover: hover)` se simula.
