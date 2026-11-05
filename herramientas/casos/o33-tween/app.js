import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
const smoother = ScrollSmoother.create({ smooth: 1 });
boton.onclick = () => gsap.to(smoother, { scrollTop: 800, duration: 1 });
