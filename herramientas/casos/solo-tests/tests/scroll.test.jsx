import Lenis from "lenis";
const l = new Lenis({ autoRaf: true });
gsap.ticker.add((t) => l.raf(t * 1000));
