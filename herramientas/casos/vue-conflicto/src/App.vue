<script setup>
import { onMounted, onUnmounted } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
let lenis;
onMounted(() => {
  lenis = new Lenis({ autoRaf: true });
  gsap.ticker.add((t) => lenis.raf(t));
  gsap.to(".caja", { x: 100, scrollTrigger: { scrub: 1 } });
  gsap.to(window, { scrollTo: 400 });
});
onUnmounted(() => lenis.destroy());
</script>

<template>
  <p>new Lenis() y ScrollSmoother.create() son texto de la página.</p>
  <div class="caja"></div>
</template>

<style scoped>
.contenedor { scroll-snap-type: y mandatory; }
</style>
