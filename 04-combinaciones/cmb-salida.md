---
id: cmb-salida
titulo: Salir y reentrar con GSAP y Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [lenis, gsap+lenis]
resumen: El orden entre ctx.revert y lenis.destroy da igual. Lo que rompe es no quitar paso del ticker, porque la página sigue moviéndose, y crear dos instancias sobre la misma raíz.
relacionadas: [orq-propiedad, cmb-reloj, cmb-medidas]
fuentes:
  - gsap:nuc-context
  - gsap:nuc-limpieza
  - lenis:int-contrato
  - lab:conflictos-lab/i-salida.out
  - lab:conflictos-lab/i-estado.out
  - lab:conflictos-lab/m-extra.out
  - lab:conflictos-lab/z-ff.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Salir y reentrar

**Veredicto:** el orden `ctx.revert()` y `lenis.destroy()` es libre. Es obligatorio retirar `paso` del ticker (O22) y no duplicar la instancia (O02). Orden de esta capa, por ser uno: `ctx.revert()`, `gsap.ticker.remove(paso)`, `lenis.destroy()`.

Alcance: ventana y contenedor, en plena inercia, antes del pin, dentro del pin y al fondo, tres ciclos seguidos, Chrome; ventana en Firefox. [E]

| Orden | Fuera del pin | Dentro del pin | Fondo, página que encoge | Reentrada, rueda de 500 |
|---|---|---|---|---|
| `ctx`, `destroy`, `ticker` | Bien | 3146 | 7949 → 7149 | 500 |
| `destroy`, `ctx`, `ticker` | Bien | 3146 | 7949 → 7149 | 500 |
| `ticker`, `destroy`, `ctx` | Bien | | | 500 |
| `ticker`, `ctx`, `destroy` | Bien | | | 500 |
| **Sin quitar `paso`** | **Sigue moviéndose: 1656 → 2176** | | | **7094** |

"Bien" es: 0 instancias, 0 espaciadores, sin clases y sin estilos. Encoger recorta el scroll igual en los dos órdenes.

Cada ciclo sin quitar `paso` añade un oyente: 2, y 4 al tercer ciclo. Una instancia destruida sigue atendiendo `raf`: de 1009 a 1998.

## Ejemplo

```js
const entrar = () => {
  const lenis = new Lenis();
  const paso = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(paso);
  lenis.on("scroll", ScrollTrigger.update);
  const sincronizar = () => lenis.resize();
  ScrollTrigger.addEventListener("refresh", sincronizar);
  const ctx = gsap.context(() => {
    gsap.to(".caja", { x: 100, scrollTrigger: { trigger: ".caja", scrub: true } });
  });
  return () => {
    ctx.revert();
    ScrollTrigger.removeEventListener("refresh", sincronizar);
    gsap.ticker.remove(paso);
    lenis.destroy();
  };
};

for (let i = 0; i < 3; i++) {
  const salir = entrar();
  await espera(30);
  rueda(800);
  await espera(120);
  salir();
  const y = window.scrollY;
  await espera(150);
  if (window.scrollY !== y) throw new Error("sigue moviéndose");
  window.scrollTo(0, 0);
}
// prueba: ScrollTrigger.getAll().length === 0
// prueba: !document.documentElement.classList.contains("lenis")
```

## Contraejemplo: `paso` en el ticker

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
await espera(30);
rueda(1500);
await espera(120);
const antes = window.scrollY;
lenis.destroy();
await espera(500);
const despues = window.scrollY;
gsap.ticker.remove(paso);
window.scrollTo(0, 0);
// prueba: despues > antes + 50
```

## Contraejemplo: dos instancias sobre la misma raíz

Sin colisión a la vista, 500 con una rueda de 500. Se ve al coordinar: `stop()` en una no detiene a la otra, y el modal deja pasar el scroll.

```js
const a = new Lenis({ autoRaf: true });
const b = new Lenis({ autoRaf: true });
await espera(30);
a.stop();
rueda(400);
await espera(1200);
const y = Math.round(window.scrollY);
a.destroy();
b.destroy();
window.scrollTo(0, 0);
// prueba: y === 400
```

## Trampas

- `gsap.ticker.add` dentro de un `gsap.context` no se graba: `ctx.revert()` no lo quita.
- `lagSmoothing(0)` sobrevive a la salida: ver [`cmb-reloj`](cmb-reloj.md).
- La reentrada sin salir deja 6 ScrollTrigger en lugar de 3.
