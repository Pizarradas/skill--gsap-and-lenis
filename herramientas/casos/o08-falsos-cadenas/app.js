import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis";
const lenis = new Lenis(); const paso = (t) => lenis.raf(t * 1000); gsap.ticker.add(paso); lenis.on("scroll", ScrollTrigger.update);
// gsap.to(window, { scrollTo: 300 });
const ayuda = 'Evita gsap.to(window, { scrollTo: 300 }) y window.scrollTo(0, 0) con Lenis';
const receta = `ScrollTrigger.normalizeScroll(true); gsap.ticker.lagSmoothing(0); new Lenis({ autoRaf: true });`;
console.log(ayuda, receta);
