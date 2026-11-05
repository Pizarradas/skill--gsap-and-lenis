import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import { Observer } from "gsap/Observer"; import Lenis from "lenis";
const lenis = new Lenis(); const paso = (t) => lenis.raf(t * 1000); gsap.ticker.add(paso); lenis.on("scroll", ScrollTrigger.update);
Observer.create({ type: "wheel", preventDefault: true, onDown: () => {} });
lenis?.stop();
