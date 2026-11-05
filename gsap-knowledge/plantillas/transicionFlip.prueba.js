const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const simular = (reducido) => {
  window.matchMedia = (q) => ({ matches: reducido ? /: reduce\)/.test(q) : /no-preference/.test(q), media: q, addListener() {}, removeListener() {} });
};
const fichas = gsap.utils.toArray(".ficha");
const [f1, f2, f3, f4] = fichas;
const boton = document.getElementById("alternar");
const estilos = () => fichas.map((f) => f.style.cssText).join("|");
const inicial = estilos();
const cambio = () => document.querySelectorAll(".impar").forEach((f) => f.classList.toggle("oculta"));
const r = {};

simular(false);
const limpiar = transicionFlip(".ficha", { cambio, disparador: "#alternar", duracion: 0.12 });
await espera(30); // el primer tick absorbe el tiempo de carga
const x3 = f3.getBoundingClientRect().left;
boton.click();
r.cambioAplicado = f2.classList.contains("oculta") && !f4.classList.contains("oculta");
await espera(40);
r.enVuelo = Flip.isFlipping(f3) && f3.style.position === "absolute";
await espera(130);
r.terminado = !Flip.isFlipping(f3) && f3.style.position !== "absolute";
r.posicionFinal = f3.getBoundingClientRect().left === x3 - 100; // la ficha 2 ya no ocupa sitio
r.sinResto = f1.style.cssText === inicial.split("|")[0];

limpiar.ejecutar();
await espera(40);
limpiar();
r.limpiezaEnVuelo = !Flip.isFlipping(f3) && estilos() === inicial;
const claseTrasLimpiar = f2.className;
boton.click();
limpiar.ejecutar();
r.sinListener = f2.className === claseTrasLimpiar;

simular(true);
const limpiarReducido = transicionFlip(".ficha", { cambio, disparador: "#alternar" });
const antes = f2.className;
boton.click();
r.reducidoSinVuelo = f2.className !== antes && !Flip.isFlipping(f3) && estilos() === inicial;
limpiarReducido();

// Cambio asíncrono: el DOM cambia tras un await, como con datos remotos o un render diferido.
simular(false);
const rejilla = document.querySelector(".rejilla");
const raiz = () => rejilla.querySelectorAll(".ficha");
const pausa = () => espera(60);
await espera(30);
const xAntes = f3.getBoundingClientRect().left;
const limpiarAsync = transicionFlip(raiz, { cambio: () => pausa().then(() => f2.classList.toggle("oculta")), duracion: 0.12 });
const enCurso = limpiarAsync.ejecutar();
r.asyncDevuelvePromesa = typeof enCurso.then === "function";
await espera(20);
r.asyncSinVueloAntes = !Flip.isFlipping(f3);
await enCurso;
await espera(30);
r.asyncVuela = Flip.isFlipping(f3) && f3.getBoundingClientRect().left !== xAntes;
await espera(130);
r.asyncTermina = !Flip.isFlipping(f3) && f3.style.cssText === inicial.split("|")[2];

// Limpiar durante la espera: el cambio llega, pero ya no hay vuelo ni restos.
const claseAntes = f2.className;
const pendiente = limpiarAsync.ejecutar();
await espera(20);
limpiarAsync();
await pendiente;
await espera(30);
r.limpiarEnEspera = f2.className !== claseAntes && !Flip.isFlipping(f3) && estilos() === inicial;

// Otro cambio durante la espera: solo vuela el último, desde el estado guardado por él.
let vuelos = 0;
const flipFrom = Flip.from;
Flip.from = (...args) => (vuelos++, flipFrom(...args));
const limpiarRelevo = transicionFlip(raiz, { cambio: () => pausa().then(() => f2.classList.toggle("oculta")), duracion: 0.05 });
const primero = limpiarRelevo.ejecutar();
const segundo = limpiarRelevo.ejecutar();
await Promise.all([primero, segundo]);
await espera(20); // isFlipping exige un primer tick
r.relevo = vuelos === 1 && Flip.isFlipping(f3);
await espera(90);
limpiarRelevo();
Flip.from = flipFrom;

// Promesa rechazada: sin vuelo, y el rechazo llega a quien llamó.
const limpiarFallo = transicionFlip(raiz, { cambio: () => Promise.reject(new Error("sin datos")), duracion: 0.05 });
r.rechazo = await limpiarFallo.ejecutar().then(() => false, (e) => e.message === "sin datos");
r.rechazoSinResto = !Flip.isFlipping(f3) && estilos() === inicial;
limpiarFallo();

// Limpiar en pleno vuelo no deja colgada la promesa: se cumplió al empezar.
const limpiarEnVuelo = transicionFlip(raiz, { cambio: () => pausa().then(() => f2.classList.toggle("oculta")), duracion: 0.3 });
await limpiarEnVuelo.ejecutar();
await espera(20);
r.enVueloCumplida = Flip.isFlipping(f3);
limpiarEnVuelo();
r.enVueloLimpio = !Flip.isFlipping(f3) && estilos() === inicial;

// El render sustituye los nodos: el vuelo los une por data-flip-id.
rejilla.innerHTML = '<div class="ficha" data-flip-id="a" style="width:100px;height:50px">A</div><div class="ficha" data-flip-id="b" style="width:100px;height:50px">B</div>';
const limpiarNodos = transicionFlip(raiz, {
  duracion: 0.12,
  cambio: () =>
    pausa().then(() => {
      rejilla.innerHTML = '<div class="ficha" data-flip-id="b" style="width:100px;height:50px">B</div><div class="ficha" data-flip-id="a" style="width:100px;height:50px">A</div>';
    }),
});
await limpiarNodos.ejecutar();
const nueva = rejilla.querySelector('[data-flip-id="a"]');
await espera(30);
r.nodosNuevosVuelan = Flip.isFlipping(nueva) && nueva.getBoundingClientRect().left < rejilla.getBoundingClientRect().left + 100;
await espera(130);
r.nodosNuevosLlegan = nueva.getBoundingClientRect().left === rejilla.getBoundingClientRect().left + 100;
limpiarNodos();
// prueba: r.asyncDevuelvePromesa
// prueba: r.asyncSinVueloAntes
// prueba: r.asyncVuela
// prueba: r.asyncTermina
// prueba: r.limpiarEnEspera
// prueba: r.relevo
// prueba: r.rechazo
// prueba: r.rechazoSinResto
// prueba: r.enVueloCumplida
// prueba: r.enVueloLimpio
// prueba: r.nodosNuevosVuelan
// prueba: r.nodosNuevosLlegan
// prueba: r.cambioAplicado
// prueba: r.enVuelo
// prueba: r.terminado
// prueba: r.posicionFinal
// prueba: r.sinResto
// prueba: r.limpiezaEnVuelo
// prueba: r.sinListener
// prueba: r.reducidoSinVuelo
// prueba: ScrollTrigger.getAll().length === 0
