const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const irA = (y) => {
  window.scrollTo(0, y);
  ScrollTrigger.update(); // sin esperar al evento: los iframes fuera de pantalla lo retrasan
};
const simular = (reducido) => {
  window.matchMedia = (q) => ({ matches: reducido ? /: reduce\)/.test(q) : /no-preference/.test(q), media: q, addListener() {}, removeListener() {} });
};
// Tres fotogramas de color plano: rojo, verde y azul.
const fotograma = (color) => {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 8;
  const p = c.getContext("2d");
  p.fillStyle = color;
  p.fillRect(0, 0, 8, 8);
  return c.toDataURL();
};
const urls = ["#f00", "#0f0", "#00f"].map(fotograma);
const giro = document.getElementById("giro");
const pixel = () => [...giro.getContext("2d").getImageData(giro.width / 2, giro.height / 2, 1, 1).data];
const atributos = () => giro.getAttribute("width") + "|" + giro.getAttribute("height") + "|" + giro.style.cssText;
const inicial = atributos();
const r = {};

simular(false);
const limpiar = secuenciaImagenes("#giro", { urls, disparador: ".escena", fin: "+=600", suavizado: true });
r.resolucion = giro.width >= 400 && giro.height >= 200;
await espera(60);
r.primero = pixel()[0] === 255 && pixel()[1] === 0;
const st = ScrollTrigger.getAll()[0];
r.conPin = st.pin === document.querySelector(".escena");
irA(st.start + 300);
await espera(60);
r.segundo = pixel()[1] === 255 && pixel()[0] === 0;
irA(st.end);
await espera(60);
r.tercero = pixel()[2] === 255 && pixel()[1] === 0;
irA(0);
limpiar();
r.sinPin = document.querySelector(".escena").parentElement === document.body;
r.sinAtributos = atributos() === inicial;
r.vacio = pixel()[3] === 0;
r.sinTriggers = ScrollTrigger.getAll().length === 0;

simular(true);
const limpiarReducido = secuenciaImagenes("#giro", { urls, fotogramaEstatico: 1 });
r.reducidoSinScroll = ScrollTrigger.getAll().length === 0;
await espera(60);
r.reducidoFijo = pixel()[1] === 255 && pixel()[0] === 0;
limpiarReducido();
r.reducidoLimpio = atributos() === inicial;
// prueba: r.resolucion
// prueba: r.primero
// prueba: r.conPin
// prueba: r.segundo
// prueba: r.tercero
// prueba: r.sinPin
// prueba: r.sinAtributos
// prueba: r.vacio
// prueba: r.sinTriggers
// prueba: r.reducidoSinScroll
// prueba: r.reducidoFijo
// prueba: r.reducidoLimpio
// prueba: ScrollTrigger.getAll().length === 0
