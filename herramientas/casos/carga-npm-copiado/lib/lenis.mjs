//#region package.json
var version = "1.3.27";
//#endregion
!function(){const lenis=new Lenis({autoRaf:true});gsap.ticker.add(t=>lenis.raf(t));ScrollSmoother.create({});gsap.to(window,{scrollTo:300});ScrollTrigger.normalizeScroll(true)}();
