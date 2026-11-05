---
id: rec-nav-direccion
titulo: Cabecera que se oculta según la dirección
capa: 08-recetas
tipo: patron
ambito: core
resumen: Oculta la cabecera al bajar y la muestra al subir, sin parpadeo, con foco de teclado y scroll nativo.
api: [Lenis.direction, Lenis.scroll, Lenis.velocity, Lenis.on]
requiere: [api-eventos]
relacionadas: [api-instancia, com-sticky-fixed, cal-accesibilidad, rec-menu-anclas]
etiquetas: [navegacion, direccion, cabecera, plantilla]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Cabecera que se oculta según la dirección

Libera altura al leer y recupera la navegación en cuanto el usuario sube. Plantilla: `plantillas/navDireccion.js` con módulos, o `plantillas/globales/navDireccion.js` con `<script>` clásico, que expone `Plantillas.navDireccion`. Ver [cómo copiarla](../plantillas/README.md#copiar-a-un-proyecto).

## Problema

Hay que saber hacia dónde va el scroll en cada paso y cambiar un estado sin que parpadee con gestos cortos o con el rebote final de la inercia.

## Solución

`lenis.direction` da el signo del movimiento. **`1` es hacia abajo y `-1` hacia arriba** [E]; el README dice lo contrario. Sirve para decisiones simples:

```html
<header id="cabecera" style="position:fixed;top:0;left:0;right:0;height:60px;transition:transform .2s"><a id="inicio" href="#">Inicio</a></header>
<style>
  .nav-oculta { transform: translateY(-100%); }
  @media (prefers-reduced-motion: reduce) { #cabecera { transition: none; } }
</style>
<div style="height:4000px"></div>
```

```js
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
const nav = document.querySelector("#cabecera");

rueda(300);
await espera(60);
const alBajar = lenis.direction;
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);
rueda(-100);
await espera(60);
const alSubir = lenis.direction;

// prueba: alBajar === 1 && alSubir === -1
```

Para una cabecera, compara posiciones con un umbral en lugar de usar `direction` tal cual. Así un gesto de 4 px no cambia nada, y el estado no depende del signo de un solo paso:

```js
const nav = document.querySelector("#cabecera");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
const UMBRAL = 8;
let referencia = lenis.scroll;

function revisar() {
  const recorrido = lenis.scroll - referencia;
  if (Math.abs(recorrido) < UMBRAL) return;
  nav.classList.toggle("nav-oculta", recorrido > 0 && lenis.scroll > 80);
  referencia = lenis.scroll;
}
const quitar = lenis.on("scroll", revisar);

rueda(500);
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);
const oculta = nav.classList.contains("nav-oculta");

rueda(4);
await espera(200);
const sinParpadeo = nav.classList.contains("nav-oculta");

rueda(-120);
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);

// prueba: oculta && sinParpadeo
// prueba: !nav.classList.contains("nav-oculta")
```

## Parámetros

| Plantilla | Por defecto | Uso |
|---|---|---|
| `lenis` | crea una | Instancia compartida |
| `clase` | `"nav-oculta"` | Clase al ocultar. El aspecto es de tu CSS |
| `umbral` | `8` | Píxeles antes de cambiar |
| `margen` | `80` | Arriba de este valor, siempre visible |

## Movimiento reducido

Mantén el estado y anula la transición en CSS, como en el marcado de arriba: la cabecera aparece y desaparece sin deslizarse. La clase sigue cambiando con esa preferencia [E, prueba `conReducido` de la plantilla]. Si prefieres no ocultarla nunca, no llames a la plantilla cuando `prefers-reduced-motion` coincida.

## Limpieza

Quita la suscripción y la clase. La plantilla también retira los listeners de foco [E].

## Trampas

- **`direction` no significa "se está moviendo".** Al terminar la animación nada lo pone a 0: conserva el último signo hasta que otro paso lo reescriba. Para saber si hay movimiento, usa `isScrolling`. [C]
- **Una cabecera oculta con el foco dentro es una trampa de teclado.** El Tab llega a un enlace invisible. Escucha `focusin` y muéstrala; `focusout` también salta al cambiar de ventana, así que comprueba `activeElement`. La plantilla lo hace [E].
- **`transform` en un antecesor rompe `position: fixed`.** Si la cabecera está dentro de un elemento transformado, deja de estar fija. [P]
- **Con `infinite`, `lenis.scroll` salta al dar la vuelta.** La diferencia con la referencia se dispara y parece un cambio de dirección. Usa `lenis.direction`, o descarta saltos mayores que `lenis.limit / 2`. [C]
