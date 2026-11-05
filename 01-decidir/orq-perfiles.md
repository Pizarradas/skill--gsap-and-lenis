---
id: orq-perfiles
titulo: Los cinco perfiles
capa: 01-decidir
tipo: decision
perfiles: [ninguno, gsap, gsap-smoother, lenis, gsap+lenis]
resumen: Qué incluye cada perfil, cuánto pesa, cómo arranca, qué fichas aplican y qué deja de existir, para fijar uno y no salir de él.
relacionadas: [orq-que-usar, orq-por-tarea, orq-propiedad, orq-ciclo]
fuentes:
  - gsap:fun-instalacion
  - gsap:fun-licencia
  - lenis:fun-instalacion
  - lenis:fun-licencia
  - lenis:cal-rendimiento
estado: verificado
version: gsap 3.15.1 + lenis 1.3.27
---
# Los cinco perfiles

Fijado el perfil, las [reglas de propiedad](../02-reglas/orq-propiedad.md) dicen quién manda en cada cosa y [`orq-anulaciones`](../02-reglas/orq-anulaciones.md) qué cambia de las bases.

## Comparación

| Perfil | Bibliotecas | Peso gzip | Marcado | Coste de hilo principal | Prohibiciones propias |
|---|---|---|---|---|---|
| `ninguno` | Ninguna | 0 | Libre | El del navegador | Ninguna |
| `gsap` | `gsap` y `ScrollTrigger` si hay scroll | 28,4 kB, o 46,4 kB | Libre | Solo lo animado | Ninguna |
| `lenis` | `lenis` y `lenis.css` | 5,4 kB | Libre | La rueda pasa al hilo principal | O02, O08, O11, O13, O24 |
| `gsap+lenis` | Las de `gsap` y `lenis` | 51,9 kB | Libre | Suma de ambos | 18: ver `decidir.py` |
| `gsap-smoother` | `gsap`, `ScrollTrigger`, `ScrollSmoother` | 52,0 kB | `wrapper` y `content` | Mayor: traslada el contenido entero | O03, O33 |

Peso medido con `gzip -9` sobre los `.min.js` de gsap 3.15.1 y lenis 1.3.27. `lenis/snap` añade 2,0 kB y `ScrollToPlugin`, 2,0 kB; un empaquetador puede reducir algo más. [E, laboratorio]

La diferencia de coste es de una escena pesada a propósito: 763 ms en ScrollSmoother, 201 ms en Lenis, 114 ms en nativo. Mídelo en tu página: [`cmb-smoother`](../04-combinaciones/cmb-smoother.md). [E, laboratorio]

**Licencias.** Lenis es MIT. GSAP es gratuito, también para uso comercial, pero no es código abierto: prohíbe usarlo en constructores visuales sin código que compitan con Webflow. Si el producto es uno de esos, revisa `gsap:fun-licencia` antes de elegir un perfil con GSAP.

## Qué lee cada perfil

| Perfil | Base que aplica | Base que no existe para este proyecto |
|---|---|---|
| `ninguno` | Ninguna | Las dos |
| `gsap` | `gsap-knowledge`, sin `scr-smoother*` | `lenis-knowledge` |
| `gsap-smoother` | `gsap-knowledge` | `lenis-knowledge` |
| `lenis` | `lenis-knowledge`, sin `int-gsap` | `gsap-knowledge` |
| `gsap+lenis` | Las dos, filtradas por [`orq-anulaciones`](../02-reglas/orq-anulaciones.md) | `scr-smoother*`, `scr-normalize`, `scr-scrollerproxy` |

## Arranque

Copia `plantillas/orquestador.js` al proyecto y crea `movimiento.perfil`, con el nombre del perfil. Cambiar de perfil es cambiar el arranque: la aplicación usa `mov.añadir`, `mov.irA` y `mov.bloquear` en todos. Ver [`plantillas/README.md`](../plantillas/README.md).

```js fragmento
const mov = iniciarMovimiento({ perfil: "gsap+lenis", gsap, ScrollTrigger, Lenis });
```

Un perfil sin GSAP no tiene `gsap` en la aplicación: los efectos de `mov.añadir` son tuyos.

## Cuándo cambiar de perfil

| De | A | Cuándo | Qué hacer |
|---|---|---|---|
| `ninguno` | `gsap` | Aparece la primera secuencia, `pin` o `scrub` | Añade la biblioteca y cambia la palabra |
| `gsap` | `gsap+lenis` | Se pide scroll suave | Cambia la palabra. Revisa `ScrollToPlugin`, `snap`, `normalizeScroll`, `scrub` numérico: `auditar_proyecto.py` los señala |
| `lenis` | `gsap+lenis` | Aparece un `pin` o una secuencia | Cambia la palabra. El reloj pasa a `gsap.ticker` |
| `gsap+lenis` | `gsap` | El suavizado no compensa | Cambia la palabra y retira `data-lenis-*`, `lenis.css` y `lenis/snap` |
| `gsap-smoother` | `gsap+lenis` | Hace falta `sticky`, contenedor o eje horizontal | Quita `wrapper` y `content`, `data-speed` y `data-lag`. Retira ScrollSmoother del todo |
