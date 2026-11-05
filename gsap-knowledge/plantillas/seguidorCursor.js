import gsap from "gsap";

/**
 * Hace que un elemento decorativo siga al puntero con retardo, usando quickTo().
 * Solo actúa con puntero capaz de hover y sin preferencia de movimiento reducido.
 * En otro caso, el elemento queda oculto.
 *
 * @param {string|Element} objetivo Elemento seguidor.
 * @param {Object} [opciones]
 * @param {number} [opciones.duracion=0.4] Retardo con el que alcanza al puntero, en segundos.
 * @param {string} [opciones.ease="power3"] Curva de cada redirección.
 * @param {EventTarget} [opciones.zona=window] Dónde se escucha el movimiento.
 * @returns {() => void} Función de limpieza: quita el listener y los estilos en línea.
 * @example
 * const limpiar = seguidorCursor(raiz.querySelector(".punto"), { duracion: 0.25 });
 */
export function seguidorCursor(objetivo, opciones = {}) {
  const { duracion = 0.4, ease = "power3", zona = window } = opciones;
  const seguidor = gsap.utils.toArray(objetivo)[0];

  const ctx = gsap.context(() => {
    gsap.matchMedia().add(
      {
        activo: "(prefers-reduced-motion: no-preference) and (hover: hover)",
        inactivo: "(prefers-reduced-motion: reduce), (hover: none)",
      },
      (contexto, seguro) => {
        gsap.set(seguidor, {
          position: "fixed",
          left: 0,
          top: 0,
          xPercent: -50,
          yPercent: -50,
          pointerEvents: "none",
          autoAlpha: 0,
        });
        if (contexto.conditions.inactivo) return;

        const moverX = gsap.quickTo(seguidor, "x", { duration: duracion, ease });
        const moverY = gsap.quickTo(seguidor, "y", { duration: duracion, ease });
        let visible = false;

        const mostrar = seguro((e) => {
          visible = true;
          moverX(e.clientX, e.clientX); // el segundo valor evita que llegue volando desde 0,0
          moverY(e.clientY, e.clientY);
          gsap.to(seguidor, { autoAlpha: 1, duration: 0.2 });
        });
        const alMover = (e) => {
          if (!visible) return mostrar(e);
          moverX(e.clientX);
          moverY(e.clientY);
        };

        zona.addEventListener("pointermove", alMover);
        return () => zona.removeEventListener("pointermove", alMover);
      }
    );
  });

  return () => ctx.revert();
}
