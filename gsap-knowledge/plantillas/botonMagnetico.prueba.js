const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const simular = (activo) => {
  window.matchMedia = (q) => ({ matches: activo ? /no-preference/.test(q) : /: reduce\)/.test(q), media: q, addListener() {}, removeListener() {} });
};
const cta = document.querySelector(".cta");
const evento = (tipo, x, y) => cta.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: y }));
const estiloInicial = cta.style.cssText;
const r = {};

simular(true);
const limpiar = botonMagnetico(".cta", { fuerza: 0.5, duracion: 0.1 });
evento("pointerenter", 300, 130);
evento("pointermove", 300, 150); // centro en 200,130: a 100 y 20 px
await espera(160);
r.atrae = Math.abs(gsap.getProperty(cta, "x") - 50) < 0.01 && Math.abs(gsap.getProperty(cta, "y") - 10) < 0.01;
evento("pointerenter", 300, 130); // reentrar desplazado no debe cambiar el centro
evento("pointermove", 300, 150);
await espera(160);
r.centroEstable = Math.abs(gsap.getProperty(cta, "x") - 50) < 0.01;
evento("pointerleave", 0, 0);
await espera(160);
r.vuelve = gsap.getProperty(cta, "x") === 0 && gsap.getProperty(cta, "y") === 0;
limpiar();
r.sinEstilos = cta.style.cssText === estiloInicial;
evento("pointerenter", 300, 130);
evento("pointermove", 300, 150);
await espera(30);
r.sinListeners = cta.style.cssText === estiloInicial;

simular(false);
const limpiarReducido = botonMagnetico(".cta");
evento("pointerenter", 300, 130);
evento("pointermove", 300, 150);
r.reducido = cta.style.cssText === estiloInicial;
limpiarReducido();

// Context.kill() desempata con un comparador inconsistente: el orden de revert() depende del motor.
// Se fuerzan los dos órdenes para que esto falle también en Chrome si la plantilla depende de uno.
const ordenNativo = Array.prototype.sort;
const forzarOrden = (comoV8) => {
  Array.prototype.sort = function (cmp) {
    if (!cmp) return ordenNativo.call(this);
    const salida = [];
    for (const x of this) {
      let i = salida.length;
      while (i > 0 && (comoV8 ? cmp(x, salida[i - 1]) < 0 : cmp(salida[i - 1], x) > 0)) i--;
      salida.splice(i, 0, x);
    }
    salida.forEach((x, i) => (this[i] = x));
    return this;
  };
};
const cualquierOrden = [];
simular(true);
for (const comoV8 of [true, false]) {
  forzarOrden(comoV8);
  const limpiarOrden = botonMagnetico(".cta", { fuerza: 0.5, duracion: 0.05 });
  evento("pointerenter", 300, 130);
  evento("pointermove", 300, 150);
  await espera(100);
  const movido = gsap.getProperty(cta, "x") !== 0;
  limpiarOrden();
  const limpio = cta.style.cssText === estiloInicial && gsap.getProperty(cta, "x") === 0;

  // Un transform propio del botón vuelve entero, y la siguiente llamada lo sigue leyendo.
  const girado = document.createElement("button");
  girado.style.transform = "rotate(3deg)";
  document.body.append(girado);
  const limpiarGirado = botonMagnetico(girado, { fuerza: 0.5, duracion: 0.05 });
  girado.dispatchEvent(new PointerEvent("pointerenter", { clientX: 300, clientY: 130 }));
  girado.dispatchEvent(new PointerEvent("pointermove", { clientX: 300, clientY: 150 }));
  await espera(100);
  const movidoGirado = gsap.getProperty(girado, "x") !== 0;
  limpiarGirado();
  const propio = girado.style.transform === "rotate(3deg)";
  const limpiarDeNuevo = botonMagnetico(girado);
  const rotacionViva = Math.abs(gsap.getProperty(girado, "rotation") - 3) < 0.01;
  limpiarDeNuevo();
  girado.remove();
  cualquierOrden.push(movido && limpio && movidoGirado && propio && rotacionViva);
  Array.prototype.sort = ordenNativo;
}
r.cualquierOrden = cualquierOrden.join() === "true,true";
// prueba: r.atrae
// prueba: r.centroEstable
// prueba: r.vuelve
// prueba: r.sinEstilos
// prueba: r.sinListeners
// prueba: r.reducido
// prueba: r.cualquierOrden
// prueba: ScrollTrigger.getAll().length === 0
