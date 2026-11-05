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

const boton = document.querySelector("#subir");
boton.style.position = "fixed";
const principal = document.querySelector("#contenido");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });

// Aparece pasado el umbral, sube, y el foco no se pierde al ocultarse
const limpiar = botonArriba("#subir", { lenis, umbral: 300 });
const ocultoAlInicio = boton.hidden;
rueda(500);
const aparece = await hasta(() => !boton.hidden);
await hasta(() => !lenis.isScrolling);
boton.focus();
boton.click();
const focoMovido = document.activeElement === principal;
const sube = await hasta(() => lenis.scroll === 0 && !lenis.isScrolling);
const ocultoAlFinal = boton.hidden;

// Con la instancia parada no hace nada, en silencio
rueda(500);
await hasta(() => !lenis.isScrolling && lenis.scroll > 400);
const altura = lenis.scroll;
lenis.stop();
boton.click();
await espera(120);
const respetaParada = lenis.scroll === altura;
lenis.start();

limpiar();
const restaurado = boton.hidden === false && !principal.hasAttribute("tabindex");
lenis.scrollTo(0, { immediate: true });
const sinReaccion = boton.hidden === false;
lenis.destroy();
window.scrollTo(0, 0);
await espera(40);

// Movimiento reducido, con instancia propia y destino explícito
simularReducido(true);
const limpiar2 = botonArriba(boton, { umbral: 100, foco: principal });
window.scrollTo(0, 800);
await hasta(() => !boton.hidden);
boton.click();
const inmediato = window.scrollY === 0;
limpiar2();
window.matchMedia = consultaReal;
await espera(40);
const limpio = sinResiduos();

// Shadow DOM: busca el destino en su raíz
const sombra = document.querySelector("#anfitrion").attachShadow({ mode: "open" });
sombra.innerHTML = '<main id="m">x</main><button id="b" hidden>x</button>';
const enSombra = sombra.getElementById("b");
const interna = new Lenis({ autoRaf: true });
const limpiar3 = botonArriba(enSombra, { lenis: interna, umbral: 100 });
interna.scrollTo(400, { immediate: true });
const sombraVisible = !enSombra.hidden;
enSombra.focus();
enSombra.click();
const sombraFoco = sombra.activeElement === sombra.getElementById("m");
limpiar3();
interna.destroy();
const sombraHidden = enSombra.hidden;

// Contenedor con overflow en hoja
const { caja, interior } = crearCaja('<main>x</main><div style="height:2000px"></div><button>subir</button>');
const enCaja = new Lenis({ wrapper: caja, content: interior, autoRaf: true, lerp: 0.3 });
const botonCaja = interior.querySelector("button");
const limpiar4 = botonArriba(botonCaja, { lenis: enCaja, umbral: 200 });
const cajaOculto = botonCaja.hidden && enHoja(caja);
rueda(500, caja);
const cajaAparece = await hasta(() => !botonCaja.hidden);
await hasta(() => !enCaja.isScrolling);
const scrollVentana = window.scrollY;
botonCaja.click();
const cajaFoco = document.activeElement === interior.querySelector("main");
const cajaSube = await hasta(() => caja.scrollTop === 0 && !enCaja.isScrolling);
const ventanaQuieta = window.scrollY === scrollVentana;
limpiar4();
enCaja.destroy();
caja.remove();

// prueba: ocultoAlInicio && aparece && focoMovido && sube && ocultoAlFinal
// prueba: respetaParada
// prueba: restaurado && sinReaccion
// prueba: inmediato && limpio
// prueba: sombraVisible && sombraFoco && sombraHidden
// prueba: cajaOculto && cajaAparece && cajaSube && cajaFoco && ventanaQuieta
// prueba: sinResiduos()
