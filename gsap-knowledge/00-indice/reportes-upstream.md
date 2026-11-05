# Reportes preparados para los autores de GSAP

**No enviados.** Borradores en inglés sobre 3.15.1, para https://github.com/greensock/GSAP/issues o el foro de GSAP. Busca antes si ya existen. La evidencia está en la ficha citada. El resto de discrepancias de documentación está en [`contradicciones`](contradicciones.md).

## 1. `gsap.context().revert()` depends on the engine: inconsistent comparator

`Context.kill` sorts with `.sort((a, b) => b.g - a.g || -Infinity)`. On ties the comparator always returns `-Infinity`, so it is inconsistent and the result depends on the engine: `[1,2,3,4,5].sort(() => -Infinity)` gives `5,4,3,2,1` in V8 and `1,2,3,4,5` in SpiderMonkey. With three `gsap.set()` of `height` 10, 20 and 30 on an element with `height: 80px`, `ctx.revert()` restores 80px in Chrome and 20px in Firefox. See `nuc-context`.

## 2. ScrollTrigger: `end: "max-=100"` does not work

`_parseClamp` treats any string containing `max` as `clamp(...)`. `"clamp(max-=100)"` works. `end: "max"` with a `trigger` is `"bottom top"` until a global refresh. See `scr-start-end`.

## 3. `Flip.from` in nested contexts: `revert()` leaves `position: absolute`

`Context.kill` looks for `data === "isFlip"` only at its direct level. See `rec-transicion-flip`.

## 4. `Timeline.remove(array)` does nothing

Docs and types accept an array; it is silently ignored. See `tim-gestion`.

## 5. `"<+=50%"` throws, and `"+=50%"` means 50 seconds in some methods

`"<+=50%"` throws `TypeError`, and `"+=50%"` in `addLabel()`, `set()` and `addPause()` is read as seconds. See `tim-posicion`.

## 6. `SplitText.create(selector)` without `vars` throws

The basic usage in the docs fails with a `TypeError` on `overwrite`. See `txt-splittext`.

## 7. `quickSetter` with `scale` silently does nothing

No warning is shown. See `nuc-quicksetter`.

## 8. Weight syntax `"power2.inOut(0.8)"` has no effect

`createConfig` in EasePack never assigns it. See `eas-guia`.

## 9. Types and methods that throw on optional arguments

`Flip.to(state)`, `normalizeStrings()` and `ScrollTrigger#tweenTo(pos)` throw although their types mark the argument as optional; `positionInViewport(el, 20)` throws with a number. See `int-flip-api`, `svg-morphsvg-api`, `scr-instancia`, `scr-estaticos`.

## 10. Docs: `skew`, `defaultSmoothOrigin`, `DirectionalRotationPlugin` and transform order

These are documented but do not exist, and the documented transform order differs from the real one. See `css-transforms`, `css-origin`.
