import Lenis from "lenis";
const panel = document.querySelector("#panel");
const lenis = new Lenis({ wrapper: panel, content: panel.firstElementChild, autoRaf: true });
document.querySelector("#volver").addEventListener("click", () => window.scrollTo(0, 0));
