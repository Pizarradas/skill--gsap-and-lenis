import Lenis from "lenis";

// `:host(...)` cubre al anfitrión como wrapper con el contenido en su sombra
const CSS_MINIMO = `
.lenis:not(.lenis-autoToggle).lenis-stopped, :host(.lenis:not(.lenis-autoToggle).lenis-stopped) { overflow: clip; }
.lenis [data-lenis-prevent], .lenis [data-lenis-prevent-wheel], .lenis [data-lenis-prevent-touch],
.lenis [data-lenis-prevent-vertical], .lenis [data-lenis-prevent-horizontal],
:host(.lenis) [data-lenis-prevent], :host(.lenis) [data-lenis-prevent-wheel], :host(.lenis) [data-lenis-prevent-touch],
:host(.lenis) [data-lenis-prevent-vertical], :host(.lenis) [data-lenis-prevent-horizontal] { overscroll-behavior: contain; }
.lenis.lenis-smooth iframe, :host(.lenis.lenis-smooth) iframe { pointer-events: none; }
.lenis.lenis-autoToggle, :host(.lenis.lenis-autoToggle) {
  transition-property: overflow; transition-duration: 1ms; transition-behavior: allow-discrete;
}
`;

/**
 * Crea una instancia de Lenis con su bucle y una limpieza completa.
 *
 * Llámala en cliente, cuando el contenedor ya exista. Si `wrapper` o `content` viven en un
 * Shadow DOM, adopta en esa raíz el CSS necesario, porque `lenis.css` no cruza la sombra.
 * Tras limpiar no queda ningún listener, ni siquiera el de `autoToggle`, que `destroy()` olvida.
 *
 * @param {object} [opciones] Opciones de Lenis, más:
 * @param {"propio"|false|((paso: (ms: number) => void) => (() => void))} [opciones.bucle="propio"]
 *   `"propio"` usa `autoRaf`. Una función conecta un reloj externo: recibe `paso(ms)`
 *   y devuelve cómo desconectarlo. `false` deja `lenis.raf(ms)` a tu cargo.
 * @returns {{ lenis: Lenis, limpiar: () => void }}
 */
export function iniciarScroll(opciones = {}) {
  const { bucle = "propio", autoRaf: _ignorada, ...resto } = opciones;
  const lenis = new Lenis({ ...resto, autoRaf: bucle === "propio" });
  const quitarBucle = typeof bucle === "function" ? bucle((ms) => lenis.raf(ms)) : undefined;

  const nodos = [lenis.rootElement, lenis.options.content];
  const sombras = [...new Set(nodos.map((nodo) => nodo.getRootNode()))].filter((raiz) => raiz instanceof ShadowRoot);
  const hoja = new CSSStyleSheet();
  hoja.replaceSync(CSS_MINIMO);
  for (const raiz of sombras) raiz.adoptedStyleSheets = [...raiz.adoptedStyleSheets, hoja];

  let hecho = false;
  function limpiar() {
    if (hecho) return;
    hecho = true;
    quitarBucle?.();
    const raizDesplazable = lenis.rootElement;
    lenis.destroy();
    // destroy() no retira este listener de autoToggle (1.3.27); onTransitionEnd es privado
    raizDesplazable.removeEventListener("transitionend", lenis.onTransitionEnd);
    for (const raiz of sombras) raiz.adoptedStyleSheets = raiz.adoptedStyleSheets.filter((h) => h !== hoja);
  }

  return { lenis, limpiar };
}
