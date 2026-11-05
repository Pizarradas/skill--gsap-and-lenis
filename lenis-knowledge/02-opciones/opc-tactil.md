---
id: opc-tactil
titulo: Toque, syncTouch e iOS
capa: 02-opciones
tipo: concepto
ambito: core
resumen: Las dos rutas de toque, inercia de syncTouch, parada al tocar y selección en iOS. Separa lo ejecutado con toque() de lo que exige un dispositivo real.
api: [LenisOptions.syncTouch, LenisOptions.syncTouchLerp, LenisOptions.touchInertiaExponent, LenisOptions.touchMultiplier, Lenis.isTouching, Lenis.isIos, Lenis.velocity]
requiere: [fun-modelo]
relacionadas: [opc-gestos, opc-filtros, opc-suavizado, com-infinito, cal-limitaciones]
etiquetas: [toque, syncTouch, ios, movil, inercia]
fuentes:
  - README.md
estado: revisar
version: 1.3.27
---
# Toque, `syncTouch` e iOS

Por defecto Lenis **no suaviza el toque**: el dedo mueve la página de forma nativa y Lenis solo lee la posición. `syncTouch: true` cambia de ruta: cancela el gesto y lo reproduce él, con una inercia propia. [C] [E]

Esta ficha queda en `estado: revisar` porque la parte de iOS no se ha probado en un dispositivo.

## Modelo mental

| Evento | `syncTouch: false` | `syncTouch: true` |
|---|---|---|
| `touchstart` | `isTouching = true`; nada más | Además, **detiene** la animación en curso si no está parada ni bloqueada |
| `touchmove` | `isScrolling = 'native'`, detiene `Animate`, sin `preventDefault` | `preventDefault`; `scrollTo(target + delta, { lerp: 1 })` |
| `touchend` | `isTouching = false`, sigue en `'native'` | Inercia: delta = `signo(último delta) · |velocity| ^ touchInertiaExponent`, con `syncTouchLerp` |
| Con `stop()` o `lock` | `preventDefault` si el evento es cancelable | Igual |

Solo `lerp` interviene en esta ruta: `duration` y `easing` de la instancia se ignoran. [C] Y `lerp: 1` no es seguimiento perfecto: avanza un 63 % por fotograma a 60 Hz, ver [`opc-suavizado`](opc-suavizado.md). [C]

La inercia depende de `velocity` en el instante de levantar el dedo, no de la fuerza del gesto. Si paras el dedo antes de soltar, la animación alcanza al dedo, `velocity` cae y casi no hay inercia. (laboratorio)

`syncTouch` también es requisito de [`infinite`](../04-comportamiento/com-infinito.md) en toque: el scroll nativo no puede dar la vuelta. [O] [C]

## Qué se ha verificado y cómo

| Comprobación | Método | Resultado |
|---|---|---|
| Rutas, deltas, `preventDefault`, inercia, parada al tocar | `toque()` en el arnés | [E], bloques de abajo |
| Rama de selección de iOS | `toque()` con `isIos` y selección **simulados** | [E] de la lógica, no de iOS |
| Scroll nativo real con dedo, `syncTouch` real | Chrome 156 con emulación táctil y `Input.dispatchTouchEvent`, 2026-11-05 | Laboratorio: ambas rutas se mueven |
| `touchmove` no cancelable | Laboratorio | Tras el primer movimiento nativo, `cancelable` pasa a `false`: por eso Lenis lo comprueba |
| `touchcancel` | Laboratorio | **`isTouching` queda en `true`**: no hay listener |
| iOS Safari real, tiradores de selección reales, barra de direcciones, rebote, iOS < 16, Android real | **Sin verificar** | Requiere dispositivo |
| Sensación de la inercia frente a la nativa | **Sin verificar** | Requiere una persona con un dispositivo |

Además, el README advierte de conducta inesperada de `syncTouch` en iOS < 16: no se ha podido contrastar. [O]

## Ejemplo

Ruta por defecto. `toque()` emite eventos reales, pero sintéticos: no mueven la página.

```js
const lenis = new Lenis();
const prevenidos = [];
addEventListener("touchmove", (e) => prevenidos.push(e.defaultPrevented));

toque("touchstart", 100, 300);
const tocando = lenis.isTouching;
toque("touchmove", 100, 200);
const estado = lenis.isScrolling;
const destino = lenis.targetScroll;
toque("touchend", 100, 200);
const alSoltar = lenis.isTouching;
lenis.destroy();
// prueba: tocando === true && estado === "native" && destino === 0
// prueba: prevenidos[0] === false && alSoltar === false
```

Ruta sincronizada, con `touchMultiplier` e inercia:

```js
const lenis = new Lenis({ syncTouch: true, touchMultiplier: 2, syncTouchLerp: 0.2 });
const prevenidos = [];
addEventListener("touchmove", (e) => prevenidos.push(e.defaultPrevented));

toque("touchstart", 100, 300);
toque("touchmove", 100, 260); // 40 px de dedo, 80 de scroll
const destino = lenis.targetScroll;

let t = 1000;
lenis.raf(t);
lenis.raf((t += 16));
lenis.raf((t += 16));
const velocidad = lenis.velocity;
const antes = lenis.targetScroll;
toque("touchend", 100, 260);
const inercia = lenis.targetScroll - antes;
lenis.destroy();
// prueba: destino === 80 && prevenidos[0] === true
// prueba: Math.abs(inercia - Math.abs(velocidad) ** 1.7) < 0.001
```

Tocar durante una animación la detiene, solo con `syncTouch`:

```js
const simula = (syncTouch) => {
  const lenis = new Lenis({ syncTouch });
  lenis.scrollTo(0, { immediate: true });
  lenis.scrollTo(1000);
  lenis.raf(1000);
  lenis.raf(1016);
  toque("touchstart", 100, 100);
  const estado = lenis.isScrolling;
  lenis.destroy();
  return estado;
};
const conSync = simula(true);
const sinSync = simula(false);
// prueba: conSync === false && sinSync === "smooth"
```

Lógica de los tiradores de selección de iOS, con plataforma y selección simuladas:

```js
const lenis = new Lenis({ syncTouch: true });
lenis.isIos = true;
window.getSelection = () => ({
  isCollapsed: false,
  rangeCount: 1,
  getRangeAt: () => ({ getClientRects: () => [{ left: 100, top: 300, right: 150, bottom: 320 }] }),
});

toque("touchstart", 105, 305); // a menos de 40 px del extremo: agarra el tirador
toque("touchmove", 105, 205);
const sobreTirador = lenis.targetScroll;
toque("touchend", 105, 205);

toque("touchstart", 500, 500); // lejos: scroll normal
toque("touchmove", 500, 400);
const lejos = lenis.targetScroll;
lenis.destroy();
// prueba: sobreTirador === 0 && lejos === 100
```

## Trampas

- **Activar `syncTouch` para "que se vea igual en móvil".** Sustituyes la inercia del sistema por una imitación. Actívalo solo si necesitas sincronía real o `infinite`. [P]
- **`isTouching` puede quedarse en `true`.** Un `touchcancel` (notificación, gesto del sistema) no lo limpia hasta el siguiente toque. No bases estado crítico en él. [C] (laboratorio)
- **`isIos` solo mira `navigator.userAgent`.** Busca `iPad|iPhone|iPod`. Un iPad que se presenta como Mac da `false`, y la protección de selección no actúa. [C]
- **`data-lenis-prevent-touch` no impide el gesto nativo.** Lo devuelve al navegador. Ver [`opc-filtros`](opc-filtros.md). [C]
- **Con `lock` o `stop()`, un `touchmove` no cancelable no se puede frenar.** Lenis solo llama a `preventDefault` si `event.cancelable`. El bloqueo lo aporta `overflow: clip`, en el caso de `stop()`; `lock` no tiene CSS. [C]
- **La inercia ignora `lerp`.** Para cambiarla, usa `syncTouchLerp` y `touchInertiaExponent`. [C]
