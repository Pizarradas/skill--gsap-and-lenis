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

const fondo = document.querySelector("#fondo");
const otra = document.querySelector("#otra");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });

// Rueda: conserva la transformación previa y añade la suya; data-velocidad cambia el signo
const limpiar = parallax([fondo, otra], { lenis, velocidad: 0.3 });
const previaConservada = fondo.style.transform.startsWith("scale(1.2) translate3d(");
const y = (el) => parseFloat(el.style.transform.split("translate3d(0px, ")[1] ?? el.style.transform.split("translate3d(0, ")[1]);
const a0 = y(fondo);
const o0 = y(otra);
rueda(400);
await hasta(() => lenis.scroll > 395 && !lenis.isScrolling);
const a1 = y(fondo);
const proporcional = Math.abs(a1 - a0 - lenis.scroll * 0.3) < 2;
const contrario = Math.abs(y(otra) - o0 + lenis.scroll * 0.5) < 2;

// Cambia el contenido: actualizar() vuelve a medir
const extra = document.createElement("div");
extra.style.height = "200px";
document.querySelector("#zona").prepend(extra);
limpiar.actualizar();
const remedido = Math.abs(y(fondo) - (a1 - 200 * 0.3)) < 2;
extra.remove();
limpiar.actualizar();

limpiar();
const restaurado = fondo.style.transform === "scale(1.2)" && otra.style.transform === "";
const antes = fondo.style.transform;
rueda(100);
await espera(150);
const yaNoActua = fondo.style.transform === antes;
lenis.destroy();
window.scrollTo(0, 0);
await espera(40);

// Movimiento reducido: sin efecto; se aplica si la preferencia cambia, y se retira si vuelve
const preferencia = simularReducido(true);
const limpiar2 = parallax(fondo);
rueda(300);
await espera(200);
const sinEfecto = fondo.style.transform === "scale(1.2)";
preferencia.cambiar(false);
const conEfecto = fondo.style.transform.includes("translate3d");
preferencia.cambiar(true);
const otraVezSin = fondo.style.transform === "scale(1.2)";
limpiar2();
const sinOyente = preferencia.oyentes.size === 0;
window.matchMedia = consultaReal;
window.scrollTo(0, 0);
await espera(40);

// Contenedor en Shadow DOM
const sombra = document.querySelector("#anfitrion").attachShadow({ mode: "open" });
sombra.innerHTML = '<div id="w" style="height:200px;overflow:auto"><div id="c" style="height:1500px"><p id="p">x</p></div></div>';
const interna = new Lenis({ wrapper: sombra.getElementById("w"), content: sombra.getElementById("c"), autoRaf: true, lerp: 0.3 });
const pieza = sombra.getElementById("p");
const limpiar3 = parallax(pieza, { lenis: interna });
const b0 = y(pieza);
rueda(300, sombra.getElementById("w"));
await hasta(() => interna.scroll > 295 && !interna.isScrolling);
const sombraOk = Math.abs(y(pieza) - b0 - interna.scroll * 0.2) < 2;
limpiar3();
interna.destroy();

// Contenedor con overflow en hoja, que además cambia de tamaño sin que cambie la ventana
const { caja, interior } = crearCaja('<div style="height:400px"></div><p style="margin:0;height:50px">x</p><div style="height:1500px"></div>');
const enCaja = new Lenis({ wrapper: caja, content: interior, autoRaf: true, lerp: 0.3 });
const piezaCaja = interior.querySelector("p");
const limpiar4 = parallax(piezaCaja, { lenis: enCaja });
const cajaEnHoja = enHoja(caja);
const c0 = y(piezaCaja);
rueda(300, caja);
await hasta(() => enCaja.scroll > 295 && !enCaja.isScrolling);
const cajaOk = Math.abs(y(piezaCaja) - c0 - caja.scrollTop * 0.2) < 2;
const c1 = y(piezaCaja);
caja.style.height = "500px";
avisarTamano(caja);
const cajaObservada = Math.abs(y(piezaCaja) - (c1 + 100 * 0.2)) < 2;
limpiar4();
enCaja.destroy();
caja.remove();

// prueba: previaConservada && proporcional && contrario
// prueba: remedido
// prueba: restaurado && yaNoActua
// prueba: sinEfecto && conEfecto && otraVezSin && sinOyente
// prueba: sombraOk
// prueba: cajaEnHoja && cajaOk
// prueba: cajaObservada
// prueba: sinResiduos()
