import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import Lenis from "lenis"; import Snap from "lenis/snap"; import {ScrollSmoother} from 'gsap/ScrollSmoother';
const lenis=new Lenis(); gsap.ticker.add((t)=>lenis.raf(t*1000));
ScrollSmoother.create({smooth:1});
gsap.to('.a',{x:1,scrollTrigger:{scrub:true,snap:0.25}});
