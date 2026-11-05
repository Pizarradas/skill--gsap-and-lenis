import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import { ReactLenis, useLenis } from "lenis/react";
export function A() {
  const lenis = useLenis(ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.to(".a", { x: 1, scrollTrigger: { scrub: true } });
  return <ReactLenis root options={{ autoRaf: false }} />;
}
