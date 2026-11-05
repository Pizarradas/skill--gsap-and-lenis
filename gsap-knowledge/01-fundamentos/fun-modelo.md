---
id: fun-modelo
titulo: Modelo de animación - cabezal, árbol de tiempo y ciclo de vida
capa: 01-fundamentos
tipo: concepto
ambito: core
resumen: Cómo piensa GSAP - un árbol de animaciones con cabezales, valores iniciales leídos en el primer render, escritura diferida y liberación automática al terminar.
api: [Animation.parent, Animation.render, Animation.rawTime, Tween.targets, gsap.globalTimeline]
relacionadas: [fun-que-es, fun-objetivos, fun-valores, nuc-tiempo, nuc-immediate-render, nuc-ticker, nuc-global, tim-anidado]
etiquetas: [modelo, tiempo, ciclo-de-vida]
fuentes:
  - docs/v3/GSAP.md
  - docs/v3/GSAP/Tween.md
  - resources/get-started.md
estado: verificado
version: 3.15.1
---
# Modelo de animación

Una animación GSAP no "se ejecuta": es un objeto con un **cabezal** (playhead) situado en una línea de tiempo. Cada vez que el cabezal se mueve, el tween calcula el valor correspondiente y lo escribe. Quien entiende esto predice casi todo lo demás. [O]

## Modelo mental

```text
ticker (requestAnimationFrame)
  └─ globalTimeline            raíz: el tiempo real entra aquí
       ├─ tween suelto
       ├─ timeline
       │    ├─ tween
       │    └─ timeline anidado
       └─ delayedCall          también es un tween
```

- **Solo hay un reloj.** El ticker avanza `gsap.globalTimeline`, y mover el cabezal de un padre arrastra el de sus hijos. Por eso todo queda sincronizado. [O]
- **Toda animación tiene padre.** Por defecto, la raíz; dentro de un timeline, ese timeline. `animation.parent` lo expone. [O] [C]
- **Timeline coordina, Tween escribe.** Un timeline nunca toca propiedades. [O]
- **El tiempo es relativo al padre.** `timeScale()` de un padre afecta a sus descendientes, y `startTime()` se mide en el tiempo del padre. Ver [tiempo](../02-nucleo/nuc-tiempo.md). [O]

### Ciclo de vida de un tween

| Fase | Qué ocurre |
|---|---|
| Creación | Resuelve objetivos, hereda `defaults`, se añade al padre en su tiempo actual. Si es `from()`/`fromTo()`, programa un render inmediato [C] |
| Espera | Cubre `delay`. Sigue sin leer valores iniciales salvo en `from()`/`fromTo()` [O] |
| Inicialización | En el primer render real: lee valores de partida, procesa plugins y aplica `overwrite: "auto"`. Una sola vez, salvo `invalidate()` o `repeatRefresh` [C] |
| Render | En cada tick: pasa el progreso por el `ease` y escribe. La primera escritura puede ser diferida (`lazy`) para no alternar lecturas y escrituras de layout [O] |
| Final | Se saca del padre si este es la raíz y queda libre para el recolector si nadie lo referencia. Se puede `restart()`-ear si conservas la referencia [O] [C] |
| `kill()` | Se detiene y se descarta. No se puede resucitar [O] [E] |

## Ejemplo

Los valores de partida se leen al arrancar, no al crear el tween:

```js
const punto = { x: 0 };
const avance = gsap.to(punto, { x: 10, duration: 1, ease: "none", paused: true });

punto.x = 6;          // cambio posterior a la creación, previo al primer render
avance.progress(0.5); // inicializa aquí: lee x = 6, destino 10

// prueba: punto.x === 8
```

Un tween terminado sale de la raíz, pero sigue siendo reutilizable; uno destruido, no:

```js
gsap.globalTimeline.autoRemoveChildren = true; // GSDevTools lo desactiva en este arnés; es el valor normal
const dato = { v: 0 };
const breve = gsap.to(dato, { v: 1, duration: 0.05 });
await new Promise((r) => setTimeout(r, 150));
const padreTrasTerminar = breve.parent;

dato.v = 0;
breve.restart();
await new Promise((r) => setTimeout(r, 150));

const otro = { v: 0 };
const roto = gsap.to(otro, { v: 1, duration: 0.05, ease: "none", paused: true });
roto.progress(0.5);
roto.kill();
roto.restart();
await new Promise((r) => setTimeout(r, 150));

// prueba: padreTrasTerminar === null
// prueba: dato.v === 1
// prueba: otro.v === 0.5
```

La primera escritura de un tween puede diferirse al final del tick. Solo ocurre si el motor aún no ha renderizado en ese frame, así que leer el DOM en la misma pila da un resultado que depende del momento: unas veces ves el estado anterior y otras el nuevo. `lazy: false` lo hace determinista. [C] [E]

```html
<div class="ficha"></div>
```

```js
gsap.from(".ficha", { opacity: 0, duration: 0.2, lazy: false });
const inmediato = document.querySelector(".ficha").style.opacity;

// prueba: inmediato === "0"
```

## Trampas

- **Medir tras crear un `from()`.** Por la escritura diferida, leer el DOM en la misma pila no es fiable. Mide antes de animar, o usa `lazy: false` si de verdad lo necesitas. [E]
- **Pensar que el tween guarda el "ahora".** `gsap.to()` con `delay` lee el inicio cuando acaba el retardo, no cuando se creó. Para fijar el inicio usa `fromTo()`. [O]
- **Volver a reproducir recicla los valores grabados.** `restart()` vuelve al inicio grabado aunque el destino fuese relativo. Para recalcular, `invalidate()`. Ver [valores](fun-valores.md). [O]
- **`kill()` sobre algo que vas a reutilizar.** Un tween destruido ignora `restart()` sin avisar: usa `pause()`. [O] [E]
- **Variables que crecen.** Guardar en un array cada tween creado impide liberarlos. GSAP limpia lo suyo; lo que retienes tú, no. [P]
- **`render()` directo.** `animation.render(tiempo, suprimirEventos, forzar)` existe pero es de bajo nivel: no mueve el reloj del padre y lo normal es usar `seek()` o `progress()`. `rawTime()` devuelve el tiempo sin recortar. [C] [P]
