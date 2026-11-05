/* Generado por herramientas/plantillas_globales.py desde plantillas/titularTexto.js. No lo edites a mano.
   Carga antes, con <script>: gsap, ScrollTrigger, SplitText. Expone Plantillas.titularTexto. */
(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger, SplitText);

  /**
   * Anima un titular por líneas, palabras o letras con máscara. Recompone las líneas si cambia
   * el ancho o cargan las fuentes. Con movimiento reducido no divide el texto.
   *
   * @param {string|Element|Element[]|NodeList} objetivo Titulares; cada uno se divide por separado.
   * @param {Object} [opciones]
   * @param {"lines"|"words"|"chars"} [opciones.tipo="lines"] Unidad de animación.
   * @param {number} [opciones.duracion=0.7] Duración de cada unidad.
   * @param {number} [opciones.stagger=0.08] Separación entre unidades.
   * @param {string} [opciones.ease="power3.out"] Curva.
   * @param {number} [opciones.desplazamiento=110] yPercent inicial; más de 100 deja la unidad bajo la máscara.
   * @param {boolean} [opciones.alEntrar=false] Si es true, espera a que el titular entre en el viewport.
   * @param {string} [opciones.inicio="top 85%"] `start` si `alEntrar` es true.
   * @returns {() => void} Función de limpieza: restaura el HTML original y los atributos aria.
   * @example
   * const limpiar = titularTexto(raiz.querySelector("h1"), { tipo: "words", stagger: 0.04 });
   */
  function titularTexto(objetivo, opciones = {}) {
    const {
      tipo = "lines",
      duracion = 0.7,
      stagger = 0.08,
      ease = "power3.out",
      desplazamiento = 110,
      alEntrar = false,
      inicio = "top 85%",
    } = opciones;
    const elementos = gsap.utils.toArray(objetivo);

    const ctx = gsap.context(() => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        elementos.forEach((el) => {
          SplitText.create(el, {
            type: tipo === "chars" ? "words,chars" : tipo, // sin words, las letras parten palabras al ajustar línea
            mask: tipo,
            autoSplit: true,
            // devolver la animación permite a SplitText recrearla y conservar su tiempo al redividir
            onSplit: (dividido) =>
              gsap.from(dividido[tipo], {
                yPercent: desplazamiento,
                duration: duracion,
                stagger,
                ease,
                ...(alEntrar && { scrollTrigger: { trigger: el, start: inicio, once: true } }),
              }),
          });
        });
      });
    });

    return () => ctx.revert();
  }

  (window.Plantillas = window.Plantillas || {}).titularTexto = titularTexto;
})();
