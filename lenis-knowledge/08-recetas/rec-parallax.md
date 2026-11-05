---
id: rec-parallax
titulo: Parallax sincronizado con Lenis
capa: 08-recetas
tipo: patron
ambito: core
resumen: Elementos que se mueven a otra velocidad que el scroll, en el mismo paso que Lenis, midiendo una sola vez.
api: [Lenis.on, Lenis.scroll, Lenis.actualScroll, Lenis.dimensions, Lenis.prefersReducedMotion]
requiere: [api-eventos, com-raf]
relacionadas: [cal-rendimiento, cal-accesibilidad, int-gsap, rec-canvas-sync]
etiquetas: [parallax, sincronizacion, plantilla]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Parallax sincronizado con Lenis

Desplaza un elemento a distinta velocidad que la página. Plantilla: `plantillas/parallax.js` con módulos, o `plantillas/globales/parallax.js` con `<script>` clásico, que expone `Plantillas.parallax`. Ver [cómo copiarla](../plantillas/README.md#copiar-a-un-proyecto).

## Problema

Un parallax con `scroll` del navegador suele ir un paso por detrás, y reparte lecturas de layout por cada fotograma. Hace falta escribir en el mismo paso que Lenis mueve la página, sin medir continuamente.

## Solución

Mide el centro de cada elemento una vez. En cada `scroll`, calcula la distancia al centro de la vista y escribe solo `transform`.

```html
<div style="height:300px"></div>
<div id="zona" style="height:700px;overflow:hidden">
  <div id="fondo" data-velocidad="0.3" style="height:500px">Fondo</div>
</div>
<div style="height:3000px"></div>
```

```js
const fondo = document.querySelector("#fondo");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
const factor = Number(fondo.dataset.velocidad);

const rect = fondo.getBoundingClientRect();
const centro = rect.top + lenis.actualScroll + rect.height / 2;

function pintar() {
  const distancia = lenis.scroll + lenis.dimensions.height / 2 - centro;
  fondo.style.transform = `translate3d(0, ${(distancia * factor).toFixed(2)}px, 0)`;
}

const quitar = lenis.on("scroll", pintar);
pintar();
const inicial = parseFloat(fondo.style.transform.split(",")[1]);

rueda(400);
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);
const final = parseFloat(fondo.style.transform.split(",")[1]);

// prueba: Math.abs(final - inicial - lenis.scroll * 0.3) < 1
```

La referencia es `lenis.dimensions.height`, no `innerHeight`: vale también con un contenedor [E]. Si el contenedor cambia de tamaño, la plantilla lo observa y vuelve a medir [E].

## Parámetros

| Plantilla | Por defecto | Uso |
|---|---|---|
| `lenis` | crea una | Instancia compartida |
| `velocidad` | `0.2` | Fracción de la distancia al centro de la vista |

Por elemento, `data-velocidad`. Negativo invierte el sentido [E]. Si el elemento ya tiene un `transform` en línea, la plantilla lo conserva y añade el suyo [E].

## Movimiento reducido

El parallax es movimiento decorativo: no lo apliques con esa preferencia. La opción `respectReducedMotion` solo afecta al scroll de Lenis, no a lo que tú escribas. Comprueba la preferencia, y escucha su cambio: Lenis lee `matches` en cada scroll, y tu código también debe hacerlo [C].

```js
const preferencia = { matches: true, addEventListener() {}, removeEventListener() {} };
window.matchMedia = () => preferencia; // solo para la prueba

const fondo = document.querySelector("#fondo");
const lenis = new Lenis({ autoRaf: true });
const quitar = lenis.on("scroll", () => {
  if (lenis.prefersReducedMotion) return;
  fondo.style.transform = "translate3d(0, 10px, 0)";
});

rueda(300);
await espera(300);

// prueba: lenis.scroll > 200 && fondo.style.transform === ""
```

`lenis.prefersReducedMotion` vale `false` si la instancia se creó con `respectReducedMotion: false`, aunque el usuario pida reducir [C]: en ese caso consulta `matchMedia` directamente, como hace la plantilla.

## Limpieza

Quita la suscripción y devuelve `transform` a su valor previo. Si no, el elemento queda desplazado al retirar la vista [E].

## Trampas

- **Medir con el elemento ya transformado acumula error.** `getBoundingClientRect()` incluye tu `translate3d`. Devuelve el `transform` original antes de medir. La plantilla lo hace en `limpiar.actualizar()` [E].
- **Tras cambiar el contenido, las posiciones guardadas son falsas.** Lenis no avisa: `scroll` no se emite en el reajuste automático. Llama a `limpiar.actualizar()`. [C] [E]
- **Leer `getBoundingClientRect()` en cada paso** obliga a recalcular el layout dentro del fotograma. Mide fuera del bucle. [P]
- **`overflow: hidden` en el elemento que se mueve** recorta su propio contenido. Ponlo en el padre, con el hijo más alto que la ventana visible. [P]
- **Con `infinite`,** `lenis.scroll` salta al dar la vuelta y el elemento también. [C]
- **`window.scrollY` no vale aquí.** Es el valor redondeado por el navegador; `lenis.scroll` es el que se acaba de aplicar, con decimales. [P]
