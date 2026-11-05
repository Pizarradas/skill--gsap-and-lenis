---
id: esp-physics2d
titulo: Physics2DPlugin, trayectorias con velocidad y gravedad
capa: 11-especializados
tipo: plugin
ambito: Physics2DPlugin
resumen: Mueve x e y con velocidad, ángulo, gravedad, aceleración y fricción. Sin colisiones, pero reversible y exacto. Ideal para partículas y proyectiles.
api: [Physics2DPlugin, Physics2DPlugin.Vars.acceleration, Physics2DPlugin.Vars.accelerationAngle, Physics2DPlugin.Vars.angle, Physics2DPlugin.Vars.friction, Physics2DPlugin.Vars.gravity, Physics2DPlugin.Vars.velocity, Physics2DPlugin.Vars.xProp, Physics2DPlugin.Vars.yProp]
relacionadas: [esp-physicsprops, int-inertia]
etiquetas: [fisica, particulas]
fuentes:
  - docs/v3/Plugins/Physics2DPlugin.md
estado: verificado
version: 3.15.1
---
# Physics2DPlugin

Calcula `x` e `y` a partir de parámetros físicos en lugar de un valor final. No sustituye a un motor de física: no hay colisiones. Pero al ser un tween, se puede rebobinar y buscar cualquier punto. [O]

## Para qué sirve

Confeti, chispas, proyectiles u objetos que caen.

| Necesidad | Plugin |
|---|---|
| Trayectoria en 2 ejes | `physics2D` |
| Una o varias propiedades independientes | [`physicsProps`](esp-physicsprops.md) |
| Frenar hasta parar sola, sin fijar duración | [`inertia`](../10-interaccion/int-inertia.md) |

## Registro

```js fragmento
import gsap from "gsap";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";

gsap.registerPlugin(Physics2DPlugin);
```

**Sin empaquetador:** `<script>` con `dist/Physics2DPlugin.min.js` (global `Physics2DPlugin`), o entrada `gsap/Physics2DPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

| Opción | Defecto | Efecto |
|---|---|---|
| `velocity` | 0 | Píxeles por segundo [O] |
| `angle` | 0 | Dirección inicial en grados. `-60` es arriba a la derecha [O] |
| `gravity` | — | Aceleración hacia abajo. Fija `accelerationAngle` en 90 [O] |
| `acceleration` | 0 | Aceleración en la dirección `accelerationAngle` [O] |
| `accelerationAngle` | el valor de `angle` | Dirección de la aceleración [C] |
| `friction` | 0 | 0–1. 0.02 ya se nota. Coste mayor [O] |
| `xProp` `yProp` | `"x"` `"y"` | Propiedades que se animan, como `"left"` y `"top"` [O] |

Sin fricción, la posición es exactamente `inicio + v·t + a·t²/2`, por componente. [C] [E]

## Ejemplo

```js
const bala = { x: 10, y: 20 };
const tiro = gsap.to(bala, {
  duration: 2,
  paused: true,
  ease: "power4.in", // se ignora
  physics2D: { velocity: 300, angle: 0, gravity: 400 },
});
tiro.time(0.5);
const instante = { x: bala.x, y: bala.y };
tiro.time(0);
// prueba: Math.abs(instante.x - 160) < 0.01
// prueba: Math.abs(instante.y - 70) < 0.01
// prueba: bala.x === 10 && bala.y === 20
```

Partículas en un timeline, reversibles:

```html
<div class="chispa" style="position:absolute;left:300px;top:300px;width:6px;height:6px"></div>
<div class="chispa" style="position:absolute;left:300px;top:300px;width:6px;height:6px"></div>
<div class="chispa" style="position:absolute;left:300px;top:300px;width:6px;height:6px"></div>
```

```js
const tl = gsap.timeline({ paused: true });
gsap.utils.toArray(".chispa").forEach((el, i) => {
  tl.to(el, {
    duration: 1,
    physics2D: { velocity: 200 + i * 50, angle: -90 + i * 20, gravity: 300, friction: 0.05 },
  }, 0);
});
tl.progress(0.5);
const movida = gsap.getProperty(".chispa", "y");
tl.progress(1).progress(0);
// prueba: movida !== 0
// prueba: gsap.getProperty(".chispa", "y") === 0
```

Con `left` y `top`, cuando no quieres transformaciones:

```html
<div id="caida" style="position:absolute;left:0;top:0;width:10px;height:10px"></div>
```

```js
const caida = document.querySelector("#caida");
const t = gsap.to(caida, { duration: 1, paused: true, physics2D: { velocity: 100, angle: 90, xProp: "left", yProp: "top" } });
t.progress(1);
// prueba: Math.round(parseFloat(caida.style.top)) === 100
// prueba: caida.style.transform === ""
```

## Trampas

- **`ease` se ignora.** La física determina el movimiento. [O]
- **No se detiene sola.** Corta en seco al acabar `duration`. Funde a 0 con otro tween antes de que termine. [P]
- **`gravity` o `acceleration`, no ambas.** `gravity` sobrescribe a las otras dos. [O] [C]
- **`accelerationAngle` por defecto no es 90.** Si usas `acceleration` sin ángulo, acelera en la dirección de `angle`. [C]
- **No admite cambios en caliente.** Los parámetros se fijan al iniciar. [O]
- **Con `friction` se simula a 30 pasos por segundo,** interpolando entre pasos. Rebobinar recalcula desde el inicio, por lo que muchas partículas largas se notan. [C]
