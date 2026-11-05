---
id: nuc-delayedcall
titulo: gsap.delayedCall() - temporizador sincronizado
capa: 02-nucleo
tipo: api
ambito: core
resumen: Llama a una función tras un retardo, dentro del reloj de GSAP. Alternativa a setTimeout que se pausa, se escala y se limpia con el resto.
api: [gsap.delayedCall, gsap.killTweensOf, gsap.getTweensOf]
relacionadas: [nuc-control, nuc-consulta, nuc-context, nuc-ticker, nuc-global]
etiquetas: [temporizador, delay]
fuentes:
  - docs/v3/GSAP/gsap.delayedCall().md
estado: verificado
version: 3.15.1
---
# gsap.delayedCall()

Programa una función para que se ejecute al cabo de cierto tiempo, en sincronía con el bucle de render. Por dentro es un `Tween` de duración 0 cuyo objetivo es la propia función, así que admite `pause()`, `restart()` y `kill()`. [O] [C]

## Firma

```text
gsap.delayedCall(segundos, funcion, params?, scope?) → Tween
```

`params` es un array de argumentos. `scope`, el cuarto parámetro, fija `this`; está en el código, pero no en los tipos ni en la documentación. [O] [C] [E]

| | `gsap.delayedCall()` | `setTimeout()` |
|---|---|---|
| Se pausa con `gsap.globalTimeline.pause()` | Sí | No |
| Le afecta `globalTimeline.timeScale()` | Sí [E] | No |
| Le afecta el suavizado de lag | Sí [O] | No |
| Se puede `pause()`, `restart()`, `kill()` | Sí | Solo `clearTimeout` |
| La revierte `gsap.context()` | Sí [E] | No [E] |

## Ejemplo

```js
const registro = [];
const ambito = { nombre: "panel" };

gsap.delayedCall(0.02, function (a, b) {
  registro.push(this.nombre, a + b);
}, [1, 2], ambito);

const parada = gsap.delayedCall(0.02, () => registro.push("no llega"));
parada.pause();

const repetible = { n: 0 };
const rearmable = gsap.delayedCall(0.02, () => repetible.n++);
await new Promise((r) => setTimeout(r, 60));
rearmable.restart(true);

// prueba: registro.join() === "panel,3"
// prueba: repetible.n === 2
```

Cancelar por referencia o a través de la función:

```js
const accion = () => contador.n++;
const contador = { n: 0 };

gsap.delayedCall(0.02, accion);
const objetivo = gsap.getTweensOf(accion).length;
gsap.killTweensOf(accion);

const conContexto = { n: 0 };
const ctx = gsap.context(() => {
  gsap.delayedCall(0.02, () => conContexto.n++);
});
ctx.revert();

// prueba: objetivo === 1
// prueba: contador.n === 0
// prueba: conContexto.n === 0
```

## Trampas

- **Es asíncrona incluso con 0.** `gsap.delayedCall(0, fn)` espera al siguiente tick. Útil para ceder un frame; no la uses esperando ejecución inmediata. [E]
- **`exportRoot()` las excluye por defecto.** Si exportas la raíz para frenar el juego, las llamadas retrasadas siguen en su ritmo, salvo que pases `true` como segundo argumento. Ver [gsap.exportRoot](nuc-global.md). [O] [C]
- **Cámara lenta global.** Con `gsap.globalTimeline.timeScale(0.5)` tardan el doble, lo cual puede romper un temporizador de lógica que no tenga que ver con la animación. Para esos usa `setTimeout`. [E] [P]
- **Lag.** Tras un bloqueo largo del hilo, el reloj se ajusta y la llamada llega más tarde en tiempo real. No la uses para plazos estrictos. [O]
- **Pestaña oculta.** Depende de `requestAnimationFrame`, que el navegador ralentiza: una llamada puede retrasarse mucho. Ver [ticker](nuc-ticker.md). [O]
- **Función compartida.** `gsap.killTweensOf(fn)` cancela todas las llamadas programadas con esa misma función. [C]
