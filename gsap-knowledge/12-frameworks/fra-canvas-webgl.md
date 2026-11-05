---
id: fra-canvas-webgl
titulo: GSAP en canvas, WebGL y Three.js
capa: 12-frameworks
tipo: patron
ambito: transversal
resumen: Aplicar entrar, cambiar y salir a una escena sin DOM: un render por tick, bucle propio, color, uniforms, resize, pausa, Observer y Draggable, y liberar recursos.
api: [gsap.ticker.add, gsap.ticker.remove, gsap.updateRoot, gsap.utils.splitColor, gsap.quickTo, gsap.context, gsap.Context.add, gsap.Context.revert, Draggable.create, Observer.create]
requiere: [fra-agnostico]
relacionadas: [nuc-ticker, nuc-global, nuc-quickto, fun-objetivos, esp-pixi, rec-salida, scr-observer, int-draggable, cal-rendimiento]
etiquetas: [canvas, webgl, three, escena, render, ticker, dispose]
fuentes:
  - docs/v3/GSAP/gsap.ticker.md
  - resources/frameworks.md
  - https://threejs.org/docs/
  - https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
  - https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
estado: verificado
version: 3.15.1
---
# GSAP en canvas, WebGL y Three.js

GSAP interpola números en **cualquier objeto JavaScript** y no sabe qué significan: el dibujo es cosa tuya. Una escena cumple el mismo [contrato](fra-agnostico.md) que un nodo (entrar, cambiar, salir), con dos deberes más: decidir cuándo se dibuja y liberar la memoria de la GPU. [O]

**Laboratorio del 2026-11-05.** Lo que dice "laboratorio" se ejecutó fuera del arnés, y no es `[E]`: Three.js 0.187.0 real con gsap 3.15.1 en Chrome 156 headless, tiempo real y WebGL 2 sobre GPU real (ANGLE, Direct3D 11, Intel UHD). Three.js no está cargado en el arnés, así que sus bloques son `fragmento`. Sus API se leyeron del paquete `three`, porque la página de documentación no devolvió contenido legible al consultarla. PixiJS no se probó: ver [esp-pixi](../11-especializados/esp-pixi.md). Fuentes en `_notas/contrato-lab/3d/`.

## Problema

En el DOM, escribir un valor ya produce su efecto en pantalla. En una escena no: el valor cambia en memoria y nada se ve hasta dibujar. Además, nadie libera por ti buffers y contextos al retirar la vista.

## Solución

### Qué se anima en cada caso

| Quiero | Objetivo y valores | Resultado en laboratorio |
|---|---|---|
| Mover, escalar | `mesh.position`, `mesh.scale`, con `x`, `y`, `z` | Correcto |
| Girar | `mesh.rotation`, con `x`, `y`, `z` | Correcto: el cuaternión se sincroniza solo |
| Opacidad | `material`, con `opacity` | Exige `transparent: true`: sin él, el píxel siguió rojo con `opacity: 0` |
| Color | `material.color`, con `r`, `g`, `b` lineales | Ver "Color" |
| Dato de un shader | `material.uniforms.uAvance`, con `value` | Correcto: el píxel pasó de negro a rojo |
| Cámara | `camera.position`, también con `scrollTrigger` | Correcto: con `scrub`, a mitad de recorrido `z` pasó de 5 a 7,5 |
| Muchos objetos | `meshes.map((m) => m.position)`, con `stagger` | Correcto |
| Instancias | Un proxy por instancia y copia en `onUpdate` | Correcto: ver abajo |

El objetivo es siempre el objeto que tiene la propiedad. `gsap.to(mesh, { x: 1 })` avisa `Invalid property x` y crea `mesh.x`, sin mover nada. Lo mismo ocurre con `autoAlpha` o `scale`: son alias del DOM. Laboratorio.

### Un render por tick

Si cada tween dibuja en su `onUpdate`, se dibuja una vez por tween. Registra un solo render en `gsap.ticker`: corre tras actualizar los tweens. [P]

```html
<canvas id="lienzo" width="100" height="20"></canvas>
```

```js
const pincel = document.querySelector("#lienzo").getContext("2d");
const bola = { x: 0, alto: 5 };
let pasadas = 0;

const dibujar = () => {
  pasadas++;
  pincel.clearRect(0, 0, 100, 20);
  pincel.fillRect(bola.x, 0, 10, bola.alto);
};

const ctx = gsap.context(() => {
  gsap.ticker.add(dibujar);
  gsap.to(bola, { x: 90, duration: 0.1, ease: "none" });
  gsap.to(bola, { alto: 20, duration: 0.1, ease: "none" });
  return () => gsap.ticker.remove(dibujar);
});

await new Promise((r) => setTimeout(r, 300));
const pintado = pincel.getImageData(95, 10, 1, 1).data[3];
const hechas = pasadas;
ctx.revert();
await new Promise((r) => setTimeout(r, 60));
// prueba: bola.x === 0 && pintado === 255
// prueba: hechas > 1 && pasadas === hechas
```

`gsap.ticker.add` no se graba en el contexto: retíralo en la limpieza. `revert()` restaura también los objetos normales, y objetos reales de Three.js en laboratorio. Lo revertido no se ve hasta el siguiente dibujo. [E]

### Elegir el bucle

| Bucle | Cuándo | Coste |
|---|---|---|
| Permanente: `gsap.ticker.add(render)` | La escena cambia en cada fotograma | El ticker nunca duerme. En laboratorio, con `autoSleep: 10`, 19 ticks en 300 ms con listener, y 0 sin él |
| A demanda: un render pedido desde `onUpdate` | La escena está quieta casi siempre | Debes pedir dibujo también al redimensionar |
| Del motor: el bucle es suyo | El motor lo impone, como una sesión de realidad virtual | Hay que alimentar a GSAP a mano |

**A demanda.** `add(fn, true)` crea un listener de un solo uso, así que el ticker sigue pudiendo [dormir](../02-nucleo/nuc-ticker.md):

```js
const punto = { x: 0, y: 0 };
let dibujos = 0;
let pendiente = null;

const dibujar = () => { pendiente = null; dibujos++; };
const pedir = () => { pendiente ??= gsap.ticker.add(dibujar, true); };

let llamadas = 0;
const contar = () => { llamadas++; pedir(); };
gsap.to(punto, { x: 1, duration: 0.1, onUpdate: contar });
gsap.to(punto, { y: 1, duration: 0.1, onUpdate: contar });

await new Promise((r) => setTimeout(r, 300));
gsap.ticker.remove(pendiente);
// prueba: dibujos > 1 && dibujos < llamadas
```

Para cancelar lo pendiente, `remove` necesita **lo que devolvió `add()`**, no `dibujar`. En laboratorio, un `remove(dibujar)` no canceló nada: se dibujó tras liberar la escena y la geometría volvió a subirse a la GPU (`info.memory.geometries` pasó de 0 a 1). Con esta escena y `autoSleep: 10`, tras 1,5 s sin animar el ticker quedó parado: 0 ticks en 500 ms.

**Bucle del motor.** Se quita `gsap.updateRoot` del ticker y se llama a mano, con un reloj **acumulado desde el tiempo de la raíz**:

```js fragmento
gsap.ticker.remove(gsap.updateRoot);
let reloj = gsap.globalTimeline.time();
let anterior = performance.now();

renderer.setAnimationLoop(() => {
  const ahora = performance.now();
  reloj += (ahora - anterior) / 1000;
  anterior = ahora;
  gsap.updateRoot(reloj);
  renderer.render(escena, camara);
});

// Al terminar
renderer.setAnimationLoop(null);
gsap.updateRoot(gsap.ticker.time);
gsap.ticker.add(gsap.updateRoot);
```

Laboratorio: un tween de 0,3 s iba por 1,05 de 2 a los 150 ms y acabó en 2. Pasar directamente la marca de tiempo del bucle (`gsap.updateRoot(t / 1000)`) **falla**: ese reloj iba por 4,6 s y la raíz por 2 s, y el tween terminó en el primer fotograma. Ver [gsap.updateRoot](../02-nucleo/nuc-global.md).

### El contrato completo sobre una escena

Entrar, cambiar y salir son animaciones. Desmontar libera. Esta estructura se probó en laboratorio, con 20 ciclos seguidos sin avisos.

```js fragmento
function montarEscena(contenedor) {
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  contenedor.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camara.position.z = 5;
  const geometria = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: "#cc3344", transparent: true, opacity: 0 });
  const malla = new THREE.Mesh(geometria, material);
  escena.add(malla);

  let pendiente = null;
  const dibujar = () => { pendiente = null; renderer.render(escena, camara); };
  const pedir = () => { pendiente ??= gsap.ticker.add(dibujar, true); };

  const ajustar = () => {
    const { clientWidth: ancho, clientHeight: alto } = contenedor;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
    dibujar();                         // setSize borra el lienzo
  };
  const vigia = new ResizeObserver(ajustar);

  const ctx = gsap.context(() => {     // entrar
    vigia.observe(contenedor);
    ajustar();
    gsap.to(material, { opacity: 1, duration: 0.4, onUpdate: pedir });
    return () => {
      vigia.disconnect();
      gsap.ticker.remove(pendiente);
      pendiente = null;
    };
  });

  return {
    cambiar(x) {
      ctx.add(() => gsap.to(malla.position, { x, duration: 0.3, overwrite: "auto", onUpdate: pedir }));
    },
    salir() {
      return new Promise((listo) => {
        ctx.add(() => gsap.to(material, {
          opacity: 0, duration: 0.3, overwrite: "auto",
          onUpdate: pedir, onComplete: listo, onInterrupt: listo,
        }));
      });
    },
    desmontar() {
      ctx.revert();
      geometria.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
```

Resultado en laboratorio: cambiar a 2 y, a mitad, a -1 siguió sin saltos desde el valor actual (1,29) y acabó en -1. Tras `desmontar`: 0 geometrías y ningún nodo en el contenedor.

### Liberar recursos

| Paso | Por qué, según laboratorio |
|---|---|
| 1. `ctx.revert()` | Para tweens y limpieza antes de tocar la GPU. `revert` lanza un último `onUpdate`, de ahí que la limpieza cancele lo pendiente |
| 2. `dispose()` de geometrías, materiales y texturas | `info.memory.geometries` y `info.programs` bajaron a 0 |
| 3. `renderer.dispose()` | Después, no antes: en orden inverso, `info.programs.length` se quedó en 1 |
| 4. `renderer.forceContextLoss()` | Sin este paso, 20 montajes con solo `renderer.dispose()` agotaron los contextos: Chrome avisó `Too many active WebGL contexts` y perdió el más antiguo |

### Densidad y tamaño

Limita la densidad a 2: el coste crece con el cuadrado. En laboratorio, un lienzo de 300 CSS dio 300, 600 y 600 píxeles con densidad 1, 2 y 3. Mide el contenedor con `ResizeObserver`, no con `resize` de `window`, y pasa `false` como tercer argumento de `setSize` para que tu CSS mande. `setSize` **borra el dibujo**: el píxel central pasó a `[0, 0, 0, 0]` hasta el siguiente render, y un bucle a demanda dejaría el lienzo en blanco. [P]

### Pausa fuera de pantalla

No dibujes lo que nadie ve. Para el render y también lo que corra en bucle:

```js fragmento
const vigia = new IntersectionObserver(([entrada]) => {
  if (entrada.isIntersecting) { gsap.ticker.add(dibujar); giro.play(); }
  else { gsap.ticker.remove(dibujar); giro.pause(); }
});
vigia.observe(renderer.domElement);
```

Laboratorio: 0 dibujos en 300 ms fuera de pantalla, y al volver reanudó con el tween despausado. Desconecta el observador en la limpieza. El navegador ya frena `requestAnimationFrame` en pestañas ocultas. [O]

### Color

El color de un material vive en **espacio lineal**, y `gsap.utils.splitColor` devuelve valores sRGB de 0 a 255. Dividir entre 255 no sirve. Deja que Three.js convierta:

```js fragmento
const destino = new THREE.Color("#336699");
gsap.to(material.color, { r: destino.r, g: destino.g, b: destino.b, duration: 0.3 });
```

| Laboratorio, para `#336699` | Píxel final |
|---|---|
| `new THREE.Color()`, `r`, `g`, `b` | `[51, 102, 153]`: correcto |
| `splitColor` entre 255 | `[124, 170, 203]`: demasiado claro |

Fuera de un espacio lineal, como en canvas 2D, `splitColor` sí es lo adecuado:

```js
const [rojo, verde, azul] = gsap.utils.splitColor("#336699");
const tinte = { r: rojo, g: verde, b: azul };
gsap.to(tinte, { r: 255, duration: 0.05 });
await new Promise((r) => setTimeout(r, 150));
const css = `rgb(${tinte.r}, ${tinte.g}, ${tinte.b})`;
// prueba: css === "rgb(255, 102, 153)"
```

### Gobernar una escena con gestos

`Draggable`, `Observer` y `ScrollTrigger` exigen DOM, pero solo para **medir el gesto**. El resultado puede ir a la escena. `ScrollTrigger` controla el cabezal, así que el objetivo puede ser cualquier objeto: [E]

```js
const camara = { z: 0 };
gsap.to(camara, { z: 100, ease: "none", scrollTrigger: { start: 0, end: 500, scrub: true } });

window.scrollTo(0, 250);
ScrollTrigger.update();
await new Promise((r) => setTimeout(r, 100));
// prueba: camara.z === 50
```

`Draggable` necesita un elemento, pero no tiene por qué estar en el documento: un **proxy** suelto acumula el arrastre y `trigger` indica dónde escuchar.

```js fragmento
const proxy = document.createElement("div");
const [arrastre] = Draggable.create(proxy, {
  trigger: renderer.domElement,
  type: "x",
  onDrag() { malla.rotation.y = this.x * 0.01; },
});

const girar = gsap.quickTo(malla.rotation, "y", { duration: 0.3 });
let giro = 0;
const gestos = Observer.create({
  target: renderer.domElement,
  type: "wheel",
  onChangeY(self) { giro += self.deltaY * 0.001; girar(giro); },
});

// En la limpieza
arrastre.kill();
gestos.kill();
```

Laboratorio, con eventos sintéticos: 100 px de arrastre dieron `rotation.y = 1`, y un `wheel` de 500 dio 0,5 mediante `quickTo`. Con `dibujar` a demanda, añade `pedir()` en ambos. No se probaron gestos táctiles reales.

### Instancias

GSAP no conoce las matrices de un `InstancedMesh`. Anima un proxy por instancia y copia. Laboratorio: la última instancia llegó a `y = 1`.

```js fragmento
const proxies = lista.map((_, i) => ({ x: i, y: 0 }));
const matriz = new THREE.Matrix4();

function copiar() {
  proxies.forEach((p, i) => instancias.setMatrixAt(i, matriz.makeTranslation(p.x, p.y, 0)));
  instancias.instanceMatrix.needsUpdate = true;
}

gsap.to(proxies, { y: 1, stagger: 0.02, onUpdate: copiar });
```

## Trampas

- **`gsap.to(material, { color: "#0f0" })` rompe el color sin avisar.** Sustituye el objeto `Color` por una cadena: en laboratorio `material.color` quedó como `string`, sin aviso ni excepción. Anima `material.color` con `r`, `g`, `b`.
- **Interpolar un cuaternión componente a componente.** Deja de ser unitario: su longitud cayó a 0,707. Usa un proxy `{ t: 0 }` y `quaternion.slerpQuaternions(a, b, t)` en `onUpdate`, que la mantuvo en 1.
- **Estado reactivo o serializable.** GSAP escribe `_gsap` en cada objetivo: `JSON.stringify(mesh.position)` lanza `Converting circular structure`. `mesh.toJSON()`, `material.toJSON()` y `clone()` funcionaron. Laboratorio.
- **Clonar un `ShaderMaterial` tras animarlo.** La copia comparte el `_gsap` del uniform original. No se comprobó si eso causa fallos: clona antes de animar. Laboratorio. [P]
- **Dos dueños del valor.** Si un motor de físicas u otro bucle escribe `mesh.position`, compite con GSAP como dos tweens sin `overwrite`, pero nadie lo arbitra. Da a cada valor un solo dueño. [P]
- **Etiquetas HTML sobre la escena.** `malla.getWorldPosition(v).project(camara)` da de -1 a 1, y `(v.x + 1) / 2 * ancho` da píxeles para [quickSetter](../02-nucleo/nuc-quicksetter.md). Sin esa conversión, la etiqueta no sigue a la malla. Laboratorio.
