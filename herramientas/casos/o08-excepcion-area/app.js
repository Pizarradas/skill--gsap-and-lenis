import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis"; import Snap from "lenis/snap"; const lenis = new Lenis(); const paso=(t)=>lenis.raf(t*1000); gsap.ticker.add(paso); lenis.on("scroll",ScrollTrigger.update);
const area=document.querySelector('#area');
gsap.to(area, { scrollTo: 600, duration: 0.2 });
