---
id: eas-custombounce
titulo: CustomBounce, rebotes con aplastamiento
capa: 05-easing
tipo: plugin
ambito: CustomBounce
resumen: Crea un ease de rebote configurable y, opcionalmente, un segundo ease sincronizado para aplastar y estirar el objeto.
api: [CustomBounce.create, CustomBounce.ease, CustomBounce.register, CustomBounceVars.strength, CustomBounceVars.endAtStart, CustomBounceVars.squash, CustomBounceVars.squashID]
requiere: [eas-customease]
relacionadas: [eas-customwiggle, eas-catalogo]
etiquetas: [easing, rebote, plugin]
fuentes:
  - docs/v3/Eases/CustomBounce.md
estado: verificado
version: 3.15.1
---
# CustomBounce

`"bounce"` tiene forma fija. CustomBounce genera un rebote a medida con [CustomEase](eas-customease.md) y puede crear además un ease de aplastamiento, que se ejecuta en paralelo con `scaleX` y `scaleY`. [O]

## Para qué sirve

Una pelota que cae, se queda un instante en el suelo mientras se aplasta y rebota con menos fuerza. Con un `bounce` normal no hay ese momento en contacto. [O]

## Registro

```js fragmento
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { CustomBounce } from "gsap/CustomBounce";

gsap.registerPlugin(CustomEase, CustomBounce);
```

**Sin empaquetador:** `<script>` con `dist/CustomEase.min.js` y `dist/CustomBounce.min.js` (globales `CustomEase` y `CustomBounce`), o entradas `gsap/CustomEase` y `gsap/CustomBounce` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

Necesita **CustomEase**: sin él, avisa con `Please gsap.registerPlugin(CustomEase, CustomBounce)`. [O] [C]

## API

```text
CustomBounce.create(id, vars?)   → función de ease
new CustomBounce(id, vars?)      → instancia con .ease
```

| `CustomBounceVars` | Tipo | Defecto | Efecto |
|---|---|---|---|
| `strength` | 0 a 1 | 0.7 | Número de rebotes: más alto, más botes. Tope interno 0.999 [C] |
| `squash` | número | 0 | Duración del contacto con el suelo. 2 es habitual. Con 0 no se crea el ease de aplastamiento |
| `squashID` | cadena | `id + "-squash"` | Nombre del ease de aplastamiento |
| `endAtStart` | booleano | `false` | Termina donde empezó: un salto desde el suelo |

Curvas generadas: [E]

| Ease | Inicio | Fin | Recorrido |
|---|---|---|---|
| Rebote | 0 | 1 | 0 a 1, siempre tocando 1 en cada contacto |
| Rebote con `endAtStart` | 0 | 0 | 0 a 1 y vuelta |
| Aplastamiento | 0 | 0 | Picos hasta 1, y rebases negativos que estiran |

## Ejemplo

```html
<div class="pelota" style="width:50px;height:50px"></div>
```

```js
CustomBounce.create("caida", { strength: 0.6, squash: 3, squashID: "caida-plana" });

const salto = gsap.timeline({ defaults: { duration: 0.2 } });
salto
  .from(".pelota", { y: -200, ease: "caida" }, 0)
  .to(".pelota", {
    scaleX: 1.4,
    scaleY: 0.6,
    ease: "caida-plana",
    transformOrigin: "center bottom",
  }, 0);

const aplastar = gsap.parseEase("caida-plana");

// prueba: gsap.parseEase("caida")(1) === 1
// prueba: aplastar(0) === 0 && aplastar(1) === 0
// prueba: gsap.getProperty(".pelota", "y") === 0
// prueba: gsap.getProperty(".pelota", "scaleX") === 1
```

El tween de aplastamiento va **hacia** la forma más aplastada: como su ease acaba en 0, vuelve solo a la escala original. [E]

Rebotes según `strength`, contados en la curva: [E]

```js
function contarRebotes(fuerza) {
  const curva = CustomBounce.create("cuenta" + fuerza, { strength: fuerza });
  let botes = 0;
  let previo = 0;
  let subiendo = false;
  for (let i = 1; i <= 2000; i++) {
    const v = curva(i / 2000);
    if (v < previo && subiendo) {
      botes++;
      subiendo = false;
    } else if (v > previo) {
      subiendo = true;
    }
    previo = v;
  }
  return botes;
}

const pocos = contarRebotes(0.1);
const medios = contarRebotes(0.5);
const muchos = contarRebotes(0.9);

// prueba: pocos < medios && medios < muchos
```

Salto desde el suelo y forma de clase:

```js
const brinco = CustomBounce.create("brinco", { endAtStart: true });
const instancia = new CustomBounce("otro", { strength: 0.5 });

// prueba: brinco(0) === 0 && Math.abs(brinco(1)) < 0.001
// prueba: typeof instancia.ease === "function"
// prueba: gsap.parseEase("otro") === instancia.ease
```

## Trampas

- **Sin `squash` no existe `id-squash`.** El aplastamiento solo se crea con `squash` mayor que 0. Usar su nombre sin crearlo cae en el ease por defecto, sin aviso. [E]

```js
CustomBounce.create("simple", { strength: 0.5 });
CustomBounce.create("con", { strength: 0.5, squash: 2 });

// prueba: gsap.parseEase("simple-squash") === undefined
// prueba: typeof gsap.parseEase("con-squash") === "function"
```

- **`from()` es la forma natural.** El rebote termina en 1, así que el suelo es el valor final. Con `to()` el objeto rebota contra el destino. [O]
- **Mismo tiempo en ambos tweens.** Los dos eases se reparten la misma duración: deben coincidir en `duration` y en posición. [O]
- **`transformOrigin` abajo.** Sin `"center bottom"` el aplastamiento se hace desde el centro y el objeto se separa del suelo. [O]
- **`strength` no es la altura.** La altura la marca la distancia del tween. [C]
