---
id: com-clases
titulo: Clases CSS de estado
capa: 04-comportamiento
tipo: referencia
ambito: core
resumen: Clases que Lenis pone en la raíz según su estado, cuándo cambian y por qué borra cualquier otra clase tuya que empiece por lenis-.
api: [Lenis.className, Lenis.rootElement, Lenis.isScrolling, Lenis.isStopped, Lenis.isLocked, Lenis.isSmooth]
requiere: [fun-modelo]
relacionadas: [fun-css, com-stop-start, api-instancia]
etiquetas: [css, clases, estado]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Clases CSS de estado

Lenis refleja su estado en `rootElement`: `<html>` con ventana, y `wrapper` con contenedor. El valor que debería tener en cada momento se lee en `lenis.className`. [C]

| Clase | Presente cuando |
|---|---|
| `lenis` | Siempre, hasta `destroy()` |
| `lenis-autoToggle` | Con `autoToggle` |
| `lenis-stopped` | `isStopped` |
| `lenis-locked` | `isLocked` |
| `lenis-scrolling` | `isScrolling` no es `false`: suave o nativo |
| `lenis-smooth` | `isScrolling === 'smooth'` |

Se usan en [`lenis.css`](../01-fundamentos/fun-css.md) y puedes usarlas en tu CSS, por ejemplo para ocultar una barra propia durante el scroll. Cuando una propiedad de estado cambia, Lenis **borra toda clase que sea `lenis` o empiece por `lenis-`** y pone las que tocan. [C] [E]

## Ejemplo

```js
const raiz = document.documentElement;
const lenis = new Lenis();
const reposo = raiz.className;

rueda(200);
const animando = raiz.className;

let t = 1000;
lenis.raf(t);
for (let i = 0; i < 300; i++) lenis.raf((t += 16));
const alFinal = raiz.className;

lenis.stop();
const parado = raiz.className;
lenis.start();
lenis.scrollTo(900, { lock: true });
const bloqueado = lenis.className;

raiz.classList.add("lenis-tema");
lenis.raf((t += 16));
lenis.stop(); // un cambio de estado reescribe las clases
const miClase = raiz.classList.contains("lenis-tema");

lenis.destroy();
const fin = raiz.className;
// prueba: reposo === "lenis"
// prueba: animando === "lenis lenis-scrolling lenis-smooth"
// prueba: alFinal === "lenis"
// prueba: parado === "lenis lenis-stopped"
// prueba: bloqueado === "lenis lenis-locked lenis-scrolling lenis-smooth"
// prueba: miClase === false && fin === ""
```

## Trampas

- **Nombres propios con prefijo `lenis-`.** Desaparecen en el siguiente cambio de estado. Usa otro prefijo. [C] [E]
- **`lenis-scrolling` no significa animación.** También está en scroll nativo. Para el suavizado, usa `lenis-smooth`. [C]
- **`lenis-scrolling` puede quedarse puesta.** Si el navegador restaura el scroll al recargar, ver [`com-restauracion`](com-restauracion.md). (laboratorio)
- **Clases en la raíz equivocada.** Con contenedor van en `wrapper`, no en `<html>`, y `html.lenis` de `lenis.css` no aplica. [C] [E] en [`opc-contenedores`](../02-opciones/opc-contenedores.md)
- **Sin reloj, `lenis-smooth` se queda.** Es síntoma de que falta `raf`. Ver [`com-raf`](com-raf.md). [E]
