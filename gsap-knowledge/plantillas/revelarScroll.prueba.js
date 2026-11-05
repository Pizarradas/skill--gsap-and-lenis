const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const irA = (y) => {
  window.scrollTo(0, y);
  ScrollTrigger.update(); // sin esperar al evento: los iframes fuera de pantalla lo retrasan
};
const simular = (reducido) => {
  window.matchMedia = (q) => ({ matches: reducido ? /: reduce\)/.test(q) : /no-preference/.test(q), media: q, addListener() {}, removeListener() {} });
};
const tarjetas = gsap.utils.toArray(".tarjeta");
const lejana = document.querySelector(".lejana");
const estiloInicial = tarjetas.map((t) => t.style.cssText).join("|");
const estilos = () => tarjetas.map((t) => t.style.cssText).join("|");
const r = {};

simular(false);
const limpiar = revelarScroll(".tarjeta", { y: 30, duracion: 0.05, stagger: 0.01, intervalo: 0.01 });
r.ocultaAlInicio = gsap.getProperty(tarjetas[0], "opacity") === 0;
r.tresDisparadores = ScrollTrigger.getAll().length === 3;
await espera(120);
r.primeraVisible = gsap.getProperty(tarjetas[0], "opacity") === 1 && gsap.getProperty(tarjetas[0], "y") === 0;
r.lejanaOculta = gsap.getProperty(lejana, "opacity") === 0;
irA(900);
await espera(120);
r.lejanaVisible = gsap.getProperty(lejana, "opacity") === 1;
irA(0);
limpiar();
r.sinEstilos = estilos() === estiloInicial;
r.sinTriggers = ScrollTrigger.getAll().length === 0;

const limpiarRepetir = revelarScroll(".lejana", { duracion: 0.02, intervalo: 0.01 });
irA(900);
await espera(90);
r.repiteEntra = gsap.getProperty(lejana, "opacity") === 1;
irA(0);
await espera(90);
r.repiteSale = gsap.getProperty(lejana, "opacity") === 1; // sin repetir, se queda visible
limpiarRepetir();
const limpiarRepetir2 = revelarScroll(".lejana", { duracion: 0.02, intervalo: 0.01, repetir: true });
irA(900);
await espera(60);
irA(0);
await espera(60);
r.repetirOculta = gsap.getProperty(lejana, "opacity") === 0;
limpiarRepetir2();
r.repetirLimpio = estilos() === estiloInicial;

simular(true);
const limpiarCambio = (simular(false), revelarScroll(".tarjeta", { y: 30 }));
r.ocultoAntesDelCambio = tarjetas[0].style.opacity === "0";
simular(true);
gsap.matchMediaRefresh(); // la preferencia cambia sin recargar
r.cambioEnCaliente = estilos() === estiloInicial && ScrollTrigger.getAll().length === 0;
limpiarCambio();

const limpiarReducido = revelarScroll(".tarjeta", { y: 30 });
r.reducidoSinOcultar = estilos() === estiloInicial && ScrollTrigger.getAll().length === 0;
limpiarReducido();

// Lista que crece: se llama solo con los nuevos y se guardan todas las limpiezas.
simular(false);
const lista = document.querySelector(".lista");
const limpiezas = [revelarScroll(lista.querySelectorAll(".fila"), { duracion: 0.02, intervalo: 0.01 })];
await espera(60);
const vieja = lista.querySelector(".fila");
const nueva = document.createElement("div");
nueva.className = "fila";
nueva.textContent = "nueva";
lista.append(nueva);
limpiezas.push(revelarScroll([nueva], { duracion: 0.02, intervalo: 0.01 }));
await espera(250); // holgura para tiempo real: el lote espera a un refresco y a un tick
r.crecePrimeraSigue = gsap.getProperty(vieja, "opacity") === 1;
r.creceNuevaVisible = gsap.getProperty(nueva, "opacity") === 1;
limpiezas.forEach((l) => l());
nueva.remove();
r.creceLimpio = ScrollTrigger.getAll().length === 0 && vieja.style.cssText === "";
r.sinCache = gsap.getProperty(tarjetas[0], "y") === 0; // leer un transform con GSAP escribe en style: va al final
// prueba: r.ocultaAlInicio
// prueba: r.tresDisparadores
// prueba: r.primeraVisible
// prueba: r.lejanaOculta
// prueba: r.lejanaVisible
// prueba: r.sinEstilos
// prueba: r.sinCache
// prueba: r.sinTriggers
// prueba: r.repiteEntra
// prueba: r.repiteSale
// prueba: r.repetirOculta
// prueba: r.repetirLimpio
// prueba: r.ocultoAntesDelCambio
// prueba: r.cambioEnCaliente
// prueba: r.reducidoSinOcultar
// prueba: r.crecePrimeraSigue
// prueba: r.creceNuevaVisible
// prueba: r.creceLimpio
// prueba: ScrollTrigger.getAll().length === 0
