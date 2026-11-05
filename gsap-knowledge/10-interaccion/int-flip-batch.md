---
id: int-flip-batch
titulo: Flip.batch, coordinar varios Flip
capa: 10-interaccion
tipo: api
ambito: Flip
resumen: Ordena getState, cambios y animaciones de varias partes independientes para que no se contaminen. Pensado para vistas formadas por partes que se actualizan por separado.
api: [Flip.batch, FlipBatch.actions, FlipBatch.state, FlipBatch.timeline, FlipBatch.id, FlipBatch.data, FlipBatch.add, FlipBatch.clear, FlipBatch.getState, FlipBatch.getStateById, FlipBatch.kill, FlipBatch.remove, FlipBatch.run, FlipBatchAction.batch, FlipBatchAction.state, FlipBatchAction.states, FlipBatchAction.timeline, FlipBatchAction.targets, FlipBatchAction.vars, FlipBatchAction.getStateById, FlipBatchAction.kill, Flip.BatchActionConfig.getState, Flip.BatchActionConfig.loadState, Flip.BatchActionConfig.setState, Flip.BatchActionConfig.animate, Flip.BatchActionConfig.onEnter, Flip.BatchActionConfig.onLeave, Flip.BatchActionConfig.onStart, Flip.BatchActionConfig.onComplete, Flip.BatchActionConfig.once]
requiere: [int-flip]
relacionadas: [int-flip, int-flip-api, fra-agnostico]
etiquetas: [layout, partes]
fuentes:
  - docs/v3/Plugins/Flip/static.batch().md
estado: verificado
version: 3.15.1
---
# Flip.batch()

Si varias partes independientes hacen Flip a la vez, todas deben medir **antes** de que ninguna toque el DOM: un cambio en una parte desplaza a las demás. `Flip.batch()` centraliza esa secuencia. [O]

## Firma

```text
Flip.batch(id = "default") → FlipBatch      // con el mismo id devuelve la misma instancia
batch.add(config | función) → FlipBatchAction
batch.run(saltarGetState?, combinar?) → batch
```

`add()` con una función es un atajo de `{ animate: función }`. Pasar el mismo objeto dos veces devuelve la acción existente. [C]

Una acción admite (todo opcional):

| Función | Cuándo | Recibe |
|---|---|---|
| `getState` | Paso 1, en todas las acciones. Lo que devuelva queda en `self.state` | `self` |
| `loadState` | Paso 2. Pausa hasta que se llame a `done()` | `done(objetivos?)` |
| `setState` | Paso 3. Cambios de DOM. Lo que devuelva queda en `self.targets` | `self` |
| `animate` | Paso 4. Crea aquí los `Flip.from()` | `self` |
| `onEnter` `onLeave` | Tras `animate`, solo si hay `targets` | `elementos` |
| `onStart` `onComplete` | Del timeline común | `self` |
| `once` | `true`: la acción se elimina tras animar | — |

## Ejemplo

Dos partes que mueven cada una su elemento, uno de ellos con carga asíncrona:

```html
<style>
  .zona { position: absolute; top: 0; width: 60px; height: 60px; }
  #izq { left: 0; } #der { left: 300px; }
  .ficha { width: 40px; height: 40px; }
</style>
<div class="zona" id="izq"><div class="ficha" id="roja"></div></div>
<div class="zona" id="der"></div>
```

```js
const roja = document.querySelector("#roja");
const der = document.querySelector("#der");
const orden = [];

const lote = Flip.batch("tablero");
const accion = lote.add({
  getState(self) {
    orden.push("getState");
    return Flip.getState(roja);
  },
  loadState(done) {
    orden.push("loadState");
    setTimeout(() => done([roja]), 30); // simula esperar datos o un render
  },
  setState() {
    orden.push("setState");
    der.appendChild(roja);
    return [roja];
  },
  animate(self) {
    orden.push("animate");
    Flip.from(self.state, { duration: 0.1, ease: "none" });
  },
  onStart() { orden.push("onStart"); },
  onComplete() { orden.push("onComplete"); },
});

lote.run();
const tras = orden.join();
await new Promise((r) => setTimeout(r, 300));
// prueba: tras === "getState,loadState"
// prueba: orden.join() === "getState,loadState,setState,animate,onStart,onComplete"
// prueba: Flip.batch("tablero") === lote
// prueba: accion.timeline === lote.timeline && accion.batch === lote
// prueba: accion.targets[0] === roja && accion.states.length === 1
// prueba: roja.getBoundingClientRect().left === 300
```

Fases separadas cuando el DOM se actualiza más tarde, en un render diferido:

```js fragmento
const lote = Flip.batch("vista");
lote.add({
  getState: () => Flip.getState(".tarjeta"),
  animate: (self) => Flip.from(self.state, { targets: ".tarjeta", duration: 0.4 }),
});

lote.getState();                     // antes de cambiar nada
actualizarVista(nuevo);              // el render ocurre después
trasRender(() => lote.run(true));    // true: no volver a capturar
```

## Métodos y propiedades

| Miembro | Efecto |
|---|---|
| `batch.getState(combinar?)` | Solo `getState` de las acciones. Con `true`, los une en `batch.state` |
| `batch.run(true)` | Salta `getState`; el resto en orden |
| `batch.getStateById(id)` | Busca por `data-flip-id` en las acciones y, por último, en `batch.state` |
| `batch.clear(soloEstado?)` | Vacía acciones y estado; con `true`, solo el estado |
| `batch.remove(accion)` | Quita esa acción. Igual que `accion.kill()` |
| `batch.kill()` | Desregistra el lote y libera el id |
| `batch.actions` `batch.id` | Acciones e identificador |
| `batch.data` | Espacio libre para tus datos |
| `batch.state` | FlipState común. `Flip.getState(x, { batch: "id" })` copia aquí |
| `batch.timeline` | Timeline reutilizado para todo |
| `accion.getStateById(id)` | Igual, limitado a esa acción |
| `accion.state` `accion.states` | Lo que devolvió `getState` y los FlipState capturados dentro |
| `accion.targets` `accion.vars` `accion.timeline` `accion.batch` | Referencias |

## Trampas

- **`onEnter` y `onLeave` necesitan objetivos:** devuelve el array desde `setState()` o pásalo a `done()`. Sin eso no se llaman. [O]
- **Dentro de `getState()` de una acción no se matan los vuelos** hasta que acaban todas las acciones. Así unos no afectan a otros. [O]
- **`self.state` es lo que tú devuelvas.** Si devuelves un objeto con varios estados, `Flip.from(self.state)` falla: usa `self.state.tuClave`. [P]
- **`run()` dentro del propio lote** se ignora. [C]
- **Los tipos mienten en tres retornos:** `batch.kill()`, `action.kill()` y `batch.clear()` devuelven `undefined`, no la instancia. No los encadenes. [C] [E]
- **`batch.kill()` antes de que acabe `loadState`** cancela `setState` y `animate`. [C]
- **Acciones acumuladas.** En una vista que se monta varias veces, usa `once: true` o `action.kill()` al desmontar; si no, cada `run()` repite todas. [O] [P]
