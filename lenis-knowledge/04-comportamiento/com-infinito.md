---
id: com-infinito
titulo: Scroll infinito
capa: 04-comportamiento
tipo: concepto
ambito: core
resumen: infinite elimina el límite y envuelve la posición con módulo. Qué parte hace Lenis, qué contenido hay que duplicar y cómo cambian scroll, progress y scrollTo.
api: [LenisOptions.infinite, Lenis.scroll, Lenis.animatedScroll, Lenis.progress, Lenis.limit, LenisOptions.syncTouch]
requiere: [fun-modelo]
relacionadas: [opc-tactil, api-scrollto]
etiquetas: [infinito, bucle, modulo]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Scroll infinito

Con `infinite: true`, Lenis deja de limitar el destino y escribe en el navegador la posición **módulo `limit`**. La sensación de bucle infinito requiere además un contenido preparado: Lenis no duplica nada. [C] [E]

## Modelo mental

```text
targetScroll, animatedScroll   crecen sin límite durante la animación
scroll = modulo(animatedScroll, limit)   siempre en [0, limit)
window.scrollY = scroll
al terminar: animatedScroll = targetScroll = scrollY real
```

Dos consecuencias [C] [E]:

- `0` y `limit` son la misma posición: al pasar por el final, el scroll real salta a 0. Para que no se vea, la última pantalla debe ser **idéntica a la primera**.
- En reposo, los valores vuelven a estar en rango. Solo son mayores que `limit` a mitad de animación. Lee `scroll`, no `animatedScroll`.

| Con `infinite` | Comportamiento |
|---|---|
| Rueda o `syncTouch` | Sin límite, se acumula |
| `scrollTo` programático | Da por el camino más corto: si la distancia supera `limit / 2`, va por el otro lado |
| Marca `lenisStopPropagation` | Siempre activa en cada gesto suavizado |
| Teclado, barra | Nativos: **no** dan la vuelta, se paran en el final |
| Toque sin `syncTouch` | Nativo: tampoco da la vuelta. Por eso el README exige `syncTouch` y el ejemplo del repositorio lo activa |

## Ejemplo

Contenido preparado, con la primera pantalla repetida al final:

```js
function prepararBucle(contenedor) {
  const primero = contenedor.firstElementChild;
  const copia = primero.cloneNode(true);
  copia.setAttribute("aria-hidden", "true");
  contenedor.append(copia);
  return () => copia.remove();
}

const pagina = document.body;
document.body.insertAdjacentHTML("afterbegin", '<section style="height:700px">Inicio</section>');
const deshacer = prepararBucle(pagina);
deshacer();

const lenis = new Lenis({ infinite: true, duration: 0.1 });
const limite = lenis.limit;

rueda(limite + 300); // pasa del final
const destino = lenis.targetScroll;
let t = 1000;
lenis.raf(t);
for (let i = 0; i < 20; i++) lenis.raf((t += 16));
const tras = { scroll: lenis.scroll, real: window.scrollY, destino: lenis.targetScroll };

rueda(-500); // retrocede por el cero
for (let i = 0; i < 20; i++) lenis.raf((t += 16));
const atras = lenis.scroll;

lenis.scrollTo(5, { immediate: true });
lenis.scrollTo(limite - 50); // lo corto es retroceder 55 px
lenis.raf((t += 16));
const direccion = lenis.direction;
lenis.destroy();
// prueba: destino === limite + 300
// prueba: tras.scroll === 300 && tras.real === 300 && tras.destino === 300
// prueba: atras === limite - 200
// prueba: direccion === -1
```

## Trampas

- **Activarlo sin duplicar contenido.** Funciona, pero se ve un salto al pasar de un extremo a otro. [C]
- **Medir con `limit` que incluye la copia.** La longitud del bucle es `limit`, no la altura del contenido original: la copia debe medir exactamente lo que ocupe la vista. [P]
- **Contar vueltas con `scroll`.** Da el valor envuelto. Acumula con `velocity` en el evento `scroll`. [P]
- **`scrollTo('bottom')`.** `limit` equivale a 0: no va al final, sino que da la vuelta. Usa `limit - 1` si quieres la última posición. [C]
- **Salto con barra de scroll visible.** La barra salta a cada vuelta, porque el scroll real se reinicia. Suele ocultarse. [P]
- **Elementos fijos a un valor de `progress`.** Vuelve a 0 a cada vuelta: diseña el efecto para ser periódico. [C]
- **Toque.** No se ha probado `infinite` con `syncTouch` en un dispositivo real. [P]
