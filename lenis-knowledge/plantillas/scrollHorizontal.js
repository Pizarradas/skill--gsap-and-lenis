import Lenis from "lenis";

/**
 * Convierte el scroll vertical en avance horizontal dentro de una sección, con `position: sticky`
 * y `transform`, sin duplicar nodos. Con movimiento reducido deja un carrusel nativo.
 *
 * Requiere una pista con `display: flex` y `width: max-content`.
 *
 * @param {string|HTMLElement} objetivo La sección. En Shadow DOM, pasa el elemento.
 * @param {object} [opciones]
 * @param {Lenis} [opciones.lenis] Instancia existente. Sin ella se crea una y se destruye al limpiar.
 * @param {HTMLElement} [opciones.pista] Elemento que se traslada. Por defecto, el primer hijo.
 * @returns {(() => void) & { actualizar: () => void }} Limpieza. `limpiar.actualizar()` mide
 *   de nuevo si cambia el ancho de la pista; un `ResizeObserver` ya lo hace por sí solo.
 */
export function scrollHorizontal(objetivo, opciones = {}) {
  const seccion = typeof objetivo === "string" ? document.querySelector(objetivo) : objetivo;
  if (!seccion) throw new TypeError("scrollHorizontal: objetivo no encontrado");

  const { lenis: externa, pista = seccion.firstElementChild } = opciones;
  const lenis = externa ?? new Lenis({ autoRaf: true });
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
  const previo = {
    alto: seccion.style.height,
    desborde: seccion.style.overflowX,
    posicion: pista.style.position,
    tope: pista.style.top,
    transformacion: pista.style.transform,
  };
  let inicio = 0;
  let recorrido = 0;

  function restaurar() {
    seccion.style.height = previo.alto;
    seccion.style.overflowX = previo.desborde;
    pista.style.position = previo.posicion;
    pista.style.top = previo.tope;
    pista.style.transform = previo.transformacion;
  }

  function pintar() {
    if (reducido.matches || recorrido <= 0) return;
    const avance = Math.min(1, Math.max(0, (lenis.scroll - inicio) / recorrido));
    pista.style.transform = `translate3d(${(-avance * recorrido).toFixed(2)}px, 0, 0)`;
  }

  function medir() {
    restaurar();
    if (reducido.matches) {
      seccion.style.overflowX = "auto";
      lenis.resize();
      return;
    }
    function ajustarRecorrido() {
      recorrido = Math.max(0, pista.scrollWidth - seccion.clientWidth);
      seccion.style.height = `${recorrido + lenis.dimensions.height}px`;
    }
    seccion.style.overflowX = "clip"; // hidden crearía un contenedor de scroll y anularía sticky
    pista.style.position = "sticky";
    pista.style.top = "0";
    lenis.resize(); // sin el recorte, la pista pudo crear una barra horizontal: la altura medida sería menor
    ajustarRecorrido();
    ajustarRecorrido(); // la nueva altura puede hacer aparecer una barra, que estrecha la sección
    const techo = lenis.options.wrapper === window ? 0 : lenis.rootElement.getBoundingClientRect().top;
    inicio = seccion.getBoundingClientRect().top - techo + lenis.actualScroll;
    lenis.resize(); // la sección ha cambiado de altura, y resize() emite scroll: pinta
    pintar();
  }

  function alEnfocar(evento) {
    if (reducido.matches) return;
    const distancia = evento.target.getBoundingClientRect().left - pista.getBoundingClientRect().left;
    lenis.scrollTo(inicio + Math.min(distancia, recorrido));
  }

  let ancho = pista.scrollWidth;
  const observador = new ResizeObserver(() => {
    if (pista.scrollWidth === ancho) return;
    ancho = pista.scrollWidth;
    medir();
  });

  const quitar = lenis.on("scroll", pintar);
  reducido.addEventListener("change", medir);
  window.addEventListener("resize", medir);
  pista.addEventListener("focusin", alEnfocar);
  observador.observe(pista);
  // El contenedor cambia de tamaño sin que la ventana lo haga
  const raizLenis = lenis.rootElement;
  let tamano = `${raizLenis.clientWidth}x${raizLenis.clientHeight}`;
  const observadorRaiz = new ResizeObserver(() => {
    const actual = `${raizLenis.clientWidth}x${raizLenis.clientHeight}`;
    if (actual === tamano) return;
    tamano = actual;
    medir();
  });
  if (lenis.options.wrapper !== window) observadorRaiz.observe(raizLenis);
  medir();

  let hecho = false;
  function limpiar() {
    if (hecho) return;
    hecho = true;
    quitar();
    observador.disconnect();
    observadorRaiz.disconnect();
    reducido.removeEventListener("change", medir);
    window.removeEventListener("resize", medir);
    pista.removeEventListener("focusin", alEnfocar);
    restaurar();
    if (externa) lenis.resize();
    else lenis.destroy();
  }
  limpiar.actualizar = () => {
    if (hecho) return;
    ancho = pista.scrollWidth;
    medir();
  };
  return limpiar;
}
