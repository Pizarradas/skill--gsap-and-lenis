---
id: fra-vanilla
titulo: GSAP sin framework: páginas de servidor y transiciones
capa: 12-frameworks
tipo: patron
ambito: transversal
resumen: Aplicar el contrato en páginas sin framework: PHP, plantillas, HTML estático, carga por CDN y transiciones de página con Barba o Swup.
api: [gsap.context, gsap.Context.revert, gsap.Context.add, Animation.revert]
requiere: [fra-agnostico]
relacionadas: [nuc-context, nuc-limpieza, fra-wordpress, fra-webflow, fun-instalacion, cal-st-errores]
etiquetas: [sin-framework, php, plantillas, spa]
fuentes:
  - resources/frameworks.md
  - docs/v3/GSAP/gsap.context().md
  - https://github.com/greensock/gsap-skills
estado: verificado
version: 3.15.1
---
# GSAP sin framework

En una página tradicional, el documento completo es la vista: se monta al cargar y se descarta al navegar. El [contrato](fra-agnostico.md) se reduce a esperar al DOM. Esta ficha cubre lo que cambia cuando no hay framework.

| Cambio | Evento | Salida | Flip tras actualizar | Ruta |
|---|---|---|---|---|
| Tween con `overwrite: "auto"`, en `ctx.add()` si la vista se retira | Listener directo; `ctx.add()` si la vista se retira | Anima y quita el nodo en `onComplete` | `Flip.getState()`, cambio síncrono, `Flip.from()` | Recarga completa: nada. Sin recarga: `montar` y `desmontar` en los ganchos de la librería |

## Problema

Sin ciclo de vida de componentes hay que decidir tres cosas: cómo cargar GSAP, cuándo arrancar, y qué hacer si una librería sustituye el contenido sin recargar.

## Solución

### Página de servidor o HTML estático

```text
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js" defer></script>
<script src="/js/animacion.js" defer></script>
```

Con `defer` los scripts respetan su orden y corren con el HTML ya analizado. Si cada navegación recarga la página, no hace falta limpiar: el navegador lo descarta todo. Sí hace falta en cuanto algo sustituye contenido sin recargar. Respeta siempre el movimiento reducido: `gsap.matchMedia()` ya agrupa lo creado dentro. [P]

```js
gsap.registerPlugin(ScrollTrigger);

gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
  document.querySelectorAll(".bloque").forEach((bloque) => {
    gsap.from(bloque, {
      autoAlpha: 0,
      y: 20,
      duration: 0.1,
      scrollTrigger: { trigger: bloque, start: "top bottom" },
    });
  });
});

window.addEventListener("load", () => ScrollTrigger.refresh());
// prueba: ScrollTrigger.getAll().length === 3
```

### Módulos sin empaquetador

Usa un import map, con una entrada para `gsap` y otra por plugin: así el código y las plantillas conservan `import gsap from "gsap"`. Ejemplo y trampas: [vías de carga](../01-fundamentos/fun-instalacion.md). Las plantillas sirven tal cual en esta vía; con `<script>` clásico, usa `plantillas/globales/`. [E]

Todas las URL deben apuntar a la misma versión. Cargar `dist/gsap.min.js` y mapear además `gsap` crea dos núcleos: `window.gsapVersions.length` vale 2. [E]

### Transiciones de página sin recarga

Con Barba, Swup o similares, el documento ya no se descarta, y vuelve a aplicar el contrato completo. Guarda un `desmontar` por vista:

```js fragmento
let desmontar;

function alEntrar(contenedor) {
  desmontar = montar(contenedor);   // adaptador de fra-agnostico
}

function alSalir() {
  desmontar?.();
}
```

Si la vista nueva cambia la altura sin recrear triggers, basta `ScrollTrigger.refresh()`. [O]

### Contenido parcial

Si un script de servidor inyecta HTML por `fetch`, monta sobre el nodo insertado, no sobre `document`, y añade `ScrollTrigger.refresh()`. Ver [cal-st-errores](../13-calidad/cal-st-errores.md). [O]

### Manejadores

Sin vista que retirar, un listener directo basta. Dentro de una vista desmontable, usa `self.add()` para registrar lo creado más tarde: [O]

```js
const boton = document.querySelector(".accion");

const ctx = gsap.context((self) => {
  self.add("pulsar", () => gsap.to(boton, { rotation: 90, duration: 0.2 }));
  boton.addEventListener("click", self.pulsar);
  return () => boton.removeEventListener("click", self.pulsar);
}, boton);

boton.click();
await new Promise((r) => setTimeout(r, 300));
const giro = gsap.getProperty(boton, "rotation");
ctx.revert();
// prueba: giro === 90 && gsap.getProperty(boton, "rotation") === 0
```

## Trampas

- **Script antes del HTML, sin `defer`.** El selector no encuentra nada: `GSAP target … not found`. Usa `defer` o `alEstarListo` del [contrato](fra-agnostico.md): `DOMContentLoaded` a secas no llega a un script tardío. [E]
- **`revert()` es definitivo para lo que contenía.** No sirve de pausa. Para reiniciar, ejecuta otra vez la función o crea otro contexto. [O]
- **`kill()` no es `revert()`.** `kill()` deja los estilos inline a medio camino. [O]
- **Caché de páginas (`bfcache`).** Al volver atrás el navegador restaura el estado anterior, con animaciones incluidas: no se reejecutan tus scripts. Sin verificar. [P]
- **Versión flotante en el CDN.** `gsap@3.15` cambia sin avisar. Fija la versión completa en producción. [P]
