---
id: cmb-medidas
titulo: ScrollTrigger.refresh y lenis.resize
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis]
resumen: refresh primero y resize después, porque refresh cambia el alto de los pines. Lo seguro es colgar lenis.resize del evento refresh. En plena inercia ninguno de los dos corta nada.
relacionadas: [orq-propiedad, cmb-pin, cmb-flip-split]
fuentes:
  - gsap:scr-refresh
  - lenis:com-dimensiones
  - lenis:int-gsap
  - lab:conflictos-lab/g-medida.out
  - lab:conflictos-lab/e-pin.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# `ScrollTrigger.refresh` y `lenis.resize`

**Veredicto:** compatible con condición de orden (O18). Una sola orden, `ScrollTrigger.refresh()`, y Lenis colgado de su evento:

```js fragmento
ScrollTrigger.addEventListener("refresh", () => lenis.resize());
```

Alcance: ventana y contenedor, `lerp` y `duration`, rueda real, Chrome.

## Ejemplo

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const sincronizar = () => lenis.resize();
ScrollTrigger.addEventListener("refresh", sincronizar);

document.body.insertAdjacentHTML("afterbegin", '<div style="height:200px"></div><div id="p" style="height:200px"></div>');
let tramo = 500;
const st = ScrollTrigger.create({ trigger: "#p", pin: true, start: "top top", end: () => "+=" + tramo });
await espera(60);

tramo = 4000;
ScrollTrigger.refresh();
const limite = lenis.limit;
const real = document.documentElement.scrollHeight - window.innerHeight;

ScrollTrigger.removeEventListener("refresh", sincronizar);
gsap.ticker.remove(paso);
lenis.destroy();
st.kill();
// prueba: limite === real
```

## Contraejemplo: orden inverso

`resize` antes de `refresh` deja a Lenis con el alto viejo, porque es `refresh` quien cambia el espaciador. Medido: `limit` 8300 frente a 12300, y `scrollTo("bottom")` se queda en 8300 hasta 250 ms después.

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
document.body.insertAdjacentHTML("afterbegin", '<div style="height:200px"></div><div id="p" style="height:200px"></div>');
let tramo = 500;
const st = ScrollTrigger.create({ trigger: "#p", pin: true, start: "top top", end: () => "+=" + tramo });
await espera(60);
lenis.resize();

tramo = 4000;
lenis.resize();
ScrollTrigger.refresh();
const limite = lenis.limit;
const real = document.documentElement.scrollHeight - window.innerHeight;

gsap.ticker.remove(paso);
lenis.destroy();
st.kill();
// prueba: limite < real
```

| Cambio | `resize` y luego `refresh` | `refresh` y luego `resize` | Evento |
|---|---|---|---|
| Crece el contenido | Bien | Bien | Bien |
| Crece el pin | **Límite viejo** | Bien | Bien |
| Sin ninguno | `limit` y `start` viejos: 8100 de 9300 | | |

El caso general es `refresh` primero: cubre ambos.

## `refresh()` en plena inercia

La base GSAP pone el scroll a 0 durante `refresh`, y se temía que Lenis lo viera. No lo ve: es síncrono, tarda 2-4 ms y se restaura antes de que llegue ningún evento. Rueda de 1500, con `refresh` a los 200 ms, en todos los cruces de ventana, contenedor, `lerp`, `duration` y orden de las llamadas: destino 1500, 0 lecturas en cero en el evento `scroll` nativo, 0 retrocesos en el de Lenis. `lenis.resize()` tampoco corta la inercia. `refresh(true)` espera a que pare.

El evento no crea bucle: una llamada por `refresh`. Tampoco redimensionar la ventana en plena inercia desvió el destino.

## Quién avisa a quién

- El `ResizeObserver` de Lenis ve el cambio de alto con 250 ms de retraso; ScrollTrigger, no lo ve: hace falta `refresh()`.
- Un cambio de contenido sin `refresh`: `limit` se corrige solo y `start` no.
- Recargar en mitad de la página con pin dio 2400 en lugar de 4000 **con y sin Lenis**: no es de la combinación.

## Trampas

- `ScrollTrigger.killAll()` borra los oyentes, incluido este, salvo `killAll(true)`.
- Retira el oyente al salir: ver [`cmb-salida`](cmb-salida.md).
- Tras una animación de layout, `refresh` va en `onComplete`: ver [`cmb-flip-split`](cmb-flip-split.md).
