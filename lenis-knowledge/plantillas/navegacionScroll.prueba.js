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

const vista = document.querySelector("#vista");
const previa = history.scrollRestoration;
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
let ruta = "/a";
const nav = navegacionScroll("#vista", { lenis, clave: () => ruta });
const manual = history.scrollRestoration === "manual";

// Avanzar: la vista nueva empieza arriba, cortando la inercia
rueda(800);
await hasta(() => lenis.scroll > 795 && !lenis.isScrolling);
const guardada = lenis.scroll;
rueda(300);
await espera(40);
nav.antes();
ruta = "/b";
vista.innerHTML = '<div style="height:4000px">vista B</div>';
nav.despues();
const arriba = lenis.scroll === 0 && !lenis.isScrolling;
await espera(200);
const sinInercia = window.scrollY === 0;

// Un destino más allá del límite anterior exige resize() antes de colocar
vista.innerHTML = '<div style="height:9000px">vista C</div>';
lenis.scrollTo(8000, { immediate: true });
const recortado = lenis.scroll < 8000;
lenis.resize();
lenis.scrollTo(0, { immediate: true });

// Volver atrás: recupera la posición aunque la instancia esté parada
window.dispatchEvent(new PopStateEvent("popstate"));
ruta = "/a";
vista.innerHTML = '<div style="height:3000px">vista A</div>';
lenis.stop();
const guardadaEnA = lenis.scroll;
nav.despues();
const vuelve = Math.abs(lenis.scroll - guardada) < 80 || lenis.scroll > 700;
lenis.start();

// Con hash: va al elemento, también en Shadow DOM
const sombra = document.querySelector("#anfitrion").attachShadow({ mode: "open" });
sombra.innerHTML = '<div id="vs"><div style="height:2000px"></div><p id="ancla">x</p></div>';
history.replaceState(null, "", "#ancla");
const nav2 = navegacionScroll(sombra.getElementById("vs"), { lenis });
const posicion = sombra.getElementById("ancla").getBoundingClientRect().top + lenis.scroll;
nav2.despues();
const hash = Math.abs(lenis.scroll - posicion) < 2;
history.replaceState(null, "", location.pathname);
nav2();
nav();
const restaurada = history.scrollRestoration === previa;
lenis.destroy();
const sinOyentes = sinResiduos();
window.scrollTo(0, 0);
await espera(40);

// Instancia propia, movimiento reducido
simularReducido(true);
const nav3 = navegacionScroll(vista);
window.scrollTo(0, 600);
await espera(60);
nav3.antes();
nav3.despues();
const reducido = window.scrollY === 0;
nav3();
window.matchMedia = consultaReal;
history.scrollRestoration = previa;

// Ventana, rama que fallaba: el enrutador ya puso el scroll en el destino y sigue la inercia
const inercia = new Lenis({ autoRaf: true, lerp: 0.1 });
const nav4 = navegacionScroll(vista, { lenis: inercia, clave: () => ruta });
vista.innerHTML = '<div style="height:6000px">vista</div>';
inercia.resize();
rueda(3000);
await espera(60);
const enMarcha = inercia.isSmooth && inercia.targetScroll === 3000;
window.scrollTo(0, 0);
nav4.despues();
const cortada = !inercia.isSmooth && window.scrollY === 0;
await espera(250);
const sigueArriba = window.scrollY === 0 && inercia.scroll === 0;

// Hacia arriba targetScroll ya es 0: scrollTo(0) solo no corta
inercia.scrollTo(2000, { immediate: true });
rueda(-6000);
await espera(60);
const subiendo = inercia.isSmooth && inercia.targetScroll === 0 && inercia.scroll > 100;
window.scrollTo(0, 0);
nav4.despues();
const cortadaSubiendo = !inercia.isSmooth;
await espera(100);
const sinDeslizar = window.scrollY === 0;

nav4();
inercia.destroy();
window.scrollTo(0, 0);
await espera(40);

// El destino guardado supera el límite antiguo: hay que medir antes de colocar
const altas = new Lenis({ autoRaf: true, lerp: 0.3 });
ruta = "/alta";
vista.innerHTML = '<div style="height:6000px">alta</div>';
altas.resize();
const nav5 = navegacionScroll(vista, { lenis: altas, clave: () => ruta });
altas.scrollTo(5000, { immediate: true });
nav5.antes();
ruta = "/baja";
vista.innerHTML = '<div style="height:100px">baja</div>';
nav5.despues();
ruta = "/alta";
window.dispatchEvent(new PopStateEvent("popstate"));
vista.innerHTML = '<div style="height:6000px">alta</div>';
nav5.despues();
const recuperaLarga = altas.scroll === 5000 && window.scrollY === 5000;
nav5();
altas.destroy();
vista.innerHTML = '<div style="height:500px">vista A</div>';
window.scrollTo(0, 0);
await espera(40);

// Contenedor con overflow en hoja: no toca la ventana y resuelve lo mismo
const { caja, interior } = crearCaja('<div class="pagina" style="height:6000px"></div>');
const enCaja = new Lenis({ wrapper: caja, content: interior, autoRaf: true, lerp: 0.1 });
const previaCaja = history.scrollRestoration;
const nav6 = navegacionScroll(interior, { lenis: enCaja, clave: () => ruta });
const cajaEnHoja = enHoja(caja);
const ventanaIntacta = history.scrollRestoration === previaCaja;
rueda(3000, caja);
await espera(60);
const cajaMarcha = enCaja.isSmooth;
caja.scrollTo(0, 0);
nav6.despues();
const cajaCortada = !enCaja.isSmooth && caja.scrollTop === 0;
await espera(250);
const cajaArriba = caja.scrollTop === 0;

// Volver a una posición guardada, y al hash, con la vista dentro del contenedor
enCaja.scrollTo(4000, { immediate: true });
nav6.antes();
ruta = "/otra";
interior.innerHTML = '<div style="height:100px">otra</div>';
nav6.despues();
ruta = "/alta";
window.dispatchEvent(new PopStateEvent("popstate"));
interior.innerHTML = '<div style="height:6000px">pagina</div><p id="ancla-caja">x</p>';
nav6.despues();
const cajaVuelve = enCaja.scroll === 4000 && caja.scrollTop === 4000;
history.replaceState(null, "", "#ancla-caja");
nav6.despues();
const cajaHash = Math.abs(interior.querySelector("p").getBoundingClientRect().top - caja.getBoundingClientRect().top) < 2 || caja.scrollTop === enCaja.limit;
history.replaceState(null, "", location.pathname);

// Parada con overflow en línea (como hace bloqueoModal): force coloca
caja.style.overflow = "hidden";
enCaja.stop();
nav6.despues();
const cajaParada = caja.scrollTop === 0 && enCaja.scroll === 0;
enCaja.start();
caja.style.overflow = "";
nav6();
const ventanaSigue = history.scrollRestoration === previaCaja;
enCaja.destroy();
caja.remove();

// prueba: manual && arriba && sinInercia
// prueba: recortado
// prueba: vuelve
// prueba: hash
// prueba: restaurada && sinOyentes
// prueba: reducido
// prueba: enMarcha && cortada && sigueArriba
// prueba: subiendo && cortadaSubiendo && sinDeslizar
// prueba: recuperaLarga
// prueba: cajaEnHoja && ventanaIntacta && cajaMarcha && cajaCortada && cajaArriba
// prueba: cajaVuelve && cajaHash && cajaParada && ventanaSigue
// prueba: sinResiduos()
