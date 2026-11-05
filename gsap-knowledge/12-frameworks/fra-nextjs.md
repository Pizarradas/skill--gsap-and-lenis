---
id: fra-nextjs
titulo: GSAP en Next.js (SSR, "use client" y registro de plugins)
capa: 12-frameworks
tipo: guia
ambito: transversal
resumen: Qué se ejecuta en servidor y qué no, dónde registrar plugins y por qué un tween en el módulo rompe la build. Comprobado con una build real de Next 16.4.5.
api: [gsap.registerPlugin, gsap.context, gsap.set]
requiere: [fra-agnostico, fra-react-usegsap]
relacionadas: [cal-fouc, fra-typescript, fun-instalacion, cal-st-errores]
etiquetas: [nextjs, ssr, react, use-client, app-router]
fuentes:
  - resources/React.md
  - https://github.com/greensock/gsap-skills
  - https://nextjs.org/docs/app/api-reference/directives/use-client
estado: verificado
version: 3.15.1
---
# GSAP en Next.js

Lo que ocurre sin `window` está en el [contrato común](fra-agnostico.md). Aquí va lo propio de Next. Next renderiza en servidor, y GSAP anima el DOM: toda animación debe arrancar en el navegador. El hook `useGSAP` ya lo garantiza, siempre que el archivo sea un componente de cliente y no haya código de animación fuera del hook. [O]

| Cambio | Evento | Salida | Flip tras actualizar | Ruta |
|---|---|---|---|---|
| `useGSAP(fn, { dependencies: [x], scope })` con `overwrite: "auto"` | `contextSafe(fn)` | Aplaza el `setState` a `onComplete` | Guarda `Flip.getState()` en el estado y anima en `useGSAP` | Anima y llama a `router.push()` en `onComplete`. Con layouts que persisten, `ScrollTrigger.refresh()` al cambiar `usePathname()` |

Salida, Flip y ruta no se ejecutaron en Next: siguen lo probado en React. Ver [fra-react-usegsap](fra-react-usegsap.md).

**Comprobado el 2026-11-05** con build y `next start` reales: Next 16.4.5 (Turbopack, por defecto), React 19.3.1, gsap 3.15.1 y `@gsap/react` 2.1.2, en App Router y Pages Router. Es un laboratorio externo al arnés. Otras versiones de Next no se han probado. La directiva está descrita en la documentación de Next (actualizada el 2026-10-05).

## Pasos

### 1. Instala

```bash
npm install gsap @gsap/react
```

### 2. Crea un componente de cliente

```jsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Portada() {
  const raiz = useRef(null);

  useGSAP(() => {
    gsap.from(".titulo", { y: 40, autoAlpha: 0 });
    gsap.to(".fondo", {
      yPercent: 20,
      ease: "none",
      scrollTrigger: { trigger: raiz.current, scrub: true },
    });
  }, { scope: raiz });

  return (
    <section ref={raiz}>
      <div className="fondo" />
      <h1 className="titulo">Hola</h1>
    </section>
  );
}
```

`"use client"` va en la primera línea, antes de los imports, y afecta a todo el módulo.

### 3. Úsalo desde un componente de servidor

La página puede seguir en servidor. Solo necesita la directiva el archivo que usa hooks.

```jsx
import Portada from "../components/Portada";

export default function Page() {
  return (
    <main>
      <Portada />
    </main>
  );
}
```

## Qué se ejecuta en cada sitio

`"use client"` **no** significa "solo en el navegador". El módulo también se evalúa en servidor para generar el HTML inicial. En la build de prueba, un `console.log` en el ámbito del módulo se imprimió con `typeof document === "undefined"`.

| Código | En servidor | Resultado en la build |
|---|---|---|
| `import gsap from "gsap"` y plugins | Se evalúa | Correcto |
| `gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, Draggable, ScrollSmoother, Observer)` en el módulo | Se evalúa | Correcto |
| Cuerpo de `useGSAP(fn)` | No corre: es un efecto | Correcto |
| `gsap.to(".x", …)` en el módulo o en el render | Se evalúa | **Falla el prerender** |
| `useRef` o `useGSAP` sin `"use client"` | — | **Falla la compilación** |

El registro es seguro porque, sin `window`, `_createPlugin` guarda el plugin en una cola y lo procesa al inicializar en el navegador. No hace falta envolverlo en `if (typeof window !== "undefined")`. [C]

También funciona importar `gsap/ScrollTrigger` en la ruta normal: los antiguos `gsap/dist/...` no fueron necesarios en esta configuración.

### Errores reales y su causa

```text
You're importing a module that depends on `useRef` into a React Server Component module.
This API is only available in Client Components.
```

Falta `"use client"` en ese archivo.

```text
Error occurred prerendering page "/ruta".
TypeError: Cannot read properties of undefined (reading 'querySelectorAll')
```

Un tween con selector se creó durante la evaluación del módulo. GSAP busca el selector en un `document` que no existe. Muévelo a `useGSAP`.

## Flash de contenido

En la prueba, el HTML llegó como `<h1 class="titulo">Hola</h1>`, y el estado oculto de `from()` solo apareció tras hidratar. El caso general está en [hidratación](fra-agnostico.md) y [cal-fouc](../13-calidad/cal-fouc.md).

## Pages Router

Una página con `getServerSideProps`, con `gsap.registerPlugin` en el módulo y `useGSAP` en el componente, compiló y sirvió el HTML correctamente sin directiva, porque ahí todo son componentes de cliente. Las mismas reglas de "nada de tweens en el módulo" se aplican.

## Trampas

- **Directiva debajo de un import.** Debe ser lo primero del archivo o no cuenta. Eso dice la documentación de Next.
- **Layouts persistentes.** Son el caso de [vistas que persisten](fra-agnostico.md). Aquí, el efecto depende de `usePathname`. [P] Sin verificar en laboratorio.
- **Una función de servidor no cruza la frontera.** No puedes pasar un callback desde un componente de servidor a uno `"use client"`, porque las props deben ser serializables. Pasa datos y deja la animación en el cliente. Eso dice la documentación de Next.
- **Registro centralizado.** Si varios componentes usan los mismos plugins, un `lib/gsap.js` con `"use client"` que registra y reexporta evita repetir. Registrar varias veces no causa daño. [P]
- **`ScrollSmoother` y `layout`.** Necesita `#smooth-wrapper` y `#smooth-content` envolviendo el contenido. Si los pones en un layout, el contenido de la página entra como `children` en un componente de cliente, lo que es válido. [P] Sin verificar en laboratorio.
