---
id: cal-depuracion
titulo: Depurar Lenis
capa: 07-calidad
tipo: guia
ambito: transversal
resumen: Orden de inspección: clases de la raíz, estado de la instancia, relojes por fotograma, oyentes, medidas y eventos, con utilidades que se pueden pegar en consola.
api: [Lenis.className, Lenis.isScrolling, Lenis.isStopped, Lenis.isLocked, Lenis.isSmooth, Lenis.options, Lenis.dimensions, Lenis.limit, Lenis.actualScroll, Lenis.animatedScroll, Lenis.targetScroll, Lenis.rootElement, Lenis.on, Lenis.off, Lenis.time]
requiere: [fun-modelo]
relacionadas: [cal-errores, cal-rendimiento, com-clases, api-instancia, api-eventos, int-contrato]
etiquetas: [depuracion, consola, estado, inspeccion]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Depurar Lenis

Lenis no tiene modo de depuración ni registra nada, salvo `Target not found`. Pero todo su estado es público, y casi todos los fallos se leen en cuatro valores. [C]

## Pasos

### 1. Consigue la instancia

`window.lenis` **no** es la instancia: es `{ version }`, más `horizontal`, `snap` y `touch` si se usaron, y sobrevive a `destroy()`. Si no hay ninguna referencia, expón la tuya en desarrollo con otro nombre. `undefined` significa que aún no se ha creado ninguna. [C]

### 2. Mira las clases

Sin consola: en el inspector, sobre la raíz.

| En `<html>` o el `wrapper` | Significa |
|---|---|
| Sin `lenis` | No hay instancia, o [otra la borró](../06-integracion/int-contrato.md#trampas) |
| `lenis` | Viva y en reposo |
| `lenis-scrolling` | `isScrolling` no es `false` |
| `lenis-smooth` | Lenis está animando |
| `lenis-stopped` | `stop()` activo |
| `lenis-locked` | `scrollTo` con `lock` en curso |
| `lenis-smooth` fija, sin movimiento | **Sin reloj** |

Ver [`com-clases`](../04-comportamiento/com-clases.md).

### 3. Vuelca el estado

Esta función responde a casi todo. [E]

```js
function estadoLenis(lenis) {
  return {
    real: lenis.actualScroll,
    animado: lenis.animatedScroll,
    destino: lenis.targetScroll,
    limite: lenis.limit,
    estado: lenis.isScrolling,
    parada: lenis.isStopped,
    bloqueada: lenis.isLocked,
    reloj: lenis.time,
    autoRaf: lenis.options.autoRaf,
    raiz: lenis.rootElement.tagName,
    clases: lenis.className,
    alto: [lenis.dimensions.scrollHeight, lenis.dimensions.height],
  };
}

const lenis = new Lenis();
await espera(30);
rueda(300);
await espera(120);
const e = estadoLenis(lenis);
lenis.destroy();
// prueba: e.real === 0 && e.destino === 300 && e.estado === "smooth" && e.reloj === 0 && e.autoRaf === false
```

| Lectura | Diagnóstico |
|---|---|
| `reloj` en 0 tras un gesto | Nadie llama a `raf`: [error 1](cal-errores.md#1-sin-reloj) |
| `animado` es `NaN` | [Dos relojes](cal-errores.md#3-dos-relojes) |
| `limite` en 0 | [El desplazador no es la ventana](cal-errores.md#4-el-desplazador-no-es-la-ventana) |
| `limite` distinto de la realidad | [Límite viejo](cal-errores.md#5-limite-viejo) |
| `parada` o `bloqueada` | `scrollTo` se ignora: [mudo](cal-errores.md#6-scrollto-mudo) |
| `real` y `animado` difieren en reposo | Algo escribe el scroll sin evento, o aún no ha llegado el `scroll` nativo |

### 4. Cuenta las llamadas a `raf`

Debe dar **1 por fotograma**. `autoRaf` lee `this.raf` en cada ciclo, y por eso se puede interceptar sobre la marcha: [E]

```js
async function rafPorFotograma(lenis, fotogramas = 20) {
  const original = lenis.raf;
  let llamadas = 0;
  lenis.raf = (t) => { llamadas++; original(t); };
  for (let i = 0; i < fotogramas; i++) await new Promise(requestAnimationFrame);
  lenis.raf = original;
  return llamadas / fotogramas;
}

const lenis = new Lenis({ autoRaf: true });
await espera(50);
const uno = await rafPorFotograma(lenis);
lenis.destroy();
// prueba: uno >= 0.8 && uno <= 1.2
```

| Da | Significa |
|---|---|
| 0 | Sin reloj |
| Cerca de 2 | Dos relojes |
| 1 | Correcto |

Para un reloj externo que llama directamente a una referencia guardada, esto no intercepta nada: envuélvelo allí.

### 5. Cuenta instancias y oyentes

La consola de las herramientas de desarrollo de Chrome trae `getEventListeners(window)`. Con una instancia sobre la ventana, añade un oyente de `wheel`, `scroll`, `scrollend`, `pointerdown`, los tres de tacto y dos de `resize`; y `click` con `anchors` o `stopInertiaOnNavigate`. Si tras salir sigue alguno, falta un `destroy()`. Si se duplican, sobra una instancia. Así se comprobó el escenario común del [contrato](../06-integracion/int-contrato.md). Laboratorio.

### 6. Registra los eventos

`virtual-scroll` dice qué recibe Lenis; `scroll`, qué hace. Si el primero no se dispara, la rueda no llega: un `iframe`, o `eventsTarget`. Si se dispara y el segundo no, se filtra: `prevent`, `data-lenis-prevent`, gesto de otro eje, `stop()`. Ver [`api-eventos`](../03-api/api-eventos.md). [C] [E]

```js
const lenis = new Lenis({ autoRaf: true });
const registro = { gesto: 0, mueve: 0 };
const quitarGesto = lenis.on("virtual-scroll", () => registro.gesto++);
const quitarMueve = lenis.on("scroll", () => registro.mueve++);
await espera(30);
rueda(100);
await espera(60);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
await espera(300);
lenis.stop();
const hastaAqui = { ...registro };
rueda(100);
await espera(100);
const conStop = { ...registro };
lenis.start();
quitarGesto();
quitarMueve();
lenis.destroy();
window.scrollTo(0, 0);
// prueba: hastaAqui.gesto === 1 && hastaAqui.mueve > 1
// prueba: conStop.gesto === 2 && conStop.mueve === hastaAqui.mueve
```

### 7. Reduce

Quita capas: primero tu código de `scroll`, después GSAP, luego opciones. La forma más corta de aislar es probar `new Lenis({ autoRaf: true })` sobre la misma página. Si funciona, el fallo está en la integración. [P]

## Trampas

- **`console.log(lenis)` en `on("scroll")`.** Lo inspeccionado es un objeto vivo: al desplegarlo, ves los valores de ahora, no los de entonces. Vuelca con `estadoLenis`, que copia. [P]
- **Depurar con la pestaña oculta.** Sin `requestAnimationFrame`, nada avanza. Al volver, el `dt` es enorme. [C]
- **`lenis.time` no es tiempo desde la creación:** es el último valor recibido por `raf`. [C]
- **Herramientas de automatización.** Un `WheelEvent` sintético sirve para Lenis, porque escucha el evento; pero no prueba el scroll nativo del navegador, ni un `iframe`: para eso, usa entrada real del protocolo de depuración. [P]
