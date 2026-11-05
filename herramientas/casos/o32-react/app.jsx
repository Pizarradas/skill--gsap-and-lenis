import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import { ReactLenis, useLenis } from "lenis/react";
export function A() {
  useLenis(ScrollTrigger.update);
  gsap.to(".a", { x: 1, scrollTrigger: { scrub: true } });
  return <ReactLenis root />;
}
