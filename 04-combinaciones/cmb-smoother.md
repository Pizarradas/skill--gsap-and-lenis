---
id: cmb-smoother
titulo: ScrollSmoother frente a Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap-smoother, gsap+lenis]
resumen: Juntos, prohibido: dos suavizados. Separados, ScrollSmoother gana si deben suavizarse teclado y barra y se usa data-speed; Lenis, con sticky, fixed, contenedor o coste bajo.
relacionadas: [orq-propiedad, cmb-contenedor, cmb-reloj, cmb-css]
fuentes:
  - gsap:scr-smoother
  - gsap:scr-smoother-api
  - gsap:scr-smoother-efectos
  - lenis:cal-conflictos
  - lenis:fun-modelo
  - lab:conflictos-lab/c-smoother.out
  - lab:conflictos-lab/c-coste.out
  - lab:conflictos-lab/n-extra.out
  - lab:conflictos-lab/z-ff.out
  - lab:orquestador-lab/e19.txt
  - lab:orquestador-lab/e20.txt
  - lab:orquestador-lab/e21.chrome.txt
  - lab:orquestador-lab/e21.ff.txt
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# ScrollSmoother frente a Lenis

**Veredicto:** los dos juntos, prohibido (O03). Cada uno solo, compatible con GSAP; se elige con la tabla de criterios.

Alcance: ventana, escritorio, rueda y teclado reales, Chrome y Firefox. El coste, solo en Chrome. En táctil ScrollSmoother no suaviza por defecto: sin medir en dispositivo. [P]

## Juntos

Rueda de 800. El orden de creación y `normalizeScroll` no cambian nada.

| Montaje | Scroll al 99 % | Contenido al 99 % | A los 500 ms, `scrollY` y contenido |
|---|---|---|---|
| ScrollSmoother solo, `smooth: 1` | 2 fotogramas | 36 | 800, 778 |
| Lenis solo | 46 | 46 | |
| Los dos | 47 | **64** | 756, 647; Firefox 763, 667 |

Con `wrapper: "#smooth-wrapper"` en Lenis es peor: Lenis mueve el `scrollTop` del envoltorio, `scrollY` queda en 0 y ScrollSmoother no hace nada. `lenis.stop()` no frena el contenido en camino.

```html
<div id="smooth-wrapper"><div id="smooth-content"><div style="height:3000px"></div></div></div>
```

```js
const smoother = ScrollSmoother.create({ smooth: 1 });
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
await espera(560);

rueda(800);
await espera(300);
const dif = window.scrollY - smoother.scrollTop();

gsap.ticker.remove(paso);
lenis.destroy();
smoother.kill();
window.scrollTo(0, 0);
// prueba: dif > 20
```

## Criterios

| Criterio | ScrollSmoother | Lenis | Gana |
|---|---|---|---|
| `AvPág` | Suavizado: 47 pasos, Firefox 48 | Nativo: 10 pasos | ScrollSmoother |
| Barra, `window.scrollTo` y cualquier otra escritura | Suavizado: 45 pasos | Salto: 1 paso | ScrollSmoother |
| Otro código escribe el scroll en pleno movimiento | Funciona: `ScrollToPlugin` llegó a 300 | Se pierde: [`cmb-scroll-programatico`](cmb-scroll-programatico.md) | ScrollSmoother |
| Efectos `data-speed`, `data-lag` | De serie | Se escriben a mano | ScrollSmoother |
| `position: sticky` en el contenido | **Roto**: −400 | Funciona: 0 | Lenis |
| `position: fixed` en el contenido | **Roto**: −2790 | Funciona: 10 | Lenis |
| Contenedor | No: toma la página | Sí | Lenis |
| Eje horizontal | No | Sí | Lenis |
| `animation-timeline: scroll()` en CSS | Va por delante del contenido: `scrollY` 800, contenido 702 | Exacto | Lenis |
| Marcado | Exige `wrapper` y `content` | Ninguno | Lenis |
| Tiempo de hilo principal, 60 secciones con sombras, 10 ruedas | 763 ms; p95 de fotograma 75,7 ms | 201 ms; 17,9 ms. Nativo 114 ms; 22,9 ms | Lenis |
| Sin GSAP en el proyecto | No aplica | Sí | Lenis |
| Ancla nativa | **Desincroniza**: se ve bien, pero el navegador mueve el `wrapper` (`scrollTop` 3040) y el motor sigue en 0. Tras una rueda, 3040 sigue ahí | Salta, y `anchors` la suaviza | Lenis |
| Foco por teclado fuera de vista | Salta y queda visible | Salta y queda visible | Empate |
| Pin con rueda | Deriva 0 | Deriva 0 | Empate |
| Ajuste a secciones | `snap` con `delay: 0.2`: 1000 | `lenis/snap`: 1000: [`cmb-snap`](cmb-snap.md) | Empate |

El coste depende de la escena: es una página pesada a propósito, con una capa entera en `matrix3d`. Mídelo en la tuya antes de descartarlo. [E]

**Cuándo es mejor ScrollSmoother.** Se cumple todo: el proyecto ya usa GSAP; es vertical y en ventana; no hay `sticky` ni `fixed` dentro del contenido, o se pueden sacar; y además importa algo de esto: que teclado y barra se suavicen igual que la rueda, los efectos `data-speed` y `data-lag`, o que terceros escriban el scroll sin coordinarse.

**Cuándo es mejor Lenis.** Si falla cualquiera de esas condiciones, o si no quieres reestructurar el marcado, o la página es pesada.

**Cuándo ninguno.** Sitio de contenido, formularios largos o sin escena que sincronizar: `lenis:fun-cuando-usarlo` y `gsap:scr-smoother` coinciden.

```html
<div id="smooth-wrapper"><div id="smooth-content"><div style="height:800px"></div><div id="pega" style="position:sticky;top:0;height:50px"></div><div style="height:3000px"></div></div></div>
```

```js
const smoother = ScrollSmoother.create({ smooth: 0.05 });
await espera(560);
window.scrollTo(0, 1500);
ScrollTrigger.update();
await espera(400);
const arriba = Math.round(document.querySelector("#pega").getBoundingClientRect().top);
smoother.kill();
window.scrollTo(0, 0);
// prueba: arriba < -100
```

## Animar la posición (O33)

**No animes `smoother.scrollTop` con un tween**, aunque es lo que propone `gsap:scr-smoother-api`. El tween llega bien, pero la siguiente rueda mueve `scrollY` y el contenido se queda donde estaba. No se corrige por sí solo: sigue igual a los 3 s, hasta otra rueda. Se reproduce con ScrollSmoother solo, sin la plantilla ni Lenis.

Rueda real de 100 px tras un salto de 1 s a 3000. Cada celda dice en cuántas de 5 pasadas la rueda quedó desincronizada, con `smooth` 0,5 y 1. La causa interna no se investigó. [E]

| Cómo se anima | Chrome | Firefox | Mayor salto por fotograma, Chrome |
|---|---|---|---|
| `gsap.to(smoother, { scrollTop })` | 2 y **5** | **5 y 5** | 148 px |
| Lo mismo, y al terminar `smoother.scrollTo(y, false)` | 2 y 5 | Sin medir | 148 px |
| Lo mismo, y al terminar `ScrollTrigger.update()` | 1 y 5 | Sin medir | 148 px |
| `smoother.scrollTo(y, true)` | 0 y 0 | 0 y 0 | 333-628 px; sin duración propia |
| `gsap.to(window, { scrollTo })` | 0 y 0 | 0 y 0 | 106-126 px |
| Objeto propio y `window.scrollTo` | 0 y 0 | 0 y 0 | 106-126 px; sin plugin |
| `mov.irA` | 0 y 0 | 0 y 0 | |

`mov.irA` usa la penúltima fila, con `ScrollTrigger.update()` en cada paso. Con el tween anterior, la plantilla daba 12 de 12 en Chrome.

Una rueda o una tecla de scroll durante el viaje lo interrumpen, como `autoKill` de ScrollToPlugin, salvo si la tecla se pulsa en un campo. Con rueda y `PageDown`, 4 de 4 en cada navegador: se detiene antes del destino, `alTerminar` no se llama y la rueda siguiente queda sana. `touchstart` también interrumpe, pero no se ejecutó con toque real.

## Clases residuales (O03)

`lenis.css` cargado sin instancia no afecta a ScrollSmoother. Con `html.lenis` residual tampoco: `body` conserva su alto en línea. Pero `html.lenis-stopped` residual bloquea la página: 0 tras una rueda de 800. Al migrar, quita Lenis del todo.

## Trampas

- El perfil `gsap-smoother` usa `smoother.scrollTo`, `smoother.paused(true)` y `smoother.getVelocity()`: los tres se ejecutaron aquí. `paused` también frena `AvPág`.
- `ScrollSmoother.create` sin suavizado: `smooth: 0` en movimiento reducido, `wrapper` en `relative`.
- Para `sticky` dentro de ScrollSmoother, usa `pin` (O31).
