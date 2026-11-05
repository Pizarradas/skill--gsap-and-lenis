---
id: fun-modelo
titulo: Cómo funciona Lenis, del gesto al scroll nativo
capa: 01-fundamentos
tipo: concepto
ambito: core
resumen: Flujo completo: evento, VirtualScroll, filtros, targetScroll, Animate en raf, escritura en el scroll nativo y evento scroll. Por qué no usa transform.
api: [Lenis.targetScroll, Lenis.animatedScroll, Lenis.actualScroll, Lenis.scroll, Lenis.raf, Lenis.isScrolling, Lenis.on, VirtualScrollData.deltaY, VirtualScrollData.deltaX, VirtualScrollData.event, FromToOptions.onUpdate]
requiere: [fun-que-es]
relacionadas: [com-raf, opc-filtros, opc-suavizado, com-sticky-fixed, api-eventos]
etiquetas: [arquitectura, flujo, nativo, transform]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Cómo funciona Lenis

Lenis tiene dos modos en una misma instancia: **contexto suave**, en el que él escribe el scroll, y **contexto nativo**, en el que el navegador lo mueve y Lenis solo copia el valor. Entender cuál está activo resuelve casi cualquier duda. [C]

## Modelo mental

```text
 rueda / toque
      │  listeners passive:false en eventsTarget
      ▼
 VirtualScroll        normaliza deltaMode, aplica wheelMultiplier/touchMultiplier
      │  { deltaX, deltaY, event }
      ▼
 onVirtualScroll      opción virtualScroll → evento 'virtual-scroll' → filtros
      │               (ctrl, gesto, prevent, data-lenis-*, anidado, stop/lock)
      ▼
 ¿se suaviza? ── no ──► isScrolling = 'native'; el navegador hace el scroll
      │ sí
      ▼
 event.preventDefault()  +  scrollTo(targetScroll + delta)
      │  targetScroll se actualiza YA, de forma síncrona
      ▼
 Animate.fromTo(animatedScroll, destino, { lerp | duration+easing })
      │
      ▼  cada lenis.raf(tiempo)
 Animate.advance(dt) → animatedScroll → wrapper.scrollTo({ top, behavior:'instant' })
      │
      ▼
 emit('scroll', lenis)   y, al terminar, scrollend propio un rAF después
```

Paso a paso [C]:

1. **Captura.** `VirtualScroll` escucha `wheel`, `touchstart`, `touchmove` y `touchend` en `eventsTarget`, con `passive: false` para poder cancelar.
2. **Normalización.** La rueda en líneas (`deltaMode` 1) multiplica por 100/6; en páginas (`deltaMode` 2), por el alto o ancho de ventana. El toque calcula el delta entre dos posiciones del dedo. Ahí se aplican los multiplicadores. [E]
3. **Filtros.** Por orden, en [`opc-filtros`](../02-opciones/opc-filtros.md). Un filtro que corta **no** llama a `preventDefault`, salvo `stop` y `lock`: por eso el navegador hace el scroll nativo.
4. **Decisión.** Se suaviza si `smoothWheel` y es rueda, o `syncTouch` y es toque. Si no, se detiene la animación en curso y el gesto queda en manos del navegador.
5. **Destino.** Se cancela el evento y `targetScroll` cambia al instante, aún sin haberse movido nada. [E]
6. **Animación.** `Animate` no tiene reloj propio: solo avanza cuando alguien llama a `lenis.raf()`. Ver [`com-raf`](../04-comportamiento/com-raf.md).
7. **Escritura.** Cada fotograma se llama a `wrapper.scrollTo()` con `behavior: 'instant'`, que ignora `scroll-behavior: smooth` del CSS. [C] (laboratorio: Chrome 156, 2026-11-05)
8. **Aviso.** Se emite `scroll` con la instancia. El evento `scroll` nativo también se dispara, pero Lenis lo ignora mientras `isScrolling` sea `'smooth'`.

### Las cuatro posiciones

| Propiedad | Qué es | Cuándo difiere |
|---|---|---|
| `targetScroll` | Adónde quiere llegar | Va por delante durante rueda o toque suaves |
| `animatedScroll` | Dónde va la animación | Con `infinite` puede salirse de `[0, limit]` durante la animación |
| `actualScroll` | Lo que dice el navegador (`scrollY`, `scrollLeft`...) | Igual a `animatedScroll` salvo redondeo o scroll nativo aún sin procesar |
| `scroll` | `animatedScroll`, envuelto con módulo si `infinite` | Es la que debes leer normalmente |

En un `scrollTo()` programático `targetScroll` **no** salta al destino: sigue a la animación, para que una rueda a mitad la interrumpa desde donde va. Ver [`api-scrollto`](../03-api/api-scrollto.md). [C] [E]

### Contexto nativo

Teclado, barra de scroll, `focus()`, `window.scrollTo()` externo, anclas y búsqueda en página no pasan por `VirtualScroll`. Lenis los detecta con el evento `scroll`, copia `actualScroll` en `animatedScroll` y `targetScroll`, calcula `velocity` y `direction`, y a los 400 ms sin scroll pone `isScrolling` en `false`. [C] [E]

El toque sin `syncTouch` **sí** pasa por `VirtualScroll`: emite `virtual-scroll`, actualiza `isTouching` y, al llegar a la decisión del paso 4, corta la animación y marca `'native'`. El desplazamiento lo hace el navegador, sin `preventDefault`. [C] [E]

### Por qué no usa `transform`

Las bibliotecas antiguas de scroll suave fijaban el contenido y lo movían con `transform`. Lenis escribe en el scroll real, y por eso conserva:

| Conserva | Por qué | Evidencia |
|---|---|---|
| `position: sticky` y `fixed` | No hay ancestro transformado ni scroll falso | [E], [`com-sticky-fixed`](../04-comportamiento/com-sticky-fixed.md) |
| Anclas y `:target` | El documento mide lo mismo y `scrollY` es real | [E], [`com-anclas`](../04-comportamiento/com-anclas.md) |
| `focus()`, tabulación, búsqueda en página | El navegador puede desplazar y Lenis se sincroniza | [E] `focus()`; el resto [P] |
| `IntersectionObserver`, `scroll-timeline` | Dependen del scroll real | [P] |
| Lectores de pantalla | Ven el DOM en su orden normal, sin envoltorio transformado | [P] |

El precio: la posición se escribe en el hilo principal, y un fotograma bloqueado por JavaScript se nota. Ver [`cal-rendimiento`](../07-calidad/cal-rendimiento.md). Además, el navegador no sabe de la animación: si algo mueve el scroll a mitad, Lenis lo sobrescribe. [C] (laboratorio)

## Ejemplo

El flujo, observado paso a paso con un reloj manual:

```js
const lenis = new Lenis();
const orden = [];
lenis.on("virtual-scroll", ({ deltaY }) => orden.push("virtual " + deltaY));
lenis.on("scroll", () => orden.push("scroll"));

rueda(100);
const destinoInmediato = lenis.targetScroll; // ya es 100
const animadoInmediato = lenis.animatedScroll; // todavía 0
const nativoInmediato = window.scrollY; // todavía 0

let t = 1000;
lenis.raf(t);
lenis.raf((t += 16));
const trasUnPaso = window.scrollY; // ahora sí se escribió el scroll real
for (let i = 0; i < 200; i++) lenis.raf((t += 16));
const final = window.scrollY;
const hayTransform = getComputedStyle(document.body).transform !== "none";
lenis.destroy();
// prueba: destinoInmediato === 100 && animadoInmediato === 0 && nativoInmediato === 0
// prueba: trasUnPaso > 0 && trasUnPaso < 100 && final === 100
// prueba: orden[0] === "virtual 100" && orden[1] === "scroll"
// prueba: hayTransform === false
```

El toque sin `syncTouch` entra por el mismo camino y se queda en la decisión:

```js
const lenis = new Lenis();
const vistos = [];
lenis.on("virtual-scroll", ({ deltaY }) => vistos.push(deltaY));
lenis.scrollTo(800);
lenis.raf(1000);
lenis.raf(1016);
const antes = lenis.isSmooth;
toque("touchstart", 100, 300);
const tocando = lenis.isTouching;
toque("touchmove", 100, 250);
const estado = lenis.isScrolling;
const paso = window.scrollY;
lenis.raf(1032);
const cortada = window.scrollY === paso;
lenis.destroy();
window.scrollTo(0, 0);
// prueba: antes === true && tocando === true && estado === "native" && cortada
// prueba: vistos.some((d) => d !== 0)
```

Scroll externo: Lenis lo adopta como nuevo punto de partida.

```html
<input id="campo" style="position:absolute;top:2000px">
```

```js
const lenis = new Lenis({ autoRaf: true });
document.getElementById("campo").focus(); // desplaza el navegador, no Lenis
await espera(500);
const sincronizado = lenis.scroll === window.scrollY && lenis.targetScroll === window.scrollY;
const movido = window.scrollY > 1000;
lenis.destroy();
// prueba: movido && sincronizado
```

## Trampas

- **Leer `actualScroll` para animar.** Puede ir un paso por detrás o llevar decimales recortados por el navegador. Usa `lenis.scroll` dentro del evento `scroll`. [P]
- **Mover el scroll con `window.scrollTo()` durante una animación.** Mientras `isScrolling` sea `'smooth'`, el evento nativo se ignora y el siguiente fotograma lo sobrescribe. Usa `lenis.scrollTo()`. [C] (laboratorio: una tecla `AvPág` durante un `scrollTo` no alteró el destino)
- **Creer que `preventDefault` se llama siempre.** Si un filtro corta, el evento sigue su camino nativo. Es lo que hace funcionar el scroll anidado, y también lo que produce saltos si esperabas suavizado. [C]
- **Medir el progreso con `scrollY` en `requestAnimationFrame` propio.** Si tu bucle corre antes que `lenis.raf`, vas un fotograma tarde. Suscríbete a `scroll`. [P]
