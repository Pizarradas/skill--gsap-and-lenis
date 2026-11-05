import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
ScrollSmoother.create({ smooth: 1 });
boton.onclick = () => gsap.to(ScrollSmoother.get(), {
  scrollTop: 800,
  duration: 1,
});
