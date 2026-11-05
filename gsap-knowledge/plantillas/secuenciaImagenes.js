import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Recorre una secuencia de imágenes en un `<canvas>` según el scroll, con recorte tipo "cover".
 * Con movimiento reducido dibuja un único fotograma y no crea ScrollTrigger.
 * El canvas necesita tamaño por CSS: su resolución interna se calcula a partir de él.
 *
 * @param {string|HTMLCanvasElement} objetivo Canvas.
 * @param {Object} opciones
 * @param {string[]} opciones.urls Rutas de los fotogramas, en orden.
 * @param {string|Element} [opciones.disparador] Disparador. Por defecto, el propio canvas.
 * @param {string} [opciones.inicio="top top"] `start` de ScrollTrigger.
 * @param {string} [opciones.fin="+=200%"] `end` de ScrollTrigger.
 * @param {boolean} [opciones.fijar=true] Fija el disparador durante el recorrido.
 * @param {boolean|number} [opciones.suavizado=0.5] Valor de `scrub`.
 * @param {number} [opciones.fotogramaEstatico] Índice mostrado con movimiento reducido. Por defecto, el último.
 * @returns {() => void} Función de limpieza: cancela cargas, vacía el canvas y restaura sus dimensiones.
 * @example
 * const urls = Array.from({ length: 120 }, (_, i) => `/frames/${i}.webp`);
 * const limpiar = secuenciaImagenes(raiz.querySelector(".giro"), { urls, fin: "+=300%" });
 */
export function secuenciaImagenes(objetivo, opciones = {}) {
  const {
    urls = [],
    disparador,
    inicio = "top top",
    fin = "+=200%",
    fijar = true,
    suavizado = 0.5,
    fotogramaEstatico = urls.length - 1,
  } = opciones;
  const lienzo = gsap.utils.toArray(objetivo)[0];
  const pincel = lienzo.getContext("2d");
  const anchoOriginal = lienzo.getAttribute("width");
  const altoOriginal = lienzo.getAttribute("height");

  const ctx = gsap.context(() => {
    gsap.matchMedia().add(
      { normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" },
      (contexto) => {
        const { reducido } = contexto.conditions;
        const estado = { fotograma: reducido ? fotogramaEstatico : 0 };

        const dibujar = () => {
          const img = imagenes[estado.fotograma];
          if (!img || !img.complete || !img.naturalWidth) return; // aún sin cargar: sigue el anterior
          const { width: an, height: al } = lienzo;
          const escala = Math.max(an / img.naturalWidth, al / img.naturalHeight);
          const w = img.naturalWidth * escala;
          const h = img.naturalHeight * escala;
          pincel.clearRect(0, 0, an, al);
          pincel.drawImage(img, (an - w) / 2, (al - h) / 2, w, h);
        };

        const ajustar = () => {
          const caja = lienzo.getBoundingClientRect();
          const densidad = Math.min(window.devicePixelRatio || 1, 2);
          lienzo.width = Math.round(caja.width * densidad);
          lienzo.height = Math.round(caja.height * densidad);
          dibujar();
        };

        const imagenes = urls.map((url, i) => {
          const img = new Image();
          img.onload = () => i === estado.fotograma && dibujar();
          img.src = url;
          return img;
        });

        ajustar();
        const observador = new ResizeObserver(ajustar);
        observador.observe(lienzo);

        if (!reducido) {
          gsap.to(estado, {
            fotograma: urls.length - 1,
            snap: "fotograma",
            ease: "none",
            onUpdate: dibujar,
            scrollTrigger: {
              trigger: disparador || lienzo,
              start: inicio,
              end: fin,
              pin: fijar,
              scrub: suavizado,
            },
          });
        }

        return () => {
          observador.disconnect();
          imagenes.forEach((img) => {
            img.onload = null;
            img.src = "";
          });
          pincel.clearRect(0, 0, lienzo.width, lienzo.height);
        };
      }
    );
  });

  return () => {
    ctx.revert();
    anchoOriginal === null ? lienzo.removeAttribute("width") : lienzo.setAttribute("width", anchoOriginal);
    altoOriginal === null ? lienzo.removeAttribute("height") : lienzo.setAttribute("height", altoOriginal);
  };
}
