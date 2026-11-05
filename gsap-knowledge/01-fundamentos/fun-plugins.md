---
id: fun-plugins
titulo: Plugins - registrar los oficiales y escribir el tuyo
capa: 01-fundamentos
tipo: guia
ambito: transversal
resumen: Mapa de plugins y claves de vars, gsap.registerPlugin y guía para crear un plugin propio con init, render, this.add, kill y soporte de revert.
api: [gsap.registerPlugin, gsap.PluginScope._props, gsap.PluginScope._pt, gsap.PluginScope.add, gsap.PluginScope.name, gsap.PluginScope.init, gsap.PluginScope.kill, gsap.PluginScope.render, gsap.PluginStatic.targetTest, gsap.PluginStatic.get, gsap.PluginStatic.getSetter, gsap.PluginStatic.aliases, gsap.PluginStatic.register, gsap.TweenVars.css, gsap.TweenVars.cssRule, gsap.TweenVars.drawSVG, gsap.TweenVars.easel, gsap.TweenVars.endArray, gsap.TweenVars.attr, gsap.TweenVars.modifiers, gsap.TweenVars.snap, gsap.TweenVars.inertia, gsap.TweenVars.morphSVG, gsap.TweenVars.motionPath, gsap.TweenVars.physics2D, gsap.TweenVars.physicsProps, gsap.TweenVars.pixi, gsap.TweenVars.scrambleText, gsap.TweenVars.scrollTo, gsap.TweenVars.text]
relacionadas: [fun-instalacion, fun-que-es, fun-licencia, nuc-efectos, css-plugin, css-attr, css-modifiers, css-snap, eas-registro]
etiquetas: [plugins, registro, extensibilidad]
fuentes:
  - docs/v3/Plugins.md
  - resources/Plugins.md
  - docs/v3/GSAP/gsap.registerPlugin().md
estado: verificado
version: 3.15.1
---
# Plugins

Un plugin añade capacidades sin engordar el núcleo. Unos enseñan a GSAP una **clave nueva en `vars`** (`drawSVG`, `scrollTo`); otros son **herramientas independientes** con su propia API (`ScrollTrigger`, `Draggable`, `Flip`). [O]

## Pasos

### Usar un plugin oficial

1. Cárgalo (`import` o `<script>`), ver [instalación](fun-instalacion.md).
2. Regístralo una vez, antes de usarlo: `gsap.registerPlugin(ScrollTrigger, TextPlugin)`. Repetir el registro es inocuo. [O]
3. Registra siempre, incluso cuando el archivo se autorregistra: los archivos de `dist/` lo hacen si cargan tras el núcleo, pero en un empaquetador el tree shaking puede eliminarlos. [O]

| Clave en `vars` | Plugin | Incluido en `gsap` | Archivo sin empaquetador | Requiere |
|---|---|---|---|---|
| propiedades CSS, `css` | CSSPlugin | Sí, salvo `gsap/gsap-core` [C] | Dentro de `gsap.min.js` | |
| `attr`, `endArray`, `snap`, `modifiers` | Núcleo | Sí [C] | Dentro de `gsap.min.js` | |
| `cssRule` | CSSRulePlugin | No | `dist/CSSRulePlugin.min.js` |  |
| `drawSVG` | DrawSVGPlugin | No | `dist/DrawSVGPlugin.min.js` |  |
| `morphSVG` | MorphSVGPlugin | No | `dist/MorphSVGPlugin.min.js` |  |
| `motionPath` | MotionPathPlugin | No | `dist/MotionPathPlugin.min.js` |  |
| `scrollTo` | ScrollToPlugin | No | `dist/ScrollToPlugin.min.js` |  |
| `text` | TextPlugin | No | `dist/TextPlugin.min.js` |  |
| `scrambleText` | ScrambleTextPlugin | No | `dist/ScrambleTextPlugin.min.js` |  |
| `inertia` | InertiaPlugin | No | `dist/InertiaPlugin.min.js` |  |
| `physics2D` | Physics2DPlugin | No | `dist/Physics2DPlugin.min.js` |  |
| `physicsProps` | PhysicsPropsPlugin | No | `dist/PhysicsPropsPlugin.min.js` |  |
| `pixi` | PixiPlugin | No | `dist/PixiPlugin.min.js` |  |
| `easel` | EaselPlugin | No | `dist/EaselPlugin.min.js` |  |
| `scrollTrigger` | ScrollTrigger | No | `dist/ScrollTrigger.min.js` |  |
| — | Observer | No | `dist/Observer.min.js` |  |
| — | ScrollSmoother | No | `dist/ScrollSmoother.min.js` | ScrollTrigger |
| — | SplitText | No | `dist/SplitText.min.js` |  |
| — | Flip | No | `dist/Flip.min.js` |  |
| — | Draggable | No | `dist/Draggable.min.js` |  |
| — | CustomEase | No | `dist/CustomEase.min.js` |  |
| — | CustomBounce | No | `dist/CustomBounce.min.js` | CustomEase |
| — | CustomWiggle | No | `dist/CustomWiggle.min.js` | CustomEase |
| — | EasePack | No | `dist/EasePack.min.js` |  |
| — | GSDevTools | No | `dist/GSDevTools.min.js` |  |
| — | MotionPathHelper | No | `dist/MotionPathHelper.min.js` | MotionPathPlugin |

Cada archivo de `dist/` expone un global con el nombre del plugin, y en módulos nativos cada plugin es una entrada `gsap/<Plugin>` que apunta a `<Plugin>.js`. Se han cargado los 24 por ambas vías, uno a uno. `GSDevTools.min.js` lleva Draggable dentro. La columna Requiere se comprobó con `<script>`: sin esa dependencia, `create()` lanza un `TypeError`, en CustomBounce y CustomWiggle tras el aviso `Please gsap.registerPlugin(...)`. [E]

`gsap.plugins` lista los registrados, por nombre. [C]

### Escribir un plugin propio

La documentación oficial no describe esta API; lo siguiente sale de `src/` y de los tipos, y se ha ejecutado. Es un objeto con `name` e `init`, que se registra como cualquier otro. [C] [E]

1. **Elige `name`**: será la clave en `vars`. Si ya existe, el registro se ignora en silencio. [E]
2. **En `init`, crea los interpolados** con `this.add()`. Se llama una vez por objetivo, en la inicialización del tween.
3. **Declara las propiedades en `this._props`**: es lo que permite a `overwrite` encontrarlas.
4. **Omite `render` si solo usas `this.add()`**: el `render` por defecto recorre la lista y aplica.
5. **Registra** con `gsap.registerPlugin()`.

```js
gsap.registerPlugin({
  name: "orbita",
  init(target, valor, tween, index, targets) {
    // this.add(objeto, propiedad, inicio, fin, index, targets)
    this.add(target, "angulo", target.angulo, valor.vueltas * 360, index, targets);
    this.add(target, "radio", target.radio, valor.radio, index, targets);
    this._props.push("angulo", "radio");
  },
});

const luna = { angulo: 0, radio: 10 };
gsap.to(luna, { orbita: { vueltas: 2, radio: 50 }, duration: 0.05 });

// prueba: luna.angulo === 720
// prueba: luna.radio === 50
// prueba: typeof gsap.plugins.orbita === "function"
```

El valor pasa antes por el procesado estándar: funciones por objetivo y `"random()"` llegan ya resueltas, también dentro de un objeto. Con `rawVars: 1` recibes el valor crudo. Si `init` devuelve `false`, el plugin se descarta para ese objetivo. [C] [E]

Si necesitas calcular tú cada frame, define `render(ratio, data)`. `data` es la instancia del plugin, y `ratio` el progreso ya pasado por el `ease`:

```js
gsap.registerPlugin({
  name: "zoomExp",
  init(target, destino) {
    this.objetivo = target;
    this.inicio = Math.log(target.zoom);
    this.cambio = Math.log(destino) - this.inicio;
    this._props.push("zoom");
  },
  render(ratio, data) {
    data.objetivo.zoom = Math.exp(data.inicio + data.cambio * ratio);
  },
});

const camara = { zoom: 1 };
const viaje = gsap.to(camara, { zoomExp: 100, duration: 1, ease: "none", paused: true });
viaje.progress(0.5);

// prueba: Math.abs(camara.zoom - 10) < 1e-6
```

Si el plugin escribe en el DOM, ocúpate de `revert()`: consulta `gsap.core.reverting()` en `render` y restaura el original. Es lo que hace el plugin `attr` del núcleo. Con `this.add()` sobre objetos propios no hace falta, porque volver a `ratio` 0 ya restaura el valor. [C] [E]

```html
<div class="foto" style="filter: grayscale(1)"></div>
```

```js
gsap.registerPlugin({
  name: "desenfoque",
  init(target, px) {
    this.el = target;
    this.original = target.style.filter;
    this.px = px;
    this._props.push("desenfoque");
  },
  render(ratio, data) {
    data.el.style.filter = gsap.core.reverting() ? data.original : `blur(${data.px * ratio}px)`;
  },
});

const foto = document.querySelector(".foto");
const efecto = gsap.to(foto, { desenfoque: 8, duration: 0.05 });
await new Promise((r) => setTimeout(r, 150));
const alFinal = foto.style.filter;
efecto.revert();

// prueba: alFinal === "blur(8px)"
// prueba: foto.style.filter === "grayscale(1)"
```

### API del plugin

Instancia (`gsap.PluginScope`), dentro de `init` y `render` [C]:

| Miembro | Uso |
|---|---|
| `add(objeto, prop, inicio, fin, index, targets, modificador, stringFilter, funcParam, opcional)` | Crea un interpolado. `inicio` admite `"get"` para leer el valor actual. Acepta relativos, números y cadenas |
| `_props` | Nombres que `overwrite` puede matar |
| `_pt` | Primer elemento de la lista enlazada de interpolados |
| `render(ratio, data)` | Por defecto recorre `_pt` |
| `kill(prop)` | Por defecto quita los interpolados de `prop`. Devuelve `true` si ya no queda nada |
| `name`, `init` | Los de la configuración |

Configuración y estáticos (`gsap.PluginStatic`) [C]:

| Clave | Efecto |
|---|---|
| `register(gsap, Plugin, PropTween)` | Se llama una vez al registrar. Sirve para guardar `gsap` sin importarlo [E] |
| `get(target, prop)` | Lo usa `gsap.getProperty()` cuando pides el nombre del plugin [E] |
| `targetTest(target)` | Convierte el plugin en "arnés", como CSSPlugin: para objetivos que devuelvan `true`, `init` recibe **todo** `vars` y procesa cualquier clave [E] |
| `aliases` | Mapa de alias para `overwrite` en arneses, como `{ rotate: "rotation" }` |
| `getSetter` | Setter de los objetivos con arnés; no interviene en un `this.add()` normal [E] |
| `rawVars` | `1` para no preprocesar el valor [E] |
| `headless` | `1` para registrar también sin `window` |
| `priority` | Orden de render: mayor, antes |

## Trampas

- **`Invalid property x set to ... Missing plugin?`** Significa que GSAP no reconoce la clave: plugin sin cargar o sin registrar, nombre mal escrito, o una segunda copia de GSAP. [C]
- **Olvidar `_props`.** El plugin funciona, pero `overwrite` y `tween.kill(null, "prop")` no llegan a sus propiedades. [C]
- **`kill` propio que no quita nada.** Si lo sobrescribes y no eliminas el interpolado, el valor sigue animándose tras un `overwrite`, en conflicto con el tween nuevo. Sobrescríbelo solo si guardas estado aparte. [E]
- **`init` que modifica el DOM.** Se ejecuta en la inicialización, que con `lazy` puede intercalarse con lecturas. Guarda el cálculo y escribe en `render`. [P]
- **Compartir estado entre objetivos.** Cada objetivo tiene su instancia: usa `this`, no variables del módulo. [C]
- **¿Plugin o efecto?** Si solo quieres reutilizar una animación con nombre, `gsap.registerEffect()` es mucho más simple; un plugin compensa cuando necesitas una **clave nueva** en `vars`, combinable con otras. Ver [efectos](../02-nucleo/nuc-efectos.md). [P]
- **Plugins que construyen animación visual.** Un plugin propio es legítimo, pero un editor visual sin código basado en GSAP puede chocar con la [licencia](fun-licencia.md). [O]
