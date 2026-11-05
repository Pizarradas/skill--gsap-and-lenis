import gsap from "gsap"; import Lenis from "lenis";
const lenis = new Lenis();
function paso(segundos) {
  lenis.raf(segundos);
}
gsap.ticker.add(paso);
