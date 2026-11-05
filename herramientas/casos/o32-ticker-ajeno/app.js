import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis"; import Snap from "lenis/snap";
const lenis=new Lenis({autoRaf:true}); lenis.on('scroll',ScrollTrigger.update);
gsap.ticker.add(()=>{}); 
gsap.to('.a',{x:1,scrollTrigger:{scrub:true}});
