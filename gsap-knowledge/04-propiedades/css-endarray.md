---
id: css-endarray
titulo: EndArrayPlugin, animar arrays de números
capa: 04-propiedades
tipo: api
ambito: EndArrayPlugin
resumen: Interpola un array de números hacia otro con easing. Útil para datos de gráficas o buffers. Qué ocurre con longitudes distintas.
api: [gsap.TweenVars.endArray]
relacionadas: [css-attr, fun-objetivos, utl-numeros]
etiquetas: [arrays, datos, plugin]
fuentes:
  - docs/v3/GSAP/CorePlugins/EndArray.md
estado: verificado
version: 3.15.1
---
# EndArrayPlugin

Anima los elementos de un array hacia los valores de otro. El objetivo del tween es el propio array. Viene en el núcleo y no requiere registro. [O]

## Firma

```text
gsap.to(arrayOrigen, { endArray: arrayDestino, ...opciones })
```

El array origen se **modifica en el sitio**: léelo en `onUpdate`. [O]

## Ejemplo

```js
const serie = [1, 2, 3];
const lecturas = [];

gsap.to(serie, {
  endArray: [5, 6, 7],
  duration: 0.1,
  ease: "none",
  onUpdate: () => lecturas.push(serie[0]),
});

await new Promise((r) => setTimeout(r, 250));

// prueba: serie.join() === "5,6,7"
// prueba: lecturas.length > 0
```

## Trampas

- **Con longitudes distintas el código no sigue la documentación.** Se dice que solo se animan los índices comunes, pero el bucle recorre el array **destino**: los índices sobrantes del origen quedan intactos, y los que solo están en el destino se crean y animan desde 0. [E]

```js
const corto = [1, 2];
gsap.to(corto, { endArray: [5, 6, 7], duration: 1, ease: "none", paused: true }).progress(0.5);

const largo = [1, 2, 3];
gsap.to(largo, { endArray: [5, 6], duration: 1, ease: "none", paused: true }).progress(0.5);

// prueba: corto.join() === "3,4,3.5"
// prueba: largo.join() === "3,4,3"
```

- **Solo números.** Para objetos, usa un tween por objeto o [`gsap.utils.interpolate`](../06-utilidades/utl-numeros.md). [P]
- **Un array como objetivo normal** se interpreta como lista de objetivos, no como datos. Sin `endArray`, GSAP intentará animar propiedades de cada elemento. [C]
