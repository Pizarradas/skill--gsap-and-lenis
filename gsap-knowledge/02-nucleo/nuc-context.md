---
id: nuc-context
titulo: gsap.context() - agrupar, limitar y limpiar
capa: 02-nucleo
tipo: api
ambito: core
resumen: Recoge animaciones y ScrollTriggers para revertirlos juntos y limita selectores a un ámbito. Qué registra de verdad, limpiezas, contextSafe y fugas.
api: [gsap.context, gsap.Context.selector, gsap.Context.isReverted, gsap.Context.conditions, gsap.Context.queries, gsap.Context.add, gsap.Context.ignore, gsap.Context.kill, gsap.Context.revert, gsap.Context.clear]
requiere: [nuc-limpieza]
relacionadas: [nuc-matchmedia, nuc-limpieza, nuc-ticker, fra-agnostico, fra-vanilla, utl-colecciones]
etiquetas: [context, limpieza, vistas, scope]
fuentes:
  - docs/v3/GSAP/gsap.context().md
estado: verificado
version: 3.15.1
---
# gsap.context()

Un Context registra lo que GSAP crea mientras se ejecuta una función, para poder revertirlo todo de golpe, y opcionalmente limita los selectores a un elemento. Es la herramienta universal de limpieza: sirve para cualquier vista, con o sin framework, y `gsap.matchMedia()` lo usa por debajo. No sirve para controlar la reproducción: eso es trabajo de un timeline. [O]

## Firma

```text
gsap.context(func?, scope?) → Context     sin argumentos: el Context activo, o undefined
func(self, contextSafe) → cleanup?
```

| Miembro | Uso |
|---|---|
| `ctx.revert(config?)` | Revierte todo, ejecuta limpiezas y vacía [O] |
| `ctx.kill(revert?)` | Sin argumento: mata sin revertir y **sin ejecutar limpiezas** [C] [E] |
| `ctx.add(fn, scope?)` | Ejecuta `fn` ya, grabando en el contexto. Devuelve lo que devuelva `fn` [O] [E] |
| `ctx.add("nombre", fn, scope?)` | Crea `ctx.nombre()`, que graba cada vez que se llame. Devuelve la función [O] [E] |
| `ctx.ignore(fn)` | Ejecuta `fn` sin grabar [O] |
| `ctx.clear()` | Olvida lo grabado y las limpiezas, sin revertir ni matar [C] [E] |
| `ctx.selector(sel)` | Función de búsqueda dentro del `scope`; `undefined` si no hay scope [C] [E] |
| `ctx.isReverted` | `true` tras revertir; vuelve a `false` si añades algo [C] [E] |
| `ctx.conditions`, `ctx.queries` | Solo en contextos creados por [`gsap.matchMedia()`](nuc-matchmedia.md) [C] |
| `ctx.data` | Array con lo grabado. Propiedad interna, útil para depurar [C] |

`scope` admite un elemento, un selector o un objeto contenedor: GSAP desempaqueta `.current` y `.nativeElement`. Con cualquier otro envoltorio, pasa el elemento real cuando ya exista. [O] [C]

### Qué graba y qué no

| Se graba | No se graba |
|---|---|
| Tweens, timelines, `set`, `delayedCall` [O] [E] | Listeners del ticker (`gsap.ticker.add`) [E] |
| ScrollTrigger, ScrollSmoother, SplitText, Draggable y Observer [C]; ejecutado con ScrollTrigger y SplitText [E] | `setTimeout`, `addEventListener`, `fetch` [E] |
| Contextos y `matchMedia` creados dentro [C] [E] | Código tras un `await` [C] [E] |
| Lo creado en callbacks de una animación del contexto [C] [E] | Lo creado desde un evento, salvo con `ctx.add()` o `contextSafe` [O] [E] |

Lo no grabado va en la función de limpieza. Esta recibe `(config, ctx)` y corre **después** de revertir las animaciones. [C] [E]

## Ejemplo

Patrón completo: scope, animación y limpieza de lo que GSAP no controla.

```html
<section class="bloque" id="s1">
  <button class="abrir">abrir</button>
  <div class="panel"></div>
</section>
<section class="bloque" id="s2"><div class="panel"></div></section>
```

```js
const seccion = document.querySelector("#s1");
const boton = seccion.querySelector(".abrir");
const trazas = [];

const ctx = gsap.context((self) => {
  gsap.from(".panel", { y: 40, duration: 0.05 });        // solo el .panel de #s1

  self.add("abrir", () => {
    gsap.to(".panel", { rotation: 10, duration: 0.05 });
  });
  boton.addEventListener("click", self.abrir);

  return () => {
    boton.removeEventListener("click", self.abrir);
    trazas.push("limpio");
  };
}, seccion);

boton.click();
await new Promise((r) => setTimeout(r, 120));
const rotacion = gsap.getProperty("#s1 .panel", "rotation");
const fuera = document.querySelector("#s2 .panel").getAttribute("style");
ctx.revert();

// prueba: rotacion === 10
// prueba: fuera === null
// prueba: trazas.join() === "limpio"
// prueba: !document.querySelector("#s1 .panel").getAttribute("style")
// prueba: ctx.isReverted === true
```

Contrato válido para cualquier tecnología: una función recibe el contenedor y devuelve la limpieza. Quien gestione la vista la llama al retirarla, y arrancar de nuevo parte siempre del estado original:

```html
<div class="vista"><div class="entrada"></div></div>
```

```js
function iniciarVista(raiz) {
  const ctx = gsap.context(() => {
    gsap.from(".entrada", { opacity: 0, duration: 0.05 });
  }, raiz);
  return () => ctx.revert();
}

const raiz = document.querySelector(".vista");
let retirar = iniciarVista(raiz);
retirar();                       // revierte a medias
retirar = iniciarVista(raiz);    // segundo arranque limpio
await new Promise((r) => setTimeout(r, 120));
const opacidad = getComputedStyle(raiz.querySelector(".entrada")).opacity;
retirar();

// prueba: opacidad === "1"
// prueba: !raiz.querySelector(".entrada").getAttribute("style")
```

Las animaciones creadas desde un evento no se graban solas; envueltas, sí:

```html
<button class="dentro">a</button><div class="pieza"></div>
```

```js
let seguro;
const c = gsap.context((self, contextSafe) => {
  document.querySelector(".dentro").addEventListener("click", () => {
    gsap.to(".pieza", { y: 5, duration: 0.2 });    // en el evento: sin grabar
  });
  seguro = contextSafe(() => {
    gsap.to(".pieza", { x: 5, duration: 0.2 });    // envuelta: se graba
  });
});

document.querySelector(".dentro").click();
const sinEnvolver = c.data.length;
seguro();
const envuelta = c.data.length;

// prueba: sinEnvolver === 0
// prueba: envuelta === 1
```

Lo que pasa tras un `await` escapa, y la limpieza devuelta por una función `async` se pierde:

```js
let limpiezas = 0;
const asincrono = gsap.context(async () => {
  gsap.to({ x: 0 }, { x: 1, duration: 0.05 });
  await new Promise((r) => setTimeout(r, 10));
  gsap.to({ x: 0 }, { x: 1, duration: 0.05 });     // ya fuera del contexto
  return () => limpiezas++;
});
await new Promise((r) => setTimeout(r, 40));
const grabados = asincrono.data.length;
asincrono.revert();

// prueba: grabados === 1
// prueba: limpiezas === 0
```

Los callbacks de GSAP sí conservan el contexto; un temporizador nativo, no:

```js
const cb = gsap.context(() => {
  gsap.to({ x: 0 }, { x: 1, duration: 0.02, onComplete() { gsap.to({ y: 0 }, { y: 1, duration: 0.02 }); } });
});
const nativo = gsap.context(() => {
  setTimeout(() => gsap.to({ z: 0 }, { z: 1, duration: 0.02 }), 5);
});
await new Promise((r) => setTimeout(r, 120));

// prueba: cb.data.length === 2
// prueba: nativo.data.length === 0
```

`kill()` descarta las limpiezas sin ejecutarlas; `revert()` las ejecuta con la animación ya deshecha:

```html
<div class="n1"></div><div class="n2"></div>
```

```js
const conteo = { kill: 0, xEnLimpieza: null };
const k = gsap.context(() => {
  gsap.to(".n1", { x: 100, duration: 0.3 });
  return () => conteo.kill++;
});
const v = gsap.context(() => {
  gsap.to(".n2", { x: 100, duration: 0.3 });
  return (config, contexto) => { conteo.xEnLimpieza = gsap.getProperty(".n2", "x"); conteo.mismo = contexto === v; };
});
await new Promise((r) => setTimeout(r, 60));
k.kill();
k.revert();
v.revert();

// prueba: conteo.kill === 0
// prueba: conteo.xEnLimpieza === 0
// prueba: conteo.mismo === true
```

Anidados e `ignore`:

```html
<div class="p1"></div><div class="p2"></div><div class="p3"></div>
```

```js
let interior;
const exterior = gsap.context((self) => {
  gsap.to(".p1", { x: 5, duration: 0.3 });
  interior = gsap.context(() => { gsap.to(".p2", { x: 5, duration: 0.3 }); });
  self.ignore(() => { gsap.to(".p3", { x: 5, duration: 0.02 }); });
});
await new Promise((r) => setTimeout(r, 100));
exterior.revert();

// prueba: !document.querySelector(".p1").getAttribute("style")
// prueba: interior.isReverted === true
// prueba: gsap.getProperty(".p3", "x") === 5
```

Plugins dentro del contexto, incluida la restauración del DOM de SplitText:

```html
<div class="foco"></div><p class="frase">hola mundo</p>
```

```js
const original = document.querySelector(".frase").innerHTML;
const conPlugins = gsap.context(() => {
  gsap.to(".foco", { x: 100, scrollTrigger: { trigger: ".foco", scrub: true } });
  ScrollTrigger.create({ trigger: ".foco" });
  SplitText.create(".frase", { type: "words" });
});
const triggers = ScrollTrigger.getAll().length;
conPlugins.revert();

// prueba: triggers === 2
// prueba: ScrollTrigger.getAll().length === 0
// prueba: document.querySelector(".frase").innerHTML === original
```

## Trampas

- **`ctx.kill()` no llama a tus limpiezas, y además las olvida.** Un `ctx.revert()` posterior ya no las ejecuta: los listeners quedan vivos. Usa `revert()` salvo que quieras explícitamente congelar. [C] [E]
- **`await` dentro de la función.** Solo lo síncrono se graba, y `async` devuelve una promesa, no una limpieza. Espera **fuera** y crea el contexto después, o envuelve con `ctx.add()` lo que venga tras el `await`. [C] [E]
- **Eventos sin envolver.** Una animación creada en un clic queda fuera y sobrevive a `revert()`. Usa `self.add("nombre", fn)` o `contextSafe(fn)`. [O] [E]
- **El contexto crece con cada animación añadida.** Lo grabado no sale de `ctx.data` al terminar, así que un handler envuelto que se ejecuta miles de veces retiene miles de tweens hasta `revert()`. En handlers muy frecuentes, reutiliza una animación o [`quickTo`](nuc-quickto.md). [C] [E]
- **Selector fuera del scope.** Con `scope`, `".modal"` que está en otra rama no se encuentra, y `"#s2 .panel"` tampoco, porque la cadena entera se busca dentro. Pasa una referencia al elemento: las referencias no se limitan. `gsap.utils.toArray()` también queda limitado. [C] [E]
- **`revert()` permanente pero reutilizable.** Las animaciones revertidas mueren, aunque el contexto se puede seguir usando: los métodos con nombre siguen ahí y lo nuevo se graba. Vuelve a funcionar `revert()`. [O] [E]
- **Función envuelta llamada tras `revert()`.** `ctx.add("n", fn)`, `ctx.add(null, fn)` y `contextSafe` no comprueban nada: se ejecutan, crean lo que toque y el contexto vuelve a `isReverted: false`, con lo nuevo sin limpieza prevista. En callbacks tardíos, comprueba tú si la vista sigue viva. [C] [E]

```js
const tardia = document.querySelector(".tardia");
const contexto = gsap.context(() => {});
let llamadas = 0;
const envuelta = contexto.add(null, () => { llamadas++; return gsap.to(tardia, { x: 50, duration: 0.05 }); });

contexto.revert();
envuelta();
await new Promise((r) => setTimeout(r, 200));
// prueba: llamadas === 1 && gsap.getProperty(tardia, "x") === 50 && contexto.isReverted === false
```

- **Vistas anidadas con las mismas clases.** Un selector con ámbito alcanza a **todos** los descendientes, también los de una vista interna con su propio contexto. Usa una clase exclusiva, un atributo `data-*` o una referencia al elemento. [O] [E]

```html
<div class="externa"><span class="marca" id="m1"></span><div class="interna"><span class="marca" id="m2"></span></div></div>
```

```js
const externa = gsap.context(() => { gsap.set(".marca", { x: 10 }); }, ".externa");
// prueba: gsap.getProperty("#m1", "x") === 10 && gsap.getProperty("#m2", "x") === 10
```

- **Con varias capturas de la misma propiedad, `revert()` depende del motor.** El orden inverso de creación solo se garantiza entre animaciones que empiezan en momentos distintos. Empatan los `gsap.set()`, los `startAt` de `fromTo` y `from`, y los tweens del mismo tick, como dos `quickTo` del mismo elemento; el comparador de GSAP deja ese desempate al motor. V8 lo invierte y sale bien; SpiderMonkey no, y en Firefox queda lo que capturó el último. No se nota en Chrome. Guarda el valor en línea y restáuralo en la limpieza, o, si solo hay `to` y `quickTo`, crea antes un `gsap.set()` sobre esa propiedad: se deshace después que ellos en cualquier motor. Ver [acordeón](../14-recetas/rec-acordeon.md) y [botón magnético](../14-recetas/rec-boton-magnetico.md). [C] [E]

```js
const pila = document.querySelector(".pila");
const altoInicial = pila.style.height;
const desempate = [1, 2, 3].sort(() => -Infinity).join(); // V8: 3,2,1. SpiderMonkey: 1,2,3

const conEmpate = gsap.context(() => {
  gsap.set(pila, { height: 10 });
  gsap.set(pila, { height: 20 });
  gsap.set(pila, { height: 30 });
});
conEmpate.revert();
const trasRevert = pila.style.height;

// prueba: desempate === "3,2,1" ? trasRevert === altoInicial : trasRevert === "20px"
```

- **`ctx.clear()` no limpia nada.** Solo olvida: las animaciones siguen corriendo y `revert()` ya no las alcanza. [C] [E]
- **`setTimeout` y `requestAnimationFrame` propios.** Cancélalos en la limpieza. Si necesitas esperar, `gsap.delayedCall()` sí se graba y `revert()` la cancela. [E]
- **`gsap.context()` sin argumentos** devuelve el contexto activo, no crea uno. Útil dentro de funciones auxiliares; fuera de un contexto da `undefined`. [C] [E]
- **Duplicar con `matchMedia`.** `gsap.matchMedia()` ya crea un contexto: no anides otro por rutina. [O]
- **Scope que aún no existe.** Un selector sin coincidencias o `{ current: null }` avisa `Invalid scope`. Pero con `null` o `undefined`, por ejemplo un `querySelector` sin resultado, **no avisa y los selectores quedan globales**: pueden animar elementos de otra vista. Comprueba la raíz antes de crear el contexto. [C] [E]
