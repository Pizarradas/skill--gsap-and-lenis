---
id: com-anclas
titulo: Anclas y enlaces internos
capa: 04-comportamiento
tipo: concepto
ambito: core
resumen: Sin anchors, un enlace #id salta de forma nativa y durante una animación se pierde. Con anchors se anima, conserva la URL y admite opciones de scrollTo.
api: [LenisOptions.anchors, Lenis.scrollTo, ScrollToOptions.offset]
requiere: [fun-modelo]
relacionadas: [api-scrollto, opc-automatico, rec-menu-anclas]
etiquetas: [anclas, enlaces, hash, scroll-margin]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Anclas y enlaces internos

Un enlace `#id` funciona con Lenis, porque el scroll es real: el navegador salta y Lenis se sincroniza. Lo que falla es hacerlo **mientras hay una animación**, ya que Lenis sobrescribe el salto. La opción `anchors` resuelve las dos cosas. [C] [E]

## Modelo mental

| | Sin `anchors` | `anchors: true` | `anchors: { ...ScrollToOptions }` |
|---|---|---|---|
| En reposo | Salto nativo | Animación | Animación con esas opciones |
| Durante una animación | **Se pierde** | Reorienta al ancla | Ídem |
| Actualiza `location.hash` | Sí | Sí | Sí |

Con `anchors`, Lenis escucha `click` en `wrapper` y busca en la ruta del evento un `<a>` del mismo host y `pathname`, con hash. Llama a `scrollTo` con el hash decodificado. [C]

**No llama a `preventDefault`**: el navegador también ejecuta el enlace. Por eso `hash` y `:target` siguen funcionando, y `scrollTo` ya lanzó la animación, que recoloca el scroll en el siguiente fotograma. [C] [E]

Los márgenes CSS se respetan: `scroll-margin-top` en el destino y `scroll-padding-top` en la raíz se restan de la posición, igual que en una navegación nativa. Desde v1.3.25 se admiten ids con caracteres especiales. [C], con [E] de `scrollTo` en [`api-scrollto`](../03-api/api-scrollto.md)

## Ejemplo

```html
<a id="ir" href="#destino">Ir</a>
<div id="destino" style="margin-top:1500px;height:50px"></div>
```

```js
const lenis = new Lenis({ autoRaf: true, anchors: { offset: -20, duration: 0.2 } });
const prevenido = [];
addEventListener("click", (e) => prevenido.push(e.defaultPrevented));

document.getElementById("ir").click();
await espera(50);
const aMitad = window.scrollY;
await espera(700);
const final = window.scrollY;
const hash = location.hash;
lenis.destroy();
// prueba: aMitad < final && Math.abs(final - 1500 - document.getElementById("ir").offsetHeight + 20) < 30
// prueba: hash === "#destino" && prevenido[0] === false
```

Sin la opción, el enlace funciona en reposo y se pierde a mitad de animación:

```html
<a id="ir" href="#destino">Ir</a>
<div id="destino" style="margin-top:1500px;height:50px"></div>
```

```js
const lenis = new Lenis({ autoRaf: true, duration: 0.2 });
const destino = document.getElementById("destino");

document.getElementById("ir").click();
await espera(100);
const enReposo = Math.abs(destino.getBoundingClientRect().top) < 1;

lenis.scrollTo(300);
await espera(30);
document.getElementById("ir").click();
await espera(700);
const perdido = Math.abs(window.scrollY - 300) < 2;
lenis.destroy();
// prueba: enReposo && perdido
```

Para `href="#"`, sin hash válido en la URL, Lenis no interviene y el navegador va arriba:

```html
<a id="arriba" href="#">Arriba</a>
```

```js
const lenis = new Lenis({ autoRaf: true, anchors: true });
lenis.scrollTo(500, { immediate: true });
document.getElementById("arriba").click();
const estado = lenis.isScrolling;
await espera(100);
const y = window.scrollY;
lenis.destroy();
// prueba: estado === false && y === 0
```

## Trampas

- **`href="#"` y `anchors`.** El salto es nativo e instantáneo. Para animarlo, usa `lenis.scrollTo('top')` o un `href="#top"`, que Lenis resuelve a 0 sin que exista ese id. [C] [E]
- **`anchors` en un contenedor.** Solo escucha dentro de `wrapper`: un menú externo no cuenta. Además, el salto nativo actúa sobre el contenedor. Llama a `scrollTo` a mano para el menú externo. [C]
- **URL con otra consulta.** Compara host y `pathname`, no `search`: `?a=2#x` desde `?a=1` se trata como interno, aunque el navegador cargue otra página. [C]
- **Cabecera fija.** Usa `scroll-margin-top` en el destino o `anchors: { offset: -80 }`; CSS es preferible, pues vale también sin JavaScript. [P]
- **Foco.** Lenis mueve el scroll, no el foco, pero al no cancelar el clic, el navegador mantiene su conducta de foco. Con lectores de pantalla, verifica la navegación. Ver [`cal-accesibilidad`](../07-calidad/cal-accesibilidad.md). [P]
- **`#` codificado mal.** Lenis ejecuta `decodeURIComponent` sin protección: un hash con `%` suelto lanza `URIError`. [C]
