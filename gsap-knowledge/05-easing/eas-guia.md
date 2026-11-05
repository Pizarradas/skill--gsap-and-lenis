---
id: eas-guia
titulo: Guía de easing
capa: 05-easing
tipo: concepto
ambito: core
resumen: Qué es un ease, cómo se escribe en GSAP, cuál elegir para cada caso, y cómo funcionan easeReverse y yoyoEase al invertir.
api: [gsap.TweenVars.ease, gsap.TweenVars.easeReverse, gsap.TweenVars.yoyoEase, gsap.parseEase]
relacionadas: [eas-catalogo, eas-customease, eas-registro, nuc-defaults-config, cal-accesibilidad]
etiquetas: [easing, curvas, movimiento]
fuentes:
  - docs/v3/Eases.md
  - resources/getting-started/Easing.md
  - docs/v3/GSAP/gsap.to().md
estado: verificado
version: 3.15.1
---
# Easing

Un ease transforma el progreso lineal del tiempo en progreso del valor. Cambia la sensación de una animación sin tocar su duración ni sus extremos. [O]

## Modelo mental

Es una función de 0 a 1. Recibe la fracción de tiempo transcurrido y devuelve la fracción de recorrido aplicada: [C]

```text
valor = inicio + (fin - inicio) × ease(tiempo / duracion)
```

Por tanto una curva que supera 1, como `back` o `elastic`, rebasa el destino, y una que acaba en 0, como `wiggle`, vuelve al inicio.

| Tipo | Forma | Sensación | Uso típico [P] |
|---|---|---|---|
| `.out` | Rápido, luego frena | Respuesta inmediata con fricción | **Por defecto en interfaz**, entradas |
| `.in` | Lento, luego acelera | Peso, caída | Salidas de pantalla |
| `.inOut` | Lento en ambos extremos | Trayecto de A a B | Movimiento entre estados visibles |
| `none` | Velocidad constante | Mecánico | Scroll enlazado, bucles infinitos |

La documentación recomienda `.out` para transiciones de interfaz, porque arranca rápido y se nota la respuesta. [O]

### Sintaxis

```text
ease: "power2.out"              nombre.tipo
ease: "power2"                  sin tipo equivale a .out
ease: "back.out(1.7)"           con parámetros
ease: "steps(5)"
ease: "rough({strength: 2, points: 30})"   objeto en cadena
ease: (p) => p * p              función propia
ease: "none"                    lineal
```

El **ease por defecto** es `"power1.out"`, que se llama también `"quad.out"`. Se cambia con `gsap.defaults({ ease: "none" })`, o por grupo con `defaults` de una [timeline](../03-timeline/tim-herencia.md). [O] [C]

`gsap.parseEase(cadena)` devuelve la función real, útil para evaluar la curva fuera de un tween. [O]

### Elegir

| Necesidad | Ease [P] |
|---|---|
| Aparición en interfaz | `power2.out`, `power3.out` |
| Salida | `power2.in` |
| Mover un panel de un sitio a otro | `power2.inOut` |
| Botón con carácter | `back.out(1.7)` |
| Enlazado a scroll con `scrub` | `none` |
| Marquesina, rotación continua | `none` |
| Efecto físico, juego | `bounce.out`, `elastic.out(1, 0.3)` |
| Zoom a mucha escala | [`expoScale`](eas-easepack.md) |
| Curva de un diseño | [`CustomEase`](eas-customease.md) |

## Ejemplo

```js
const lineal = gsap.parseEase("none");
const entrada = gsap.parseEase("power2.out");
const salida = gsap.parseEase("power2.in");
const trayecto = gsap.parseEase("power2.inOut");

// prueba: lineal(0.5) === 0.5
// prueba: entrada(0.5) === 0.875
// prueba: salida(0.5) === 0.125
// prueba: trayecto(0.5) === 0.5
// prueba: gsap.parseEase("power2") === entrada
```

Un tween sin `ease` usa `power1.out`, y `none` lo anula: [E]

```js
const a = { x: 0 };
const b = { x: 0 };
const propia = { x: 0 };

gsap.to(a, { x: 100, duration: 1, paused: true }).progress(0.5);
gsap.to(b, { x: 100, duration: 1, paused: true, ease: "none" }).progress(0.5);
gsap.to(propia, { x: 100, duration: 1, paused: true, ease: (p) => p * p }).progress(0.5);

// prueba: a.x === 75
// prueba: b.x === 50
// prueba: propia.x === 25
```

### Al invertir: `easeReverse`

Al ir hacia atrás, un tween recorre su curva **al revés**: un `.in` hacia delante se ve como `.out` hacia atrás. `easeReverse` (3.15) cambia eso, y se calcula desde el punto en que cambia el sentido, también a mitad de camino. [O] [C]

| Valor | Hacia atrás usa |
|---|---|
| Omitido | La misma curva, recorrida al revés |
| `true` | La misma curva, en su sentido normal |
| `"back.out"` u otra | Esa curva |

`yoyoEase` queda **obsoleto** en favor de `easeReverse`; internamente son lo mismo, y además activa `yoyo`. [O] [C]

```js
const uno = { x: 0 };
const dos = { x: 0 };
const crear = (obj, extra) =>
  gsap.to(obj, { x: 100, duration: 1, ease: "power2.in", paused: true, ...extra });

crear(uno).progress(1).progress(0.5);
crear(dos, { easeReverse: true }).progress(1).progress(0.5);

// prueba: uno.x === 12.5
// prueba: dos.x === 87.5
```

Sin `easeReverse`, a mitad del retorno el objeto va por el 12.5 % porque rehace la curva. Con él, ha bajado solo un 12.5 % desde el final. [E]

## Trampas

- **Un nombre mal escrito no falla.** El ease inválido se cambia en silencio por el por defecto: `"power2.Out"` o `"elastik"` funcionan como `power1.out`. Si una animación "no cambia" al editar el ease, comprueba con `gsap.parseEase()`, que devuelve `undefined`. [E]

```js
const errata = { x: 0 };
gsap.to(errata, { x: 100, duration: 1, paused: true, ease: "power2.Out" }).progress(0.5);

// prueba: errata.x === 75
// prueba: gsap.parseEase("power2.Out") === undefined
```

- **`ease` en una timeline no hace nada.** Va en `defaults`. Ver [timeline](../03-timeline/tim-basico.md). [E]
- **`scrub` añade su propio suavizado**: con `ease` no lineal, la curva se aplica sobre la relación con el scroll y suele notarse como desfase. Usa `none`. [P]
- **`SlowMo`, `RoughEase`, `ExpoScaleEase` y las `Custom*` no vienen en el núcleo.** Sin cargarlos, la cadena se convierte en el ease por defecto, sin aviso. Ver [registro](eas-registro.md). [O] [C]
- **La sintaxis antigua sigue viva.** `Power2.easeOut` funciona, pero en código nuevo usa cadenas. Ver [catálogo](eas-catalogo.md). [C]
- **`"power2.inOut(0.8)"` no aplica peso.** EasePack contiene código para ello, pero en 3.15.1 no surte efecto: el parámetro se ignora. [E]

```js
const peso = gsap.parseEase("power2.inOut(0.8)");
const puro = gsap.parseEase("power2.inOut");

// prueba: peso(0.25) === puro(0.25)
// prueba: typeof puro.config === "undefined"
```

- **`bounce.in` y `elastic.in` no valen para entradas:** el movimiento ocurre al principio con poca amplitud y luego salta. Lo natural es `.out`. [P]
- **Movimiento reducido.** Curvas muy elásticas o largas pueden marear. Ver [accesibilidad](../13-calidad/cal-accesibilidad.md). [P]
