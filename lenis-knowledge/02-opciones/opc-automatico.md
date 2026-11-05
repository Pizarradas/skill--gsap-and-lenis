---
id: opc-automatico
titulo: Opciones automáticas y configuración sin código
capa: 02-opciones
tipo: guia
ambito: core
resumen: autoRaf, autoResize, anchors, autoToggle, allowNestedScroll, naiveDimensions, stopInertiaOnNavigate y respectReducedMotion, y la línea única sin compilación.
api: [LenisOptions.autoRaf, LenisOptions.autoResize, LenisOptions.anchors, LenisOptions.autoToggle, LenisOptions.allowNestedScroll, LenisOptions.naiveDimensions, LenisOptions.stopInertiaOnNavigate, LenisOptions.respectReducedMotion, Lenis.prefersReducedMotion]
requiere: [fun-instalacion]
relacionadas: [opc-referencia, com-anclas, com-stop-start, com-raf, cal-accesibilidad]
etiquetas: [automatico, reduced-motion, navegacion, sin-codigo]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Opciones automáticas

Son los interruptores que resuelven por ti lo que, si no, se hace a mano. Juntos forman la configuración sin código del README: una sola línea que deja una página normal bien integrada. [O] [C]

## Pasos

### 1. La línea para pegar en una página

Es la vía clásica de [`fun-instalacion`](../01-fundamentos/fun-instalacion.md) con todo activo:

```html
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.27/dist/lenis.css">
<script src="https://unpkg.com/lenis@1.3.27/dist/lenis.min.js"></script>
<script>
  new Lenis({
    autoRaf: true, autoToggle: true, anchors: true, allowNestedScroll: true,
    naiveDimensions: true, stopInertiaOnNavigate: true,
  });
</script>
```

| Opción | Qué automatiza | Coste o condición |
|---|---|---|
| `autoRaf` | El bucle `requestAnimationFrame` | Reloj propio: mal si ya sincronizas con otro. Ver [`com-raf`](../04-comportamiento/com-raf.md) |
| `autoToggle` | `stop`/`start` según el `overflow` de la raíz, para modales de terceros | Requiere `lenis.css`. Ver [`com-stop-start`](../04-comportamiento/com-stop-start.md) |
| `anchors` | Enlaces `#id` suaves | Ver [`com-anclas`](../04-comportamiento/com-anclas.md) |
| `allowNestedScroll` | Áreas con scroll propio | Medidas con caché de 2 s. Ver [`opc-filtros`](opc-filtros.md) |
| `naiveDimensions` | `limit` siempre al día | Lee el DOM en cada acceso. Ver [`com-dimensiones`](../04-comportamiento/com-dimensiones.md) |
| `autoResize` (activa por defecto) | Recalcula tamaños | Retardo de 250 ms. Ver [`com-dimensiones`](../04-comportamiento/com-dimensiones.md) |
| `stopInertiaOnNavigate` | Corta la inercia al ir a otra página | Abajo |
| `respectReducedMotion` (activa por defecto) | Respeta `prefers-reduced-motion` | Abajo |

### 2. `stopInertiaOnNavigate`

Escucha `click` en `wrapper`. Si el enlace pulsado va al mismo host y a **otra ruta**, llama a un reinicio interno: detiene la animación y sincroniza con el scroll real. Útil cuando la página cambia sin recarga y una inercia en curso afectaría a la vista nueva. [C] [E]

El enlace a la misma ruta no dispara nada, ni uno externo. Si `anchors` procesa el enlace, tiene prioridad. [C]

```html
<a id="otra" href="/otra-ruta">Otra</a>
```

```js
document.addEventListener("click", (e) => e.preventDefault()); // evita navegar en la prueba
const lenis = new Lenis({ stopInertiaOnNavigate: true, duration: 2, easing: (t) => t });
lenis.scrollTo(1000);
lenis.raf(1000);
lenis.raf(1100);
const enCurso = lenis.isScrolling;
document.getElementById("otra").click();
const trasClic = lenis.isScrolling;
const posicion = lenis.animatedScroll;
lenis.raf(1200);
lenis.raf(1300);
const quieto = lenis.animatedScroll === posicion;
lenis.destroy();
// prueba: enCurso === "smooth" && trasClic === false && quieto
```

Parecido, y siempre activo: pulsar el **botón central** del ratón hace ese mismo reinicio, para no pelear con el desplazamiento automático del navegador. [C] [E]

```js
const botonCentral = new PointerEvent("pointerdown", { button: 1 });
const lenis = new Lenis({ duration: 2, easing: (t) => t });
lenis.scrollTo(1000);
lenis.raf(1000);
lenis.raf(1100);
window.dispatchEvent(botonCentral);
const estado = lenis.isScrolling;
lenis.destroy();
// prueba: estado === false
```

### 3. `respectReducedMotion`

Con la preferencia `reduce` activa y la opción en `true`, [C] [E]:

| Ruta | Efecto |
|---|---|
| `scrollTo()` programático, anclas, Snap | `immediate = true`: salto directo; sin `lock` ni `onStart` |
| Rueda, y toque con `syncTouch` | `lerp = 1`, sin `duration` ni `easing` |
| Scroll nativo | Sin cambios |

La preferencia se consulta en cada `scrollTo`, sin recargar. `lenis.prefersReducedMotion` da el resultado combinado de preferencia y opción. Lenis sigue funcionando, así que las escenas sincronizadas no se rompen. [C] (laboratorio: Chrome 156 con `Emulation.setEmulatedMedia`, 2026-11-05, incluido el cambio en vivo y `respectReducedMotion: false`)

El arnés no tiene la preferencia activa, de modo que el bloque la simula sustituyendo `matchMedia`:

```js
window.matchMedia = (q) => ({ matches: q.includes("reduced-motion") });
const lenis = new Lenis();
const activa = lenis.prefersReducedMotion;

lenis.scrollTo(500, { duration: 2 });
const saltoSincrono = window.scrollY;

rueda(300);
let t = 1000;
lenis.raf(t);
lenis.raf((t += 16));
const trasUnFotograma = lenis.animatedScroll;
for (let i = 0; i < 100; i++) lenis.raf((t += 16));
const final = lenis.animatedScroll;
lenis.destroy();

const optOut = new Lenis({ respectReducedMotion: false });
const desactivada = optOut.prefersReducedMotion;
optOut.destroy();
// prueba: activa === true && saltoSincrono === 500
// prueba: trasUnFotograma > 500 && trasUnFotograma < 800 && final === 800
// prueba: desactivada === false
```

## Trampas

- **"1:1 con el dispositivo" no es literal.** El README dice que sigue la entrada 1:1, pero `lerp = 1` sigue siendo amortiguación: una rueda de 300 px tardó 7 fotogramas en llegar (laboratorio), y sigue siendo perceptible aunque mínima. [C] [E]
- **`onStart` no se llama con movimiento reducido.** Al pasar por `immediate`, solo se ejecuta `onComplete`. Si `onStart` activaba algo, queda sin activar. [C], ver [`api-scrollto`](../03-api/api-scrollto.md)
- **`stopInertiaOnNavigate` compara `pathname`.** Cambiar solo la consulta (`?pag=2`) no cuenta como navegación. [C]
- **La línea sin código no sirve para todo.** Combina `autoRaf` con otro bucle y romperás la instancia: ver [`com-raf`](../04-comportamiento/com-raf.md). [E]
- **`autoToggle` sin `lenis.css`.** `stop()` no tiene efecto interno. Ver [`fun-css`](../01-fundamentos/fun-css.md). (laboratorio)
