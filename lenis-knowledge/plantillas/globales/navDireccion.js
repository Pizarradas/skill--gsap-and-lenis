/* Generado por herramientas/plantillas_globales.py desde plantillas/navDireccion.js. No lo edites a mano.
   Carga antes, con <script>: dist/lenis.min.js. Expone Plantillas.navDireccion. */
(function () {
  "use strict";

  /**
   * Oculta una cabecera al bajar y la muestra al subir. Solo gestiona una clase:
   * la transición es del CSS, donde se anula con `prefers-reduced-motion`.
   *
   * Mide posiciones, no `lenis.direction`: un umbral evita parpadeos con gestos cortos.
   * La cabecera vuelve a mostrarse si recibe el foco.
   *
   * @param {string|HTMLElement} objetivo La cabecera. En Shadow DOM, pasa el elemento.
   * @param {object} [opciones]
   * @param {Lenis} [opciones.lenis] Instancia existente. Sin ella se crea una y se destruye al limpiar.
   * @param {string} [opciones.clase="nav-oculta"] Clase que se añade al ocultar.
   * @param {number} [opciones.umbral=8] Píxeles de recorrido antes de cambiar de estado.
   * @param {number} [opciones.margen=80] Por encima de este scroll siempre está visible.
   * @returns {() => void} Limpieza. Si cambia la cabecera, limpia y llama de nuevo.
   */
  function navDireccion(objetivo, opciones = {}) {
    const nav = typeof objetivo === "string" ? document.querySelector(objetivo) : objetivo;
    if (!nav) throw new TypeError("navDireccion: objetivo no encontrado");

    const { lenis: externa, clase = "nav-oculta", umbral = 8, margen = 80 } = opciones;
    const lenis = externa ?? new Lenis({ autoRaf: true });
    let referencia = lenis.scroll;
    let conFoco = false;

    function revisar() {
      const actual = lenis.scroll;
      if (actual <= margen) {
        nav.classList.remove(clase);
        referencia = actual;
        return;
      }
      const recorrido = actual - referencia;
      if (Math.abs(recorrido) < umbral) return;
      nav.classList.toggle(clase, recorrido > 0 && !conFoco);
      referencia = actual;
    }

    function alEntrarFoco() {
      conFoco = true;
      nav.classList.remove(clase);
    }
    function alSalirFoco() {
      // También salta al perder el foco la ventana; entonces el elemento sigue activo
      conFoco = nav.contains(nav.getRootNode().activeElement);
    }

    const quitar = lenis.on("scroll", revisar);
    nav.addEventListener("focusin", alEntrarFoco);
    nav.addEventListener("focusout", alSalirFoco);

    let hecho = false;
    return function limpiar() {
      if (hecho) return;
      hecho = true;
      quitar();
      nav.removeEventListener("focusin", alEntrarFoco);
      nav.removeEventListener("focusout", alSalirFoco);
      nav.classList.remove(clase);
      if (!externa) lenis.destroy();
    };
  }

  (window.Plantillas = window.Plantillas || {}).navDireccion = navDireccion;
})();
