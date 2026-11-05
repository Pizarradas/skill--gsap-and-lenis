---
id: eas-stepped
titulo: SteppedEase, movimiento por pasos
capa: 05-easing
tipo: api
ambito: core
resumen: steps(n) cuantifica el progreso en saltos. Cuántos tramos resultan realmente y cómo aplicarlo a sprites o a un cronómetro.
api: [gsap.SteppedEase.config]
requiere: [eas-guia]
relacionadas: [eas-catalogo, css-snap, rec-secuencia-imagenes]
etiquetas: [easing, pasos, sprites]
fuentes:
  - docs/v3/Eases/SteppedEase.md
estado: verificado
version: 3.15.1
---
# SteppedEase

Divide el recorrido en saltos: el valor permanece fijo y cambia de golpe. Sirve para hojas de sprites, máquinas de escribir y marcadores. Está en el núcleo. [O]

## Firma

```text
ease: "steps(n)"                 en cadena
SteppedEase.config(n)            con el objeto
SteppedEase.config(n, true)      inicio inmediato, en código aunque no en los tipos
```

| Argumento | Defecto | Efecto |
|---|---|---|
| `n` | 1 | Número de saltos |
| Segundo argumento | `false` | Empieza ya en el primer paso y no en 0 [C] |

Los valores están siempre entre 0 y 1. [O]

### Cuántos tramos hay

`steps(n)` da **n saltos**, luego **n + 1 mesetas** de igual duración, de `0` a `1`. La última, ya en el valor final, ocupa 1/(n+1) del tween. Con inicio inmediato hay `n` mesetas, de `1/n` a `1`. [C] [E]

| `p` | `steps(5)` | `SteppedEase.config(5, true)` |
|---|---|---|
| 0 | 0 | 0.2 |
| 0.5 | 0.6 | 0.6 |
| 0.99 | 1 | 1 |

## Ejemplo

```js
const paso = gsap.parseEase("steps(5)");
const conObjeto = SteppedEase.config(4);
const inmediato = SteppedEase.config(5, true);

const marcador = { n: 0 };
gsap.to(marcador, { n: 3, duration: 1, ease: "steps(3)", paused: true }).progress(0.5);

// prueba: paso(0) === 0 && paso(0.1) === 0 && paso(0.2) === 0.2 && paso(0.99) === 1 && paso(1) === 1
// prueba: conObjeto(0.5) === 0.5
// prueba: inmediato(0) === 0.2 && inmediato(1) === 1
// prueba: marcador.n === 2
```

Hoja de sprites horizontal de 8 fotogramas de 100 px. Los fotogramas 0 a 7 son 7 saltos, y el destino es el último: [P]

```html
<div class="sprite" style="width:100px;height:100px;background-size:800px 100px"></div>
```

```js
const andar = gsap.to(".sprite", {
  backgroundPosition: "-700px 0px",
  duration: 0.8,
  ease: "steps(7)",
  paused: true,
});

andar.progress(0.5);
const enMedio = document.querySelector(".sprite").style.backgroundPosition;

// prueba: enMedio === "-400px 0px"
```

## Trampas

- **`steps(5)` no da 5 estados, da 6.** Para N fotogramas usa `steps(N - 1)` con destino en el último, o `steps(N)` con destino un fotograma más allá y `repeat`. [E]
- **El último estado aparece antes de acabar.** Dura lo mismo que los demás, y con `repeat: -1` se ve un fotograma "extra" si destino y origen son iguales. [C]
- **Es un ease de tiempo.** Para cuantificar el valor, no el tiempo, usa [`snap`](../04-propiedades/css-snap.md). [P]
- **El segundo parámetro no está tipado.** En TypeScript, `SteppedEase.config(5, true)` da error. La cadena `"steps(5, true)"` funciona. [C] [E]
- **`SteppedEase` solo pensado para GSAP.** Devuelve siempre valores de 0 a 1 y no sirve para otros motores. [O]
