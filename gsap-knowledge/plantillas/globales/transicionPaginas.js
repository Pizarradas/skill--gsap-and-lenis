/* Generado por herramientas/plantillas_globales.py desde plantillas/transicionPaginas.js. No lo edites a mano.
   Carga antes, con <script>: gsap, ScrollTrigger. Expone Plantillas.transicionPaginas. */
(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  /**
   * Transición entre páginas sin recarga: anima la salida del contenedor, sustituye su contenido,
   * actualiza historial, título, scroll y foco, y anima la entrada.
   * Si la carga falla, navega de forma normal. Con movimiento reducido, cambia sin animar.
   *
   * @param {string|Element} objetivo Contenedor cuyo contenido cambia. Dentro de Shadow DOM, pasa el elemento
   *   e inyecta `cargar`: la carga por defecto busca el contenedor en el HTML de la página.
   * @param {Object} opciones
   * @param {(url: string) => Promise<string|{html: string, titulo?: string}>} [opciones.cargar]
   *   Devuelve el HTML nuevo. Por defecto, hace fetch y extrae el contenedor por su `id`.
   * @param {string} [opciones.enlaces="a[data-transicion]"] Enlaces que se interceptan.
   * @param {number} [opciones.salida=0.25] Duración de la salida, en segundos.
   * @param {number} [opciones.entrada=0.35] Duración de la entrada, en segundos.
   * @param {number} [opciones.y=16] Desplazamiento vertical de la animación, en px.
   * @param {(url: string) => void} [opciones.registrar] Sustituye a history.pushState.
   * @param {(contenedor: Element, url: string) => (void|(() => void))} [opciones.alCambiar]
   *   Inicia la página nueva. Lo que devuelva se llama antes del siguiente cambio y al limpiar.
   * @returns {() => void} Función de limpieza: quita listeners y estilos. El contenido actual se queda.
   * @example
   * const limpiar = transicionPaginas("#contenido", {
   *   alCambiar: (raiz) => revelarScroll(raiz.querySelectorAll(".tarjeta")),
   * });
   */
  function transicionPaginas(objetivo, opciones = {}) {
    const contenedor = gsap.utils.toArray(objetivo)[0];
    const {
      cargar = async (url) => {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error(respuesta.status);
        const doc = new DOMParser().parseFromString(await respuesta.text(), "text/html");
        return { html: doc.getElementById(contenedor.id).innerHTML, titulo: doc.title };
      },
      enlaces = "a[data-transicion]",
      salida = 0.25,
      entrada = 0.35,
      y = 16,
      registrar = (url) => history.pushState({}, "", url),
      alCambiar,
    } = opciones;
    const tabindexOriginal = contenedor.getAttribute("tabindex");
    const estiloOriginal = contenedor.style.cssText;
    let turno = 0;
    let bajaPagina;

    const ctx = gsap.context(() => {
      gsap.matchMedia().add(
        { normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" },
        (contexto) => {
          const { reducido } = contexto.conditions;
          // Fuera del contexto a propósito: se repiten en cada navegación y se limpian a mano.
          // opacity y no autoAlpha: con visibility:hidden el contenedor no podría recibir el foco.
          const salir = () =>
            gsap.to(contenedor, { opacity: 0, y: reducido ? 0 : -y, duration: reducido ? 0 : salida, overwrite: "auto" });
          const entrar = () =>
            gsap.fromTo(
              contenedor,
              { opacity: 0, y: reducido ? 0 : y },
              { opacity: 1, y: 0, duration: reducido ? 0 : entrada, overwrite: "auto" }
            );

          const navegar = async (url, empujar) => {
            const propio = ++turno;
            const carga = cargar(url); // empieza ya: la salida no retrasa la red
            try {
              const [datos] = await Promise.all([carga, salir().then()]);
              if (propio !== turno) return; // otro clic tomó el relevo, o se limpió
              const { html, titulo } = typeof datos === "string" ? { html: datos } : datos;

              bajaPagina && bajaPagina();
              contenedor.innerHTML = html;
              if (titulo) document.title = titulo;
              if (empujar) registrar(url);
              window.scrollTo(0, 0);
              bajaPagina = alCambiar && alCambiar(contenedor, url);
              ScrollTrigger.refresh();

              contenedor.setAttribute("tabindex", "-1");
              contenedor.focus({ preventScroll: true });
              entrar();
            } catch (error) {
              if (propio === turno) window.location.assign(url);
            }
          };

          const alPulsar = (e) => {
            // composedPath y no e.target: desde document, un clic dentro de una sombra abierta apunta al anfitrión.
            const enlace = e.composedPath().find((nodo) => nodo.matches && nodo.matches(enlaces));
            if (!enlace || e.defaultPrevented || e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // abrir en otra pestaña
            if (enlace.target === "_blank" || enlace.hasAttribute("download")) return;
            if (enlace.host !== location.host) return; // externo
            if (enlace.pathname === location.pathname && enlace.search === location.search) return; // ancla interna
            e.preventDefault();
            navegar(enlace.href, true);
          };
          const alVolver = () => navegar(location.href, false);

          document.addEventListener("click", alPulsar);
          window.addEventListener("popstate", alVolver);

          return () => {
            turno++; // invalida cualquier navegación en curso
            document.removeEventListener("click", alPulsar);
            window.removeEventListener("popstate", alVolver);
            gsap.killTweensOf(contenedor);
            gsap.set(contenedor, { clearProps: "transform,opacity" });
            contenedor.style.cssText = estiloOriginal;
          };
        }
      );
    });

    return () => {
      ctx.revert();
      bajaPagina && bajaPagina();
      bajaPagina = null;
      tabindexOriginal === null ? contenedor.removeAttribute("tabindex") : contenedor.setAttribute("tabindex", tabindexOriginal);
    };
  }

  (window.Plantillas = window.Plantillas || {}).transicionPaginas = transicionPaginas;
})();
