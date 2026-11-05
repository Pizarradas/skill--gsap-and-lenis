/* Generado por herramientas/plantillas_globales.py desde plantillas/acordeon.js. No lo edites a mano.
   Carga antes, con <script>: gsap. Expone Plantillas.acordeon. */
(function () {
  "use strict";

  /**
   * Acordeón accesible: cada botón con `aria-controls` abre su panel animando la altura hasta "auto".
   * El estado inicial se lee de `aria-expanded`. Los paneles cerrados llevan `hidden`,
   * así que no reciben foco ni los anuncian los lectores de pantalla.
   * Con movimiento reducido, abre y cierra sin animación.
   *
   * @param {string|Element} objetivo Contenedor del acordeón. Dentro de Shadow DOM, pasa el elemento.
   * @param {Object} [opciones]
   * @param {string} [opciones.botones="[aria-controls]"] Selector de los botones dentro del contenedor.
   * @param {number} [opciones.duracion=0.3] Duración en segundos.
   * @param {string} [opciones.ease="power2.inOut"] Curva.
   * @param {boolean} [opciones.unico=true] Si es true, abrir un panel cierra los demás.
   * @returns {() => void} Función de limpieza: quita listeners y restaura `aria-expanded`, `hidden` y estilos.
   * @example
   * const limpiar = acordeon(raiz.querySelector(".preguntas"), { unico: false });
   */
  function acordeon(objetivo, opciones = {}) {
    const { botones = "[aria-controls]", duracion = 0.3, ease = "power2.inOut", unico = true } = opciones;
    const raiz = gsap.utils.toArray(objetivo)[0];
    const lista = gsap.utils.toArray(botones, raiz);
    const ambito = raiz.getRootNode(); // document o ShadowRoot: un id solo es único dentro de su árbol
    const parejas = lista.map((boton) => ({
      boton,
      panel: ambito.getElementById(boton.getAttribute("aria-controls")),
    }));
    const estado = parejas.map(({ boton, panel }) => ({
      expandido: boton.getAttribute("aria-expanded"),
      oculto: panel.hidden,
      altura: panel.style.height,
      desborde: panel.style.overflow,
    }));

    const ctx = gsap.context(() => {
      gsap.matchMedia().add(
        { normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" },
        (contexto, seguro) => {
          const { reducido } = contexto.conditions;

          parejas.forEach(({ boton, panel }) => {
            panel.hidden = boton.getAttribute("aria-expanded") !== "true";
          });

          const alternar = seguro(({ boton, panel }, abrir) => {
            boton.setAttribute("aria-expanded", abrir);
            if (reducido) {
              panel.hidden = !abrir;
              return;
            }
            const altura = panel.hidden ? 0 : panel.offsetHeight; // conserva la altura si se interrumpe
            panel.hidden = false;
            gsap.fromTo(
              panel,
              { height: altura, overflow: "hidden" },
              {
                height: abrir ? "auto" : 0,
                duration: duracion,
                ease,
                overwrite: true,
                onComplete: () => {
                  panel.hidden = !abrir;
                  gsap.set(panel, { clearProps: "height,overflow" }); // altura libre: sigue al contenido
                },
              }
            );
          });

          const alPulsar = (e) => {
            const pareja = parejas.find(({ boton }) => boton === e.currentTarget);
            const abrir = pareja.boton.getAttribute("aria-expanded") !== "true";
            if (abrir && unico) {
              parejas
                .filter((p) => p !== pareja && p.boton.getAttribute("aria-expanded") === "true")
                .forEach((p) => alternar(p, false));
            }
            alternar(pareja, abrir);
          };

          lista.forEach((boton) => boton.addEventListener("click", alPulsar));

          return () => {
            lista.forEach((boton) => boton.removeEventListener("click", alPulsar));
            parejas.forEach(({ boton, panel }, i) => {
              estado[i].expandido === null
                ? boton.removeAttribute("aria-expanded")
                : boton.setAttribute("aria-expanded", estado[i].expandido);
              panel.hidden = estado[i].oculto;
              // A mano: con varios fromTo en el panel, revert() deja aquí lo que capturó el último en Firefox.
              panel.style.height = estado[i].altura;
              panel.style.overflow = estado[i].desborde;
            });
          };
        }
      );
    });

    return () => ctx.revert();
  }

  (window.Plantillas = window.Plantillas || {}).acordeon = acordeon;
})();
