/*!
 * GSAP 3.15.1
 * https://gsap.com
 *
 * @license Copyright 2026, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license.
 * @author: Jack Doyle, jack@greensock.com
 */
!function(){const lenis=new Lenis({autoRaf:true});gsap.ticker.add(t=>lenis.raf(t));ScrollSmoother.create({});gsap.to(window,{scrollTo:300});ScrollTrigger.normalizeScroll(true)}();
