const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const simular = (activo) => {
  window.matchMedia = (q) => ({ matches: activo ? /no-preference/.test(q) : /: reduce\)/.test(q), media: q, addListener() {}, removeListener() {} });
};
const mover = (x, y) => window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y }));
const punto = document.querySelector(".punto");
const estiloInicial = punto.style.cssText;
const r = {};

simular(true);
const limpiar = seguidorCursor(".punto", { duracion: 0.1 });
r.ocultoAlInicio = gsap.getProperty(punto, "opacity") === 0;
mover(100, 50);
r.sinViaje = gsap.getProperty(punto, "x") === 100 && gsap.getProperty(punto, "y") === 50;
mover(300, 200);
await espera(160);
r.alcanza = gsap.getProperty(punto, "x") === 300 && gsap.getProperty(punto, "y") === 200;
await espera(120);
r.visible = gsap.getProperty(punto, "opacity") === 1;
limpiar();
r.sinEstilos = punto.style.cssText === estiloInicial;
mover(10, 10);
await espera(40);
r.sinListener = punto.style.cssText === estiloInicial;

simular(false);
const limpiarReducido = seguidorCursor(".punto");
mover(50, 50);
r.reducido = gsap.getProperty(punto, "opacity") === 0 && gsap.getProperty(punto, "x") === 0;
limpiarReducido();
r.reducidoLimpio = punto.style.cssText === estiloInicial;
// prueba: r.ocultoAlInicio
// prueba: r.sinViaje
// prueba: r.alcanza
// prueba: r.visible
// prueba: r.sinEstilos
// prueba: r.sinListener
// prueba: r.reducido
// prueba: r.reducidoLimpio
// prueba: ScrollTrigger.getAll().length === 0
