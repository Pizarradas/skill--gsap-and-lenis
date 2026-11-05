const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const simular = (reducido) => {
  window.matchMedia = (q) => ({ matches: reducido ? /: reduce\)/.test(q) : /no-preference/.test(q), media: q, addListener() {}, removeListener() {} });
};
const h1 = document.querySelector("h1");
const h2 = document.querySelector("h2");
const htmlInicial = h1.innerHTML + h2.innerHTML;
const atributos = () => h1.getAttribute("aria-label") + "|" + h2.getAttribute("aria-label");
const r = {};

simular(false);
const limpiar = titularTexto(".titular", { duracion: 0.1, stagger: 0.01, alEntrar: true });
r.dividido = h1.getAttribute("aria-label") === h1.textContent.trim() && h1.children.length > 0;
r.conMascara = [...h1.children].every((c) => c.style.overflow === "clip");
r.variasLineas = h1.children.length >= 3;
r.conservaEm = !!h1.querySelector("em");
r.unTriggerPorTitular = ScrollTrigger.getAll().length === 2;
await espera(200);
r.primeroTerminado = gsap.getProperty(h1.firstElementChild.firstElementChild, "yPercent") === 0;
r.segundoEspera = gsap.getProperty(h2.firstElementChild.firstElementChild, "yPercent") === 110;
limpiar();
r.htmlRestaurado = h1.innerHTML + h2.innerHTML === htmlInicial;
r.sinAria = atributos() === "null|null";
r.sinTriggers = ScrollTrigger.getAll().length === 0;

const limpiarPalabras = titularTexto("h1", { tipo: "chars", duracion: 0.05, stagger: 0 });
r.letras = h1.querySelectorAll("[aria-hidden=true]").length > 40;
limpiarPalabras();
r.htmlTrasLetras = h1.innerHTML + h2.innerHTML === htmlInicial;

simular(true);
const limpiarReducido = titularTexto(".titular");
r.reducido = h1.innerHTML + h2.innerHTML === htmlInicial && !h1.hasAttribute("aria-label");
limpiarReducido();
// prueba: r.dividido
// prueba: r.conMascara
// prueba: r.variasLineas
// prueba: r.conservaEm
// prueba: r.unTriggerPorTitular
// prueba: r.primeroTerminado
// prueba: r.segundoEspera
// prueba: r.htmlRestaurado
// prueba: r.sinAria
// prueba: r.sinTriggers
// prueba: r.letras
// prueba: r.htmlTrasLetras
// prueba: r.reducido
// prueba: ScrollTrigger.getAll().length === 0
