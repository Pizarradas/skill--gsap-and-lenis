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

const lienzo = document.querySelector("#lienzo");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });

// Cada dibujo ve el mismo valor que el scroll real de ese paso
let dibujos = 0;
let desfase = 0;
const limpiar = sincronizarCanvas("#lienzo", {
  lenis,
  dibujar(ctx, estado) {
    dibujos++;
    desfase = Math.max(desfase, Math.abs(estado.scroll - window.scrollY));
    ctx.fillRect(0, 0, estado.ancho * estado.progreso, estado.alto);
  },
});
const inicial = dibujos >= 1 && lienzo.width === 200 && lienzo.getContext("2d").getTransform().a === 1;
const antes = dibujos;
rueda(500);
await hasta(() => lenis.scroll > 495 && !lenis.isScrolling);
const dibuja = dibujos > antes + 3;
const sincronizado = desfase <= 1;

// En reposo no gasta nada: basta una ventana sin dibujos, que un bucle continuo nunca daría.
// Se reintenta porque en un iframe fuera de pantalla el evento scroll nativo llega tarde y Lenis
// lo reemite una vez, sin cambio de valor
await hasta(() => !lenis.isScrolling);
let reposo = dibujos;
let sinBucle = false;
for (let i = 0; i < 8 && !sinBucle; i++) {
  await espera(300);
  sinBucle = dibujos === reposo;
  reposo = dibujos;
}

// Cambian tus datos: redibujar()
limpiar.redibujar();
const redibuja = dibujos === reposo + 1;

limpiar();
const restaurado = lienzo.getAttribute("width") === "50" && !lienzo.hasAttribute("height");
const final = dibujos;
rueda(100);
await espera(150);
const yaNoDibuja = dibujos === final;
lenis.destroy();
window.scrollTo(0, 0);
await espera(40);

// Movimiento reducido, sin instancia externa: sigue al scroll, sin animación propia
simularReducido(true);
let n = 0;
const limpiar2 = sincronizarCanvas(lienzo, { dibujar() { n++; } });
rueda(300);
const reducido = await hasta(() => window.scrollY > 200 && n > 1);
limpiar2();
window.matchMedia = consultaReal;
window.scrollTo(0, 0);
await espera(40);
const limpio = sinResiduos();

// Shadow DOM
const sombra = document.querySelector("#anfitrion").attachShadow({ mode: "open" });
sombra.innerHTML = '<canvas id="c" style="width:100px;height:50px"></canvas>';
const enSombra = sombra.getElementById("c");
let m = 0;
const limpiar3 = sincronizarCanvas(enSombra, { dibujar() { m++; } });
const sombraOk = m >= 1 && enSombra.width === 100;
limpiar3();

// Contenedor con overflow en hoja
const { caja, interior } = crearCaja('<div style="height:2000px"></div>');
const enCaja = new Lenis({ wrapper: caja, content: interior, autoRaf: true, lerp: 0.3 });
const cajaEnHoja = enHoja(caja);
let cajaDesfase = 0;
let cajaDibujos = 0;
const limpiar4 = sincronizarCanvas(lienzo, { lenis: enCaja, dibujar(ctx, estado) {
  cajaDibujos++;
  cajaDesfase = Math.max(cajaDesfase, Math.abs(estado.scroll - caja.scrollTop));
} });
rueda(500, caja);
await hasta(() => enCaja.scroll > 495 && !enCaja.isScrolling);
const cajaOk = cajaDibujos > 3 && cajaDesfase <= 1;
limpiar4();
enCaja.destroy();
caja.remove();

// Contexto incompatible: error claro, sin dejar instancia ni oyentes
const ocupado = document.createElement("canvas");
ocupado.getContext("2d");
let mensaje = "";
try {
  sincronizarCanvas(ocupado, { contexto: "webgl", dibujar() {} });
} catch (e) {
  mensaje = e.message;
}
const errorClaro = mensaje.startsWith('sincronizarCanvas: no se obtuvo el contexto "webgl"');

// Canvas de un motor: sin contexto ni cambio de tamaño; recibe las medidas
const motor = document.createElement("canvas");
motor.style.cssText = "display:block;width:120px;height:60px";
document.body.prepend(motor);
const llamadas = [];
const limpiar5 = sincronizarCanvas(motor, { contexto: null, dibujar: (ctx, estado) => llamadas.push([ctx, estado.ancho, estado.alto]) });
const motorLibre = llamadas[0][0] === null && llamadas[0][1] === 120 && llamadas[0][2] === 60 && motor.width === 300 && !motor.hasAttribute("width");
limpiar5();
const motorContexto = motor.getContext("2d") !== null;
motor.remove();

// prueba: inicial && dibuja && sincronizado
// prueba: sinBucle && redibuja
// prueba: restaurado && yaNoDibuja
// prueba: reducido && limpio
// prueba: sombraOk
// prueba: cajaEnHoja && cajaOk
// prueba: errorClaro
// prueba: motorLibre && motorContexto
// prueba: sinResiduos()
