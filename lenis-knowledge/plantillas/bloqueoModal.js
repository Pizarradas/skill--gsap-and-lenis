import Lenis from "lenis";

// Varios diálogos pueden compartir instancia: solo el último en cerrarse reanuda el scroll
const bloqueos = new WeakMap();
// Y varias instancias de contenedor comparten una sola ventana
const ventana = { bloqueos: 0, previo: "" };

function fijarContenedor(raiz) {
  // overflow: hidden en línea gana a la regla clip de lenis.css, que saltaría a scrollTop 0
  raiz.style.overflow = "hidden";
}

function bloquear(lenis) {
  const raiz = lenis.rootElement;
  const enContenedor = raiz !== document.documentElement;
  const estado = bloqueos.get(lenis) ?? { abiertos: 0, yaParada: lenis.isStopped, enContenedor, overflow: raiz.style.overflow };
  estado.abiertos += 1;
  bloqueos.set(lenis, estado);
  if (estado.abiertos > 1) return;
  if (enContenedor) {
    fijarContenedor(raiz);
    // stop() actúa sobre el contenedor: la página de detrás sigue libre
    if (ventana.bloqueos++ === 0) {
      ventana.previo = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
    }
  }
  lenis.stop();
  if (enContenedor) fijarContenedor(raiz); // con autoToggle, stop() acaba de escribir clip
}

function liberar(lenis) {
  const raiz = lenis.rootElement;
  const estado = bloqueos.get(lenis);
  estado.abiertos -= 1;
  if (estado.abiertos > 0) return;
  bloqueos.delete(lenis);
  if (!estado.yaParada) {
    lenis.start();
    // Con autoToggle, stop() tarda: si aún no ha surtido, start() no hace nada y el recorte se queda
    if (lenis.options.autoToggle) raiz.style.removeProperty("overflow");
  }
  if (estado.enContenedor) {
    raiz.style.overflow = estado.overflow;
    if (--ventana.bloqueos === 0) document.documentElement.style.overflow = ventana.previo;
  }
}

/**
 * Bloquea el scroll de fondo mientras un `<dialog>` modal está abierto y deja
 * que su contenido se desplace de forma nativa con rueda y con toque.
 *
 * Con una instancia de contenedor bloquea también la ventana, con `overflow` en `<html>`,
 * y fija el contenedor con `overflow: hidden` en línea para que conserve su posición.
 *
 * @param {string|HTMLDialogElement} objetivo El diálogo. En Shadow DOM, pasa el elemento.
 * @param {object} [opciones]
 * @param {Lenis} [opciones.lenis] Instancia existente. Sin ella se crea una y se destruye al limpiar.
 * @returns {(() => void) & { abrir: () => void, cerrar: () => void }} Limpieza, que cierra
 *   el diálogo si sigue abierto, y los dos métodos para gobernarlo.
 */
export function bloqueoModal(objetivo, opciones = {}) {
  const dialogo = typeof objetivo === "string" ? document.querySelector(objetivo) : objetivo;
  if (!(dialogo instanceof HTMLDialogElement)) throw new TypeError("bloqueoModal: el objetivo debe ser un <dialog>");

  const { lenis: externa } = opciones;
  const lenis = externa ?? new Lenis({ autoRaf: true });
  const teniaAtributo = dialogo.hasAttribute("data-lenis-prevent");
  dialogo.setAttribute("data-lenis-prevent", "");

  let abierto = false;
  function soltar() {
    if (!abierto) return;
    abierto = false;
    liberar(lenis);
  }
  // Escape y method="dialog" cierran sin pasar por limpiar.cerrar(). `close` llega en otra
  // tarea: si el diálogo ya se reabrió, es de un cierre anterior
  function alCerrar() {
    if (!dialogo.open) soltar();
  }
  dialogo.addEventListener("close", alCerrar);

  let hecho = false;
  function limpiar() {
    if (hecho) return;
    hecho = true;
    limpiar.cerrar();
    dialogo.removeEventListener("close", alCerrar);
    if (!teniaAtributo) dialogo.removeAttribute("data-lenis-prevent");
    if (!externa) lenis.destroy();
  }
  limpiar.abrir = () => {
    if (hecho || abierto) return;
    abierto = true;
    bloquear(lenis);
    dialogo.showModal();
  };
  limpiar.cerrar = () => {
    if (dialogo.open) dialogo.close();
    soltar();
  };
  return limpiar;
}
