---
id: rec-scroll-to-top
titulo: Botón de volver arriba
capa: 08-recetas
tipo: patron
ambito: core
resumen: Botón que aparece tras un umbral, vuelve arriba con Lenis y deja el foco en un lugar útil.
api: [Lenis.scrollTo, ScrollToOptions.duration, ScrollToOptions.easing, ScrollToOptions.onComplete, ScrollToOptions.onStart, ScrollToOptions.lock]
requiere: [api-scrollto]
relacionadas: [cal-accesibilidad, com-stop-start, rec-menu-anclas]
etiquetas: [scrollto, boton, foco, plantilla]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Botón de volver arriba

Muestra un botón al avanzar y vuelve al inicio con la misma animación que el resto del scroll. Plantilla: `plantillas/botonArriba.js` con módulos, o `plantillas/globales/botonArriba.js` con `<script>` clásico, que expone `Plantillas.botonArriba`. Ver [cómo copiarla](../plantillas/README.md#copiar-a-un-proyecto).

## Problema

`window.scrollTo({ behavior: "smooth" })` compite con Lenis y usa otra curva. Además, al llegar arriba el botón se oculta, y si tenía el foco, este se pierde.

## Solución

Usa `lenis.scrollTo(0)`. Mueve el foco **al pulsar**, antes de que el botón se oculte y sin depender de que termine la animación.

```html
<main id="contenido"><h1>Inicio</h1></main>
<button id="subir" style="position:fixed;bottom:0" hidden>Volver arriba</button>
<div style="height:4000px"></div>
```

```js
const boton = document.querySelector("#subir");
const principal = document.querySelector("#contenido");
const lenis = new Lenis({ autoRaf: true, lerp: 0.3 });

const quitar = lenis.on("scroll", () => {
  boton.hidden = lenis.scroll < 600;
});

boton.addEventListener("click", () => {
  principal.setAttribute("tabindex", "-1");
  principal.focus({ preventScroll: true });
  lenis.scrollTo(0, { duration: 0.4 });
});

rueda(900);
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);
const visible = !boton.hidden;

boton.click();
const conFoco = document.activeElement === principal;
for (let i = 0; lenis.isSmooth && i < 200; i++) await espera(20);

// prueba: visible && conFoco
// prueba: lenis.scroll === 0 && boton.hidden
```

## Parámetros

| Plantilla | Por defecto | Uso |
|---|---|---|
| `lenis` | crea una | Instancia compartida |
| `umbral` | `600` | Píxeles para mostrarlo |
| `foco` | primer `main` de su raíz | Destino del foco |
| `duracion` | la de la instancia | Segundos |

| Valor de `scrollTo` | Destino [C] |
|---|---|
| `0`, `"top"`, `"left"`, `"start"`, `"#"` | Inicio |
| `"bottom"`, `"right"`, `"end"` | `limit` |

Con `duration` sin `easing`, Lenis aplica su curva por defecto; con `easing` sin `duration`, dura 1 segundo [C].

## Movimiento reducido

No hace falta rama propia: con `prefers-reduced-motion`, `scrollTo` se vuelve `immediate` [C].

```js
const preferencia = { matches: true, addEventListener() {}, removeEventListener() {} };
window.matchMedia = () => preferencia; // solo para la prueba

const lenis = new Lenis({ autoRaf: true });
lenis.scrollTo(500, { immediate: true });
let llamadas = 0;
lenis.scrollTo(0, { duration: 2, onComplete: () => llamadas++ });

// prueba: lenis.scroll === 0
// prueba: llamadas === 1
```

Si la animación es esencial y quieres ignorar la preferencia, `respectReducedMotion: false`. Es una decisión que el usuario no pidió. [P]

## Limpieza

Quita la suscripción y el listener de clic. La plantilla devuelve `hidden` a su valor inicial y retira el `tabindex` temporal [E].

## Trampas

- **`onComplete` no se ejecuta si una rueda interrumpe.** Lenis sustituye la animación en curso y su callback se pierde. No pongas ahí nada imprescindible. [E, abajo]
- **Con la instancia parada, `scrollTo` no hace nada** ni llama a sus callbacks. Pasa `force: true` si debe moverse igualmente. [C] [E]
- **`lock: true` bloquea los gestos hasta el destino.** Si un usuario quiere frenar la subida, no puede. Resérvalo para movimientos cortos. [P]
- **Si ya estás en el destino,** se llaman `onStart` y `onComplete` al instante y no se emite `scroll`. [C] [E, abajo]
- **Dentro de `<a href="#">`** el navegador también salta. Usa `<button>`. [P]
- **`hidden` no funciona si tu CSS fija `display`.** La regla de autor gana a la del navegador. [P]

```js
const lenis = new Lenis({ autoRaf: true, lerp: 0.2 });
lenis.scrollTo(1500, { immediate: true });

let completado = 0;
lenis.scrollTo(0, { duration: 1, onComplete: () => completado++ });
await espera(100);
rueda(100); // interrumpe
await espera(1300);

let enElSitio = 0;
const posicion = lenis.scroll;
lenis.scrollTo(posicion, { onComplete: () => enElSitio++ });

// prueba: completado === 0
// prueba: enElSitio === 1
```
