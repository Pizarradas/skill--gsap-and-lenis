---
id: cmb-snap
titulo: Ajuste a secciones con Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [lenis, gsap+lenis]
resumen: lenis/snap es el dueño. El snap de ScrollTrigger cambia de destino según lerp o duration sin delay propio, los dos juntos pelean, CSS mandatory pierde la animación.
relacionadas: [orq-propiedad, cmb-pin, cmb-css]
fuentes:
  - gsap:scr-snap
  - lenis:snp-snap
  - lenis:snp-elementos
  - lenis:rec-secciones-snap
  - lab:conflictos-lab/f-prog.out
  - lab:conflictos-lab/l-extra.out
  - lab:conflictos-lab/z-ff.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Ajuste a secciones con Lenis

**Veredicto:** `lenis/snap` es el dueño. `ScrollTrigger` con `snap` es compatible con condición (O09). Los dos a la vez y CSS `scroll-snap-type: mandatory` están prohibidos (O10, O11).

Alcance: ventana y contenedor, `lerp` y `duration`, rueda real de 620 sobre puntos cada 500, tres repeticiones por caso, Chrome; Firefox en ventana con `lerp`. [E]

| Ajuste | `lerp` | `duration: 1.2` | Tiempo |
|---|---|---|---|
| `lenis/snap` | 1000 | 1000 | 1,6 s |
| `snap: { snapTo: 0.25 }` | 1000 | **500, retrocede** | 2,8-3,0 s |
| Con `delay: 0.3` y `duration: { min: 0.2, max: 0.6 }` | 1000 | 1000 | 1,9 s |
| Los dos a la vez | 1500 | 1000, retrocede | 3,2-3,5 s |
| ScrollTrigger sin Lenis, referencia | 1000 | | 2,0 s |

Por defecto el `delay` del `snap` es corto y salta durante la cola de la animación de Lenis; el resultado depende de cómo frene. [P] Con `delay` igual o mayor que 0.3 deja de depender.

## Ejemplo

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const st = ScrollTrigger.create({ start: 0, end: 2000 });
const snap = new Snap(lenis, { type: "mandatory", debounce: 100 });
[0, 500, 1000, 1500, 2000].forEach((v) => snap.add(v));
await espera(40);

rueda(320);
await espera(1800);
const y = Math.round(window.scrollY);
const avance = st.progress;

snap.destroy();
gsap.ticker.remove(paso);
lenis.destroy();
st.kill();
window.scrollTo(0, 0);
// prueba: y === 500 || y === 1000
// prueba: Math.abs(avance - y / 2000) < 0.01
```

## Contraejemplo: el mismo gesto, otro destino

```js
const medir = async (opciones) => {
  const lenis = new Lenis(opciones);
  const paso = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(paso);
  lenis.on("scroll", ScrollTrigger.update);
  const st = ScrollTrigger.create({ start: 0, end: 2000, snap: { snapTo: 0.25, delay: 0.3, duration: { min: 0.1, max: 0.3 } } });
  await espera(600);
  rueda(620);
  await espera(2600);
  const y = Math.round(window.scrollY);
  gsap.ticker.remove(paso);
  lenis.destroy();
  st.kill();
  window.scrollTo(0, 0);
  await espera(600);
  return y;
};
const conLerp = await medir({});
const conDuracion = await medir({ duration: 1.2 });
// prueba: conLerp === conDuracion
// prueba: conLerp % 500 === 0
```

El bloque prueba la condición, `delay: 0.3`. La rama que falla, `delay` por defecto y `duration`, es la tabla de arriba: en el arnés, con su tiempo virtual, no es estable.

## CSS `scroll-snap` (O11)

`mandatory` con Lenis, en la raíz: 5 pasos, un salto sin animación, frente a 55. Un carrusel interior con `data-lenis-prevent` no se midió: fuera de `html`, `body` o `:root`, el auditor da aviso. `proximity` no alteró la animación: 43 pasos y 500, igual que nativo sin ajustar por ser un punto lejano. Se quita `scroll-snap-type` y se usa `lenis/snap`. Según `gsap:scr-scrollto`, `ScrollToPlugin` desactiva el ajuste en un elemento objetivo, pero no con `window`.

## Con `pin` (O19)

`Snap.addElement` mide el rectángulo. Un elemento fijado está en `top: 0`, así que su punto es la posición actual y el ajuste se atasca: desde 1700 con rueda de 300 quedó en 1700 con progreso 0,06, y creado dentro del pin, clavado en 2400. Con posiciones calculadas por ScrollTrigger, llegó a 2400.

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
document.body.insertAdjacentHTML("afterbegin", '<div style="height:400px"></div><div id="p" style="height:300px"></div>');
const st = ScrollTrigger.create({ trigger: "#p", pin: true, start: "top top", end: "+=1000" });
lenis.resize();
const snap = new Snap(lenis, { type: "mandatory", debounce: 100 });
[0, st.start, st.start + 500, st.end].forEach((v) => snap.add(v));
const puntos = snap.snaps.size;
snap.destroy();
gsap.ticker.remove(paso);
lenis.destroy();
st.kill();
// prueba: puntos === 4
```

Si el ajuste debe recorrer un tramo fijado, añade `st.start`, los pasos intermedios y `st.end`, y recalcúlalos en el evento `refresh`.

## Trampas

- Una rueda de 2000 predice 4000: Snap cuenta dos veces el último delta, y salta el pin entero. Es un fallo de `lenis/snap`, ver `lenis:snp-snap`.
- El `snap` de ScrollTrigger usa progreso; el de Lenis, píxeles. No copies valores entre ellos.
- Con movimiento reducido, `lenis/snap` salta de golpe: `snap.stop()`, ver [`cmb-reducido`](cmb-reducido.md).
