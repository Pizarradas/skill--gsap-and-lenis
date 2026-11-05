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
// En un iframe fuera de pantalla ResizeObserver no llega de forma fiable: la prueba avisa a sus observadores
const vigilados = [];
const avisarTamano = (elemento) => vigilados.filter((v) => v.elemento === elemento && v.observador.vivo).forEach((v) => v.observador.alCambiar([]));
window.ResizeObserver = class extends Observador {
  constructor(f) { super(f); this.vivo = true; this.alCambiar = f; observadores++; }
  observe(elemento, o) { vigilados.push({ elemento, observador: this }); super.observe(elemento, o); }
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

const galeria = document.querySelector("#galeria");
const pista = document.querySelector("#pista");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
const x = () => parseFloat(pista.style.transform.slice(12));
const limiteInicial = lenis.limit;

// La rueda vertical avanza la pista mientras la sección está fijada
const limpiar = scrollHorizontal("#galeria", { lenis });
const recorrido = 2400 - galeria.clientWidth;
const altura = parseFloat(galeria.style.height) === recorrido + 700;
const limiteAlDia = lenis.limit === limiteInicial + recorrido;
rueda(300);
await hasta(() => lenis.scroll > 295 && !lenis.isScrolling);
const sinEmpezar = x() === 0;
rueda(500);
await hasta(() => lenis.scroll > 795 && !lenis.isScrolling);
const avanza = Math.abs(x() + 500) < 2;
const fijada = Math.abs(pista.getBoundingClientRect().top) < 2;
rueda(recorrido);
await hasta(() => lenis.scroll > 300 + recorrido - 5 && !lenis.isScrolling);
const alFinal = Math.abs(x() + recorrido) < 2;

// El foco de teclado lleva a la pieza
lenis.scrollTo(300, { immediate: true });
document.querySelector("#foco").focus({ preventScroll: true });
// Firefox no dispara focusin en un iframe sin foco de ventana: se entrega el evento que dispararía el navegador
if (!document.hasFocus()) document.querySelector("#foco").dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
const enfoca = await hasta(() => Math.abs(lenis.scroll - 1100) < 2 && !lenis.isScrolling);

// Cambia el ancho: actualizar() recalcula el recorrido
pista.append(Object.assign(document.createElement("div"), { style: "flex:none;width:800px" }));
limpiar.actualizar();
const crece = parseFloat(galeria.style.height) === recorrido + 800 + 700;

limpiar();
const restaurado = !galeria.getAttribute("style") && pista.style.position === "" && pista.style.transform === "";
const limiteVuelve = lenis.limit === limiteInicial;
pista.lastElementChild.remove();
lenis.destroy();
window.scrollTo(0, 0);
await espera(40);

// Movimiento reducido: carrusel nativo; responde al cambio de preferencia
const preferencia = simularReducido(true);
const limpiar2 = scrollHorizontal(galeria);
const nativo = getComputedStyle(galeria).overflowX === "auto" && !pista.style.position && !galeria.style.height;
preferencia.cambiar(false);
const fijaAlCambiar = pista.style.position === "sticky";
preferencia.cambiar(true);
const nativoOtraVez = !pista.style.position;
limpiar2();
const sinOyente = preferencia.oyentes.size === 0;
window.matchMedia = consultaReal;
const limpio = sinResiduos();

// Shadow DOM
const sombra = document.querySelector("#anfitrion").attachShadow({ mode: "open" });
sombra.innerHTML = '<div id="g"><div id="p" style="display:flex;width:max-content;height:700px"><div style="flex:none;width:2000px">x</div></div></div>';
const g = sombra.getElementById("g");
const interna = new Lenis({ autoRaf: true, lerp: 0.3 });
const limpiar3 = scrollHorizontal(g, { lenis: interna });
const inicio = g.getBoundingClientRect().top;
interna.scrollTo(inicio + 300, { immediate: true });
const sombraOk = sombra.getElementById("p").style.transform.startsWith("translate3d(-300");
limpiar3();
interna.destroy();

// Contenedor con overflow en hoja, que además cambia de tamaño sin que cambie la ventana
const { caja, interior } = crearCaja('<div style="height:100px"></div><div class="galeria-caja"><div style="display:flex;width:max-content;height:300px"><div style="flex:none;width:2000px">x</div></div></div><div style="height:400px"></div>');
const enCaja = new Lenis({ wrapper: caja, content: interior, autoRaf: true, lerp: 0.3 });
const galeriaCaja = interior.querySelector(".galeria-caja");
const pistaCaja = galeriaCaja.firstElementChild;
const limpiar4 = scrollHorizontal(galeriaCaja, { lenis: enCaja });
const cajaEnHoja = enHoja(caja);
const recorridoCaja = 2000 - galeriaCaja.clientWidth;
const cajaAltura = parseFloat(galeriaCaja.style.height) === recorridoCaja + 300;
rueda(400, caja);
await hasta(() => enCaja.scroll > 395 && !enCaja.isScrolling);
const cajaAvanza = pistaCaja.style.transform.startsWith("translate3d(-30") && Math.abs(pistaCaja.getBoundingClientRect().top - caja.getBoundingClientRect().top) < 2;
caja.style.height = "400px";
avisarTamano(caja);
const cajaObservada = parseFloat(galeriaCaja.style.height) === recorridoCaja + 400;
limpiar4();
enCaja.destroy();
caja.remove();

// prueba: altura && limiteAlDia
// prueba: sinEmpezar && avanza && fijada && alFinal
// prueba: enfoca
// prueba: crece
// prueba: restaurado && limiteVuelve
// prueba: nativo && fijaAlCambiar && nativoOtraVez && sinOyente && limpio
// prueba: sombraOk
// prueba: cajaEnHoja && cajaAltura && cajaAvanza
// prueba: cajaObservada
// prueba: sinResiduos()
