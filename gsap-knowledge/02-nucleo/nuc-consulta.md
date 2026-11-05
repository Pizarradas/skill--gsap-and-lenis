---
id: nuc-consulta
titulo: Buscar y matar animaciones
capa: 02-nucleo
tipo: api
ambito: core
resumen: gsap.getById, getTweensOf, isTweening y killTweensOf para localizar animaciones sin guardar variables, y sus límites tras completarse.
api: [gsap.getById, gsap.getTweensOf, gsap.isTweening, gsap.killTweensOf]
relacionadas: [nuc-limpieza, nuc-overwrite, nuc-delayedcall, nuc-global, cal-depuracion]
etiquetas: [consulta, kill, depuracion]
fuentes:
  - docs/v3/GSAP/gsap.getById().md
  - docs/v3/GSAP/gsap.getTweensOf().md
  - docs/v3/GSAP/gsap.isTweening().md
  - docs/v3/GSAP/gsap.killTweensOf().md
estado: verificado
version: 3.15.1
---
# Buscar y matar animaciones

Estos métodos localizan animaciones por identificador o por objetivo. Son útiles cuando no hay una referencia a mano o para depurar. Guardar la instancia en una variable sigue siendo más directo. [O]

## Firma

```text
gsap.getById(id)                                → Tween | Timeline | undefined
gsap.getTweensOf(objetivos, soloActivos?)       → Tween[]
gsap.isTweening(objetivo)                       → boolean
gsap.killTweensOf(objetivos, props?, soloActivos?)
```

| Método | Detalle |
|---|---|
| `getById` | Busca también dentro de timelines. Solo encuentra animaciones activas o sin empezar [O] [E] |
| `getTweensOf` | Devuelve tweens, no timelines, incluidos los anidados. Con `true`, solo los activos [C] [E] |
| `isTweening` | `true` si hay un tween activo; ni pausado, ni terminado, ni en espera [O] |
| `killTweensOf` | `props` es lista separada por comas. Afecta también a los que no han empezado. `"*"` cubre todos los elementos del DOM [O] [E] |

`soloActivos` no aparece en la documentación de `killTweensOf()`, aunque sí en el código. [C] [E]

Para listar todo lo activo: `gsap.globalTimeline.getChildren().filter((a) => a.isActive())`. [O]

## Ejemplo

```html
<div class="uno"></div><div class="dos"></div>
```

```js
const directo = gsap.to(".uno", { x: 10, duration: 0.2, id: "entrada" });
const pista = gsap.timeline({ id: "pista" });
pista.to(".dos", { x: 1, duration: 0.2, id: "hija" });
const retrasado = gsap.to(".uno", { y: 10, duration: 0.1, delay: 5 });

await new Promise((r) => setTimeout(r, 30));

const r = {
  porId: gsap.getById("entrada") === directo,
  anidado: gsap.getById("hija") !== undefined,
  timeline: gsap.getById("pista") === pista,
  ninguno: gsap.getById("nada"),
  todos: gsap.getTweensOf(".uno").length,
  activos: gsap.getTweensOf(".uno", true).length,
  animando: gsap.isTweening(".uno"),
};

gsap.killTweensOf(".uno", "x");            // solo x: el retrasado sigue
r.tras = gsap.getTweensOf(".uno").length;
r.quieto = gsap.isTweening(".uno");

// prueba: r.porId && r.anidado && r.timeline
// prueba: r.ninguno === undefined
// prueba: r.todos === 2 && r.activos === 1
// prueba: r.animando === true
// prueba: r.tras === 1 && r.quieto === false
```

`killTweensOf` con `soloActivos` y con `"*"`:

```html
<div class="tres"></div>
```

```js
const fines = [];
const lejano = gsap.to(".tres", { x: 50, duration: 0.02, delay: 0.04, onComplete() { fines.push("c"); } });
gsap.killTweensOf(".tres", null, true);    // no está activo: sobrevive
const sobrevive = lejano.parent !== null;
gsap.killTweensOf("*");
await new Promise((r) => setTimeout(r, 150));

// prueba: sobrevive === true
// prueba: gsap.getProperty(".tres", "x") === 0
// prueba: fines.length === 0
```

## Trampas

- **`getById()` tras completar.** GSAP libera lo terminado, así que devuelve `undefined`. Si necesitas una animación después, guárdala en una variable. [O] [E]
- **`id` duplicados.** `getById` devuelve el primero que encuentra: GSAP no los exige únicos. Elige identificadores estables. [C] [P]
- **`getTweensOf()` no encuentra lo terminado** por el mismo motivo. No sirve para saber si algo se animó alguna vez. [O]
- **`isTweening()` y el `delay`.** Un tween en espera no cuenta: da `false`, y podrías lanzar otro en conflicto. Usa `getTweensOf()` si te importa lo programado. [O] [E]
- **`killTweensOf()` congela.** No devuelve el estado original; para eso, `revert()`. Ver [limpieza](nuc-limpieza.md). [O]
- **`gsap.killTweensOf(".x")` con objetivos múltiples.** Si un tween tiene varios objetivos, solo se elimina la parte de `.x`; el resto sigue. [C] [E]
- **`"*"` no incluye objetos propios** ni animaciones sin DOM. [C]
- **Mal uso para limpiar una vista.** Matar por selector afecta a cualquier otra parte de la página que comparta la clase. Usa `gsap.context()`. [P]
