<?php
// wp_enqueue_script('smoother', 'https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollSmoother.min.js');
# wp_enqueue_script('viejo', 'https://cdn.jsdelivr.net/npm/lenis@0.2.0/dist/lenis.min.js');
function tema_scripts() {
  wp_enqueue_script('gsap', 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js', [], null, true);
  wp_enqueue_script('lenis', 'https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js', [], null, true);
  wp_add_inline_script('lenis', 'const lenis = new Lenis({ autoRaf: true }); gsap.ticker.add((t) => lenis.raf(t * 1000));');
}
add_action('wp_enqueue_scripts', 'tema_scripts');
