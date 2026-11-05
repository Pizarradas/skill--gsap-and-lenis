# Reportes preparados para los autores de Lenis

**No enviados.** Borradores listos para pegar en https://github.com/darkroomengineering/lenis/issues, en inglés, sobre 1.3.27. Busca antes si ya existen. La reproducción detallada está en la ficha citada. Ordenados por utilidad.

## 1. README: `direction` is inverted

The properties table says `1: scrolling up, -1: scrolling down`. At runtime `direction` is `1` when `scroll` increases (scrolling down). See `api-instancia`.

## 2. README: `duration` and `lerp` precedence is described backwards

The settings table says `duration` is useless if `lerp` is defined and that it defaults to `1.2`. In code `duration` defaults to `undefined`, and when set it wins over `lerp` on every route except touch with `syncTouch`. That also cancels the `lerp` given to `scrollTo` and to Snap. See `opc-suavizado`.

## 3. README (React): the custom rAF loop does not reschedule itself

The "Custom requestAnimationFrame loop" example never reschedules, so `lenis.raf` is called zero times and the page does not move. See `int-react`.

## 4. Package: `vue` peer range is too wide

`peerDependencies` declares `vue >=3.0.0`, but `lenis/vue` imports `onWatcherCleanup`, added in Vue 3.5. With 3.4 the import fails. See `int-vue-nuxt`.

## 5. Package: `lenis.css` is dropped by webpack in production

`sideEffects: false` makes webpack remove `import "lenis/dist/lenis.css"` silently in production builds. Adding the CSS file to `sideEffects` would fix it. See `fun-instalacion`.

## 6. `destroy()` leaves the `transitionend` listener from `autoToggle`

With `autoToggle: true`, the listener is not removed on `destroy()`. See `rec-modal`.

## 7. `autoToggle`: `stop()` followed by `start()` leaves the page stopped

Calling both in the same tick leaves `isStopped: true` and `overflow: clip` inline. See `com-stop-start`.

## 8. Snap: `align: "start"` uses `rect.top` in horizontal mode

Horizontal snapping to element starts does not work. See `snp-elementos`.

## 9. Snap: `destroy()` does not cancel the pending debounce

The snap runs after the instance is destroyed. See `rec-secciones-snap`.

## 10. Snap: positions are offset inside a container

Element measurements include the position of the container on the page, so snap points are shifted. See `snp-elementos`.

## 11. Types: `LenisExposed` is not exported

Importing it gives TS2614. See `int-typescript`.

## 12. README: `isStopped`, `offset` and `time` are misdescribed

`isStopped` is described with the opposite meaning, `offset` has the opposite sign to `scroll-padding-top`, and `time` is the last value passed to `raf()`, not the time since creation. See `api-instancia`, `api-scrollto`.
