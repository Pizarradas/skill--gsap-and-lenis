import gsap from "gsap";

/**
 * Atrae un botón hacia el puntero mientras este pasa por encima y lo devuelve al salir.
 * Solo actúa con puntero capaz de hover y sin preferencia de movimiento reducido.
 *
 * @param {string|Element|Element[]|NodeList} objetivo Botones.
 * @param {Object} [opciones]
 * @param {number} [opciones.fuerza=0.35] Fracción de la distancia al centro que se desplaza.
 * @param {number} [opciones.duracion=0.3] Retardo del movimiento, en segundos.
 * @param {string} [opciones.ease="power3"] Curva de cada redirección.
 * @returns {() => void} Función de limpieza: quita listeners y estilos en línea.
 * @example
 * const limpiar = botonMagnetico(raiz.querySelectorAll(".cta"), { fuerza: 0.25 });
 */
export function botonMagnetico(objetivo, opciones = {}) {
  const { fuerza = 0.35, duracion = 0.3, ease = "power3" } = opciones;
  const botones = gsap.utils.toArray(objetivo);

  const ctx = gsap.context(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference) and (hover: hover)", () => {
      const bajas = botones.map((boton) => {
        // Graba el transform original. Los dos quickTo empatan y revert() los deshace en distinto orden
        // según el motor; un set se deshace después que ellos en cualquiera.
        gsap.set(boton, { x: "+=0" });
        const moverX = gsap.quickTo(boton, "x", { duration: duracion, ease });
        const moverY = gsap.quickTo(boton, "y", { duration: duracion, ease });
        let centroX = 0;
        let centroY = 0;

        // Se mide una vez: el botón se mueve y su rectángulo dejaría de ser una referencia fija.
        const entrar = () => {
          const caja = boton.getBoundingClientRect();
          centroX = caja.left + caja.width / 2 - gsap.getProperty(boton, "x");
          centroY = caja.top + caja.height / 2 - gsap.getProperty(boton, "y");
        };
        const mover = (e) => {
          moverX((e.clientX - centroX) * fuerza);
          moverY((e.clientY - centroY) * fuerza);
        };
        const salir = () => {
          moverX(0);
          moverY(0);
        };

        boton.addEventListener("pointerenter", entrar);
        boton.addEventListener("pointermove", mover);
        boton.addEventListener("pointerleave", salir);
        return () => {
          boton.removeEventListener("pointerenter", entrar);
          boton.removeEventListener("pointermove", mover);
          boton.removeEventListener("pointerleave", salir);
        };
      });

      return () => bajas.forEach((baja) => baja());
    });
  });

  return () => ctx.revert();
}
