const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const irA = (y) => {
  window.scrollTo(0, y);
  ScrollTrigger.update(); // sin esperar al evento: los iframes fuera de pantalla lo retrasan
};
const simular = (reducido) => {
  window.matchMedia = (q) => ({ matches: reducido ? /: reduce\)/.test(q) : /no-preference/.test(q), media: q, addListener() {}, removeListener() {} });
};
const cifras = gsap.utils.toArray(".cifra");
const abajo = document.querySelector(".abajo");
const textoInicial = cifras.map((c) => c.textContent).join("|") + abajo.textContent;
const texto = () => cifras.map((c) => c.textContent).join("|") + abajo.textContent;
const r = {};

simular(false);
const limpiar = contador(".cifra", { idioma: "es-ES", decimales: 1, duracion: 0.1, alEntrar: false });
r.empiezaEnCero = cifras[0].textContent === "0,0";
await espera(150);
r.final = cifras[0].textContent === "12.500,5";
r.milSinPunto = cifras[1].textContent === "1234,0"; // es-ES no agrupa cifras de cuatro dígitos
limpiar();
r.textoRestaurado = texto() === textoInicial;
r.sinTriggers = ScrollTrigger.getAll().length === 0;

const limpiarEntrada = contador(".abajo", { duracion: 0.1, formato: (v) => Math.round(v) + " %" });
await espera(60);
r.esperaAlViewport = abajo.textContent === "0 %" && ScrollTrigger.getAll().length === 1;
irA(1200);
await espera(160);
r.cuentaAlEntrar = abajo.textContent === "10 %";
irA(0);
limpiarEntrada();
r.textoRestaurado2 = texto() === textoInicial;

simular(true);
const limpiarReducido = contador(".cifra", { hasta: 7, idioma: "es-ES" });
r.reducido = cifras[0].textContent === "7" && ScrollTrigger.getAll().length === 0;
limpiarReducido();
r.reducidoLimpio = texto() === textoInicial;

// Dato que cambia: se limpia y se vuelve a llamar con `desde` igual al valor anterior.
simular(false);
const [cifra] = cifras;
const opcionesCifra = { idioma: "es-ES", duracion: 0.1, alEntrar: false };
let limpiarCifra = contador(cifra, { ...opcionesCifra, hasta: 100 });
await espera(150);
r.datoInicial = cifra.textContent === "100";
limpiarCifra();
limpiarCifra = contador(cifra, { ...opcionesCifra, desde: 100, hasta: 250 });
r.datoSinSalto = cifra.textContent === "100";
await espera(150);
r.datoNuevo = cifra.textContent === "250";
limpiarCifra();
r.datoLimpio = texto() === textoInicial;
// prueba: r.empiezaEnCero
// prueba: r.final
// prueba: r.milSinPunto
// prueba: r.textoRestaurado
// prueba: r.sinTriggers
// prueba: r.esperaAlViewport
// prueba: r.cuentaAlEntrar
// prueba: r.textoRestaurado2
// prueba: r.reducido
// prueba: r.reducidoLimpio
// prueba: r.datoInicial
// prueba: r.datoSinSalto
// prueba: r.datoNuevo
// prueba: r.datoLimpio
// prueba: ScrollTrigger.getAll().length === 0
