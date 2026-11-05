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

const nav = document.querySelector("#cabecera");

// Rueda: oculta al bajar, muestra al subir, y siempre visible arriba
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
const limpiar = navDireccion("#cabecera", { lenis });
rueda(400);
const oculta = await hasta(() => nav.classList.contains("nav-oculta"));
await hasta(() => !lenis.isScrolling);
rueda(-100);
const visible = await hasta(() => !nav.classList.contains("nav-oculta"));
await hasta(() => !lenis.isScrolling);

// Un gesto menor que el umbral no cambia nada
rueda(4);
await espera(200);
const sinParpadeo = !nav.classList.contains("nav-oculta");

// El foco la devuelve, y no se oculta mientras lo tenga
rueda(300);
await hasta(() => nav.classList.contains("nav-oculta"));
await hasta(() => !lenis.isScrolling);
const anadirFoco = (tipo) => document.querySelector("#enlace").dispatchEvent(new FocusEvent(tipo, { bubbles: true }));
anadirFoco("focusin"); // eventos sintéticos: en el arnés, otro iframe puede robar el foco real
const porFoco = !nav.classList.contains("nav-oculta");
rueda(300);
await espera(250);
const sigueConFoco = !nav.classList.contains("nav-oculta");
anadirFoco("focusout");
await hasta(() => !lenis.isScrolling);

// Tras limpiar no reacciona y no deja la clase
rueda(300);
await hasta(() => nav.classList.contains("nav-oculta"));
limpiar();
const sinClase = !nav.classList.contains("nav-oculta");
await hasta(() => !lenis.isScrolling);
rueda(300);
await espera(200);
const yaNoReacciona = !nav.classList.contains("nav-oculta");
lenis.destroy();
window.scrollTo(0, 0);
await espera(40);

// Toque nativo con instancia propia: el scroll del navegador también cuenta
const limpiar2 = navDireccion(nav, { margen: 10 });
window.scrollTo(0, 500);
const nativo = await hasta(() => nav.classList.contains("nav-oculta"));
limpiar2();
window.scrollTo(0, 0);
await espera(40);
const limpia = sinResiduos();

// Movimiento reducido: la clase cambia igual; la transición se anula en CSS
simularReducido(true);
const reducida = new Lenis({ autoRaf: true });
const limpiar3 = navDireccion(nav, { lenis: reducida });
rueda(400);
const conReducido = await hasta(() => nav.classList.contains("nav-oculta"));
limpiar3();
reducida.destroy();
window.matchMedia = consultaReal;
window.scrollTo(0, 0);
await espera(40);

// Shadow DOM
const sombra = document.querySelector("#anfitrion").attachShadow({ mode: "open" });
sombra.innerHTML = '<header id="c">x</header>';
const enSombra = sombra.getElementById("c");
const limpiar4 = navDireccion(enSombra, { clase: "oculta" });
rueda(400);
const sombraOculta = await hasta(() => enSombra.classList.contains("oculta"));
limpiar4();

// Contenedor con overflow en hoja: cuenta el scroll del contenedor, no el de la ventana
const { caja, interior } = crearCaja('<div style="height:2000px"></div>');
const enCaja = new Lenis({ wrapper: caja, content: interior, autoRaf: true, lerp: 0.3 });
const limpiar5 = navDireccion(nav, { lenis: enCaja });
const scrollVentana = window.scrollY;
const cajaEnHoja = enHoja(caja);
rueda(400, caja);
const cajaOculta = await hasta(() => nav.classList.contains("nav-oculta"));
await hasta(() => !enCaja.isScrolling);
rueda(-100, caja);
const cajaVisible = await hasta(() => !nav.classList.contains("nav-oculta"));
const ventanaQuieta = window.scrollY === scrollVentana;
limpiar5();
enCaja.destroy();
caja.remove();

// prueba: oculta && visible && sinParpadeo
// prueba: porFoco && sigueConFoco
// prueba: sinClase && yaNoReacciona
// prueba: nativo && limpia
// prueba: conReducido
// prueba: sombraOculta && !enSombra.className
// prueba: cajaEnHoja && cajaOculta && cajaVisible && ventanaQuieta
// prueba: sinResiduos()
