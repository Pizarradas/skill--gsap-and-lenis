import gsap from "gsap";
import Lenis from "lenis";
const lenis = new Lenis();
gsap.ticker.add((t) => lenis.raf(t * 1000));
