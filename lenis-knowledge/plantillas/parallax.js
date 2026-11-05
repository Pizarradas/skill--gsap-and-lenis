import Lenis from "lenis";

/**
 * Desplaza elementos a distinta velocidad que el scroll, en el mismo fotograma que Lenis.
 * Con movimiento reducido no aplica ninguno, y responde si la preferencia cambia.
 *
 * Mide una vez y luego solo escribe `transform`, sin leer el layout en cada fotograma.
 *
 * @param {string|HTMLElement|ArrayLike<HTMLElement>} objetivo Elementos. En Shadow DOM, pásalos directamente.
 * @param {object} [opciones]
 * @param {Lenis} [opciones.lenis] Instancia existente. Sin ella se crea una y se destruye al limpiar.
 * @param {number} [opciones.velocidad=0.2] Fracción de la distancia al centro de la vista.
 *   Por elemento: `data-velocidad`.
 * @returns {(() => void) & { actualizar: () => void }} Limpieza. `limpiar.actualizar()` vuelve
 *   a medir tras un cambio de contenido. Para elementos nuevos, haz otra llamada.
 */
export function parallax(objetivo, opciones = {}) {
  const lista = typeof objetivo === "string" ? document.querySelectorAll(objetivo) : objetivo;
  const elementos = lista instanceof Element ? [lista] : [...lista];

  const { lenis: externa, velocidad = 0.2 } = opciones;
  const lenis = externa ?? new Lenis({ autoRaf: true });
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
  const piezas = elementos.map((el) => ({
    el,
    previo: el.style.transform,
    factor: Number(el.dataset.velocidad ?? velocidad),
    centro: 0,
  }));

  function restaurar() {
    for (const p of piezas) p.el.style.transform = p.previo;
  }

  function medir() {
    restaurar();
    const techo = lenis.options.wrapper === window ? 0 : lenis.rootElement.getBoundingClientRect().top;
    for (const p of piezas) {
      const rect = p.el.getBoundingClientRect();
      p.centro = rect.top - techo + lenis.actualScroll + rect.height / 2;
    }
  }

  function pintar() {
    if (reducido.matches) return;
    const centroVista = lenis.scroll + lenis.dimensions.height / 2;
    for (const p of piezas) {
      const y = (centroVista - p.centro) * p.factor;
      p.el.style.transform = `${p.previo} translate3d(0, ${y.toFixed(2)}px, 0)`.trim();
    }
  }

  function remedir() {
    medir();
    pintar();
  }

  function alCambiarPreferencia() {
    if (reducido.matches) restaurar();
    else pintar();
  }

  const quitar = lenis.on("scroll", pintar);
  reducido.addEventListener("change", alCambiarPreferencia);
  window.addEventListener("resize", remedir);
  // El contenedor cambia de tamaño sin que la ventana lo haga
  const raizLenis = lenis.rootElement;
  let tamano = `${raizLenis.clientWidth}x${raizLenis.clientHeight}`;
  const observadorRaiz = new ResizeObserver(() => {
    const actual = `${raizLenis.clientWidth}x${raizLenis.clientHeight}`;
    if (actual === tamano) return;
    tamano = actual;
    lenis.resize(); // sus medidas llegan más tarde, y pintar usa la altura visible
    remedir();
  });
  if (lenis.options.wrapper !== window) observadorRaiz.observe(raizLenis);
  remedir();

  let hecho = false;
  function limpiar() {
    if (hecho) return;
    hecho = true;
    quitar();
    reducido.removeEventListener("change", alCambiarPreferencia);
    window.removeEventListener("resize", remedir);
    observadorRaiz.disconnect();
    restaurar();
    if (!externa) lenis.destroy();
  }
  limpiar.actualizar = () => {
    if (!hecho) remedir();
  };
  return limpiar;
}
