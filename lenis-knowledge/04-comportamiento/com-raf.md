---
id: com-raf
titulo: El reloj de Lenis, autoRaf o bucle propio
capa: 04-comportamiento
tipo: concepto
ambito: core
resumen: Lenis no se mueve solo: necesita autoRaf o llamadas a raf(time) en milisegundos. Independencia de fotogramas, pausas, y qué pasa de verdad al mezclar relojes.
api: [Lenis.raf, LenisOptions.autoRaf, Lenis.time, Lenis.destroy, Lenis.isScrolling]
requiere: [fun-modelo]
relacionadas: [opc-suavizado, int-gsap, api-metodos, int-canvas-webgl]
etiquetas: [raf, reloj, bucle, sincronizacion]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# El reloj de Lenis

`Animate` no tiene temporizador. La animación avanza solo cuando alguien llama a `lenis.raf(time)`, y ese diseño es lo que permite sincronizar Lenis con cualquier otro bucle. [C]

## Modelo mental

Cada llamada calcula `dt = time - lenis.time`, guarda `time` y avanza `dt / 1000` segundos. La primera llamada tiene `dt = 0`. [C]

| Forma | Código | Cuándo |
|---|---|---|
| Automática | `new Lenis({ autoRaf: true })` | Página sin otro bucle |
| Bucle propio | `requestAnimationFrame` que llama a `lenis.raf(t)` | Control de arranque y parada |
| Reloj externo | Ticker de otra biblioteca o bucle de render | Sincronizar con una escena. Ver [`int-gsap`](../06-integracion/int-gsap.md) y [`int-canvas-webgl`](../06-integracion/int-canvas-webgl.md) |

Elige **una sola**. Las tres pueden coexistir por error, y es un fallo grave, no un desperdicio.

Sin reloj, el gesto se procesa a medias: `targetScroll` cambia, el evento se cancela, `isScrolling` pasa a `'smooth'`, la clase se pone, y la página no se mueve. [C] [E]

Una pausa larga, como una pestaña oculta sin `requestAnimationFrame`, llega como un `dt` enorme: con `lerp` la animación llega de golpe al destino, y con `duration` se da por completada. [C] [E]

## Ejemplo

Bucle propio con parada limpia:

```js
function iniciarBucle(lenis) {
  let id = requestAnimationFrame(function paso(tiempo) {
    lenis.raf(tiempo);
    id = requestAnimationFrame(paso);
  });
  return () => cancelAnimationFrame(id);
}

const lenis = new Lenis();
const parar = iniciarBucle(lenis);
lenis.scrollTo(300, { duration: 0.1 });
await espera(500);
const llegada = window.scrollY;
parar();
lenis.destroy();
// prueba: llegada === 300
```

Sin reloj no hay movimiento, aunque todo lo demás parezca correcto:

```js
const lenis = new Lenis();
rueda(300);
await espera(100);
const r = { y: window.scrollY, destino: lenis.targetScroll, estado: lenis.isScrolling, clase: lenis.className };
lenis.destroy();
// prueba: r.y === 0 && r.destino === 300 && r.estado === "smooth" && r.clase.includes("lenis-smooth")
```

### Dos relojes a la vez

Cada `raf` calcula `dt` contra la llamada anterior, venga de donde venga. Con dos relojes, `dt` alterna de signo. Lo que pasa después depende de tres cosas. Medido en Chrome 156 real, con `lenis.css`, `scrollTo(1500)` y `autoRaf` más un bucle propio; el caso de `Date.now()`, en ventana y en contenedor con `overflow` en hoja (laboratorio, 2026-11-05):

| Segundo reloj | Corre primero | Con `lerp` 0.1 | Con `duration` |
|---|---|---|---|
| Mismo origen: `performance.now()` | Cualquiera | Llega | Llega |
| Origen cercano: el tiempo de un ticker de otra biblioteca, en ms | Cualquiera | Llega | Llega; en una pasada arrancó unos 300 ms tarde |
| Origen lejano: `Date.now()` | `autoRaf` | **`NaN`, página clavada en 0** | Llega |
| Origen lejano: `Date.now()` | El externo | **Salto**: en 1500 sin animación | **Salto** |

- **`lerp`:** un `dt` negativo hace crecer una exponencial. −16 ms ya descoloca el valor, −1000 ms da −497 929, −110 000 ms da −5,9e289 y −118 000 ms da `NaN`. El umbral baja al subir `lerp`: con 0.5 es `NaN` a −30 s, y con 0.02 aún no a −119 s, pero sí a −600 s.
- **`duration`:** el tiempo solo se resta y el progreso se recorta a 0: no hay `NaN` con ningún `dt`.
- **Quién corre primero:** el bucle que sigue a `scrollTo` da el primer `dt`. Si es el reloj adelantado, un `dt` enorme y positivo completa la animación de golpe.

Un ticker que arranca minutos después de abrir la página es un origen lejano, aunque use milisegundos.

**El síntoma no es una congelación.** Con `animatedScroll` en `NaN`, Lenis sigue escribiendo, `scrollTo({ top: NaN })` lleva a 0, y la página queda clavada arriba con `isScrolling` en `"smooth"`. Con otro gesto sigue igual. **Sí se recupera:** quita un reloj y llama a `stop()` y `start()`, o a `scrollTo(x, { immediate: true })`. `resize()` no basta, porque `Animate` conserva su valor. [C] [E]

```js
window.scrollTo(0, 800);
await espera(100);
const lenis = new Lenis();
lenis.raf(1700000000000);      // un reloj: Date.now()
lenis.scrollTo(1500);
lenis.raf(1016);               // otro: tiempo desde que abrió la página
const roto = lenis.animatedScroll;
const clavada = window.scrollY;
lenis.raf(1032);
lenis.resize();                // no lo arregla
lenis.raf(1048);
const sigueRoto = lenis.animatedScroll;
lenis.scrollTo(300, { immediate: true });
const recuperada = lenis.animatedScroll;
lenis.destroy();
window.scrollTo(0, 0);
await espera(50);

const salto = new Lenis();
salto.raf(1000);
salto.scrollTo(600);
salto.raf(1700000000000);      // el reloj adelantado corre primero
const y = window.scrollY;
salto.destroy();

const conDuracion = new Lenis({ duration: 1 });
conDuracion.scrollTo(600);
conDuracion.raf(1700000000000);
conDuracion.raf(1016);
const sinNaN = conDuracion.animatedScroll;
conDuracion.destroy();
// prueba: Number.isNaN(roto) && clavada === 0 && Number.isNaN(sigueRoto) && recuperada === 300
// prueba: y === 600
// prueba: Number.isFinite(sinNaN)
```

Una pausa no rompe nada:

```js
const conLerp = new Lenis();
conLerp.scrollTo(600);
conLerp.raf(1000);
conLerp.raf(61000); // un minuto sin fotogramas
const a = conLerp.scroll;
conLerp.destroy();
window.scrollTo({ top: 0, behavior: "instant" });
await espera(50);

const conDuracion = new Lenis({ duration: 1 });
conDuracion.scrollTo(600);
conDuracion.raf(1000);
conDuracion.raf(61000);
const b = conDuracion.scroll;
conDuracion.destroy();
// prueba: a === 600 && b === 600
```

## Trampas

- **`autoRaf: true` y además tu bucle.** Con orígenes iguales o cercanos, solo gastas de más. Con orígenes separados más de unos 118 s, hay salto o `NaN`, según la tabla de arriba: la página queda clavada arriba hasta que quites un reloj y llames a `stop()` y `start()`. [C] [E]
- **Pasar segundos.** `raf` espera milisegundos: `ticker.time` en segundos debe multiplicarse por 1000. Con segundos el scroll casi no avanza. [C] [E] en [`api-metodos`](../03-api/api-metodos.md)
- **Bucle propio sin cancelar.** `destroy()` solo cancela el de `autoRaf`. El tuyo sigue vivo llamando a una instancia destruida. [C]
- **Olvidar el reloj.** El síntoma confunde: el scroll parece muerto, pero `isScrolling` dice `'smooth'`. Es lo primero que hay que mirar. [E]
- **Corrección de pausas de un ticker externo.** Si ese reloj recorta el tiempo tras una pausa, como `lagSmoothing`, Lenis ve otra duración. El README no lo explica. Ver [`int-gsap`](../06-integracion/int-gsap.md). [C] (laboratorio)
