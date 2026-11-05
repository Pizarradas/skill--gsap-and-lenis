---
id: rec-secuencia-imagenes
titulo: Secuencia de imágenes ligada al scroll
capa: 14-recetas
tipo: patron
ambito: ScrollTrigger
resumen: Reproduce fotogramas en canvas según el scroll, con objeto proxy, snap al entero, recorte cover y fotograma fijo en modo reducido.
api: [ScrollTrigger.Vars.scrub, ScrollTrigger.Vars.pin, gsap.TweenVars.snap, gsap.TweenVars.onUpdate]
requiere: [scr-scrub]
relacionadas: [rec-helpers, scr-pin, cal-rendimiento, cal-accesibilidad]
etiquetas: [scroll, canvas, imagen, plantilla]
fuentes:
  - docs/v3/HelperFunctions/helpers/imageSequenceScrub.md
  - docs/v3/Plugins/ScrollTrigger.md
estado: verificado
version: 3.15.1
---
# Secuencia de imágenes ligada al scroll

Un producto que gira, o una escena que avanza, fotograma a fotograma mientras el usuario hace scroll. Plantilla: `plantillas/secuenciaImagenes.js`. El catálogo oficial tiene `imageSequenceScrub`, más escueto: ver [rec-helpers](rec-helpers.md). [E]

## Problema

Vídeo con `currentTime` por scroll suele ir a saltos, porque depende de los fotogramas clave. Con imágenes sueltas hay control total, pero pintar cada una con un `<img>` en el DOM es lento y hay que cuidar la carga, la resolución y la relación de aspecto.

## Solución

Un tween sobre un objeto `{ fotograma }`, con `snap` para que sea entero, `ease: "none"` y `onUpdate` que dibuja en un canvas. El tween no toca el DOM: solo mueve un número. [O] [E]

```html
<section class="escena" style="height:400px">
  <canvas id="giro" width="100" height="100" style="display:block"></canvas>
</section>
```

```js
const fotograma = (color) => {
  const c = document.createElement("canvas");
  c.width = c.height = 4;
  const p = c.getContext("2d");
  p.fillStyle = color;
  p.fillRect(0, 0, 4, 4);
  return c.toDataURL();
};
const imagenes = ["#f00", "#0f0", "#00f"].map((color) => {
  const img = new Image();
  img.src = fotograma(color);
  return img;
});
await Promise.all(imagenes.map((img) => img.decode()));

const lienzo = document.getElementById("giro");
const pincel = lienzo.getContext("2d");
const estado = { fotograma: 0 };
const dibujar = () => pincel.drawImage(imagenes[estado.fotograma], 0, 0, 100, 100);
dibujar();

gsap.to(estado, {
  fotograma: imagenes.length - 1,
  snap: "fotograma",
  ease: "none",
  onUpdate: dibujar,
  scrollTrigger: { trigger: ".escena", start: "top top", end: "+=600", pin: true, scrub: true },
});

const st = ScrollTrigger.getAll()[0];
window.scrollTo(0, st.start + 300);
ScrollTrigger.update();
await new Promise((r) => setTimeout(r, 80));
const centro = [...pincel.getImageData(50, 50, 1, 1).data];
// prueba: estado.fotograma === 1
// prueba: centro[1] === 255 && centro[0] === 0
```

Recorte tipo `cover` en la plantilla: la escala es el máximo de `ancho_lienzo / ancho_imagen` y `alto_lienzo / alto_imagen`, y la imagen se centra. La resolución interna es el tamaño CSS por `devicePixelRatio`, limitado a 2. [E]

## Parámetros ajustables

| Opción | Por defecto | Efecto |
|---|---|---|
| `urls` | obligatoria | Fotogramas, en orden |
| `disparador` | el canvas | Elemento fijado y medido |
| `inicio` / `fin` | `"top top"` / `"+=200%"` | Longitud del recorrido; más longitud, avance más lento |
| `fijar` | `true` | `pin` del disparador |
| `suavizado` | `0.5` | `scrub` |
| `fotogramaEstatico` | último | Imagen mostrada con movimiento reducido |

## Variante con prefers-reduced-motion

No hay `ScrollTrigger` ni pin: se dibuja un fotograma representativo y el resto de la página sube con normalidad. [P] [E]

```js
window.matchMedia = (q) => ({ matches: /: reduce\)/.test(q), addListener() {}, removeListener() {} });
const mm = gsap.matchMedia();
let conScroll = false;
mm.add("(prefers-reduced-motion: no-preference)", () => {
  conScroll = true;
});
// prueba: conScroll === false && ScrollTrigger.getAll().length === 0
```

## Limpieza

`limpiar()` cancela las cargas pendientes (`onload = null`, `src = ""`), desconecta el `ResizeObserver`, vacía el canvas y restaura sus atributos `width` y `height` y el pin. [E]

```js fragmento
const urls = Array.from({ length: 120 }, (_, i) => `/frames/${i}.webp`);
const limpiar = secuenciaImagenes(raiz.querySelector(".giro"), { urls, fin: "+=300%" });
limpiar();
```

## Trampas

- **Fotograma sin cargar.** Dibujar una imagen incompleta no pinta nada y el canvas parpadea. La plantilla comprueba `complete` y `naturalWidth`, mantiene el fotograma anterior, y dibuja al llegar `onload` si sigue siendo el actual. [E]
- **Sin `snap`.** `estado.fotograma` vale 7,3, e `imagenes[7.3]` es `undefined`. [P]
- **Canvas sin tamaño en CSS.** La plantilla ajusta sus atributos a partir de su tamaño visible: sin `width` y `height` por CSS, con densidad 2 cada ajuste lo agranda. [P]
- **Cambiar `width` borra el lienzo.** Tras redimensionar hay que redibujar el fotograma actual; `ajustar()` lo hace. [P]
- **Cientos de imágenes pesadas.** 120 fotogramas a 200 KB son 24 MB que se cargan al entrar. Usa WebP o AVIF, carga por tramos, y reduce fotogramas: 24 bastan a menudo si el recorrido es corto. [P]
- **`scrub: true` y `pin` sobre el canvas directamente.** Funciona, pero un contenedor como disparador deja espacio para texto superpuesto y evita medir un elemento fijado. [P]
- **Sin alternativa textual.** Un canvas no tiene contenido para lectores: añade `role="img"` y `aria-label`. [P]
