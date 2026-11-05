import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis";
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  const t = time * 1000;
  lenis.raf(t);
});
const paso = function (time) { const t = time * 1000; lenis.raf(t); };
gsap.ticker.add(paso);
