import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { iniciarMovimiento } from "./orquestador.js";

const mov = iniciarMovimiento({ perfil: "gsap+lenis", gsap, ScrollTrigger, Lenis });
mov.añadir(() => { gsap.to(".barra", { scaleX: 1, scrollTrigger: { scrub: true } }); });
