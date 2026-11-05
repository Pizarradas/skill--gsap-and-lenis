import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Desplaza cada elemento a otra velocidad que el scroll mientras cruza el viewport.
 * El disparador es el padre: el elemento que se mueve no debe medir su propio recorrido.
 *
 * @param {string|Element|Element[]|NodeList} objetivo Elementos con parallax.
 * @param {Object} [opciones]
 * @param {number} [opciones.distancia=15] Recorrido en yPercent, de -distancia a +distancia.
 *   `data-distancia` en un elemento tiene prioridad.
 * @param {boolean|number} [opciones.suavizado=true] Valor de `scrub`.
 * @param {string|Element} [opciones.disparador] Disparador común. Por defecto, el padre de cada elemento.
 * @returns {() => void} Función de limpieza.
 * @example
 * const limpiar = parallax(raiz.querySelectorAll(".franja img"), { distancia: 12, suavizado: 0.5 });
 */
export function parallax(objetivo, opciones = {}) {
  const { distancia = 15, suavizado = true, disparador } = opciones;
  const elementos = gsap.utils.toArray(objetivo);

  const ctx = gsap.context(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      elementos.forEach((el) => {
        const d = parseFloat(el.dataset.distancia) || distancia;
        gsap.fromTo(
          el,
          { yPercent: -d },
          {
            yPercent: d,
            ease: "none",
            scrollTrigger: {
              trigger: disparador || el.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: suavizado,
            },
          }
        );
      });
    });
  });

  return () => ctx.revert();
}
