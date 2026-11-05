---
id: com-dimensiones
titulo: Dimensiones, limit y resize
capa: 04-comportamiento
tipo: concepto
ambito: core
resumen: limit se guarda en caché con 250 ms de retardo: consecuencias tras cambiar contenido, y las salidas: resize(), autoResize y naiveDimensions.
api: [LenisOptions.autoResize, LenisOptions.naiveDimensions, LenisOptions.content, Lenis.resize, Lenis.limit, Lenis.dimensions]
requiere: [fun-modelo]
relacionadas: [opc-contenedores, api-metodos, cal-errores]
etiquetas: [dimensiones, limit, resize, observer]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Dimensiones, `limit` y `resize`

Lenis no lee el DOM en cada gesto: guarda ancho, alto y altura de contenido en `lenis.dimensions`, y calcula `limit` con ellos. Es rápido, pero tiene un retardo: durante un instante, puede creer que la página mide lo que medía antes. [C] [E]

## Modelo mental

```text
limit = scrollHeight − alto visible            (en vertical)
```

| Modo | Cuándo se actualiza | Coste |
|---|---|---|
| `autoResize: true` (por defecto) | `resize` y `ResizeObserver`, con **250 ms** de retardo | Bajo |
| `autoResize: false` | Solo con `lenis.resize()` | Mínimo |
| `naiveDimensions: true` | En cada lectura de `limit`, desde `rootElement` | Lee el DOM a cada gesto |

`lenis.dimensions` expone `width`, `height`, `scrollWidth`, `scrollHeight` y `limit`, un objeto `{ x, y }`. `lenis.limit` es la componente del eje. [C]

La actualización automática solo recalcula dimensiones: no emite `scroll` ni corrige el destino. En cambio `lenis.resize()` sincroniza `animatedScroll` y `targetScroll` con la posición real y emite `scroll`. [C] [E]

## Ejemplo

El límite va retrasado respecto al contenido, y `scrollTo` queda corto:

```js
const lenis = new Lenis();
const antes = lenis.limit;
const extra = document.createElement("div");
extra.style.height = "1000px";
document.body.append(extra);

lenis.scrollTo("bottom", { immediate: true });
const corto = lenis.scroll;
await espera(1200); // margen sobre el retardo de 250 ms
const despues = lenis.limit;
const sigueCorto = lenis.scroll;
lenis.destroy();
// prueba: corto === antes && despues === antes + 1000 && sigueCorto === antes
```

`resize()` lo arregla al momento, y es la única vía con `autoResize: false`:

```js
const lenis = new Lenis({ autoResize: false });
const antes = lenis.limit;
const extra = document.createElement("div");
extra.style.height = "1000px";
document.body.append(extra);
await espera(800);
const sinCambio = lenis.limit;

let avisos = 0;
lenis.on("scroll", () => avisos++);
lenis.resize();
const conResize = lenis.limit;
lenis.destroy();
// prueba: sinCambio === antes && conResize === antes + 1000 && avisos === 1
```

`naiveDimensions` no tiene retardo:

```js
const lenis = new Lenis({ naiveDimensions: true });
const antes = lenis.limit;
const extra = document.createElement("div");
extra.style.height = "1000px";
document.body.append(extra);
const inmediato = lenis.limit;
lenis.destroy();
// prueba: inmediato === antes + 1000
```

Patrón al insertar contenido y saltar a él:

```js
function anadirYBajar(lenis, nodo) {
  document.body.append(nodo);
  lenis.resize();
  lenis.scrollTo("bottom", { immediate: true });
}

const lenis = new Lenis();
const nodo = document.createElement("div");
nodo.style.height = "1000px";
anadirYBajar(lenis, nodo);
const llega = lenis.scroll === document.documentElement.scrollHeight - window.innerHeight;
lenis.destroy();
// prueba: llega
```

## Trampas

- **`scrollTo` tras insertar contenido.** Se limita al valor antiguo. Llama a `lenis.resize()` antes, o espera al retardo. Si hay inercia, `resize()` no la corta: ver [`int-navegacion`](../06-integracion/int-navegacion.md). [C] [E]
- **Imágenes sin dimensiones.** Cada carga cambia la altura y dispara el observador: `width` y `height` en el HTML evitan el recálculo, y que los anclajes queden desplazados. [P]
- **Alto de ventana con barra horizontal.** En ventana, el alto visible es `innerHeight`, que incluye esa barra, y `limit` queda corto en esa medida. En contenedor se usa `clientHeight`. `naiveDimensions` lo evita, ya que resta `clientHeight`. [C]
- **`height: 100%` en `html` y `body`.** Puede recortar `scrollHeight`. `lenis.css` lo anula. Ver [`fun-css`](../01-fundamentos/fun-css.md). [P]
- **`content` en contenedores.** No aporta medida. Solo avisa. Ver [`opc-contenedores`](../02-opciones/opc-contenedores.md). [C]
- **Barra de direcciones en móvil.** Cambia `innerHeight` y dispara `resize`. Sin verificar en dispositivo. [P]
- **Contenedor con cambios constantes.** Un `ResizeObserver` con retardo no dispara mientras sigan llegando cambios: durante una animación de altura, `limit` queda congelado hasta que para. [C]
