---
id: rec-contador
titulo: Contador numérico animado
capa: 14-recetas
tipo: patron
ambito: core
resumen: Cuenta hasta una cifra con un objeto proxy y formato local con Intl.NumberFormat, al entrar en el viewport y sin perder el texto.
api: [gsap.to, gsap.TweenVars.onUpdate, ScrollTrigger.Vars.once, gsap.TweenVars.snap]
relacionadas: [css-snap, nuc-callbacks, rec-helpers, cal-accesibilidad, rec-revelar-scroll]
etiquetas: [numero, texto, scroll, plantilla]
fuentes:
  - docs/v3/HelperFunctions/helpers/formatNumber.md
  - docs/v3/GSAP/gsap.to().md
estado: verificado
version: 3.15.1
---
# Contador numérico animado

Una cifra sube hasta su valor final, formateada según el idioma. Plantilla: `plantillas/contador.js`. [E]

## Problema

GSAP interpola números, y un elemento del DOM contiene texto. Hay que animar un valor numérico aparte y escribirlo con formato en cada frame, sin dejar decimales falsos, y sin que el HTML inicial pierda la cifra para quien no ejecuta JS.

## Solución

Tween sobre un objeto proxy y escritura en `onUpdate`. El formato queda en manos de `Intl.NumberFormat`, creado una sola vez porque construirlo es caro. [O] [E]

```html
<p><span class="cifra">12.500,5</span></p>
```

```js
const cifra = document.querySelector(".cifra");
const formato = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const valor = { n: 0 };

gsap.to(valor, {
  n: 12500.5,
  duration: 0.2,
  ease: "power1.out",
  onUpdate: () => {
    cifra.textContent = formato.format(valor.n);
  },
});
await new Promise((r) => setTimeout(r, 320));
// prueba: cifra.textContent === "12.500,5"
```

La agrupación depende del idioma: `es-ES` no separa con cuatro cifras. `useGrouping: "always"` lo fuerza. [E]

```js
const normal = new Intl.NumberFormat("es-ES").format(1234);
const forzado = new Intl.NumberFormat("es-ES", { useGrouping: "always" }).format(1234);
// prueba: normal === "1234" && forzado === "1.234"
```

Con `scrollTrigger: { trigger: cifra, start: "top 85%", once: true }` espera al viewport. La cifra final debe estar en el HTML: es lo que ven los buscadores y quien tenga JS desactivado. [P]

## Parámetros ajustables

| Opción | Por defecto | Efecto |
|---|---|---|
| `hasta` | `data-hasta` del elemento | Valor final |
| `desde` | `0` | Valor inicial |
| `decimales` | `0` | Fija mínimo y máximo de decimales |
| `idioma` | el del navegador | Etiqueta BCP 47 |
| `formato` | `Intl.NumberFormat` | Función propia, por ejemplo para añadir `" %"` |
| `duracion` / `ease` | `1.5` / `"power1.out"` | Curva de la cuenta |
| `alEntrar` / `inicio` | `true` / `"top 85%"` | Disparo por scroll |

## Variante con prefers-reduced-motion

Escribe el valor final sin animar ni crear disparadores. La cuenta no aporta información. [P] [E]

```js
window.matchMedia = (q) => ({ matches: /: reduce\)/.test(q), addListener() {}, removeListener() {} });
const dato = document.querySelector(".dato");
const mm = gsap.matchMedia();
mm.add({ normal: "(prefers-reduced-motion: no-preference)", reducido: "(prefers-reduced-motion: reduce)" }, (c) => {
  const fin = 2048;
  if (c.conditions.reducido) dato.textContent = fin.toLocaleString("es-ES");
});
// prueba: dato.textContent === "2048"
```

## Limpieza

`limpiar()` mata tween y disparador, y restaura el texto que había. [E]

```js fragmento
const limpiar = contador(raiz.querySelectorAll("[data-hasta]"), { idioma: "es-ES", decimales: 1 });
limpiar();
```

## Datos que cambian

La plantilla anima hacia un valor fijado al llamarla. Si el dato cambia, limpia y vuelve a llamar, con `desde` igual al valor anterior para que no salte a cero. [E]

```js fragmento
let limpiar = contador(cifra, { hasta: 100, alEntrar: false });

function actualizar(anterior, nuevo) {
  limpiar();
  limpiar = contador(cifra, { desde: anterior, hasta: nuevo, alEntrar: false });
}
```

## Trampas

- **`es-ES` no agrupa con cuatro cifras.** `1234` se formatea `"1234"`, y `12500` como `"12.500"`: es la regla de ese idioma, con `minimumGroupingDigits` 2. Si quieres separador siempre, pasa `useGrouping: "always"` en un `formato` propio. [E]
- **El ancho baila.** Las cifras proporcionales mueven el texto en cada frame. Usa `font-variant-numeric: tabular-nums`. [P]
- **Crear el formateador en `onUpdate`.** Sesenta instancias por segundo. Créalo una vez. [P]
- **`aria-live` en el contador.** El lector anunciaría cada valor intermedio. Evítalo; el texto final ya es accesible. [P]
- **Helper `formatNumber`.** Fija `en-US` y trunca decimales en vez de redondear. Para otros idiomas, `Intl`. Ver [rec-helpers](rec-helpers.md). [C]
- **`textContent` destruye hijos.** La plantilla restaura el texto, no el marcado. Envuelve la cifra en su propio `span`, sin unidades ni iconos dentro. [P]
