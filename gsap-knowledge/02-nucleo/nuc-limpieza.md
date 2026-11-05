---
id: nuc-limpieza
titulo: kill frente a revert - limpiar animaciones
capa: 02-nucleo
tipo: concepto
ambito: core
resumen: Qué deja kill y qué deshace revert, inline styles, reutilización, muerte parcial, callbacks y cuál usar en cada situación.
api: [Animation.kill, Tween.kill, Animation.revert, gsap.killTweensOf, Animation.pause]
relacionadas: [nuc-context, nuc-matchmedia, nuc-consulta, nuc-control, nuc-promesas, css-clearprops, fra-agnostico]
etiquetas: [limpieza, kill, revert, memoria]
fuentes:
  - docs/v3/GSAP/Tween/kill().md
  - docs/v3/GSAP/Tween/revert().md
  - docs/v3/GSAP/gsap.killTweensOf().md
estado: verificado
version: 3.15.1
---
# kill frente a revert

Las dos paran una animación, pero dejan cosas distintas: `kill()` **congela** en el valor actual; `revert()` **deshace**, retirando lo que GSAP escribió y devolviendo los estilos originales. Elegir mal es la causa típica de elementos a medio animar tras cambiar de ruta o de breakpoint. [O]

## Modelo mental

| | `kill()` | `revert()` | `pause()` | `progress(0)` |
|---|---|---|---|---|
| Detiene | Sí | Sí | Sí | No |
| Reutilizable después | **Tween: no. Timeline: sí** | No, salvo `{ kill: false }` | Sí | Sí |
| Valores en el objetivo | Se quedan como estén | Vuelven al estado previo | Se quedan | Vuelven al inicio |
| Inline styles de GSAP | Se quedan | **Se retiran** | Se quedan | Se quedan |
| Inline styles previos | Sobrescritos | **Restaurados** | Sobrescritos | Sobrescritos |
| `onInterrupt` | Sí, si no había terminado | **Sí, siempre**, aunque hubiera terminado | No | No |
| Libera para GC | Sí | Sí | No | No |

Marcas: [O] para la definición; [E] en las celdas que prueban los ejemplos.

**`kill()` no es igual en tween y timeline.** `Tween` tiene su propio `kill()`. `Timeline` hereda el de `Animation`, que solo la saca de su padre: **no toca a los hijos**, y un `restart()` posterior la devuelve a la vida. `revert()` sí recorre los hijos. [C] [E]

**Regla de decisión** [P]:

- **Retirar la vista, cambio de breakpoint o reconstrucción** → `revert()`, normalmente mediante [`gsap.context()`](nuc-context.md) o [`gsap.matchMedia()`](nuc-matchmedia.md).
- **Parar sin que se note**, dejando el elemento donde esté → `kill()`.
- **Parar para continuar luego** → `pause()`.

## Ejemplo

Interrumpidos a media animación, `kill()` deja restos de un `from()`; `revert()` deja el HTML original:

```html
<div class="a" style="width: 50px"></div>
<div class="b" style="width: 50px"></div>
```

```js
const cajaA = document.querySelector(".a");
const cajaB = document.querySelector(".b");
const conKill = gsap.from(cajaA, { opacity: 0, x: 100, duration: 0.3 });
const conRevert = gsap.from(cajaB, { opacity: 0, x: 100, duration: 0.3 });

await new Promise((r) => setTimeout(r, 80));
conKill.kill();
conRevert.revert();

// prueba: cajaA.style.opacity !== ""
// prueba: cajaA.style.transform !== ""
// prueba: cajaB.getAttribute("style").replace(/\s/g, "") === "width:50px;"
```

`revert()` recupera los inline previos, incluso si la animación ya había terminado; `progress(0)` deja inline el valor que leyó:

```html
<div class="previa" style="opacity: 0.5; transform: translateX(10px)"></div>
<div class="retorno"></div>
```

```js
const previa = document.querySelector(".previa");
const retorno = document.querySelector(".retorno");

const uno = gsap.to(previa, { opacity: 1, x: 100, duration: 0.02 });
const dos = gsap.to(retorno, { opacity: 0, duration: 0.02 });
await new Promise((r) => setTimeout(r, 80));

uno.revert();
dos.progress(0).pause();

// prueba: previa.style.opacity === "0.5"
// prueba: gsap.getProperty(previa, "x") === 10
// prueba: retorno.style.opacity === "1"
```

Muerte parcial: `kill(objetivo, propiedades)` y `gsap.killTweensOf()`:

```html
<div class="m1"></div><div class="m2"></div>
```

```js
const m = gsap.to([".m1", ".m2"], { x: 100, y: 100, duration: 0.1, ease: "none" });
await new Promise((r) => setTimeout(r, 30));
m.kill(".m1", "x");      // solo x de .m1
await new Promise((r) => setTimeout(r, 200));

// prueba: gsap.getProperty(".m1", "x") < 100
// prueba: gsap.getProperty(".m1", "y") === 100
// prueba: gsap.getProperty(".m2", "x") === 100
```

Lo destruido no resucita, salvo con `revert({ kill: false })`, opción que no está en la documentación:

```html
<div class="v1"></div><div class="v2"></div>
```

```js
const muerta = gsap.to(".v1", { x: 100, duration: 0.2, ease: "none", paused: true });
muerta.progress(0.5).kill();
const antes = gsap.getProperty(".v1", "x");
muerta.restart();

const viva = gsap.to(".v2", { x: 100, duration: 0.05, paused: true });
viva.progress(0.5);
viva.revert({ kill: false });
const limpio = document.querySelector(".v2").getAttribute("style");
viva.play();

await new Promise((r) => setTimeout(r, 150));

// prueba: gsap.getProperty(".v1", "x") === antes
// prueba: !/translate\(|translate3d/.test(limpio || "")
// prueba: gsap.getProperty(".v2", "x") === 100
```

Un timeline se revierte entero, también lo terminado:

```html
<div class="t1"></div><div class="t2"></div>
```

```js
const linea = gsap.timeline()
  .to(".t1", { x: 100, duration: 0.05 })
  .from(".t2", { opacity: 0, duration: 0.3 });
await new Promise((r) => setTimeout(r, 120));
linea.revert();

// prueba: !document.querySelector(".t1").getAttribute("style")
// prueba: !document.querySelector(".t2").getAttribute("style")
```

## kill en un timeline y onInterrupt

Dos comportamientos que suelen darse por supuestos al revés [C] [E]:

```js
const tl = gsap.timeline();
tl.to(".pieza", { x: 100, duration: 0.2 });
await new Promise((r) => setTimeout(r, 60));
tl.kill();
const trasKill = gsap.getProperty(".pieza", "x");
await new Promise((r) => setTimeout(r, 150));
const sigueParado = gsap.getProperty(".pieza", "x") === trasKill;

tl.restart();
await new Promise((r) => setTimeout(r, 300));
// prueba: sigueParado
// prueba: trasKill > 0 && trasKill < 100
// prueba: gsap.getProperty(".pieza", "x") === 100
```

```js
const avisos = [];
const hecho = gsap.to(".sello", { x: 10, duration: 0.05, onInterrupt: () => avisos.push("revert") });
const otro = gsap.to(".marca", { x: 10, duration: 0.05, onInterrupt: () => avisos.push("kill") });
await new Promise((r) => setTimeout(r, 150));
hecho.revert();
otro.kill();
// prueba: avisos.join() === "revert"
```

## Trampas

- **`kill()` al retirar la vista con `from()`.** El elemento queda con la opacidad intermedia si el nodo sobrevive o se reutiliza. Usa `revert()`. [O] [E]
- **`revert()` al final de una animación que debía quedarse.** Devuelve el estado anterior: si querías conservar el resultado, usa `kill()` o déjala terminar. [P]
- **Reutilizar tras `kill()`.** En un tween, `restart()` no da error ni hace nada. En un timeline sí arranca de nuevo, así que `kill()` no basta para retirarla para siempre si conservas la referencia. Si necesitas reutilizar, `pause()`. [C] [E]
- **`revert()` con varias animaciones del mismo elemento, una a una.** Cada una restaura lo que vio al inicio. Hay que revertir en orden inverso de creación. `ctx.revert()` lo resuelve, salvo en los empates, que [dependen del motor](nuc-context.md#trampas). [C] [E]
- **`onInterrupt` en `revert()`.** Se dispara también al limpiar, incluso en animaciones ya terminadas. Si ahí cambias estado de la aplicación, puede ejecutarse mientras se retira la vista. [E]
- **`onUpdate` en `revert()`.** `revert()` lanza una llamada más a `onUpdate`, también en animaciones terminadas. Si ahí escribes o pintas, puede actuar sobre recursos que estás liberando. [E]
- **`clearProps` frente a `revert()`.** `clearProps` borra propiedades concretas al terminar un tween, aunque estuvieran antes; `revert()` devuelve exactamente lo anterior. Ver `css-clearprops`. [O]
- **Dejar referencias.** Tras `kill()`, asigna `null` a tu variable para permitir la recolección. [O]
- **`gsap.killTweensOf()` no restaura nada**: equivale a `kill()`, no a `revert()`. Sobre un timeline, solo retira los tweens afectados. [O] [C]
- **Promesas pendientes.** Ni `kill()` ni `revert()` resuelven un `await` en curso: ver [promesas](nuc-promesas.md). [E]
