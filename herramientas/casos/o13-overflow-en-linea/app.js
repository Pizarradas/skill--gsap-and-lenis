import Lenis from "lenis";
const caja = document.querySelector("#c");
const lenis = new Lenis({ wrapper: caja, content: caja, autoRaf: true });
caja.style.overflow = "hidden";
lenis.stop();
