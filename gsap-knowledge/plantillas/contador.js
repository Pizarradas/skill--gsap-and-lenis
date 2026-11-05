import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Anima una cifra hasta su valor final y la formatea con Intl.NumberFormat.
 * Con movimiento reducido escribe el valor final sin animar.
 *
 * @param {string|Element|Element[]|NodeList} objetivo Elementos con la cifra.
 * @param {Object} [opciones]
 * @param {number} [opciones.hasta] Valor final. Si falta, se lee `data-hasta` de cada elemento.
 * @param {number} [opciones.desde=0] Valor inicial.
 * @param {number} [opciones.decimales=0] Decimales fijos.
 * @param {string} [opciones.idioma] Etiqueta BCP 47, como "es-ES". Por defecto, la del navegador.
 * @param {(valor: number) => string} [opciones.formato] Sustituye al formateador.
 * @param {number} [opciones.duracion=1.5] Duración en segundos.
 * @param {string} [opciones.ease="power1.out"] Curva.
 * @param {boolean} [opciones.alEntrar=true] Si es true, empieza al entrar en el viewport.
 * @param {string} [opciones.inicio="top 85%"] `start` si `alEntrar` es true.
 * @returns {() => void} Función de limpieza: restaura el texto original.
 * @example
 * const limpiar = contador(raiz.querySelectorAll("[data-hasta]"), { idioma: "es-ES", decimales: 1 });
 */
export function contador(objetivo, opciones = {}) {
  const {
    hasta,
    desde = 0,
    decimales = 0,
    idioma,
    formato,
    duracion = 1.5,
    ease = "power1.out",
    alEntrar = true,
    inicio = "top 85%",
  } = opciones;
  const elementos = gsap.utils.toArray(objetivo);
  const numero = new Intl.NumberFormat(idioma, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
  const escribir = formato || ((valor) => numero.format(valor));

  const ctx = gsap.context(() => {
    gsap.matchMedia().add(
      { normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" },
      (contexto) => {
        const textos = elementos.map((el) => el.textContent);

        elementos.forEach((el) => {
          const final = hasta ?? parseFloat(el.dataset.hasta);
          if (contexto.conditions.reducido) {
            el.textContent = escribir(final);
            return;
          }
          const cifra = { valor: desde };
          el.textContent = escribir(desde);
          gsap.to(cifra, {
            valor: final,
            duration: duracion,
            ease,
            onUpdate: () => {
              el.textContent = escribir(cifra.valor);
            },
            ...(alEntrar && { scrollTrigger: { trigger: el, start: inicio, once: true } }),
          });
        });

        return () =>
          elementos.forEach((el, i) => {
            el.textContent = textos[i];
          });
      }
    );
  });

  return () => ctx.revert();
}
