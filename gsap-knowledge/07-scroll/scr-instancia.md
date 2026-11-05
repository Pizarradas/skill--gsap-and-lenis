---
id: scr-instancia
titulo: Propiedades y métodos de una instancia de ScrollTrigger
capa: 07-scroll
tipo: referencia
ambito: ScrollTrigger
resumen: Tabla de lectura de una instancia (progress, direction, isActive, start, end) y sus métodos (kill, disable, enable, scroll, getVelocity, next, previous, tweenTo).
api: [ScrollTrigger.progress, ScrollTrigger.direction, ScrollTrigger.isActive, ScrollTrigger.start, ScrollTrigger.end, ScrollTrigger.animation, ScrollTrigger.trigger, ScrollTrigger.scroller, ScrollTrigger.vars, ScrollTrigger.getVelocity, ScrollTrigger.kill, ScrollTrigger.labelToScroll, ScrollTrigger.next, ScrollTrigger.previous, ScrollTrigger.scroll, ScrollTrigger.tweenTo, ScrollTrigger.Vars.onKill]
relacionadas: [scr-estaticos, scr-toggle, scr-snap, scr-scrollto, nuc-limpieza, fra-agnostico]
etiquetas: [scroll, referencia]
fuentes:
  - docs/v3/Plugins/ScrollTrigger/progress.md
  - docs/v3/Plugins/ScrollTrigger/direction.md
  - docs/v3/Plugins/ScrollTrigger/isActive.md
  - docs/v3/Plugins/ScrollTrigger/start.md
  - docs/v3/Plugins/ScrollTrigger/end.md
  - docs/v3/Plugins/ScrollTrigger/animation.md
  - docs/v3/Plugins/ScrollTrigger/pin.md
  - docs/v3/Plugins/ScrollTrigger/trigger.md
  - docs/v3/Plugins/ScrollTrigger/scroller.md
  - docs/v3/Plugins/ScrollTrigger/vars.md
  - docs/v3/Plugins/ScrollTrigger/getVelocity().md
  - docs/v3/Plugins/ScrollTrigger/getTween().md
  - docs/v3/Plugins/ScrollTrigger/kill().md
  - docs/v3/Plugins/ScrollTrigger/disable().md
  - docs/v3/Plugins/ScrollTrigger/enable().md
  - docs/v3/Plugins/ScrollTrigger/labelToScroll().md
  - docs/v3/Plugins/ScrollTrigger/next().md
  - docs/v3/Plugins/ScrollTrigger/previous().md
  - docs/v3/Plugins/ScrollTrigger/scroll().md
estado: verificado
version: 3.15.1
---
# Instancia de ScrollTrigger

La instancia llega como `self` a los callbacks, como valor devuelto por `create()`, o como `animacion.scrollTrigger`.

## Propiedades (solo lectura)

| Propiedad | Tipo | Nota |
|---|---|---|
| `progress` | 0-1 | 0 en `start`, 1 en `end`, recortado [O] |
| `direction` | `1` / `-1` | 1 hacia delante, -1 hacia atrás, en el último cambio [O]. `undefined` hasta que `progress` cambia por primera vez [C] [E] |
| `isActive` | booleano | Entre `start` y `end`. Es `undefined` hasta que `progress` cambia por primera vez [C] [E] |
| `start`, `end` | número | Píxeles de scroll. Con `containerAnimation`, tiempo de la animación [O] [E] |
| `animation` | Tween, Timeline o `undefined` | [O] |
| `callbackAnimation` | animación | La última devuelta por un callback. [scr-toggle](scr-toggle.md) [C] |
| `trigger`, `pin` | Element o `undefined` | Siempre el elemento, aunque se indicara con selector [O] |
| `scroller` | Element o `window` | [O] |
| `vars` | objeto | El mismo objeto que pasaste, al que GSAP añade los defaults [C] [E] |
| `enabled` | booleano | Sin tipar. `false` tras `disable()` [C] [E] |

## Métodos

| Método | Efecto |
|---|---|
| `kill(revert?, allowAnimation?)` | Elimina la instancia, los pines y las escuchas, y mata la animación salvo `allowAnimation`. Sin argumentos la animación no se revierte: ver Trampas. `kill(true)` sí la revierte. Llama a `onKill` [C] [E] |
| `disable(revert?, allowAnimation?)` | Como `kill`, pero recuperable con `enable()`. Quita el pin; la animación solo vuelve atrás si es de `scrub` [C] [E] |
| `enable(reset?, refresh?)` | Reactiva [O] |
| `refresh()` | Recalcula solo esta instancia. [scr-refresh](scr-refresh.md) [O] |
| `update(reset?, recordVelocity?, forceFake?)` | Interno; lo normal es el estático [C] |
| `scroll(pos?)` | Lee o escribe la posición del scroller en su eje [O] |
| `getVelocity()` | Velocidad en px/s [O] |
| `getTween(snap?)` | Tween de `scrub`, o el de ajuste con `true`. [scr-snap](scr-snap.md) [O] |
| `labelToScroll(etiqueta)` | Convierte una etiqueta del timeline en posición de scroll [O] |
| `next()`, `previous()` | Instancia vecina en el orden de refresco [O] |
| `endAnimation()`, `getTrailing(nombre?)` | [scr-toggle](scr-toggle.md) [C] |
| `tweenTo(posicion, vars)` | Anima el scroller. Sin documentar. Exige el segundo argumento [E] |

## Ejemplo

```html
<div style="height:400px"></div>
<div class="zona" style="height:200px"></div>
<div style="height:1200px"></div>
```

```js
const pasos = [];
const st = ScrollTrigger.create({
  trigger: ".zona",
  start: "top center",
  end: "bottom center",
  onUpdate: (self) => pasos.push(self.direction),
  onKill: () => pasos.push("kill"),
});

window.scrollTo(0, 150); // tramo 50-250
ScrollTrigger.update();
const bajando = [st.progress, st.direction, st.isActive];

st.scroll(100);          // setter del scroll, por la instancia
ScrollTrigger.update();
const subiendo = [st.progress, st.direction, window.scrollY];

st.kill();

// prueba: bajando.join() === "0.5,1,true"
// prueba: subiendo.join() === "0.25,-1,100"
// prueba: pasos.join() === "1,-1,kill"
// prueba: st.trigger === document.querySelector(".zona")
```

`kill()` con y sin animación, y `disable()`:

```js
const a = gsap.to(".zona", { x: 100, duration: 0.05, scrollTrigger: { trigger: ".zona" } });
const stA = a.scrollTrigger;
stA.disable();
const desactivado = [stA.enabled, ScrollTrigger.getAll().length];
stA.enable();
stA.kill();

const b = gsap.to(".zona", { y: 100, duration: 0.05, scrollTrigger: { trigger: ".zona" } });
b.scrollTrigger.kill(false, true); // conserva el tween: sigue vivo y sin ScrollTrigger

// prueba: desactivado.join() === "false,1"
// prueba: !a.scrollTrigger
// prueba: ScrollTrigger.getAll().length === 0
```

Qué le pasa a la animación según el modo:

```js
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
window.scrollTo(0, 300);
ScrollTrigger.update();

const conActions = gsap.to(".zona", { x: 100, duration: 0.02, scrollTrigger: { trigger: ".zona", start: "top bottom" } });
await espera(80);
conActions.scrollTrigger.disable();
const xTrasDisable = gsap.getProperty(".zona", "x");
conActions.scrollTrigger.enable();
conActions.scrollTrigger.kill();
const xTrasKill = gsap.getProperty(".zona", "x");

const conScrub = gsap.to(".zona", { y: 100, ease: "none", scrollTrigger: { start: 0, end: 600, scrub: true } });
await espera(50);
const yActiva = gsap.getProperty(".zona", "y");
conScrub.scrollTrigger.disable();
const yTrasDisable = gsap.getProperty(".zona", "y");

const conRevert = gsap.to(".zona", { rotation: 90, duration: 0.02, scrollTrigger: { trigger: ".zona", start: "top bottom" } });
await espera(80);
const giro = gsap.getProperty(".zona", "rotation");
conRevert.scrollTrigger.kill(true);

// prueba: xTrasDisable === 100 && xTrasKill === 100
// prueba: yActiva === 50 && yTrasDisable === 0
// prueba: giro === 90 && gsap.getProperty(".zona", "rotation") === 0
```

Estado inicial, identidad de `vars` y `tweenTo` sin segundo argumento:

```js
const opciones = { start: 100, end: 400 };
const st = ScrollTrigger.create(opciones);
ScrollTrigger.update();
const iniciales = [st.isActive, st.direction];
window.scrollTo(0, 200);
ScrollTrigger.update();

let error = "";
try { st.tweenTo(300); } catch (e) { error = e.name; }

// prueba: iniciales[0] === undefined && iniciales[1] === undefined
// prueba: st.isActive === true && st.direction === 1
// prueba: st.vars === opciones && opciones.toggleActions === "play"
// prueba: error === "TypeError"
```

Vecinos y posición relativa a la instancia anterior:

```js
const uno = ScrollTrigger.create({ id: "uno", trigger: ".zona", start: "top center", end: "bottom center" });
const dos = ScrollTrigger.create({ id: "dos", trigger: ".zona", start: (self) => self.previous().end, end: "+=100" });

// prueba: uno.next() === dos && dos.previous() === uno
// prueba: uno.previous() === undefined && dos.next() === undefined
// prueba: dos.start === uno.end
```

`tweenTo` existe en la instancia y usa el mismo tween de scroll que `snap`. Sus tipos declaran un solo argumento, pero sin el segundo lanza `TypeError`:

```js
await new Promise((r) => setTimeout(r, 250)); // un refresh en curso mataría el tween: se espera al de "load"
const st = ScrollTrigger.create({ start: 0, end: 1000 });
st.tweenTo(300, { duration: 0.05 });

// prueba: window.scrollY === 300
```

## Trampas

- **`kill()` mata la animación por defecto, pero no la revierte.** Una animación de `toggleActions` se queda donde esté; la de `scrub` vuelve a 0, porque la arrastra el progreso de la instancia al revertirse. Para deshacerla, `kill(true)`. Para conservarla viva, `kill(false, true)`: `false` no revierte, `true` no mata. [C] [E]
- **`disable()` no devuelve siempre el elemento a su estado anterior.** Revierte lo que hizo ScrollTrigger: el pin y, con `scrub`, el progreso. Una animación de `toggleActions` no cambia. `disable(false)` lo deja todo donde esté. [C] [E]
- **`self.vars` es el objeto que pasaste, y GSAP lo modifica:** le añade los defaults, como `toggleActions`. Si reutilizas ese objeto en otra instancia, ya los lleva. [C] [E]
- **`animacion.scrollTrigger` desaparece al matar la instancia.** Guarda la referencia si la necesitas después. [E]
- **`getVelocity()` es del scroll, no de la animación.** Con `scrub` numérico, la animación va con retardo. Con saltos programáticos el número es enorme y poco útil. [O] [P]
- **`tweenTo` lo cancela un `refresh()`,** igual que al ajuste de `snap`. [C]
- **`isActive` a `undefined` recién creada.** Un `update` sin cambio de `progress` no lo define: compara con `=== true`. [C] [E]
- **Limpiar al retirar una vista:** `kill()` suelto no basta si queda algún pin sin controlar. Mete todo en `gsap.context()` y haz `revert()`; ver [nuc-limpieza](../02-nucleo/nuc-limpieza.md). [P]
