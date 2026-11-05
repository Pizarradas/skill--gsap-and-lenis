---
id: tim-etiquetas
titulo: Etiquetas en una timeline
capa: 03-timeline
tipo: api
ambito: core
resumen: addLabel, removeLabel, labels, currentLabel, nextLabel y previousLabel. Dar nombre a instantes para colocar hijos y navegar sin números mágicos.
api: [Timeline.addLabel, Timeline.removeLabel, Timeline.labels, Timeline.currentLabel, Timeline.nextLabel, Timeline.previousLabel]
requiere: [tim-posicion]
relacionadas: [tim-control, tim-gestion]
etiquetas: [timeline, navegacion, etiquetas]
fuentes:
  - docs/v3/GSAP/Timeline/addLabel().md
  - docs/v3/GSAP/Timeline/removeLabel().md
  - docs/v3/GSAP/Timeline/labels.md
  - docs/v3/GSAP/Timeline/currentLabel().md
  - docs/v3/GSAP/Timeline/nextLabel().md
  - docs/v3/GSAP/Timeline/previousLabel().md
estado: verificado
version: 3.15.1
---
# Etiquetas

Una etiqueta es un nombre para un instante de la timeline. Sirve de ancla para colocar hijos y de destino para navegar: `seek("x")`, `play("x")`, `reverse("x")` o `tweenTo("x")`. [O]

## Firma

```text
tl.addLabel(nombre, posicion?)        → tl    por defecto, al final
tl.removeLabel(nombre)                → tl    ver Trampas
tl.labels                             → { nombre: segundos }
tl.currentLabel()                     → nombre o undefined
tl.currentLabel(nombre)               → tl    salta a la etiqueta
tl.nextLabel(tiempo?)                 → nombre o undefined
tl.previousLabel(tiempo?)             → nombre o undefined
```

| Método | Regla exacta |
|---|---|
| `currentLabel()` | La última etiqueta **en o antes** del cabezal [O] |
| `nextLabel(t)` | La primera **estrictamente después** de `t`; la que cae justo en `t` no cuenta. `t` por defecto es el cabezal [O] |
| `previousLabel(t)` | La última **estrictamente antes** de `t` [C] |

`tl.add("nombre", posicion)` es otra forma de crear una etiqueta. Como `addLabel()` no crea un hijo, no altera lo que `"<"` y `">"` consideran el anterior. [C] [E]

## Ejemplo

Un visor por escenas que avanza y retrocede de etiqueta en etiqueta.

```html
<div class="escena" style="width:80px;height:80px"></div>
```

```js
const visor = gsap.timeline({ paused: true, defaults: { duration: 1, ease: "none" } });

visor
  .addLabel("uno")
  .to(".escena", { x: 100 })
  .addLabel("dos")
  .to(".escena", { x: 200 })
  .addLabel("tres");

visor.seek("dos");
const enDos = gsap.getProperty(".escena", "x");
const lectura = [visor.currentLabel(), visor.nextLabel(), visor.previousLabel()];

visor.tweenTo(visor.nextLabel(), { duration: 0.05 });
await new Promise((r) => setTimeout(r, 200));

// prueba: enDos === 100
// prueba: lectura.join() === "dos,tres,uno"
// prueba: visor.currentLabel() === "tres"
// prueba: gsap.getProperty(".escena", "x") === 200
```

Lectura sobre tiempos concretos:

```js
const mapa = gsap.timeline({ paused: true });
mapa.to({ a: 0 }, { a: 1, duration: 4 }).addLabel("a", 1).addLabel("b", 2).addLabel("c", 3);
mapa.seek(2);

const actual = mapa.currentLabel();
const siguiente = mapa.nextLabel();
const previa = mapa.previousLabel();
const desde = mapa.nextLabel(2.5);

mapa.currentLabel("c");

// prueba: actual === "b" && siguiente === "c" && previa === "a" && desde === "c"
// prueba: mapa.time() === 3
// prueba: mapa.labels.b === 2
```

## Trampas

- **`removeLabel()` devuelve la timeline**, no el tiempo. La documentación lo dice en dos sentidos y los tipos declaran `number`, pero el código devuelve `this`. [E]

```js
const tl = gsap.timeline({ paused: true });
tl.addLabel("q", 1);
const devuelto = tl.removeLabel("q");

// prueba: devuelto === tl
// prueba: !("q" in tl.labels)
```

- **Fuera de rango, `undefined`.** Antes de la primera etiqueta, `currentLabel()` y `previousLabel()` no devuelven nada; tras la última, `nextLabel()` tampoco. `tl.seek(undefined)` no falla: va al final. Comprueba antes de navegar. [E]

```js
const rango = gsap.timeline({ paused: true });
rango.to({ a: 0 }, { a: 1, duration: 4 }).addLabel("a", 1);
rango.seek(0.5);
const antes = rango.currentLabel();
rango.seek(2);
const despues = rango.nextLabel();
rango.seek(undefined);

// prueba: antes === undefined
// prueba: despues === undefined
// prueba: rango.time() === 4
```

- **Una posición de etiqueta inexistente la crea al final.** `tl.seek("errata")` no avisa: añade `errata` en el tiempo de fin y salta allí. [C]
- **`addLabel()` no admite porcentajes con `+=`.** `"+=50%"` significa 50 s. Ver [posición](tim-posicion.md). [E]
- **`clear()` borra también las etiquetas** salvo `clear(false)`. [O]
- **`nextLabel()` en una timeline con `yoyo` o invertida** sigue hablando en tiempo local: "después" es siempre un tiempo mayor, no el sentido de reproducción. [O]
