import Lenis from "lenis";

/**
 * Dibuja un canvas con el mismo valor y en el mismo paso que mueve el DOM, con 2D, WebGL o
 * el motor que prefieras. No tiene bucle propio: dibuja al emitir `scroll` y al cambiar de
 * tamaño, así que en reposo no gasta nada y no introduce movimiento automático.
 * Una escena que se anima sola necesita un bucle único: ver `int-canvas-webgl`.
 *
 * @param {string|HTMLCanvasElement} objetivo El canvas, con tamaño fijado por CSS. En Shadow DOM, pasa el elemento.
 * @param {object} opciones
 * @param {(ctx: RenderingContext|null, estado: {scroll: number, progreso: number, velocidad: number, ancho: number, alto: number}) => void} opciones.dibujar Obligatoria.
 *   Con `"2d"` el canvas llega limpio y en píxeles CSS; con WebGL, con el `viewport` ajustado: limpiar es cosa tuya.
 * @param {"2d"|"webgl"|"webgl2"|null} [opciones.contexto="2d"] Contexto que se pide al canvas. `null`: el canvas
 *   es de un motor; `ctx` llega `null`, y su tamaño y sus píxeles quedan a cargo del motor, que recibe `ancho` y `alto`.
 * @param {Lenis} [opciones.lenis] Instancia existente. Sin ella se crea una y se destruye al limpiar.
 * @param {number} [opciones.densidadMaxima=2] Tope de `devicePixelRatio`.
 * @returns {(() => void) & { redibujar: () => void }} Limpieza. `limpiar.redibujar()` pinta si cambian
 *   tus datos; devuelve el canvas a su tamaño y atributos originales al limpiar.
 */
export function sincronizarCanvas(objetivo, opciones = {}) {
  const canvas = typeof objetivo === "string" ? document.querySelector(objetivo) : objetivo;
  if (!canvas) throw new TypeError("sincronizarCanvas: objetivo no encontrado");
  const { lenis: externa, dibujar, densidadMaxima = 2, contexto = "2d" } = opciones;
  if (typeof dibujar !== "function") throw new TypeError("sincronizarCanvas: falta opciones.dibujar");

  const ctx = contexto === null ? null : canvas.getContext(contexto);
  if (contexto !== null && !ctx) {
    throw new TypeError(
      `sincronizarCanvas: no se obtuvo el contexto "${contexto}": el canvas ya tiene otro o el navegador no lo admite. ` +
        "Pasa el contexto correcto en opciones.contexto, o null si el canvas es de un motor de dibujo",
    );
  }
  const es2d = contexto === "2d";
  const lenis = externa ?? new Lenis({ autoRaf: true });
  const previo = { ancho: canvas.getAttribute("width"), alto: canvas.getAttribute("height") };
  let ancho = 0;
  let alto = 0;

  function pintar() {
    if (es2d) ctx.clearRect(0, 0, ancho, alto);
    dibujar(ctx, {
      scroll: lenis.scroll,
      progreso: lenis.limit > 0 ? lenis.progress : 0,
      velocidad: lenis.velocity,
      ancho,
      alto,
    });
  }

  function medir() {
    const densidad = Math.min(window.devicePixelRatio || 1, densidadMaxima);
    ancho = canvas.clientWidth;
    alto = canvas.clientHeight;
    if (ctx) {
      canvas.width = Math.round(ancho * densidad);
      canvas.height = Math.round(alto * densidad);
    }
    if (es2d) ctx.setTransform(densidad, 0, 0, densidad, 0, 0);
    else ctx?.viewport(0, 0, canvas.width, canvas.height);
    pintar();
  }

  function restaurarAtributo(nombre, valor) {
    if (valor === null) canvas.removeAttribute(nombre);
    else canvas.setAttribute(nombre, valor);
  }

  const observador = new ResizeObserver(() => {
    if (canvas.clientWidth !== ancho || canvas.clientHeight !== alto) medir();
  });
  const quitar = lenis.on("scroll", pintar);
  observador.observe(canvas);
  medir();

  let hecho = false;
  function limpiar() {
    if (hecho) return;
    hecho = true;
    quitar();
    observador.disconnect();
    if (ctx) {
      restaurarAtributo("width", previo.ancho);
      restaurarAtributo("height", previo.alto);
    }
    if (!externa) lenis.destroy();
  }
  limpiar.redibujar = () => {
    if (!hecho) pintar();
  };
  return limpiar;
}
