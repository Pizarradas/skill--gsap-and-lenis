---
id: cmb-velocidad
titulo: Velocidad y dirección con GSAP y Lenis
capa: 04-combinaciones
tipo: combinacion
perfiles: [gsap+lenis, lenis]
resumen: self.getVelocity() da píxeles por segundo y no depende de los fotogramas; lenis.velocity da píxeles por llamada a raf. La dirección coincide. Con infinite, al revés.
relacionadas: [orq-propiedad, cmb-infinito, cmb-scrub]
fuentes:
  - gsap:scr-instancia
  - lenis:api-instancia
  - lab:conflictos-lab/d-scroll.out
  - lab:conflictos-lab/k-extra.out
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Velocidad y dirección

**Veredicto:** con GSAP, el dueño es `self.getVelocity()`. Usar `lenis.velocity` funciona, pero el mismo efecto cambia con la frecuencia de la pantalla (O20). Excepción: `infinite` ([`cmb-infinito`](cmb-infinito.md)).

Alcance: ventana y contenedor, `lerp` y `duration`, rueda real. Fotogramas a la mitad, simulados llamando a `raf` uno de cada dos ticks. [E]

| Medida | `self.getVelocity()` | `lenis.velocity` |
|---|---|---|
| Unidad | px/s | px por llamada a `raf` |
| Máximo a 60 Hz | 13137 | 226 |
| Máximo a 30 Hz | 13463 | **369** |
| Pico, frente a la real | Coincide | 16,7 veces menos: multiplica por 60 solo a 60 Hz |
| En plena frenada | **Hasta 1,5 veces la real**, también sin Lenis: es una media con ventana | Exacta |
| Parado | 0 | 0 |

La dirección no distingue: `self.direction` y `lenis.direction` acertaron en todos los fotogramas, 0 fallos de unos 110. `self.direction` vale `1` y `-1`, igual que `lenis.direction` medida.

## Ejemplo

```js
const lenis = new Lenis();
const paso = (time) => lenis.raf(time * 1000);
gsap.ticker.add(paso);
lenis.on("scroll", ScrollTrigger.update);
let pico = 0, sentido = 0, igual = true;
const st = ScrollTrigger.create({
  start: 0,
  end: 2000,
  onUpdate(self) {
    pico = Math.max(pico, Math.abs(self.getVelocity()));
    sentido = self.direction;
    igual = igual && self.direction === lenis.direction;
  },
});
await espera(40);
rueda(900);
for (let i = 0; lenis.isScrolling !== false && i < 200; i++) await espera(20);
const parado = st.getVelocity();
gsap.ticker.remove(paso);
lenis.destroy();
st.kill();
window.scrollTo(0, 0);
// prueba: pico > 1000 && sentido === 1 && igual
// prueba: Math.abs(parado) < 300
```

## Contraejemplo

Un efecto escalado con `lenis.velocity` cambia con la cadencia. Aquí, el mismo gesto con la mitad de llamadas a `raf`:

```js
const medir = async (cada) => {
  const lenis = new Lenis();
  let k = 0, pico = 0;
  const paso = (time) => { if (k++ % cada === 0) lenis.raf(time * 1000); };
  gsap.ticker.add(paso);
  lenis.on("scroll", () => { pico = Math.max(pico, Math.abs(lenis.velocity)); });
  await espera(40);
  rueda(1500);
  await espera(500);
  gsap.ticker.remove(paso);
  lenis.destroy();
  window.scrollTo(0, 0);
  await espera(40);
  return pico;
};
const a60 = await medir(1);
const a30 = await medir(2);
// prueba: a30 > a60 * 1.2
```

## Trampas

- Si necesitas `lenis.velocity` en el perfil `lenis`, normaliza con el tiempo real entre eventos: ahí no hay `getVelocity()`.
- Con saltos programáticos, `getVelocity()` da números enormes y sin utilidad.
