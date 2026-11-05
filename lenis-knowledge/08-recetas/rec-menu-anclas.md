---
id: rec-menu-anclas
titulo: Menú de anclas con foco y sección activa
capa: 08-recetas
tipo: patron
ambito: core
resumen: Enlaces internos con scroll suave, foco accesible, URL al día y sección activa marcada, también dentro de Shadow DOM.
api: [LenisOptions.anchors, Lenis.scrollTo, ScrollToOptions.offset, ScrollToOptions.onComplete]
requiere: [com-anclas, api-scrollto]
relacionadas: [cal-accesibilidad, rec-nav-direccion, rec-scroll-to-top, com-restauracion]
etiquetas: [anclas, navegacion, foco, plantilla]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Menú de anclas con foco y sección activa

Convierte un menú de enlaces `#seccion` en navegación suave y accesible. Plantilla: `plantillas/menuAnclas.js` con módulos, o `plantillas/globales/menuAnclas.js` con `<script>` clásico, que expone `Plantillas.menuAnclas`. Ver [cómo copiarla](../plantillas/README.md#copiar-a-un-proyecto).

## Problema

`anchors: true` resuelve el desplazamiento, pero no todo lo demás: el foco de teclado, la sección activa y las raíces en Shadow DOM.

## Solución

Para un caso simple basta la opción. Lenis escucha el clic, calcula el destino y deja que el navegador actualice el hash, porque no llama a `preventDefault` [C] [E]. Desde 1.3.20 respeta `scroll-margin` [C]; es el modo natural de dejar sitio a una cabecera.

```html
<nav id="menu"><a id="ir" href="#precios">Precios</a></nav>
<div style="height:1500px"></div>
<section id="precios" style="scroll-margin-top:60px">Precios</section>
<div style="height:3000px"></div>
```

```js
const destino = document.querySelector("#precios").getBoundingClientRect().top - 60;
const lenis = new Lenis({ autoRaf: true, lerp: 0.3, anchors: true });

document.querySelector("#ir").click();
await espera(30);
const enCamino = lenis.isSmooth;
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);

// prueba: enCamino
// prueba: Math.abs(lenis.scroll - destino) < 2
// prueba: location.hash === "#precios"
```

Con foco, hash y varios enlaces, toma el clic por delegación y pasa el **elemento**, no el selector:

```js
const menu = document.querySelector("#menu");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });

function alPulsar(evento) {
  const enlace = evento.target.closest("a[href^='#']");
  const destino = enlace && menu.getRootNode().getElementById(enlace.hash.slice(1));
  if (!destino) return;
  evento.preventDefault();
  lenis.scrollTo(destino);
  destino.setAttribute("tabindex", "-1");
  destino.focus({ preventScroll: true });
  history.pushState(null, "", enlace.hash);
}
menu.addEventListener("click", alPulsar);

document.querySelector("#ir").click();
const conFoco = document.activeElement.id === "precios";
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);

// prueba: conFoco
// prueba: lenis.scroll > 1400
```

## Parámetros

| Plantilla | Por defecto | Uso |
|---|---|---|
| `lenis` | crea una | Instancia compartida |
| `desplazamiento` | `0` | `offset` de `scrollTo`. Negativo deja sitio arriba |
| `duracion` | la de la instancia | Segundos |
| `actualizarUrl` | `true` | Añade el hash al historial |
| `linea` | `0.33` | Altura relativa que decide la sección activa |

La plantilla marca con `aria-current="location"` el enlace de la sección activa, y usa delegación: enlaces nuevos ya cuentan sin hacer nada [E].

## Movimiento reducido

No hay que tocar nada: con `prefers-reduced-motion`, `scrollTo` pasa a `immediate` y salta en el mismo paso [C] [E, prueba `inmediato` de la plantilla]. El foco y el hash siguen igual.

## Limpieza

Quita el listener de clic y la suscripción a `scroll`. La plantilla retira además `aria-current` y los `tabindex` temporales [E].

## Trampas

- **`lenis.scrollTo("#id")` no atraviesa Shadow DOM.** Usa `document.getElementById`: dentro de una sombra avisa `Lenis: Target not found` y no se mueve. Lo mismo pasa con `anchors`. Resuelve el elemento con `getRootNode()` y pásalo. [C] [E]
- **Menú y secciones en raíces distintas.** `getRootNode()` solo mira la raíz del menú: un menú en una sombra no ve las secciones de fuera, y falla en silencio. La plantilla sube por `getRootNode().host` hasta encontrarlo [E]. Hacia dentro no busca: un menú fuera no alcanza secciones dentro de una sombra.
- **`evento.target` se reescribe al cruzar una sombra.** Un enlace en la sombra de un hijo del menú llega como su anfitrión, y `closest("a")` no lo encuentra. La plantilla lee `composedPath()` [E]. `aria-current` solo marca enlaces del árbol del menú.
- **`preventDefault` deja atrás el foco.** El navegador ya no coloca el punto de partida de Tab en el destino: el siguiente Tab vuelve al menú. Enfoca el destino con `preventScroll: true`. [P]
- **Sin `preventScroll`, `focus()` salta** y corta la animación con un scroll nativo. [P]
- **`anchors` escucha en `wrapper`.** Con un contenedor, los enlaces de fuera, por ejemplo un menú fijo, no se detectan. El listener de la plantilla está en el menú. [C]
- **`scroll-margin` y `offset` se suman.** Con `scroll-margin-top: 60px` y `offset: -60` quedan 120 px. Usa uno de los dos. También cuenta `scroll-padding` del contenedor. [C]
- **`onComplete` no es fiable para mover el foco.** Si una rueda interrumpe el desplazamiento, no se llama. Enfoca en el clic. [C] [E: [rec-scroll-to-top](rec-scroll-to-top.md)]

```js
const anfitrion = document.createElement("div");
document.body.prepend(anfitrion);
const sombra = anfitrion.attachShadow({ mode: "open" });
sombra.innerHTML = '<div style="height:1000px"></div><p id="oculto">x</p>';
const nombre = "oculto";
const elemento = sombra.getElementById(nombre);
const avisos = [];
const avisoReal = console.warn;
console.warn = (m) => avisos.push(m);
const lenis = new Lenis({ autoRaf: true, lerp: 0.5 });

lenis.scrollTo("#" + nombre);
await espera(100);
const sinMover = lenis.scroll === 0;
console.warn = avisoReal;

lenis.scrollTo(elemento, { offset: -40 });
await espera(500);

// prueba: sinMover && avisos[0] === "Lenis: Target not found"
// prueba: lenis.scroll > 900
```
