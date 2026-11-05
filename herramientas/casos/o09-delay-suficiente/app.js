import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis";
const lenis = new Lenis(); const paso = (t) => lenis.raf(t * 1000); gsap.ticker.add(paso); lenis.on("scroll", ScrollTrigger.update);
gsap.to(".a", { x: 1, scrollTrigger: { snap: { snapTo: 0.25, delay: 0.3 } } });
