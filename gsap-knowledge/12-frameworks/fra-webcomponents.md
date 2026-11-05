---
id: fra-webcomponents
titulo: GSAP en Web Components y Lit
capa: 12-frameworks
tipo: guia
ambito: transversal
resumen: Aplicar el contrato en Custom Elements, cuando connectedCallback corre varias veces o sin hijos, Shadow DOM como ámbito y los ganchos de Lit.
api: [gsap.context, gsap.Context.revert]
requiere: [fra-agnostico]
relacionadas: [fra-vanilla, nuc-context]
etiquetas: [web-components, custom-elements, shadow-dom, lit]
fuentes:
  - resources/frameworks.md
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
  - https://lit.dev/docs/components/lifecycle/
estado: verificado
version: 3.15.1
---
# GSAP en Web Components y Lit

Los Custom Elements traen de serie los dos momentos del [contrato](fra-agnostico.md): `connectedCallback` y `disconnectedCallback`. Esta ficha recoge solo lo propio de esta plataforma.

Documentación de MDN y Lit consultada el 2026-11-05. Lit no se ha ejecutado.

| Cambio | Evento | Salida | Flip tras actualizar | Ruta |
|---|---|---|---|---|
| `attributeChangedCallback` y `ctx.add()`; en Lit, `updated()` | `ctx.add()` en el listener, retirado en la limpieza | Anima y llama a `this.remove()` en `onComplete` | `Flip.getState()`, cambio síncrono, `Flip.from()`; en Lit, tras `await this.updateComplete` | `disconnectedCallback` limpia al salir de la página |

## Pasos

### 1. Conecta el contrato

```js
class TarjetaAnimada extends HTMLElement {
  connectedCallback() {
    this.ctx = gsap.context(() => {
      gsap.to(this, { x: 30, duration: 0.2 });
    }, this);
  }
  disconnectedCallback() {
    this.ctx.revert();
  }
}
customElements.define("tarjeta-animada", TarjetaAnimada);

const tarjeta = document.createElement("tarjeta-animada");
tarjeta.style.display = "block";
document.body.appendChild(tarjeta);
await new Promise((r) => setTimeout(r, 300));
const antes = gsap.getProperty(tarjeta, "x");

tarjeta.remove();
const fuera = gsap.getProperty(tarjeta, "x");

document.body.appendChild(tarjeta);   // vuelve a insertarse: se monta otra vez
await new Promise((r) => setTimeout(r, 300));
const denuevo = gsap.getProperty(tarjeta, "x");
// prueba: antes === 30 && fuera === 0 && denuevo === 30
```

### 2. Usa la raíz de sombra como ámbito

`gsap.context` acepta el `shadowRoot`, y los selectores se buscan dentro: un elemento con la misma clase fuera de la sombra no se toca. [E]

```html
<div class="pieza-sombra" id="exterior"></div>
```

```js
class TarjetaSombra extends HTMLElement {
  connectedCallback() {
    const raiz = this.shadowRoot || this.attachShadow({ mode: "open" });
    raiz.innerHTML = '<div class="pieza-sombra" style="width:20px;height:20px"></div>';
    this.ctx = gsap.context(() => {
      gsap.to(".pieza-sombra", { x: 50, duration: 0.05 });
    }, raiz);
  }
  disconnectedCallback() {
    this.ctx.revert();
  }
}
customElements.define("tarjeta-sombra", TarjetaSombra);

const anfitrion = document.createElement("tarjeta-sombra");
document.body.appendChild(anfitrion);
await new Promise((r) => setTimeout(r, 200));
const pieza = anfitrion.shadowRoot.querySelector(".pieza-sombra");
// prueba: gsap.getProperty(pieza, "x") === 50
// prueba: gsap.getProperty("#exterior", "x") === 0
```

### 3. Reacciona a atributos

`observedAttributes` declara qué atributos se vigilan, y `attributeChangedCallback` es el "cambiar" del contrato. Corre también al analizar el atributo inicial, **antes** de `connectedCallback`: el contexto puede no existir aún, de ahí el `?.`. El elemento es `inline` por defecto, y en un `inline` una transformación no mueve nada. Declara `:host { display: block }` o fija `display` a mano. [E]

```js
class MedidorAnimado extends HTMLElement {
  static observedAttributes = ["valor"];

  connectedCallback() {
    this.style.display = "block";
    this.ctx = gsap.context(() => {}, this);
  }
  attributeChangedCallback(nombre, antes, ahora) {
    this.ctx?.add(() => gsap.to(this, { x: Number(ahora), duration: 0.05, overwrite: "auto" }));
  }
  disconnectedCallback() {
    this.ctx.revert();
  }
}
customElements.define("medidor-animado", MedidorAnimado);

const medidor = document.createElement("medidor-animado");
medidor.setAttribute("valor", "10");     // antes de conectar: sin contexto, no anima
document.body.appendChild(medidor);
medidor.setAttribute("valor", "40");
await new Promise((r) => setTimeout(r, 200));
const movido = gsap.getProperty(medidor, "x");
const izquierda = medidor.getBoundingClientRect().left;

class EnLinea extends HTMLElement {}
customElements.define("en-linea", EnLinea);
const suelto = document.createElement("en-linea");
suelto.textContent = "texto";
document.body.prepend(suelto);
const antes = suelto.getBoundingClientRect().left;
gsap.set(suelto, { x: 100 });
const despues = suelto.getBoundingClientRect().left;
// prueba: movido === 40 && izquierda === 40
// prueba: getComputedStyle(suelto).display === "inline" && antes === despues
```

### 4. Contenido con `slot`

Los hijos proyectados por un `<slot>` siguen en el DOM normal: un selector dentro de la raíz de sombra **no** los encuentra. Pásalos por referencia con `assignedElements()`, y usa `slotchange` si pueden cambiar. [E]

```js
class ListaConSlot extends HTMLElement {
  connectedCallback() {
    const sombra = this.shadowRoot || this.attachShadow({ mode: "open" });
    sombra.innerHTML = "<slot></slot>";
    const hueco = sombra.querySelector("slot");
    this.ctx = gsap.context(() => {
      this.porSelector = gsap.utils.toArray(".pasajera").length;
      gsap.to(hueco.assignedElements(), { x: 25, duration: 0.05 });
    }, sombra);
  }
  disconnectedCallback() {
    this.ctx.revert();
  }
}
customElements.define("lista-con-slot", ListaConSlot);

const lista = document.createElement("lista-con-slot");
const pasajera = document.createElement("div");
pasajera.className = "pasajera";
lista.appendChild(pasajera);
document.body.appendChild(lista);
await new Promise((r) => setTimeout(r, 200));
// prueba: lista.porSelector === 0
// prueba: gsap.getProperty(pasajera, "x") === 25
```

### 5. Con Lit

`connectedCallback` llega **antes** del primer render. Usa `firstUpdated`, que corre con el DOM ya actualizado, y `disconnectedCallback` para limpiar. Ninguno de los dos primeros ganchos de actualización corre en servidor. Si el elemento puede reconectarse, vuelve a montar en `connectedCallback` cuando ya se haya renderizado (`hasUpdated`). `updated()` sirve para reaccionar tras cada actualización.

```ts
import { LitElement, html } from "lit";
import gsap from "gsap";

class BarraAnimada extends LitElement {
  static properties = { valor: { type: Number } };
  private ctx?: gsap.Context;

  private montar() {
    this.ctx = gsap.context(() => {
      gsap.from(".relleno", { scaleX: 0, duration: 0.3 });
    }, this.renderRoot as Element);
  }

  firstUpdated() {
    this.montar();
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) this.montar();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.ctx?.revert();
  }

  render() {
    return html`<div class="relleno"></div>`;
  }
}
customElements.define("barra-animada", BarraAnimada);
```

## Trampas

- **`connectedCallback` corre en cada inserción.** También al mover el elemento con `insertBefore`, que dispara desconexión y conexión: la animación se reinicia. `moveBefore()` y `connectedMoveCallback()` evitan ese ciclo, según MDN. [P]
- **Los hijos pueden no existir aún.** Un elemento analizado del HTML se conecta antes que sus hijos si el script ya corrió. Carga el script con `defer`, o define el elemento tras `DOMContentLoaded`. Así lo recoge MDN. [P]
- **Tipo del ámbito en Lit.** `this.renderRoot` es un `ShadowRoot` por defecto. El parámetro `scope` admite `Element | string | object`, así que la conversión del ejemplo es opcional: solo aclara la intención. [C]
- **`attachShadow` dos veces lanza una excepción.** Por eso el ejemplo comprueba `this.shadowRoot`, ya que `connectedCallback` se repite. [E]
- **`adoptedCallback`.** Mover el elemento a otro documento no cambia `window`: GSAP sigue en el documento original. No probado. [P]
