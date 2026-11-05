---
id: eas-catalogo
titulo: Catálogo de eases
capa: 05-easing
tipo: referencia
ambito: core
resumen: Todos los eases del núcleo con su cadena, equivalencias, parámetros y valores de referencia, más los objetos antiguos Back, Elastic, Power o Linear.
api: [gsap.Ease.easeIn, gsap.Ease.easeOut, gsap.Ease.easeInOut, gsap.Back.easeIn, gsap.Back.easeOut, gsap.Back.easeInOut, gsap.BackConfig.config, gsap.Elastic.easeIn, gsap.Elastic.easeOut, gsap.Elastic.easeInOut, gsap.ElasticConfig.config, gsap.Linear.easeNone]
requiere: [eas-guia]
relacionadas: [eas-easepack, eas-stepped, eas-customease]
etiquetas: [easing, referencia]
fuentes:
  - docs/v3/Eases.md
estado: verificado
version: 3.15.1
---
# Catálogo de eases

Cadenas válidas en `ease`. Las columnas numéricas dan el valor de la curva a mitad de tiempo, `ease(0.5)`, medido con `gsap.parseEase()`. [E]

## Núcleo

| Familia | Cadenas | `.in` | `.out` | Forma |
|---|---|---|---|---|
| Lineal | `none`, `linear`, `power0` | 0.5 | 0.5 | Constante |
| `power1` (`quad`) | `.in`, `.out`, `.inOut` | 0.25 | 0.75 | Grado 2 |
| `power2` (`cubic`) | ídem | 0.125 | 0.875 | Grado 3 |
| `power3` (`quart`) | ídem | 0.0625 | 0.9375 | Grado 4 |
| `power4` (`quint`, `strong`) | ídem | 0.0313 | 0.9688 | Grado 5 |
| `sine` | ídem | 0.2929 | 0.7071 | Suave |
| `circ` | ídem | 0.134 | 0.866 | Cuarto de círculo |
| `expo` | ídem | 0.0234 | 0.9766 | Exponencial |
| `back` | ídem, con `(overshoot)` | -0.0877 | 1.0877 | Rebasa y vuelve |
| `elastic` | ídem, con `(amplitud, periodo)` | -0.0156 | 1.0156 | Oscila |
| `bounce` | ídem | 0.2344 | 0.7656 | Rebota |
| `steps(n)` | Ver [stepped](eas-stepped.md) | | | Por tramos |

Sin tipo, el nombre equivale a `.out`: `"bounce"` es `"bounce.out"`. Todas las `.inOut` valen 0.5 a mitad de tiempo. [C] [E]

| Nombre | Es | Grado |
|---|---|---|
| `Linear`, `Power0` | Lineal | 1 |
| `Quad`, `Power1` | Misma curva | 2 |
| `Cubic`, `Power2` | Misma curva | 3 |
| `Quart`, `Power3` | Misma curva | 4 |
| `Quint`, `Strong`, `Power4` | Misma forma | 5 |

## Parámetros

| Ease | Parámetros | Defecto | Efecto |
|---|---|---|---|
| `back.*(s)` | `overshoot` | 1.70158 | Pico de rebase. `1.7` llega a 1.10 y `4` a 1.38 [E] |
| `elastic.*(a, p)` | `amplitude`, `period` | 1, 0.3 (`.inOut`: 0.45) | `a` altura, `p` frecuencia: menor `p`, más oscilaciones [C] |

```js
const pico = (nombre) => {
  const curva = gsap.parseEase(nombre);
  let max = 0;
  for (let i = 0; i <= 500; i++) max = Math.max(max, curva(i / 500));
  return max;
};

const estandar = pico("back.out(1.7)");
const fuerte = pico("back.out(4)");

// prueba: estandar > 1.09 && estandar < 1.11
// prueba: fuerte > 1.37 && fuerte < 1.39
// prueba: gsap.parseEase("elastic.out(1,0.3)")(0.2) === Elastic.easeOut.config(1, 0.3)(0.2)
// prueba: Math.abs(gsap.parseEase("back.out(4)")(0.5) - Back.easeOut.config(4)(0.5)) < 1e-9
```

**`elastic` con amplitud menor que 1 no reduce la altura.** El código la fuerza a 1 y acorta el periodo. Para menos rebase usa `back` o una [CustomEase](eas-customease.md). [C] [E]

```js
const estrecha = gsap.parseEase("elastic.out(0.5, 0.3)");
const misma = gsap.parseEase("elastic.out(1, 0.15)");

// prueba: Math.abs(estrecha(0.2) - misma(0.2)) < 1e-9
```

## Forma antigua

Existen objetos globales por compatibilidad, y equivalen a las cadenas. Tipados en `gsap.Ease` (`easeIn`, `easeOut`, `easeInOut`), `gsap.Linear` (además `easeNone`), `gsap.Back` y `gsap.Elastic`, cuyas propiedades son `gsap.BackConfig` y `gsap.ElasticConfig`: funciones con método `config()`. [C]

| Antigua | Actual |
|---|---|
| `Power2.easeOut` | `"power2.out"` |
| `Quad.easeInOut` | `"power1.inOut"` |
| `Linear.easeNone` | `"none"` |
| `Back.easeOut.config(1.7)` | `"back.out(1.7)"` |
| `Elastic.easeOut.config(1, 0.3)` | `"elastic.out(1, 0.3)"` |
| `SteppedEase.config(5)` | `"steps(5)"` |

`Linear.easeNone` existe como objeto, pero la **cadena** `"Linear.easeNone"` no se reconoce y cae en el ease por defecto. Cadenas válidas de la forma antigua son `"Power1.easeOut"` o `"Linear.easeIn"`. [E]

```js
// prueba: gsap.parseEase("Power1.easeOut") === gsap.parseEase("power1.out")
// prueba: gsap.parseEase("cubic.in") === gsap.parseEase("power2.in")
// prueba: gsap.parseEase("quart") === gsap.parseEase("power3")
// prueba: Linear.easeNone(0.3) === 0.3
// prueba: gsap.parseEase("Linear.easeNone") === undefined
// prueba: Power2.easeOut === gsap.parseEase("power2.out")
```
