---
id: fra-react-usegsap
titulo: useGSAP en React
capa: 12-frameworks
tipo: api
ambito: transversal
resumen: El hook de @gsap/react, sus opciones (scope, dependencies, revertOnUpdate), contextSafe y su comportamiento real leído del código 2.1.2 y probado con React 19.
api: [gsap.context, gsap.Context.add, gsap.Context.revert, gsap.registerPlugin]
requiere: [fra-agnostico]
relacionadas: [fra-react-avanzado, fra-nextjs, nuc-context, nuc-quickto]
etiquetas: [react, hook, limpieza, usegsap]
fuentes:
  - resources/React.md
  - resources/react-basics.md
  - https://github.com/greensock/react
  - https://github.com/greensock/gsap-skills
estado: verificado
version: 3.15.1
---
# useGSAP en React

Traducción del [contrato común](fra-agnostico.md) a React. `useGSAP()`, del paquete `@gsap/react`, sustituye a `useEffect`/`useLayoutEffect` para animar: envuelve tu función en un `gsap.context()` y lo revierte al desmontar. Es la forma recomendada de usar GSAP en React. [O]

| Cambio | Evento | Salida | Flip tras actualizar | Ruta |
|---|---|---|---|---|
| `useGSAP(fn, { dependencies: [x], scope })` con `overwrite: "auto"` | `contextSafe(fn)` | Aplaza el `setState` a `onComplete`: React no retiene nodos | Guarda `Flip.getState()` en el estado y anima en `useGSAP` con ese estado como dependencia | Anima y navega en `onComplete`: React no da un gancho de salida. Sin ejecutar |

Detalle de salida y Flip en [patrones avanzados](fra-react-avanzado.md); patrón general en [rec-salida](../14-recetas/rec-salida.md).

Versión leída: `@gsap/react` 2.1.2, que pide `gsap ^3.12.5` y `react >=17`. Comprobada además en un laboratorio externo al arnés (React 19.3.1, StrictMode, Chrome 156, 2026-11-05): los bloques `jsx` no se ejecutan, así que lo que dice "laboratorio" no es `[E]`.

## Firma

```text
useGSAP(funcion?, dependenciasOConfig?) → { context, contextSafe }
useGSAP(config) → { context, contextSafe }
funcion(context, contextSafe) → limpieza?
```

```bash
npm install gsap @gsap/react
```

```jsx
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function Banda() {
  const raiz = useRef(null);

  useGSAP(() => {
    gsap.from(".pieza", { y: 30, autoAlpha: 0, stagger: 0.1 });
  }, { scope: raiz });

  return (
    <div ref={raiz}>
      <div className="pieza" />
      <div className="pieza" />
    </div>
  );
}
```

| Opción | Tipo | Defecto | Efecto |
|---|---|---|---|
| `dependencies` | `unknown[]` | `[]` | Se pasa tal cual al efecto interno [C] |
| `scope` | ref, `Element` o selector | sin ámbito | Selectores limitados a los descendientes [C] |
| `revertOnUpdate` | `boolean` | `false` | Revierte y ejecuta la limpieza en cada cambio de dependencias [C] |

La segunda forma acepta un array o un objeto. Un objeto en primer lugar es config sin función, útil cuando solo quieres `contextSafe`. Registrar el hook con `registerPlugin` evita desajustes si hay dos copias de GSAP: guarda la instancia que recibe. [O] [C]

## Qué hace por dentro

- Usa `useLayoutEffect` si existe `document`, y `useEffect` si no. Por eso es seguro en SSR, siempre que el componente sea de cliente. [C]
- Crea el contexto en la fase de render y lo reutiliza con `useRef`. [C]
- `contextSafe` equivale a `context.add(null, fn)`: devuelve una función que, al ejecutarse, activa el contexto. [C]

Con StrictMode el efecto corre dos veces con un `revert()` entre medias: es el [doble arranque](../02-nucleo/nuc-immediate-render.md) que el contrato exige soportar. En laboratorio, un `useEffect` sin limpieza con `from({opacity: 0})` en StrictMode quedó en opacidad 0.45, y `useGSAP` llegó a 1.

## Cuándo se ejecuta y cuándo se limpia

| Segundo argumento | Ejecuta | Revierte y limpia |
|---|---|---|
| Nada o `[]` | Al montar | Al desmontar [C] |
| `[x]` | Al montar y al cambiar `x` | **Solo al desmontar** [O] |
| `{ dependencies: [x], revertOnUpdate: true }` | Al montar y al cambiar `x` | En cada cambio y al desmontar [O] |
| `null` | En cada render | **En cada render** [C] |

La fila `[x]` engaña: la función de limpieza que devuelves tampoco corre en cada cambio, y todas se acumulan hasta el desmontaje. En laboratorio, con `x` de 1 a 2, la traza fue `run1, run2` y al desmontar `clean1, clean2`. Con `revertOnUpdate` fue `run1, clean1, run2`.

El efecto visual también difiere: sin revertir, el segundo tween parte del valor actual (100 → 200). Revirtiendo, parte del estado original (0 → 200).

## contextSafe

Lo creado **después** de que corra tu función, en un clic o un `setTimeout`, no se registra: no se revierte ni usa `scope`. [O]

```jsx
function Interruptor() {
  const raiz = useRef(null);
  const { contextSafe } = useGSAP({ scope: raiz });

  const girar = contextSafe(() => {
    gsap.to(".icono", { rotation: "+=180" }); // con ámbito y con limpieza
  });

  return (
    <div ref={raiz}>
      <button onClick={girar}><span className="icono">→</span></button>
    </div>
  );
}
```

Con listeners manuales usa el segundo argumento de la función y retíralos en la limpieza:

```jsx
useGSAP((context, contextSafe) => {
  const boton = botonRef.current;
  const girar = contextSafe(() => gsap.to(boton, { rotation: "+=90" }));

  boton.addEventListener("click", girar);
  return () => boton.removeEventListener("click", girar);
}, { scope: raiz });
```

En laboratorio, tras desmontar, un tween creado en `onClick` sin `contextSafe` siguió animando el nodo; con `contextSafe` quedó revertido en `x: 0`.

## Ejemplo

Propiedad que dispara la animación, con scope por config:

```jsx
function Barra({ valor }) {
  const raiz = useRef(null);

  useGSAP(() => {
    gsap.to(".relleno", { scaleX: valor / 100, duration: 0.4, overwrite: "auto" });
  }, { dependencies: [valor], scope: raiz });

  return (
    <div ref={raiz} className="pista">
      <div className="relleno" />
    </div>
  );
}
```

Para eventos de muy alta frecuencia, crea [`quickTo`](../02-nucleo/nuc-quickto.md) una vez dentro del hook, guárdalo en un ref y llámalo desde un manejador. [O]

### Refs o selectores con ámbito

| Situación | Usa |
|---|---|
| Varios elementos dentro del componente | `scope` + selector |
| Hay componentes hijos con las mismas clases | Ref: ver [ámbito y vistas anidadas](../02-nucleo/nuc-context.md) [O] |
| Variantes por props | Atributo `data-*` y selector `[data-animar='x']` [O] |
| Elemento fuera del árbol, como un portal | Ref [P] |

## Trampas

- **`contextSafe` no anula la función tras desmontar.** La skill oficial dice que queda como no-op, pero el código no comprueba nada: se ejecuta y el contexto reabre, como explica [nuc-context](../02-nucleo/nuc-context.md). Con `scope`, el selector ya no encuentra nada, porque `ref.current` es `null`, y GSAP avisa `Invalid scope`. Comprueba tú mismo si el componente sigue montado en callbacks tardíos. [C]
- **No cambies `revertOnUpdate` ni la longitud de `dependencies` entre renders.** El hook llama a un efecto de forma condicional (`deferCleanup && useLayoutEffect(...)`), así que el número de hooks varía. React lanza `Rendered fewer hooks than expected` (laboratorio). Decide el valor de forma constante. [C]
- **`dependencies: []` y `revertOnUpdate: true` no se combinan con nada útil:** sin dependencias el efecto solo corre al montar. [C]
- **`async` en la función.** Lo creado tras un `await` queda fuera del contexto, y al devolver una promesa no hay limpieza. Usa `contextSafe` en la continuación. [C]
- **`{ scope: ref }` y `null` en el primer render.** El hook resuelve `ref.current` al ejecutar el efecto, no al declararlo, así que un ref de un nodo presente en el commit es válido. Si el nodo se monta después por una condición, añade esa condición a `dependencies`. [C]
- **Crear el timeline fuera del hook** lo recrea en cada render. Guárdalo en un ref desde dentro. [O]
- **Registro repetido:** `registerPlugin` en el cuerpo del componente no rompe nada, pero se repite en cada render. Ponlo en el ámbito del módulo. [P]
- **`null` en TypeScript** no compila. Ver [TypeScript](fra-typescript.md). [C]
