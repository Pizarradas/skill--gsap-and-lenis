import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis"; import Snap from "lenis/snap";
const wrapper=document.querySelector('#c'), content=wrapper.firstElementChild;
const lenis=new Lenis({ wrapper, content });
gsap.ticker.add((t)=>lenis.raf(t*1000)); lenis.on('scroll',ScrollTrigger.update);
gsap.to('.a',{x:1,scrollTrigger:{scrub:true}});
lenis.stop();
