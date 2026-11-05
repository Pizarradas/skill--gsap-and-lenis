/* Generado por herramientas/plantillas_globales.py desde plantillas/seccionesSnap.js. No lo edites a mano.
   Carga antes, con <script>: dist/lenis.min.js, dist/lenis-snap.min.js. Expone Plantillas.seccionesSnap. */
(function () {
  "use strict";

  /**
   * Ajusta el scroll a secciones con `lenis/snap`. Con movimiento reducido el ajuste
   * se detiene: `scrollTo` sería un salto brusco al acabar cada gesto.
   *
   * En eje horizontal o dentro de un contenedor registra posiciones calculadas, porque
   * en esos casos `addElements` da valores incorrectos (ver la receta).
   *
   * @param {string|HTMLElement|ArrayLike<HTMLElement>|(() => ArrayLike<HTMLElement>)} objetivo
   *   Un elemento (sus hijos son las secciones), una lista, un selector o una función que devuelva la lista.
   *   En Shadow DOM, pasa elementos.
   * @param {object} [opciones]
   * @param {Lenis} [opciones.lenis] Instancia existente. Sin ella se crea una y se destruye al limpiar.
   * @param {"mandatory"|"proximity"|"lock"} [opciones.tipo="proximity"]
   * @param {string|string[]} [opciones.alinear="start"] Solo sin contenedor y en vertical.
   * @param {number} [opciones.espera=500] Pausa tras el último gesto, en ms (`debounce`).
   * @param {number|string} [opciones.umbral] `distanceThreshold`.
   * @param {number} [opciones.duracion] Duración del ajuste, en segundos.
   * @param {(seccion: {index?: number, value: number}) => void} [opciones.alAjustar] Al completar un ajuste.
   * @returns {(() => void) & { actualizar: () => void, snap: () => Snap }} Limpieza.
   *   `limpiar.actualizar()` relee las secciones; llámalo si la lista o sus posiciones cambian.
   */
  function seccionesSnap(objetivo, opciones = {}) {
    const { lenis: externa, tipo = "proximity", alinear = "start", espera, umbral, duracion, alAjustar } = opciones;

    function secciones() {
      const fuente = typeof objetivo === "function" ? objetivo() : objetivo;
      if (typeof fuente === "string") return [...document.querySelectorAll(fuente)];
      return [...(fuente instanceof Element ? fuente.children : fuente)];
    }

    const lenis = externa ?? new Lenis({ autoRaf: true });
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
    const calculadas = lenis.isHorizontal || lenis.options.wrapper !== window;
    let snap;

    function crear() {
      snap = new Snap(lenis, {
        type: tipo,
        debounce: espera,
        distanceThreshold: umbral,
        duration: duracion,
        onSnapComplete: alAjustar,
      });
      const elementos = secciones();
      if (calculadas) {
        const caja = lenis.rootElement.getBoundingClientRect();
        for (const elemento of elementos) {
          const rect = elemento.getBoundingClientRect();
          const posicion = lenis.isHorizontal ? rect.left - caja.left : rect.top - caja.top;
          snap.add(Math.ceil(posicion + lenis.actualScroll));
        }
      } else {
        snap.addElements(elementos, { align: alinear });
      }
      if (reducido.matches) snap.stop();
    }

    function destruir() {
      // destroy() no cancela la espera pendiente: sin stop(), el ajuste aún podría ejecutarse
      snap.stop();
      snap.destroy();
    }

    function alCambiarPreferencia() {
      if (reducido.matches) snap.stop();
      else snap.start();
    }

    function actualizar() {
      if (hecho) return;
      lenis.resize();
      destruir();
      crear();
    }

    let hecho = false;
    crear();
    reducido.addEventListener("change", alCambiarPreferencia);
    if (calculadas) window.addEventListener("resize", actualizar);
    // El contenedor cambia de tamaño sin que la ventana lo haga
    const raizLenis = lenis.rootElement;
    let tamano = `${raizLenis.clientWidth}x${raizLenis.clientHeight}`;
    const observadorRaiz = new ResizeObserver(() => {
      const actual = `${raizLenis.clientWidth}x${raizLenis.clientHeight}`;
      if (actual === tamano) return;
      tamano = actual;
      actualizar();
    });
    if (lenis.options.wrapper !== window) observadorRaiz.observe(raizLenis);

    function limpiar() {
      if (hecho) return;
      hecho = true;
      reducido.removeEventListener("change", alCambiarPreferencia);
      window.removeEventListener("resize", actualizar);
      observadorRaiz.disconnect();
      destruir();
      if (!externa) lenis.destroy();
    }
    limpiar.actualizar = actualizar;
    limpiar.snap = () => snap;
    return limpiar;
  }

  (window.Plantillas = window.Plantillas || {}).seccionesSnap = seccionesSnap;
})();
