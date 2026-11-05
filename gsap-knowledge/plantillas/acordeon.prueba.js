const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const simular = (reducido) => {
  window.matchMedia = (q) => ({ matches: reducido ? /: reduce\)/.test(q) : /no-preference/.test(q), media: q, addListener() {}, removeListener() {} });
};
const [b1, b2] = gsap.utils.toArray(".preguntas button");
const p1 = document.getElementById("r1");
const p2 = document.getElementById("r2");
const foto = () => [b1, b2].map((b) => b.getAttribute("aria-expanded")).join() + "|" + [p1, p2].map((p) => p.hidden + ":" + p.style.cssText).join();
const inicial = foto();
const r = {};

simular(false);
const limpiar = acordeon(".preguntas", { duracion: 0.1 });
r.cerradoOculto = p2.hidden === true && p1.hidden === false;
await espera(30); // el primer tick absorbe el tiempo de carga
b2.click();
await espera(50);
r.aMedias = p2.offsetHeight > 0 && p2.offsetHeight < 120 && p2.hidden === false;
await espera(110);
r.abierto = p2.offsetHeight === 120 && p2.style.height === "" && b2.getAttribute("aria-expanded") === "true";
r.unico = p1.hidden === true && b1.getAttribute("aria-expanded") === "false";
b2.click();
await espera(30);
const altura = p2.offsetHeight;
b2.click(); // interrumpe el cierre: no debe saltar a 0
r.sinSalto = p2.offsetHeight >= altura - 1 && p2.offsetHeight < 120;
await espera(120);
r.reabierto = p2.offsetHeight === 120 && p2.hidden === false;
limpiar();
r.estadoRestaurado = foto() === inicial;
const antes = foto();
b2.click();
r.sinListeners = foto() === antes;

const limpiarInterrumpido = acordeon(".preguntas", { duracion: 0.3 });
b2.click();
await espera(40);
limpiarInterrumpido();
r.limpiezaAMedias = foto() === inicial;

simular(true);
const limpiarReducido = acordeon(".preguntas");
b2.click();
r.reducidoAlInstante = p2.hidden === false && p2.offsetHeight === 120 && p1.hidden === true;
limpiarReducido();
r.reducidoLimpio = foto() === inicial;

// Dentro de Shadow DOM real: el mismo id existe fuera, y debe ganar el de la sombra.
simular(false);
const anfitrion = document.createElement("div");
document.body.append(anfitrion);
const sombra = anfitrion.attachShadow({ mode: "open" });
sombra.innerHTML = `<div class="zona"><button aria-expanded="false" aria-controls="r2">Sombra</button>
  <div id="r2" hidden><div style="height:40px">Dentro</div></div></div>`;
const botonSombra = sombra.querySelector("button");
const panelSombra = sombra.getElementById("r2");
const limpiarSombra = acordeon(sombra.querySelector(".zona"), { duracion: 0.05 });
await espera(30);
botonSombra.click();
await espera(100);
r.sombraAbre = panelSombra.hidden === false && panelSombra.offsetHeight === 40;
r.sombraNoTocaFuera = p2.hidden === document.getElementById("r2").hidden && foto() === inicial;
limpiarSombra();
r.sombraLimpia = panelSombra.hidden === true && panelSombra.style.cssText === "";
anfitrion.remove();

// Context.kill() desempata con un comparador inconsistente: el orden de revert() depende del motor.
// Se fuerzan los dos órdenes para que esto falle también en Chrome si la plantilla depende de uno.
const ordenNativo = Array.prototype.sort;
const forzarOrden = (comoV8) => {
  Array.prototype.sort = function (cmp) {
    if (!cmp) return ordenNativo.call(this);
    const salida = [];
    for (const x of this) {
      let i = salida.length;
      while (i > 0 && (comoV8 ? cmp(x, salida[i - 1]) < 0 : cmp(salida[i - 1], x) > 0)) i--;
      salida.splice(i, 0, x);
    }
    salida.forEach((x, i) => (this[i] = x));
    return this;
  };
};
const cualquierOrden = [];
for (const comoV8 of [true, false]) {
  forzarOrden(comoV8);
  const limpiarTerminado = acordeon(".preguntas", { duracion: 0.1 });
  await espera(30);
  b2.click();
  await espera(30);
  b2.click(); // interrumpe: el segundo fromTo captura la altura a medias
  await espera(150);
  limpiarTerminado();
  const terminado = foto() === inicial;
  const limpiarEnCurso = acordeon(".preguntas", { duracion: 0.3 });
  await espera(30);
  b2.click();
  await espera(40);
  b2.click();
  await espera(40);
  limpiarEnCurso();
  cualquierOrden.push(terminado && foto() === inicial);
  Array.prototype.sort = ordenNativo;
}
r.cualquierOrden = cualquierOrden.join() === "true,true";

// Lo que el panel ya traía en línea vuelve tal cual, no se borra.
p2.style.overflow = "clip";
p2.style.height = "50px";
const limpiarPropio = acordeon(".preguntas", { duracion: 0.05 });
await espera(30);
b2.click();
await espera(100);
limpiarPropio();
r.conservaPropio = p2.style.overflow === "clip" && p2.style.height === "50px";
p2.style.cssText = "";
// prueba: r.cerradoOculto
// prueba: r.aMedias
// prueba: r.abierto
// prueba: r.unico
// prueba: r.sinSalto
// prueba: r.reabierto
// prueba: r.estadoRestaurado
// prueba: r.sinListeners
// prueba: r.limpiezaAMedias
// prueba: r.reducidoAlInstante
// prueba: r.reducidoLimpio
// prueba: r.sombraAbre
// prueba: r.sombraNoTocaFuera
// prueba: r.sombraLimpia
// prueba: r.cualquierOrden
// prueba: r.conservaPropio
// prueba: ScrollTrigger.getAll().length === 0
