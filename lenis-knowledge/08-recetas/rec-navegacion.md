---
id: rec-navegacion
titulo: Cambio de vista sin recarga
capa: 08-recetas
tipo: patron
ambito: core
resumen: Coloca el scroll al cambiar de vista, arriba, en el hash o en la posición guardada, cortando inercia y con el límite actualizado.
api: [Lenis.resize, Lenis.scrollTo, ScrollToOptions.immediate, ScrollToOptions.force, LenisOptions.stopInertiaOnNavigate, Lenis.limit]
requiere: [com-restauracion, int-contrato]
relacionadas: [com-anclas, com-stop-start, rec-menu-anclas]
etiquetas: [navegacion, historial, restauracion, plantilla]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Cambio de vista sin recarga

Cuando una aplicación sustituye el contenido sin cargar otra página, el navegador no coloca el scroll. Plantilla: `plantillas/navegacionScroll.js` con módulos, o `plantillas/globales/navegacionScroll.js` con `<script>` clásico, que expone `Plantillas.navegacionScroll`. Ver [cómo copiarla](../plantillas/README.md#copiar-a-un-proyecto).

## Problema

Tras cambiar de vista quedan tres fallos: la inercia del gesto anterior sigue en la vista nueva, `limit` conserva la altura antigua y recorta el destino, y volver atrás no recupera la posición.

## Solución

En orden: **corta, mide y coloca**, seguido, sin esperar un fotograma:

1. **Corta.** `scrollTo` con `immediate` llama por dentro a `reset`, que para la animación [C], pero solo si el destino difiere de `targetScroll`: si coincide, `scrollTo` vuelve antes de mirar `immediate` y la inercia sigue [C] [E]. Por eso el corte apunta a un valor que seguro difiere.
2. **Mide.** `lenis.resize()` actualiza `limit`, iguala `targetScroll` al scroll real y no para la animación [C].
3. **Coloca.** Otro `scrollTo` al destino real. `force` evita que una instancia parada lo ignore [C].

El orden corto `scrollTo` y `resize()` no basta: recorta un destino guardado con el límite antiguo, y no corta si `targetScroll` ya era el destino. Laboratorio, Chrome real con rAF real, 2026-11-05, ventana y contenedor con `overflow` en hoja:

| Orden | Inercia hacia abajo tras el reinicio del enrutador | Inercia hacia arriba, `targetScroll` ya 0 | Destino 5000 más allá del límite antiguo |
|---|---|---|---|
| `resize()`, `scrollTo` | **Termina en 3000** | Sigue deslizando hasta 0 | 5000 |
| `scrollTo`, `resize()` | 0 | Sigue deslizando hasta 0 | **800** en ventana, **1100** en contenedor |
| Corte, `resize()`, `scrollTo` | 0 | 0, sin deslizar | 5000 |
| `stop()`, `start()`, `resize()`, `scrollTo` | 0, con `isScrolling` colgado en `"native"` | Igual | 5000 |

```html
<div id="vista"><div style="height:1200px">Vista A</div></div>
<div style="height:600px"></div>
```

```js
const vista = document.querySelector("#vista");
const lenis = new Lenis({ autoRaf: true, lerp: 0.2 });
const posiciones = new Map();
let ruta = "/a";

function antesDeCambiar() {
  posiciones.set(ruta, lenis.scroll);
}
function despuesDeCambiar(volviendo = false) {
  const colocar = { immediate: true, force: true };
  lenis.scrollTo(lenis.targetScroll === 0 ? 1 : 0, colocar); // 1. corta: otro valor que targetScroll
  lenis.resize();                                            // 2. mide
  lenis.scrollTo(volviendo ? posiciones.get(ruta) ?? 0 : 0, colocar); // 3. coloca
}

rueda(600);
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);
const enA = lenis.scroll;
rueda(400); // sigue en marcha al cambiar
await espera(30);

antesDeCambiar();
const enMarcha = lenis.isSmooth;
ruta = "/b";
vista.innerHTML = '<div style="height:5000px">Vista B</div>';
window.scrollTo(0, 0);  // lo que hace un enrutador: el scroll ya está en el destino
despuesDeCambiar();
await espera(200);
const arribaEnB = window.scrollY;

antesDeCambiar();
ruta = "/a";
vista.innerHTML = '<div style="height:1200px">Vista A</div>';
despuesDeCambiar(true);

// prueba: enMarcha && arribaEnB === 0
// prueba: lenis.scroll >= enA
```

Con la ventana como raíz, pon `history.scrollRestoration = "manual"` mientras gestiones tú la posición, y devuelve el valor al limpiar [E].

### En un contenedor

El proceso es el mismo con otra raíz. Cambian tres cosas [E, prueba de la plantilla]:

- El reinicio del enrutador no llega al contenedor: su `scrollTop` sigue donde estaba, y este proceso lo coloca.
- `history.scrollRestoration` es de la ventana. La plantilla no lo toca si `wrapper` es un contenedor.
- Pasa como objetivo la vista dentro del contenedor. El hash se resuelve igual, y `scrollTo` descuenta la posición del contenedor [C].

## Parámetros

| Plantilla | Por defecto | Uso |
|---|---|---|
| `lenis` | crea una | Instancia compartida |
| `clave` | ruta y consulta | Identifica cada vista en las posiciones guardadas |

Conecta `limpiar.antes()` y `limpiar.despues()` al inicio y al final del cambio, en el punto que ofrezca tu tecnología: ver [contrato de integración](../06-integracion/int-contrato.md). Detecta `popstate` para saber que se vuelve atrás, y busca el hash en la raíz de la vista [E].

## Movimiento reducido

Colocar con `immediate` no anima, y da el mismo resultado con cualquier preferencia [E, prueba `reducido` de la plantilla]. Las transiciones entre vistas, si las hay, son aparte.

## Limpieza

Quita `popstate` y, con la ventana como raíz, restaura `scrollRestoration`. Si la instancia es la que sigue viva entre vistas, no la destruyas: el cambio de vista no es retirar el scroll. [P]

## Trampas

- **`scrollTo` al destino antes de `resize()` recorta con el límite antiguo.** Si la vista nueva es más alta, no llegas. [E, abajo]
- **`resize()` antes del corte deja viva la inercia.** Iguala `targetScroll` al scroll real, de modo que tras un `window.scrollTo(0, 0)` del enrutador `scrollTo(0, { immediate: true })` entra en la rama de destino igual, retorna y la animación termina donde iba. [C] [E]
- **`stop()` y `start()` no son un corte limpio.** `isScrolling` queda en `"native"`, y en un contenedor con `overflow` en hoja `stop()` pasa por `overflow: clip`, que no admite scroll. Laboratorio.
- **Una instancia parada ignora `scrollTo` en silencio,** con `immediate` incluido. Si un modal quedó abierto, usa `force`, y ciérralo: esta plantilla no llama a `start()`. [C]
- **En un contenedor parado solo con `stop()`, `force` no basta.** `lenis.css` lo deja en `overflow: clip`, que no se desplaza: no hay dónde colocar. Si detienes un contenedor, fíjalo antes con `overflow: hidden` en línea, como hace `bloqueoModal`; así `force` coloca [E, prueba `cajaParada` de la plantilla].
- **Con `infinite` esto no está probado.** Su `scrollTo` recalcula `targetScroll` antes de comparar. Sin ejecutar. [C]
- **`stopInertiaOnNavigate` no sustituye a esto.** Solo corta la inercia al pulsar un enlace interno a otra ruta del mismo host, y no coloca el scroll. Tampoco cubre `pushState` por código. [C]
- **Un hash en `scrollTo("#id")` falla dentro de Shadow DOM:** busca el elemento en `getRootNode()`. [E: [menú](rec-menu-anclas.md)]
- **Recrear la instancia en cada cambio** pierde `userData`, suscripciones y estado de `stop()`, y añade trabajo. Con una sola instancia basta. [P]

```js
const vista = document.querySelector("#vista");
const lenis = new Lenis({ autoRaf: true });
const anterior = lenis.limit;
vista.innerHTML = '<div style="height:9000px">Vista larga</div>';

lenis.scrollTo(8000, { immediate: true });
const sinMedir = lenis.scroll;

lenis.resize();
lenis.scrollTo(8000, { immediate: true });

// prueba: sinMedir === anterior
// prueba: lenis.scroll === 8000
```
