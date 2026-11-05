---
id: opc-suavizado
titulo: lerp frente a duration y easing
capa: 02-opciones
tipo: concepto
ambito: core
resumen: Si hay duration, gana a lerp en todas las rutas: rueda, scrollTo y Snap. Qué calcula cada modo, cómo forzar lerp y por qué lerp no es una fracción por fotograma.
api: [LenisOptions.lerp, LenisOptions.duration, LenisOptions.easing, ScrollToOptions.lerp, ScrollToOptions.duration, ScrollToOptions.easing, SnapOptions.lerp, SnapOptions.duration, SnapOptions.easing, FromToOptions.lerp, FromToOptions.duration, FromToOptions.easing, FromToOptions.onStart, FromToOptions.onUpdate]
requiere: [fun-modelo]
relacionadas: [opc-referencia, api-scrollto, snp-snap, com-raf]
etiquetas: [lerp, duration, easing, suavizado]
fuentes:
  - README.md
  - packages/snap/README.md
estado: verificado
version: 1.3.27
---
# `lerp` frente a `duration` y `easing`

Lenis tiene dos motores de animación, y la elección no depende de la ruta, sino de un único `if` en `Animate.advance`. El README dice que `duration` es "inútil si hay lerp"; el código hace **lo contrario**. [C] [E]

## Modelo mental

```text
Animate.advance(dt):
  si duration y easing        → animación por tiempo     (gana)
  si no, si lerp              → amortiguación exponencial
  si no                       → salto directo al destino
```

Como `lerp` vale `0.1` por defecto, siempre "hay lerp". Lo que decide es si llega una `duration` no nula. Además, si llega solo una de las dos, se completa la otra: solo `duration` añade la curva por defecto, y solo `easing` añade `duration = 1`. [C] [E]

La curva por defecto es `(t) => Math.min(1, 1.001 - 2 ** (-10 * t))`, de arranque rápido y frenado largo. [C]

### Qué gana en cada ruta

| Ruta | Valores que llegan a `Animate` | Resultado |
|---|---|---|
| Rueda (`smoothWheel`) | `lerp`, `duration`, `easing` de la instancia | `duration` de la instancia si existe; si no, `lerp` [E] |
| `lenis.scrollTo()` | Los de la llamada; lo omitido hereda de la instancia | Una `duration` heredada **gana a tu `lerp`** [E] |
| Anclas (`anchors`) | Como `scrollTo`, con el objeto de `anchors` | Igual |
| `Snap` | `snap.options`; `undefined` hereda de la instancia, por el valor por defecto de `scrollTo` | Una `duration` de la instancia **anula `lerp` de `Snap`** [E] en [`snp-snap`](../05-snap/snp-snap.md) |
| Toque con `syncTouch` | Solo `lerp`: `1` con el dedo, `syncTouchLerp` en la inercia | Ignora `duration`, `easing` y `lerp` de la instancia [C], ver [`opc-tactil`](opc-tactil.md) |
| `prefers-reduced-motion` | Gesto: `lerp = 1`, sin duración. Programático: salto | Ver [`opc-automatico`](opc-automatico.md) |
| `immediate: true` | Ninguno: no pasa por `Animate` | Salto síncrono |

### Cómo se calcula `lerp`

No es "la fracción que avanza por fotograma". Pese al nombre, es amortiguación independiente de los fotogramas:

```text
valor = lerp(valor, destino, 1 - e^(-lerp · 60 · dt))
restante(t) = distancia · e^(-60 · lerp · t)
```

Consecuencias [C] [E]:

- A 60 Hz, `lerp: 0.1` avanza un 9,5 % por fotograma; `lerp: 1`, un 63 %, no un 100 %.
- El mismo tiempo transcurrido da la misma posición con cualquier tasa de fotogramas.
- Termina cuando `Math.round(valor) === Math.round(destino)`: el último salto es de menos de un píxel.

Con `duration`, cada evento de rueda **reinicia** el reloj: una rueda continua no termina hasta `duration` segundos después del último evento. [C]

## Ejemplo

`duration` gana en la rueda aunque `lerp` sea casi nulo:

```js
const lenis = new Lenis({ duration: 0.4, lerp: 0.001 });
rueda(500);
let t = 1000;
lenis.raf(t);
for (let i = 0; i < 40; i++) lenis.raf((t += 16)); // 640 ms simulados
const llegada = lenis.scroll;
lenis.destroy();
// prueba: llegada === 500
```

`lerp` de `scrollTo` no vence a una `duration` heredada, salvo con `duration: 0`, que es la forma de forzarlo:

```js
const lineal = { duration: 2, easing: (t) => t };
const simula = (opciones) => {
  const lenis = new Lenis(lineal);
  lenis.scrollTo(0, { immediate: true });
  lenis.scrollTo(1000, opciones);
  let t = 1000;
  lenis.raf(t);
  for (let i = 0; i < 25; i++) lenis.raf((t += 16)); // 400 ms
  const posicion = lenis.animatedScroll;
  lenis.destroy();
  return posicion;
};
const heredada = simula({ lerp: 1 }); // sigue la duración lineal: 20 %
const forzada = simula({ lerp: 1, duration: 0 });
// prueba: heredada > 150 && heredada < 250
// prueba: forzada === 1000
```

El resultado es independiente de la tasa de fotogramas:

```js
const simula = (paso) => {
  const lenis = new Lenis();
  lenis.scrollTo(0, { immediate: true });
  lenis.scrollTo(1000);
  let t = 1000;
  lenis.raf(t);
  while (t < 1200) lenis.raf((t += paso)); // 200 ms
  const posicion = lenis.animatedScroll;
  lenis.destroy();
  return posicion;
};
const a = simula(8), b = simula(40), c = simula(50);
const teorico = 1000 * (1 - Math.exp(-60 * 0.1 * 0.2));
// prueba: Math.abs(a - teorico) < 0.01 && Math.abs(b - teorico) < 0.01 && Math.abs(c - teorico) < 0.01
```

## Trampas

- **`duration` en la instancia para un `scrollTo` puntual.** Afecta también a la rueda: cada gesto dura ese tiempo, y `lerp` queda muerto. Pásala en la llamada si es para un solo salto. [C]
- **Bajar `lerp` en un `scrollTo` y no ver cambio.** Hay una `duration` en la instancia. Añade `duration: 0` en esa llamada. [E]
- **`duration: undefined` no limpia nada.** Se aplica el valor por defecto del parámetro y vuelve a heredar. [C]
- **`lerp: 0` no significa "quieto".** Es falsy: cae al tercer caso y **salta** al destino en el siguiente `raf`. [C] [E] en [`api-scrollto`](../03-api/api-scrollto.md)
- **Una `easing` que no termina en 1.** Da igual: al completarse la duración se fuerza progreso 1. Pero una curva que devuelva `NaN` deja `animatedScroll` en `NaN`, y `scrollTo({ top: NaN })` lleva el scroll real a 0 mientras dure la animación: en laboratorio, desde 800 cayó a 0, y al completar saltó a 1500. [C]
- **`FromToOptions` no es API pública de uso directo.** Es el contrato interno de `Animate`, con `onUpdate` y `onStart`. Tú usas `ScrollToOptions`. Su JSDoc indica `duration` por defecto `1`, que solo se cumple si das `easing`. [C]
