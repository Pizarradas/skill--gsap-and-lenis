import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Fija una sección y convierte el scroll vertical en desplazamiento horizontal de su pista.
 * Con movimiento reducido no fija nada: la sección pasa a tener scroll horizontal nativo.
 *
 * @param {string|Element} objetivo Sección que se fija.
 * @param {Object} [opciones]
 * @param {string|Element} [opciones.pista] Elemento que se desplaza. Por defecto, el primer hijo.
 * @param {boolean|number} [opciones.suavizado=1] Valor de `scrub`.
 * @param {boolean} [opciones.ajustar=false] Si es true, encaja en cada hijo de la pista.
 * @param {(tween: gsap.core.Tween) => void} [opciones.alCrear] Recibe el tween, útil como `containerAnimation`.
 * @returns {() => void} Función de limpieza: retira el pin-spacer y los estilos en línea.
 * @example
 * const limpiar = pinHorizontal(raiz.querySelector(".galeria"), { suavizado: 0.5, ajustar: true });
 */
export function pinHorizontal(objetivo, opciones = {}) {
  const { suavizado = 1, ajustar = false, alCrear } = opciones;
  const seccion = gsap.utils.toArray(objetivo)[0];
  const pista = opciones.pista ? gsap.utils.toArray(opciones.pista)[0] : seccion.firstElementChild;

  const ctx = gsap.context(() => {
    gsap.matchMedia().add(
      { normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" },
      (contexto) => {
        if (contexto.conditions.reducido) {
          gsap.set(seccion, { overflowX: "auto" });
          return;
        }

        const recorrido = () => Math.max(0, pista.scrollWidth - seccion.clientWidth);
        const pasos = pista.children.length - 1;
        const estiloPista = pista.style.cssText;

        gsap.set(seccion, { overflow: "hidden" });
        const tween = gsap.to(pista, {
          x: () => -recorrido(), // función + invalidateOnRefresh: se recalcula al redimensionar
          ease: "none",
          scrollTrigger: {
            trigger: seccion,
            start: "top top",
            end: () => "+=" + recorrido(),
            pin: true,
            scrub: suavizado,
            invalidateOnRefresh: true,
            ...(ajustar && pasos > 0 && { snap: 1 / pasos }),
          },
        });
        alCrear && alCrear(tween);

        // pin + invalidateOnRefresh deja un transform residual en la pista tras revert()
        return () => {
          pista.style.cssText = estiloPista;
        };
      }
    );
  });

  return () => ctx.revert();
}
