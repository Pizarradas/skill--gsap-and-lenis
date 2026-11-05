---
id: css-transforms
titulo: Transformaciones, orden, x/y frente a xPercent/yPercent
capa: 04-propiedades
tipo: concepto
ambito: CSSPlugin
resumen: Cómo guarda y recompone GSAP las transformaciones, en qué orden fijo, por qué usar x/y/rotation en lugar de transform, y cuándo xPercent. Incluye 3D, force3D y la lectura de CSS.
api: [gsap.CSSProperties.x, gsap.CSSProperties.y, gsap.CSSProperties.z, gsap.CSSProperties.xPercent, gsap.CSSProperties.yPercent, gsap.CSSProperties.scale, gsap.CSSProperties.scaleX, gsap.CSSProperties.scaleY, gsap.CSSProperties.rotation, gsap.CSSProperties.rotationX, gsap.CSSProperties.rotationY, gsap.CSSProperties.skewX, gsap.CSSProperties.skewY]
requiere: [css-plugin]
relacionadas: [css-origin, css-rotacion, css-clearprops, nuc-getproperty, cal-rendimiento]
etiquetas: [css, transform, 3d, rendimiento]
fuentes:
  - docs/v3/GSAP/CorePlugins/CSS.md
estado: verificado
version: 3.15.1
---
# Transformaciones

GSAP no escribe transformaciones sueltas: guarda cada componente por separado y recompone la cadena `transform` entera en cada render. De ahí salen sus ventajas (orden fijo, animar un componente sin perder los demás) y casi todas sus trampas. [C]

## Modelo mental

Cada elemento tiene una caché en `elemento._gsap` con `x`, `y`, `z`, `xPercent`, `yPercent`, `rotation`, `rotationX`, `rotationY`, `skewX`, `skewY`, `scaleX`, `scaleY` y `transformPerspective`. La primera vez, GSAP la rellena leyendo la matriz calculada. Después ya no vuelve a leer el CSS: la caché manda. [C]

### Orden fijo

GSAP siempre genera la cadena en este orden, sea cual sea el orden de `vars`: [C] [E]

```text
perspective(tp)  translate(xP%, yP%)  translate3d(x, y, z)  rotate(r)  rotateY  rotateX  skew(sx, sy)  scale(sx, sy)
```

Solo incluye lo que no es neutro. En CSS las funciones se aplican de derecha a izquierda sobre el elemento, lo que da tres reglas prácticas: [C]

| Regla | Consecuencia |
|---|---|
| `scale` y `rotation` se aplican antes que `x`/`y` | `x: 100` mueve 100 px aunque haya `scale: 2`, y va en horizontal aunque el elemento esté rotado |
| `x` e `y` siguen los ejes del padre | Para mover en la dirección en que "mira" un elemento rotado, calcula el vector con trigonometría |
| `rotation` gira alrededor de `transformOrigin` | El origen no se desplaza con `x`/`y` |

La documentación enumera otro orden (translation, scale, rotationX, rotationY, skew, rotation). El código no lo sigue: lo anterior es lo que se ejecuta. [C] [E]

### Por qué no usar `transform: "..."`

| | `x: 50, rotation: 40` | `transform: "translateX(50px) rotate(40deg)"` |
|---|---|---|
| Coste al iniciar | Asigna cada valor | Aplica la cadena, lee la matriz calculada y la descompone [O] |
| Orden | Fijo y predecible | El que escribas, con resultados que dependen de él [O] |
| Animar un componente | Los demás se conservan | Hay que repetir toda la cadena |
| Relativos y `_short` | Sí | No |
| Función por objetivo | Sí | Sí |
| Se admite | Recomendado | Sí, pero sin orden propio: el resultado se recompone [E] |

Usa `transform` en cadena solo cuando importe un orden no estándar, algo poco común. [O]

### `x`/`y` frente a `xPercent`/`yPercent`

| | `x`, `y` | `xPercent`, `yPercent` |
|---|---|---|
| Valor | Número (px) o cadena con unidad | **Solo número** |
| Referencia de `%` | Tamaño del propio elemento | Tamaño del propio elemento |
| Coexisten | Ocupan un solo hueco: `"50%"` sustituye a los px | Es un `translate()` aparte que **se suma** a `x`, `y` |

Por eso `xPercent` sirve para centrar: `xPercent: -50` centra el elemento sea cual sea su tamaño, y `x` queda libre para animar. Si cambia el tamaño, el centrado sigue siendo correcto, sin recalcular. [O] [E]

### Tabla de propiedades

| GSAP | Equivale a | Nota |
|---|---|---|
| `x`, `y`, `z` | `translate3d()` | También `translateX`, `translateY`, `translateZ` [C] |
| `xPercent`, `yPercent` | `translate(%, %)` | Primer `translate` de la cadena |
| `scale`, `scaleX`, `scaleY` | `scale()` | `scale` da valor a los dos ejes [O] |
| `rotation` | `rotate()` | Alias `rotate`, `rotationZ`, `rotateZ` [C] |
| `rotationX`, `rotationY` | `rotateX()`, `rotateY()` | Alias `rotateX`, `rotateY` [C] |
| `skewX`, `skewY` | `skew()` | **No existe `skew`** (ver Trampas) |
| `transformPerspective` | `perspective()` dentro de `transform` | Solo ese elemento [O] |
| `perspective` | CSS `perspective` | En el contenedor; **no** va en `transform` [E] |
| `transformOrigin`, `svgOrigin`, `smoothOrigin` | | [Origen](css-origin.md) |
| `force3D`, `parseTransform` | | Ver abajo |

## Ejemplo

Orden fijo, independiente de `vars`:

```js
gsap.set(".uno", { scale: 2, rotation: 45, x: 100 });
gsap.set(".dos", { x: 100, rotation: 45, scale: 2 });

const cadena = document.querySelector(".uno").style.transform;

// prueba: cadena.match(/\w+(?=\()/g).join() === "translate,rotate,scale"
// prueba: new DOMMatrix(cadena).toString() === new DOMMatrix("translate(100px, 0px) rotate(45deg) scale(2, 2)").toString()
// prueba: cadena === document.querySelector(".dos").style.transform
```

El orden completo: [E]

```js
gsap.set(".todo", {
  skewY: 5, scale: 2, rotationX: 20, x: 100, transformPerspective: 500, rotationY: 30,
  yPercent: -50, y: 50, skewX: 10, xPercent: -50, rotation: 90, z: 5,
});

const todo = document.querySelector(".todo");
const completa = todo.style.transform;
const patron = todo.cloneNode(); // copia con la cadena a mano: new DOMMatrix() no admite porcentajes
patron.style.transform = "perspective(500px) translate(-50%, -50%) translate3d(100px, 50px, 5px) rotate(90deg) rotateY(30deg) rotateX(20deg) skew(10deg, 5deg) scale(2, 2)";
todo.after(patron);
const iguales = getComputedStyle(todo).transform === getComputedStyle(patron).transform;
patron.remove();

// prueba: completa.match(/\w+(?=\()/g).join() === "perspective,translate,translate3d,rotate,rotateY,rotateX,skew,scale"
// prueba: iguales
```

`x` no se ve afectada por la rotación. Con CSS y el orden inverso, el mismo desplazamiento gira con el elemento: [E]

```html
<div class="con-gsap" style="position:absolute;left:0;top:0;width:80px;height:80px"></div>
<div class="con-css" style="position:absolute;left:0;top:0;width:80px;height:80px;transform:rotate(90deg) translateX(100px)"></div>
```

```js
gsap.set(".con-gsap", { x: 100, rotation: 90 });

const cajaGsap = document.querySelector(".con-gsap").getBoundingClientRect();
const cajaCss = document.querySelector(".con-css").getBoundingClientRect();

// prueba: Math.round(cajaGsap.left) === 100 && Math.round(cajaGsap.top) === 0
// prueba: Math.round(cajaCss.left) === 0 && Math.round(cajaCss.top) === 100
```

Centrar un elemento y seguir animándolo con px:

```html
<div class="escenario" style="position:relative;width:400px;height:200px">
  <div class="modal" style="position:absolute;left:50%;top:50%;width:100px;height:60px"></div>
</div>
```

```js
gsap.set(".modal", { xPercent: -50, yPercent: -50 });
gsap.to(".modal", { y: -20, duration: 0.1 });

await new Promise((r) => setTimeout(r, 300));

const modal = document.querySelector(".modal");
const rect = modal.getBoundingClientRect();
const padre = document.querySelector(".escenario").getBoundingClientRect();

// prueba: modal.style.transform === "translate(-50%, -50%) translate(0px, -20px)"
// prueba: Math.round(rect.left - padre.left + rect.width / 2) === 200
// prueba: Math.round(rect.top - padre.top + rect.height / 2) === 80
```

`x: "50%"` funciona, pero comparte hueco con los px. `xPercent` no. [E]

```html
<div class="muestra" style="width:100px;height:50px"></div>
```

```js
const muestra = document.querySelector(".muestra");

const desplazamiento = () => new DOMMatrix(getComputedStyle(muestra).transform).m41;

gsap.set(muestra, { x: "50%" });
const conPorcentaje = [muestra.style.transform.match(/translate/g).length, muestra.style.transform.includes("50%"), desplazamiento()];
gsap.set(muestra, { x: 20 });
const sustituido = [muestra.style.transform.includes("%"), desplazamiento()];

gsap.set(muestra, { x: 10, xPercent: 50 });

// prueba: conPorcentaje.join() === "1,true,50"
// prueba: sustituido.join() === "false,20"
// prueba: muestra.style.transform.match(/translate/g).length === 2 && muestra.style.transform.includes("50%") && desplazamiento() === 60
```

### 3D y `force3D`

Sin perspectiva, `rotationX` y `rotationY` parecen achatar el elemento. Hay dos formas de dar profundidad: [O]

| Quiere | Usa | Efecto |
|---|---|---|
| Un punto de fuga común a varios | `perspective` en el **contenedor** | Hijos alineados en el mismo espacio |
| Perspectiva propia del elemento | `transformPerspective` en el elemento | Cada uno con su punto de fuga |

Valores típicos de 200 a 1000: cuanto menor, más distorsión. [O]

`force3D` decide si se usa `translate3d()`, que suele crear una capa de composición: [O] [E]

| Valor | Durante el tween | Al terminar |
|---|---|---|
| `"auto"` (defecto) | 3D | Vuelve a 2D para liberar memoria |
| `true` | 3D | Sigue en 3D |
| `false` | 2D, salvo si `z` no es 0 | 2D, salvo si `z` no es 0 |

```html
<div class="capa" style="width:50px;height:50px"></div>
```

```js
const capa = document.querySelector(".capa");
const mover = gsap.to(capa, { x: 100, duration: 1, ease: "none", paused: true });

mover.progress(0.5);
const enCurso = capa.style.transform;
mover.progress(1);
const alFinal = capa.style.transform;

gsap.set(capa, { clearProps: "transform" });
gsap.to(capa, { x: 100, duration: 1, paused: true, force3D: true }).progress(1);
const forzado = capa.style.transform;

// prueba: enCurso === "translate3d(50px, 0px, 0px)"
// prueba: new DOMMatrix(alFinal).m41 === 100 && new DOMMatrix(alFinal).is2D
// prueba: forzado === "translate3d(100px, 0px, 0px)"
```

## Trampas

- **`skew` no existe en GSAP.** Las tablas de la documentación y los tipos lo incluyen, pero `skew: 30` avisa `Invalid property` y no hace nada. Usa `skewX` y `skewY`. [E]

```js
const avisos = [];
const original = console.warn;
console.warn = (...a) => avisos.push(a.join(" "));
gsap.set(".torcida", { skew: 30 });
console.warn = original;
gsap.set(".torcida-bien", { skewX: 30 });

// prueba: avisos[0].includes("Invalid property")
// prueba: new DOMMatrix(document.querySelector(".torcida-bien").style.transform).toString() === new DOMMatrix("skew(30deg, 0deg)").toString()
```

- **`xPercent: "50%"` rompe la cadena sin avisar.** Genera `translate(50%%, ...)`, CSS inválido, y el navegador descarta todo el `transform`. Es un número: `xPercent: 50`. [E]

```js
gsap.set(".mal-pct", { xPercent: "50%" });
gsap.set(".bien-pct", { xPercent: 50 });

// prueba: document.querySelector(".mal-pct").style.transform === ""
// prueba: document.querySelector(".bien-pct").style.transform === "translate(50%, 0%)"
```

- **Los `%` de una hoja de estilos se convierten a px, salvo el centrado.** El navegador solo entrega una matriz. GSAP adivina `-50%` si `x` coincide con la mitad exacta del ancho: lo guarda como `xPercent: -50`. Cualquier otro porcentaje queda fijo en px y deja de seguir al tamaño. [C] [E]

```html
<div class="centrado" style="width:80px;height:80px;transform:translate(-50%,-50%)"></div>
<div class="cuarto" style="width:80px;height:80px;transform:translate(-25%,0)"></div>
```

```js
gsap.set(".centrado", { y: 0 });
gsap.set(".cuarto", { y: 0 });

// prueba: gsap.getProperty(".centrado", "xPercent") === -50
// prueba: gsap.getProperty(".centrado", "x") === 0
// prueba: gsap.getProperty(".cuarto", "xPercent") === 0
// prueba: gsap.getProperty(".cuarto", "x") === -20
```

Define con `gsap.set(el, { xPercent: -25 })` lo que deba seguir siendo proporcional. [P]

- **Las transformaciones independientes de CSS se absorben.** `translate`, `rotate` y `scale` como propiedades sueltas se integran en `transform`, y GSAP escribe en línea `translate: none; rotate: none; scale: none`. Una regla CSS posterior con esas propiedades ya no surte efecto. [C] [E]

```html
<div class="suelta" style="width:80px;height:80px;translate:10px 20px;rotate:45deg;scale:2"></div>
```

```js
gsap.set(".suelta", { x: "+=5" });
const suelta = document.querySelector(".suelta");

// prueba: gsap.getProperty(suelta, "x") === 15
// prueba: gsap.getProperty(suelta, "rotation") === 45
// prueba: suelta.style.translate === "none"
// prueba: gsap.getProperty(suelta, "scaleX") !== 2
```

- **La caché ignora cambios externos.** Si otro código escribe `el.style.transform`, GSAP lo pisa en el siguiente render. Para releer el CSS pasa `parseTransform: true`. [C] [E]

```html
<div class="ajena" style="width:80px;height:80px"></div>
```

```js
const ajena = document.querySelector(".ajena");
gsap.set(ajena, { x: 50 });
ajena.style.transform = "translateX(7px)";
const leido = gsap.getProperty(ajena, "x");

gsap.set(ajena, { y: 1 });
const pisado = ajena.style.transform;

ajena.style.transform = "translateX(7px)";
gsap.set(ajena, { y: 2, parseTransform: true });

// prueba: leido === 50
// prueba: pisado === "translate(50px, 1px)"
// prueba: ajena.style.transform === "translate(7px, 2px)"
```

- **Lo que se lee de una matriz pierde información.** `rotation: 400` escrito por GSAP se conserva en la caché, pero una matriz de CSS solo da el ángulo equivalente, y sus valores pueden traer error de redondeo: `scale: 2` de CSS se lee como `1.99999` combinado con rotación. No compares con `===` valores parseados del CSS. [E]
- **`scale` en `modifiers`:** no se puede modificar; hay que usar `scaleX` y `scaleY`. Ver [modifiers](css-modifiers.md). [O]
- **`gsap.getProperty(el, "scale")` devuelve `scaleX`.** Si los ejes difieren, pide cada uno. [C]
- **`perspective` no entra en la cadena.** `gsap.set(el, { perspective: 500 })` escribe la propiedad CSS, que da profundidad a los **hijos**, no al propio elemento. Solo `transformPerspective` actúa sobre él. [E]

```js
gsap.set(".profunda", { perspective: 500 });
gsap.set(".propia", { transformPerspective: 500, rotationY: 45 });

// prueba: document.querySelector(".profunda").style.perspective === "500px"
// prueba: document.querySelector(".profunda").style.transform === ""
// prueba: document.querySelector(".propia").style.transform === "perspective(500px) rotateY(45deg)"
```

- **La cadena de `transform` depende del motor.** No la compares: ver [depuración](../13-calidad/cal-depuracion.md#trampas). [E]
- **`elemento.style.transform = ""` no limpia la caché.** Usa [clearProps](css-clearprops.md). [C]
- **Calidad de render:** el suavizado depende del navegador, no de GSAP. [O]
