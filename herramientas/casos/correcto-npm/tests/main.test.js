import { ScrollSmoother } from "gsap/ScrollSmoother";
import Lenis from "lenis";
const a = new Lenis({ autoRaf: true });
ScrollSmoother.create({ smooth: 1 });
window.scrollTo(0, 0);
