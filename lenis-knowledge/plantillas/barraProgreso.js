import Lenis from "lenis";

/**
 * Refleja el progreso del scroll en una barra, con `transform` para no provocar reflujo.
 *
 * @param {string|HTMLElement} objetivo La barra. Un selector no atraviesa Shadow DOM: allí pasa el elemento.
 * @param {object} [opciones]
 * @param {Lenis} [opciones.lenis] Instancia existente. Sin ella se crea una y se destruye al limpiar.
 * @param {"x"|"y"} [opciones.eje="x"] Eje en el que crece la barra.
 * @returns {(() => void) & { actualizar: () => void }} Limpieza. `limpiar.actualizar()`
 *   recalcula tras cambiar el contenido: el reajuste automático de Lenis no emite `scroll`.
 */
export function barraProgreso(objetivo, opciones = {}) {
  const barra = typeof objetivo === "string" ? document.querySelector(objetivo) : objetivo;
  if (!barra) throw new TypeError("barraProgreso: objetivo no encontrado");

  const { lenis: externa, eje = "x" } = opciones;
  const lenis = externa ?? new Lenis({ autoRaf: true });
  const previo = { transform: barra.style.transform, origen: barra.style.transformOrigin };
  barra.style.transformOrigin = eje === "x" ? "left center" : "center top";

  function pintar() {
    // Sin recorrido, lenis.progress vale 1: la barra saldría llena
    const avance = lenis.limit > 0 ? lenis.progress : 0;
    barra.style.transform = `scale${eje.toUpperCase()}(${avance})`;
  }

  const quitar = lenis.on("scroll", pintar);
  pintar();

  let hecho = false;
  function limpiar() {
    if (hecho) return;
    hecho = true;
    quitar();
    barra.style.transform = previo.transform;
    barra.style.transformOrigin = previo.origen;
    if (!externa) lenis.destroy();
  }
  limpiar.actualizar = () => {
    if (!hecho) lenis.resize();
  };
  return limpiar;
}
