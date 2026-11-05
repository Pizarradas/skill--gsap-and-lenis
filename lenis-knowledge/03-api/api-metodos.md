---
id: api-metodos
titulo: Métodos de Lenis
capa: 03-api
tipo: api
ambito: core
resumen: raf, on, off, resize, stop, start y destroy: qué hace cada uno de verdad, qué efectos laterales tiene y qué deja sin limpiar.
api: [Lenis.raf, Lenis.on, Lenis.off, Lenis.resize, Lenis.stop, Lenis.start, Lenis.destroy, Lenis.scrollTo]
requiere: [fun-modelo]
relacionadas: [api-instancia, api-scrollto, api-eventos, com-raf, com-stop-start, com-dimensiones]
etiquetas: [api, metodos, destroy, raf]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Métodos de Lenis

Son siete métodos públicos. `scrollTo` tiene ficha propia: [`api-scrollto`](api-scrollto.md). [C]

## Firma

| Método | Devuelve | Qué hace |
|---|---|---|
| `raf(time)` | `void` | Avanza la animación. `time` en **milisegundos**. Es una función enlazada: se puede pasar directamente como callback |
| `scrollTo(destino, opciones?)` | `void` | Ver [`api-scrollto`](api-scrollto.md) |
| `on(evento, callback)` | Función para desuscribir | Ver [`api-eventos`](api-eventos.md) |
| `off(evento, callback)` | `void` | Quita un callback concreto |
| `resize()` | `void` | Remide, sincroniza con la posición real y emite `scroll` |
| `stop()` | `void` | Detiene: ver [`com-stop-start`](../04-comportamiento/com-stop-start.md) |
| `start()` | `void` | Reanuda |
| `destroy()` | `void` | Quita listeners, observadores, temporizador, clases y bucle `autoRaf` |

`resize()` no detiene una animación en curso, pero iguala `animatedScroll` y `targetScroll` con la posición real. `Animate` sigue hacia su destino: tras llamar a `resize()` a mitad de un `scrollTo`, el movimiento llega igual. [C] [E]

`destroy()` no restablece la posición de scroll, ni cancela una animación si tú sigues llamando a `raf` con la misma instancia. Tampoco borra `window.lenis`. [C]

## Ejemplo

```js
const lenis = new Lenis();
let llamadas = 0;
const contar = () => llamadas++;

const quitar = lenis.on("scroll", contar);
lenis.scrollTo(100, { immediate: true });
quitar();
lenis.scrollTo(300, { immediate: true });
const trasQuitar = llamadas;

lenis.on("scroll", contar);
lenis.off("scroll", contar);
lenis.scrollTo(500, { immediate: true });
const trasOff = llamadas;

lenis.scrollTo(1000);
let t = 1000;
lenis.raf(t);
for (let i = 0; i < 5; i++) lenis.raf((t += 16));
lenis.resize();
const tras = lenis.targetScroll === lenis.actualScroll;
for (let i = 0; i < 400; i++) lenis.raf((t += 16));
const final = lenis.scroll;

lenis.destroy();
const clases = document.documentElement.className;
// prueba: trasQuitar === 1 && trasOff === 1
// prueba: tras && final === 1000
// prueba: clases === ""
```

`raf` admite que se le pase como callback y requiere milisegundos: con segundos, el avance es ínfimo.

```js
const lenis = new Lenis();
lenis.scrollTo(1000);
lenis.raf(1);
for (let i = 1; i < 100; i++) lenis.raf(1 + i * 0.016); // 1,6 s... en "milisegundos"
const conSegundos = lenis.animatedScroll;
lenis.destroy();
// prueba: conSegundos < 20
```

## Trampas

- **Dos instancias sobre la misma raíz.** Ambas reciben el gesto y escriben a la vez, y `destroy()` de una borra todas las clases `lenis*` de la raíz, también las de la otra. Destruye antes de crear. [C] [E]
- **Olvidar `destroy()` al retirar la vista.** Quedan listeners en `window`, `ResizeObserver` y, con `autoRaf`, un bucle infinito. [C]
- **Seguir usando la instancia tras `destroy()`.** Los callbacks ya no se emiten y el bucle `autoRaf` se cancela. Crea otra. [C]
- **`resize()` a cada fotograma.** Emite `scroll` y lee el DOM. Úsala tras un cambio concreto. [P]
- **`off` con una función anónima.** Necesitas la misma referencia. Usa lo que devuelve `on`. [C]

```js
const a = new Lenis({ autoRaf: true });
const b = new Lenis({ autoRaf: true });
rueda(200);
const ambas = a.targetScroll === 200 && b.targetScroll === 200;
a.destroy();
const claseDeB = document.documentElement.classList.contains("lenis");
b.destroy();
// prueba: ambas && claseDeB === false
```
