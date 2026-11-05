---
id: fun-instalacion
titulo: Instalar y cargar GSAP
capa: 01-fundamentos
tipo: guia
ambito: transversal
resumen: Las tres vías de carga (empaquetador, script clásico y módulos con import map), qué archivo usar en cada una, SSR y cómo evitar dos copias de GSAP.
api: [gsap.registerPlugin, gsap.install, gsap.version]
relacionadas: [fun-plugins, fun-licencia, fra-agnostico, fra-vanilla, ver-repo-privado]
etiquetas: [instalacion, npm, cdn, bundler, import-map]
fuentes:
  - docs/v3/GSAP.md
  - docs/v3/Plugins.md
  - resources/Plugins.md
  - resources/private-repo-migration.md
estado: verificado
version: 3.15.1
---
# Instalar y cargar GSAP

Núcleo y plugins están en el paquete público `gsap`: no hace falta token, `.npmrc` ni registro privado, y los plugins antes reservados a miembros vienen en el mismo paquete. [O] GSAP funciona con o sin empaquetador, y con cualquier tecnología: lo que decide la vía es cómo llega tu JavaScript al navegador. [P]

## Pasos

Elige una vía. Las tres tienen el mismo rango y dan el mismo GSAP. [E]

| Vía | Cuándo | Archivos | `window.gsap` |
|---|---|---|---|
| Empaquetador | Hay un paso de compilación | Paquete npm, resueltos por `exports` | No, con `import` |
| `<script>` clásico | CMS, plantillas de servidor, HTML sin compilación | `dist/*.min.js` | Sí |
| Módulos nativos con import map | Sin compilación, con `import` en el navegador | Raíz del paquete, `*.js` | No |

### Con empaquetador

```bash
npm install gsap
```

Importa el núcleo y cada plugin por su ruta, y regístralos una vez antes de usarlos. No hace falta ningún paquete adicional por usar un framework: las integraciones son opcionales. [P]

```js
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

gsap.to(".titular", { x: 20, duration: 0.1 });
// prueba: gsap.getProperty(".titular", "x") === 20
// prueba: typeof gsap.plugins.css === "function"
```

### Con `<script>` clásico

Carga `dist/gsap.min.js` y después cada plugin. Cada archivo crea un global, y el resto del código los usa sin `import`. Fija la versión completa; la documentación oficial muestra la rama menor, `gsap@3.15`, pero esa URL cambia sin avisar. [O] [P]

```text
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js" defer></script>
<script src="/js/animacion.js" defer></script>
```

```js fragmento
// animacion.js
gsap.registerPlugin(ScrollTrigger);
gsap.to(".titular", { x: 20, scrollTrigger: ".titular" });
```

`defer` conserva el orden y espera al HTML. Un `<script>` en línea no espera: corre antes que ellos y ahí `gsap` aún no existe; usa un archivo con `defer` o `DOMContentLoaded`. [E] Funciona también abriendo el HTML desde `file://`. [E]

### Con módulos nativos e import map

El navegador no sabe qué es `"gsap"`: el import map se lo dice. Necesita **una entrada para `gsap` y otra por cada plugin** que importes. Apunta a la raíz del paquete, no a `dist/`. [E] Ponlo antes de los módulos. [P]

```text
<script type="importmap">
{
  "imports": {
    "gsap": "https://cdn.jsdelivr.net/npm/gsap@3.15.1/index.js",
    "gsap/ScrollTrigger": "https://cdn.jsdelivr.net/npm/gsap@3.15.1/ScrollTrigger.js",
    "gsap/Flip": "https://cdn.jsdelivr.net/npm/gsap@3.15.1/Flip.js"
  }
}
</script>
<script type="module">
  import gsap from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";
  import { Flip } from "gsap/Flip";

  gsap.registerPlugin(ScrollTrigger, Flip);
</script>
```

Sin más cambios, el mismo código de la vía con empaquetador funciona aquí, porque los especificadores son idénticos. [E]

Las importaciones internas del paquete son relativas (`./Observer.js`, `./utils/matrix.js`), así que no se mapean: el navegador las resuelve junto al archivo que las pide. Para alojar GSAP tú mismo, copia todos los `*.js` de la raíz del paquete y la carpeta `utils/`, conservando la estructura, y usa rutas propias en el mapa. Lo mínimo [C] [E]:

| Archivo | Trae además |
|---|---|
| `index.js` | `gsap-core.js`, `CSSPlugin.js` |
| `ScrollTrigger.js` | `Observer.js` |
| `Flip.js`, `Draggable.js` | `utils/matrix.js` |
| `MotionPathPlugin.js` | `utils/paths.js`, `utils/matrix.js` |
| `CustomEase.js`, `MorphSVGPlugin.js` | `utils/paths.js` |
| `InertiaPlugin.js` | `utils/VelocityTracker.js` |
| `TextPlugin.js`, `ScrambleTextPlugin.js` | `utils/strings.js` |
| `GSDevTools.js` | `Draggable.js`, `utils/matrix.js` |
| `MotionPathHelper.js` | `utils/PathEditor.js`, `utils/paths.js`, `utils/matrix.js` |

Los demás plugins son un solo archivo. Comprobado en Chrome 156, por CDN y con copia local, con los 24 plugins uno a uno. En otros navegadores no se ha ejecutado.

## Qué resuelve cada ruta

Según `exports` de `package.json` [C]:

| Importación | `import` (ESM) | `require` (CJS) |
|---|---|---|
| `gsap` | `index.js` | `dist/gsap.js` (UMD) |
| `gsap/ScrollTrigger` y demás | `ScrollTrigger.js` | `dist/ScrollTrigger.js` |
| `gsap/all` | `all.js`, reexporta todo | `dist/all.js` |
| `gsap/dist/ScrollTrigger` | UMD siempre, ESM y CJS | ídem |
| `gsap/gsap-core` | Núcleo sin CSSPlugin | No hay equivalente en `dist/` |
| Tipos | `types/index.d.ts`, incluidos en el paquete | |

El paquete declara `"sideEffects": false`, de modo que los empaquetadores pueden eliminar lo que no se referencia: por eso importa registrar. [C]

## Verificar qué versión corre

`gsap.version` da la versión cargada, y GSAP guarda en `window.gsapVersions` cada copia que se inicializa. Si ese array tiene más de un elemento, hay dos copias de GSAP en la página. [C]

```js
const copias = window.gsapVersions.length;
// prueba: copias === 1
// prueba: gsap.version === "3.15.1"
```

`gsap.install(objeto)` copia las globales de GSAP (`Power1`, `Linear`, etc.) a un objeto y devuelve `gsap`. Es un resto para entornos sin `window` global: no lo necesitas en proyectos normales. [C] [P]

## Trampas

- **Dos copias de GSAP.** Un plugin registrado en una copia no existe para la otra: se ve como `Invalid property`. Pasa al mezclar CDN y npm, con versiones distintas en dependencias, o al cargar `dist/gsap.min.js` y además mapear `gsap` en un import map: son dos núcleos, y `window.gsapVersions.length` vale 2. [E] Comprueba ese array y deduplica. [C] [P]
- **`gsap is not defined`.** Un script clásico corre antes de cargar GSAP, o la página solo carga GSAP como módulo: los módulos no crean `window.gsap`, y un `<script>` normal no lo ve nunca. [E]
- **`Failed to resolve module specifier "gsap"`.** Falta el import map, o le falta esa entrada: el mensaje nombra el especificador, también `gsap/ScrollTrigger`. [E]
- **Mapa con prefijo `"gsap/"`.** `gsap/ScrollTrigger` se convierte en una URL sin `.js` y da 404. Solo sirve si escribes `.js` en cada `import`, y las plantillas no lo hacen. Con `"gsap/all"` basta una entrada para todos, pero lo descargas todo. [E]
- **`does not provide an export named 'default'`.** Un archivo de `dist/` usado como módulo: no exporta nada. En el mapa, usa los de la raíz. [E]
- **`Cannot use import statement outside a module`.** Un módulo cargado con `<script>` sin `type="module"`. [E]
- **`Unexpected token 'export'`.** Un módulo al que solo se le quitó el `import`. Para plantillas, usa `plantillas/globales/`. [E]
- **Módulos desde `file://`.** El navegador bloquea los módulos locales. Sirve la carpeta por HTTP. Un import map a CDN sí funciona, mientras ningún módulo sea un archivo local. [E]
- **Plugin eliminado por tree shaking.** Solo con empaquetador: importar sin registrar puede dejar el plugin fuera del paquete final. `gsap.registerPlugin()` crea la referencia que lo conserva. [O]
- **Orden de los scripts.** Carga el núcleo primero. [P] Un plugin cargado antes no falla si lo registras cuando ya estén ambos [E], pero con `async` el orden no está garantizado.
- **SSR.** Importar GSAP en servidor no falla: si no hay `window`, los plugins registrados quedan en cola hasta que exista, salvo los marcados `headless`. Pero crear animaciones de DOM debe ocurrir en el cliente. Ver `fra-agnostico`. [C]
- **ESM en entornos que no transpilan `node_modules`.** Si el build de pruebas o SSR falla al importar `gsap/ScrollTrigger`, usa la variante `gsap/dist/ScrollTrigger`, que es UMD. [C] [P]
- **Tokens y `.npmrc` antiguos.** El registro `npm.greensock.com` y los paquetes `gsap-bonus` y `gsap-trial` pertenecen al modelo anterior: retíralos. Ver `ver-repo-privado`. [O]
- **Plugins dependientes.** `ScrollSmoother` requiere ScrollTrigger; `CustomWiggle` y `CustomBounce` requieren CustomEase. Carga y registra ambos. [O]
