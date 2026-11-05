const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const simular = (reducido) => {
  window.matchMedia = (q) => ({ matches: reducido ? /: reduce\)/.test(q) : /no-preference/.test(q), media: q, addListener() {}, removeListener() {} });
};
// Los iframes fuera de pantalla apenas pintan: el observador se dispara a mano.
const r = {};
const avisos = [];
window.ResizeObserver = class {
  constructor(aviso) { avisos.push(aviso); }
  observe() {}
  disconnect() { r.desconectado = true; }
};
const cinta = document.querySelector(".cinta");
const pista = document.querySelector(".pista");
const piezas = gsap.utils.toArray(".pieza");
const estilos = () => cinta.style.cssText + "|" + pista.style.cssText;
const estiloInicial = estilos();

simular(false);
const limpiar = marquee(".cinta", { velocidad: 2000 });
const total = () => pista.children.length;
r.cubre = total() * 200 >= 1000 + 400; // series suficientes para no dejar hueco
r.clonesMudos = [...pista.children].slice(2).every((c) => c.getAttribute("aria-hidden") === "true" && c.inert);
await espera(90);
const tw = gsap.getTweensOf(pista)[0];
r.bucle = tw.repeat() === -1 && tw.duration() === 0.2; // 400 px a 2000 px/s
r.dentroDeSerie = gsap.getProperty(pista, "x") <= 0 && gsap.getProperty(pista, "x") >= -400;
r.seMueve = gsap.getProperty(pista, "x") !== 0;
cinta.dispatchEvent(new PointerEvent("pointerenter"));
await espera(330);
r.frenado = gsap.getTweensOf(pista)[0].timeScale() === 0;
gsap.utils.toArray(pista.children).forEach((p) => (p.style.width = "280px")); // la serie pasa de 400 a 600 px
avisos[0]();
await espera(190);
r.remedido = gsap.getTweensOf(pista).length === 1 && gsap.getTweensOf(pista)[0].vars.x === -600;
limpiar();
r.sinClones = pista.children.length === 2;
r.sinEstilos = estilos() === estiloInicial;

simular(true);
piezas.forEach((p) => (p.style.width = "180px"));
const limpiarReducido = marquee(".cinta");
r.reducido = pista.children.length === 2 && getComputedStyle(cinta).overflowX === "auto" && gsap.getTweensOf(pista).length === 0;
limpiarReducido();
r.reducidoLimpio = estilos() === estiloInicial;
// prueba: r.cubre
// prueba: r.clonesMudos
// prueba: r.bucle
// prueba: r.dentroDeSerie
// prueba: r.seMueve
// prueba: r.frenado
// prueba: r.remedido
// prueba: r.desconectado
// prueba: r.sinClones
// prueba: r.sinEstilos
// prueba: r.reducido
// prueba: r.reducidoLimpio
// prueba: ScrollTrigger.getAll().length === 0
