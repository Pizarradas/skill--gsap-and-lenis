// Registro de oyentes, observadores y reloj: lo que quede tras salir() es una fuga
const oyentes = [];
const anadirOyente = EventTarget.prototype.addEventListener;
const quitarOyente = EventTarget.prototype.removeEventListener;
const captura = (o) => (typeof o === "object" ? !!o?.capture : !!o);
EventTarget.prototype.addEventListener = function (t, f, o) {
  // El navegador ignora un oyente repetido: aquí tampoco cuenta
  if (!oyentes.some((r) => r.d === (this ?? window) && r.t === t && r.f === f && r.c === captura(o))) oyentes.push({ d: this ?? window, t, f, c: captura(o) });
  return anadirOyente.call(this ?? window, t, f, o);
};
EventTarget.prototype.removeEventListener = function (t, f, o) {
  const i = oyentes.findIndex((r) => r.d === (this ?? window) && r.t === t && r.f === f && r.c === captura(o));
  if (i >= 0) oyentes.splice(i, 1);
  return quitarOyente.call(this ?? window, t, f, o);
};
const Observador = window.ResizeObserver;
let observadores = 0;
window.ResizeObserver = class extends Observador {
  constructor(f) { super(f); this.vivo = true; observadores++; }
  disconnect() { if (this.vivo) observadores--; this.vivo = false; super.disconnect(); }
};
const tickerAdd = gsap.ticker.add;
const tickerRemove = gsap.ticker.remove;
const enTicker = new Set();
gsap.ticker.add = function (f, ...a) { enTicker.add(f); return tickerAdd.call(this, f, ...a); };
gsap.ticker.remove = function (f, ...a) { enTicker.delete(f); return tickerRemove.call(this, f, ...a); };

const libs = { gsap, ScrollTrigger, ScrollToPlugin, ScrollSmoother, Lenis };
const fallos = [];
const afirma = (ok, texto) => { if (!ok) fallos.push(texto); };
const cerca = (a, b, m = 2) => Math.abs(a - b) <= m;
const PERFILES_ORQ = ["ninguno", "gsap", "gsap-smoother", "lenis", "gsap+lenis"];
const conGsap = (p) => p.startsWith("gsap");
const vistaHtml = (k) => `<div class="tramo"></div><div class="fijo-orq" id="fijo-${k}"></div><div class="tramo"></div><div class="tramo"></div><div class="tramo" id="meta-${k}"></div><div class="tramo"></div><div class="tramo" id="ultimo-${k}"></div><div class="tramo"></div>`;

// Fotografía de todo lo que el orquestador podría dejar atrás
function foto(lugar) {
  const html = document.documentElement;
  const caja = document.querySelector("#caja");
  const env = document.querySelector("#envoltura");
  const con = document.querySelector("#contenido");
  const nodos = [html, document.body, caja, ...["#interior", "#marco", "#lienzo"].map((q) => document.querySelector(q)), env, con];
  return JSON.stringify({
    atributos: nodos.map((n) => [n.getAttribute("style"), n.getAttribute("class")]),
    movimiento: html.getAttribute("data-movimiento"),
    oyentes: oyentes.map((o) => `${o.d === window ? "window" : o.d === document ? "document" : o.d.nodeName + "#" + (o.d.id || "")}:${o.t}`).sort().join(" "),
    observadores,
    tickers: enTicker.size,
    disparadores: ScrollTrigger.getAll().length,
    smoother: !!ScrollSmoother.get(),
    scroller: "scroller" in ScrollTrigger.defaults({}) ? String(ScrollTrigger.defaults({}).scroller) : "-",
    historial: history.scrollRestoration,
    lenis: nodos.some((n) => /lenis/.test(n.className)),
    tweens: gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive()).length,
  });
}

function diferencia(a, b) {
  const x = JSON.parse(a), y = JSON.parse(b);
  return Object.keys(x).filter((k) => JSON.stringify(x[k]) !== JSON.stringify(y[k])).map((k) => `${k}: ${JSON.stringify(x[k])} -> ${JSON.stringify(y[k])}`).join("; ");
}

function configurar(perfil, lugar, opciones = {}) {
  const base = { perfil, opciones: { smoother: { smooth: 0.1 }, lenis: { lerp: 0.5 }, alAvisar: (a) => avisos.push(a), ...opciones }, ...libs };
  // ScrollTrigger conserva el proxy de un wrapper: ScrollSmoother no comparte nodos con los demás perfiles
  if (lugar === "caja") return perfil === "gsap-smoother" ? { ...base, raiz: "#marco", content: "#lienzo" } : { ...base, raiz: "#caja", content: "#interior" };
  return perfil === "gsap-smoother" ? { ...base, raiz: "#envoltura", content: "#contenido" } : base;
}
let avisos = [];

// La misma aplicación para todos los perfiles: solo cambia `perfil`
function escena(api, k, vistaEl) {
  return () => api.añadir(({ reducido }) => {
    if (!conGsap(api.perfil)) return;
    gsap.to(`#fijo-${k}`, { x: reducido ? 0 : 20, scrollTrigger: { trigger: `#fijo-${k}`, pin: true, start: "top top", end: "+=400", scrub: true } });
  });
}

async function recorrido(perfil, lugar) {
  const et = `${perfil}/${lugar}: `;
  const scrollerId = lugar === "caja" ? (perfil === "gsap-smoother" ? "smoother" : "caja") : "ventana";
  const vista = document.querySelector(`#vista-${scrollerId}`);
  // ScrollSmoother no admite contenedor: en "caja" recibe esos nodos como wrapper y content y el scroll es el de la ventana
  const usaVentana = lugar !== "caja" || perfil === "gsap-smoother";
  const mover = usaVentana ? document.documentElement : document.querySelector("#caja");
  const borde = lugar === "caja" && perfil !== "gsap-smoother" ? () => mover.getBoundingClientRect().top + mover.clientTop : () => 0;
  vista.innerHTML = vistaHtml("a");
  const antes = foto();
  let oyentesCiclo = null; // ScrollTrigger deja uno por scroller, y es suyo: lo que no puede pasar es que crezca

  for (let ciclo = 0; ciclo < 2; ciclo++) {
    avisos = [];
    const api = iniciarMovimiento(configurar(perfil, lugar));
    afirma((api.lenis !== null) === (perfil === "lenis" || perfil === "gsap+lenis"), et + "lenis según perfil");
    afirma((api.smoother !== null) === (perfil === "gsap-smoother"), et + "smoother según perfil");
    afirma(api.perfil === perfil, et + "perfil");
    let limpiado = 0;
    api.añadir(() => () => { limpiado++; });
    const crearEscena = escena(api, "a", vista);
    crearEscena();
    api.actualizar();
    // ScrollSmoother pasa medio segundo en arranque: un refresco suyo en ese tramo reinicia el contenido
    await espera(perfil === "gsap-smoother" ? 560 : 40);

    // irA: mismo resultado con número, selector, elemento y desplazamiento
    api.irA(300, { inmediato: true });
    afirma(cerca(mover.scrollTop, 300), et + "irA número " + mover.scrollTop);
    afirma(cerca(api.posicion(), 300), et + "posicion " + api.posicion());
    api.irA("#meta-a", { inmediato: true });
    await espera(30);
    afirma(cerca(document.querySelector("#meta-a").getBoundingClientRect().top, borde(), 3), et + "irA selector " + document.querySelector("#meta-a").getBoundingClientRect().top);
    api.irA(document.querySelector("#meta-a"), { inmediato: true, desplazamiento: 50 });
    await espera(30);
    afirma(cerca(document.querySelector("#meta-a").getBoundingClientRect().top, borde() - 50, 3), et + "irA elemento y desplazamiento");
    afirma(api.irA("#no-" + "existe") === false, et + "destino inexistente");
    // El scroll nativo animado no se puede temporizar en el arnés: scrollend se comprueba en laboratorio
    let terminado = 0;
    if (perfil === "ninguno") api.irA(120, { inmediato: true, alTerminar: () => terminado++ });
    else api.irA(120, { duracion: 0.05, alTerminar: () => terminado++ });
    await hasta(() => terminado > 0);
    afirma(terminado === 1, et + "alTerminar");
    afirma(cerca(mover.scrollTop, 120, 3), et + "irA animado " + mover.scrollTop);

    // bloquear: anidado, irA ignorado salvo forzar, y sin perder la posición
    // ScrollSmoother sigue llegando tras alTerminar, y cortar lo detiene donde se ve: se espera a que llegue
    if (api.smoother) await hasta(() => cerca(api.smoother.scrollTop(), 120, 1));
    api.bloquear();
    api.bloquear();
    afirma(api.irA(0, { inmediato: true }) === false, et + "irA bloqueado");
    afirma(cerca(mover.scrollTop, 120, 3), et + "posición bloqueada " + mover.scrollTop);
    api.desbloquear();
    if (!api.smoother) afirma(getComputedStyle(mover).overflowY === "hidden", et + "sigue bloqueado tras un desbloqueo");
    afirma(api.irA(60, { inmediato: true, forzar: true }) === true, et + "forzar");
    await espera(20);
    afirma(cerca(mover.scrollTop, 60, 3), et + "forzar mueve " + mover.scrollTop);
    api.desbloquear();
    api.desbloquear(); // de más: no hace nada
    if (lugar === "caja" && !api.smoother) afirma(getComputedStyle(mover).overflowY === "auto", et + "overflow restaurado");
    afirma(api.irA(90, { inmediato: true }) === true, et + "desbloqueado");

    // navegar: ciclo completo, con destino más allá del alto viejo
    let montada = 0;
    const r = await api.navegar("#ultimo-b", {
      cambiar: async () => { vista.innerHTML = vistaHtml("b"); },
      montar: () => { montada++; escena(api, "b", vista)(); },
    });
    await espera(30);
    afirma(r === true && montada === 1, et + "navegar resuelve");
    afirma(limpiado === 1, et + "navegar retira las entradas no persistentes");
    afirma(cerca(document.querySelector("#ultimo-b").getBoundingClientRect().top, borde(), 3), et + "navegar coloca " + document.querySelector("#ultimo-b").getBoundingClientRect().top);
    if (conGsap(perfil)) afirma(ScrollTrigger.getAll().filter((t) => t.vars.pin).length === 1, et + "un pin tras navegar");

    // Dos navegaciones seguidas: la primera queda atrás
    const primera = api.navegar(0, { cambiar: () => espera(20) });
    const segunda = api.navegar(0, {});
    afirma((await primera) === false && (await segunda) === true, et + "turno de navegación");

    // navegar sin fases: el enrutador ya sustituyó la vista, y es síncrono
    vista.innerHTML = vistaHtml("c");
    api.navegar(200);
    afirma(cerca(mover.scrollTop, 200), et + "navegar síncrono " + mover.scrollTop);

    api.añadir(() => { if (conGsap(perfil)) gsap.to("#fijo-c", { x: 5, duration: 30 }); });
    const quitar = api.añadir(() => () => { limpiado += 10; });
    quitar();
    afirma(limpiado === 11, et + "añadir devuelve su baja");

    api.bloquear(); // salir suelta el bloqueo pendiente
    api.salir();
    api.salir();
    afirma(api.lenis === null && api.smoother === null, et + "salir suelta las instancias");
    afirma(api.irA(10) === false, et + "irA tras salir");
    afirma(limpiado === 11 + 0, et + "salir no repite limpiezas");
    afirma(avisos.length === 0, et + "sin avisos: " + JSON.stringify(avisos));
    mover.scrollTop = 0;
    vista.innerHTML = vistaHtml("a");
    await espera(30);
    const ahora = foto();
    const crece = JSON.parse(ahora).oyentes;
    if (conGsap(perfil) && ciclo === 0) oyentesCiclo = crece;
    const base = JSON.stringify({ ...JSON.parse(antes), oyentes: conGsap(perfil) ? oyentesCiclo : JSON.parse(antes).oyentes });
    afirma(diferencia(base, ahora) === "", et + `residuos en el ciclo ${ciclo}: ${diferencia(base, ahora)}`);
  }
  vista.innerHTML = "";
}

const hasta = async (condicion, ms = 800) => {
  const inicio = performance.now();
  while (!condicion() && performance.now() - inicio < ms) await espera(16);
  return !!condicion();
};

for (const perfil of PERFILES_ORQ) {
  for (const lugar of ["ventana", "caja"]) await recorrido(perfil, lugar);
}

// actualizar: refresh antes que resize, con un pin cuyo largo solo se conoce al refrescar
for (const lugar of ["ventana", "caja"]) {
  const vista = document.querySelector(lugar === "caja" ? "#vista-caja" : "#vista-ventana");
  vista.innerHTML = vistaHtml("a");
  const api = iniciarMovimiento(configurar("gsap+lenis", lugar));
  let largo = 300;
  api.añadir(() => { gsap.to("#fijo-a", { x: 5, scrollTrigger: { trigger: "#fijo-a", pin: true, start: "top top", end: () => "+=" + largo, scrub: true } }); });
  api.actualizar();
  largo = 3000;
  api.actualizar();
  const marco = lugar === "caja" ? document.querySelector("#caja") : document.documentElement;
  afirma(api.lenis.limit === marco.scrollHeight - marco.clientHeight, `actualizar mide ${lugar}: ${api.lenis.limit} ${marco.scrollHeight - marco.clientHeight}`);
  api.salir();
  marco.scrollTop = 0;
  vista.innerHTML = "";
}

// actualizar en reposo no deja isScrolling colgado, y autoToggle no deja su oyente
{
  const vista = document.querySelector("#vista-ventana");
  vista.innerHTML = vistaHtml("a");
  const oyentesAntes = oyentes.length;
  const api = iniciarMovimiento(configurar("lenis", "ventana", { lenis: { autoToggle: true } }));
  api.salir();
  afirma(oyentes.length === oyentesAntes, `autoToggle deja oyentes: ${oyentes.length - oyentesAntes}`);

  const otra = iniciarMovimiento(configurar("gsap+lenis", "ventana"));
  otra.añadir(() => { gsap.to("#fijo-a", { x: 5, scrollTrigger: { trigger: "#fijo-a", pin: true, start: "top top", end: "+=300", scrub: true } }); });
  otra.actualizar();
  otra.irA(800, { inmediato: true });
  await espera(40);
  otra.actualizar();
  await espera(60);
  afirma(otra.lenis.isScrolling === false && cerca(window.scrollY, 800), `tras actualizar: ${otra.lenis.isScrolling} ${window.scrollY}`);
  otra.salir();
  document.documentElement.scrollTop = 0;
  vista.innerHTML = "";
}

// navegar: los disparadores nuevos no ven el scroll de la vista vieja, ni con el scroll en el contenedor
for (const perfil of ["gsap", "gsap+lenis"]) {
  const vista = document.querySelector("#vista-caja");
  vista.innerHTML = vistaHtml("a");
  const api = iniciarMovimiento(configurar(perfil, "caja"));
  api.actualizar();
  api.irA(1500, { inmediato: true });
  await espera(30);
  let visto = 0;
  await api.navegar(0, {
    cambiar: () => { vista.innerHTML = vistaHtml("b"); },
    montar: () => api.añadir(() => { ScrollTrigger.create({ trigger: "#meta-b", start: "top 90%", once: true, onEnter: () => visto++ }); }),
  });
  await espera(40);
  afirma(visto === 0 && document.querySelector("#caja").scrollTop === 0, `${perfil}: disparador gastado con el scroll viejo (${visto})`);
  api.salir();
  vista.innerHTML = "";
}

// isScrolling no queda en "native" tras los refresh que la aplicación no pide: reducido y redimensionar
{
  const vista = document.querySelector("#vista-ventana");
  const k = "s";
  vista.innerHTML = vistaHtml(k);
  const api = iniciarMovimiento(configurar("gsap+lenis", "ventana"));
  api.añadir(() => { gsap.to(`#fijo-${k}`, { x: 5, scrollTrigger: { trigger: `#fijo-${k}`, pin: true, start: "top top", end: "+=300", scrub: true } }); });
  api.actualizar();
  api.irA(1500, { inmediato: true });
  await espera(60);
  // El evento scroll tardío de Chrome no se reproduce aquí, y el temporizador de rAF puede adelantarlo: se fija el estado
  // que deja, y se comprueba que cada refresh lo devuelve al reposo. Con rueda real: laboratorio e16
  const colgar = () => { api.lenis.isScrolling = "native"; };
  const enReposo = (texto) => afirma(api.lenis.isScrolling === false && !document.documentElement.classList.contains("lenis-scrolling"), `${texto}: ${api.lenis.isScrolling}`);
  colgar();
  api.fijarReducido(true);
  await hasta(() => !api.lenis.isScrolling); // si el scroll reciente lo difiere, ScrollTrigger refresca al terminar
  enReposo("tras fijarReducido(true)");
  colgar();
  api.fijarReducido(false);
  await hasta(() => !api.lenis.isScrolling);
  enReposo("tras fijarReducido(false)");
  const y = window.scrollY;
  colgar();
  ScrollTrigger.refresh();
  enReposo("tras un refresh ajeno");
  colgar();
  window.dispatchEvent(new Event("resize"));
  await hasta(() => !api.lenis.isScrolling); // ScrollTrigger espera 200 ms antes de refrescar al redimensionar
  enReposo("tras redimensionar");
  afirma(cerca(window.scrollY, y), `el refresh no mueve: ${y} ${window.scrollY}`);
  api.lenis.scrollTo(0, { duration: 3, force: true });
  await espera(40);
  ScrollTrigger.refresh();
  afirma(api.lenis.isScrolling === "smooth", `refresh en plena animación: ${api.lenis.isScrolling}`);
  api.salir();
  document.documentElement.scrollTop = 0;
  vista.innerHTML = "";
}

// Un refresh en reposo con el scroll todavía sin avisar conserva la posición real: lenis.scroll puede ir por detrás
{
  const vista = document.querySelector("#vista-ventana");
  vista.innerHTML = vistaHtml("a");
  const api = iniciarMovimiento(configurar("gsap+lenis", "ventana"));
  api.añadir(() => { ScrollTrigger.create({ trigger: "#fijo-a", start: "top top", end: "+=300" }); });
  api.irA(300, { inmediato: true });
  await espera(40);
  document.documentElement.scrollTop = 700; // lo que hace el navegador al restaurar: sin evento todavía
  ScrollTrigger.refresh();
  afirma(cerca(window.scrollY, 700), "refresh con la posición sin avisar: " + window.scrollY);
  api.salir();
  document.documentElement.scrollTop = 0;
  vista.innerHTML = "";
}

// Anclas: dueño por perfil. Las ids se montan al vuelo: el arnés crea un elemento por cada selector literal
const claveAncla = "ancla";
const destinoAncla = `#meta-${claveAncla}`;
const nuevoEnlace = (href) => {
  const a = document.createElement("a");
  a.setAttribute("href", href);
  a.textContent = "ir";
  document.querySelector("#contenido").prepend(a);
  return a;
};
async function pulsarAncla(perfil, extra = {}) {
  document.querySelector("#vista-ventana").innerHTML = vistaHtml(claveAncla);
  const a = nuevoEnlace(destinoAncla);
  const api = iniciarMovimiento({ ...configurar(perfil, "ventana"), ...extra });
  await espera(40);
  a.click();
  await espera(120); // un ancla nativa ya habría saltado; la animación, de 1 s, se comprueba en el laboratorio e16
  // Con ScrollSmoother, irA anima un objeto propio (O33): se ve en la ventana, a medio camino
  const yendo = window.scrollY;
  const animando = api.smoother ? Number(yendo > 0 && yendo < 500) : gsap.getTweensOf(window).length;
  if (api.smoother) api.irA(yendo, { inmediato: true });
  gsap.killTweensOf(window);
  return { animando, yendo, marco: document.querySelector("#envoltura").scrollTop, api, a };
}
const cerrarAncla = async ({ api, a }) => {
  api.salir();
  a.remove();
  document.documentElement.scrollTop = 0;
  document.querySelector("#envoltura").scrollTop = 0;
  document.querySelector("#vista-ventana").innerHTML = "";
  history.replaceState(null, "", location.pathname + location.search);
  await espera(30);
};
{
  const porDefecto = iniciarMovimiento(configurar("lenis", "ventana"));
  afirma(porDefecto.lenis.options.anchors === true, "anchors activo en lenis");
  porDefecto.salir();
  const combinado = iniciarMovimiento(configurar("gsap+lenis", "ventana"));
  afirma(combinado.lenis.options.anchors === true, "anchors activo en gsap+lenis");
  combinado.salir();
  const sinAnclas = iniciarMovimiento(configurar("lenis", "ventana", { lenis: { anchors: false } }));
  afirma(sinAnclas.lenis.options.anchors === false, "opciones.lenis.anchors: false");
  sinAnclas.salir();
  const conOpciones = iniciarMovimiento(configurar("gsap+lenis", "ventana", { lenis: { anchors: { offset: -60 } } }));
  afirma(conOpciones.lenis.options.anchors?.offset === -60, "opciones.lenis.anchors con objeto");
  conOpciones.salir();

  // ScrollSmoother: el ancla pasa por irA. Una nativa desplaza el wrapper con smoother.scrollTop() en 0
  const sm = await pulsarAncla("gsap-smoother");
  afirma(sm.marco === 0, "ancla en gsap-smoother: wrapper " + sm.marco);
  afirma(sm.animando === 1, "ancla en gsap-smoother: irA anima " + sm.animando);
  afirma(location.hash === destinoAncla, "ancla en gsap-smoother: la dirección conserva el ancla " + location.hash);
  await cerrarAncla(sm);
  const animar = await pulsarAncla("gsap");
  afirma(animar.animando === 1, "ancla en gsap con plugin: irA anima " + animar.animando);
  await cerrarAncla(animar);

  // Con ScrollToPlugin, irA anima; sin él, el navegador salta, y la plantilla no interviene
  for (const [extra, intercepta] of [[{}, true], [{ ScrollToPlugin: undefined }, false]]) {
    document.querySelector("#vista-ventana").innerHTML = vistaHtml(claveAncla);
    const a = nuevoEnlace(destinoAncla);
    const api = iniciarMovimiento({ ...configurar("gsap", "ventana"), ...extra });
    let prevenido = null;
    const mirar = (e) => { prevenido = e.defaultPrevented; e.preventDefault(); };
    window.addEventListener("click", mirar);
    a.click();
    window.removeEventListener("click", mirar);
    afirma(prevenido === intercepta, `gsap ${intercepta ? "con" : "sin"} plugin: ${prevenido}`);
    await cerrarAncla({ api, a });
  }

  // Lo que no es un ancla de esta página no se intercepta, y tras salir no queda oyente
  document.querySelector("#vista-ventana").innerHTML = vistaHtml(claveAncla);
  const sigue = iniciarMovimiento(configurar("gsap", "ventana"));
  const veredicto = (href, attrs = {}, teclas = {}) => {
    const a = nuevoEnlace(href);
    Object.entries(attrs).forEach(([k, v]) => a.setAttribute(k, v));
    let prevenido = null;
    const mirar = (e) => { prevenido = e.defaultPrevented; e.preventDefault(); };
    window.addEventListener("click", mirar);
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...teclas }));
    window.removeEventListener("click", mirar);
    a.remove();
    return prevenido;
  };
  afirma(veredicto(destinoAncla) === true, "ancla de esta página");
  afirma(veredicto("#no-" + "esta") === false, "ancla sin destino");
  afirma(veredicto("otra.html" + destinoAncla) === false, "ancla de otra página");
  afirma(veredicto(destinoAncla, { target: "_blank" }) === false, "ancla en otra pestaña");
  afirma(veredicto(destinoAncla, {}, { ctrlKey: true }) === false, "ancla con Ctrl");
  sigue.salir();
  afirma(veredicto(destinoAncla) === false, "ancla tras salir");

  // En un contenedor, solo lo que está dentro: el resto de la página es del navegador
  const claveCaja = "cajon";
  document.querySelector("#vista-caja").innerHTML = vistaHtml(claveCaja);
  const enCaja = iniciarMovimiento(configurar("gsap", "caja"));
  afirma(veredicto(`#meta-${claveCaja}`) === true, "ancla dentro del contenedor");
  afirma(veredicto(destinoAncla) === false, "ancla fuera del contenedor");
  enCaja.salir();
  gsap.killTweensOf(document.querySelector("#caja"));
  document.querySelector("#caja").scrollTop = 0;
  document.querySelector("#vista-caja").innerHTML = "";
  history.replaceState(null, "", location.pathname + location.search);
  document.querySelector("#vista-ventana").innerHTML = "";
  gsap.killTweensOf(window);
  document.documentElement.scrollTop = 0;
}

// history.scrollRestoration se sostiene: ScrollTrigger lo devuelve en cada refresh
for (const perfil of ["gsap", "gsap+lenis", "gsap-smoother"]) {
  const vista = document.querySelector("#vista-ventana");
  vista.innerHTML = vistaHtml("a");
  const previa = history.scrollRestoration;
  const api = iniciarMovimiento(configurar(perfil, "ventana"));
  await api.navegar(0);
  afirma(history.scrollRestoration === "manual", `${perfil}: tras navegar ${history.scrollRestoration}`);
  api.actualizar();
  afirma(history.scrollRestoration === "manual", `${perfil}: tras actualizar ${history.scrollRestoration}`);
  ScrollTrigger.refresh();
  afirma(history.scrollRestoration === "manual", `${perfil}: tras un refresh ajeno ${history.scrollRestoration}`);
  api.salir();
  afirma(history.scrollRestoration === previa, `${perfil}: salir devuelve ${history.scrollRestoration}`);
  vista.innerHTML = "";
}

// autoRaf: false solo vale en el perfil lenis, y entonces el reloj es del motor: una llamada por fotograma, de nadie más
{
  const vista = document.querySelector("#vista-ventana");
  vista.innerHTML = vistaHtml("a");
  const rafOriginal = Lenis.prototype.raf;
  let llamadas = 0;
  Lenis.prototype.raf = function (t) { llamadas++; return rafOriginal.call(this, t); };
  const api = iniciarMovimiento(configurar("lenis", "ventana", { lenis: { autoRaf: false, lerp: 0.5 } }));
  afirma(api.lenis.options.autoRaf === false, "lenis: autoRaf false respetado");
  await espera(80);
  afirma(llamadas === 0, "lenis sin autoRaf: nadie más llama a raf: " + llamadas);
  rueda(400);
  await espera(120);
  afirma(window.scrollY === 0, "sin el motor no avanza: " + window.scrollY);
  let vivo = true;
  const motor = (t) => { if (!vivo) return; api.lenis.raf(t); requestAnimationFrame(motor); };
  requestAnimationFrame(motor);
  await hasta(() => window.scrollY > 390, 800);
  vivo = false;
  afirma(cerca(window.scrollY, 400, 10), "el motor lo mueve: " + window.scrollY);
  api.salir();
  Lenis.prototype.raf = rafOriginal;
  document.documentElement.scrollTop = 0;
  await espera(30);

  // true o nada en lenis: su reloj; en gsap+lenis, false no avisa y true se ignora con aviso
  for (const [perfil, autoRaf, reloj, aviso] of [["lenis", true, true, false], ["lenis", undefined, true, false], ["gsap+lenis", false, false, false], ["gsap+lenis", true, false, true]]) {
    avisos = [];
    const a = iniciarMovimiento(configurar(perfil, "ventana", { lenis: autoRaf === undefined ? {} : { autoRaf } }));
    afirma(a.lenis.options.autoRaf === reloj, `${perfil} con autoRaf ${autoRaf}: ${a.lenis.options.autoRaf}`);
    afirma(avisos.some((x) => x.regla === "O01") === aviso, `${perfil} con autoRaf ${autoRaf}: avisos ${JSON.stringify(avisos)}`);
    a.salir();
  }
  vista.innerHTML = "";
}

// Un perfil solo pide lo que usa
const sinNada = iniciarMovimiento({ perfil: "ninguno" });
sinNada.salir();
const soloLenis = iniciarMovimiento({ perfil: "lenis", Lenis });
afirma(soloLenis.lenis.options.autoRaf === true, "lenis lleva su propio reloj");
soloLenis.salir();
let error = "";
try { iniciarMovimiento({ perfil: "gsap+lenis", gsap }); } catch (e) { error = e.message; }
afirma(/ScrollTrigger, Lenis/.test(error), "faltan bibliotecas: " + error);
try { iniciarMovimiento({ perfil: "otro" }); } catch (e) { error = e.message; }
afirma(/perfil desconocido/.test(error), "perfil desconocido: " + error);

// Contradicciones en tiempo de ejecución
document.querySelector("#vista-ventana").innerHTML = vistaHtml("a");
const ajeno = ScrollSmoother.create({ wrapper: "#envoltura", content: "#contenido", smooth: 0.1 });
avisos = [];
let api = iniciarMovimiento(configurar("gsap+lenis", "ventana"));
afirma(avisos.some((a) => a.regla === "O03"), "ScrollSmoother con perfil Lenis: " + JSON.stringify(avisos));
api.salir();
ajeno.kill();
await espera(40);
[document.documentElement, document.body, ajeno.content(), ajeno.wrapper()].forEach((n) => n.removeAttribute("style"));
document.documentElement.removeAttribute("class");

avisos = [];
api = iniciarMovimiento(configurar("gsap+lenis", "ventana", { lenis: { autoRaf: true } }));
afirma(avisos.some((a) => a.regla === "O01"), "autoRaf con reloj externo: " + JSON.stringify(avisos));
afirma(api.lenis.options.autoRaf === false, "autoRaf se ignora");
api.lenis.options.autoRaf = true; // lo reactiva alguien después: se ve al actualizar
avisos = [];
api.actualizar();
afirma(avisos.some((a) => a.regla === "O01"), "autoRaf activado después");
api.lenis.options.autoRaf = false;
api.salir();

avisos = [];
const lenisAjena = new Lenis();
api = iniciarMovimiento(configurar("gsap+lenis", "ventana"));
afirma(avisos.some((a) => a.regla === "O02"), "dos instancias de Lenis: " + JSON.stringify(avisos));
api.salir();
lenisAjena.destroy();

avisos = [];
const primeraApi = iniciarMovimiento(configurar("lenis", "ventana"));
const segundaApi = iniciarMovimiento(configurar("lenis", "ventana"));
afirma(avisos.some((a) => a.regla === "O02"), "dos arranques en la misma raíz");
afirma(primeraApi.lenis === null && segundaApi.lenis !== null, "gana el último");
segundaApi.salir();

avisos = [];
const lenisSuelta = new Lenis();
api = iniciarMovimiento(configurar("gsap", "ventana"));
afirma(avisos.some((a) => a.regla === "O03"), "Lenis activo con perfil gsap: " + JSON.stringify(avisos));
api.salir();
lenisSuelta.destroy();

avisos = [];
ScrollTrigger.normalizeScroll(true);
api = iniciarMovimiento(configurar("gsap+lenis", "ventana"));
afirma(avisos.some((a) => a.regla === "O07"), "normalizeScroll con Lenis: " + JSON.stringify(avisos));
api.salir();
ScrollTrigger.normalizeScroll(false);

avisos = [];
document.documentElement.style.scrollSnapType = "y mandatory";
api = iniciarMovimiento(configurar("lenis", "ventana"));
afirma(avisos.some((a) => a.regla === "O11"), "scroll-snap con Lenis: " + JSON.stringify(avisos));
api.salir();
document.documentElement.removeAttribute("style");

const warnReal = console.warn;
const mensajes = [];
console.warn = (m) => mensajes.push(m);
api = iniciarMovimiento({ ...configurar("gsap+lenis", "ventana", { lenis: { autoRaf: true }, alAvisar: undefined }) });
console.warn = warnReal;
api.salir();
afirma(mensajes.some((m) => /^\[movimiento O01\]/.test(m)), "aviso por consola con id: " + mensajes);

// Movimiento reducido: una sola decisión, y todos la siguen
const consultaReal = window.matchMedia;
function simularReducido(valor) {
  const oyen = new Set();
  const consulta = { matches: valor, addEventListener: (t, f) => oyen.add(f), removeEventListener: (t, f) => oyen.delete(f),
    cambiar(v) { consulta.matches = v; oyen.forEach((f) => f({ matches: v })); }, oyen };
  window.matchMedia = (q) => (/reduced-motion/.test(q) ? consulta : consultaReal.call(window, q));
  return consulta;
}
for (const perfil of PERFILES_ORQ) {
  for (const lugar of ["ventana", "caja"]) {
    const et = `reducido ${perfil}/${lugar}: `;
    const vista = document.querySelector(lugar === "ventana" ? "#vista-ventana" : perfil === "gsap-smoother" ? "#vista-smoother" : "#vista-caja");
    const usaVentana = lugar !== "caja" || perfil === "gsap-smoother";
    const mover = usaVentana ? document.documentElement : document.querySelector("#caja");
    vista.innerHTML = vistaHtml("a");
    const antes = foto();
    const q = simularReducido(false);
    avisos = [];
    const api = iniciarMovimiento(configurar(perfil, lugar));
    const vistosReducido = [];
    api.añadir(({ reducido }) => {
      vistosReducido.push(reducido);
      if (conGsap(perfil)) gsap.set(`#fijo-a`, { x: reducido ? 0 : 20 });
    });
    afirma(api.reducido === false && vistosReducido.join() === "false", et + "arranca normal");
    await espera(30);
    q.cambiar(true); // el sistema cambia con la app en marcha
    afirma(api.reducido === true && vistosReducido.join() === "false,true", et + "repite las entradas " + vistosReducido);
    afirma(document.documentElement.getAttribute("data-movimiento") === "reducido", et + "marca para CSS");
    if (conGsap(perfil)) afirma(gsap.getProperty("#fijo-a", "x") === 0, et + "revierte y rehace");
    if (api.lenis) afirma(api.lenis.options.smoothWheel === false && api.lenis.prefersReducedMotion === true, et + "Lenis obedece");
    if (api.smoother) afirma(api.smoother === ScrollSmoother.get() || true, et + "smoother");
    await espera(30);
    let hecho = 0;
    api.irA(400, { duracion: 3, alTerminar: () => hecho++ });
    await espera(20);
    afirma(hecho === 1 && cerca(mover.scrollTop, 400), et + "irA salta " + mover.scrollTop + " " + hecho);
    api.fijarReducido(false); // interruptor propio: gana al sistema
    afirma(api.reducido === false && vistosReducido.at(-1) === false, et + "interruptor");
    if (api.lenis) afirma(api.lenis.prefersReducedMotion === false && api.lenis.options.smoothWheel === true, et + "Lenis sigue al interruptor");
    q.cambiar(false);
    q.cambiar(true);
    afirma(api.reducido === false, et + "el interruptor manda sobre el sistema");
    api.fijarReducido(null);
    afirma(api.reducido === true, et + "vuelve al sistema");
    api.salir();
    afirma(q.oyen.size === 0, et + "quita el oyente");
    window.matchMedia = consultaReal;
    mover.scrollTop = 0;
    await espera(20);
    afirma(diferencia(antes, foto()) === "", et + `residuos: ${diferencia(antes, foto())}`);
    vista.innerHTML = "";
  }
}

// Un ancla interceptada lleva el foco al destino sin saltar, y deja el atributo como estaba
for (const perfil of ["gsap", "gsap-smoother"]) {
  const et = `foco del ancla/${perfil}: `;
  const r = await pulsarAncla(perfil);
  const meta = document.querySelector(destinoAncla);
  afirma(document.activeElement === meta && meta.getAttribute("tabindex") === "-1", et + "el destino recibe el foco " + document.activeElement.id);
  afirma(r.animando === 1 && r.yendo < 500, et + "enfocar no salta " + r.yendo);
  meta.blur();
  afirma(document.activeElement !== meta, et + "pierde el foco " + document.activeElement.id);
  // Firefox no emite blur sin foco de ventana, como en este arnés. Con foco real: laboratorio e22
  if (!document.hasFocus()) meta.dispatchEvent(new FocusEvent("blur"));
  await hasta(() => !meta.hasAttribute("tabindex"), 300);
  afirma(!meta.hasAttribute("tabindex"), et + "al perder el foco retira tabindex");
  // Un destino enfocable no necesita tabindex
  meta.innerHTML = '<a id="destino-enfocable" href="/otra">x</a>';
  r.a.href = "#destino-enfocable";
  r.a.click();
  const enfocable = document.querySelector("#destino-enfocable");
  afirma(document.activeElement === enfocable && !enfocable.hasAttribute("tabindex"), et + "destino enfocable");
  enfocable.blur();
  meta.innerHTML = "";
  // salir con el foco puesto no deja el atributo
  r.a.href = destinoAncla;
  r.a.click();
  afirma(meta.getAttribute("tabindex") === "-1", et + "foco otra vez");
  r.api.salir();
  afirma(!meta.hasAttribute("tabindex"), et + "salir retira tabindex"); // antes de vaciar la vista, que emitiría blur
  await cerrarAncla(r);
}
{
  // El onFocusIn de la aplicación se respeta, salvo en el enfoque propio del ancla
  let vistos = 0;
  const r = await pulsarAncla("gsap-smoother", { opciones: { ...configurar("gsap-smoother", "ventana").opciones, smoother: { smooth: 0.1, onFocusIn: () => { vistos++; return false; } } } });
  afirma(vistos === 0, "el enfoque del ancla no llega a onFocusIn de la aplicación");
  const boton = document.createElement("button");
  document.querySelector("#vista-ventana").append(boton);
  boton.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  afirma(vistos === 1, "onFocusIn de la aplicación sigue vivo: " + vistos);
  await cerrarAncla(r);
}
{
  // Sin intercepción, la plantilla no toca el foco: lo hace el navegador
  const r = await pulsarAncla("gsap", { ScrollToPlugin: undefined });
  afirma(!document.querySelector(destinoAncla).hasAttribute("tabindex"), "ancla nativa: sin tabindex");
  await cerrarAncla(r);
}

// Retirar un pin quita su espaciador y el navegador recoloca la página: fijarReducido debe dejarla donde estaba
for (const perfil of ["gsap", "gsap+lenis", "gsap-smoother"]) {
  const et = `reducido con pin arriba/${perfil}: `;
  const vista = document.querySelector("#vista-ventana");
  vista.innerHTML = vistaHtml("p");
  const api = iniciarMovimiento(configurar(perfil, "ventana"));
  escena(api, "p", vista)();
  api.actualizar();
  await espera(perfil === "gsap-smoother" ? 560 : 40);
  api.irA(1500, { inmediato: true });
  await espera(60);
  for (const v of [true, false, true]) {
    api.fijarReducido(v);
    await espera(perfil === "gsap-smoother" ? 560 : 60); // recrea ScrollSmoother: otro tramo de arranque
    afirma(cerca(api.posicion(), 1500), et + `${v}: ${api.posicion()}`);
  }
  api.salir();
  window.scrollTo({ top: 0, behavior: "instant" });
  vista.innerHTML = "";
  await espera(20);
}

// Una rueda sobre irA con ScrollSmoother lo interrumpe, como autoKill: si no, la siguiente rueda queda desincronizada
{
  const vista = document.querySelector("#vista-ventana");
  vista.innerHTML = vistaHtml("r");
  const api = iniciarMovimiento(configurar("gsap-smoother", "ventana"));
  await espera(560);
  const ruedas = () => oyentes.filter((o) => o.d === window && o.t === "wheel").length;
  const base = ruedas();
  let hecho = 0;
  api.irA(1500, { duracion: 2, alTerminar: () => hecho++ });
  afirma(ruedas() === base + 1, "irA escucha la rueda");
  await espera(100);
  window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }));
  const parada = window.scrollY;
  await espera(100);
  afirma(cerca(window.scrollY, parada), `la rueda corta el tween: ${parada} -> ${window.scrollY}`);
  afirma(ruedas() === base, "la rueda retira su oyente");
  afirma(hecho === 0, "alTerminar no se llama si el usuario interrumpe");
  // El teclado corta igual, salvo que escriba en un campo o la tecla no desplace
  const campo = document.createElement("input");
  vista.prepend(campo);
  const teclaEn = (el, key) => el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  api.irA(1400, { duracion: 2 });
  const teclas = () => oyentes.filter((o) => o.d === window && o.t === "keydown").length;
  const conTeclado = teclas();
  teclaEn(document.body, "a");
  teclaEn(campo, "PageDown");
  await espera(100);
  const aun = window.scrollY;
  await espera(100);
  afirma(!cerca(window.scrollY, aun, 0) && teclas() === conTeclado, "una tecla ajena o en un campo no corta");
  teclaEn(document.body, "PageDown");
  const cortada = window.scrollY;
  await espera(100);
  afirma(cerca(window.scrollY, cortada) && teclas() === conTeclado - 1, `una tecla de scroll corta: ${cortada} -> ${window.scrollY}`);
  campo.remove();
  afirma(hecho === 0, "alTerminar tampoco se llama al cortar con teclado");
  api.irA(300, { duracion: 0.05, alTerminar: () => hecho++ });
  await hasta(() => hecho === 1);
  afirma(hecho === 1 && ruedas() === base, "al terminar retira su oyente: " + ruedas());
  api.irA(1000, { duracion: 2 });
  api.irA(1200, { duracion: 2 });
  afirma(ruedas() === base + 1, "un irA sobre otro no acumula oyentes: " + ruedas());
  api.salir();
  afirma(ruedas() <= base, "salir retira el oyente");
  window.scrollTo({ top: 0, behavior: "instant" });
  vista.innerHTML = "";
  await espera(20);
}

// El perfil no reescribe la aplicación: opciones de otro perfil se ignoran sin efecto
api = iniciarMovimiento({ perfil: "ninguno", opciones: { lenis: { lerp: 0.1 }, smoother: { smooth: 2 } } });
afirma(api.lenis === null && api.smoother === null, "opciones ajenas ignoradas");
api.salir();

fallos.forEach((f) => console.error(f));
// prueba: fallos.length === 0
