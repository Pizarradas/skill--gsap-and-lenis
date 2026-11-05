---
id: fun-cuando-usarlo
titulo: Cuándo usar Lenis y cuándo no
capa: 01-fundamentos
tipo: concepto
ambito: transversal
resumen: Criterios para decidir: sincronizar escenas y efectos justifica Lenis; una web de contenido o una tabla de datos rara vez. Costes y alternativas nativas.
api: [LenisOptions.syncTouch, LenisOptions.respectReducedMotion]
requiere: [fun-que-es, fun-modelo]
relacionadas: [cal-accesibilidad, cal-rendimiento, cal-limitaciones, int-canvas-webgl]
etiquetas: [decision, criterio, alternativas]
fuentes:
  - MANIFESTO.md
  - README.md
estado: verificado
version: 1.3.27
---
# Cuándo usar Lenis y cuándo no

Lenis resuelve un problema concreto: tener **una posición de scroll única, en el hilo principal, sincronizable**. Si no necesitas eso, el coste rara vez compensa. Casi todo lo de esta ficha es criterio propio. [P]

## Modelo mental

Decide por lo que ganas, no por la sensación de suavidad:

| Situación | Recomendación | Motivo |
|---|---|---|
| Escena `canvas`/WebGL alineada con DOM | Sí | Es el caso para el que nació [O] |
| Animaciones ligadas al scroll con muchos efectos | Sí | Una sola fuente de tiempo y posición |
| Portada de marca con desplazamiento cuidado | Sí, con criterio | Efecto buscado; respeta movimiento reducido |
| Secciones que encajan al scroll | Con `lenis/snap` | CSS `scroll-snap` no es compatible con Lenis [O] |
| Blog, documentación, comercio, aplicación | No por defecto | Gana el scroll nativo: previsible y compositado |
| Tablas enormes, listas virtualizadas, muchos anidados | Normalmente no | Conflictos de scroll y coste por fotograma |
| Solo un `scrollTo` animado | No | `scrollTo({ behavior: "smooth" })` basta |

Costes reales, con su fuente:

- **Hilo principal.** El scroll con rueda deja de ser compositado: si JavaScript se bloquea, la rueda se atasca. [C]
- **Sensación en dispositivos.** Trackpads y rueda de alta resolución ya traen inercia del sistema; la inercia añadida puede sentirse lenta. [P]
- **Una pieza más.** Anidados, modales, `iframe` y anclas requieren configuración. Ver [`cal-limitaciones`](../07-calidad/cal-limitaciones.md). [O]
- **Toque.** Por defecto no se suaviza, y es lo correcto: `syncTouch` imita el gesto nativo y nunca es igual. Ver [`opc-tactil`](../02-opciones/opc-tactil.md). [C]

Alternativas nativas a considerar antes:

| Necesidad | Sin Lenis |
|---|---|
| Ir suave a un punto | `element.scrollIntoView({ behavior: "smooth" })` |
| Secciones que encajan | CSS `scroll-snap-type` |
| Efecto ligado al scroll | CSS `animation-timeline: scroll()`, en navegadores que lo admitan |
| Saber si algo entra en pantalla | `IntersectionObserver` |

## Ejemplo

Una adopción prudente: sin suavizado táctil, con movimiento reducido respetado (ya es el valor por defecto) y solo si el dispositivo tiene puntero fino.

```js
const hayPunteroFino = matchMedia("(pointer: fine)").matches;

function iniciarScroll() {
  if (!hayPunteroFino) return () => {};
  const lenis = new Lenis({ autoRaf: true, respectReducedMotion: true, syncTouch: false });
  return () => lenis.destroy();
}

const limpiar = iniciarScroll();
limpiar();
// prueba: typeof limpiar === "function"
```

## Trampas

- **Adoptarlo por una sensación.** Si nadie echaría de menos el efecto, sobra. Prueba la página con rueda de ratón, trackpad y sin JavaScript antes de decidir.
- **Combinarlo con CSS `scroll-snap`.** No es compatible: usa [`snp-snap`](../05-snap/snp-snap.md) o renuncia a Lenis en esa vista. [O]
- **Aplicarlo a un contenedor de datos.** Si la parte difícil es una tabla con scroll propio, deja que sea nativa con [`data-lenis-prevent`](../04-comportamiento/com-anidado.md).
- **Ignorar el movimiento reducido.** `respectReducedMotion: false` existe, pero desactivarlo perjudica a quien lo pidió. Ver [`cal-accesibilidad`](../07-calidad/cal-accesibilidad.md).
