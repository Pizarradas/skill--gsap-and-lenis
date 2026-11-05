/* Generado por herramientas/plantillas_globales.py desde plantillas/navegacionScroll.js. No lo edites a mano.
   Carga antes, con <script>: dist/lenis.min.js. Expone Plantillas.navegacionScroll. */
(function () {
  "use strict";

  /**
   * Coloca el scroll al cambiar de vista sin recargar: arriba al avanzar, en la posición
   * guardada al volver atrás, o en el elemento del hash. Sirve para cualquier enrutador:
   * llama a `limpiar.antes()` justo antes de sustituir el contenido y a `limpiar.despues()` justo después.
   *
   * Con la ventana como raíz, mientras está activa pone `history.scrollRestoration` en `"manual"`,
   * y lo devuelve al limpiar. Con un contenedor no lo toca: esa propiedad es de la ventana.
   *
   * @param {string|HTMLElement} objetivo El contenedor de la vista. Los hash se buscan en su raíz.
   * @param {object} [opciones]
   * @param {Lenis} [opciones.lenis] Instancia existente. Sin ella se crea una y se destruye al limpiar.
   * @param {() => string} [opciones.clave] Identifica una vista. Por defecto, ruta y consulta.
   * @returns {(() => void) & { antes: () => void, despues: () => void }} Limpieza y los dos puntos de conexión.
   */
  function navegacionScroll(objetivo, opciones = {}) {
    const vista = typeof objetivo === "string" ? document.querySelector(objetivo) : objetivo;
    if (!vista) throw new TypeError("navegacionScroll: objetivo no encontrado");

    const { lenis: externa, clave = () => location.pathname + location.search } = opciones;
    const lenis = externa ?? new Lenis({ autoRaf: true });
    const enVentana = lenis.rootElement === document.documentElement;
    const restauracionPrevia = history.scrollRestoration;
    const posiciones = new Map();
    const colocar = { immediate: true, force: true };
    let retroceso = false;

    if (enVentana) history.scrollRestoration = "manual";

    function alRetroceder() {
      retroceso = true;
    }
    window.addEventListener("popstate", alRetroceder);

    function destinoDelHash() {
      if (!location.hash) return null;
      return vista.getRootNode().getElementById(decodeURIComponent(location.hash.slice(1)));
    }

    let hecho = false;
    function limpiar() {
      if (hecho) return;
      hecho = true;
      window.removeEventListener("popstate", alRetroceder);
      if (enVentana) history.scrollRestoration = restauracionPrevia;
      if (!externa) lenis.destroy();
    }
    limpiar.antes = () => {
      if (!hecho) posiciones.set(clave(), lenis.scroll);
    };
    limpiar.despues = () => {
      if (hecho) return;
      // 1. Corta la inercia. scrollTo vuelve antes de mirar `immediate` si el destino ya es
      // targetScroll, así que el corte debe apuntar a otro valor
      lenis.scrollTo(lenis.targetScroll === 0 ? 1 : 0, colocar);
      // 2. Mide: scrollTo recorta con el límite que tenga medido
      lenis.resize();
      // 3. Coloca
      const guardada = retroceso ? posiciones.get(clave()) : undefined;
      const destino = guardada ?? destinoDelHash() ?? 0;
      retroceso = false;
      lenis.scrollTo(destino, colocar);
    };
    return limpiar;
  }

  (window.Plantillas = window.Plantillas || {}).navegacionScroll = navegacionScroll;
})();
