---
id: css-snap
titulo: SnapPlugin, ajustar valores durante el tween
capa: 04-propiedades
tipo: api
ambito: SnapPlugin
resumen: snap en vars redondea en cada render a incrementos, listas o radios. Diferencia con gsap.utils.snap y por qué el tween puede no terminar en su destino.
api: [gsap.TweenVars.snap, gsap.plugins.snap]
relacionadas: [css-modifiers, utl-numeros, css-attr, scr-snap]
etiquetas: [plugin, snap, redondeo]
fuentes:
  - docs/v3/GSAP/CorePlugins/Snap.md
estado: verificado
version: 3.15.1
---
# SnapPlugin

Aplica un ajuste a cada valor **durante** el tween, no solo al final. Es un modificador ya escrito para los casos habituales. Viene en el núcleo, sin registro. [O]

## Firma

```text
snap: "x,y"                               redondea a enteros
snap: { x: 20 }                           al múltiplo de 20 más cercano
snap: { x: [0, 50, 150] }                 al valor más cercano de la lista
snap: { x: { values: [...], radius: 20 } } solo si está a menos de 20
snap: { x: { increment: 50, radius: 5 } }  igual, con incremento
```

Cada entrada se pasa a [`gsap.utils.snap()`](../06-utilidades/utl-numeros.md). `roundProps: "x"`, de versiones antiguas, sigue funcionando y equivale a `snap: "x"`. [C] [E]

| Herramienta | Cuándo |
|---|---|
| `snap` en `vars` | Afecta al tween en cada render |
| `gsap.utils.snap()` | Calculas un valor suelto, o lo pasas por `pipe()` |
| `snap` de [Draggable](../10-interaccion/int-draggable.md) o [ScrollTrigger](../07-scroll/scr-snap.md) | Son opciones propias de esos plugins |

## Ejemplo

Avance a saltos de 20 px, para una estética de píxeles o de rejilla:

```js
const salto = document.querySelector(".salto");
const tween = gsap.to(salto, {
  x: 100,
  y: 100,
  duration: 1,
  ease: "none",
  paused: true,
  snap: { x: 20 },
});

tween.progress(0.33);

// prueba: salto.style.transform === "translate3d(40px, 33px, 0px)"
```

Imán: solo salta si está cerca.

```js
const iman = document.querySelector(".iman");
const cerca = gsap.to(iman, {
  x: 100,
  duration: 1,
  ease: "none",
  paused: true,
  snap: { x: { values: [0, 50], radius: 5 } },
});

cerca.progress(0.3);
const lejos = gsap.getProperty(iman, "x");
cerca.progress(0.48);

// prueba: lejos === 30
// prueba: gsap.getProperty(iman, "x") === 50
```

Sirve también para propiedades sin unidad y decimales: [E]

```js
const velo = document.querySelector(".velo");
gsap.to(velo, { opacity: 0.5, duration: 1, ease: "none", paused: true, snap: { opacity: 0.1 } }).progress(0.33);

// prueba: velo.style.opacity === "0.8"
```

## Trampas

- **El tween puede no terminar en su destino.** El ajuste también actúa en el último render: `x: 95` con `snap: { x: 20 }` acaba en 100. Con lista, el resultado es el valor más cercano, incluso lejano. Si el valor final importa, haz que sea alcanzable. [E]

```js
const fina = document.querySelector(".fina");
gsap.to(fina, { x: 95, duration: 1, paused: true, snap: { x: 20 } }).progress(1);

const lista = document.querySelector(".lista");
gsap.to(lista, { x: 100, duration: 1, paused: true, snap: { x: [0, 50, 150] } }).progress(1);

// prueba: gsap.getProperty(fina, "x") === 100
// prueba: gsap.getProperty(lista, "x") === 150
```

- **No se combina con `modifiers` en la misma propiedad:** solo se aplica uno. [O] [E]
- **Un incremento muy grande** hace que el elemento quieto "salte" al final, porque hasta la mitad del incremento sigue en el valor anterior. Es lo que se busca en efectos por pasos, pero para movimiento fluido elige valores pequeños. [P]
- **Para pasos temporales** uniformes, prueba [`steps()`](../05-easing/eas-stepped.md): cuantifica el tiempo, no el valor. [P]
