# Lo que no está verificado

Lo ejecutado se hizo en Chrome 156 y Firefox 159, en escritorio, con gsap 3.15.1 y lenis 1.3.27. Este es el límite de esa evidencia.

| Área | Estado |
|---|---|
| Safari y iOS | Sin ejecutar. Ninguna regla está probada ahí |
| Dispositivo táctil real | Sin ejecutar: barra de direcciones, `syncTouch` con pin, ScrollSmoother con `smoothTouch`. El toque se simuló por CDP solo en Chrome |
| `prefers-reduced-motion` real en Firefox | Sin ejecutar |
| `scrollend` en Firefox | Sin ejecutar |
| Firefox en laboratorio con rueda real | Sin toque, Draggable, Flip, SplitText, horizontal ni `infinite`. Sus bloques sí corren en el arnés |
| `pinType: "fixed"` en un contenedor desplazado | Sin ejecutar |
| Recetas con ambas bibliotecas | `rec-barra-progreso`, `rec-nav-direccion`, `rec-scroll-to-top`, `rec-canvas-sync` y `scr-batch`, razonadas [P] |
| Coste de ScrollSmoother | Una sola escena, pesada a propósito, solo en Chrome. Mídelo en tu página |
| Efectos de ScrollSmoother recreados tras `navegar` | Sin ejecutar |
| Rutas CDN del README de plantillas | Probadas con los mismos archivos servidos en local |
| Causa de O33 | Efecto medido en Chrome y Firefox con rueda real. Causa interna sin investigar |
| Interrumpir `irA` con ScrollSmoother | Rueda y `PageDown` reales en Chrome y Firefox. `touchstart` sin ejecutar con toque real |
| Foco en ancla interceptada | Enter y Tab reales en Chrome y Firefox. Sin lector de pantalla |
| Recarga en mitad de página con pin | Da 2400 en lugar de 4000, con y sin Lenis. No es de la combinación; causa sin investigar |
| Elección de perfil | Los criterios de `01-decidir` son juicio [P] apoyado en mediciones: la herramienta es determinista, no infalible |

Para probar en dispositivo: `gsap-knowledge/00-indice/pruebas-dispositivo.md` y `lenis-knowledge/00-indice/pruebas-dispositivo.md`.
