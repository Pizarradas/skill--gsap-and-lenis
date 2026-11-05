---
id: nuc-control
titulo: Controlar una animación
capa: 02-nucleo
tipo: api
ambito: core
resumen: play, pause, resume, reverse, restart, seek, paused, reversed e isActive; sus argumentos, diferencias y patrón de hover con timeScale.
api: [Animation.play, Animation.pause, Animation.paused, Animation.resume, Animation.reverse, Animation.reversed, Animation.restart, Animation.seek, Animation.isActive, Animation.invalidate]
relacionadas: [nuc-tiempo, nuc-callbacks, nuc-limpieza, nuc-promesas, tim-control]
etiquetas: [control, reproduccion, interaccion]
fuentes:
  - resources/getting-started/control.md
  - docs/v3/GSAP/Tween/play().md
  - docs/v3/GSAP/Tween/pause().md
  - docs/v3/GSAP/Tween/paused().md
  - docs/v3/GSAP/Tween/resume().md
  - docs/v3/GSAP/Tween/reverse().md
  - docs/v3/GSAP/Tween/reversed().md
  - docs/v3/GSAP/Tween/restart().md
  - docs/v3/GSAP/Tween/seek().md
  - docs/v3/GSAP/Tween/isActive().md
  - docs/v3/GSAP/Tween/invalidate().md
estado: verificado
version: 3.15.1
---
# Controlar una animación

Tween y Timeline comparten estos métodos de `Animation`. Casi todos devuelven la instancia, así que se encadenan. Guarda la referencia a la animación para usarlos. [O]

## Firma

| Método | Efecto |
|---|---|
| `play(desde?, suprimir = true)` | Reproduce hacia delante; quita pausa e inversión [O] |
| `pause(enTiempo?, suprimir = true)` | Pausa, y salta antes si indicas tiempo [O] |
| `resume()` | Quita la pausa **sin cambiar el sentido** [O] |
| `reverse(desde?, suprimir = true)` | Reproduce hacia atrás. `reverse(0)` salta al final antes [O] [E] |
| `restart(incluirDelay = false, suprimir = true)` | Vuelve al inicio y reproduce [O] |
| `seek(tiempo, suprimir = true)` | Salta sin alterar pausa ni sentido. En timelines admite etiquetas [O] |
| `paused(bool?)` | Lee o fija la pausa [O] |
| `reversed(bool?)` | Lee o fija el sentido [O] |
| `isActive()` | `true` si el cabezal está dentro de su tramo y nada la pausa [O] |
| `invalidate()` | Olvida valores grabados; se releen en el próximo render [O] |

`play()` frente a `resume()`: tras `reverse()`, `play()` cambia a hacia delante y `resume()` sigue hacia atrás. [O]

`isActive()` es `false` en pausa, durante `delay`, antes de iniciar y al terminar. `paused()` solo mira a la propia animación; `isActive()` también tiene en cuenta si un ancestro está en pausa. Para listar lo activo: `gsap.globalTimeline.getChildren().filter((a) => a.isActive())`. [O] [E]

## Ejemplo

```js
const caja = { x: 0 };
const anim = gsap.to(caja, { x: 100, duration: 2, ease: "none", paused: true });

anim.seek(1);
const trasSeek = caja.x;

anim.reverse(0).pause();           // reverse(0) salta al final
const alFinal = anim.time();
const invertida = anim.reversed();

anim.play(0.5).pause();            // play() anula la inversión
const sentido = anim.reversed();
const posicion = anim.time();

// prueba: trasSeek === 50
// prueba: alFinal === 2
// prueba: invertida === true
// prueba: sentido === false
// prueba: posicion === 0.5
```

Patrón de hover: un timeline por elemento y salida más rápida que la entrada. [O]

```html
<div class="tarjeta"><div class="detalle"></div></div>
```

```js
const tarjeta = document.querySelector(".tarjeta");
const hover = gsap.timeline({ paused: true })
  .to(tarjeta.querySelector(".detalle"), { y: -10, duration: 0.05 });

tarjeta.addEventListener("mouseenter", () => hover.timeScale(1).play());
tarjeta.addEventListener("mouseleave", () => hover.timeScale(3).reverse());

tarjeta.dispatchEvent(new Event("mouseenter"));
await new Promise((r) => setTimeout(r, 120));
const tras = gsap.getProperty(".detalle", "y");
tarjeta.dispatchEvent(new Event("mouseleave"));
await new Promise((r) => setTimeout(r, 120));

// prueba: tras === -10
// prueba: gsap.getProperty(".detalle", "y") === 0
```

`invalidate()` para recalcular un destino relativo:

```js
const n = { x: 0 };
const suma = gsap.to(n, { x: "+=100", duration: 0.02 });
await new Promise((r) => setTimeout(r, 60));
suma.restart();
await new Promise((r) => setTimeout(r, 60));
const trasRestart = n.x;
suma.invalidate().restart();
await new Promise((r) => setTimeout(r, 60));

// prueba: trasRestart === 100
// prueba: n.x === 200
```

Comprobaciones de las trampas:

```js
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const nueva = gsap.to({ a: 0 }, { a: 1, duration: 1, ease: "none" });
const alCrear = nueva.isActive();
const conDelay = gsap.to({ a: 0 }, { a: 1, duration: 1, delay: 5 });
const madre = gsap.timeline();
const hija = gsap.to({ a: 0 }, { a: 1, duration: 1 });
madre.add(hija);
await espera(50);
const enMarcha = [nueva.isActive(), conDelay.isActive(), hija.isActive()];
const activas = gsap.globalTimeline.getChildren().filter((a) => a.isActive()).includes(nueva);
madre.pause();
const conMadrePausada = [hija.paused(), hija.isActive()];

nueva.timeScale(0).play();
const escala = nueva.timeScale();

const tw = gsap.to({ a: 0 }, { a: 1, duration: 2, paused: true }).reverse(-1);
const tl = gsap.timeline({ paused: true });
tl.to({ a: 0 }, { a: 1, duration: 2 }).reverse(-1);

const contenedor = gsap.timeline({ paused: true });
contenedor.to({ a: 0 }, { a: 1, duration: 1 }).add(gsap.to({ a: 0 }, { a: 1, duration: 5, paused: true }), 0);
const tardia = gsap.timeline({ paused: true });
const larga = gsap.to({ a: 0 }, { a: 1, duration: 5 });
tardia.add(larga);
tardia.duration();
larga.pause();
const sinLeer = gsap.timeline({ paused: true });
const otra = gsap.to({ a: 0 }, { a: 1, duration: 5 });
sinLeer.add(otra);
otra.pause();

const d1 = { a: 0 };
const matado = gsap.to(d1, { a: 1, duration: 0.05, ease: "none" });
await espera(20);
matado.kill();
const congelado = d1.a;
matado.restart();

const d2 = { a: 0 };
const matada = gsap.timeline();
matada.to(d2, { a: 1, duration: 0.05, ease: "none" });
matada.kill();
matada.restart();
await espera(150);

// prueba: alCrear === false
// prueba: enMarcha.join() === "true,false,true" && activas === true
// prueba: conMadrePausada.join() === "false,false"
// prueba: escala === 0
// prueba: tw.time() === 0 && tl.time() === 0
// prueba: contenedor.duration() === 1
// prueba: tardia.duration() === 5 && sinLeer.duration() === 0
// prueba: d1.a === congelado
// prueba: d2.a === 1
```

## Trampas

- **`timeScale` a 0 y `play()`.** La documentación dice que `play()` y `resume()` lo devuelven a 1; en 3.15.1 **no ocurre**: sigue a 0 y la animación no avanza. Fija `timeScale(1)` tú mismo. [C] [E]
- **Tiempos negativos.** La documentación dice que `reverse(-1)` cuenta desde el final; en 3.15.1 el valor se recorta a 0 tanto en tweens como en timelines. Calcula `anim.duration() - 1`. [C] [E]
- **`restart()` ignora `delay`** salvo `restart(true)`. [O]
- **`isActive()` justo tras crear.** Da `false` hasta el primer render. [E]
- **`pause()` no deshace nada.** Deja los valores donde estén. Para volver al estado original, `revert()`: ver [limpieza](nuc-limpieza.md). [O]
- **Animación pausada y `timeline.duration()`.** Un hijo pausado no cuenta para la duración de su padre. [O] Si lo pausas cuando el padre ya la había calculado, el valor guardado no se actualiza y sigue contándolo. [E]
- **`suprimir` por defecto.** `seek()` no dispara callbacks, aunque cruce un `onComplete`: ver [callbacks](nuc-callbacks.md). [O] [E]
- **`kill()` frente a `pause()`.** Un tween destruido no vuelve a cambiar sus objetivos, aunque llames a `restart()`. Una timeline sí: conserva sus hijos y `restart()` o `play()` la reproducen de nuevo. Si vas a reutilizar la animación, pausa. [C] [E]
- **Crear el tween en cada evento.** Para `mouseenter`/`mouseleave`, un único timeline con `play()`/`reverse()` evita conflictos que sí tendrías creando tweens. [O] [P]
