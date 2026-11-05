import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis";
const lenis = new Lenis(); const paso = (t) => lenis.raf(t * 1000); gsap.ticker.add(paso); lenis.on("scroll", ScrollTrigger.update);
gsap.to(".a", { x: 1, scrollTrigger: { scrub: 0.3 } });
gsap.to(".b", { x: 1, scrollTrigger: { scrub: .25 } });
gsap.to(".c", { x: 1, scrollTrigger: { scrub: true } });
