---
id: rec-transicion-flip
titulo: Filtrar y reordenar con Flip
capa: 14-recetas
tipo: patron
ambito: Flip
resumen: Anima cambios de disposición de flex o grid guardando el estado, aplicando el cambio y dejando a Flip animar la diferencia.
api: [Flip.getState, Flip.from, Flip.killFlipsOf, Flip.isFlipping]
requiere: [int-flip]
relacionadas: [int-flip-api, int-flip-batch, rec-helpers, cal-accesibilidad, nuc-context]
etiquetas: [layout, filtro, interaccion, plantilla]
fuentes:
  - docs/v3/Plugins/Flip.md
  - docs/v3/Plugins/Flip/static.from().md
  - docs/v3/Plugins/Flip/static.getState().md
  - docs/v3/Plugins/Flip/static.killFlipsOf().md
estado: verificado
version: 3.15.1
---
# Filtrar y reordenar con Flip

Filtra una rejilla o reordena una lista y deja que cada elemento vuele a su sitio nuevo. Plantilla: `plantillas/transicionFlip.js`. [E]

## Problema

El navegador coloca los elementos al instante cuando cambian clases u orden, y `flex` o `grid` no son interpolables: no hay valor que animar. Calcular a mano las diferencias obliga a medir antes y después de cada cambio.

## Solución

Tres pasos fijos: `Flip.getState()` antes del cambio, el cambio en el DOM, `Flip.from()` después. `absolute: true` evita que los elementos en vuelo se empujen entre sí en flex y grid [O]. `onEnter` y `onLeave` reciben lo que aparece o desaparece con `display: none`; un `onLeave` visible exige `absolute: true`. [O] [E]

```html
<style>.fuera{display:none}</style>
<div style="display:flex;flex-wrap:wrap;width:300px">
  <div class="carta" style="width:100px;height:50px">1</div>
  <div class="carta par" style="width:100px;height:50px">2</div>
  <div class="carta" style="width:100px;height:50px">3</div>
</div>
```

```js
const cartas = gsap.utils.toArray(".carta");
await new Promise((r) => setTimeout(r, 30));
const izquierda = cartas[2].getBoundingClientRect().left;

const estado = Flip.getState(".carta");
document.querySelector(".par").classList.add("fuera");
const vuelo = Flip.from(estado, {
  targets: ".carta",
  duration: 0.15,
  ease: "power2.inOut",
  absolute: true,
  onLeave: (salen) => gsap.to(salen, { opacity: 0, duration: 0.15 }),
});
await new Promise((r) => setTimeout(r, 60));
const enVuelo = Flip.isFlipping(cartas[2]);
await new Promise((r) => setTimeout(r, 200));
const final = cartas[2].getBoundingClientRect().left;
// prueba: enVuelo === true
// prueba: final === izquierda - 100
// prueba: cartas[2].style.position === "" && !Flip.isFlipping(cartas[2])
```

## Parámetros ajustables

| Opción | Por defecto | Efecto |
|---|---|---|
| `cambio` | obligatoria | Función que altera clases u orden. Puede devolver una promesa |
| `disparador` / `evento` | — / `"click"` | Quién lanza el cambio |
| `duracion` / `ease` | `0.5` / `"power2.inOut"` | Vuelo |
| `stagger` | `0` | Separación entre elementos |
| `absolute` | `true` | Ponlo en `false` si el contenedor no es flex ni grid y te importa el flujo |
| `escala` | `false` | Usa `scale` en vez de `width` y `height`: más rápido, pero deforma el contenido |

Además de limpiar, la función devuelta lleva `.ejecutar()` para lanzar el cambio por código. El objetivo admite una función, `() => lista.children`, que se resuelve antes y después del cambio: acota a una raíz y recoge los elementos nuevos. Un selector también se resuelve cada vez, pero busca en todo el documento; un array no incorpora lo que aparezca. [E]

## Cambio diferido

Si el DOM cambia después de tu código (datos remotos, un render que se aplica más tarde), `getState()` sigue yendo antes y `Flip.from()` debe esperar al cambio. Con la plantilla basta con que `cambio` devuelva una promesa. Durante la espera pueden pasar dos cosas: que limpies o que llegue otro cambio. El turno descarta el vuelo obsoleto. [E]

```html
<div class="pila" style="display:flex;width:200px">
  <div class="baldosa" data-flip-id="a" style="width:100px;height:40px">A</div>
  <div class="baldosa" data-flip-id="b" style="width:100px;height:40px">B</div>
</div>
```

```js
const pila = document.querySelector(".pila");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const pintar = (orden) => {
  pila.innerHTML = orden
    .map((id) => `<div class="baldosa" data-flip-id="${id}" style="width:100px;height:40px">${id}</div>`)
    .join("");
};
let turno = 0;

async function actualizar(orden) {
  const propio = ++turno;
  const estado = Flip.getState(pila.children);
  await espera(40); // la respuesta o el render diferido
  pintar(orden);
  if (propio === turno) Flip.from(estado, { targets: pila.children, duration: 0.15, absolute: true });
}

await espera(30);
await actualizar(["b", "a"]);
await espera(40);
const vuela = Flip.isFlipping(pila.querySelector('[data-flip-id="a"]'));
await espera(200);
const izquierda = pila.getBoundingClientRect().left;
const llega = pila.querySelector('[data-flip-id="a"]').getBoundingClientRect().left === izquierda + 100;

const antes = turno;
const pendiente = actualizar(["a", "b"]);
turno++; // lo que haría la limpieza durante la espera
await pendiente;
await espera(30);
const descartado = !Flip.isFlipping(pila.querySelector('[data-flip-id="a"]'));
// prueba: vuela === true
// prueba: llega === true
// prueba: descartado === true && turno === antes + 2
```

## Variante con prefers-reduced-motion

Se aplica `cambio()` y nada más, sin `getState` ni vuelo: el resultado es idéntico y sin movimiento. El estado de la interfaz nunca depende de la animación. [P] [E]

```js
window.matchMedia = (q) => ({ matches: /: reduce\)/.test(q), addListener() {}, removeListener() {} });
const caja = document.querySelector(".caja");
let aplicar;
const mm = gsap.matchMedia();
mm.add({ normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" }, (c) => {
  aplicar = (cambio) => {
    if (c.conditions.reducido) return cambio();
    const estado = Flip.getState(caja);
    cambio();
    Flip.from(estado, { duration: 0.3 });
  };
});
aplicar(() => caja.classList.add("movida"));
// prueba: caja.classList.contains("movida") && !Flip.isFlipping(caja)
```

## Limpieza

`limpiar()` quita los listeners y termina los vuelos con `Flip.killFlipsOf()`, que deja los elementos sin estilos en línea. **No deshace `cambio`**: el estado final de la interfaz es tuyo. [E]

```js fragmento
const limpiar = transicionFlip(() => lista.children, { disparador: raiz.querySelector(".ordenar"), cambio: invertirLista });
limpiar.ejecutar();
limpiar();
```

## Trampas

- **El render sustituye los nodos.** Flip no reconoce un nodo nuevo como el anterior, salvo que ambos lleven el mismo `data-flip-id`. Sin él, no hay vuelo: los nuevos cuentan como entradas. [E]
- **Devolver el vuelo desde una promesa.** Un timeline es *thenable*: la promesa lo adopta y espera a su final, y si se mata a medias no se cumple nunca. Por eso, con `cambio` asíncrono, `.ejecutar()` se cumple al empezar el vuelo, y no al acabar. [E]
- **`cambio` rechazado.** No hay vuelo, y el rechazo llega a quien llamó a `.ejecutar()`. Con `disparador` nadie lo recoge: captura el error dentro de `cambio`. [E] [P]
- **`Flip.from` dentro de contextos anidados.** Un `revert()` plano termina el vuelo y deja el `style` limpio [E]. Pero si Flip corre dentro de `matchMedia` y este dentro de `gsap.context`, el contexto exterior revierte los tweens hijos uno a uno y el elemento queda con `position: absolute`, `transform` y demás. La plantilla crea el vuelo fuera del contexto y lo cierra con `killFlipsOf()`. [E]
- **Medir tras cambiar.** `getState()` debe ir antes del cambio. Después, no hay diferencia que animar. [O]
- **Lista de `targets` con elementos nuevos.** Sin `targets`, Flip usa los del estado: los elementos que aparecen no entran en la animación ni disparan `onEnter`. [O]
- **Interrumpir un vuelo.** Por defecto, `getState()` fuerza a terminar los vuelos en curso, lo que produce un salto si se pulsa rápido. Puedes pasar `kill: false` y usar `killFlipsOf()` justo antes del cambio. [O]
- **Elementos anidados en los objetivos.** Un padre y su hijo en la misma lista exigen `nested: true`. [O]
- **`scale: true` con `border-radius` o texto.** Deforma durante el vuelo. Usa el modo por defecto, salvo que haya muchos elementos. [P]
- **`transition` en CSS sobre `transform`, `top` o `left`.** Se suma a Flip y produce arrastres. Desactívala en los elementos animados. [P]
- **Lectores de pantalla.** Filtrar cambia el contenido sin aviso: anuncia el recuento en una región `aria-live`. Es independiente de GSAP. [P]
