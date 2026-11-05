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

const lista = document.querySelector("#lista");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });

// Gesto corto: mandatory lleva a la sección más cercana
const ajustes = [];
const limpiar = seccionesSnap(".s", { lenis, tipo: "mandatory", espera: 40, duracion: 0.15, alAjustar: (s) => ajustes.push(s.value) });
rueda(500);
const ajusta = await hasta(() => lenis.scroll === 700 && ajustes.at(-1) === 700);

// Cambia la lista: una función como objetivo la relee
limpiar();
const limpiar2 = seccionesSnap(() => lista.children, { lenis, tipo: "mandatory", espera: 40, duracion: 0.15 });
const nueva = document.createElement("section");
nueva.style.height = "700px";
lista.append(nueva);
limpiar2.actualizar();
limpiar2.snap().goTo(3);
const incluye = await hasta(() => lenis.scroll === 2100);
limpiar2.snap().goTo(0);
await hasta(() => lenis.scroll === 0);
nueva.remove();
limpiar2.actualizar();

// Limpiar con una espera pendiente no debe ajustar después
rueda(300);
await espera(10);
limpiar2();
await hasta(() => !lenis.isScrolling);
const llegada = lenis.scroll;
await espera(150);
const sinAjusteTardio = lenis.scroll === llegada && llegada !== 700;
lenis.destroy();
window.scrollTo(0, 0);
await espera(40);

// Movimiento reducido: el ajuste se detiene y vuelve si la preferencia cambia
const preferencia = simularReducido(true);
const reducida = new Lenis({ autoRaf: true });
const limpiar3 = seccionesSnap(lista, { lenis: reducida, tipo: "mandatory", espera: 40, duracion: 0.1 });
rueda(300);
await hasta(() => reducida.scroll > 290);
await espera(150);
const sinSalto = reducida.scroll === 300;
preferencia.cambiar(false);
rueda(100);
const reactiva = await hasta(() => reducida.scroll === 700 || reducida.scroll === 0);
limpiar3();
const sinOyente = preferencia.oyentes.size === 0;
reducida.destroy();
window.matchMedia = consultaReal;
window.scrollTo(0, 0);
await espera(40);

// Contenedor desplazado: usa posiciones calculadas
const caja = document.querySelector("#caja");
const enCaja = new Lenis({ wrapper: caja, content: document.querySelector("#interior"), autoRaf: true, lerp: 0.3 });
const limpiar4 = seccionesSnap(document.querySelectorAll(".c"), { lenis: enCaja, tipo: "mandatory", espera: 40, duracion: 0.1 });
rueda(280, caja);
const contenedor = await hasta(() => enCaja.scroll === 300);
// El contenedor cambia de tamaño sin que cambie la ventana: relee las secciones
const snapPrevio = limpiar4.snap();
caja.style.height = "350px";
avisarTamano(caja);
const cajaObservada = limpiar4.snap() !== snapPrevio;
caja.style.height = "";
limpiar4();
enCaja.destroy();

// Instancia propia y Shadow DOM
const sombra = document.querySelector("#anfitrion").attachShadow({ mode: "open" });
sombra.innerHTML = '<div id="a" style="height:400px">a</div><div id="b" style="height:400px">b</div>';
const inicioSombra = sombra.getElementById("b").getBoundingClientRect().top;
const limpiar5 = seccionesSnap([sombra.getElementById("a"), sombra.getElementById("b")], { tipo: "mandatory", espera: 40, duracion: 0.1 });
limpiar5.snap().goTo(1);
const sombraOk = await hasta(() => Math.abs(window.scrollY - inicioSombra) < 2);
limpiar5();

// prueba: ajusta
// prueba: incluye
// prueba: sinAjusteTardio
// prueba: sinSalto && reactiva && sinOyente
// prueba: contenedor && getComputedStyle(caja).overflowY === "auto" && caja.style.overflow === ""
// prueba: cajaObservada
// prueba: sombraOk
// prueba: sinResiduos()
