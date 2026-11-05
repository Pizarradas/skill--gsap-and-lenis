---
id: ver-migracion
titulo: Migrar a lenis 1.3 desde @studio-freight/lenis y versiones anteriores
capa: 09-versiones
tipo: guia
ambito: transversal
resumen: Paquetes renombrados, opciones retiradas que se ignoran sin avisar, cambios de valores por defecto y pasos para actualizar a 1.3.27.
api: [LenisOptions.smoothWheel, LenisOptions.orientation, LenisOptions.gestureOrientation, LenisOptions.wheelMultiplier, LenisOptions.syncTouch, LenisOptions.eventsTarget, LenisOptions.touchInertiaExponent, LenisOptions.naiveDimensions, Lenis.isScrolling, Lenis.isSmooth, Snap.addElement, SnapOptions.type, SnapOptions.debounce]
requiere: [fun-instalacion]
relacionadas: [ver-historial, ver-v2, int-react, int-vue-nuxt, snp-snap, fun-css]
etiquetas: [migracion, npm, paquetes, versiones]
fuentes:
  - RELEASES.md
  - https://www.npmjs.com/package/@studio-freight/lenis
  - https://www.npmjs.com/package/@studio-freight/react-lenis
estado: verificado
version: 1.3.27
---
# Migrar a lenis 1.3

El paquete cambió de nombre en 2024, y sus opciones lo hicieron por tandas. El peligro no es que algo falle, sino que **no falle**: una opción retirada se ignora sin aviso y la instancia sigue con su valor por defecto.

Estado en npm, comprobado el 2026-11-05 [C]:

| Paquete | Última versión | Estado |
|---|---|---|
| `lenis` | 1.3.27 (`latest`) | Activo. Sin dependencias |
| `@studio-freight/lenis` | 1.0.42 | Obsoleto. El aviso de npm remite a `lenis` |
| `@studio-freight/react-lenis` | 0.0.47 | Obsoleto. El aviso remite a `lenis` |
| `@studio-freight/hamo`, `@darkroom.engineering/hamo` | 0.6.33, 0.6.46 | Obsoletos: ahora `hamo` |
| `@studio-freight/tempus`, `@darkroom.engineering/tempus` | 0.0.44, 0.0.46 | Obsoletos: ahora `tempus` |
| `@darkroom.engineering/lenis`, `react-lenis`, `lenis-react` | — | No existen (404) |

`lenis` también tiene la etiqueta `dev` en 2.0.0-dev.6: ver [v2](ver-v2.md).

## Pasos

### 1. Cambia los paquetes

```bash
npm uninstall @studio-freight/lenis @studio-freight/react-lenis
npm i lenis@1.3.27
```

| Antes | Ahora |
|---|---|
| `import Lenis from "@studio-freight/lenis"` | `import Lenis from "lenis"` |
| `import { ReactLenis, useLenis } from "@studio-freight/react-lenis"` | `import { ReactLenis, useLenis } from "lenis/react"` |
| — | `lenis/snap`, `lenis/vue`, `lenis/nuxt` |
| `https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js` | `https://unpkg.com/lenis@1.3.27/dist/lenis.min.js`; el global sigue siendo `Lenis` |

`lenis` es solo módulo ES: `type: "module"`, sin condición `require` en `exports`. El paquete antiguo incluía `lenis.cjs.js` y `lenis.umd.js` [C]. Si dependías de ellos con `require()`, revisa tu cadena de compilación.

### 2. Importa la hoja de estilos

`import "lenis/dist/lenis.css"` funciona desde 1.1.9 [C]. Antes el README mandaba copiar las reglas. Si las tienes copiadas, sustitúyelas: las de 1.0.42 fijan `overflow: hidden`, exigen `lenis-smooth` en `[data-lenis-prevent]`, desactivan los iframes con `lenis-scrolling` en lugar de `lenis-smooth`, y no tienen las reglas de `autoToggle` [C]. Ver [CSS](../01-fundamentos/fun-css.md).

### 3. Renombra las opciones

| Antes | Ahora | Retirada | Si no la cambias |
|---|---|---|---|
| `smooth` | `smoothWheel` | 1.0.17 | Ignorada: la rueda queda suavizada [C] [E] |
| `direction` | `orientation` | 1.0.17 | Ignorada: queda vertical [C] [E] |
| `gestureDirection` | `gestureOrientation` | 1.0.17 | Ignorada [C] [E] |
| `mouseMultiplier` | `wheelMultiplier` | 1.0.17 | Ignorada [C] [E] |
| `smoothTouch` | `syncTouch` | Entre 1.0.33 y 1.0.34 | Ignorada: el toque queda nativo. No es equivalente: emula el dedo [C] [E] |
| `wheelEventsTarget` | `eventsTarget` | 1.1.10 | Ignorada: escucha en `wrapper` [C] [E] |
| `touchInertiaMultiplier` | `touchInertiaExponent` | 1.3.5 | Ignorada. Otra escala: ver abajo [C] [E] |
| `__experimental__naiveDimensions` | `naiveDimensions` | Sigue aceptándose | Funciona, marcada `@deprecated` [C] |
| `normalizeWheel`, `__iosNoInertiaSyncTouchLerp` | Sin sustituto | Antes de 1.0.42 | Ignoradas [C] |

Hasta 1.0.16 las cuatro primeras daban un `console.warn`. Desde 1.0.17 no hay aviso [C].

```js
const antiguas = {
  smooth: false,
  direction: "horizontal",
  gestureDirection: "both",
  mouseMultiplier: 2,
  smoothTouch: true,
  wheelEventsTarget: document.body,
  touchInertiaMultiplier: 35,
};
const lenis = new Lenis(antiguas);

// prueba: lenis.options.smoothWheel === true
// prueba: lenis.options.orientation === "vertical"
// prueba: lenis.options.wheelMultiplier === 1
// prueba: lenis.options.syncTouch === false
// prueba: lenis.options.eventsTarget === window
// prueba: lenis.options.touchInertiaExponent === 1.7
// prueba: Object.keys(antiguas).every((clave) => !(clave in lenis.options))
```

La inercia cambió de fórmula en 1.3.5: antes `delta = velocity * 35`, ahora `sign(delta) * |velocity| ** 1.7` [C]. No hay conversión directa. Empieza por el valor por defecto y ajusta probando en un dispositivo real.

### 4. Revisa lo que lee estado

```js antiguo
if (lenis.isScrolling === true) { /* nunca entra desde 1.1.0 */ }
```

`isScrolling` vale `false`, `"native"` o `"smooth"` desde 1.1.0, y `isSmooth` indica solo `"smooth"` [C].

```js
const lenis = new Lenis({ autoRaf: true });
rueda(300);
await espera(40);

// prueba: lenis.isScrolling === "smooth" && lenis.isSmooth === true
```

### 5. Actualiza `lenis/snap`

| Antes | Ahora | Desde |
|---|---|---|
| `snap.remove(id)`, `snap.removeElement(id)` | La función que devuelven `add` y `addElement` | 1.3.6 |
| `velocityThreshold` | `debounce` (500 ms) | 1.3.7 |
| `type` por defecto `mandatory` | `proximity`: pon `type: "mandatory"` si contabas con eso | 1.3.8 |
| `distanceThreshold` `100%` | `50%` | 1.3.8 |
| `snap.add(valor, userData)` | `snap.add(valor)` | 1.3.12 |

```js
const lenis = new Lenis();
const snap = new Snap(lenis);

// prueba: snap.options.type === "proximity" && snap.options.debounce === 500
// prueba: snap.options.distanceThreshold === "50%"
// prueba: typeof snap.remove === "undefined" && typeof snap.removeElement === "undefined"
```

### 6. Revisa `lenis/react`

| Antes | Ahora | Desde |
|---|---|---|
| `autoRaf` y `rafPriority` como props, con Tempus | `options.autoRaf`. La prop `autoRaf` sigue, con `true` por defecto, y `rafPriority` desapareció | 1.1.15, 1.1.16 |
| `className` y `style` propios | Pasan por `...props`; `root="asChild"` | 1.3.9 |
| Directiva `use client` a tu cargo | La lleva el propio `lenis-react.mjs` | 1.1.14 |

Sin Tempus, si quieres ordenar el bucle con otros, usa tu reloj con `autoRaf: false`. Ver [React](../06-integracion/int-react.md).

### 7. Comprueba las conductas nuevas

Tres cambios alteran lo que ve el usuario sin tocar tu código, todos en parches:

1. **1.3.26:** con `prefers-reduced-motion`, `scrollTo` salta sin animar y `onComplete` se llama en el mismo paso. Si dependes de la animación, es correcto adaptarse. `respectReducedMotion: false` lo desactiva. [C]
2. **1.3.25:** `scrollTo("#a .b")` falla con `Lenis: Target not found`. Pasa un elemento o un selector que no empiece por `#`. [C] [E: [historial](ver-historial.md)]
3. **1.3.10:** en horizontal, `gestureOrientation` es `"both"`. Si necesitabas `"vertical"`, decláralo. [C]

### 8. Fija la versión

Fija la versión exacta en `package.json` y en las URL de CDN. Como se ve arriba, un parche puede cambiar valores por defecto. [P]

## Trampas

- **No hay aviso.** Lenis no valida las opciones: un nombre antiguo o mal escrito se ignora. Con TypeScript, el tipo `LenisOptions` sí lo detecta en un literal, no en un objeto extendido. [C] [E]
- **`smoothTouch` no es `syncTouch`.** El primero animaba el toque con `lerp`. El segundo sigue el dedo con `lerp: 1` y simula la inercia al soltar. Prueba en iOS antes de activarlo. [C]
- **Dos paquetes a la vez.** Con `@studio-freight/lenis` y `lenis` instalados, dos clases compiten sobre la ventana y duplican listeners. Busca el nombre antiguo en todo el árbol, incluidas dependencias. [P]
- **Un `wrapper: document.body`** cambió en 1.1.19: dejó de ser sinónimo de `window`. Quítalo si querías la ventana. [C]
- **`lenis.css` copiado en 1.0.x** deja `overflow: hidden` en `lenis-stopped`, y `hidden` altera `position: sticky` donde `clip` no lo hace. Reemplázalo. [C] [P]
- **Un `snap.add` con `userData`** se ignora en silencio: `onSnapStart` ya no lo recibe. [C]
- **Tutoriales con `new Lenis({ smooth: true })`** siguen circulando. Funcionan por casualidad: `smoothWheel` ya es `true`. Al pasar `false`, se ve el problema. [P]
