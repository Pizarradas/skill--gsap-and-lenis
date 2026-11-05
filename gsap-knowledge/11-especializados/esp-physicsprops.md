---
id: esp-physicsprops
titulo: PhysicsPropsPlugin, cualquier propiedad con física
capa: 11-especializados
tipo: plugin
ambito: PhysicsPropsPlugin
resumen: Anima propiedades numéricas con velocidad, aceleración y fricción propias, sin valor final definido. Cada propiedad lleva sus parámetros.
api: [PhysicsPropsPlugin, PhysicsPropsPlugin.Values.acceleration, PhysicsPropsPlugin.Values.friction, PhysicsPropsPlugin.Values.velocity]
relacionadas: [esp-physics2d, int-inertia]
etiquetas: [fisica]
fuentes:
  - docs/v3/Plugins/PhysicsPropsPlugin.md
estado: verificado
version: 3.15.1
---
# PhysicsPropsPlugin

Variante de [Physics2DPlugin](esp-physics2d.md) para cualquier propiedad numérica de cualquier objeto, sin ángulo. Se define cómo cambia cada valor, no a dónde llega. [O]

## Para qué sirve

Giros que aceleran, contadores que se frenan, o valores numéricos de tus propios objetos.

## Registro

```js fragmento
import gsap from "gsap";
import { PhysicsPropsPlugin } from "gsap/PhysicsPropsPlugin";

gsap.registerPlugin(PhysicsPropsPlugin);
```

**Sin empaquetador:** `<script>` con `dist/PhysicsPropsPlugin.min.js` (global `PhysicsPropsPlugin`), o entrada `gsap/PhysicsPropsPlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

```text
physicsProps: { propiedad: { velocity, acceleration, friction }, … }
```

| Opción | Defecto | Efecto |
|---|---|---|
| `velocity` | 0 | Unidades por segundo [O] |
| `acceleration` | 0 | Unidades por segundo al cuadrado [O] |
| `friction` | 0 | 0–1. No es exacta; empieza en 0.02 [O] |

`friction` y `acceleration` son opcionales. [O] Una propiedad sin `velocity` ni `acceleration` se descarta. [C]

## Ejemplo

```js
const obj = { giro: 0, escala: 1, fijo: 5 };
const t = gsap.to(obj, {
  duration: 2,
  paused: true,
  physicsProps: {
    giro: { velocity: 100, acceleration: 50 },
    escala: { velocity: -0.2 },
    fijo: { friction: 0.5 },
  },
});
t.time(1);
const enUno = { giro: obj.giro, escala: obj.escala };
t.time(2);
const alFinal = obj.giro;
t.time(0);
// prueba: Math.abs(enUno.giro - 125) < 0.01
// prueba: Math.abs(enUno.escala - 0.8) < 0.01
// prueba: Math.abs(alFinal - 300) < 0.01
// prueba: obj.giro === 0 && obj.escala === 1 && obj.fijo === 5
```

Fricción sobre una transformación CSS:

```html
<div class="rueda" style="width:40px;height:40px"></div>
```

```js
const rueda = gsap.to(".rueda", { duration: 1, paused: true, physicsProps: { rotation: { velocity: 720, friction: 0.05 } } });
rueda.time(0.5);
const media = gsap.getProperty(".rueda", "rotation");
rueda.time(1);
const fin = gsap.getProperty(".rueda", "rotation");
// prueba: media > 0 && fin > media
// prueba: fin - media < media
```

La segunda mitad recorre menos que la primera: la fricción frena el giro. [E]

## Trampas

- **`ease` se ignora.** [O]
- **Termina de golpe:** con `duration` la animación corta donde esté, aunque aún tenga velocidad. Para frenar hasta parar sola, usa [InertiaPlugin](../10-interaccion/int-inertia.md). [P]
- **Parámetros fijos** tras iniciar. [O]
- **`friction` sola no mueve nada:** sin velocidad la propiedad queda fuera del tween. [C] [E]
- **Es reversible:** `reverse()` retrocede exactamente por el mismo camino. Con fricción, cada paso atrás recalcula desde el inicio. [O] [C]
