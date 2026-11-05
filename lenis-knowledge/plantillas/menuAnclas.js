import Lenis from "lenis";

/**
 * Menú de enlaces internos: desplaza con Lenis, mueve el foco al destino, actualiza
 * la URL y marca con `aria-current` la sección visible. Busca cada destino en la raíz del
 * menú y, si no está, en las raíces que la contienen: un menú en Shadow DOM alcanza secciones
 * de fuera, cosa que `lenis.scrollTo("#id")` no hace dentro de una sombra. Hacia dentro no busca:
 * un menú fuera no ve secciones dentro de una sombra.
 *
 * Usa delegación: los enlaces y secciones que aparezcan después ya cuentan.
 *
 * @param {string|HTMLElement} objetivo El contenedor de los enlaces. En Shadow DOM, pasa el elemento.
 * @param {object} [opciones]
 * @param {Lenis} [opciones.lenis] Instancia existente. Sin ella se crea una y se destruye al limpiar.
 * @param {number} [opciones.desplazamiento=0] `offset` de `scrollTo`; negativo para dejar sitio a una cabecera.
 * @param {number} [opciones.duracion] Duración en segundos; sin ella usa la de la instancia.
 * @param {boolean} [opciones.actualizarUrl=true] Añade el hash al historial.
 * @param {number} [opciones.linea=0.33] Fracción de la altura visible que decide la sección activa.
 * @returns {(() => void) & { actualizar: () => void }} Limpieza. `limpiar.actualizar()` vuelve a marcar.
 */
export function menuAnclas(objetivo, opciones = {}) {
  const menu = typeof objetivo === "string" ? document.querySelector(objetivo) : objetivo;
  if (!menu) throw new TypeError("menuAnclas: objetivo no encontrado");

  const { lenis: externa, desplazamiento = 0, duracion, actualizarUrl = true, linea = 0.33 } = opciones;
  const lenis = externa ?? new Lenis({ autoRaf: true });
  const temporales = new Set();
  let marcado = null;

  function destinoDe(enlace) {
    if (enlace.pathname !== location.pathname || enlace.search !== location.search || !enlace.hash) return null;
    const id = decodeURIComponent(enlace.hash.slice(1));
    // getRootNode() acaba en document, que no tiene host
    for (let nodo = enlace.getRootNode(); nodo; nodo = nodo.host?.getRootNode()) {
      const destino = nodo.getElementById(id);
      if (destino) return destino;
    }
    return null;
  }

  function enfocar(destino) {
    if (!destino.hasAttribute("tabindex")) {
      destino.setAttribute("tabindex", "-1");
      temporales.add(destino);
      destino.addEventListener("blur", alPerderFoco);
    }
    destino.focus({ preventScroll: true });
  }

  function alPulsar(evento) {
    if (evento.defaultPrevented || evento.button !== 0) return;
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    // composedPath() ve el enlace real aunque esté en la sombra de un hijo del menú
    const camino = evento.composedPath();
    const enlace = camino.slice(0, camino.indexOf(menu)).find((nodo) => nodo.matches?.("a[href]"));
    const destino = enlace ? destinoDe(enlace) : null;
    if (!destino) return;
    evento.preventDefault();
    lenis.scrollTo(destino, { offset: desplazamiento, duration: duracion });
    enfocar(destino);
    if (actualizarUrl) history.pushState(null, "", enlace.hash);
  }

  function retirarTabindex(destino) {
    temporales.delete(destino);
    destino.removeEventListener("blur", alPerderFoco);
    destino.removeAttribute("tabindex");
  }

  function alPerderFoco(evento) {
    // También salta al perder el foco la ventana; entonces el destino sigue activo
    const destino = evento.currentTarget;
    if (destino !== destino.getRootNode().activeElement) retirarTabindex(destino);
  }

  function marcar() {
    const techo = lenis.options.wrapper === window ? 0 : lenis.rootElement.getBoundingClientRect().top;
    const limite = techo + lenis.dimensions.height * linea;
    const validos = [...menu.querySelectorAll("a[href]")].filter(destinoDe);
    let activo = null;
    let mejor = -Infinity;
    for (const enlace of validos) {
      const tope = destinoDe(enlace).getBoundingClientRect().top - limite;
      if (tope <= 0 && tope > mejor) {
        mejor = tope;
        activo = enlace;
      }
    }
    // La última sección puede no llegar nunca a la línea
    if (lenis.limit > 0 && lenis.scroll >= lenis.limit - 1) activo = validos.at(-1) ?? activo;
    if (activo === marcado) return;
    marcado?.removeAttribute("aria-current");
    activo?.setAttribute("aria-current", "location");
    marcado = activo;
  }

  menu.addEventListener("click", alPulsar);
  const quitar = lenis.on("scroll", marcar);
  marcar();

  let hecho = false;
  function limpiar() {
    if (hecho) return;
    hecho = true;
    quitar();
    menu.removeEventListener("click", alPulsar);
    marcado?.removeAttribute("aria-current");
    for (const destino of [...temporales]) retirarTabindex(destino);
    if (!externa) lenis.destroy();
  }
  limpiar.actualizar = () => {
    if (!hecho) marcar();
  };
  return limpiar;
}
