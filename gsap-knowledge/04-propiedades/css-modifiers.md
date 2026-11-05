---
id: css-modifiers
titulo: ModifiersPlugin, interceptar cada valor
capa: 04-propiedades
tipo: api
ambito: ModifiersPlugin
resumen: Función por propiedad que recibe el valor de cada tick y devuelve el que se aplica. Sirve para envolver, limitar y derivar. Reglas de tipos y de unidades.
api: [gsap.TweenVars.modifiers, gsap.plugins.modifiers]
requiere: [fun-valores]
relacionadas: [css-snap, utl-funciones, utl-numeros, rec-marquee]
etiquetas: [plugin, modificadores, bucle]
fuentes:
  - docs/v3/GSAP/CorePlugins/Modifiers.md
estado: verificado
version: 3.15.1
---
# ModifiersPlugin

Añade una función por propiedad que intercepta el valor justo antes de aplicarlo, en cada render. El tween sigue su curva normal y tú devuelves lo que se escribe de verdad. Viene en el núcleo. [O]

## Firma

```text
modifiers: { propiedad: (valor, objetivo) => nuevoValor }
```

| Parámetro | Contenido |
|---|---|
| `valor` | Valor a punto de aplicarse |
| `objetivo` | El objetivo actual |

El **tipo de `valor`** depende del objetivo: [E]

| Propiedad | `valor` | Devuelve |
|---|---|---|
| Objeto plano | Número | Número |
| `x`, `y`, `left`, `width` en DOM | Cadena con unidad: `"135px"` | Cadena **con unidad** |
| `rotation` en DOM | Cadena: `"45deg"` | Cadena con unidad |
| `scaleX`, `opacity` | Cadena sin unidad: `"1.5"` | Número o cadena |
| `boxShadow` | Cadena compleja | Cadena |

## Ejemplo

Cinta infinita. El tween avanza sin límite y el modificador envuelve cada posición:

```html
<div class="pista" style="position:relative;width:300px;height:50px">
  <div class="tira" style="position:absolute;width:50px;height:50px"></div>
  <div class="tira" style="position:absolute;width:50px;height:50px"></div>
  <div class="tira" style="position:absolute;width:50px;height:50px"></div>
</div>
```

```js
const ajustar = gsap.utils.unitize(gsap.utils.wrap(0, 150), "px");

const cinta = gsap.to(".tira", {
  x: "+=150",
  duration: 3,
  ease: "none",
  repeat: -1,
  paused: true,
  modifiers: { x: ajustar },
});

gsap.set(".tira", { x: (i) => i * 50 });
cinta.progress(0);
cinta.invalidate();
cinta.seek(1);

const posiciones = gsap.utils.toArray(".tira").map((el) => gsap.getProperty(el, "x"));

// prueba: posiciones.join() === "50,100,0"
// prueba: posiciones.every((x) => x >= 0 && x < 150)
```

Comprobación de lo que llega según la propiedad:

```js
const tipos = {};
const anota = (clave) => (v) => {
  tipos[clave] = v;
  return v;
};

gsap.to(".muestra", {
  rotation: 90,
  scaleX: 2,
  opacity: 0.5,
  boxShadow: "1px 1px 1px 1px rgb(0, 0, 0)",
  duration: 1,
  ease: "none",
  paused: true,
  modifiers: {
    rotation: anota("rotation"),
    scaleX: anota("scaleX"),
    opacity: anota("opacity"),
    boxShadow: anota("boxShadow"),
  },
}).progress(0.5);

// prueba: tipos.rotation === "45deg"
// prueba: String(tipos.scaleX) === "1.5"
// prueba: String(tipos.opacity) === "0.75"
```

`unitize()` resuelve el manejo de unidades: quita la unidad al entrar y la añade al salir. [O]

El valor real sigue su curva aunque el aplicado no: [E]

```js
const leido = [];
const caja = document.querySelector(".caja");
const conResto = gsap.to(caja, {
  x: 500,
  duration: 1,
  ease: "none",
  paused: true,
  modifiers: {
    x: (valor, objetivo) => {
      leido.push(valor, objetivo === caja);
      return (parseFloat(valor) % 100) + "px";
    },
  },
});

conResto.progress(0.27);

// prueba: leido[0] === "135px" && leido[1] === true
// prueba: gsap.getProperty(caja, "x") === 35
```

## Trampas

- **Devolver un número para `x` borra la transformación.** La cadena resultante queda sin unidad, CSS inválido, y el navegador la descarta sin aviso. En DOM devuelve siempre con unidad o usa `unitize()`. La documentación afirma que en `x` se recibe un número: en 3.15.1 llega `"135px"`. [E]

```js
const sinUnidad = document.querySelector(".sin-unidad");
gsap.to(sinUnidad, {
  x: 100,
  duration: 1,
  ease: "none",
  paused: true,
  modifiers: { x: (v) => parseFloat(v) * 2 },
}).progress(0.5);

// prueba: sinUnidad.style.transform === ""
```

- **`scale` y `rotationZ` no se pueden modificar.** Usa `scaleX`/`scaleY` y `rotation`. El modificador en la forma abreviada se ignora sin aviso. [O] [E]

```js
const conScale = document.querySelector(".con-scale");
gsap.to(conScale, { scale: 2, duration: 1, ease: "none", paused: true, modifiers: { scale: () => 3 } }).progress(0.5);

const conEjes = document.querySelector(".con-ejes");
gsap.to(conEjes, { scaleX: 2, duration: 1, ease: "none", paused: true, modifiers: { scaleX: () => 3 } }).progress(0.5);

// prueba: new DOMMatrix(conScale.style.transform).a === 1.5 && new DOMMatrix(conScale.style.transform).d === 1.5
// prueba: conEjes.style.transform.includes("scale(3, 1)")
```

- **Solo se modifica lo que anima el tween.** Una clave que no aparece en `vars` nunca se ejecuta. Para derivar `y` de `x`, anima también `y`, o escribe en `onUpdate`. [E]
- **`snap`, `roundProps` y `modifiers` comparten mecanismo.** En una misma propiedad solo gana uno, sin aviso. Si necesitas ambos, redondea dentro del modificador. [O] [E]

```js
const ambos = document.querySelector(".ambos");
gsap.to(ambos, {
  x: 100,
  duration: 1,
  ease: "none",
  paused: true,
  snap: { x: 30 },
  modifiers: { x: () => "7px" },
}).progress(0.5);

// prueba: ambos.style.transform.includes("7px")
```

- **Se ejecuta en cada tick y por objetivo.** Es código de bucle: nada de lecturas de layout ni reservas de memoria. [P]
- **Para clamp o wrap sencillos** existen los curried de `gsap.utils`, ya listos para usar. Ver [funciones](../06-utilidades/utl-funciones.md). [P]
- **El valor interno no cambia.** `tween.progress()` y los callbacks siguen la curva original. [C]
