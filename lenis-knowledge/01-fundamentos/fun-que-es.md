---
id: fun-que-es
titulo: Qué es Lenis
capa: 01-fundamentos
tipo: concepto
ambito: core
resumen: Biblioteca de scroll suave que anima el scroll nativo del navegador. Nació para sincronizar WebGL y DOM; el suavizado fue una consecuencia.
api: [Lenis, Snap]
requiere: []
relacionadas: [fun-modelo, fun-instalacion, fun-cuando-usarlo, fun-licencia]
etiquetas: [introduccion, scroll, suavizado]
fuentes:
  - README.md
  - MANIFESTO.md
estado: verificado
version: 1.3.27
---
# Qué es Lenis

Lenis ("suave" en latín) intercepta la rueda y, si se pide, el toque, y lleva la posición de scroll hasta su destino a lo largo de varios fotogramas. No crea un scroll falso: escribe en el **scroll real** del navegador. [C]

## Modelo mental

Piensa en Lenis como un amortiguador entre el gesto y el scroll nativo:

- La página sigue siendo una página con scroll normal: `window.scrollY` es la verdad, `position: sticky` funciona y las anclas existen. [C] [E]
- Lenis solo decide **cuándo** llega cada píxel de esa posición. Ver [`fun-modelo`](fun-modelo.md).
- Todo lo que Lenis expone (`scroll`, `velocity`, `progress`, evento `scroll`) se actualiza en un solo reloj, el que tú le das con [`raf`](../04-comportamiento/com-raf.md).

Ese último punto explica su origen. Según el manifiesto del proyecto, el problema real era **sincronizar WebGL y DOM durante el scroll**: con scroll nativo, el desplazamiento compositado y el dibujo de una escena no van a la vez. Al interpolar la posición en el hilo principal, Lenis permite leerla y dibujar en el mismo fotograma; el suavizado que lo hizo popular fue un efecto secundario. [O] [P]

| Paquete | Importación | Qué añade | Dónde |
|---|---|---|---|
| Núcleo | `lenis` | Clase `Lenis` | [`api-instancia`](../03-api/api-instancia.md) |
| Snap | `lenis/snap` | Clase `Snap`, puntos de encaje | [`snp-snap`](../05-snap/snp-snap.md) |
| Frameworks | `lenis/react`, `lenis/vue` | Envoltorios del mismo núcleo | [`int-contrato`](../06-integracion/int-contrato.md) |

Fuera del paquete, el README cita `r3f-scroll-rig` y `locomotive-scroll` como proyectos que se apoyan en Lenis. [O]

No tiene dependencias en tiempo de ejecución. Tamaños de 1.3.27 medidos sobre `dist/`: `lenis.min.js` 18,8 KB (5,4 KB con gzip), `lenis-snap.min.js` 5,8 KB (2,0 KB), `lenis.css` 513 bytes. [C]

## Ejemplo

```html
<main style="height:3000px"></main>
```

```js
const lenis = new Lenis({ autoRaf: true });

lenis.on("scroll", ({ scroll, progress }) => {
  document.body.dataset.progreso = progress.toFixed(2);
});

lenis.scrollTo(500, { immediate: true });
const nativo = window.scrollY; // Lenis escribió en el scroll real
const leido = lenis.scroll;
lenis.destroy();
// prueba: nativo === 500 && leido === 500
```

## Trampas

- **Creer que Lenis sustituye al scroll.** Lo conduce, no lo reemplaza. Lo que lea `window.scrollY` o use `IntersectionObserver` sigue funcionando. [C]
- **Esperar que suavice todo.** Teclado, barra de scroll, foco y toque sin `syncTouch` siguen siendo nativos: Lenis los **observa** y se sincroniza, pero no los anima. Ver [`fun-modelo`](fun-modelo.md).
- **Creer que por defecto se mueve solo.** `autoRaf` es `false`: sin un bucle que llame a `lenis.raf()`, nada avanza. Ver [`com-raf`](../04-comportamiento/com-raf.md). [C] [E]
- **Usarlo por costumbre.** Tiene costes de accesibilidad y de rendimiento; ver [`fun-cuando-usarlo`](fun-cuando-usarlo.md).
