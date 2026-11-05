import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis";
window.scrollTo(0, 0);
const lenis = new Lenis(); const paso = (t) => lenis.raf(t * 1000); gsap.ticker.add(paso); lenis.on("scroll", ScrollTrigger.update);
export function salir() {
  gsap.ticker.remove(paso);
  lenis.destroy();
  window.scrollTo(0, 0);
}
