const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const irA = (y) => {
  window.scrollTo(0, y);
  ScrollTrigger.update(); // sin esperar al evento: los iframes fuera de pantalla lo retrasan
};
const simular = (reducido) => {
  window.matchMedia = (q) => ({ matches: reducido ? /: reduce\)/.test(q) : /no-preference/.test(q), media: q, addListener() {}, removeListener() {} });
};
const seccion = document.querySelector(".galeria");
const pista = document.querySelector(".pista");
const estilos = () => seccion.style.cssText + "|" + pista.style.cssText;
const estiloInicial = estilos();
const r = {};

simular(false);
let tw;
const limpiar = pinHorizontal(".galeria", { suavizado: true, alCrear: (t) => (tw = t) });
r.creado = !!tw && tw.scrollTrigger === ScrollTrigger.getAll()[0];
r.conEspaciador = seccion.parentElement !== document.body && seccion.parentElement.classList.contains("pin-spacer");
const recorrido = pista.scrollWidth - seccion.clientWidth;
r.distancia = Math.abs(ScrollTrigger.getAll()[0].end - ScrollTrigger.getAll()[0].start - recorrido) < 1;
irA(recorrido / 2);
await espera(120);
r.mitad = Math.abs(gsap.getProperty(pista, "x") + recorrido / 2) < 2;
irA(recorrido);
await espera(120);
r.final = Math.abs(gsap.getProperty(pista, "x") + recorrido) < 1;
irA(0);
limpiar();
r.sinEspaciador = seccion.parentElement === document.body;
r.sinEstilos = estilos() === estiloInicial;
r.sinTriggers = ScrollTrigger.getAll().length === 0;

simular(true);
const limpiarReducido = pinHorizontal(".galeria");
r.reducido = getComputedStyle(seccion).overflowX === "auto" && ScrollTrigger.getAll().length === 0;
limpiarReducido();
r.reducidoLimpio = estilos() === estiloInicial;

simular(false);
const limpiarOtraVez = pinHorizontal(".galeria", { suavizado: true });
ScrollTrigger.refresh();
r.reutilizable = ScrollTrigger.getAll().length === 1 && seccion.parentElement.classList.contains("pin-spacer");
limpiarOtraVez();
r.segundaLimpieza = estilos() === estiloInicial && seccion.parentElement === document.body;
// prueba: r.creado
// prueba: r.conEspaciador
// prueba: r.distancia
// prueba: r.mitad
// prueba: r.final
// prueba: r.sinEspaciador
// prueba: r.sinEstilos
// prueba: r.sinTriggers
// prueba: r.reducido
// prueba: r.reducidoLimpio
// prueba: r.reutilizable
// prueba: r.segundaLimpieza
// prueba: ScrollTrigger.getAll().length === 0
