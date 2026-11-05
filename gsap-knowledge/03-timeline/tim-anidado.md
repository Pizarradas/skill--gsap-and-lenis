---
id: tim-anidado
titulo: Timelines anidadas
capa: 03-timeline
tipo: patron
ambito: core
resumen: Componer una secuencia larga con funciones que devuelven timelines. Cómo interactúan posición, pausa, repeat y defaults entre madre e hija.
api: [Timeline.add, Animation.parent, Timeline.getChildren]
requiere: [tim-posicion]
relacionadas: [tim-herencia, tim-gestion, tim-control]
etiquetas: [timeline, arquitectura, composicion]
fuentes:
  - docs/v3/GSAP/Timeline.md
  - docs/v3/GSAP/Timeline/add().md
  - docs/v3/GSAP/Timeline/parent.md
  - resources/st-mistakes.md
estado: verificado
version: 3.15.1
---
# Timelines anidadas

Una timeline es un hijo más: se inserta en otra con `add()` y se mueve, repite o escala como una pieza. Es la forma de que una animación larga siga siendo mantenible. [O]

## Problema

Una secuencia de 40 tweens en un solo bloque obliga a reajustar posiciones al cambiar una escena, y una escena no se puede probar aislada.

## Solución

Cada escena es una función que crea y **devuelve** su timeline. Una timeline maestra las ensambla y es la única con la lógica de orden.

```html
<div class="cabecera" style="width:80px;height:80px"></div>
<div class="cuerpo" style="width:80px;height:80px"></div>
<div class="cierre" style="width:80px;height:80px"></div>
```

```js
function escenaCabecera() {
  return gsap.timeline().to(".cabecera", { x: 50, duration: 0.1, ease: "none" });
}

function escenaCuerpo() {
  return gsap.timeline().to(".cuerpo", { x: 50, duration: 0.1, ease: "none" });
}

function escenaCierre() {
  return gsap.timeline().to(".cierre", { x: 50, duration: 0.1, ease: "none" });
}

const maestra = gsap.timeline();
maestra
  .add(escenaCabecera())
  .add(escenaCuerpo(), "+=0.05")
  .add(escenaCierre(), "-=0.05");

const hijos = maestra.getChildren(false);

// prueba: hijos.length === 3
// prueba: hijos[1].startTime() === 0.15
// prueba: hijos[2].startTime() === 0.2
// prueba: Math.abs(maestra.duration() - 0.3) < 0.0001
// prueba: gsap.getProperty(".cierre", "x") === 50
```

Una hija tiene su propio `repeat` y `timeScale`, y la maestra los ve como duración. [E]

```js
const pulso = gsap.timeline({ repeat: 2 }).to({ a: 0 }, { a: 1, duration: 1 });
const lento = gsap.timeline().to({ b: 0 }, { b: 1, duration: 1 }).timeScale(0.5);

const conjunto = gsap.timeline({ paused: true });
conjunto.add(pulso).add(lento);

// prueba: lento.startTime() === 3
// prueba: conjunto.duration() === 5
// prueba: pulso.parent === conjunto
```

### Partes que aportan a un timeline común

Si cada parte vive en un módulo o vista distinta, nadie debe conocer el conjunto. Quien coordina crea el timeline y cada parte aporta su tween, ya creado, en una posición exacta. El orden en que arrancan las partes deja de importar: el tiempo lo fija la posición. [P] [E]

```js
const conjunto = gsap.timeline({ paused: true });

function aportar(animacion, indice) {
  conjunto.add(animacion, indice * 0.1);
}

aportar(gsap.to(".parte-b", { x: 80, duration: 0.1 }), 1);   // llega primero
aportar(gsap.to(".parte-a", { x: 80, duration: 0.1 }), 0);

conjunto.progress(0.5);
const mitad = [gsap.getProperty(".parte-a", "x"), gsap.getProperty(".parte-b", "x")];
conjunto.play();
await new Promise((r) => setTimeout(r, 350));
// prueba: conjunto.duration() === 0.2
// prueba: mitad[0] === 80 && mitad[1] === 0
// prueba: gsap.getProperty(".parte-b", "x") === 80
```

## Trampas

- **Devuelve siempre la timeline.** Una función sin `return` hace que `add(undefined)` no haga nada, y la escena corre sola en la timeline global. [C]
- **No añadas la timeline hija dos veces.** Un animado solo tiene un padre. `add()` lo saca del anterior y lo mueve; no se clona. Una timeline no se puede añadir a sí misma: se ignora. [C]
- **`paused: true` en una hija la congela dentro de la maestra.** El cabezal de la maestra pasa de largo y la hija no avanza, incluso con `maestra.progress(1)`. No pauses las hijas; pausa la maestra. [E]

```js
const a = { x: 0 };
const b = { x: 0 };
const principal = gsap.timeline({ paused: true });
const congelada = gsap.timeline({ paused: true });
congelada.to(a, { x: 10, duration: 1 });
principal.add(congelada).to(b, { x: 10, duration: 1 });
principal.progress(1);

// prueba: a.x !== 10
// prueba: b.x === 10
// prueba: congelada.progress() === 0
```

- **`defaults` no llega a las hijas creadas aparte.** Una hija construida en su función hereda en el momento de crear sus tweens, y entonces aún no tiene padre. Para heredar, pasa `parent` al crearla o comparte un objeto de defaults. [E]

```js
const madre = gsap.timeline({ defaults: { duration: 3 }, paused: true });

const suelta = gsap.timeline();
suelta.to({ a: 0 }, { a: 1 });
madre.add(suelta);

const conPadre = gsap.timeline({ parent: madre });
conPadre.to({ b: 0 }, { b: 1 });

// prueba: suelta.getChildren()[0].duration() === 0.5
// prueba: conPadre.getChildren()[0].duration() === 3
```

- **Las hijas con ScrollTrigger no se anidan.** Una timeline o un tween con `scrollTrigger` dentro de otra timeline enfrenta dos controladores del mismo cabezal: pon el `scrollTrigger` solo en la maestra. Ver [errores de ScrollTrigger](../13-calidad/cal-st-errores.md). [O]
- **`from()` dentro de una hija se pinta al crear la función**, no cuando la maestra llega. Es lo esperado para ocultar antes de animar, pero sorprende al reutilizar. Ver [immediateRender](../02-nucleo/nuc-immediate-render.md). [O]
- **`onComplete` de una hija** se dispara cuando el cabezal de la maestra la cruza, también al volver a pasar tras `restart()`. No lo uses como inicialización de una sola vez. [P]
