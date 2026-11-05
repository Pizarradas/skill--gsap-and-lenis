---
id: rec-salida
titulo: Animar una salida antes de retirar lo que sale
capa: 14-recetas
tipo: patron
ambito: transversal
resumen: Retrasar la retirada hasta que la animación termine, con promesa que siempre resuelve, salida interrumpida, reapertura, orden frente a revert y movimiento reducido.
api: [gsap.TweenVars.onInterrupt, gsap.Context.add, gsap.Context.revert, Animation.then, gsap.TweenVars.overwrite, gsap.matchMedia]
requiere: [nuc-context]
relacionadas: [fra-agnostico, nuc-promesas, nuc-callbacks, nuc-limpieza, nuc-overwrite, rec-transicion-paginas, int-flip, cal-accesibilidad]
etiquetas: [salida, retirada, ciclo-de-vida, promesas, interaccion]
fuentes:
  - docs/v3/GSAP/Tween/revert().md
  - docs/v3/GSAP/Tween/then().md
  - docs/v3/GSAP/gsap.context().md
estado: verificado
version: 3.15.1
---
# Animar una salida antes de retirar lo que sale

GSAP no impide que algo desaparezca: si el nodo se retira hoy, la animación no llega a verse. Una salida exige invertir el orden: primero se anima, y la retirada espera a que acabe. Es el tercer momento del [contrato](../12-frameworks/fra-agnostico.md), válido para un nodo, un objeto o una escena. [P]

## Problema

Quitar un elemento es instantáneo. Para animarlo hay que mantenerlo mientras dura el movimiento, y eso abre tres preguntas: quién decide el momento de quitarlo, qué pasa si la salida se corta y qué pasa si el usuario cambia de idea a medias.

## Solución

### 1. La retirada espera a la animación

```html
<div class="aviso">guardado</div>
```

```js
const aviso = document.querySelector(".aviso");

await new Promise((listo) => {
  gsap.to(aviso, { autoAlpha: 0, y: -10, duration: 0.1, onComplete: listo });
});
const duranteLaEspera = aviso.isConnected;
aviso.remove();
// prueba: duranteLaEspera === true && aviso.isConnected === false
```

Hay dos formas de aplicarlo, según quién retire el nodo: [P]

| Quién retira | Cómo se retrasa |
|---|---|
| Tu código | Anima y quita en `onComplete`, como arriba |
| Un sistema que parte de un cambio de estado | Dos caminos: aplaza el cambio de estado hasta `onComplete`, o usa el gancho de salida de esa tecnología, que retiene el nodo hasta que le avises. La columna "salida" de cada `fra-*` indica cuál |

### 2. Una salida que siempre termina

`onComplete` y la promesa de `then()` solo se cumplen si el tween **llega al final**. Un `revert()` a mitad de salida no los dispara: lo que esperaba el final queda colgado y el nodo no se quita. Eso ocurre cuando la vista se retira mientras un elemento suyo está saliendo. Se resuelve con `onInterrupt`, que sí se dispara al revertir, y con una función que solo actúe una vez. [E]

```js
function animarSalida(ctx, objetivo, vars, retirar) {
  return new Promise((listo) => {
    let hecho = false;
    const cerrar = () => {
      if (hecho) return;
      hecho = true;
      retirar();
      listo();
    };
    ctx.add(() => gsap.to(objetivo, { ...vars, overwrite: "auto", onComplete: cerrar, onInterrupt: cerrar }));
  });
}

// Sin onInterrupt: el revert deja colgada la espera
const sinCubrir = document.querySelector(".uno");
const contextoA = gsap.context(() => {});
let resuelta = false;
contextoA.add(() => gsap.to(sinCubrir, { opacity: 0, duration: 0.3 })).then(() => { resuelta = true; });
contextoA.revert();

// Con onInterrupt: el mismo corte retira el nodo y resuelve
const cubierto = document.querySelector(".dos");
const contextoB = gsap.context(() => {});
let quitado = false;
const salida = animarSalida(contextoB, cubierto, { opacity: 0, duration: 0.3 }, () => {
  cubierto.remove();
  quitado = true;
});
contextoB.revert();
await salida;

await new Promise((r) => setTimeout(r, 400));
// prueba: resuelta === false && sinCubrir.isConnected === true
// prueba: quitado === true && cubierto.isConnected === false
```

Registrar el tween con `ctx.add()` garantiza que una retirada de la vista lo alcance. Crearlo fuera del contexto también es válido, y entonces la salida sobrevive al revert: elige según quieras cortarla o dejarla acabar. [P]

### 3. Terminar la salida, y después revertir

`revert()` devuelve lo animado a su estado original. Si el elemento sigue en el DOM cuando revierte, **reaparece** un instante antes de irse. Quita primero, revierte después. [E]

```js
const panel = document.querySelector(".panel");
const ctx = gsap.context(() => gsap.to(panel, { autoAlpha: 0, duration: 0.05 }));
await new Promise((r) => setTimeout(r, 150));
const oculto = getComputedStyle(panel).visibility;

ctx.revert();
const trasRevertir = getComputedStyle(panel).visibility;
// prueba: oculto === "hidden" && trasRevertir === "visible"
```

Algunas tecnologías ejecutan su gancho de retirada **antes** de empezar la salida: si revierte ahí, los valores que GSAP mantenía se deshacen justo cuando la salida arranca. La ficha de cada tecnología indica el orden real. [P]

### 4. Cambiar de idea a mitad

Reabrir durante la salida debe partir del valor actual, sin saltos, y cancelar la retirada. Como el tween nuevo sobrescribe al anterior, su `onInterrupt` se dispara: si ese corte debe significar "no retires", distingue la causa con un estado propio. [E]

```js
const ficha = document.querySelector(".ficha");
let abierta = true;

function cerrar() {
  abierta = false;
  gsap.to(ficha, {
    opacity: 0,
    duration: 0.3,
    ease: "none",
    overwrite: "auto",
    onInterrupt() { if (!abierta) ficha.remove(); },
    onComplete() { ficha.remove(); },
  });
}

function abrir() {
  abierta = true;
  gsap.to(ficha, { opacity: 1, duration: 0.05, overwrite: "auto" });
}

cerrar();
await new Promise((r) => setTimeout(r, 120));
const parcial = Number(getComputedStyle(ficha).opacity);
abrir();
await new Promise((r) => setTimeout(r, 200));
// prueba: parcial > 0 && parcial < 1
// prueba: ficha.isConnected === true && getComputedStyle(ficha).opacity === "1"
```

### 5. Movimiento reducido

Con `prefers-reduced-motion` la retirada debe seguir ocurriendo: nunca condiciones la lógica a que exista la animación. Lo más simple es mantener el flujo y acortar la duración a cero. [P]

```js
const nota = document.querySelector(".nota");
const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
const duracion = reducido ? 0 : 0.05;

await new Promise((listo) => {
  gsap.to(nota, { opacity: 0, duration: duracion, onComplete: listo });
});
nota.remove();

let conCero = false;
gsap.to(document.querySelector(".otra"), { opacity: 0, duration: 0, onComplete() { conCero = true; } });
// prueba: nota.isConnected === false && conCero === true
```

`duration: 0` también dispara `onComplete`, así que la misma ruta sirve para los dos casos. [E]

## Trampas

- **`await tween` tras un `revert`.** No se resuelve nunca: es la trampa del apartado 2. Usa `onInterrupt`. Ver [promesas](../02-nucleo/nuc-promesas.md). [E]
- **Dos cierres seguidos.** Un doble clic lanza dos salidas y `retirar` corre dos veces. Protégela con una marca, como `cerrar` en el apartado 2. [P]
- **Salida sin `overwrite`.** Si la entrada sigue en curso, los dos tweens se pelean por el mismo valor y puede ganar la entrada, dejando un nodo retirado que nunca llegó a verse oculto, o uno visible al final. Pon `overwrite: "auto"`. Ver [overwrite](../02-nucleo/nuc-overwrite.md). [P]
- **El nodo que sale sigue activo.** Sigue en el DOM, recibe clics y conserva el foco. Durante la salida, añade `inert` o `pointer-events: none`, y mueve el foco antes de animar. Ver [accesibilidad](../13-calidad/cal-accesibilidad.md). [P]
- **Salida lenta que bloquea.** Si algo espera a la salida, como una navegación, una duración larga parece un fallo. Conviene mantenerla por debajo de 300 ms. [P]
- **Los vecinos saltan al quitar el nodo.** La salida anima lo que se va, no lo que se queda. Para que el resto se recoloque, captura el estado antes de retirar y usa [Flip](../10-interaccion/int-flip.md). [P]
- **Salir no es desmontar.** Salir es una animación de GSAP; desmontar libera recursos. Una escena de canvas hace los dos pasos: primero funde, y al acabar libera. Ver [fra-canvas-webgl](../12-frameworks/fra-canvas-webgl.md). [P]
