---
id: nuc-global
titulo: Control global - globalTimeline, exportRoot y updateRoot
capa: 02-nucleo
tipo: api
ambito: core
resumen: Pausar o ralentizar todo, separar lo que ya existe de lo nuevo con exportRoot, manejar el reloj a mano y otros miembros de gsap.
api: [gsap.globalTimeline, gsap.exportRoot, gsap.updateRoot, gsap.install, gsap.version, gsap.parseEase, gsap.registerEase]
relacionadas: [fun-modelo, nuc-ticker, nuc-delayedcall, nuc-consulta, eas-registro, fun-instalacion]
etiquetas: [global, timeline, juegos]
fuentes:
  - docs/v3/GSAP/gsap.globalTimeline.md
  - docs/v3/GSAP/gsap.exportRoot().md
  - docs/v3/GSAP/gsap.updateRoot().md
  - docs/v3/GSAP/gsap.version.md
  - docs/v3/GSAP/gsap.parseEase().md
  - docs/v3/GSAP/gsap.registerEase().md
estado: verificado
version: 3.15.1
---
# Control global

`gsap.globalTimeline` es el timeline raíz del que cuelga todo. Actuar sobre él afecta a cualquier animación, incluidas las `delayedCall`. Para afectar solo a lo ya existente, sin tocar lo que crees después, usa `gsap.exportRoot()`. [O]

## Firma

```text
gsap.globalTimeline                                 Timeline raíz
gsap.exportRoot(vars?, incluirDelayedCalls = false) → Timeline
gsap.updateRoot(tiempo)
gsap.version                                        "3.15.1"
gsap.install(objeto)                                → gsap
gsap.parseEase(ease, defecto?) → función            sin argumentos: mapa de eases
gsap.registerEase(nombre, funcion)
```

| Método | Efecto |
|---|---|
| `globalTimeline.pause()`, `.play()`, `.paused()` | Pausa o reanuda todo, incluso lo que se cree durante la pausa [O] [E] |
| `globalTimeline.timeScale(n)` | Velocidad global. No altera el `timeScale()` de cada animación [O] [E] |
| `exportRoot()` | Mueve a un timeline nuevo lo que hay en la raíz, para controlarlo como conjunto. Sin `delayedCall` salvo `true` [O] [C] [E] |
| `updateRoot(t)` | Fija el tiempo raíz a mano, tras quitar `gsap.updateRoot` del ticker [O] [E] |
| `parseEase()` | Convierte un nombre en su función; más en `eas-registro` [O] [E] |
| `registerEase()` | Da nombre a una función de ease propia [O] [E] |

## Ejemplo

Pausar el "juego" y seguir animando un menú:

```js
const enemigo = { x: 0 };
const menu = { y: 0 };
const eventos = [];

gsap.to(enemigo, { x: 100, duration: 0.2, ease: "none" });
gsap.delayedCall(0.05, () => eventos.push("retraso"));

const juego = gsap.exportRoot();
juego.pause();

gsap.to(menu, { y: 1, duration: 0.05 });     // creado después: no le afecta

await new Promise((r) => setTimeout(r, 120));
const parado = enemigo.x;
juego.resume();

// prueba: parado === 0
// prueba: menu.y === 1
// prueba: eventos.join() === "retraso"
// prueba: enemigo.x === 100
```

Pausa global:

```js
const b = { x: 0 };
gsap.globalTimeline.pause();
const creada = gsap.to(b, { x: 1, duration: 0.05 });
await new Promise((r) => setTimeout(r, 80));
const enPausa = b.x;
gsap.globalTimeline.play();

// prueba: enPausa === 0
// prueba: b.x === 1
// prueba: gsap.globalTimeline.paused() === false
```

Reloj manual, útil en juegos con bucle propio o al grabar vídeo fotograma a fotograma:

```js
const o = { x: 0 };
gsap.ticker.remove(gsap.updateRoot);

const reloj = gsap.to(o, { x: 100, duration: 10, ease: "none" });
const inicio = reloj.startTime();
await new Promise((r) => setTimeout(r, 60));
const sinReloj = o.x;

gsap.updateRoot(inicio + 5);
const aMitad = o.x;
gsap.ticker.add(gsap.updateRoot);

// prueba: sinReloj === 0
// prueba: aMitad === 50
```

Miembros auxiliares:

```js
gsap.registerEase("cuadrado", (p) => p * p);

const curva = gsap.parseEase("cuadrado");
const predefinida = gsap.parseEase("power2.out");
const mapa = gsap.parseEase();
const globales = {};
const devuelto = gsap.install(globales);

// prueba: curva(0.5) === 0.25
// prueba: predefinida(0.5) === 0.875
// prueba: typeof mapa === "object"
// prueba: devuelto === gsap
// prueba: "Power1" in globales
```

## Trampas

- **`globalTimeline.isActive()` es siempre `true`.** No sirve para saber si hay algo animando. Usa `getChildren().filter((a) => a.isActive())`. [O] [E]
- **Pausa global y ScrollTrigger.** Pausar la raíz detiene también los `scrub`, que son animaciones. Cuidado al usarla para un modal. [P]
- **`exportRoot()` no incluye lo ya terminado.** Las animaciones acabadas salen de la raíz y no vuelven. [O]
- **`exportRoot()` con `delayedCall`.** Por defecto no las mueve, y siguen su curso mientras el resto está parado. Pasa `true` si deben pararse. [O] [C] [E]
- **`exportRoot()` repetido.** Cada llamada envuelve el timeline anterior en otro; se puede, pero complica razonar sobre tiempos. [O]
- **`updateRoot()` sin desconectar.** Si no quitas el listener del ticker, el reloj real lo corrige en el siguiente frame. Vuelve a añadirlo con `gsap.ticker.add(gsap.updateRoot)`. [O] [C]
- **`gsap.parseEase("inexistente", "power1.out")`** devuelve la cadena por defecto sin convertir, no una función. Comprueba el tipo. [E]
- **`timeScale` global** escala también `delayedCall`, y con ello temporizadores de lógica. [O] [E]
- **GSDevTools modifica la raíz.** Al cargarlo, desactiva `autoRemoveChildren` en la raíz para grabar: lo terminado se conserva, y en producción eso es una fuga. No lo despliegues. [C]
