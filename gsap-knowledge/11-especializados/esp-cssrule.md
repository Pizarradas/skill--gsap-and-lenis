---
id: esp-cssrule
titulo: CSSRulePlugin, animar reglas de hojas de estilo
capa: 11-especializados
tipo: plugin
ambito: CSSRulePlugin
resumen: Anima una regla CSS, incluidos ::before y ::after. Obsoleto en favor de variables CSS, pero sigue en el paquete.
api: [CSSRulePlugin, CSSRulePlugin.getRule]
relacionadas: [css-variables, css-plugin]
etiquetas: [css, pseudoelementos, obsoleto]
fuentes:
  - docs/v3/Plugins/CSSRulePlugin.md
  - docs/v3/Plugins/CSSRulePlugin/methods/*
estado: verificado
version: 3.15.1
---
# CSSRulePlugin

**Obsoleto.** Anima directamente una regla de una hoja de estilo, que afecta a todos los elementos que la usan. Hoy lo correcto es animar una variable CSS, y usarla en el pseudoelemento. [O] Consérvalo solo en código heredado.

## Para qué sirve

La razón histórica era animar `::before` y `::after`, a los que no se llega por JavaScript. Alternativas actuales, por orden: una variable CSS (ficha `css-variables`) o un elemento real en lugar del pseudoelemento. [O]

```html
<style>
  :root { --borde: 0px; }
  .tarjeta::before { content: ""; display: block; height: var(--borde); }
</style>
<div class="tarjeta"></div>
```

```js
gsap.to("html", { "--borde": "10px", duration: 0.2 });
const antes = () => getComputedStyle(document.querySelector(".tarjeta"), "::before").height;
await new Promise((r) => setTimeout(r, 400));
const alto = antes();
// prueba: alto === "10px"
```

## Registro

```js fragmento
import gsap from "gsap";
import { CSSRulePlugin } from "gsap/CSSRulePlugin";

gsap.registerPlugin(CSSRulePlugin);
```

**Sin empaquetador:** `<script>` con `dist/CSSRulePlugin.min.js` (global `CSSRulePlugin`), o entrada `gsap/CSSRulePlugin` en el import map. Ver [vías de carga](../01-fundamentos/fun-instalacion.md). [E]

## API

`CSSRulePlugin.getRule(selector)` devuelve la regla, o un array si el selector empieza por pseudoelemento (`"::before"`). [O] Se anima con `cssRule: {}`.

## Ejemplo

```html
<style>
  .aviso::before { content: "x"; color: rgb(255, 0, 0); }
  .aviso { color: rgb(0, 0, 0); }
</style>
<p class="aviso">Texto</p>
```

```js
const regla = CSSRulePlugin.getRule(".aviso::before");
const todas = CSSRulePlugin.getRule("::before");
const ninguna = CSSRulePlugin.getRule(".noexiste");

gsap.to(regla, { duration: 0.2, cssRule: { color: "rgb(0, 0, 255)" } });
await new Promise((r) => setTimeout(r, 400));
const pseudo = getComputedStyle(document.querySelector(".aviso"), "::before").color;
// prueba: pseudo === "rgb(0, 0, 255)"
// prueba: Array.isArray(todas) && todas.length === 1
// prueba: ninguna === undefined
```

## Trampas

- **Envuelve en `cssRule: {}`.** Fuera de ese objeto, la regla no se anima. [O]
- **Anima lo que ya esté en la regla.** No puede calcular el estilo final de varias reglas. Si `color` no está definido en la regla, empieza en `transparent` y hay un salto. [O]
- **Selector exacto.** Debe coincidir con el escrito en la hoja. `getRule` admite `:` o `::`, pero no resuelve equivalencias como `.a.b` frente a `.b.a`. [O] [C]
- **Sin coincidencia devuelve `undefined`,** y el tween avisará por objetivo nulo. Comprueba antes. [E]
- **Media queries y hojas de otro dominio.** Las reglas dentro de `@media` pueden no ser accesibles, y las hojas externas sin CORS se saltan con un aviso. [O] [C]
- **Variables CSS también repintan.** Son la alternativa recomendada, pero no son baratas: úsalas con mesura. [O]
