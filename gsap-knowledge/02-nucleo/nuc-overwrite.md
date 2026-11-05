---
id: nuc-overwrite
titulo: overwrite - resolver animaciones en conflicto
capa: 02-nucleo
tipo: concepto
ambito: core
resumen: Qué pasa cuando dos tweens tocan lo mismo y cómo se comportan overwrite true, auto y false, incluidos tweens pausados, retrasados y en timelines.
api: [gsap.TweenVars.overwrite, gsap.TweenVars.onInterrupt]
relacionadas: [nuc-control, nuc-limpieza, nuc-consulta, nuc-quickto, nuc-defaults-config, cal-conflictos]
etiquetas: [overwrite, conflictos]
fuentes:
  - docs/v3/GSAP/Tween/vars.md
  - docs/v3/GSAP/gsap.to().md
estado: verificado
version: 3.15.1
---
# overwrite

Por defecto, dos tweens pueden animar la misma propiedad a la vez: no se conocen, ambos escriben en cada tick y gana el último en renderizar. `overwrite` indica qué hacer con los competidores. [O]

## Modelo mental

| Valor | Cuándo actúa | A quién afecta |
|---|---|---|
| `false` (por defecto) | Nunca | Nadie: conviven [O] |
| `true` | **Al crear** el tween | Todos los tweens de esos objetivos, sea cual sea su propiedad, incluidos pausados, en espera y dentro de timelines [O] [E] |
| `"auto"` | **En el primer render** | Solo las propiedades en conflicto, y solo de tweens **iniciados y no pausados** cuyo tramo incluya este momento [O] [C] [E] |

El efecto sobre el tween desplazado:

- Si conservaba otras propiedades, sigue vivo con esas, y no se dispara `onInterrupt`.
- Si se queda sin propiedades, se destruye: dispara `onInterrupt` y nunca `onComplete`. [C] [E]

## Ejemplo

`"auto"` elimina solo la parte en conflicto:

```js
const q = { x: 0, y: 0 };
const eventos = [];
gsap.to(q, { x: 100, y: 100, duration: 0.15, onInterrupt() { eventos.push("int"); } });
await new Promise((r) => setTimeout(r, 40));
gsap.to(q, { x: -1, duration: 0.02, overwrite: "auto" });

// prueba: q.x === -1
// prueba: q.y === 100
// prueba: eventos.length === 0
```

`true` mata el tween entero, ya desde la creación:

```js
const r = { x: 0, y: 0 };
const eventos = [];
const primero = gsap.to(r, { x: 100, y: 100, duration: 0.2, onInterrupt() { eventos.push("int"); } });
await new Promise((res) => setTimeout(res, 40));
gsap.to(r, { x: 0, duration: 0.02, overwrite: true });
const padre = primero.parent;

// prueba: padre === null
// prueba: eventos.join() === "int"
// prueba: r.y < 100
```

`"auto"` no toca lo que aún no ha empezado; `true`, sí:

```js
const a = { x: 0 };
const retrasado = gsap.to(a, { x: 100, duration: 0.1, delay: 0.1 });
gsap.to(a, { x: -1, duration: 0.02, overwrite: "auto" });

const b = { x: 0 };
const pausado = gsap.to(b, { x: 100, duration: 0.1, paused: true });
gsap.to(b, { x: -1, duration: 0.02, overwrite: true });

// prueba: a.x === 100
// prueba: pausado.parent === null
```

Sin `overwrite`, el resultado depende de cuál acabe el último:

```js
const s = { x: 0 };
gsap.to(s, { x: 100, duration: 0.05 });
gsap.to(s, { x: -100, duration: 0.15 });
// prueba: s.x === -100
```

`overwrite: true` dentro de un timeline borra a sus hermanos:

```js
const t = { a: 0 };
const mal = gsap.timeline();
mal.to(t, { a: 1, duration: 0.05 });
mal.to(t, { a: 2, duration: 0.05, overwrite: true });

const u = { a: 0 };
const bien = gsap.timeline();
bien.to(u, { a: 1, duration: 0.05 });
bien.to(u, { a: 2, duration: 0.05, overwrite: "auto" });

// prueba: mal.getChildren().length === 1
// prueba: bien.getChildren().length === 2
```

## Trampas

- **`overwrite: true` en un timeline.** Mata al tween anterior del mismo objetivo en ese mismo timeline, porque se busca en toda la raíz. Usa `"auto"`. [C] [E]
- **`"auto"` con un tween retrasado que aún no arrancó.** No lo mata: cuando llegue su turno, sobrescribe tu valor. Si cancelas algo programado, usa `gsap.killTweensOf()` o `overwrite: true`. [C] [E]
- **Hover con dos tweens opuestos.** Es el conflicto clásico: al salir antes de terminar, ambos pelean y el elemento parpadea o se queda a medias. Usa un timeline con `play()`/`reverse()`, o `overwrite: "auto"`. [P]
- **`onComplete` que no llega.** Si un tween fue desplazado por completo, no se completa. Escucha `onInterrupt`. [E]
- **Activarlo globalmente.** `gsap.defaults({ overwrite: "auto" })` es cómodo, pero añade un coste en cada inicialización y oculta conflictos reales. Es válido si tu proyecto hace mucho hover; decídelo a propósito. [P]
- **`overwrite` y `quickTo`.** Para seguir el puntero, `gsap.quickTo()` reutiliza un tween y evita el problema. Ver [quickTo](nuc-quickto.md). [P]
- **Plugins.** `overwrite` solo llega a propiedades listadas en `_props`. Ver [plugins](../01-fundamentos/fun-plugins.md). [C]
