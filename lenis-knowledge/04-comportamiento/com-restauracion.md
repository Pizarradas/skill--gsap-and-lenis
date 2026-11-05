---
id: com-restauracion
titulo: Restauración de scroll y cambios de vista
capa: 04-comportamiento
tipo: concepto
ambito: core
resumen: Lenis no toca history.scrollRestoration. Qué pasa al recargar, cómo fijar la posición al cambiar de vista sin recarga y el estado que puede quedar colgado.
api: [Lenis.scrollTo, Lenis.resize, Lenis.isScrolling, LenisOptions.stopInertiaOnNavigate, ScrollToOptions.immediate, ScrollToOptions.force]
requiere: [fun-modelo]
relacionadas: [opc-automatico, com-dimensiones, rec-navegacion, int-contrato]
etiquetas: [restauracion, navegacion, historial, recarga]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Restauración de scroll

El código de Lenis no menciona `history.scrollRestoration`. La restauración del navegador sigue activa, y Lenis la adopta porque toma la posición real: al crearse, y por el evento `scroll` después. [C] [E]

## Modelo mental

| Momento | Qué pasa |
|---|---|
| `new Lenis()` | `targetScroll = animatedScroll = actualScroll` |
| Recarga, restauración posterior a crear la instancia | Llega como `scroll` nativo y se sincroniza |
| `scrollRestoration = 'manual'` | La página arranca en 0 |
| Cambio de vista sin recarga | Nada: Lenis sigue en la posición antigua y con `limit` antiguo |

Resultados de una recarga real (laboratorio: Chrome 156, 2026-11-05; scroll a 1500):

| Configuración | `scrollY` | `lenis.scroll` | `isScrolling` |
|---|---|---|---|
| Restauración `auto`, instancia creada al cargar | 1500 | 1500 | **`'native'`, sin volver a `false`** |
| Restauración `manual` | 0 | 0 | `false` |

Ese `'native'` colgado se debe a que el evento llega sin diferencia de posición: `velocity` es 0, y el temporizador de 400 ms solo se programa con velocidad distinta de 0. La clase `lenis-scrolling` sigue puesta hasta el siguiente scroll. [C] (laboratorio)

## Ejemplo

Lenis nace en la posición actual:

```js
window.scrollTo({ top: 400, behavior: "instant" });
const lenis = new Lenis();
const r = { scroll: lenis.scroll, destino: lenis.targetScroll };
lenis.destroy();
// prueba: r.scroll === 400 && r.destino === 400
```

Cambio de vista sin recarga, con una instancia parada y sin inercia en curso. Hay que cortar, medir y colocar en el mismo paso. El orden, y por qué `resize()` no puede ir primero, está en [`int-navegacion`](../06-integracion/int-navegacion.md):

```html
<main id="vista"><div id="alto" style="height:3000px"></div></main>
```

```js
function cambiarVista(lenis, pintar) {
  pintar();
  const salto = { immediate: true, force: true };
  lenis.scrollTo(lenis.targetScroll ? 0 : 1, salto); // corta
  lenis.resize();                                    // mide
  lenis.scrollTo(0, salto);                          // coloca
}

const lenis = new Lenis();
const limiteAntes = lenis.limit;
lenis.scrollTo(2000, { immediate: true });
const antes = lenis.scroll;

lenis.stop(); // un modal quedó abierto en la vista anterior
cambiarVista(lenis, () => {
  document.getElementById("alto").style.height = "1000px";
});
const despues = { scroll: lenis.scroll, real: window.scrollY, limite: lenis.limit };
lenis.start();
lenis.destroy();
// prueba: antes === 2000 && despues.scroll === 0 && despues.real === 0
// prueba: despues.limite === limiteAntes - 2000
```

## Trampas

- **`scrollTo(0)` animado al cambiar de vista.** Se ve el contenido nuevo desplazándose. Usa `immediate: true`. [P]
- **Sin `force` con la instancia parada.** El `scrollTo` se ignora y la vista nueva abre desplazada. [C] [E]
- **Sin `resize()`.** Durante 250 ms `limit` es el anterior: `scrollTo` a un ancla profunda queda corto. [E] en [`com-dimensiones`](com-dimensiones.md)
- **Inercia al pulsar un enlace.** `stopInertiaOnNavigate` la corta si es un `<a>` de otra ruta. Ver [`opc-automatico`](../02-opciones/opc-automatico.md). [C]
- **Contenedor.** `scrollRestoration` es de la ventana: un contenedor no se restaura, y la posición la guardas tú. Lo demás de esta ficha vale igual con `wrapper`, salvo la recarga real, que solo se midió en ventana. [C]
- **Restaurar a mano la posición guardada.** Hazlo cuando el contenido ya mida lo que debe, tras `resize()`, o `scrollTo` se quedará en el límite. [P]
- **Navegación atrás y caché de página completa.** No se ha probado cómo se conserva la instancia. Si tu entorno usa esa caché, verifícalo. [P]
