---
id: cmb-normalize
titulo: normalizeScroll con Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis]
resumen: Prohibido. Con rueda parece inocuo, pero mueve la página con lenis.stop() activo, roba la rueda de data-lenis-prevent y altera el toque. Sin normalizeScroll, el pin ya no tiembla.
relacionadas: [orq-propiedad, cmb-modal, cmb-pin]
fuentes:
  - gsap:scr-normalize
  - gsap:scr-pin
  - lenis:cal-conflictos
  - lenis:opc-tactil
  - lab:conflictos-lab/d-scroll.out
  - lab:conflictos-lab/k-extra.out
  - lab:conflictos-lab/l-extra.out
  - lab:conflictos-lab/z-ff.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# `normalizeScroll` con Lenis

**Veredicto:** prohibido (O07). La base Lenis lo daba por "sin conflicto con rueda; táctil sin probar". Sin conflicto solo en el caso feliz: la rueda libre.

Alcance: ventana y contenedor, `lerp` y `duration`, rueda real en Chrome y Firefox, toque real por el protocolo de depuración en Chrome. En dispositivo real, sin probar. [P]

| Caso | Sin `normalizeScroll` | Con él |
|---|---|---|
| Rueda libre | 800 | 800: inocuo |
| Rueda con `lenis.stop()` | 0 | **600**, también en Firefox |
| Toque con `lenis.stop()` | 0 | **554** |
| Rueda sobre `data-lenis-prevent` | Dentro: 300, página: 0 | **Dentro: 0, página: 300** |
| Toque, sin `syncTouch`, ventana | 464, sin Lenis 461 | 690: otra inercia |
| Toque, con `syncTouch` | 400 | 400-402: no aporta |
| Toque en un contenedor | 464 | **0: no entra**, y mueve la ventana 689 |

El último ocurre también sin Lenis: es de `normalizeScroll`, y `allowNestedScroll: true` lo arregla (385). `allowNestedScroll` también devuelve la rueda a `data-lenis-prevent`. Lo que no arregla es el bloqueo: `normalizer.disable()` junto a `stop()` lo evita, a costa de una coordinación que no aporta nada.

## Ejemplo: sin él

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.stop();
await espera(40);
rueda(500);
await espera(500);
const y = window.scrollY;
lenis.start();
gsap.ticker.remove(paso);
lenis.destroy();
// prueba: y === 0
```

## Contraejemplo

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
const n = ScrollTrigger.normalizeScroll(true);
lenis.stop();
await espera(40);
rueda(500);
await espera(700);
const y = window.scrollY;
ScrollTrigger.normalizeScroll(false);
lenis.start();
gsap.ticker.remove(paso);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: y > 100
```

## Qué problema de la base resuelve Lenis, y cuál no

| Problema de `gsap:scr-normalize` | Con Lenis |
|---|---|
| Pin que salta con rueda | Resuelto: deriva 0 |
| Pin que salta con el dedo | Sin `syncTouch`, el toque sigue nativo: no medido. Es la vía de `syncTouch`, no de `normalizeScroll` [P] |
| Barra de direcciones, rebote en iOS, errores de iOS | Sin probar: exige dispositivo [P] |

Si un proyecto necesita de verdad `normalizeScroll` en móvil, ese es un argumento para el perfil `gsap` o `gsap-smoother` en esa vista, no para combinarlos.
