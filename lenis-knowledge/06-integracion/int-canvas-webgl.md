---
id: int-canvas-webgl
titulo: Sincronizar una escena de canvas o WebGL con Lenis
capa: 06-integracion
tipo: patron
ambito: transversal
resumen: Patrón motor.alDibujar para cualquier motor: un bucle para Lenis y el dibujo, leer scroll, alinear con el DOM en ventana y contenedor, y liberar. Three.js como caso.
api: [Lenis.raf, Lenis.scroll, Lenis.animatedScroll, Lenis.velocity, Lenis.progress, Lenis.limit, Lenis.on, Lenis.destroy, LenisOptions.autoRaf]
requiere: [int-contrato, com-raf]
relacionadas: [int-gsap, rec-canvas-sync, rec-parallax, cal-rendimiento, cal-accesibilidad]
etiquetas: [canvas, webgl, three, escena, render, bucle, velocity]
fuentes:
  - README.md
  - https://threejs.org/docs/
  - https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
estado: verificado
version: 1.3.27
---
# Sincronizar una escena con Lenis

Una escena no se desplaza: **lee** la posición y se dibuja. Por eso aplica el [contrato](int-contrato.md) sin ningún cambio en Lenis, con dos deberes propios: leer el valor correcto en el momento correcto y liberar los recursos al salir. Vale para cualquier motor con un bucle por fotograma; Three.js es un caso. [P]

**Laboratorio del 2026-11-05.** Three.js 0.187.0 real, Lenis 1.3.27, Chrome 156 headless con WebGL 2 por software (ANGLE, Microsoft Basic Render Driver): la sincronía vale, las cifras de velocidad de dibujo no. Three.js no está en el arnés, y sus bloques son `fragmento`, con `setAnimationLoop` directo: la forma `motor.alDibujar` se ejecutó con un motor simulado. Sus API se leyeron del paquete: la página de documentación no devolvió contenido legible.

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| Al crear la escena: `entrar({ reloj })` con el bucle del motor | `lenis.resize()` si cambia el alto; rehacer medidas y lienzo al redimensionar | Parar el bucle, `salir()`, liberar GPU | [`colocar`](int-navegacion.md), y rehacer medidas | Nada, si no hay motor: `autoRaf`. Con motor, su bucle es el dueño de `raf` |

**Plantillas.** [`sincronizarCanvas`](../08-recetas/rec-canvas-sync.md) cubre el caso de dibujar según el scroll, con `contexto: "2d"`, `"webgl"`, `"webgl2"` o `null` si el canvas es de un motor. `iniciarScroll({ bucle })` conecta el reloj.

## Problema

Si la escena lee `scrollY` desde el evento `scroll` nativo, va un fotograma por detrás de Lenis, y una pieza WebGL pegada a un elemento HTML se separa de él mientras el usuario se desplaza.

## Solución

### Un bucle, en este orden

**El bucle de dibujo es el dueño de `raf`:** primero Lenis, después la escena, por último dibujar. El patrón necesita solo un motor con una entrada por fotograma, en milisegundos, y una baja. Comprueba la unidad del tuyo. [C] [E]

```js
// Tu motor: cualquier objeto con un bucle por fotograma
const motor = {
  dibujos: 0,
  alDibujar(fn) {
    let id = requestAnimationFrame(function f(t) {
      fn(t);
      id = requestAnimationFrame(f);
    });
    return () => cancelAnimationFrame(id);
  },
  dibujar(y) { this.dibujos++; this.y = y; },
};

const lenis = new Lenis({ lerp: 0.5 });     // sin autoRaf
const parar = motor.alDibujar((tiempo) => {
  lenis.raf(tiempo);                        // 1. mueve el scroll
  motor.dibujar(lenis.scroll);              // 2. lee y 3. dibuja
});

lenis.scrollTo(400);
await espera(500);
const r = { y: window.scrollY, leido: motor.y, dibujos: motor.dibujos };
parar();                                    // el reloj, primero
lenis.destroy();
window.scrollTo(0, 0);
// prueba: r.y === 400 && r.leido === 400 && r.dibujos > 5
```

Con el adaptador, ese bucle es el `reloj`: `entrar({ reloj: (paso) => motor.alDibujar((t) => { paso(t); dibujar(); }) })`. Three.js como caso: `setAnimationLoop` entrega milisegundos, la unidad de `raf`, y se para con `null`.

```js fragmento
const motor = {
  alDibujar(fn) {
    renderer.setAnimationLoop(fn);
    return () => renderer.setAnimationLoop(null);
  },
};
const parar = motor.alDibujar((tiempo) => {
  lenis.raf(tiempo);
  malla.position.y = -(caja.y - lenis.scroll + caja.h / 2);
  renderer.render(escena, camara);
});
```

Se comparó el borde superior del plano en el búfer WebGL, leído con `readPixels`, con el `getBoundingClientRect().top` del elemento HTML, en unos 83 fotogramas de movimiento, dos pasadas, en ventana. Laboratorio:

| Cómo llega el valor a la escena | Desfase con el DOM |
|---|---|
| `raf`, leer y dibujar en un mismo bucle | **0 px** en todos los fotogramas |
| Dibujar dentro de `lenis.on("scroll")`, con `autoRaf` | 0 px, sin dibujar en reposo |
| Evento `scroll` nativo y bucle aparte | **20 a 23 px** en movimiento: un fotograma |

Las dos primeras son válidas. Dibujar en `on("scroll")` deja la escena quieta sin gastar GPU, pero entonces hay que dibujar también al redimensionar, y solo sirve si lo único que cambia es el scroll. [P]

Con GSAP en la página, el dueño es `gsap.ticker`, y el dibujo se añade a continuación de `raf`: ver [`int-gsap`](int-gsap.md).

### Qué valor leer

| Quiero | Lee | Nota |
|---|---|---|
| Posición continua | `lenis.scroll` | Con `infinite`, ya normalizada |
| Avance de 0 a 1 | `lenis.progress` | Vale 1 si `limit` es 0: una página sin scroll no da 0 |
| Destino del gesto | `lenis.targetScroll` | Para anticipar, no para colocar |
| Sin normalizar, con `infinite` | `lenis.animatedScroll` | Crece sin límite: útil para bucles continuos |

`lenis.velocity` son píxeles **por llamada a `raf`**, y no por segundo: con el mismo gesto, una pantalla de 120 Hz da la mitad que una de 60. Para un shader, divide entre el tiempo. [C] [E]

```js
function velocidadCon(paso) {
  const lenis = new Lenis();
  let t = 1000;
  lenis.raf(t);
  lenis.scrollTo(1000, { duration: 1, easing: (x) => x });
  for (let i = 0; i < 10; i++) lenis.raf((t += paso));
  const v = lenis.velocity;
  lenis.destroy();
  window.scrollTo(0, 0);
  return v;
}
const a60 = velocidadCon(16);
await espera(50);
const a120 = velocidadCon(8);
// prueba: Math.abs(a60 - 16) < 0.5 && Math.abs(a120 - 8) < 0.5
```

### Alinear una pieza con el DOM

Mide la **posición en el scroll** una vez, y al redimensionar; en cada fotograma solo resta el scroll. Leer `getBoundingClientRect()` en cada fotograma fuerza una medición por pieza. [P]

La medida no es `top + scrollY`: eso solo vale en ventana. La fórmula general resta el techo de lo que se desplaza y suma su scroll real: `rect.top - techo + lenis.actualScroll`, con `techo` 0 en ventana y el borde superior del `wrapper` en un contenedor. Con la forma de ventana, en una caja a 50 px del borde, el desfase es de 50 px. [E]

```html
<style>
  .caja { height: 300px; overflow: auto; margin-top: 50px; }
</style>
<div class="caja"><div style="height:1500px"><div class="pieza" style="height:100px;margin-top:900px"></div></div></div>
```

```js
function medir(nodo, lenis) {
  const techo = lenis.options.wrapper === window ? 0 : lenis.rootElement.getBoundingClientRect().top;
  return { y: nodo.getBoundingClientRect().top - techo + lenis.actualScroll, techo };
}

const caja = document.querySelector(".caja");
const pieza = document.querySelector(".pieza");
const lenis = new Lenis({ wrapper: caja, content: caja.firstElementChild });
lenis.scrollTo(100, { immediate: true });
const posicion = medir(pieza, lenis);
const ingenua = pieza.getBoundingClientRect().top + window.scrollY;
let t = 1000;
lenis.raf(t);
lenis.scrollTo(400, { duration: 0.1, easing: (x) => x });
lenis.raf((t += 50));
const enPantalla = posicion.y - lenis.scroll + posicion.techo;
const real = pieza.getBoundingClientRect().top;
lenis.destroy();
// prueba: Math.abs(enPantalla - real) < 1
// prueba: posicion.y === 900 && Math.abs(ingenua - posicion.y + 100 - 50) < 1
```

En ventana, la misma función:

```js
const nodo = document.createElement("div");
nodo.style.cssText = "height:100px;margin-top:900px";
document.body.prepend(nodo);
const lenis = new Lenis();
const techo = lenis.options.wrapper === window ? 0 : lenis.rootElement.getBoundingClientRect().top;
const y = nodo.getBoundingClientRect().top - techo + lenis.actualScroll;
let t = 1000;
lenis.raf(t);
lenis.scrollTo(400, { duration: 0.1, easing: (x) => x });
lenis.raf((t += 50));
const enPantalla = y - lenis.scroll + techo;
const real = nodo.getBoundingClientRect().top;
lenis.destroy();
nodo.remove();
window.scrollTo(0, 0);
// prueba: Math.abs(enPantalla - real) < 1
```

### Contrato completo sobre una escena

Con Three.js, en ventana. Esta estructura, con `setAnimationLoop` en el lugar del `reloj`, pasó 20 ciclos seguidos de entrar y salir, sin avisos, con los oyentes de `window` iguales y sin nodos sobrantes. Laboratorio. Las diferencias del bloque, sin ejecutar con Three: el nombre `entrarEscena`, y `caja.y` con la medida general.

```js fragmento
function entrarEscena(raiz) {
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  raiz.appendChild(renderer.domElement);
  const escena = new THREE.Scene();
  const camara = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
  const geometria = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({ color: "#cc0000" });
  const malla = new THREE.Mesh(geometria, material);
  escena.add(malla);

  const pieza = document.querySelector("#pieza");
  const lenis = new Lenis();
  let caja;
  const ajustar = () => {
    renderer.setSize(raiz.clientWidth, raiz.clientHeight, false);
    camara.right = raiz.clientWidth;
    camara.bottom = -raiz.clientHeight;
    camara.updateProjectionMatrix();
    const r = pieza.getBoundingClientRect();
    caja = { x: r.left, y: r.top + lenis.actualScroll, w: r.width, h: r.height }; // en ventana; en contenedor, resta el techo
    malla.scale.set(caja.w, caja.h, 1);
    malla.position.x = caja.x + caja.w / 2;
  };
  ajustar();
  const vigia = new ResizeObserver(ajustar);
  vigia.observe(raiz);

  renderer.setAnimationLoop((t) => {
    lenis.raf(t);
    malla.position.y = -(caja.y - lenis.scroll + caja.h / 2);
    renderer.render(escena, camara);
  });

  return function salir() {
    renderer.setAnimationLoop(null);     // 1. el reloj, primero
    vigia.disconnect();
    lenis.destroy();                     // 2. Lenis
    geometria.dispose();                 // 3. la GPU
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
```

El lienzo va en una capa fija con `pointer-events: none`: la rueda debe llegar a `eventsTarget`, que por defecto es el `wrapper`. En ventana, una capa que reciba eventos sigue funcionando por burbujeo, pero bloquea los clics del contenido. Con un contenedor, una capa que no sea descendiente suyo se queda la rueda: no burbujea hasta él. [C]

## Trampas

- **Parar el bucle después de destruir.** El motor sigue llamando a `raf`, y la animación en curso sigue moviendo la página: ver [`int-contrato`](int-contrato.md#trampas). Para el reloj primero. [C]
- **`prefers-reduced-motion`.** Lenis acorta su animación, pero tu escena no se entera: los efectos propios, como deformar con `velocity`, siguen. Atiende `lenis.prefersReducedMotion`: ver [`cal-accesibilidad`](../07-calidad/cal-accesibilidad.md). [C]
- **Una animación propia sobre un valor de Lenis.** `lenis.scroll` ya viene suavizado: añadir otro `lerp` a la cámara duplica el retardo y la pieza deja de coincidir con el DOM. Da a cada valor un solo dueño. [P]
- **`setSize` borra el lienzo.** Con un dibujo solo en `on("scroll")`, tras redimensionar la pantalla queda vacía hasta el siguiente gesto: dibuja al ajustar. [P]
- **Parar con `lenis.stop()`.** `stop()` bloquea el gesto, no tu bucle: `lenis.raf` sigue y la escena se sigue dibujando. Parar el dibujo es cosa tuya. [C]
- **Sin WebGPU probado.** Ni `WebGPURenderer`, ni PixiJS, ni un `OffscreenCanvas` en un `Worker`. En un `Worker` no hay `window`: Lenis corre en el hilo principal y envías los valores con `postMessage`, lo que añade al menos un fotograma de retardo. Sin ejecutar. [P]
