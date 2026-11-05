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

const modal = document.querySelector("#modal");
const segundo = document.querySelector("#segundo");

// Instancia propia, selector: bloquea la rueda de fondo
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
const limpiar = bloqueoModal("#modal", { lenis });
limpiar.abrir();
const abierto = modal.open && lenis.isStopped && modal.hasAttribute("data-lenis-prevent");
rueda(400);
await espera(120);
const bloqueado = lenis.scroll === 0;

// Dentro del diálogo la rueda y el toque quedan para el navegador
const eventoRueda = new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true, composed: true });
modal.firstElementChild.dispatchEvent(eventoRueda);
const ruedaNativa = !eventoRueda.defaultPrevented;
let toqueBloqueado = null;
window.addEventListener("touchmove", (e) => { toqueBloqueado = e.defaultPrevented; }, { once: true });
toque("touchstart", 10, 300, modal.firstElementChild);
toque("touchmove", 10, 280, modal.firstElementChild);
toque("touchend", 10, 280, modal.firstElementChild);
const toqueNativo = toqueBloqueado === false;

// Dos diálogos: cerrar uno no reanuda el fondo
const limpiarSegundo = bloqueoModal(segundo, { lenis });
limpiarSegundo.abrir();
limpiarSegundo.cerrar();
const sigueParada = lenis.isStopped;

// Escape y method="dialog" cierran sin pasar por cerrar()
modal.close();
const reanuda = await hasta(() => !lenis.isStopped);
rueda(300);
const vuelveAMoverse = await hasta(() => lenis.scroll > 200);

// Si ya estaba parada al abrir, cerrar no la reanuda
lenis.stop();
limpiar.abrir();
limpiar.cerrar();
const respetaParada = lenis.isStopped;
lenis.start();

// Limpiar con el diálogo abierto
limpiar.abrir();
limpiar();
const limpioAbierto = !modal.open && !lenis.isStopped && !modal.hasAttribute("data-lenis-prevent");
limpiarSegundo();
lenis.destroy();
window.scrollTo(0, 0);
await espera(40);

// Movimiento reducido: bloquea igual
simularReducido(true);
const propio = bloqueoModal(modal);
propio.abrir();
rueda(300);
await espera(100);
const reducidoQuieto = window.scrollY === 0;
propio();
window.matchMedia = consultaReal;
const limpioPropio = sinResiduos();

// autoToggle: abrir y cerrar seguido no deja el recorte en línea
const conAutoToggle = new Lenis({ autoRaf: true, autoToggle: true });
const limpiarToggle = bloqueoModal(modal, { lenis: conAutoToggle });
limpiarToggle.abrir();
limpiarToggle.cerrar();
const sinRecorte = document.documentElement.style.overflow === "";
limpiarToggle();
conAutoToggle.destroy();
// Fuga de Lenis 1.3.27, no de la plantilla: destroy() no quita este listener
document.documentElement.removeEventListener("transitionend", conAutoToggle.onTransitionEnd);

// Shadow DOM: el atributo se ve a través de composedPath()
const sombra = document.querySelector("#anfitrion").attachShadow({ mode: "open" });
sombra.innerHTML = '<dialog id="d" style="height:100px;overflow:auto"><div id="i" style="height:900px">x</div></dialog>';
const enSombra = sombra.getElementById("d");
const instancia = new Lenis({ autoRaf: true });
const limpiarSombra = bloqueoModal(enSombra, { lenis: instancia });
limpiarSombra.abrir();
const interior = new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true, composed: true });
sombra.getElementById("i").dispatchEvent(interior);
const sombraNativa = !interior.defaultPrevented && instancia.isStopped;
limpiarSombra();
instancia.destroy();

// Contenedor con overflow en hoja: conserva su posición y bloquea también la ventana
const { caja, interior: dentroCaja } = crearCaja('<div style="height:2000px"></div>');
const enCaja = new Lenis({ wrapper: caja, content: dentroCaja, autoRaf: true, lerp: 0.3 });
const cajaEnHoja = enHoja(caja);
enCaja.scrollTo(500, { immediate: true });
const limpiarCaja = bloqueoModal(modal, { lenis: enCaja });
limpiarCaja.abrir();
await espera(60);
const cajaQuieta = caja.scrollTop === 500 && enCaja.scroll === 500 && enCaja.isStopped;
const ventanaBloqueada = document.documentElement.style.overflow === "hidden";
rueda(200, caja);
await espera(120);
const ruedaBloqueada = caja.scrollTop === 500;

// Otra instancia de contenedor: la ventana sigue bloqueada hasta que cierre la última
const otraCaja = crearCaja('<div style="height:2000px"></div>');
const enOtra = new Lenis({ wrapper: otraCaja.caja, content: otraCaja.interior, autoRaf: true });
const limpiarOtra = bloqueoModal(segundo, { lenis: enOtra });
limpiarOtra.abrir();
limpiarOtra.cerrar();
const sigueBloqueada = document.documentElement.style.overflow === "hidden" && otraCaja.caja.style.overflow === "";
limpiarOtra();
enOtra.destroy();
otraCaja.caja.remove();

limpiarCaja.cerrar();
await espera(60);
const cajaLibre = document.documentElement.style.overflow === "" && caja.style.overflow === "" && enHoja(caja) && !enCaja.isStopped;
const sinSalto = caja.scrollTop === 500 && enCaja.scroll === 500;
rueda(100, caja);
const sigueDesde = await hasta(() => caja.scrollTop > 590 && !enCaja.isScrolling);
limpiarCaja();

// También con autoToggle, y sin perder un overflow en línea previo
enCaja.destroy();
caja.style.overflow = "scroll";
const conToggle = new Lenis({ wrapper: caja, content: dentroCaja, autoRaf: true, autoToggle: true });
const limpiarConToggle = bloqueoModal(modal, { lenis: conToggle });
limpiarConToggle.abrir();
await espera(60);
const toggleQuieta = caja.scrollTop > 590 && caja.style.overflow === "hidden";
limpiarConToggle();
const toggleRestaura = caja.style.overflow === "scroll" && document.documentElement.style.overflow === "";
conToggle.destroy();
caja.removeEventListener("transitionend", conToggle.onTransitionEnd);
caja.remove();

// prueba: abierto && bloqueado
// prueba: ruedaNativa && toqueNativo
// prueba: sigueParada && reanuda && vuelveAMoverse
// prueba: respetaParada
// prueba: limpioAbierto
// prueba: reducidoQuieto && limpioPropio
// prueba: sinRecorte
// prueba: sombraNativa
// prueba: cajaEnHoja && cajaQuieta && ventanaBloqueada && ruedaBloqueada
// prueba: sigueBloqueada
// prueba: cajaLibre && sinSalto && sigueDesde
// prueba: toggleQuieta && toggleRestaura
// prueba: sinResiduos()
