<script>
  import { onMount } from "svelte";
  import Lenis from "lenis";
  import "lenis/dist/lenis.css";
  // gsap.ticker.add(paso) era la versión anterior
  onMount(() => {
    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  });
</script>

<slot />

<style>
  /* scroll-snap-type: y mandatory; */
  main { min-height: 100vh; }
</style>
