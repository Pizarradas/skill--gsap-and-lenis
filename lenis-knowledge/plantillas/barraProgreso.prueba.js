// Ayudas de la prueba: registro de listeners y observadores, espera por condición y preferencia simulada
const registro = [];
const anadir = EventTarget.prototype.addEventListener;
const retirar = EventTarget.prototype.removeEventListener;
const captura = (o) => (typeof o === "object" ? !!o?.capture : !!o);
EventTarget.prototype.addEventListener = function (t, f, o) {
  const entrada = { d: this ?? window, t, f, c: captura(o) };
  registro.push(entrada);
  if (o?.once) anadir.call(this ?? window, t, () => registro.splice(registro.indexOf(entrada), 1), { once: true });
  return anadir.call(this ?? window, t, f, o);
};
EventTarget.prototype.removeEventListener = function (t, f, o) {
  const i = registro.findIndex((r) => r.d === (this ?? window) && r.t === t && r.f === f && r.c === captura(o));
  if (i >= 0) registro.splice(i, 1);
  return retirar.call(this ?? window, t, f, o);
};
const Observador = window.ResizeObserver;
let observadores = 0;
window.ResizeObserver = class extends Observador {
  constructor(f) { super(f); this.vivo = true; observadores++; }
  disconnect() { if (this.vivo) observadores--; this.vivo = false; super.disconnect(); }
};
const hasta = async (condicion, ms = 3000) => {
  const inicio = performance.now();
  while (!condicion() && performance.now() - inicio < ms) await espera(20);
  return !!condicion();
};
const consultaReal = window.matchMedia;
function simularReducido(valor) {
  const oyentes = new Set();
  const consulta = { matches: valor, addEventListener: (t, f) => oyentes.add(f), removeEventListener: (t, f) => oyentes.delete(f),
    cambiar(v) { consulta.matches = v; oyentes.forEach((f) => f({ matches: v })); }, oyentes };
  window.matchMedia = () => consulta;
  return consulta;
}
const sinResiduos = () => registro.length === 0 && observadores === 0 && !/lenis/.test(document.documentElement.className);

// Contenedor con overflow en hoja de estilo, no en línea: es el caso en que lenis.css interviene
const hojaCaja = document.createElement("style");
hojaCaja.textContent = ".caja-hoja{position:relative;height:300px;overflow:auto}";
document.head.append(hojaCaja);
function crearCaja(contenido) {
  const caja = document.createElement("div");
  caja.className = "caja-hoja";
  caja.innerHTML = `<div>${contenido}</div>`;
  document.body.prepend(caja);
  return { caja, interior: caja.firstElementChild };
}
const enHoja = (caja) => getComputedStyle(caja).overflowY === "auto" && caja.style.overflow === "";

const barra = document.querySelector("#barra");
barra.style.transform = "translateZ(0)"; // valor previo que debe recuperar
const valorPrevio = barra.style.transform;

// Selector, instancia propia, gesto de rueda
const limpiar = barraProgreso("#barra");
const inicial = barra.style.transform === "scaleX(0)";
rueda(500);
const avanza = await hasta(() => parseFloat(barra.style.transform.slice(7)) > 0.1);
limpiar();
const restaurada = barra.style.transform === valorPrevio && barra.style.transformOrigin === "";
const limpia = sinResiduos();
window.scrollTo(0, 0);
await espera(40);

// Elemento, instancia externa que sobrevive, eje vertical, toque sin syncTouch
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
const limpiar2 = barraProgreso(barra, { lenis, eje: "y" });
rueda(400);
const vertical = await hasta(() => barra.style.transform.startsWith("scaleY(") && lenis.scroll > 300);
const leido = parseFloat(barra.style.transform.slice(7));
const coincide = Math.abs(leido - lenis.progress) < 0.02;

// Cambia el contenido: el valor se queda obsoleto hasta actualizar()
const extra = document.createElement("div");
extra.style.height = "3000px";
document.body.append(extra);
limpiar2.actualizar();
const reescala = parseFloat(barra.style.transform.slice(7)) < leido;
extra.remove();
lenis.resize();
limpiar2();
const sigueViva = !lenis.isStopped && /lenis/.test(document.documentElement.className);
lenis.destroy();
window.scrollTo(0, 0);
await espera(40);

// Movimiento reducido: la barra sigue informando
simularReducido(true);
const reducida = new Lenis({ autoRaf: true });
const limpiar3 = barraProgreso(barra, { lenis: reducida });
rueda(600);
const conReducido = await hasta(() => parseFloat(barra.style.transform.slice(7)) > 0.1);
limpiar3();
reducida.destroy();
window.matchMedia = consultaReal;
window.scrollTo(0, 0);
await espera(40);

// Sin recorrido: lenis.progress vale 1, pero la barra sale vacía
const sombra = document.querySelector("#anfitrion").attachShadow({ mode: "open" });
sombra.innerHTML = '<div id="b"></div><div id="caja" style="height:100px;overflow:auto"><div id="i" style="height:100px"></div></div>';
const sinRecorrido = new Lenis({ wrapper: sombra.getElementById("caja"), content: sombra.getElementById("i"), autoRaf: true });
const dentro = sombra.getElementById("b");
const limpiar4 = barraProgreso(dentro, { lenis: sinRecorrido });
const vacia = sinRecorrido.progress === 1 && dentro.style.transform === "scaleX(0)";
limpiar4();
sinRecorrido.destroy();

// Contenedor con overflow en hoja
const { caja, interior } = crearCaja('<div style="height:2000px"></div>');
const enCaja = new Lenis({ wrapper: caja, content: interior, autoRaf: true, lerp: 0.3 });
const limpiar5 = barraProgreso(barra, { lenis: enCaja });
const cajaEnHoja = enHoja(caja);
rueda(500, caja);
await hasta(() => enCaja.scroll > 495 && !enCaja.isScrolling);
const cajaCoincide = Math.abs(parseFloat(barra.style.transform.slice(7)) - caja.scrollTop / 1700) < 0.02;
limpiar5();
enCaja.destroy();
caja.remove();

// Se recrea la instancia: la plantilla sigue atada a la vieja hasta llamarla de nuevo
const vieja = new Lenis({ autoRaf: true, lerp: 0.3 });
const limpiar6 = barraProgreso(barra, { lenis: vieja });
vieja.destroy();
const recreada = new Lenis({ autoRaf: true, lerp: 0.3 });
rueda(400);
await hasta(() => recreada.scroll > 395 && !recreada.isScrolling);
const congelada = barra.style.transform === "scaleX(0)";
limpiar6();
const limpiar7 = barraProgreso(barra, { lenis: recreada });
const reconectada = parseFloat(barra.style.transform.slice(7)) > 0.05;
limpiar7();
recreada.destroy();
window.scrollTo(0, 0);
await espera(40);

// prueba: inicial && avanza
// prueba: restaurada && limpia
// prueba: vertical && coincide
// prueba: reescala
// prueba: sigueViva
// prueba: conReducido
// prueba: vacia
// prueba: cajaEnHoja && cajaCoincide
// prueba: congelada && reconectada
// prueba: sinResiduos()
