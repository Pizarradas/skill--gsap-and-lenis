---
id: cmb-gestos
titulo: Draggable e Inertia en una página con Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis]
resumen: Con ratón y con toque nativo, sin conflicto. Con syncTouch, Lenis roba el arrastre a Draggable salvo con data-lenis-prevent-touch. Inertia y autoScroll conviven.
relacionadas: [orq-propiedad, cmb-observer, cmb-velocidad]
fuentes:
  - gsap:int-draggable
  - gsap:int-inertia
  - lenis:opc-tactil
  - lenis:opc-filtros
  - lab:conflictos-lab/h-gestos.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Draggable e Inertia con Lenis

**Veredicto:** compatible. Con `syncTouch: true`, a condición de marcar el elemento (O23).

Alcance: ventana, y contenedor solo en `type: "scrollTop"`; ratón y toque reales por el protocolo de depuración, Chrome. Firefox y dispositivo, sin ejecutar. [P]

Deslizamiento táctil de 130 px hacia arriba, sobre un Draggable: [E]

| `syncTouch` | Atributo | `type: "x,y"`: elemento, página | `type: "x"`: página |
|---|---|---|---|
| `false` | Ninguno | −130, 0 | 115 |
| `true` | Ninguno | **−7, 130: lo roba Lenis** | 130 |
| `true` | `data-lenis-prevent` | −130, 0 | 115 |
| `true` | `data-lenis-prevent-touch` | −130, 0 | 115 |

`data-lenis-prevent-touch` es lo justo: por código, solo filtra el toque, y la rueda sigue llegando a Lenis. [C]

## Ejemplo

```html
<div id="ficha" data-lenis-prevent-touch style="width:100px;height:100px"></div>
```

```js
const lenis = new Lenis({ syncTouch: true });
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
const d = Draggable.create("#ficha", { type: "x,y" })[0];
const ficha = document.querySelector("#ficha");
await espera(40);
toque("touchstart", 50, 300, ficha);
toque("touchmove", 50, 250, ficha);
toque("touchmove", 50, 200, ficha);
await espera(100);
const y = window.scrollY;
toque("touchend", 50, 200, ficha);
d.kill();
gsap.ticker.remove(paso);
lenis.destroy();
// prueba: y === 0
```

El contraejemplo necesita el toque real, y no el sintético del arnés: es la fila en negrita.

## Lo demás

| Combinación | Resultado |
|---|---|
| Arrastre con ratón y rueda a la vez | La página va a 400 y Draggable compensa: el elemento sigue bajo el puntero |
| `autoScroll: 1` | Mueve la página en nativo, Lenis la sigue. Un gesto después parte bien: 1229 + 100 = 1329 |
| `type: "scrollTop"` con `inertia` en un área con `data-lenis-prevent` | Se lanza y frena: 514, 628, página en 0 |
| `type: "scrollTop"` sobre el propio contenedor de Lenis | Coherente: 419, y la rueda sigue en 519 |
| `inertia` en un tween con velocidad de `getVelocity()` | Independiente del scroll |

Un área interior con `data-lenis-prevent` no es scroll de Lenis, y ahí `ScrollToPlugin` sigue siendo válido, aunque la página esté en plena inercia:

```html
<div id="area" data-lenis-prevent style="height:200px;overflow:auto"><div style="height:1500px"></div></div>
```

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
const area = document.querySelector("#area");
await espera(40);
rueda(1500);
await espera(100);
gsap.to(area, { scrollTo: 600, duration: 0.2 });
await espera(500);
const dentro = area.scrollTop;
gsap.ticker.remove(paso);
lenis.destroy();
window.scrollTo(0, 0);
// prueba: dentro === 600
```

## Trampas

- Lanzar con inercia sobre el `wrapper` de Lenis escribe el scroll por fuera de Lenis: rige [`cmb-scroll-programatico`](cmb-scroll-programatico.md). [P]
- `data-lenis-prevent` en un Draggable corta también la rueda sobre él. [C]
