import gsap from "gsap"; import Lenis from "lenis";
const lenis = new Lenis();
const bucle = (ms) => { lenis.raf(ms); requestAnimationFrame(bucle); };
requestAnimationFrame(bucle);
gsap.ticker.add(() => {});
