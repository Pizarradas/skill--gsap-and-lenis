import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis"; import Snap from "lenis/snap";
const lenis = new Lenis();
const mal = (time) => lenis.raf(time);
gsap.ticker.add(mal);
lenis.on('scroll',ScrollTrigger.update);
