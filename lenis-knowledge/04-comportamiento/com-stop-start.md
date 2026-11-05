---
id: com-stop-start
titulo: stop, start, isStopped, isLocked y autoToggle
capa: 04-comportamiento
tipo: concepto
ambito: core
resumen: Parar frente a bloquear, qué impide cada uno, papel de overflow y lenis.css, y el funcionamiento asíncrono de autoToggle.
api: [Lenis.stop, Lenis.start, Lenis.isStopped, Lenis.isLocked, Lenis.overflow, LenisOptions.autoToggle, ScrollToOptions.force, ScrollToOptions.lock]
requiere: [fun-modelo, fun-css]
relacionadas: [api-scrollto, opc-filtros, com-anidado, rec-modal]
etiquetas: [stop, start, overflow, modal, autoToggle]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# `stop`, `start` y `autoToggle`

`stop()` deja a la página sin scroll de usuario, normalmente para abrir un modal. Actúa en dos capas: Lenis cancela los gestos, y `lenis.css` aporta `overflow: clip`, que bloquea el resto. Sin la segunda, el teclado sigue funcionando. Lo que sigue describe la **ventana**: un contenedor se comporta de otro modo, [más abajo](#ventana-y-contenedor). [C] [E]

## Modelo mental

| | `stop()` | `scrollTo(x, { lock: true })` |
|---|---|---|
| Se activa | Al llamar, salvo con `autoToggle` | Al empezar la animación |
| Se libera | `start()` | Al llegar, o con `stop()` |
| Gestos | Cancelados | Cancelados |
| `scrollTo` sin `force` | Ignorado | Ignorado |
| `overflow` | `clip`, con `lenis.css` | No cambia |
| Teclado | Bloqueado con `lenis.css` | Nativo, y se sobrescribe |
| Clase | `lenis-stopped` | `lenis-locked` |
| Animación en curso | La detiene: en ventana, en el sitio | |

`stop()` y `start()` hacen un reinicio interno: anulan `lock`, paran la animación, igualan `animatedScroll` y `targetScroll` con el scroll real **de ese instante**, y emiten `scroll`. Ambos son idempotentes. [C] [E]

`overflow` es un getter: lee `overflow-y` o `overflow-x` calculado en `rootElement`. Sirve para saber el estado del CSS, no el de la instancia. [C] [E]

Resultados con teclado real (laboratorio: Chrome 156, 2026-11-05):

| Situación | Tecla `AvPág` | Rueda |
|---|---|---|
| Parado, con `lenis.css` | No se mueve | No se mueve |
| Parado, sin `lenis.css` | **Se mueve** | No se mueve |

En ventana, el `overflow` de `<html>` se traslada al viewport, y `clip` se comporta como `hidden`: el scroll programático sigue activo. Tanto `window.scrollTo()` como `force: true` mueven la página parada. [C] [E]

### Ventana y contenedor

En un contenedor no hay traslado al viewport, y `overflow: clip` hace que **deje de ser un contenedor de scroll**: `scrollTop` vale 0 mientras dure. Y `start()` hace su reinicio antes de quitar la clase: lee ese 0. El resultado depende de dónde venga `overflow`. Laboratorio, Chrome 156, 2026-11-05, desde `scrollTop` 500. [E] abajo

| Caja | `overflow` al parar | `stop()` | `scrollTo(900, { immediate, force })` | Tras `start()` | Tecla `AvPág`, parado |
|---|---|---|---|---|---|
| `overflow` en hoja, con `lenis.css` | `clip` | **Salta a 0**, también a mitad de animación | **No mueve** | `scrollTop` 500, pero `scroll` y `targetScroll` en 0. Una rueda de 100 salta a 100 | No se mueve |
| `overflow` en hoja, con `autoToggle` | `clip` | Salta a 0 | No mueve | 500 y coherente, tras la transición | No se mueve |
| `overflow` en línea, con `lenis.css` | `auto`: la regla no gana | En el sitio | Mueve | Coherente | **Se mueve** |
| `overflow` en hoja, sin `lenis.css` | `auto` | En el sitio | Mueve | Coherente | **Se mueve** |
| Con la regla de abajo | `hidden` | En el sitio | Mueve | Coherente | No se mueve |

La salida es que el contenedor parado siga siendo contenedor de scroll: `hidden` conserva `scrollTop` y bloquea teclado y barra. Sin `autoToggle`, con una regla tuya:

```css
.caja.lenis-stopped:not(.lenis-autoToggle) { overflow: hidden !important; }
```

El `!important` es necesario: `.lenis:not(.lenis-autoToggle).lenis-stopped` tiene más especificidad que una clase. Excluye `autoToggle`, o `start()` no llegará a reanudar: el `overflow` seguiría oculto. Con `autoToggle`, no llames a `stop()`: escribe `caja.style.overflow = "hidden"`, que lo detiene conservando la posición, y `start()` lo limpia y reanuda (laboratorio). Si ya pasaste por `clip`, `lenis.resize()` tras `start()` recupera `scroll`. [E]

### `autoToggle`

Invierte el flujo. Lenis observa el `overflow` de la raíz y se detiene o reanuda en consecuencia, de modo que cualquier código externo que ponga `overflow: hidden` para un modal detiene Lenis.

```text
stop() → style.overflow = 'clip' → transición de 1 ms → transitionend
       → overflow es hidden o clip → detención interna → isStopped = true
```

La transición la define `lenis.css`, con `transition-behavior: allow-discrete`. Consecuencias (laboratorio, salvo marca):

| Acción con `autoToggle` | Resultado |
|---|---|
| `stop()` | `isStopped` sigue `false` en esa línea; pasa a `true` tras la transición |
| `start()` | Quita el estilo; `isStopped` pasa a `false` tras la transición |
| Clase externa con `overflow: hidden` | Se detiene sola |
| `start()` con esa clase puesta | **No reanuda**: solo quita el estilo en línea |
| Quitar la clase | Reanuda sola |
| `style.overflow = 'hidden'` externo | Se detiene; `start()` lo limpia y reanuda |
| Crear la instancia con `overflow` ya oculto | Parada desde el inicio [E] |
| Sin `lenis.css`, `stop()` | `isStopped` no cambia, porque no hay transición; el teclado queda bloqueado por `clip` y **la rueda sigue moviendo la página** |
| Sin `lenis.css`, crear con `overflow` ya oculto | `isStopped` es `true` al crear, y **se queda así**: al quitar el `overflow` no llega ninguna transición, y `start()` tampoco lo cambia |

El arnés no sirve para esto: en su `iframe` fuera de pantalla las transiciones no terminan.

## Ejemplo

En ventana:

```js
const lenis = new Lenis();
const emitidos = [];
lenis.on("scroll", () => emitidos.push(lenis.isStopped));

lenis.scrollTo(1000);
lenis.raf(1000);
lenis.raf(1016);
lenis.raf(1032);
lenis.stop();
const enEseSitio = lenis.scroll;
const r = {
  parado: lenis.isStopped,
  clip: lenis.overflow,
  clase: lenis.className,
  destino: lenis.targetScroll === lenis.animatedScroll,
};
lenis.raf(1048);
lenis.raf(1064);
const quieto = lenis.scroll === enEseSitio;

rueda(100);
lenis.scrollTo(50);
const ignorados = lenis.targetScroll === enEseSitio;

lenis.scrollTo(600, { immediate: true, force: true });
const forzado = window.scrollY;
const sigueParado = lenis.isStopped;

lenis.start();
lenis.start();
const reanudado = { parado: lenis.isStopped, visible: lenis.overflow };
rueda(100);
const moverOtraVez = lenis.targetScroll;
lenis.destroy();
// prueba: r.parado && r.clip === "clip" && r.clase.includes("lenis-stopped") && r.destino
// prueba: enEseSitio > 0 && quieto && ignorados
// prueba: forzado === 600 && sigueParado
// prueba: reanudado.parado === false && reanudado.visible === "visible" && moverOtraVez === 700
// prueba: emitidos.includes(true)
```

En un contenedor con `overflow` en hoja, y con la regla que lo arregla:

```html
<style>
  .caja { height: 300px; overflow: auto; }
  .caja.buena.lenis-stopped:not(.lenis-autoToggle) { overflow: hidden !important; }
</style>
<div class="caja mala"><div class="dentro" style="height:3000px"></div></div>
<div class="caja buena"><div class="dentro" style="height:3000px"></div></div>
```

```js
const probar = (caja) => {
  const lenis = new Lenis({ wrapper: caja, content: caja.firstElementChild });
  lenis.scrollTo(500, { immediate: true });
  lenis.stop();
  const r = { overflow: lenis.overflow, parado: caja.scrollTop };
  lenis.scrollTo(900, { immediate: true, force: true });
  r.forzado = caja.scrollTop;
  lenis.scrollTo(500, { immediate: true, force: true });
  lenis.start();
  r.real = caja.scrollTop;
  r.lenis = lenis.scroll;
  lenis.resize();
  r.trasResize = lenis.scroll;
  lenis.destroy();
  return r;
};
const mala = probar(document.querySelector(".mala"));
const buena = probar(document.querySelector(".buena"));
// prueba: mala.overflow === "clip" && mala.parado === 0 && mala.forzado === 0
// prueba: mala.real === 500 && mala.lenis === 0 && mala.trasResize === 500
// prueba: buena.overflow === "hidden" && buena.parado === 500 && buena.forzado === 900
// prueba: buena.real === 500 && buena.lenis === 500
```

`autoToggle`: lo que se puede comprobar de forma síncrona.

```html
<style>.oculto { overflow: hidden; }</style>
```

```js
const raiz = document.documentElement;
const lenis = new Lenis({ autoToggle: true });
const clase = raiz.classList.contains("lenis-autoToggle");

lenis.stop();
const pendiente = { parado: lenis.isStopped, estilo: raiz.style.overflow };
lenis.start(); // no surte efecto: isStopped aún es false
const trasStart = raiz.style.overflow;
raiz.style.removeProperty("overflow");
lenis.destroy();

raiz.classList.add("oculto");
const otra = new Lenis({ autoToggle: true });
const paradaAlCrear = otra.isStopped;
raiz.classList.remove("oculto");
otra.destroy();
// prueba: clase && pendiente.parado === false && pendiente.estilo === "clip"
// prueba: trasStart === "clip"
// prueba: paradaAlCrear === true
```

## Trampas

- **`stop()` sin `lenis.css`.** Bloquea gestos, no teclado: `AvPág`, espacio y barra mueven la página. [C] (laboratorio)
- **`autoToggle`: `stop()` y `start()` seguidos.** `start()` retorna porque `isStopped` aún es `false`, y la página queda en `clip`. Espera dos `requestAnimationFrame` entre ambos: con uno aún quedó en `clip`, en Chrome real. [C] [E] (laboratorio)
- **Leer `isStopped` tras `stop()` con `autoToggle`.** Aún es `false`. No encadenes lógica en la misma línea. (laboratorio)
- **`autoToggle` y modal con clase propia.** `start()` no puede quitar tu clase: quítala tú. (laboratorio)
- **`overflow: clip` y foco.** Con la página parada, el foco puede ir a elementos fuera de vista. Atrapa el foco en el modal. Ver [`rec-modal`](../08-recetas/rec-modal.md). [P]
- **Olvidar que `stop` no termina la animación.** La corta: `onComplete` no se ejecuta. [C]
- **Modal sobre un contenedor con `overflow` en hoja.** El contenido salta arriba al parar y vuelve al arrancar: [ventana y contenedor](#ventana-y-contenedor). Una salida probada: [`bloqueoModal`](../08-recetas/rec-modal.md) escribe `overflow: hidden` en línea antes de `stop()`. (laboratorio)
- **`start()` para soltar un `lock`.** No hace nada si no estaba parado. Con `force` o esperando al final. [C]
- **Snap con Lenis parado.** Sigue recibiendo `virtual-scroll` y cambia `currentSnapIndex`, sin mover nada. Ver [`snp-api`](../05-snap/snp-api.md). [E]
