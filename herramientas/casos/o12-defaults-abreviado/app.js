import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis"; import Snap from "lenis/snap";
const scroller=document.querySelector('#c');
const lenis=new Lenis({ wrapper: scroller, content: scroller });
gsap.ticker.add((t)=>lenis.raf(t*1000)); lenis.on('scroll',ScrollTrigger.update);
ScrollTrigger.defaults({ scroller });
gsap.to('.a',{x:1,scrollTrigger:{scrub:true}});
