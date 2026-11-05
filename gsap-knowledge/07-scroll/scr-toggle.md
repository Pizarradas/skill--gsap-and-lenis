---
id: scr-toggle
titulo: toggleActions, toggleClass y callbacks de ScrollTrigger
capa: 07-scroll
tipo: concepto
ambito: ScrollTrigger
resumen: Las cuatro transiciones del tramo, acciones sobre la animación, clases, callbacks, once, y cómo evitar solapes con fastScrollEnd y preventOverlaps.
api: [ScrollTrigger.Vars.toggleActions, ScrollTrigger.Vars.toggleClass, ScrollTrigger.ToggleClassVars.className, ScrollTrigger.ToggleClassVars.targets, ScrollTrigger.Vars.once, ScrollTrigger.Vars.onEnter, ScrollTrigger.Vars.onLeave, ScrollTrigger.Vars.onEnterBack, ScrollTrigger.Vars.onLeaveBack, ScrollTrigger.Vars.onToggle, ScrollTrigger.Vars.onUpdate, ScrollTrigger.Vars.fastScrollEnd, ScrollTrigger.Vars.preventOverlaps, ScrollTrigger.callbackAnimation, ScrollTrigger.endAnimation, ScrollTrigger.getTrailing]
requiere: [scr-start-end]
relacionadas: [scr-scrub, scr-batch, scr-instancia, rec-revelar-scroll]
etiquetas: [scroll, callbacks, clases]
fuentes:
  - docs/v3/Plugins/ScrollTrigger.md
  - docs/v3/Plugins/ScrollTrigger/isActive.md
  - docs/v3/Plugins/ScrollTrigger/direction.md
  - resources/st-mistakes.md
estado: verificado
version: 3.15.1
---
# toggleActions, toggleClass y callbacks

Sin `scrub`, la instancia funciona como un interruptor: reacciona al cruzar `start` o `end`, en cualquier sentido. La animación corre con su propia duración, independiente de la velocidad del scroll.

## Modelo mental

Cuatro transiciones, siempre en este orden en `toggleActions`:

```text
             start ─────────── end
  bajando   ──▶ onEnter         ──▶ onLeave
  subiendo  onLeaveBack ◀──         onEnterBack ◀──
```

`toggleActions: "onEnter onLeave onEnterBack onLeaveBack"`, con una palabra para cada una entre `play`, `pause`, `resume`, `reset`, `restart`, `complete`, `reverse` y `none`. Por defecto: `"play none none none"`. [O]

| Patrón | `toggleActions` |
|---|---|
| Reproducir una vez y quedarse | por defecto, o `once: true` si además quieres liberar la instancia |
| Reversible al salir hacia arriba | `"play none none reverse"` |
| Reinicia cada vez que entra | `"restart none restart none"` |
| Solo mientras está en pantalla | `"play pause resume pause"` |
| Reproduce y deshace en cada sentido | `"play reverse play reverse"` |

| Callback | Se dispara |
|---|---|
| `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` | Al cruzar el punto correspondiente |
| `onToggle` | Al cambiar `isActive`. No se dispara si en un solo tick pasa de antes de `start` a después de `end` [O] |
| `onUpdate` | Al cambiar `progress`. Dentro de `self` tienes `progress`, `direction`, `isActive`, `getVelocity()` [O] |

Todos reciben la instancia como único argumento. Si `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` u `onToggle` **devuelven** una animación, queda registrada en `self.callbackAnimation`, y `fastScrollEnd` y `preventOverlaps` pueden completarla. Lo que devuelva `onUpdate` no se registra. [C] [E]

## Ejemplo

```html
<div style="height:500px"></div>
<div class="tarjeta" style="height:200px"></div>
<div style="height:1500px"></div>
```

Recorrido completo por las cuatro transiciones. Tramo 150-350 (`"top center"` a `"bottom center"`):

```js
const pasos = [];
const tarjeta = document.querySelector(".tarjeta");
const tw = gsap.to(".tarjeta", {
  x: 100,
  duration: 0.05,
  scrollTrigger: {
    trigger: ".tarjeta", start: "top center", end: "bottom center",
    toggleClass: "activa",
    toggleActions: "play reverse restart reset",
    onEnter: () => pasos.push("enter"),
    onLeave: () => pasos.push("leave"),
    onEnterBack: () => pasos.push("enterBack"),
    onLeaveBack: () => pasos.push("leaveBack"),
    onToggle: (self) => pasos.push(self.isActive ? "on" : "off"),
  },
});
const ir = async (y) => {
  window.scrollTo(0, y);
  ScrollTrigger.update();
  await new Promise((r) => setTimeout(r, 100));
};

await ir(200);
const dentro = [tarjeta.classList.contains("activa"), tw.progress()]; // play
await ir(600);
const fuera = [tarjeta.classList.contains("activa"), tw.progress(), tw.reversed()]; // reverse
await ir(300);
await ir(0);

// prueba: dentro.join() === "true,1"
// prueba: fuera.join() === "false,0,true"
// prueba: pasos.join() === "on,enter,off,leave,on,enterBack,off,leaveBack"
// prueba: tw.progress() === 0 && tw.paused() === true
```

`onToggle` se ejecuta antes que el callback concreto. [E]

### `toggleClass`

Acepta el nombre (va al `trigger`) o un objeto `ToggleClassVars` con `targets` y `className`. La clase está puesta mientras `isActive` es verdadero, y `toggleActions` no le afecta. [O] Con `once: true` es distinto: se añade al entrar y sigue puesta tras `end`. [C] [E]

```js
ScrollTrigger.create({
  trigger: ".tarjeta",
  start: "top top",
  toggleClass: { targets: ".menu", className: "fijo" },
});
window.scrollTo(0, 550);
ScrollTrigger.update();

// prueba: document.querySelector(".menu").classList.contains("fijo")
// prueba: !document.querySelector(".tarjeta").classList.contains("fijo")
```

### `once`

Mata la instancia al alcanzar `end` y deja de escuchar el scroll, sin matar la animación. Cada callback se dispara como máximo una vez. [O] [C] `toggleActions` no se fuerza: hasta llegar a `end` se aplica el que hayas puesto, de modo que `"play none none reverse"` rebobina al volver por `start`. [E]

```js
let entradas = 0;
const unaVez = ScrollTrigger.create({ trigger: ".tarjeta", start: "top center", end: "bottom center", once: true, onEnter: () => entradas++ });

window.scrollTo(0, 200); ScrollTrigger.update();
window.scrollTo(0, 0); ScrollTrigger.update();
window.scrollTo(0, 200); ScrollTrigger.update();
const antes = ScrollTrigger.getAll().length;
window.scrollTo(0, 800); ScrollTrigger.update();

// prueba: entradas === 1
// prueba: antes === 1
// prueba: ScrollTrigger.getAll().length === 0
```

`once` frente a `toggleActions` y `toggleClass`, y qué callbacks registran su animación:

```js
const ir = async (y) => {
  window.scrollTo(0, y);
  ScrollTrigger.update();
  await new Promise((r) => setTimeout(r, 80));
};
const tw = gsap.to(".tarjeta", {
  x: 100,
  duration: 0.02,
  scrollTrigger: { trigger: ".tarjeta", start: "top center", end: "bottom center", once: true, toggleActions: "play none none reverse", toggleClass: "vista" },
});
const enUpdate = gsap.to({ a: 0 }, { a: 1, paused: true });
const enEnter = gsap.to({ a: 0 }, { a: 1, paused: true });
const conUpdate = ScrollTrigger.create({ start: 100, end: 1000, onUpdate: () => enUpdate });
const conEnter = ScrollTrigger.create({ start: 100, end: 1000, onEnter: () => enEnter });

await ir(200);
const dentro = tw.progress();
await ir(0);
const rebobinada = tw.progress();
await ir(200);
await ir(800);

// prueba: dentro === 1 && rebobinada === 0
// prueba: !tw.scrollTrigger
// prueba: document.querySelector(".tarjeta").classList.contains("vista")
// prueba: conEnter.callbackAnimation === enEnter
// prueba: conUpdate.callbackAnimation === undefined
```

### Solapes con scroll rápido

Si varias secciones se reproducen con su duración y el usuario baja deprisa, las animaciones de las anteriores siguen en marcha al llegar a las nuevas.

| Opción | Valor | Efecto |
|---|---|---|
| `fastScrollEnd` | `true` o px/s | Al **salir** del tramo a más de esa velocidad (2500 px/s por defecto), lleva la animación a un extremo y la pausa: al final si sale por `end`, al inicio si sale por `start` o si su acción era `reverse` [C] [E] |
| `preventOverlaps` | `true` o cadena | Al activarse, completa las animaciones previas. Con cadena, solo las del mismo grupo. Con función (en los tipos), llama a ella en su lugar [O] [C] |

`getTrailing(nombre)` devuelve las instancias ya rebasadas en el sentido del scroll, y `endAnimation()` fuerza el final de la animación de una instancia; son lo que usa `preventOverlaps` por dentro. [C]

```js
const a = gsap.to(".uno", { x: 100, duration: 5, scrollTrigger: { start: 100, end: 200, preventOverlaps: "bloque" } });
const b = gsap.to(".dos", { x: 100, duration: 5, scrollTrigger: { start: 300, end: 400, preventOverlaps: "bloque" } });

window.scrollTo(0, 150); ScrollTrigger.update();
const previos = (window.scrollTo(0, 350), ScrollTrigger.update(), b.scrollTrigger.getTrailing("bloque").length);

// prueba: previos === 1
// prueba: a.progress() === 1
// prueba: b.progress() < 1
```

`fastScrollEnd` solo completa hacia delante; al salir por `start`, rebobina:

```js
await new Promise((r) => setTimeout(r, 520));
const ir = async (y) => {
  window.scrollTo(0, y);
  ScrollTrigger.update();
  await new Promise((r) => setTimeout(r, 40));
};
const baja = gsap.to({ a: 0 }, { a: 1, duration: 5, ease: "none", scrollTrigger: { start: 100, end: 900, fastScrollEnd: 1 } });
const sube = gsap.to({ a: 0 }, { a: 1, duration: 5, ease: "none", scrollTrigger: { start: 100, end: 1200, fastScrollEnd: 1 } });
await new Promise((r) => setTimeout(r, 50));

await ir(150);
await ir(500);
await ir(1000);
const alSalirPorEnd = [baja.progress(), baja.paused(), sube.paused()];
await ir(500);
await ir(0);

// prueba: alSalirPorEnd.join() === "1,true,false"
// prueba: sube.progress() === 0 && sube.paused() === true
```

## Trampas

- **Recargar a media página.** Si el scroll ya pasó el punto, los `onEnter` de todo lo anterior se disparan en la carga, salvo con `ScrollTrigger.config({ limitCallbacks: true })` ([scr-estaticos](scr-estaticos.md)). [O]
- **Lanzar `gsap.to` dentro de un callback** sin `overwrite`: entrar y salir rápido apila tweens enfrentados. Usa `overwrite: "auto"` o un tween existente con `play()`/`reverse()`. [P]
- **Quieres que la animación empiece en un sitio y se reinicie en otro.** Un solo tramo no puede: crea dos instancias, una que hace `play` y otra, con `onLeaveBack`, que hace `pause(0)` cuando ya no se ve. [O]
- **`toggleActions` con `scrub`** no hace nada. Elige uno. [C]
- **`toggleClass` tiene su propio ciclo.** Para quitar la clase en otro punto, usa callbacks y `classList`. [O]
- **`once: true` no equivale a matar en `onEnter`:** la instancia sigue viva hasta `end`, y al llegar se elimina, así que sus medidas y su `getById` desaparecen. [C] [E]
- **`self.direction` es la del último scroll,** no el sentido en el que entró. Se usa en los callbacks, pero fuera de ellos ya puede haber cambiado. [O]
