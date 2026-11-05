---
id: eas-easepack
titulo: EasePack, SlowMo, RoughEase y ExpoScaleEase
capa: 05-easing
tipo: plugin
ambito: EasePack
resumen: Tres eases extra del archivo EasePack, slow para cámara lenta, rough para irregularidades y expoScale para corregir el zoom.
api: [gsap.EasePack.SlowMo, gsap.EasePack.RoughEase, gsap.EasePack.ExpoScaleEase, gsap.SlowMo.config, gsap.SlowMo.ease, gsap.SlowMoEase.config, gsap.RoughEase.config, gsap.RoughEase.ease, gsap.RoughEaseEase.config, gsap.RoughEaseVars.clamp, gsap.RoughEaseVars.points, gsap.RoughEaseVars.randomize, gsap.RoughEaseVars.strength, gsap.RoughEaseVars.taper, gsap.RoughEaseVars.template, gsap.ExpoScaleEase.config]
requiere: [eas-guia]
relacionadas: [eas-catalogo, eas-registro]
etiquetas: [easing, plugin, zoom]
fuentes:
  - docs/v3/Eases/SlowMo.md
  - docs/v3/Eases/RoughEase.md
  - docs/v3/Eases/ExpoScaleEase.md
estado: verificado
version: 3.15.1
---
# EasePack

Paquete con tres eases que no están en el núcleo: `"slow"`, `"rough"` y `"expoScale"`. [O]

## Para qué sirve

| Ease | Cadena | Uso |
|---|---|---|
| SlowMo | `slow(linearRatio, power, yoyoMode)` | Tramo central casi lineal con extremos rápidos: texto que entra, se lee y sale |
| RoughEase | `rough({...})` | Movimiento irregular: parpadeos, nervios |
| ExpoScaleEase | `expoScale(inicio, fin, ease?)` | Velocidad percibida constante en un `scale` |

## Registro

```js fragmento
import gsap from "gsap";
import { EasePack } from "gsap/EasePack";

gsap.registerPlugin(EasePack);
```

**Sin empaquetador:** `<script>` con `dist/EasePack.min.js` (global `EasePack`), o entrada `gsap/EasePack` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

Sin cargar el paquete, las cadenas se sustituyen en silencio por el ease por defecto. Por CDN se incluye con `EasePack.min.js`. [O] [C]

## API

### SlowMo

| Parámetro | Defecto | Efecto |
|---|---|---|
| `linearRatio` | 0.7 | Fracción del tiempo con ritmo constante, de 0 a 1 |
| `power` | 0.7 | Fuerza de los extremos. Con más de 1 invierte el tramo central |
| `yoyoMode` | `false` | Devuelve 0, 1 y 0: para sincronizar un fundido de entrada y salida |

### RoughEase: `gsap.RoughEaseVars`

| Opción | Defecto | Efecto |
|---|---|---|
| `points` | 20 | Número de puntos: más, más sacudidas |
| `strength` | 1 | Distancia máxima a la plantilla |
| `template` | `"none"` | Ease que sirve de guía |
| `taper` | `"none"` | `"in"`, `"out"`, `"both"`: reduce la rugosidad en un extremo |
| `randomize` | `true` | Con `false`, zigzag regular |
| `clamp` | `false` | Limita los valores entre 0 y 1 |

Una cadena con parámetros genera su curva aleatoria al interpretarse, una vez por tween: dos tweens con la misma cadena no comparten forma. Para repetir la misma, guarda la función de `gsap.parseEase()` o `RoughEase.config()`. `"rough"` sin parámetros sí es una única curva compartida. Con `clamp: false` puede salirse de rango a mitad, aunque siempre termina en 1. [O] [C] [E]

### ExpoScaleEase

Un `scale` lineal parece frenar al crecer, porque cada incremento es proporcionalmente menor. `expoScale` compensa. Hay que pasarle los mismos extremos del tween, y puede curvar un ease existente como tercer parámetro. [O]

### Tipos

`gsap.EasePack` agrupa `SlowMo`, `RoughEase` y `ExpoScaleEase`. `gsap.SlowMoEase` y `gsap.RoughEaseEase` describen `.ease`, un alias que apunta al mismo objeto, por compatibilidad. Los tres objetos tienen `config()`. [C] [E]

## Ejemplo

```html
<div class="foto" style="width:50px;height:50px"></div>
```

```js
gsap.fromTo(".foto", { scale: 1 }, { scale: 2, duration: 0.1, ease: "expoScale(1, 2)" });

const zoom = gsap.parseEase("expoScale(1, 2)");
const base = gsap.parseEase("expoScale(0.5, 3, power2.inOut)");
const conClase = ExpoScaleEase.config(1, 2, "power2.in");

// prueba: Math.abs(zoom(0.5) - 0.4142) < 0.0001
// prueba: zoom(0) === 0 && zoom(1) === 1
// prueba: Math.abs(base(0.5) - 0.2899) < 0.0001
// prueba: conClase(0.5) < zoom(0.5)
```

Un texto con ritmo de lectura y su fundido sincronizado:

```html
<p class="lema">Hola</p>
```

```js
const viaje = gsap.parseEase("slow(0.7, 0.7)");
const fundido = gsap.parseEase("slow(0.7, 0.7, true)");

gsap.fromTo(".lema", { x: -100 }, { x: 100, duration: 0.2, ease: "slow(0.7, 0.7)" });
gsap.fromTo(".lema", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "slow(0.7, 0.7, true)" });

// prueba: viaje(0) === 0 && viaje(0.5) === 0.5 && viaje(1) === 1
// prueba: fundido(0) === 0 && fundido(0.5) === 1 && fundido(1) === 0
// prueba: SlowMo.ease === SlowMo
// prueba: Math.abs(SlowMo.config(0.5, 0.8)(0.5) - 0.5) < 1e-9
```

Rugosidad en forma de objeto dentro de la cadena, o con `config()`:

```js
const nervio = gsap.parseEase("rough({points: 30, strength: 3})");
const sujeto = gsap.parseEase("rough({points: 30, strength: 3, clamp: true})");
const regular = RoughEase.config({ points: 10, randomize: false, taper: "out", template: "power2.in" });

let min = 1;
for (let i = 0; i <= 200; i++) min = Math.min(min, sujeto(i / 200));

// prueba: nervio(0) === 0 && nervio(1) === 1
// prueba: min >= 0
// prueba: regular(1) === 1
// prueba: RoughEase.ease === RoughEase
// prueba: Object.keys(EasePack).join().includes("SlowMo")
// prueba: gsap.parseEase("rough")(0.37) === gsap.parseEase("rough")(0.37)
// prueba: gsap.parseEase("rough({points: 20})")(0.37) !== gsap.parseEase("rough({points: 20})")(0.37)
```

## Trampas

- **`yoyoMode` termina en 0.** Con `opacity: 1`, el valor final queda en el inicio, es decir, invisible. Es lo que se busca al sincronizar con `slow`, pero sorprende si se usa suelto. Sin él, `"slow"` acaba en 1. [E]
- **`expoScale` no admite 0.** Con un extremo a 0 devuelve `NaN`: el logaritmo no existe. Usa 0.01, pero no un valor diminuto, o casi todo el tween pasará por valores invisibles. [O] [E]

```js
const roto = gsap.parseEase("expoScale(0, 2)");
const valido = gsap.parseEase("expoScale(0.01, 2)");

// prueba: Number.isNaN(roto(0.5))
// prueba: valido(0.5) > 0 && valido(0.5) < 1
```

- **Los parámetros deben coincidir con el tween.** `expoScale(1, 2)` en un tween de 1 a 4 no corrige bien, sin aviso. [O]
- **La página de `SlowMo` afirma** que `"slow"` y `"slow(0.5, 0.8)"` son iguales, pero los valores por defecto son 0.7 y 0.7, y ambas curvas difieren. [E]

```js
const porDefecto = gsap.parseEase("slow");
const otra = gsap.parseEase("slow(0.5, 0.8)");
const explicita = gsap.parseEase("slow(0.7, 0.7)");

// prueba: porDefecto(0.1) !== otra(0.1)
// prueba: porDefecto(0.1) === explicita(0.1)
```

- **`linearRatio` mayor que 1 se limita a 1**, y entonces `power` se ignora: la curva es lineal. [C]
