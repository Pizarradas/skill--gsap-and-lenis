---
id: int-webcomponents
titulo: Lenis en Web Components y Lit
capa: 06-integracion
tipo: guia
ambito: transversal
resumen: Custom Elements como contrato nativo: connectedCallback sin hijos, mover el nodo, Shadow DOM y scrollTo, y los ganchos de Lit.
api: [LenisOptions.wrapper, LenisOptions.content, LenisOptions.anchors, Lenis.destroy, Lenis.scrollTo]
requiere: [int-contrato]
relacionadas: [int-vanilla, opc-contenedores, com-anclas]
etiquetas: [web-components, custom-elements, shadow-dom, lit]
fuentes:
  - README.md
  - https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
  - https://lit.dev/docs/components/lifecycle/
estado: verificado
version: 1.3.27
---
# Lenis en Web Components y Lit

Los Custom Elements traen de serie los momentos del [contrato](int-contrato.md): `connectedCallback` y `disconnectedCallback`. Esta ficha recoge solo lo propio de la plataforma. Un elemento con scroll propio es un contenedor: el elemento es la `raiz` del adaptador.

Documentación de MDN y Lit consultada el 2026-11-05. Laboratorio del mismo día: Chrome 156 headless, rueda real, Lit 3.3.3.

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| `connectedCallback`, con hijos; en Lit, `firstUpdated` | `resize()` si cambia el alto; `attributeChangedCallback` y `lenis.options` para las opciones | `disconnectedCallback` | La del sitio, con [`colocar`](int-navegacion.md); el elemento sale solo si lo retiran | Nada, con `autoRaf`; si otro bucle manda, `entrar({ raiz, reloj })` |

**Plantillas.** Las de [`plantillas/`](../plantillas/README.md) funcionan aquí: copia `plantillas/<nombre>.js`, y pásales la instancia como `opciones.lenis`. Si la instancia se recrea, vuelve a llamarlas: ver [ese caso](../plantillas/README.md#se-recrea-la-instancia). Dentro de una sombra, pasa elementos y no selectores, y mira [`plantillas`](../plantillas/README.md).

## Pasos

### 1. Conecta el contrato

Con el adaptador de [`int-contrato`](int-contrato.md), resumido aquí. La forma del elemento va en una hoja:

```html
<style>caja-suave { display: block; height: 200px; overflow: auto; }</style>
```

```js
function entrar({ raiz }) {
  const content = raiz.shadowRoot?.firstElementChild ?? raiz.firstElementChild;
  const lenis = new Lenis({ wrapper: raiz, content, autoRaf: true });
  return { lenis, salir: () => lenis.destroy() };
}
class CajaSuave extends HTMLElement {
  connectedCallback() {
    if (!this.firstElementChild) return;
    this.vista = entrar({ raiz: this });
  }
  disconnectedCallback() {
    this.vista?.salir();
    this.vista = undefined;
  }
}
customElements.define("caja-suave", CajaSuave);

const caja = document.createElement("caja-suave");
caja.innerHTML = '<div style="height:1000px"></div>';
document.body.prepend(caja);

rueda(300, caja);
await espera(500);
const movida = caja.scrollTop;
caja.remove();
const salio = caja.vista === undefined;
document.body.prepend(caja);
const volvio = caja.vista?.lenis instanceof Lenis;
caja.remove();
// prueba: movida > 250 && salio === true && volvio === true
```

### 2. Cuenta con que se conecte sin hijos

Si el elemento se define antes de analizar su HTML, `connectedCallback` corre al abrir la etiqueta: los hijos aún no existen. En laboratorio, con el script en `<head>`, llegó sin hijos y sin instancia. `content: null` no toma el valor por defecto: `ResizeObserver.observe(null)` lanza. Comprueba, como arriba, y define el elemento después del HTML, con `defer` o `type="module"`. [C]

### 3. Mover es salir y entrar

Mover el nodo dispara `disconnectedCallback` y `connectedCallback`, en ese orden: la instancia vieja se destruye y nace otra. Al moverlo, el navegador reinicia su `scrollTop`: en Lit, 299 pasó a 0, y la nueva instancia lo adoptó. Laboratorio.

### 4. Shadow DOM

Con un `content` dentro del `shadowRoot`, Lenis funciona: la rueda atraviesa la sombra por `composedPath()`. [C] Lo que no atraviesa la sombra es la búsqueda por texto. `scrollTo("#id")` usa `document.getElementById`, y `anchors` también: dentro de la sombra, avisa `Lenis: Target not found`. Pasa el elemento. [E]

```html
<style>.anfitrion { display: block; height: 200px; overflow: auto; }</style>
```

```js
const anfitrion = document.createElement("div");
anfitrion.className = "anfitrion";
const sombra = anfitrion.attachShadow({ mode: "open" });
sombra.innerHTML = '<div class="dentro" style="height:1500px"><p class="meta" style="margin:800px 0 0">m</p></div>';
document.body.prepend(anfitrion);

const lenis = new Lenis({ wrapper: anfitrion, content: sombra.querySelector("." + "dentro"), autoRaf: true });
const buscado = document.querySelector("p.me" + "ta");  // fuera de la sombra, no existe
lenis.scrollTo(sombra.querySelector("p"), { immediate: true });
const y = anfitrion.scrollTop;
lenis.destroy();
anfitrion.remove();
// prueba: buscado === null && y === 800
```

Los **eventos** de `data-lenis-prevent` funcionan en la sombra por el mismo `composedPath()`, si está abierta. Con `mode: "closed"`, `composedPath()` se corta en el anfitrión: sin ejecutar. [C] Su **CSS** no: ver Trampas.

### 5. Lit

`connectedCallback` llega **antes** del primer render: en laboratorio, el contenido aún no existía. Crea en `firstUpdated`, y recrea en `connectedCallback` si ya se había renderizado. Sale en `disconnectedCallback`. [O]

```js fragmento
class CajaLit extends LitElement {
  static styles = css`:host { display: block; height: 300px; overflow: auto }`;
  render() { return html`<div id="i">${contenido}</div>`; }
  conectar() {
    this.vista = entrar({ raiz: this, content: this.renderRoot.querySelector("#i") });
  }
  firstUpdated() { this.conectar(); }
  connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) this.conectar();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.vista?.salir();
  }
}
```

Pasó entrar, rueda, mover y volver a usarse. El orden observado fue `connected`, `firstUpdated`, `disconnected`, `connected`.

## Trampas

- **La ventana no es tuya.** Un elemento puede vivir varias veces en una página. Si quiere gobernar la ventana, crea una instancia por página y [compártela](int-contrato.md), no una por elemento: dos instancias en la misma raíz [se pisan](int-contrato.md#trampas).
- **`lenis.css` y la sombra.** Lenis escribe sus clases en el `wrapper`, y `lenis.css` no atraviesa una sombra. Con `wrapper` dentro del `shadowRoot`, adopta la hoja o copia las reglas. Con el anfitrión como `wrapper`, las reglas sobre el propio anfitrión sí aplican, pero `.lenis [data-lenis-prevent]` **no entra** en la sombra: `overscroll-behavior` queda en `auto`, y la rueda encadena (laboratorio). Dentro hace falta `:host(.lenis) [data-lenis-prevent]`. [`iniciarScroll`](../plantillas/README.md) adopta todo eso si `wrapper` o `content` están en una sombra. Si usas `:host` en una hoja de sombra, recuerda lo de [`stop()` en un contenedor](../04-comportamiento/com-stop-start.md#ventana-y-contenedor). [C]
- **Limpieza que no llega.** Si un script borra un ancestro con `innerHTML`, `disconnectedCallback` sí se llama. Si recreas todo el documento sin desconectar nodos, no. [P]
