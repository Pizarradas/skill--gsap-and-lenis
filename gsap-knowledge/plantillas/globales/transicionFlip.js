/* Generado por herramientas/plantillas_globales.py desde plantillas/transicionFlip.js. No lo edites a mano.
   Carga antes, con <script>: gsap, Flip. Expone Plantillas.transicionFlip. */
(function () {
  "use strict";

  gsap.registerPlugin(Flip);

  /**
   * Anima un cambio de disposición con Flip: guarda el estado, aplica `cambio` y anima la diferencia.
   * Sirve para filtrar, reordenar o mover elementos entre contenedores.
   * Con movimiento reducido aplica el cambio sin animar.
   *
   * @param {string|Element[]|NodeList|(() => Element[]|NodeList)} objetivo Elementos que cambian. Una función o un
   *   selector se resuelven en cada ejecución, antes y después de `cambio`: la función acota a una raíz y admite listas
   *   que crecen. Un selector busca en todo el documento y un array no incorpora elementos nuevos.
   * @param {Object} opciones
   * @param {(evento?: Event) => void|Promise<unknown>} opciones.cambio Altera el DOM o las clases. Si devuelve una
   *   promesa, el vuelo espera a que se cumpla. Si se limpia o llega otro cambio durante la espera, ese vuelo no se crea.
   * @param {string|Element|Element[]} [opciones.disparador] Elementos que lanzan el cambio.
   * @param {string} [opciones.evento="click"] Evento que escucha en `disparador`.
   * @param {number} [opciones.duracion=0.5] Duración en segundos.
   * @param {string} [opciones.ease="power2.inOut"] Curva.
   * @param {number} [opciones.stagger=0] Separación entre elementos.
   * @param {boolean} [opciones.absolute=true] Usa position:absolute durante el vuelo (necesario en flex y grid).
   * @param {boolean} [opciones.escala=false] Anima con scale en lugar de width y height.
   * @returns {(() => void) & { ejecutar: (evento?: Event) => unknown }} Función de limpieza, con `.ejecutar()`
   *   para lanzar el cambio por código: devuelve el vuelo o, con `cambio` asíncrono, una promesa que se cumple
   *   al empezar el vuelo.
   *   Limpiar termina el vuelo; no deshace `cambio`.
   * @example
   * const limpiar = transicionFlip(() => lista.children, {
   *   disparador: raiz.querySelector(".ordenar"),
   *   cambio: () => lista.append(...[...lista.children].reverse()),
   * });
   */
  function transicionFlip(objetivo, opciones = {}) {
    const {
      cambio,
      disparador,
      evento = "click",
      duracion = 0.5,
      ease = "power2.inOut",
      stagger = 0,
      absolute = true,
      escala = false,
    } = opciones;
    const resolver = () => (typeof objetivo === "function" ? objetivo() : objetivo);
    let ejecutar = null;
    let turno = 0;

    const ctx = gsap.context(() => {
      gsap.matchMedia().add(
        { normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" },
        (contexto) => {
          const { reducido } = contexto.conditions;

          // Sin contextSafe a propósito: revert() en contextos anidados no termina un vuelo de Flip,
          // deshace sus tweens y deja estilos a medias. El vuelo se cierra con killFlipsOf().
          ejecutar = (e) => {
            if (reducido) return cambio(e);
            const propio = ++turno;
            const medidos = gsap.utils.toArray(resolver());
            const estado = Flip.getState(medidos);
            // getState deja translate, rotate y scale en "none" en línea: sin vuelo, nadie los retira.
            const sinVuelo = () =>
              medidos.forEach((n) =>
                ["translate", "rotate", "scale"].forEach((p) => n.style[p] === "none" && n.style.removeProperty(p))
              );
            const volar = () =>
              Flip.from(estado, {
                targets: resolver(), // incluye los que aparecen con el cambio
                duration: duracion,
                ease,
                stagger,
                absolute,
                scale: escala,
                onEnter: (entran) => gsap.fromTo(entran, { opacity: 0 }, { opacity: 1, duration: duracion }),
                onLeave: (salen) => gsap.to(salen, { opacity: 0, duration: duracion }),
              });

            const resultado = cambio(e);
            if (!resultado || typeof resultado.then !== "function") return volar();
            // Sin devolver el vuelo: un timeline es thenable, y la promesa no se cumpliría al limpiarlo a medias.
            return resultado.then(
              () => {
                // Otro valor de turno: se limpió, o un cambio posterior tomó el relevo.
                propio === turno ? volar() : sinVuelo();
              },
              (error) => {
                sinVuelo();
                throw error;
              }
            );
          };

          const nodos = disparador ? gsap.utils.toArray(disparador) : [];
          const alDisparar = (e) => ejecutar(e);
          nodos.forEach((n) => n.addEventListener(evento, alDisparar));

          return () => {
            ejecutar = null;
            turno++; // anula el vuelo que espere a un cambio asíncrono
            Flip.killFlipsOf(resolver());
            nodos.forEach((n) => n.removeEventListener(evento, alDisparar));
          };
        }
      );
    });

    const limpiar = () => ctx.revert();
    limpiar.ejecutar = (e) => ejecutar && ejecutar(e);
    return limpiar;
  }

  (window.Plantillas = window.Plantillas || {}).transicionFlip = transicionFlip;
})();
