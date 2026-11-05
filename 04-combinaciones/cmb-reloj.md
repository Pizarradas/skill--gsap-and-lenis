---
id: cmb-reloj
titulo: Un solo reloj para GSAP y Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis]
resumen: gsap.ticker da el tiempo a Lenis, ScrollTrigger.update va en el evento scroll y lagSmoothing se deja por defecto. Dos relojes con origen lejano dejan la página clavada.
relacionadas: [orq-propiedad, orq-anulaciones, cmb-pin, cmb-scrub, cmb-salida]
fuentes:
  - gsap:nuc-ticker
  - lenis:int-gsap
  - lenis:com-raf
  - lab:conflictos-lab/a-reloj.out
  - lab:conflictos-lab/b-reloj2.out
  - lab:conflictos-lab/b-tarde.out
  - lab:conflictos-lab/b-lag.out
  - lab:conflictos-lab/b-sueno.out
  - lab:conflictos-lab/n-extra.out
  - lab:conflictos-lab/z-ff.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Un solo reloj para GSAP y Lenis

**Veredicto:** compatible con condición. `gsap.ticker` llama a `lenis.raf(time * 1000)`, Lenis va sin `autoRaf` y `lenis.on("scroll", ScrollTrigger.update)` es obligatorio. `lagSmoothing(0)` no se usa salvo que el proyecto necesite tiempo real.

Alcance: ventana y contenedor, `lerp` y `duration`, con y sin `lenis.css`, rueda. Laboratorio: Chrome 156 y Firefox 159 reales, rueda real, 2026-11-05. "Pintado" es lo leído en un `ResizeObserver`, después de todos los `requestAnimationFrame` y antes de pintar. [E]

## Ejemplo

```js
const lenis = new Lenis();                       // sin autoRaf
const paso = (time) => lenis.raf(time * 1000);   // segundos a milisegundos
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);

const estado = { v: 0 };
gsap.to(estado, { v: 1000, ease: "none", scrollTrigger: { start: 0, end: 1000, scrub: true } });
await espera(60);

const fotogramas = [];
const mirar = () => fotogramas.push(Math.abs(window.scrollY - estado.v));
gsap.ticker.add(mirar);
rueda(600);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
gsap.ticker.remove(mirar);

const y = Math.round(window.scrollY);
gsap.ticker.remove(paso);
lenis.destroy();
ScrollTrigger.getAll().forEach((t) => t.kill());
window.scrollTo(0, 0);
// prueba: y === 600
// prueba: fotogramas.length > 10 && Math.max(...fotogramas) < 1.5
```

## Contraejemplo: dos relojes (O01)

`autoRaf: true` más `gsap.ticker.add`. Si GSAP arranca cerca de la página, no se nota: llega en los mismos fotogramas (70 frente a 71). Es un fallo latente: **con GSAP cargado 125 s después y `lerp`, `animatedScroll` es `NaN` y la página queda clavada en 0.** Con `duration` llega. Ejecutado de verdad, con carga diferida de GSAP, no simulado.

| Relojes | `lerp` | `duration` |
|---|---|---|
| Un reloj, cualquiera | 1500, 70 fotogramas | 1500, 65 |
| Dos, GSAP cargado con la página | 1500, 70-71 | 1500, 65-66 |
| Dos, GSAP cargado 125 s después | **`y` 0, `NaN`, `isScrolling` en `smooth`** | 1500 |

El bloque reproduce la causa, un `dt` negativo enorme, sin esperar dos minutos:

```js
const lenis = new Lenis();
await espera(30);
rueda(800);
lenis.raf(performance.now());
lenis.raf(performance.now() + 16);
lenis.raf(performance.now() - 125000);   // otro origen de tiempo
lenis.raf(performance.now());
const animado = lenis.animatedScroll;
lenis.destroy();
window.scrollTo(0, 0);
// prueba: Number.isNaN(animado) || Math.abs(animado) > 1e6
```

## Contraejemplo: segundos en `raf` (O05)

Sin multiplicar, el `dt` es mil veces menor y el scroll casi no avanza, sin error.

```js
const lenis = new Lenis();
const mal = (time) => lenis.raf(time);
gsap.ticker.add(mal);
await espera(40);
rueda(500);
await espera(500);
const y = window.scrollY;
gsap.ticker.remove(mal);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: y < 20
```

## `ScrollTrigger.update` no es opcional (O04)

La base Lenis lo presenta como un fotograma de retraso. Es más grave: el retraso se ve en lo pintado, con cualquier reloj. Rueda de 1500, 60 fotogramas:

| Montaje | Chrome: pintado con `scrub` distinto de `scrollY` | Firefox | Retraso máximo |
|---|---|---|---|
| `ticker` con `update` | 0 | 0 | 0 |
| `autoRaf` con `update` | 0 | 0 | 0 |
| `autoRaf` sin `update` | 46 de 60 | 16 de 68 | 143 px, Firefox 650 |
| `ticker` sin `update` | 46 de 60 | 17 de 69 | 145 px, Firefox 349 |

Igual en ventana y contenedor. Efecto sobre `pin`, en [`cmb-pin`](cmb-pin.md).

```js
const lenis = new Lenis();
const quitar = lenis.on("scroll", ScrollTrigger.update);
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
const st = ScrollTrigger.create({ start: 0, end: 3000 });
await espera(60);

const conAviso = [];
const mirar = () => conAviso.push(Math.abs(st.scroll() - window.scrollY));
gsap.ticker.add(mirar);
rueda(800);
await espera(300);
gsap.ticker.remove(mirar);

quitar();
window.scrollTo(0, 0);
gsap.ticker.remove(paso);
lenis.destroy();
st.kill();
// prueba: conAviso.length > 5 && Math.max(...conAviso) < 1
```

## `gsap.ticker` o `autoRaf`

Con `update`, los dos sincronizan lo pintado. Decide el tiempo compartido: el `ticker` hace que Lenis y los tweens vivan el mismo reloj, y `autoRaf` no (O32). `scrollTo` y tween de 1 s, con bloqueo de 800 ms:

| Reloj de Lenis | `lagSmoothing` | Scroll | Tween | Diferencia |
|---|---|---|---|---|
| `gsap.ticker` | Por defecto | 1767 ms | 1767 ms | 0 |
| `gsap.ticker` | `0` | 1105 ms | 1105 ms | 0 |
| `autoRaf` | Por defecto | 1110 ms | 1778 ms | **668 ms** |
| `autoRaf` | `0` | 1111 ms | 1110 ms | 1 ms |

## `lagSmoothing(0)`: la recomendación cambia (O06)

La base Lenis y su README lo incluyen en la receta. Medido, **no compensa como valor por defecto.** Ninguna opción desincroniza ScrollTrigger (0 fotogramas en todos los casos).

| Bloqueo | Por defecto, `500, 33` | `lagSmoothing(0)` |
|---|---|---|
| 300 ms | Salto de 831-1055 px | **Igual**: 788-1016 px |
| 800 ms, rueda | Sigue suave: 161-180 px | Salta: 897-1092 px |
| 800 ms, `scrollTo` de 1 s | Tarda 1818 ms | Tarda 1167 ms |
| Pestaña oculta 3 s con inercia | Reanuda donde iba: 125-127 px | **Salta 3199-3242 px** y acaba |

Salidas: `b-lag.out`, Chrome, ventana y contenedor, `lerp` y `duration`; y `z-ff.out`, Firefox, los dos primeros tramos.

Por debajo de 500 ms no cambia nada. Por encima, `0` cambia un retraso por un salto. Usa `lagSmoothing(0)` solo si el scroll o una animación deben seguir un tiempo real, como audio o vídeo. Es global y `lenis.destroy()` no lo revierte: un tween ajeno saltó a 0,95 tras retirar Lenis. Restáuralo con `gsap.ticker.lagSmoothing(500, 33)`.

Para reproducirlo, un bloqueo real del hilo, fuera del arnés porque su tiempo es virtual:

```js fragmento
rueda(3000);
await espera(120);
const t = performance.now();
while (performance.now() - t < 800);
```

## `autoSleep` y coste

Un oyente permanente impide que el ticker duerma: 181 ticks en 3 s de reposo, frente a 0 sin oyente. No rompe nada, y `autoRaf` también mantiene su bucle. Coste de `lenis.raf`: 0,003 ms por fotograma en reposo y 0,22 ms en movimiento con 30 `scrub`. Con `autoRaf` y el ticker dormido, la rueda y `scrub` siguen funcionando: ScrollTrigger despierta lo que necesita.

## Trampas

- `gsap.ticker.add(paso, false, true)` adelanta `raf` a los tweens, sin diferencia medible. No hace falta.
- Dos veces `ticker.add(paso)` no es `NaN`, pero acorta el `dt`: 83 fotogramas frente a 70. Una sola alta.
- Pestaña oculta y tiempo del `ticker`: ver [`cmb-salida`](cmb-salida.md) para retirar el oyente.
