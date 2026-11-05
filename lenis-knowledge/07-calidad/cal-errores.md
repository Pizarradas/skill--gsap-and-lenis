---
id: cal-errores
titulo: Errores comunes de Lenis
capa: 07-calidad
tipo: diagnostico
ambito: transversal
resumen: Síntoma, causa y solución probados: la rueda no mueve nada, scroll lento, NaN con la página clavada, sin desplazarse, límite viejo, scrollTo mudo, modales y clases perdidas.
api: [Lenis.raf, Lenis.resize, Lenis.limit, Lenis.scrollTo, Lenis.isStopped, LenisOptions.autoRaf, LenisOptions.wrapper, LenisOptions.content, ScrollToOptions.force]
requiere: [fun-modelo]
relacionadas: [cal-depuracion, cal-conflictos, cal-limitaciones, com-raf, com-dimensiones, com-stop-start, int-contrato, int-gsap]
etiquetas: [errores, diagnostico, soluciones, troubleshooting]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Errores comunes de Lenis

Cada entrada tiene su prueba, aquí o en la ficha enlazada. Para averiguar cuál es el tuyo, sigue [`cal-depuracion`](cal-depuracion.md).

## Síntoma

| # | Veo | Sección |
|---|---|---|
| 1 | La rueda no mueve nada, y antes de instalar Lenis sí | [Sin reloj](#1-sin-reloj) |
| 2 | Se mueve muy despacio, sin errores | [Unidad](#2-unidad-de-tiempo) |
| 3 | La página queda clavada arriba, y `animatedScroll` es `NaN` | [Dos relojes](#3-dos-relojes) |
| 4 | Sin scroll, y `limit` es 0 | [El desplazador no es la ventana](#4-el-desplazador-no-es-la-ventana) |
| 5 | No llega al final, o lo pasa | [Límite viejo](#5-limite-viejo) |
| 6 | `scrollTo` no hace nada | [`scrollTo` mudo](#6-scrollto-mudo) |
| 7 | La página se mueve detrás de un modal | [Modal](#7-modal) |
| 8 | Un panel interno no se mueve, y la página sí | [Anidado](#8-anidado) |
| 9 | Tras retirar la vista, algo sigue moviéndose | [Salida incompleta](#9-salida-incompleta) |
| 10 | La clase `lenis` desaparece de la raíz | [Dos instancias](#10-dos-instancias) |
| 11 | Los `scrub` van por detrás, o saltan tras un bloqueo | [`int-gsap`](../06-integracion/int-gsap.md) |

Antes de nada, la lista del README, contrastada: versión reciente, CSS recomendado, integración de GSAP, comprobar sin Lenis y un reloj. El último es el fallo más frecuente, y un error en cualquiera de los demás rara vez deja la página inmóvil. [P]

## Causa

### 1. Sin reloj

Con `new Lenis()`, `autoRaf` es `false`. La rueda se cancela con `preventDefault`, `targetScroll` cambia, y nada escribe la posición: la instancia **impide** el scroll nativo y no lo sustituye. [C] [E]

```js
const lenis = new Lenis();
await espera(30);
rueda(300);
await espera(150);
const r = { y: window.scrollY, destino: lenis.targetScroll };
lenis.destroy();
// prueba: r.y === 0 && r.destino === 300
```

### 2. Unidad de tiempo

`raf` espera milisegundos. Con segundos, cada `dt` es mil veces menor. Prueba en [`int-gsap`](../06-integracion/int-gsap.md).

### 3. Dos relojes

`autoRaf` y un bucle externo con orígenes separados más de unos 118 s, con `lerp`: un `dt` negativo da `NaN`. No se congela: `scrollTo({ top: NaN })` lleva a 0 en cada fotograma, con `isScrolling` en `"smooth"`. Con orígenes cercanos o con `duration` no hay `NaN`. Tabla y prueba en [`com-raf`](../04-comportamiento/com-raf.md).

### 4. El desplazador no es la ventana

Con `html { overflow: hidden }` y `html, body { height: 100% }` más `body { overflow: auto }`, quien se desplaza es `body`. El resultado depende de la hoja. Laboratorio, Chrome 156, rueda real de 300:

| Instancia | Con `lenis.css` | Sin `lenis.css` |
|---|---|---|
| Ventana | `html.lenis body { height: auto }` gana: `body` deja de desplazarse y mueve la ventana. `limit` 0 al crear, correcto a los 259 ms; la rueda llega a 300. El teclado no mueve nada: `html` sigue en `hidden` | `limit` 0 para siempre y **sin movimiento** |
| `wrapper: document.body, content: document.body` | Clases en `body`, `limit` correcto al crear; la rueda y el teclado mueven `body` | Igual |

Sin la hoja, sin `html.lenis` que cambie la altura, Lenis mira la ventana, mide 0 y no hace nada. [C] [E]

```html
<style>
  html.prueba, html.prueba body { height: 100%; }
  html.prueba { overflow: hidden; }
  html.prueba body { overflow: auto; }
</style>
```

```js
const raiz = document.documentElement;
raiz.classList.add("prueba");

const conHoja = new Lenis();
const alCrear = conHoja.limit;         // se mide antes de poner la clase lenis
conHoja.resize();
const trasMedir = conHoja.limit;
conHoja.destroy();

const hoja = [...document.styleSheets].find((h) => (h.href || "").includes("lenis.css"));
hoja.disabled = true;
const sinHoja = new Lenis();
sinHoja.resize();
const limite = sinHoja.limit;
sinHoja.destroy();
const cuerpo = new Lenis({ wrapper: document.body, content: document.body });
const limiteCuerpo = cuerpo.limit;
cuerpo.destroy();
hoja.disabled = false;
raiz.classList.remove("prueba");
// prueba: alCrear === 0 && trasMedir > 1000
// prueba: limite === 0 && limiteCuerpo > 1000
```

**Medir antes de la clase.** `Dimensions` mide en el constructor, antes de añadir `lenis` a la raíz: con `height: 100%` en el documento, `lenis.css` cambia la altura después. Hasta que el `ResizeObserver` avisa, `limit` es 0: 259 ms en laboratorio, por el retardo de 250 ms. Una rueda a los 200 ms no movió nada, y un `scrollTo` a los 1000 ms sí. Con `resize()` tras crear, no hay espera. [C] [E]

### 5. Límite viejo

`limit` se recalcula con `ResizeObserver` y 250 ms de retardo. Al insertar contenido, `limit` conserva el valor anterior y `scrollTo` recorta contra él. Una altura que cambia en el documento pero no en `content` no se detecta. [C] [E]

```js
const lenis = new Lenis();
const antes = lenis.limit;
const extra = document.createElement("div");
extra.style.height = "2000px";
document.body.append(extra);
const viejo = lenis.limit;
lenis.resize();
const nuevo = lenis.limit;
lenis.destroy();
extra.remove();
// prueba: viejo === antes && nuevo === antes + 2000
```

### 6. `scrollTo` mudo

Tres causas, sin excepción en ninguna: [C] [E]

```js
const lenis = new Lenis({ autoRaf: true });
lenis.stop();
lenis.scrollTo(500, { immediate: true });
const parada = window.scrollY;                       // parada: ignora sin force
lenis.scrollTo(500, { immediate: true, force: true });
const forzada = window.scrollY;
lenis.start();

let completado = 0;
lenis.scrollTo(500, { onComplete: () => completado++ });  // ya está ahí: no anima
lenis.destroy();
window.scrollTo(0, 0);
// prueba: parada === 0 && forzada === 500 && completado === 1
```

La tercera es un objetivo inexistente: avisa `Lenis: Target not found` por consola y no hace nada más. [C]

### 7. Modal

`overflow: hidden` en `body` no frena a Lenis: cancela la rueda y escribe por programa. Ver [`cal-conflictos`](cal-conflictos.md).

### 8. Anidado

Lenis cancela la rueda aunque esté sobre un panel con `overflow: auto`. Laboratorio: página en 399 y panel en 0. Ver [`cal-limitaciones`](cal-limitaciones.md).

### 9. Salida incompleta

`destroy()` no para un reloj externo, y no llamarlo deja el bucle vivo. Prueba en [`int-contrato`](../06-integracion/int-contrato.md#trampas).

### 10. Dos instancias

El `destroy()` de una borra las clases de la otra. Prueba en [`int-contrato`](../06-integracion/int-contrato.md#trampas).

## Solución

| # | Solución |
|---|---|
| 1 | `new Lenis({ autoRaf: true })`, o un bucle propio. Ver [`com-raf`](../04-comportamiento/com-raf.md) |
| 2 | `lenis.raf(time * 1000)` con `gsap.ticker` |
| 3 | Un solo dueño de `raf`. Si ya es `NaN`, quita el reloj sobrante y llama a `stop()` y `start()`, o a `scrollTo(x, { immediate: true })`. `resize()` no basta |
| 4 | Carga `lenis.css`, o quita el `overflow` de `html`, o usa `wrapper: document.body, content: document.body`. Para `limit` 0 al crear, `lenis.resize()` |
| 5 | `lenis.resize()` tras el cambio, o `naiveDimensions: true`. Ver [`com-dimensiones`](../04-comportamiento/com-dimensiones.md) |
| 6 | `force: true` si está parada. En un contenedor con `overflow` en hoja y `lenis.css`, `force` no basta: ver [`com-stop-start`](../04-comportamiento/com-stop-start.md#ventana-y-contenedor). Comprueba `lenis.isStopped` e `isLocked`, y el selector |
| 7 | `lenis.stop()` y `lenis.start()` al abrir y cerrar |
| 8 | `data-lenis-prevent` en el panel, o `allowNestedScroll: true` |
| 9 | Quita el reloj y después `destroy()` |
| 10 | Sal antes de entrar: nunca dos instancias vivas sobre la misma raíz |

Si sigues sin encontrarlo, comprueba sin Lenis. Comenta la creación: si la página tampoco se mueve, el problema es de CSS. `document.documentElement.scrollHeight > innerHeight` debe ser cierto, si el desplazador es la ventana.
