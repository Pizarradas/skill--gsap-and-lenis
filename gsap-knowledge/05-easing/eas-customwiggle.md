---
id: eas-customwiggle
titulo: CustomWiggle, oscilaciones
capa: 05-easing
tipo: plugin
ambito: CustomWiggle
resumen: Ease que oscila y regresa al punto de partida, para sacudidas, avisos y enjambres. Tipos, amplitudeEase y timingEase, y su sintaxis en cadena.
api: [CustomWiggle.create, CustomWiggle.ease, CustomWiggle.register, CustomWiggleVars.type, CustomWiggleVars.wiggles, CustomWiggleVars.amplitudeEase, CustomWiggleVars.timingEase]
requiere: [eas-customease]
relacionadas: [eas-custombounce, eas-catalogo]
etiquetas: [easing, oscilacion, plugin]
fuentes:
  - docs/v3/Eases/CustomWiggle.md
estado: verificado
version: 3.15.1
---
# CustomWiggle

Crea un ease que va y viene alrededor del punto de partida y termina **donde empezó**. La intensidad la da el valor del tween: `rotation: 30` oscila ±30°. [O]

## Para qué sirve

Sacudir un campo con error, llamar la atención sobre un icono o añadir temblor. Con dos tweens aleatorios en `x` e `y` se consigue un movimiento de enjambre. [O]

## Registro

```js fragmento
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { CustomWiggle } from "gsap/CustomWiggle";

gsap.registerPlugin(CustomEase, CustomWiggle);
```

**Sin empaquetador:** `<script>` con `dist/CustomEase.min.js` y `dist/CustomWiggle.min.js` (globales `CustomEase` y `CustomWiggle`), o entradas `gsap/CustomEase` y `gsap/CustomWiggle` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

Necesita CustomEase. [O]

## API

```text
CustomWiggle.create(id, vars?)   → función de ease
new CustomWiggle(id, vars?)      → instancia con .ease
ease: "wiggle(15)"               en cadena, número de oscilaciones
ease: "wiggle({type:anticipate, wiggles:8})"
```

| `CustomWiggleVars` | Defecto | Efecto |
|---|---|---|
| `wiggles` | 10 | Número de oscilaciones |
| `type` | `"easeOut"` | Preset de amplitud y tiempo |
| `amplitudeEase` | | Curva de la amplitud, de 1 a 0. Sustituye al `type` |
| `timingEase` | | Reparto de las ondas en el tiempo. Sustituye al `type` |

| `type` | Comportamiento |
|---|---|
| `easeOut` | Empieza fuerte y se apaga |
| `easeInOut` | Crece y decrece |
| `anticipate` | Pequeño retroceso previo, luego oscila |
| `uniform` | Amplitud constante |
| `random` | Amplitud y reparto aleatorios |

## Ejemplo

```html
<input class="campo">
```

```js
CustomWiggle.create("sacudida", { wiggles: 6 });

const estado = { x: 0 };
const toque = gsap.to(estado, { x: 10, duration: 0.3, ease: "sacudida" });
const curva = gsap.parseEase("sacudida");

let maximo = 0;
let minimo = 0;
for (let i = 0; i <= 500; i++) {
  maximo = Math.max(maximo, curva(i / 500));
  minimo = Math.min(minimo, curva(i / 500));
}

gsap.to(".campo", { x: 5, duration: 0.3, ease: "wiggle(5)" });

// prueba: curva(0) === 0 && curva(1) === 0
// prueba: maximo > 0.9 && minimo < -0.9
// prueba: estado.x === 0
// prueba: gsap.getProperty(".campo", "x") === 0
```

Sintaxis en cadena y por clase: [E]

```js
const simple = gsap.parseEase("wiggle(15)");
const detalle = gsap.parseEase("wiggle({type:anticipate, wiggles:8})");
const instancia = new CustomWiggle("onda", { wiggles: 3 });

// prueba: typeof simple === "function" && typeof detalle === "function"
// prueba: simple(1) === 0
// prueba: gsap.parseEase("onda") === instancia.ease
```

Curvas de amplitud y tiempo propias: [E]

```js
const propia = CustomWiggle.create("mia", { wiggles: 4, amplitudeEase: "none", timingEase: "power2.in" });

// prueba: propia(1) === 0
```

## Trampas

- **El tween no termina en el valor indicado.** `x: 10` con un wiggle deja `x` en el inicio. Es el propósito, pero `onComplete` no verá 10, y un `to()` posterior parte de 0. Para acabar en otro sitio, anímalo con un tween aparte. [E]
- **Son eases, no valores.** Dos tweens simultáneos en `x` con wiggle compiten como cualquiera. Usa `overwrite: "auto"` al repetir la sacudida. Ver [overwrite](../02-nucleo/nuc-overwrite.md). [P]
- **`amplitudeEase` y `timingEase` anulan `type`.** No se combinan. [O]
- **`wiggles` debe ser entero.** Se trunca: `6.8` son 6. [C]
- **`"wiggle"` no existe en cadena sin haber cargado el plugin**, y se usará el ease por defecto: no oscilará. [C]
- **`type: "random"`** cambia con cada creación, no con cada tween: dos tweens que usan el mismo id oscilan igual. Crea un id distinto para variar. [C]
