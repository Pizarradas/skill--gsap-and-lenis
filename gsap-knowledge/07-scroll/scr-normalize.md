---
id: scr-normalize
titulo: ScrollTrigger.normalizeScroll(), scroll en el hilo de JavaScript
capa: 07-scroll
tipo: api
ambito: ScrollTrigger
resumen: Intercepta rueda y toque para desplazar desde JavaScript. Evita saltos de pin, oculta menos la barra de direcciones móvil y corrige jitter de iOS, a cambio de ser scroll-jacking.
api: [ScrollTrigger.normalizeScroll, ScrollTrigger.NormalizeVars.momentum, ScrollTrigger.NormalizeVars.content, ScrollTrigger.NormalizeVars.allowNestedScroll, ScrollTrigger.ConfigVars.ignoreMobileResize, ScrollTrigger.isTouch]
relacionadas: [scr-pin, scr-refresh, scr-smoother, scr-observer, cal-accesibilidad]
etiquetas: [scroll, movil, ios]
fuentes:
  - docs/v3/Plugins/ScrollTrigger/static.normalizeScroll().md
  - docs/v3/Plugins/ScrollTrigger/static.isTouch.md
  - docs/v3/Plugins/ScrollTrigger/static.config().md
estado: verificado
version: 3.15.1
---
# ScrollTrigger.normalizeScroll()

Por defecto el navegador desplaza la página en otro hilo: puede pintar antes de que JavaScript fije un pin. `normalizeScroll(true)` cancela los eventos de rueda y toque y aplica el desplazamiento desde JavaScript, sincronizado con ScrollTrigger. Es experimental según la documentación y debe activarse a conciencia. [O]

## Firma

```text
ScrollTrigger.normalizeScroll(true | false | NormalizeVars | Observer) → Observer | undefined
ScrollTrigger.normalizeScroll() → Observer actual, o undefined / false
```

| Problema del scroll nativo | Con `normalizeScroll` |
|---|---|
| Pin que salta al entrar o salir en scroll rápido | Actualización sincronizada [O] |
| Barra de direcciones que aparece y redimensiona | No aparece en la mayoría de móviles. **Excepción:** iPhone en vertical [O] |
| Rebote en los extremos en iOS | Eliminado [O] |
| Datos de posición erróneos de iOS Safari (jitter) | Sortea los errores saltándose uno de cada dos `touchmove`, solo en iOS [O] |
| Inercia táctil distinta entre Android e iOS | La gestiona ScrollTrigger [O] |

Por dentro es un [Observer](scr-observer.md) con `id: "normalizer"`, `type: "wheel,touch"`, y `preventDefault` y `allowClicks` a `true`. Acepta opciones de Observer; la mayoría de sus callbacks están ocupados. [O] [C] [E]

| Clave de `NormalizeVars` | Efecto |
|---|---|
| `type` | Añade `"pointer"` para arrastrar la página con el ratón [O] |
| `momentum` | Duración de la inercia al lanzar con el dedo. Número o función que recibe el observer [O] |
| `allowNestedScroll` | Deja que un contenedor interior desplazable se mueva por sí mismo [O] |
| `content` | Elemento de contenido; ScrollSmoother lo pasa para el apaño de iOS [C] |
| `lockAxis` | `false` permite diagonal [O] |

## Ejemplo

```js
const inicial = ScrollTrigger.normalizeScroll();

const n = ScrollTrigger.normalizeScroll(true);
const activo = [n instanceof Observer, n.vars.id, n.vars.type, n.isEnabled, ScrollTrigger.normalizeScroll() === n];

ScrollTrigger.normalizeScroll(false);

const propio = ScrollTrigger.normalizeScroll({
  type: "touch,wheel,pointer",
  allowNestedScroll: true,
  lockAxis: false,
  momentum: (self) => Math.min(3, self.velocityY / 1000),
});

// prueba: inicial === undefined
// prueba: activo.join() === "true,normalizer,wheel,touch,true,true"
// prueba: propio.vars.type === "touch,wheel,pointer"
// prueba: Observer.getById("normalizer") === propio
```

## Solo redimensionar menos: `ignoreMobileResize`

Si tu problema es únicamente el salto al recalcular cuando aparece la barra, no necesitas interceptar el scroll. `ignoreMobileResize` evita el `refresh()` en cambios de alto de menos del 25 % de la pantalla, solo en dispositivos con `ScrollTrigger.isTouch === 1`. [O]

**En el código ya viene activo por defecto en esos dispositivos:** se asigna `_ignoreMobileResize = Observer.isTouch === 1` al iniciar, aunque la documentación lo presenta como una opción a activar. Para que sí refresque, pasa `ScrollTrigger.config({ ignoreMobileResize: false })`. [C]

| `ScrollTrigger.isTouch` | Dispositivo |
|---|---|
| `0` | Solo ratón o puntero |
| `1` | Solo táctil |
| `2` | Ambos |

```js
// prueba: [0, 1, 2].includes(ScrollTrigger.isTouch)
// prueba: ScrollTrigger.isTouch === Observer.isTouch
```

## Trampas

- **Es *scroll-jacking*, aunque suave.** Cancela eventos nativos. No lo pongas por defecto: úsalo si has comprobado que tienes uno de los problemas de la tabla. [O] [P]
- **No evita la barra en iPhone en vertical.** El navegador la impone. Aceptas el redimensionado, y por defecto ya no se refresca salvo pasar el 25 %. [O] [C]
- **Sin barra de scroll visible en móvil.** Algunos navegadores solo la muestran con scroll nativo. Si la necesitas, simúlala con un ScrollTrigger de toda la página y un `<div>`. [O]
- **Gestos.** Con varios dedos o con zoom distinto de 1, cede el control para no estorbar. [O]
- **Modales con scroll interior.** Sin `allowNestedScroll: true` el contenedor interno puede no moverse con la rueda. [O] [P]
- **Con ScrollSmoother** usa su opción `normalizeScroll: true`, que además aplica *debounce*. [O]
- **`normalizeScroll(false)` destruye el observer:** después, `normalizeScroll()` devuelve `false`, no `undefined`. Compara por veracidad, no con `=== undefined`. [C] [E]
- **Prueba en dispositivo real.** Ni el emulador del navegador ni el arnés de esta base reproducen inercia, barra de direcciones o errores de iOS: esta ficha verifica la API, no esos efectos. [P]
