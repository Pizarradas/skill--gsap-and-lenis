/* Generado por herramientas/plantillas_globales.py desde plantillas/marquee.js. No lo edites a mano.
   Carga antes, con <script>: gsap. Expone Plantillas.marquee. */
(function () {
  "use strict";

  /**
   * Cinta continua sin saltos: clona los hijos de la pista hasta cubrir el contenedor
   * y desplaza la pista exactamente el ancho de una serie, en bucle.
   * Se pausa al pasar el puntero o al recibir foco. Con movimiento reducido no hay
   * clones ni animación: la cinta queda con scroll horizontal nativo.
   *
   * @param {string|Element} objetivo Contenedor. Su primer hijo es la pista (`display:flex; width:max-content`).
   * @param {Object} [opciones]
   * @param {number} [opciones.velocidad=80] Píxeles por segundo.
   * @param {"izquierda"|"derecha"} [opciones.direccion="izquierda"] Sentido del movimiento.
   * @param {boolean} [opciones.pausar=true] Frena al pasar el puntero o con foco dentro.
   * @returns {() => void} Función de limpieza: retira clones, observadores y estilos en línea.
   * @example
   * const limpiar = marquee(raiz.querySelector(".logos"), { velocidad: 60, direccion: "derecha" });
   */
  function marquee(objetivo, opciones = {}) {
    const { velocidad = 80, direccion = "izquierda", pausar = true } = opciones;
    const contenedor = gsap.utils.toArray(objetivo)[0];
    const pista = contenedor.firstElementChild;

    const ctx = gsap.context(() => {
      gsap.matchMedia().add(
        { normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" },
        (contexto, seguro) => {
          if (contexto.conditions.reducido) {
            gsap.set(contenedor, { overflowX: "auto" });
            return;
          }

          gsap.set(contenedor, { overflow: "hidden" });
          const originales = [...pista.children];
          const clones = [];
          let tween;
          let anchoSerie = 0;

          const clonarSerie = () =>
            originales.forEach((el) => {
              const copia = el.cloneNode(true);
              copia.setAttribute("aria-hidden", "true");
              copia.inert = true; // los clones no reciben foco ni clics de teclado
              pista.appendChild(copia);
              clones.push(copia);
            });

          const construir = seguro(() => {
            if (!clones.length) clonarSerie();
            const ancho = clones[0].offsetLeft - originales[0].offsetLeft; // incluye el gap
            if (ancho <= 0 || ancho === anchoSerie) return;
            anchoSerie = ancho;

            const series = Math.ceil(contenedor.clientWidth / ancho) + 1;
            while (clones.length / originales.length + 1 < series) clonarSerie();

            const progreso = tween ? tween.progress() : 0;
            const ritmo = tween ? tween.timeScale() : 1;
            tween && tween.kill();
            const [desde, hasta] = direccion === "izquierda" ? [0, -ancho] : [-ancho, 0];
            tween = gsap
              .fromTo(pista, { x: desde }, { x: hasta, duration: ancho / velocidad, ease: "none", repeat: -1 })
              .progress(progreso)
              .timeScale(ritmo);
          });

          const cambiarRitmo = seguro((valor) => {
            tween && gsap.to(tween, { timeScale: valor, duration: 0.3, overwrite: true });
          });
          const frenar = () => cambiarRitmo(0);
          const seguir = () => cambiarRitmo(1);

          construir();

          const diferido = gsap.delayedCall(0.15, construir).pause();
          const observador = new ResizeObserver(() => diferido.restart(true));
          observador.observe(contenedor);
          originales.forEach((el) => observador.observe(el));

          if (pausar) {
            contenedor.addEventListener("pointerenter", frenar);
            contenedor.addEventListener("pointerleave", seguir);
            contenedor.addEventListener("focusin", frenar);
            contenedor.addEventListener("focusout", seguir);
          }

          return () => {
            observador.disconnect();
            contenedor.removeEventListener("pointerenter", frenar);
            contenedor.removeEventListener("pointerleave", seguir);
            contenedor.removeEventListener("focusin", frenar);
            contenedor.removeEventListener("focusout", seguir);
            clones.forEach((el) => el.remove());
          };
        }
      );
    });

    return () => ctx.revert();
  }

  (window.Plantillas = window.Plantillas || {}).marquee = marquee;
})();
