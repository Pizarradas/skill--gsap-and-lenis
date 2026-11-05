---
id: cmb-reducido
titulo: Movimiento reducido con GSAP y Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis, gsap, lenis, gsap-smoother]
resumen: Una decisión. gsap.matchMedia gobierna las animaciones; Lenis sigue viva sin smoothWheel, y sus scrollTo saltan. respectReducedMotion false y ScrollToPlugin contradicen la preferencia.
relacionadas: [orq-propiedad, cmb-scroll-programatico, cmb-salida, cmb-snap]
fuentes:
  - gsap:cal-accesibilidad
  - gsap:nuc-matchmedia
  - lenis:opc-automatico
  - lenis:cal-accesibilidad
  - lab:conflictos-lab/i-estado.out
  - lab:conflictos-lab/i-salida.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Movimiento reducido con GSAP y Lenis

**Veredicto:** compatibles sin contradicción si cada uno atiende lo suyo. `gsap.matchMedia` retira animaciones; Lenis no se destruye: se apaga el suavizado (O24).

Alcance: ventana, rueda real, `prefers-reduced-motion` real por emulación y cambio en vivo, Chrome. [E]

| Con `reduce` activo | Rueda de 600 | `lenis.scrollTo` | `ScrollToPlugin` |
|---|---|---|---|
| Lenis por defecto | 8 pasos | 1 paso | **36 pasos** |
| `respectReducedMotion: false` | **52 pasos** | **59 pasos** | 36 pasos |
| Lenis creada solo en la rama `no-preference` | 2 pasos, nativo | No existe | 36 pasos |
| Lenis viva, `smoothWheel: false` | **2 pasos, nativo** | 1 paso | 36 pasos |

Con `smoothWheel: false` se conserva la API: `scrollTo`, `stop()` y `isScrolling` funcionan, y el resto del proyecto no necesita otra rama. Crear Lenis dentro de la rama también es correcto, en vivo no dejó duplicados en cuatro cambios y la posición se mantuvo en 900, pero deja sin dueño el scroll programático y el bloqueo.

`ScrollToPlugin` no consulta la preferencia en ningún perfil.

## Ejemplo

```js
const original = window.matchMedia;
window.matchMedia = (q) => ({ matches: q.includes(": reduce"), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });

const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);

const mm = gsap.matchMedia();
let anima = false;
mm.add({ reducir: "(prefers-reduced-motion: reduce)", normal: "(prefers-reduced-motion: no-preference)" }, (c) => {
  lenis.options.smoothWheel = !c.conditions.reducir;
  lenis.options.syncTouch = false;
  anima = c.conditions.normal;
});

await espera(40);
lenis.scrollTo(900);
const inmediato = window.scrollY;
rueda(200);
await espera(60);
const nativa = lenis.targetScroll;

mm.revert();
window.matchMedia = original;
gsap.ticker.remove(paso);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: inmediato === 900 && anima === false
// prueba: nativa === 900
```

`targetScroll` no se mueve porque Lenis deja la rueda al navegador.

## Contraejemplo

`respectReducedMotion: false` hace que GSAP retire y Lenis siga animando:

```js
const original = window.matchMedia;
window.matchMedia = (q) => ({ matches: q.includes(": reduce"), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
const lenis = new Lenis({ respectReducedMotion: false });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
await espera(40);
lenis.scrollTo(900);
const inmediato = window.scrollY;
await espera(40);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
const fin = window.scrollY;
window.matchMedia = original;
gsap.ticker.remove(paso);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: inmediato < 100 && Math.round(fin) === 900
```

## Por perfil, sin la plantilla

Con `plantillas/orquestador.js`, decide `mov.reducido`: [`orq-reducido`](../03-ciclo/orq-reducido.md).

| Perfil | Quién decide | Cómo |
|---|---|---|
| `ninguno` | CSS | `@media (prefers-reduced-motion: reduce)` |
| `gsap` | `gsap.matchMedia` | Ramas; `ScrollToPlugin` con `duration: 0` en `reduce` (O25) |
| `gsap-smoother` | `gsap.matchMedia` | `smooth: 0`: medido `wrapper` en `relative` |
| `lenis` | `respectReducedMotion` | Por defecto, y `smoothWheel: false`: solo, son 8 pasos |
| `gsap+lenis` | `gsap.matchMedia` | Esta ficha |

## Trampas

- En vivo, `gsap.matchMedia` revierte: un `scrub` volvió a 0 y ScrollTrigger quedó sin instancias. El contenido debe verse sin animación.
- `lenis/snap` salta de golpe en `reduce`: `snap.stop()`.
- `lenis.options.smoothWheel` se lee en cada gesto: cambia en vivo sin recrear.
