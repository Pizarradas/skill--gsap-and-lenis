import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis";
const lenis = new Lenis(); const paso = (t) => lenis.raf(t * 1000); gsap.ticker.add(paso); lenis.on("scroll", ScrollTrigger.update);
const tl = gsap.timeline({ paused: true }).to(".a", { x: 100 }).addLabel("fin");
tl.tweenTo("fin");
const st = ScrollTrigger.create({ start: 0, end: 100 });
console.log(st.scroll());
