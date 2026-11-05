---
id: tim-posicion
titulo: El parámetro de posición
capa: 03-timeline
tipo: concepto
ambito: core
resumen: Gramática completa de la posición en una timeline (número, +=, -=, <, >, etiquetas, porcentajes), qué referencia usa cada forma y qué métodos no la admiten entera.
api: [Timeline.to, Timeline.add, Timeline.addLabel, Timeline.addPause, Timeline.call, Timeline.set, Timeline.recent]
requiere: [tim-basico]
relacionadas: [tim-etiquetas, tim-gestion, tim-control, nuc-stagger]
etiquetas: [secuencia, timeline, posicion, overlap]
fuentes:
  - resources/position-parameter.md
  - resources/getting-started/timelines.md
  - docs/v3/GSAP/Timeline.md
  - docs/v3/GSAP/Timeline/add().md
estado: verificado
version: 3.15.1
---
# El parámetro de posición

Último argumento de `to()`, `from()`, `fromTo()`, `set()`, `add()` y `addLabel()`, y primero de `addPause(posicion, callback, params)`. `call()` lo toma tras la función y sus parámetros. Decide en qué segundo de la timeline se coloca el hijo. Dominarlo evita casi todos los `delay` dentro de una secuencia. [O]

## Modelo mental

Toda posición se resuelve a un **número de segundos** al insertar, y queda fija en `startTime()`. Cambiar después el tween anterior no recoloca al siguiente si su posición ya se calculó. Cada forma es un **punto de referencia** más un **desplazamiento**. [C]

| Punto de referencia | Se escribe | Qué es |
|---|---|---|
| Inicio de la timeline | `3` | Tiempo absoluto |
| Fin de la timeline | `"+=1"`, `"-=1"`, o nada | El punto más lejano ocupado por algún hijo |
| Inicio del anterior | `"<"` | `startTime()` del último hijo **insertado** |
| Fin del anterior | `">"` | Fin del último hijo **insertado** |
| Etiqueta | `"nombre"`, `"nombre+=1"` | Tiempo guardado en `tl.labels` |

"Anterior" significa el **insertado más recientemente**, sea cual sea su posición, y coincide con `tl.recent()`. No es el que acaba más tarde. [O] [C]

## Gramática completa

Resultados con un tween A de 2 s en 0, al insertar un tween B de 1 s. [E]

| Posición | Inicio de B | Lectura |
|---|---|---|
| omitida | 2 | Al final |
| `3` | 3 | Absoluto |
| `"+=1"` | 3 | 1 s tras el fin de la timeline, deja hueco |
| `"-=0.5"` | 1.5 | 0.5 s antes del fin, se solapa |
| `"<"` | 0 | Con el inicio del anterior |
| `">"` | 2 | Con el fin del anterior |
| `"<0.5"` | 0.5 | 0.5 s tras el inicio del anterior; `"<+=0.5"` es igual |
| `">-0.5"` | 1.5 | 0.5 s antes del fin del anterior |
| `"<25%"` | 0.5 | 25 % de la duración total **del anterior** |
| `">-25%"` | 1.5 | Igual base, desde su fin |
| `"<+=50%"` | 0.5 | 50 % de la duración total **del que se inserta** |
| `"+=50%"` | 2.5 | 50 % del que se inserta, tras el fin |
| `"-=25%"` | 1.75 | 25 % del que se inserta, antes del fin |
| `"et"` | tiempo de `et` | Si no existe se crea al final |
| `"et+=1"` | tiempo de `et` + 1 | Si no existe se crea al final |
| `"1"` | 1 | Cadena numérica: absoluto, salvo que exista una etiqueta llamada `"1"` |

**Regla del porcentaje:** detrás de `<` o `>` a secas, la base es el anterior. Detrás de `+=` o `-=`, la base es el que se inserta. En ambos casos es `totalDuration()`, así que incluye repeticiones y `repeatDelay`. [O] [C]

## Ejemplo

Comprueba la tabla con el mismo punto de partida para cada forma.

```js
function inicioDe(posicion) {
  const tl = gsap.timeline({ paused: true });
  tl.to({ a: 0 }, { a: 1, duration: 2 });
  tl.to({ b: 0 }, { b: 1, duration: 1 }, posicion);
  return tl.getChildren(false)[1].startTime();
}

const r = {
  fin: inicioDe(),
  absoluto: inicioDe(3),
  hueco: inicioDe("+=1"),
  solape: inicioDe("-=0.5"),
  conAnterior: inicioDe("<"),
  trasAnterior: inicioDe(">"),
  dentroAnterior: inicioDe("<0.5"),
  antesFinAnterior: inicioDe(">-0.5"),
  pctAnterior: inicioDe("<25%"),
  pctFinAnterior: inicioDe(">-25%"),
  pctInsertado: inicioDe("<+=50%"),
  pctHueco: inicioDe("+=50%"),
  pctSolape: inicioDe("-=25%"),
  cadena: inicioDe("1"),
};

// prueba: r.fin === 2 && r.absoluto === 3 && r.hueco === 3 && r.solape === 1.5
// prueba: r.conAnterior === 0 && r.trasAnterior === 2 && r.dentroAnterior === 0.5 && r.antesFinAnterior === 1.5
// prueba: r.pctAnterior === 0.5 && r.pctFinAnterior === 1.5 && r.pctInsertado === 0.5
// prueba: r.pctHueco === 2.5 && r.pctSolape === 1.75 && r.cadena === 1
```

Como la posición se resuelve una vez, cambiar en vivo la duración de un hijo no recoloca a los que ya estaban detrás. [E]

```js
const primero = gsap.to({ a: 0 }, { a: 1, duration: 1 });
const fija = gsap.timeline({ paused: true });
fija.add(primero).to({ b: 0 }, { b: 1, duration: 1 });

primero.duration(5);

// prueba: fija.recent().startTime() === 1
```

Una secuencia real: título y subtítulo solapados, y un botón que entra con el subtítulo a medias.

```html
<h2 class="rotulo">Título</h2>
<p class="bajada">Texto</p>
<button class="accion">Entrar</button>
```

```js
const intro = gsap.timeline({ defaults: { duration: 0.1, ease: "none" } });

intro
  .from(".rotulo", { y: 20, opacity: 0 })
  .from(".bajada", { y: 20, opacity: 0 }, "-=0.05")
  .from(".accion", { opacity: 0 }, "<50%");

// prueba: intro.getChildren()[1].startTime() === 0.05
// prueba: intro.getChildren()[2].startTime() === 0.1
// prueba: intro.duration() === 0.2
// prueba: gsap.getProperty(".accion", "opacity") === 1
```

### Fin de la timeline frente a fin del anterior

Tras insertar algo cerca del inicio, `">"` y la posición omitida divergen. Es la diferencia que más errores causa. [E]

```js
const larga = gsap.timeline({ paused: true });
larga
  .to({ a: 0 }, { a: 1, duration: 5 })
  .to({ b: 0 }, { b: 1, duration: 1 }, 0.5);
const fijarFin = larga.recent().endTime();

larga.to({ c: 0 }, { c: 1, duration: 1 }, ">");
const inicioRelativo = larga.recent().startTime();

larga.to({ d: 0 }, { d: 1, duration: 1 });
const inicioAlFinal = larga.recent().startTime();

// prueba: fijarFin === 1.5
// prueba: inicioRelativo === 1.5
// prueba: inicioAlFinal === 5
```

### Stagger dentro de la timeline

Un tween con `stagger` cuenta como **un solo hijo**: `"<"` apunta al arranque del primer objetivo y `">"` al final del último. [E]

```js
const grupo = gsap.timeline({ paused: true });
grupo
  .to([{ a: 0 }, { a: 0 }], { a: 1, duration: 1, stagger: 0.5 })
  .to({ b: 0 }, { b: 1, duration: 1 }, ">");

// prueba: grupo.getChildren(false).length === 2
// prueba: grupo.recent().startTime() === 1.5
```

## Cómo lo resuelve GSAP

Orden real de decisión en `_parsePosition`. [C]

1. Si no es cadena, o es numérica sin etiqueta con ese nombre: `null` o `undefined` da el fin; otro valor se convierte a número.
2. Empieza por `<` o `>`: referencia al anterior. Se elimina el `=` y se suma el número; si termina en `%`, sin `=` usa `totalDuration()` del anterior y con `=` la del que se inserta.
3. Sin `=`: es una etiqueta, se crea al final si no existe.
4. Con `=`: se lee el operador y el número; si hay `%` y se conoce el animado que entra, se calcula sobre él. Lo que hay antes del operador, si hay algo, se resuelve recursivamente como etiqueta.

El "fin" es `tl.duration()`. Si algún hijo se repite sin fin, esa duración se dispara y GSAP usa en su lugar el final del anterior **sin repeticiones**. [C]

## Trampas

- **`call()`, `set()` y `addPause()` también son "el anterior".** Son hijos de duración 0, así que tras ellos `"<"` apunta a su punto y no al último tween. `addLabel()` no cuenta. Guarda la referencia con una etiqueta o inserta el `call` al final. [E]

```js
function conIntermedio(paso) {
  const tl = gsap.timeline({ paused: true });
  tl.to({ a: 0 }, { a: 1, duration: 1 });
  paso(tl);
  tl.to({ b: 0 }, { b: 1, duration: 1 }, "<");
  return tl.recent().startTime();
}

const trasCall = conIntermedio((tl) => tl.call(() => {}));
const trasSet = conIntermedio((tl) => tl.set({ c: 0 }, { c: 1 }));
const trasPausa = conIntermedio((tl) => tl.addPause());
const trasEtiqueta = conIntermedio((tl) => tl.addLabel("marca"));

// prueba: trasCall === 1 && trasSet === 1 && trasPausa === 1
// prueba: trasEtiqueta === 0
```

- **Los porcentajes con `+=` y `-=` solo funcionan donde hay animación insertada.** En `addLabel()`, `set()` y `addPause()` GSAP no pasa el hijo al calcular, y el `%` se ignora: `"+=50%"` significa **50 segundos**. Con `"<+=50%"` directamente lanza `TypeError`. `"<25%"` sí funciona ahí porque se basa en el anterior. En `call()` no explota, pero vale 0 porque la duración es 0. [E]

```js
const prueba = gsap.timeline({ paused: true });
prueba.to({ a: 0 }, { a: 1, duration: 2 });

prueba.addLabel("lejos", "+=50%");
prueba.addLabel("bien", "<25%");

let error = null;
try {
  prueba.addLabel("rota", "<+=25%");
} catch (e) {
  error = e;
}

// prueba: prueba.labels.lejos === 52
// prueba: prueba.labels.bien === 0.5
// prueba: error instanceof TypeError
```

- **`add()` con un array no admite `"<+=50%"`:** lanza `TypeError`, porque busca `totalDuration()` en el array. Con `"+=50%"` usa la duración del **primer** elemento. Todos los elementos reciben la misma posición: no se encadenan. [E]

```js
const a = gsap.to({ x: 0 }, { x: 1, duration: 1 });
const b = gsap.to({ x: 0 }, { x: 1, duration: 2 });
const lista = gsap.timeline({ paused: true });
lista.to({ y: 0 }, { y: 1, duration: 2 });
lista.add([a, b], "+=50%");

// prueba: a.startTime() === 2.5 && b.startTime() === 2.5
```

- **Una errata crea una etiqueta.** `"finla"` no falla: añade esa etiqueta al final y coloca ahí el tween. Revisa `tl.labels` si algo aparece en sitio raro. [E]

```js
const conErrata = gsap.timeline({ paused: true });
conErrata.to({ a: 0 }, { a: 1, duration: 2 }).to({ b: 0 }, { b: 1, duration: 1 }, "finla+=1");

// prueba: conErrata.labels.finla === 2
// prueba: conErrata.recent().startTime() === 3
```

- **`delay` se suma a la posición.** Mueve el `startTime()` del hijo y alarga la timeline. `"<"` toma ese inicio ya desplazado. Dentro de una timeline prefiere la posición. [E]

```js
const conDelay = gsap.timeline({ paused: true });
conDelay.to({ a: 0 }, { a: 1, duration: 1, delay: 1 });
const inicio = conDelay.recent().startTime();

// prueba: inicio === 1
// prueba: conDelay.duration() === 2
```

- **Una posición negativa desplaza a todos.** Un hijo no puede empezar antes de 0: GSAP mueve todos los demás hacia delante y la timeline crece. `"-=3"` en una timeline de 1 s hace lo mismo. [E]

```js
const desplazada = gsap.timeline({ paused: true });
const primero = gsap.to({ a: 0 }, { a: 1, duration: 1 });
desplazada.add(primero).to({ b: 0 }, { b: 1, duration: 1 }, -0.5);
const total = desplazada.duration();

// prueba: total === 1.5
// prueba: primero.startTime() === 0.5
```

- **Repetición infinita.** Tras un hijo con `repeat: -1`, tanto `">"` como la posición omitida usan el final de su **primera** iteración, y `"<50%"` usaría una `totalDuration` enorme. La timeline pasa a durar `1e10`. [E]

```js
const infinita = gsap.timeline({ paused: true });
infinita.to({ a: 0 }, { a: 1, duration: 1, repeat: -1 }).to({ b: 0 }, { b: 1, duration: 1 });

const finita = gsap.timeline({ paused: true });
finita.to({ a: 0 }, { a: 1, duration: 1, repeat: 1 }).to({ b: 0 }, { b: 1, duration: 1 }, ">");

// prueba: infinita.recent().startTime() === 1
// prueba: infinita.duration() === 1e10
// prueba: finita.recent().startTime() === 2
```

- **`"<"` no es lo mismo que `0`.** En el primer hijo sí coinciden, pero después sigue al anterior. Mezclar números absolutos con posiciones relativas hace frágil la secuencia al reordenarla. Prefiere relativas y etiquetas, y absolutos solo como anclas. [P]
