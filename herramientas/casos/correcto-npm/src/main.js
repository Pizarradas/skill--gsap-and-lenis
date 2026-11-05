import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

// No uses nunca: new Lenis({ autoRaf: true }) ni ScrollSmoother.create() aquí
/*
  ScrollTrigger.normalizeScroll(true);
  gsap.to(window, { scrollTo: 300 });
  gsap.ticker.lagSmoothing(0);
*/
export const ayuda = "Antes usábamos ScrollSmoother.create({ smooth: 1 }) y new Lenis({ autoRaf: true })";
export const plantilla = `
  gsap.ticker.lagSmoothing(0);
  const l = new Lenis({ autoRaf: true });
`;

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
gsap.to(".barra", { scaleX: 1, ease: "none", scrollTrigger: { scrub: true } });

export function salir() {
  gsap.ticker.remove(paso);
  lenis.destroy();
}
