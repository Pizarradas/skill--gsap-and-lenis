---
id: ver-v2
titulo: Lenis v2, plan y prerrelease
capa: 09-versiones
tipo: referencia
ambito: transversal
resumen: V2-ROADMAP.md es un plan. En npm solo hay prereleases 2.0.0-dev con la etiqueta dev, y latest sigue en 1.3.27. No migres producción.
relacionadas: [ver-historial, ver-migracion, opc-referencia]
etiquetas: [versiones, v2, roadmap]
fuentes:
  - V2-ROADMAP.md
estado: verificado
version: 1.3.27
---
# Lenis v2, plan y prerrelease

**No hay ninguna versión 2 estable publicada.** Todo este sistema describe 1.3.27. Esta ficha resume el plan para que no se confunda con lo que ya funciona.

Estado en npm, comprobado el 2026-11-05 [C]:

| Etiqueta | Versión |
|---|---|
| `latest` | 1.3.27 |
| `dev` | 2.0.0-dev.6 (2026-10-29). Existen de dev.0 a dev.6, desde 2026-08-22 |
| `framer` | 1.3.25-framer |

`npm i lenis` instala 1.3.27. Una 2.0.0-dev solo llega si se pide `lenis@dev`, o la versión exacta. No hay `2.0.0`.

Hay dos fuentes distintas, y **no coinciden**: el plan (`V2-ROADMAP.md`, en el repositorio) y la prerrelease (lo publicado en npm). Ninguna es definitiva.

## Qué propone el plan

El giro: de configurar lo que se necesita a que `new Lenis()` funcione solo, sin CSS que recordar, y desactivar lo que sobre. [O]

| Propuesta | v1 | Plan |
|---|---|---|
| Valores por defecto | Desactivados | `true`: `autoRaf`, `autoToggle`, `anchors`, `allowNestedScroll`, `stopInertiaOnNavigate`, `naiveDimensions` |
| Opciones agrupadas | Planas | `wheel: { smooth, lerp, multiplier }`, `touch: { smooth, lerp, multiplier, inertia }` |
| `syncTouch` | | `touch.smooth` |
| `syncTouchLerp`, `touchMultiplier`, `touchInertiaExponent` | | `touch.lerp`, `touch.multiplier`, `touch.inertia` |
| `smoothWheel`, `wheelMultiplier`, `lerp` | | `wheel.smooth`, `wheel.multiplier`, `wheel.lerp` |
| `virtualScroll`, `prevent` | | `onGesture` u otro nombre, por decidir |
| `naiveDimensions` | | `dimensions`: `read` u `observe` |
| `isScrolling` | | `isWheelScrolling`, `isTouchScrolling`, `isProgrammaticScrolling` |
| CSS | Importar `lenis.css` | Inyección automática |
| Nuevo | | Pull to refresh con `touch.smooth`, avisos en desarrollo, scroll en dos ejes, más ejemplos |
| `lenis/react` | | Retirar `root`, usar `useSyncExternalStore` |
| `lenis/snap` | | Retirar `type` |
| Revisión | | Si sigue haciendo falta integrar con ScrollTrigger |
| Migración | | Guía "TBD" |

## Qué trae 2.0.0-dev.6

Leído de sus tipos y su README, sin ejecutar. Es un corte de desarrollo, y puede cambiar. [C]

| Tema | Plan | dev.6 |
|---|---|---|
| `wheel`, `touch` | Sí | Sí, y con `duration`, `easing` e `ios` en `touch` |
| `autoRaf`, `anchors`, `stopInertiaOnNavigate` por defecto | `true` | `true` |
| `allowNestedScroll` | `true` | Sustituida por `nested: { mode }` (`native`, `smooth`, `none`) |
| `autoToggle` | `true` | No existe como opción |
| `naiveDimensions` | `dimensions` | `dimensions: { mode, autoResize, debounce }` |
| `virtualScroll`, `prevent` | `onGesture` | `onGesture`, y evento `gesture` en lugar de `virtual-scroll` |
| `isScrolling` | Tres propiedades nuevas | Se mantiene, y se añaden `isWheel`, `isTouch`, `isDrag` |
| Dos ejes | Sí | `orientation: "both"`, `lenis.x`, `lenis.y` |
| Inyección de CSS | Sí | No: `lenis.mjs` no crea hojas, y `dist/lenis.css` sigue |
| `snap.type` | Retirar | Sustituido por `lock` y `mode`; `onSnapStart` da paso a eventos |

Y lo que el plan no menciona:

- `stop()` y `start()` pasan a `lock()` y `unlock()`.
- `limit` pasa a `maxScroll`, y `animatedScroll` a `rawScroll`.
- `scrollTo()` devuelve una promesa.
- `drag`, para desplazar arrastrando con el ratón.
- `programmatic`, con la animación por defecto de `scrollTo`.
- Paquetes `lenis/sync` y `lenis/snap/react`.

## Qué hacer ahora

- **Usa 1.3.27 en producción.** Una etiqueta `dev` no da garantías, y entre dev.0 y dev.6 han pasado apenas dos meses. [P]
- **No escribas código para v2 con esta tabla.** Si quieres probar, instala la versión exacta y lee su propio README, nunca este sistema. [P]
- **Prepárate sin coste:** declara explícitamente `autoRaf`, `anchors` y los demás valores que dependen del actual. Un proyecto que los escribe no cambia cuando cambian los valores por defecto. [P]
- **Al salir v2,** esta ficha y [migración](ver-migracion.md) deben rehacerse contra lo publicado, no contra el plan. [P]

## Trampas

- **`npm i lenis@dev`** instala una prerrelease que rompe la API. Con `lenis` o `lenis@latest` no pasa. No existe etiqueta `next`. [C]
- **Copiar `wheel: { lerp }` en 1.3.27** no da error: Lenis ignora esa clave y sigue con `lerp: 0.1`. [C]
- **Un rango `^1.3.27` no alcanza 2.0.0.** Tampoco un rango abierto `>=1.3.27` incluye prereleases, salvo que el rango los nombre. [P]
- **`autoRaf` cambia de sentido por versión.** Código que llama a `lenis.raf()` y confía en el valor por defecto duplicaría el bucle en v2 si sale como en dev.6. Ya en 1.3.27, combinar ambos multiplica bucles: ver [canvas](../08-recetas/rec-canvas-sync.md). [C]
