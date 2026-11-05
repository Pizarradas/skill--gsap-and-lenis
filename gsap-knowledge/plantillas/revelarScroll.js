import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Revela elementos por lotes al entrar en el viewport.
 * Los elementos que entran a la vez forman un lote y aparecen escalonados.
 *
 * @param {string|Element|Element[]|NodeList} objetivo Elementos a revelar.
 * @param {Object} [opciones]
 * @param {number} [opciones.y=40] Desplazamiento vertical inicial, en px.
 * @param {number} [opciones.duracion=0.6] Duración de cada elemento, en segundos.
 * @param {string} [opciones.ease="power2.out"] Curva de entrada.
 * @param {number} [opciones.stagger=0.08] Separación entre elementos de un lote.
 * @param {string} [opciones.inicio="top 85%"] `start` de ScrollTrigger.
 * @param {number} [opciones.intervalo=0.1] Ventana en segundos para agrupar un lote.
 * @param {number} [opciones.maximoLote] Tamaño máximo de un lote.
 * @param {boolean} [opciones.repetir=false] Si es true, se oculta al salir por arriba y se revela otra vez.
 * @returns {() => void} Función de limpieza: elimina ScrollTriggers y estilos en línea.
 * @example
 * const limpiar = revelarScroll(raiz.querySelectorAll(".tarjeta"), { y: 24, stagger: 0.05 });
 */
export function revelarScroll(objetivo, opciones = {}) {
  const {
    y = 40,
    duracion = 0.6,
    ease = "power2.out",
    stagger = 0.08,
    inicio = "top 85%",
    intervalo = 0.1,
    maximoLote,
    repetir = false,
  } = opciones;
  const elementos = gsap.utils.toArray(objetivo);

  const ctx = gsap.context(() => {
    gsap.matchMedia().add(
      { normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" },
      (contexto, seguro) => {
        if (contexto.conditions.reducido) return; // contenido visible desde el principio

        const estilos = elementos.map((el) => el.style.cssText);
        gsap.set(elementos, { autoAlpha: 0, y });

        // seguro(): lo que nace en un callback también queda registrado en el contexto.
        const mostrar = seguro((lote) =>
          gsap.to(lote, { autoAlpha: 1, y: 0, duration: duracion, ease, stagger, overwrite: "auto" })
        );
        const ocultar = seguro((lote) => gsap.set(lote, { autoAlpha: 0, y, overwrite: "auto" }));

        ScrollTrigger.batch(elementos, {
          start: inicio,
          interval: intervalo,
          batchMax: maximoLote,
          once: !repetir,
          onEnter: mostrar,
          ...(repetir && { onLeaveBack: ocultar }),
        });

        // Con lotes y stagger, revert() puede dejar el estado oculto: se restaura a mano.
        return () => {
          gsap.set(elementos, { clearProps: "transform,opacity,visibility" });
          elementos.forEach((el, i) => {
            el.style.cssText = estilos[i];
          });
        };
      }
    );
  });

  return () => ctx.revert();
}
