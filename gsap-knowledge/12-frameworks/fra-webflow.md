---
id: fra-webflow
titulo: GSAP en Webflow
capa: 12-frameworks
tipo: guia
ambito: transversal
resumen: Integración de GSAP desde los ajustes del sitio, dónde poner código propio, registro de plugins y cómo convive con las Interactions visuales.
api: [gsap.registerPlugin, gsap.to, SplitText.create]
requiere: [fra-vanilla]
relacionadas: [fra-agnostico, fun-instalacion, cal-fouc, cal-conflictos, fra-wordpress]
etiquetas: [webflow, cms, cdn]
fuentes:
  - resources/Webflow.md
estado: verificado
version: 3.15.1
---
# GSAP en Webflow

Webflow ofrece dos caminos: **Interactions**, un editor visual con línea de tiempo basado en GSAP, y **código propio**, con la librería y sus plugins cargados desde los ajustes del sitio. Ambos están disponibles para todos los clientes de Webflow. [O]

| Quiero | Camino |
|---|---|
| Animaciones sin código, con previsualización y reutilización entre páginas | Interactions |
| SplitText o ScrollTrigger con ajustes visuales | Interactions: los incluye [O] |
| Lógica propia, condiciones o cualquier plugin | Código propio |

El soporte del producto y sus interfaces corresponde a Webflow, no a GSAP. [O]

## Pasos

1. Abre el sitio y entra en **Settings**.
2. Abre **GSAP integration**, activa la librería y marca los plugins que uses. [O]
3. En la página, abre **Page settings** y localiza **Custom code → Before `</body>` tag**. [O]
4. Escribe tu código en un `<script>`, esperando a que el DOM esté listo y registrando los plugins antes de usarlos. [O]

| Cambio | Evento | Salida | Flip tras actualizar | Ruta |
|---|---|---|---|---|
| Tween con `overwrite: "auto"` | Listener directo en tu `<script>` | Anima y oculta o quita en `onComplete`, o usa una Interaction de salida | `Flip.getState()`, cambio síncrono, `Flip.from()` | Recarga completa: nada que limpiar |

Si el mismo sitio usa un cargador de páginas sin recarga, aplica el [contrato](fra-agnostico.md) completo. La tabla no se ha ejecutado en Webflow: es JavaScript sin framework, probado en [fra-vanilla](fra-vanilla.md). [P]

```html
<script>
function arrancar() {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const partes = SplitText.create(".titular", { type: "words" });

  gsap.from(partes.words, {
    y: 30,
    autoAlpha: 0,
    stagger: 0.05,
    scrollTrigger: { trigger: ".titular", start: "top 80%" },
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar, { once: true });
else arrancar();
</script>
```

La lógica interior es JS normal con las globales `gsap`, `ScrollTrigger` y `SplitText`:

```js
gsap.registerPlugin(ScrollTrigger, SplitText);
const partes = SplitText.create(".titular", { type: "words" });
gsap.from(partes.words, { y: 30, autoAlpha: 0, stagger: 0.02, duration: 0.1 });
await new Promise((r) => setTimeout(r, 300));
// prueba: partes.words.length > 1
// prueba: gsap.getProperty(partes.words[0], "y") === 0
```

## Trampas

- **La integración es para todo el sitio.** Si solo una página necesita un plugin, cárgalo con una etiqueta `<script>` en esa página en lugar de marcarlo en los ajustes. [O]
- **Plugin sin marcar.** Si no lo activaste, la global no existe y `gsap.registerPlugin(SplitText)` lanza `ReferenceError`. Comprueba la casilla. [P]
- **`DOMContentLoaded` a secas.** Si el código llega tarde, por un gestor de etiquetas o un retraso de JavaScript, el evento ya pasó y no arranca nada: por eso el ejemplo comprueba `document.readyState`. La guía oficial muestra el registro sin envolver: mantenlo todo en `arrancar`, porque el selector necesita el DOM. [E]
- **Interactions y código sobre el mismo elemento.** Ambos escriben `transform` y `opacity`. Dos animaciones simultáneas compiten igual que dos tweens sin `overwrite`: separa los elementos o usa solo un camino. Ver [conflictos](../13-calidad/cal-conflictos.md). [P]
- **Interacciones de CSS (`transition`) en el panel de estilos.** Webflow las aplica con pocos clics, y retrasan a GSAP en esos elementos. Ver [errores comunes](../13-calidad/cal-errores-comunes.md). [P]
- **FOUC.** El código va antes de `</body>`, tras pintar el contenido inicial. Si animas una entrada, oculta con CSS en **Head code** y revela con `autoAlpha`. Ver [cal-fouc](../13-calidad/cal-fouc.md). [P]
