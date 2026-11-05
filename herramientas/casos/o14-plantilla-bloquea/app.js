import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"; import { Observer } from "gsap/Observer"; import Lenis from "lenis";
import { iniciarMovimiento } from "./orquestador.js";
const mov = iniciarMovimiento({ perfil: "gsap+lenis", gsap, ScrollTrigger, Lenis });
Observer.create({ type: "wheel", preventDefault: true, onDown: () => {} });
mov.bloquear();
