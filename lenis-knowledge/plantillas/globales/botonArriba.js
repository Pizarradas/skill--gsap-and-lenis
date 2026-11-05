/* Generado por herramientas/plantillas_globales.py desde plantillas/botonArriba.js. No lo edites a mano.
   Carga antes, con <script>: dist/lenis.min.js. Expone Plantillas.botonArriba. */
(function () {
  "use strict";

  /**
   * Botón de volver arriba: aparece pasado un umbral, sube con Lenis y mueve el foco
   * antes de que el botón se oculte. Con movimiento reducido el salto es inmediato,
   * porque Lenis convierte así los `scrollTo`.
   *
   * @param {string|HTMLElement} objetivo El botón. En Shadow DOM, pasa el elemento.
   * @param {object} [opciones]
   * @param {Lenis} [opciones.lenis] Instancia existente. Sin ella se crea una y se destruye al limpiar.
   * @param {number} [opciones.umbral=600] Píxeles de scroll a partir de los que se muestra.
   * @param {HTMLElement} [opciones.foco] Destino del foco. Por defecto, el primer `main` de su raíz.
   * @param {number} [opciones.duracion] Duración en segundos; sin ella usa la de la instancia.
   * @returns {() => void} Limpieza. El contenido no le afecta: lee el scroll en cada evento.
   */
  function botonArriba(objetivo, opciones = {}) {
    const boton = typeof objetivo === "string" ? document.querySelector(objetivo) : objetivo;
    if (!boton) throw new TypeError("botonArriba: objetivo no encontrado");

    const { lenis: externa, umbral = 600, foco, duracion } = opciones;
    const lenis = externa ?? new Lenis({ autoRaf: true });
    const estabaOculto = boton.hidden;
    const raiz = boton.getRootNode();
    const destino = foco ?? raiz.querySelector("main");
    let tabindexTemporal = false;

    function revisar() {
      boton.hidden = lenis.scroll < umbral;
    }

    function quitarTabindex() {
      if (!tabindexTemporal) return;
      tabindexTemporal = false;
      destino.removeEventListener("blur", alPerderFoco);
      destino.removeAttribute("tabindex");
    }

    function alPerderFoco() {
      // También salta al perder el foco la ventana; entonces el destino sigue activo
      if (destino !== raiz.activeElement) quitarTabindex();
    }

    function alPulsar() {
      if (destino) {
        if (!destino.hasAttribute("tabindex")) {
          destino.setAttribute("tabindex", "-1");
          tabindexTemporal = true;
          destino.addEventListener("blur", alPerderFoco);
        }
        destino.focus({ preventScroll: true });
      }
      lenis.scrollTo(0, { duration: duracion });
    }

    const quitar = lenis.on("scroll", revisar);
    boton.addEventListener("click", alPulsar);
    revisar();

    let hecho = false;
    return function limpiar() {
      if (hecho) return;
      hecho = true;
      quitar();
      boton.removeEventListener("click", alPulsar);
      quitarTabindex();
      boton.hidden = estabaOculto;
      if (!externa) lenis.destroy();
    };
  }

  (window.Plantillas = window.Plantillas || {}).botonArriba = botonArriba;
})();
