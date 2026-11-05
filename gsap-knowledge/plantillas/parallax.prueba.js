const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const irA = (y) => {
  window.scrollTo(0, y);
  ScrollTrigger.update(); // sin esperar al evento: los iframes fuera de pantalla lo retrasan
};
const simular = (reducido) => {
  window.matchMedia = (q) => ({ matches: reducido ? /: reduce\)/.test(q) : /no-preference/.test(q), media: q, addListener() {}, removeListener() {} });
};
const fondos = gsap.utils.toArray(".fondo");
const estilos = () => fondos.map((f) => f.style.cssText).join("|");
const estiloInicial = estilos();
const r = {};

simular(false);
const limpiar = parallax(".fondo");
r.dosTriggers = ScrollTrigger.getAll().length === 2;
r.inicio = gsap.getProperty(fondos[0], "yPercent") === -15 && gsap.getProperty(fondos[1], "yPercent") === -40;
const st = ScrollTrigger.getAll()[0];
irA((st.start + st.end) / 2);
await espera(150);
r.mitad = Math.abs(gsap.getProperty(fondos[0], "yPercent")) < 1;
irA(st.end + 50);
await espera(150);
r.fin = gsap.getProperty(fondos[0], "yPercent") === 15;
irA(0);
limpiar();
r.sinEstilos = estilos() === estiloInicial;
r.sinTriggers = ScrollTrigger.getAll().length === 0;

simular(true);
const limpiarReducido = parallax(".fondo");
r.reducido = estilos() === estiloInicial && ScrollTrigger.getAll().length === 0;
limpiarReducido();
// prueba: r.dosTriggers
// prueba: r.inicio
// prueba: r.mitad
// prueba: r.fin
// prueba: r.sinEstilos
// prueba: r.sinTriggers
// prueba: r.reducido
// prueba: ScrollTrigger.getAll().length === 0
