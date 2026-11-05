---
id: nuc-matchmedia
titulo: gsap.matchMedia() - animaciones por media query
capa: 02-nucleo
tipo: api
ambito: core
resumen: Ejecuta código según media queries y lo revierte al dejar de coincidir. Condiciones, prefers-reduced-motion, scope, refresh y diferencias entre revert y kill.
api: [gsap.matchMedia, gsap.matchMediaRefresh, gsap.MatchMedia.contexts, gsap.MatchMedia.add, gsap.MatchMedia.revert, gsap.MatchMedia.kill, gsap.Context.conditions, gsap.Context.queries]
requiere: [nuc-context]
relacionadas: [nuc-context, nuc-limpieza, scr-refresh, cal-accesibilidad, fra-agnostico, rec-pin-horizontal]
etiquetas: [responsive, media-query, accesibilidad, reduced-motion]
fuentes:
  - docs/v3/GSAP/gsap.matchMedia().md
  - docs/v3/GSAP/gsap.matchMediaRefresh().md
estado: verificado
version: 3.15.1
---
# gsap.matchMedia()

Registra funciones ligadas a media queries: se ejecutan cuando la query coincide y, al dejar de coincidir, todo lo creado dentro se **revierte solo**. Es la forma recomendada de tener animaciones distintas por tamaño de pantalla y de respetar `prefers-reduced-motion`. Es un contenedor de [`gsap.context()`](nuc-context.md): no hace falta combinarlos. [O]

## Firma

```text
gsap.matchMedia(scope?) → MatchMedia
mm.add(query | condiciones, func, scope?) → mm        encadenable
func(context, contextSafe) → cleanup?
mm.revert()      mm.kill(revert?)      mm.contexts
gsap.matchMediaRefresh()
```

| Pieza | Comportamiento |
|---|---|
| Query | Cadena como la de `window.matchMedia()`. Se expone como `context.conditions.matches` [O] [E] |
| Condiciones | Objeto de nombre a query. Se ejecuta si **alguna** coincide, y `context.conditions` trae un booleano por nombre [O] [E] |
| Reejecución | Con condiciones, cualquier cambio revierte y vuelve a ejecutar; si ya no coincide ninguna, solo revierte [O] [E] |
| `context` | Es un Context: admite `add()`, `ignore()`, `selector`. `context.queries` guarda las queries [O] [C] [E] |
| Limpieza | Función devuelta. Corre tras revertir, cuando deja de coincidir o se llama a `mm.revert()` [O] [E] |
| `scope` | En `gsap.matchMedia(scope)` es el valor por defecto; `add(..., scope)` lo sustituye. Dentro de un `gsap.context()` con scope, lo hereda [O] [C] [E] |
| `mm.contexts` | Un Context por cada `add()`, coincida o no [C] [E] |

Al cruzar un breakpoint, GSAP revierte primero **todos** los contextos afectados y solo después ejecuta los nuevos: cada función arranca desde el estado limpio. [C] [E]

| Operación | Revierte | Ejecuta limpieza | Sigue escuchando |
|---|---|---|---|
| Deja de coincidir | Sí | Sí | Sí |
| `gsap.matchMediaRefresh()` | Sí, y reejecuta las que coinciden | Sí | Sí |
| `mm.revert()` | Sí | Sí | **No** |
| `mm.kill()` | No | No | **No** |

## Ejemplo

Los bloques siguientes cambian el ancho real del iframe de prueba. Un navegador emite `change` por sí solo al redimensionar; aquí se emite a mano porque los iframes sin pintar lo retrasan.

```html
<div class="logo"></div>
```

```js
// ayuda de prueba: redimensiona y notifica. En una web real no hace falta.
const consultas = [];
const nativo = window.matchMedia.bind(window);
window.matchMedia = (q) => { const m = nativo(q); consultas.push(m); return m; };
const anchoA = async (w) => {
  window.frameElement.width = w;
  await new Promise((r) => setTimeout(r, 30));
  consultas.forEach((m) => m.dispatchEvent(new Event("change")));
  await new Promise((r) => setTimeout(r, 60));
};

const pasos = [];
const mm = gsap.matchMedia();

mm.add("(min-width: 800px)", () => {
  pasos.push("escritorio");
  gsap.to(".logo", { x: 100, duration: 0.02 });
  return () => pasos.push("fin-escritorio");
});
mm.add("(max-width: 799px)", () => {
  pasos.push("movil, x=" + gsap.getProperty(".logo", "x"));  // ya revertido
  gsap.to(".logo", { y: 100, duration: 0.02 });
  return () => pasos.push("fin-movil");
});

await new Promise((r) => setTimeout(r, 60));
await anchoA(500);
const enMovil = { x: gsap.getProperty(".logo", "x"), y: gsap.getProperty(".logo", "y") };

// prueba: pasos.join("|") === "escritorio|fin-escritorio|movil, x=0"
// prueba: enMovil.x === 0 && enMovil.y === 100
```

Condiciones: un solo bloque con ramas, y `prefers-reduced-motion`:

```html
<div class="barra"></div>
```

```js
const leidas = [];
const mm = gsap.matchMedia();

mm.add(
  {
    esAncho: "(min-width: 800px)",
    esEstrecho: "(max-width: 799px)",
    reducir: "(prefers-reduced-motion: reduce)",
  },
  (context) => {
    const { esAncho, reducir } = context.conditions;
    leidas.push(context.conditions);
    gsap.to(".barra", {
      x: esAncho ? 200 : 50,
      duration: reducir ? 0 : 0.05,   // salta al final si se pide reducir
    });
  }
);

// prueba: leidas.length === 1
// prueba: leidas[0].esAncho === true && leidas[0].reducir === false
// prueba: gsap.getProperty(".barra", "x") === 200
```

Tras `mm.revert()` deja de escuchar. Lo revertido no vuelve al recuperar el ancho, y solo se reactiva lo que añadas de nuevo:

```html
<div class="tira"></div>
```

```js
const consultas = [];
const nativo = window.matchMedia.bind(window);
window.matchMedia = (q) => { const m = nativo(q); consultas.push(m); return m; };
const anchoA = async (w) => {
  window.frameElement.width = w;
  await new Promise((r) => setTimeout(r, 30));
  consultas.forEach((m) => m.dispatchEvent(new Event("change")));
  await new Promise((r) => setTimeout(r, 30));
};

const veces = { a: 0, b: 0 };
const mm = gsap.matchMedia();
mm.add("(min-width: 800px)", () => { veces.a++; });
mm.revert();
await anchoA(500);
await anchoA(1000);
gsap.matchMediaRefresh();
const trasRevert = veces.a;

mm.add("(min-width: 800px)", () => { veces.b++; });
await anchoA(500);
await anchoA(1000);

// prueba: trasRevert === 1
// prueba: veces.a === 1
// prueba: veces.b === 2
// prueba: mm.contexts.length === 2
```

`mm.kill()` congela y no limpia. Interruptor de movimiento con `gsap.matchMediaRefresh()`:

```html
<div class="k"></div><div class="interruptor"></div>
```

```js
const mk = gsap.matchMedia();
let limpiezasKill = 0;
mk.add("(min-width: 800px)", () => {
  gsap.to(".k", { x: 100, duration: 0.02 });
  return () => limpiezasKill++;
});
await new Promise((r) => setTimeout(r, 60));
mk.kill();

let reducido = false;
const mm = gsap.matchMedia();
mm.add("(min-width: 800px)", () => {
  gsap.to(".interruptor", { x: reducido ? 10 : 100, duration: 0.02 });
});
await new Promise((r) => setTimeout(r, 60));
reducido = true;
gsap.matchMediaRefresh();
await new Promise((r) => setTimeout(r, 60));

// prueba: gsap.getProperty(".k", "x") === 100
// prueba: limpiezasKill === 0
// prueba: gsap.getProperty(".interruptor", "x") === 10
// prueba: mm.contexts.length === 1
```

Eventos dentro de la función, y `scope`:

```html
<div id="z1"><div class="c"></div></div><div id="z2"><div class="c"></div></div>
<button class="accion">x</button>
```

```js
const mm = gsap.matchMedia("#z1");
const padres = [];

mm.add("(min-width: 800px)", (context) => {
  padres.push(gsap.utils.toArray(".c")[0].parentNode.id);
  context.add("alClic", () => { gsap.to(".c", { rotation: 30, duration: 0.02 }); });
  const b = document.querySelector(".accion");
  b.addEventListener("click", context.alClic);
  return () => b.removeEventListener("click", context.alClic);
});
mm.add("(min-width: 800px)", () => {
  padres.push(gsap.utils.toArray(".c")[0].parentNode.id);
}, "#z2");

document.querySelector(".accion").click();
await new Promise((r) => setTimeout(r, 60));
const rotado = gsap.getProperty("#z1 .c", "rotation");
mm.revert();

// prueba: padres.join() === "z1,z2"
// prueba: rotado === 30
// prueba: !document.querySelector("#z1 .c").getAttribute("style")
```

Clave `all` en un objeto de condiciones:

```js
let veces = 0;
let leidas;
gsap.matchMedia().add({ all: "(min-width: 99999px)" }, (context) => {
  veces++;
  leidas = Object.keys(context.conditions).length;
});

// prueba: veces === 1
// prueba: leidas === 0
```

## Trampas

- **`mm.revert()` no es un "reinicio".** Quita los oyentes de esas queries: nada vuelve a ejecutarse aunque la query coincida otra vez, ni siquiera con `gsap.matchMediaRefresh()`. Si quieres reejecutar, llama a `gsap.matchMediaRefresh()` en lugar de `revert()`. Para volver a activar lo revertido, crea otro `add()`. [C] [E]
- **`mm.kill()` tampoco ejecuta limpiezas**, igual que `ctx.kill()`. Deja listeners vivos y estilos a medias. [C] [E]
- **`revert()` dentro de la limpieza.** GSAP ya revierte: no lo llames, pon ahí solo tu código propio. [O]
- **`gsap.matchMediaRefresh()` afecta a todos los MatchMedia de la página**, no a uno. No destruye instancias. [O]
- **Huecos entre breakpoints.** `"(min-width: 800px)"` y `"(max-width: 800px)"` se solapan en 800, y con decimales puede quedar un hueco si usas 799. Usa una misma condición y su negación, o un objeto de condiciones. [P]
- **Olvidar el caso reducido.** Si solo registras `no-preference`, quien pida menos movimiento no verá la animación, pero tampoco el estado final si dependía de un `from()`. Comprueba ese estado. [P]
- **`duration: 0` con ScrollTrigger en reducido** no elimina el trigger ni el pin. Crea un camino aparte para esa condición. Ver `cal-accesibilidad`. [P]
- **Código de la función que no es de GSAP.** Los listeners nativos no se revierten: quítalos en la limpieza, o se duplican en cada cruce de breakpoint. [O] [E]
- **`from()` en varios breakpoints.** Como todo se revierte antes de ejecutar, el destino se lee del estado limpio: aquí no se produce la degradación de `from()`. [C]
- **Viewport móvil.** Sin `<meta name="viewport" content="width=device-width, initial-scale=1">`, las queries se evalúan contra un ancho virtual. [O]
- **Clave `all`.** En el objeto de condiciones, una clave llamada `all` fuerza la ejecución sin evaluar su valor. No está documentada: es mejor la query `"all"`, que es CSS estándar. [C] [E]
