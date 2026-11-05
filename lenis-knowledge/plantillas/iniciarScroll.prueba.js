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

// Bucle propio
const a = iniciarScroll({ lerp: 0.3 });
rueda(300);
const propio = await hasta(() => a.lenis.scroll > 250);
a.limpiar();
a.limpiar(); // repetir no debe fallar
const limpioPropio = sinResiduos();
window.scrollTo(0, 0);
await espera(40);

// Reloj externo: conecta y desconecta
let suscritos = 0;
const reloj = (paso) => {
  suscritos++;
  let id = requestAnimationFrame(function vuelta(t) { paso(t); id = requestAnimationFrame(vuelta); });
  return () => { suscritos--; cancelAnimationFrame(id); };
};
const b = iniciarScroll({ bucle: reloj, lerp: 0.3 });
const sinAutoRaf = b.lenis.options.autoRaf === false;
rueda(300);
const externo = await hasta(() => b.lenis.scroll > 250);
b.limpiar();
window.scrollTo(0, 0);
await espera(40);

// Sin bucle: sin raf() no se mueve nada
const c = iniciarScroll({ bucle: false, lerp: 0.3 });
rueda(300);
await espera(150);
const quieto = c.lenis.scroll === 0;
for (let t = 0; t < 2000; t += 16) c.lenis.raf(t);
const manual = c.lenis.scroll > 250;
c.limpiar();
window.scrollTo(0, 0);
await espera(40);

// El contenido cambia: resize() recalcula el límite
const d = iniciarScroll({ lerp: 0.3 });
const limiteInicial = d.lenis.limit;
const extra = document.createElement("div");
extra.style.height = "1000px";
document.body.append(extra);
d.lenis.resize();
const crece = d.lenis.limit === limiteInicial + 1000;
d.limpiar();
extra.remove();

// autoToggle: destroy() olvida transitionend; limpiar() no
const g = iniciarScroll({ autoToggle: true });
g.limpiar();
const sinFuga = sinResiduos();

// Contenedor dentro de Shadow DOM: adopta el CSS y lo retira
const sombra = document.querySelector("#anfitrion").attachShadow({ mode: "open" });
sombra.innerHTML = '<style>.caja { height: 300px; overflow: auto; }</style><div id="caja" class="caja"><div id="interior" style="height:2000px"></div></div>';
const caja = sombra.getElementById("caja");
const e = iniciarScroll({ wrapper: caja, content: sombra.getElementById("interior"), lerp: 0.3 });
const hojas = sombra.adoptedStyleSheets.length;
e.lenis.stop();
const recortado = getComputedStyle(caja).overflowY === "clip";
e.lenis.start();
rueda(200, caja);
const sombraMueve = await hasta(() => caja.scrollTop > 150);
e.limpiar();
const sombraLimpia = sombra.adoptedStyleSheets.length === 0 && caja.className === "caja";

// Contenedor con overflow en hoja: la rueda lo mueve y la limpieza deja su clase
const { caja: cajaHoja, interior } = crearCaja('<div style="height:2000px"></div>');
const h = iniciarScroll({ wrapper: cajaHoja, content: interior, lerp: 0.3 });
const cajaEnHoja = enHoja(cajaHoja) && /lenis/.test(cajaHoja.className);
rueda(300, cajaHoja);
const cajaMueve = await hasta(() => cajaHoja.scrollTop > 250);
await hasta(() => !h.lenis.isScrolling);
h.limpiar();
const cajaLimpia = cajaHoja.className === "caja-hoja";
cajaHoja.remove();

// Anfitrión como wrapper, con el contenido en la sombra: la hoja va a la sombra del contenido
const anfitrion = document.createElement("div");
anfitrion.className = "caja-hoja";
document.body.prepend(anfitrion);
const sombraHost = anfitrion.attachShadow({ mode: "open" });
sombraHost.innerHTML = '<div id="dentro" style="height:2000px"><div id="libre" data-lenis-prevent style="height:50px"></div><iframe></iframe></div>';
const f = iniciarScroll({ wrapper: anfitrion, content: sombraHost.getElementById("dentro"), lerp: 0.3 });
const hojasHost = sombraHost.adoptedStyleSheets.length;
const contenido = getComputedStyle(sombraHost.getElementById("libre")).overscrollBehaviorY === "contain";
rueda(300, anfitrion);
await espera(32);
const iframeInerte = f.lenis.isSmooth && getComputedStyle(sombraHost.querySelector("iframe")).pointerEvents === "none";
const hostMueve = await hasta(() => anfitrion.scrollTop > 250);
await hasta(() => !f.lenis.isScrolling);
f.limpiar();
const hostLimpio = sombraHost.adoptedStyleSheets.length === 0 && getComputedStyle(sombraHost.getElementById("libre")).overscrollBehaviorY === "auto";
anfitrion.remove();

// prueba: propio && limpioPropio
// prueba: externo && sinAutoRaf && suscritos === 0
// prueba: quieto && manual
// prueba: crece
// prueba: sinFuga
// prueba: hojas === 1 && recortado && sombraMueve && sombraLimpia
// prueba: cajaEnHoja && cajaMueve && cajaLimpia
// prueba: hojasHost === 1 && contenido && iframeInerte && hostMueve && hostLimpio
// prueba: sinResiduos()
