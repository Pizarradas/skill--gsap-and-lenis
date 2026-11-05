---
id: esp-gsdevtools
titulo: GSDevTools, interfaz de depuración de animaciones
capa: 11-especializados
tipo: plugin
ambito: GSDevTools
resumen: Barra de control visual para reproducir, cortar y ralentizar animaciones, con selector por id, atajos de teclado y persistencia entre recargas.
api: [GSDevTools.create, GSDevTools.getById, GSDevTools.kill, GSDevTools.Vars.animation, GSDevTools.Vars.container, GSDevTools.Vars.css, GSDevTools.Vars.globalSync, GSDevTools.Vars.hideGlobalTimeline, GSDevTools.Vars.id, GSDevTools.Vars.inTime, GSDevTools.Vars.keyboard, GSDevTools.Vars.loop, GSDevTools.Vars.minimal, GSDevTools.Vars.outTime, GSDevTools.Vars.paused, GSDevTools.Vars.persist, GSDevTools.Vars.timeScale, GSDevTools.Vars.visibility]
relacionadas: [cal-depuracion, svg-motionpathhelper, tim-etiquetas]
etiquetas: [depuracion, herramienta, desarrollo]
fuentes:
  - docs/v3/Plugins/GSDevTools.md
  - docs/v3/Plugins/GSDevTools/*
estado: verificado
version: 3.15.1
---
# GSDevTools

Añade a la página una barra para controlar animaciones de GSAP: reproducir, arrastrar, marcar puntos de entrada y salida, cambiar velocidad y saltar entre animaciones con `id`. Es solo para desarrollo. [O]

## Para qué sirve

Afinar una secuencia sin recargar ni esperar: aislar un tramo, verlo a cámara lenta y repetirlo.

## Registro

```js fragmento
import gsap from "gsap";
import { GSDevTools } from "gsap/GSDevTools";

gsap.registerPlugin(GSDevTools);
```

**Sin empaquetador:** `<script>` con `dist/GSDevTools.min.js` (global `GSDevTools`), o entrada `gsap/GSDevTools` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

`GSDevTools.create(vars?)` crea una instancia; `GSDevTools.getById(id)` la recupera y `instancia.kill()` la elimina.

| Opción | Efecto |
|---|---|
| `animation` | Tween, timeline o `id` por seleccionar. Por defecto, la línea global. **Recomendado** [O] |
| `id` | Identificador de la instancia |
| `inTime` `outTime` | Marcas por tiempo, etiqueta o `id` de animación |
| `loop` `paused` `timeScale` | Estado inicial |
| `persist` | `false` no recuerda ajustes. Si no, se guardan en `sessionStorage` [C] |
| `globalSync` | Sincronizar con la línea global. Por defecto, `true` solo si no pasas `animation` [C] |
| `hideGlobalTimeline` | Quita la línea global del menú |
| `minimal` | Solo controles básicos. Automático por debajo de 600 px [O] |
| `visibility` | `"auto"` oculta la barra al salir el ratón |
| `keyboard` | Atajos. Solo una instancia puede usarlos [O] |
| `container` `css` | Contenedor y estilos de la barra |

Atajos [O]:

| Tecla | Acción |
|---|---|
| Espacio | Reproducir o pausar |
| Arriba / Abajo | Cambiar `timeScale` |
| Izquierda / Derecha | Ir al inicio / al final |
| L | Alternar bucle |
| I / O | Fijar entrada / salida en el cabezal |
| H | Ocultar o mostrar |

Doble clic en una marca reinicia ambas. [O]

## Ejemplo

```html
<div class="escena" style="width:40px;height:40px"></div>
```

```js
const tl = gsap.timeline({ id: "intro" });
tl.to(".escena", { x: 200, duration: 0.2, id: "mover" })
  .addLabel("giro")
  .to(".escena", { rotation: 90, duration: 0.2, id: "rotar" });

const nodos = () => document.getElementsByClassName("gs-dev-tools").length;
const panel = GSDevTools.create({
  animation: tl,
  id: "principal",
  persist: false,
  keyboard: false,
  timeScale: 2,
  loop: true,
  minimal: true,
  css: { width: "50%" },
});
const creados = nodos();
const recuperado = GSDevTools.getById("principal") === panel;
await new Promise((r) => setTimeout(r, 60));
panel.kill();
const quedan = nodos();
// prueba: creados === 1 && recuperado === true
// prueba: quedan === 0
```

## Trampas

- **Sin `animation`, gestiona toda la línea global,** que graba durante los primeros `GSDevTools.globalRecordingTime` segundos (2 por defecto). Liga siempre un timeline concreto. [O] [C]
- **Solo una con `globalSync`,** y solo una con teclado. [O]
- **Los ajustes persisten.** Las marcas que dejes en la interfaz sobreviven a la recarga: si una animación "ya no empieza", puede ser eso. Usa `persist: false`, o pasa los valores en `create()`, que tienen prioridad. [O]
- **No funciona con ScrollTrigger.** La barra de scroll y el control de GSDevTools no pueden gobernar a la vez la misma animación. [O]
- **Línea global de 1000 segundos.** Tienes una animación con `repeat: -1`: la duración se limita a ese tope. [O]
- **El constructor está mal tipado.** `new GSDevTools(target, vars)` en los tipos, pero el código solo acepta `vars`. Usa `create()`. [C]
- **Sin documentar:** `GSDevTools.getByAnimation()`, y `getById()` sin argumento, que devuelve la instancia global. Tras `kill()`, `getById(id)` da `undefined`. [C] [E]
- **Fuera de producción.** Importa de forma condicional: añade peso y DOM. [P]
