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

const enlace = document.querySelector("#e2");
const dos = document.querySelector("#dos");
const fuera = document.querySelector("#fuera");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });
const objetivoFinal = dos.getBoundingClientRect().top - 60;

// Pulsar: desplaza, mueve el foco, actualiza la URL y respeta scroll-margin
const limpiar = menuAnclas("#menu", { lenis });
let externoEvitado = null;
const noSeguir = (e) => { externoEvitado = e.defaultPrevented; e.preventDefault(); };
window.addEventListener("click", noSeguir);
fuera.click();
const ignoraExterno = externoEvitado === false && lenis.scroll === 0;
enlace.click();
const conFoco = document.activeElement === dos && dos.getAttribute("tabindex") === "-1";
const llega = await hasta(() => Math.abs(lenis.scroll - objetivoFinal) < 2 && !lenis.isScrolling);
const conHash = location.hash === "#dos";
await hasta(() => enlace.hasAttribute("aria-current"), 800);
const marcado = enlace.getAttribute("aria-current") === "location";

// Enlaces que aparecen después ya cuentan
const nuevo = document.createElement("a");
nuevo.href = "#uno";
nuevo.textContent = "Otro";
document.querySelector("#menu").append(nuevo);
nuevo.click();
const llegaNuevo = await hasta(() => Math.abs(lenis.scroll - 400) < 30 && !lenis.isScrolling);
limpiar.actualizar();

// Limpieza con la instancia externa viva
limpiar();
const sinMarcas = !document.querySelector("#menu [aria-current]") && !dos.hasAttribute("tabindex") && !document.querySelector("#uno").hasAttribute("tabindex");
const antes = lenis.scroll;
enlace.addEventListener("click", (e) => e.preventDefault(), { once: true });
enlace.click();
await espera(120);
const yaNoActua = lenis.scroll === antes;
window.removeEventListener("click", noSeguir);
lenis.destroy();
history.replaceState(null, "", location.pathname);
window.scrollTo(0, 0);
await espera(40);

// Movimiento reducido: salta sin animación
simularReducido(true);
const reducida = new Lenis({ autoRaf: true });
const limpiar2 = menuAnclas(document.querySelector("#menu"), { lenis: reducida, actualizarUrl: false });
enlace.click();
const inmediato = Math.abs(reducida.scroll - objetivoFinal) < 2;
limpiar2();
reducida.destroy();
window.matchMedia = consultaReal;
window.scrollTo(0, 0);
await espera(40);

// Shadow DOM: scrollTo("#id") no llega; la plantilla sí
const sombra = document.querySelector("#anfitrion").attachShadow({ mode: "open" });
sombra.innerHTML = '<nav id="n"><a id="l" href="#fin">Fin</a></nav><div id="fin" style="height:300px">Fin</div>';
const propia = menuAnclas(sombra.getElementById("n"), { actualizarUrl: false });
const posicion = sombra.getElementById("fin").getBoundingClientRect().top;
sombra.getElementById("l").click();
const sombraFoco = sombra.activeElement === sombra.getElementById("fin");
const sombraLlega = await hasta(() => Math.abs(window.scrollY - Math.min(posicion, document.documentElement.scrollHeight - innerHeight)) < 2);
propia();

// Contenedor con overflow en hoja
const { caja, interior } = crearCaja('<nav><a href="#caja-b">B</a></nav><section id="caja-a" style="height:500px">a</section><section id="caja-b" style="height:900px">b</section>');
const enCaja = new Lenis({ wrapper: caja, content: interior, autoRaf: true, lerp: 0.3 });
const limpiar3 = menuAnclas(interior.querySelector("nav"), { lenis: enCaja, actualizarUrl: false });
const cajaEnHoja = enHoja(caja);
const cajaObjetivo = interior.querySelector("#caja-b").getBoundingClientRect().top - caja.getBoundingClientRect().top;
interior.querySelector("a").click();
const cajaFoco = document.activeElement === interior.querySelector("#caja-b");
const cajaLlega = await hasta(() => Math.abs(caja.scrollTop - cajaObjetivo) < 2 && !enCaja.isScrolling);
const cajaMarca = await hasta(() => interior.querySelector("a").getAttribute("aria-current") === "location");
limpiar3();
enCaja.destroy();
caja.remove();

// Menú en una sombra, secciones fuera: sube por los anfitriones
const seccionFuera = document.querySelector("#dos");
const sombraMenu = document.querySelector("#anfitrion2").attachShadow({ mode: "open" });
sombraMenu.innerHTML = '<nav id="m2"><a id="l2" href="#dos">Dos</a><span id="anidado"></span></nav>';
const limpiar4 = menuAnclas(sombraMenu.getElementById("m2"), { actualizarUrl: false });
const objetivoFuera = seccionFuera.getBoundingClientRect().top - 60 + window.scrollY;
sombraMenu.getElementById("l2").click();
const fueraFoco = document.activeElement === seccionFuera && seccionFuera.getAttribute("tabindex") === "-1";
const fueraLlega = await hasta(() => Math.abs(window.scrollY - objetivoFuera) < 2);
document.querySelector("#e1").focus({ preventScroll: true });
seccionFuera.dispatchEvent(new FocusEvent("blur")); // sintético: el iframe del arnés puede no tener el foco real
const fueraTabindex = !seccionFuera.hasAttribute("tabindex");

// Enlace dentro de la sombra de un hijo del menú: composedPath() lo ve
const sombraHija = sombraMenu.getElementById("anidado").attachShadow({ mode: "open" });
sombraHija.innerHTML = '<a id="l3" href="#uno">Uno</a>';
sombraHija.getElementById("l3").click();
const anidadoLlega = await hasta(() => Math.abs(window.scrollY - 400) < 30);
limpiar4();

// prueba: ignoraExterno
// prueba: llega && conFoco && conHash && marcado
// prueba: llegaNuevo
// prueba: sinMarcas && yaNoActua
// prueba: inmediato
// prueba: sombraLlega && sombraFoco
// prueba: cajaEnHoja && cajaLlega && cajaFoco && cajaMarca
// prueba: fueraLlega && fueraFoco && fueraTabindex
// prueba: anidadoLlega
// prueba: sinResiduos()
