const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const simular = (reducido) => {
  window.matchMedia = (q) => ({ matches: reducido ? /: reduce\)/.test(q) : /no-preference/.test(q), media: q, addListener() {}, removeListener() {} });
};
const contenido = document.getElementById("contenido");
const ir = document.getElementById("ir");
const urls = [];
const r = { altas: 0, bajas: 0 };
const opciones = {
  salida: 0.05,
  entrada: 0.05,
  y: 10,
  cargar: async () => ({ html: "<h2>Nueva</h2>", titulo: "Página nueva" }),
  registrar: (url) => urls.push(url),
  alCambiar: (raiz) => {
    r.altas++;
    r.raizNueva = raiz.textContent === "Nueva";
    return () => r.bajas++;
  },
};

simular(false);
const limpiar = transicionPaginas("#contenido", opciones);
await espera(30); // el primer tick absorbe el tiempo de carga
ir.click();
await espera(30);
r.saliendo = gsap.getProperty(contenido, "opacity") < 1 && contenido.textContent === "Portada";
await espera(150);
r.contenidoNuevo = contenido.textContent === "Nueva" && document.title === "Página nueva";
r.historial = urls.length === 1 && urls[0].includes("pagina=2");
r.foco = document.activeElement === contenido;
r.visible = gsap.getProperty(contenido, "opacity") === 1 && gsap.getProperty(contenido, "y") === 0;
window.dispatchEvent(new PopStateEvent("popstate"));
await espera(150);
r.alVolverNoEmpuja = urls.length === 1 && r.altas === 2 && r.bajas === 1;
limpiar();
r.bajaAlLimpiar = r.bajas === 2;
r.sinEstilos = contenido.style.cssText === "" && !contenido.hasAttribute("tabindex");
contenido.textContent = "Portada";
ir.addEventListener("click", (e) => e.preventDefault());
ir.click();
await espera(10);
r.sinListeners = contenido.textContent === "Portada";
r.sinTriggers = ScrollTrigger.getAll().length === 0;

simular(true);
const limpiarReducido = transicionPaginas("#contenido", { ...opciones, alCambiar: undefined });
window.dispatchEvent(new PopStateEvent("popstate"));
await espera(30);
r.reducido = contenido.textContent === "Nueva" && gsap.getProperty(contenido, "y") === 0;
limpiarReducido();
r.reducidoLimpio = contenido.style.cssText === "";

// Dentro de Shadow DOM real: el enlace y el contenedor viven en la sombra.
simular(false);
const anfitrion = document.createElement("div");
document.body.append(anfitrion);
const sombra = anfitrion.attachShadow({ mode: "open" });
sombra.innerHTML = '<a data-transicion href="?pagina=3"><span>Ir</span></a><main class="dentro">Inicio</main>';
const dentro = sombra.querySelector(".dentro");
const urlsSombra = [];
const limpiarSombra = transicionPaginas(dentro, {
  salida: 0.02,
  entrada: 0.02,
  cargar: async () => "Otra",
  registrar: (url) => urlsSombra.push(url),
});
await espera(30);
sombra.querySelector("span").click();
await espera(120);
r.sombraNavega = dentro.textContent === "Otra" && urlsSombra.length === 1 && urlsSombra[0].includes("pagina=3");
r.sombraVisible = gsap.getProperty(dentro, "opacity") === 1;
r.sombraFoco = sombra.activeElement === dentro;
limpiarSombra();
r.sombraLimpia = dentro.style.cssText === "" && !dentro.hasAttribute("tabindex");
anfitrion.remove();
// prueba: r.saliendo
// prueba: r.contenidoNuevo
// prueba: r.historial
// prueba: r.foco
// prueba: r.visible
// prueba: r.alVolverNoEmpuja
// prueba: r.bajaAlLimpiar
// prueba: r.sinEstilos
// prueba: r.sinListeners
// prueba: r.sinTriggers
// prueba: r.reducido
// prueba: r.reducidoLimpio
// prueba: r.sombraNavega
// prueba: r.sombraVisible
// prueba: r.sombraFoco
// prueba: r.sombraLimpia
// prueba: ScrollTrigger.getAll().length === 0
