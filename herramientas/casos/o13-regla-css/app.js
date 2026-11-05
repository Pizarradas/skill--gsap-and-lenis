import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis";
const lenis = new Lenis(); const paso = (t) => lenis.raf(t * 1000); gsap.ticker.add(paso); lenis.on("scroll", ScrollTrigger.update);
const lenis2 = new Lenis({ wrapper: document.querySelector("#c") });
lenis2.stop();
