---
id: com-sticky-fixed
titulo: position sticky y fixed
capa: 04-comportamiento
tipo: concepto
ambito: core
resumen: sticky y fixed funcionan sin adaptación porque Lenis escribe el scroll real. Excepciones: ancestros, contenedores y el efecto de Snap en sticky.
api: [Lenis.scrollTo, SnapElementOptions.ignoreSticky]
requiere: [fun-modelo]
relacionadas: [snp-elementos, cal-limitaciones, com-stop-start]
etiquetas: [sticky, fixed, posicionamiento]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# `position: sticky` y `fixed`

Funcionan sin configuración: no hay `transform` en el documento y el navegador calcula su posición con el scroll real, como en cualquier página. Es la ventaja directa frente al scroll simulado. [C] [E]

## Modelo mental

| Caso | Resultado |
|---|---|
| `sticky` en ventana | Normal [E] |
| `fixed` en ventana | Normal [E] |
| `sticky` en contenedor `wrapper` | Se pega al contenedor, como con su scroll nativo [P] |
| `fixed` dentro de un ancestro con `transform` | Se ancla al ancestro: es CSS, no Lenis [P] |
| Página parada con `stop()` | Siguen en su sitio: `clip` no recoloca nada [E] |

El README recoge que `fixed` puede ir retrasado en macOS Safari anterior a M1, y remite a una incidencia del repositorio. No se ha probado. [O]

## Ejemplo

```html
<div id="pegado" style="position:sticky;top:0;height:30px"></div>
<div id="fijo" style="position:fixed;top:10px;left:0;height:20px;width:20px"></div>
<div style="height:3000px"></div>
```

```js
const lenis = new Lenis();
lenis.scrollTo(1000, { immediate: true });
await espera(50);
const pegado = document.getElementById("pegado").getBoundingClientRect().top;
const fijo = document.getElementById("fijo").getBoundingClientRect().top;
const transformado = getComputedStyle(document.body).transform;

lenis.stop();
await espera(30);
const pegadoParado = document.getElementById("pegado").getBoundingClientRect().top;
const y = window.scrollY;
lenis.destroy();
// prueba: pegado === 0 && fijo === 10 && transformado === "none"
// prueba: pegadoParado === 0 && y === 1000
```

## Trampas

- **`sticky` que no se pega.** Casi siempre es un ancestro con `overflow` distinto de `visible`. Incluye el `overflow: clip` de un contenedor propio, pero no el de `stop()`, que está en la raíz. [P]
- **`lenis/snap` borra `sticky` de los ancestros.** Con `ignoreSticky`, activa por defecto, un ancestro `sticky` queda en `position: static` para siempre. Fallo real de la versión. Ver [`snp-elementos`](../05-snap/snp-elementos.md). [E]
- **Saltos al usar `sticky` en un contenedor con escalado o `transform`.** Lenis no los causa, pero se notan más con suavizado. [P]
- **Un `scrollTo` a un elemento `sticky` ya pegado.** `getBoundingClientRect` da su posición pegada, no la original, y el destino es la posición actual. Apunta a un elemento hermano sin `sticky`. [C]
