---
id: cmb-anclas
titulo: Anclas con pines y Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [ninguno, gsap, gsap-smoother, lenis, gsap+lenis]
resumen: anchors de Lenis llega bien con pines por encima, también en plena inercia. Un ancla al elemento fijado no va a start: apunta al espaciador o usa st.start.
relacionadas: [orq-propiedad, cmb-pin, cmb-scroll-programatico]
fuentes:
  - lenis:com-anclas
  - lenis:api-scrollto
  - gsap:scr-scrollto
  - lab:conflictos-lab/f-prog.out
  - lab:conflictos-lab/l-extra.out
  - lab:orquestador-lab/e22.txt
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Anclas con pines y Lenis

**Veredicto:** `anchors: true` es el dueño. Compatible; con condición si el ancla apunta a un elemento fijado (O29).

Alcance: ventana y contenedor, `lerp`, en reposo y en plena inercia, Chrome. [E]

`plantillas/orquestador.js` activa `anchors` en `lenis` y `gsap+lenis`, salvo `opciones.lenis.anchors: false`. Con `gsap-smoother`, y con `gsap` si hay `ScrollToPlugin`, intercepta los enlaces `#id` de la página y los pasa por `irA`. Sin `ScrollToPlugin`, el ancla es del navegador.

| Destino | Resultado |
|---|---|
| Sección bajo un pin, en reposo | Llega: `top` 0 |
| Sección bajo un pin, en plena inercia | Llega: `top` 0 |
| Elemento con `y: 300` | Llega a donde se ve, 4300, no a su sitio en el flujo |
| Elemento fijado, desde dentro del pin | **No se mueve**: 2400, progreso 0,5 |
| Elemento fijado, desde abajo | **Va al final del pin**: 3200, no 1600 |
| Espaciador del pin | 1600, desde dentro y desde abajo |

La medida es el rectángulo del elemento, que ya está en `fixed` o trasladado. `scrollIntoView` da lo mismo en el perfil `gsap` (3200): no es de Lenis, pero la solución sí cambia de vía.

## Ejemplo

```html
<div style="height:500px"></div><div id="fijado" style="height:200px"></div><div style="height:1500px"></div>
```

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const st = ScrollTrigger.create({ trigger: "#fijado", pin: true, start: "top top", end: "+=800" });
lenis.resize();
await espera(40);

lenis.scrollTo(st.end + 300, { immediate: true });
await espera(60);
lenis.scrollTo(document.querySelector("#fijado").parentNode, { duration: 0.2 });
await espera(600);
const y = Math.round(window.scrollY);
const inicio = st.start;

gsap.ticker.remove(paso);
lenis.destroy();
st.kill();
window.scrollTo(0, 0);
// prueba: y === inicio
```

## Contraejemplo

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
const st = ScrollTrigger.create({ trigger: "#fijado", pin: true, start: "top top", end: "+=800" });
lenis.resize();
await espera(40);

lenis.scrollTo(st.start + 300, { immediate: true });
await espera(60);
lenis.scrollTo("#fijado", { duration: 0.2 });
await espera(600);
const y = Math.round(window.scrollY);
const inicio = st.start;

gsap.ticker.remove(paso);
lenis.destroy();
st.kill();
window.scrollTo(0, 0);
// prueba: y === inicio + 300
```

Para un enlace `href="#x"`, pon el `id` en un elemento que no se fije, justo antes del pin, o intercepta y usa `lenis.scrollTo(st.start)`.

## Trampas

- **Interceptar un ancla con `preventDefault` pierde el foco.** Sin más, el siguiente Tab vuelve junto al enlace y la página regresa arriba: de 3041 a 0, en Chrome y Firefox, con `gsap` y ScrollToPlugin y con `gsap-smoother`. `anchors` de Lenis no intercepta y no lo sufre. Enfoca el destino con `{ preventScroll: true }` y `tabindex="-1"` si no es enfocable; `mov` ya lo hace. [E]
- **Con ScrollSmoother, `preventScroll` no basta.** Recoloca en `focusin` y el viaje animado se pierde: 1519 px a los 120 ms. Evítalo con `onFocusIn` devolviendo `false` durante ese enfoque; `mov` ya lo hace. [E]
- `anchors` solo escucha dentro de `wrapper`.
- Un ancla nativa con ScrollSmoother desplaza el `wrapper`: 3040 con `smoother.scrollTop()` en 0, y una rueda de 100 deja `scrollY` en 100. Laboratorio `e16`, sin la intercepción. [E]
- Un `ScrollToPlugin` por ancla, que es la receta de `gsap:scr-scrollto`, se pierde en plena inercia: [`cmb-scroll-programatico`](cmb-scroll-programatico.md).
- Destinos con `scroll-margin-top`: los respeta `anchors`, ver `lenis:com-anclas`.
