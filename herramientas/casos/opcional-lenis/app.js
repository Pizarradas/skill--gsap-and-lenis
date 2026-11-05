import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis"; import Snap from "lenis/snap";
const lenis=new Lenis({ wrapper: document.querySelector('#c') });
gsap.ticker.add((t)=>lenis.raf(t*1000)); lenis.on('scroll',ScrollTrigger.update);
gsap.to('.a',{x:1,scrollTrigger:{scroller:'#c',pin:true}});
lenis?.stop();
lenis?.destroy();
console.log(lenis?.velocity);
