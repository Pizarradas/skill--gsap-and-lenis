import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
const smoother = ScrollSmoother.create({ smooth: 1 });
boton.onclick = () => gsap.to(window, { scrollTo: 800, duration: 1 });
smoother.scrollTop(0);
gsap.to(smoother.content(), { opacity: 1 });
