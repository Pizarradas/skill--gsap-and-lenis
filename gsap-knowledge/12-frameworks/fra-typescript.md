---
id: fra-typescript
titulo: GSAP con TypeScript
capa: 12-frameworks
tipo: guia
ambito: transversal
resumen: Qué tipos usar (gsap.TweenVars, gsap.core.Timeline, ScrollTrigger.Vars), cómo resuelve TS los plugins según moduleResolution y qué rompió el renombrado de archivos de 3.15.0.
api: [gsap.TweenVars, gsap.TimelineVars, gsap.Context, gsap.MatchMedia, ScrollTrigger.Vars, gsap.plugins.RawPath]
requiere: [fun-instalacion]
relacionadas: [ver-historial, fra-react-usegsap, fra-nextjs]
etiquetas: [typescript, tipos, moduleResolution]
fuentes:
  - resources/frameworks.md
  - https://github.com/greensock/react
estado: verificado
version: 3.15.1
---
# GSAP con TypeScript

GSAP incluye sus tipos: no hace falta `@types/gsap`. El punto de entrada es `types/index.d.ts` (`"types"` en `package.json`), que carga todos los plugins con `/// <reference path>`. [C]

Los resultados de esta ficha salen de `tsc` 5.9.3 en un sistema de archivos sensible a mayúsculas (Linux), con gsap 3.14.2 y 3.15.1 y `strict: true`, el 2026-11-05. Es un laboratorio externo a `probar_bloques.py`, y los bloques `ts` no se ejecutan.

## Pasos

### 1. Importar

```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
```

### 2. Elegir el tipo

| Quiero tipar | Tipo | Nota |
|---|---|---|
| Tween | `gsap.core.Tween` | Lo devuelven `gsap.to()`, `from()` y `fromTo()` [C] |
| Timeline | `gsap.core.Timeline` | Lo devuelve `gsap.timeline()` [C] |
| Objeto de opciones | `gsap.TweenVars`, `gsap.TimelineVars` | Admite propiedades CSS y de plugins |
| Contexto | `gsap.Context` | Lo devuelve `gsap.context()` |
| matchMedia | `gsap.MatchMedia` | Lo devuelve `gsap.matchMedia()` |
| Opciones de scroll | `ScrollTrigger.Vars` | El espacio de nombres coincide con la clase |
| Instancia de scroll | `ScrollTrigger` | |
| Callback | `gsap.Callback` | Desde 3.15.0 devuelve `any`, antes `void \| null` [C] |
| Ruta cruda | `gsap.plugins.RawPath` | Desde 3.15.1 es una interfaz con `closed` y `totalPoints` [C] |

```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const entrada: gsap.TweenVars = { y: 20, ease: "power1", stagger: 0.1 };
const scroll: ScrollTrigger.Vars = { trigger: ".panel", scrub: true };

const linea: gsap.core.Timeline = gsap.timeline({ scrollTrigger: scroll });
const tween: gsap.core.Tween = gsap.from(".panel", entrada);
const contexto: gsap.Context = gsap.context(() => {});
const consultas: gsap.MatchMedia = gsap.matchMedia();
const disparador: ScrollTrigger = ScrollTrigger.create(scroll);

export { linea, tween, contexto, consultas, disparador };
```

Este bloque compiló sin errores con las tres resoluciones de la tabla siguiente.

### 3. Elegir `moduleResolution`

`exports` declara `"types": "./types/*.d.ts"` para `gsap/*`, de modo que el nombre del archivo debe coincidir con el de la ruta importada. Pero la mayoría de tipos no se llaman así: `gsap/ScrollTrigger` apuntaría a `types/ScrollTrigger.d.ts` y el real es `scroll-trigger.d.ts`. Funcionan porque `index.d.ts` declara además módulos ambientales (`declare module "gsap/ScrollTrigger"`). [C]

Consecuencia: **hace falta que algún archivo del programa importe `"gsap"`**, para que se carguen esas declaraciones.

| Archivo con solo `import … from "gsap/<Plugin>"` | 3.14.2 | 3.15.1 |
|---|---|---|
| `Flip`, con `bundler` o `node16` | TS7016 | Correcto |
| `Draggable`, `Observer`, con `bundler` | sin medir | Correcto |
| `ScrollTrigger`, `SplitText`, `CustomEase`, `ScrollSmoother`, `MorphSVGPlugin`, con `bundler` | sin medir | TS7016 |
| `Flip`, con `moduleResolution: node` | TS7016 | TS7016 |
| Cualquiera, con `import gsap from "gsap"` en el mismo programa | Correcto | Correcto |

Si aparece `TS7016: Could not find a declaration file for module 'gsap/…'`, la corrección es importar `gsap`, cosa que cualquier proyecto real hará al registrar el plugin.

### 4. Tipar elementos en React

```tsx
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function Tarjeta() {
  const raiz = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: raiz });

  const pulsar = contextSafe((e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { rotation: "+=30" });
  });

  return (
    <div ref={raiz}>
      <button onClick={pulsar}>Girar</button>
    </div>
  );
}
```

`contextSafe` conserva la firma de la función envuelta en los tipos de `@gsap/react`: un `f(e, n)` tipado sigue devolviendo su tipo. [C]

## Trampas

- **`useGSAP(fn, null)` no compila.** En ejecución `null` significa "en cada render", pero el tipo admite solo `unknown[] | useGSAPConfig`: da TS2345. Escríbelo como `{ dependencies: null as any }` o, mejor, evita el patrón. [C]
- **La sintaxis `gsap.to(objetivo, 1, vars)` ya no tipa.** Las sobrecargas con duración como segundo argumento desaparecieron de `gsap-core.d.ts` entre 3.13.0 y 3.14.2 (TS2554), aunque en ejecución sigue funcionando. Mueve `duration` a `vars`. Ver [migración](../15-versiones/ver-migracion-v3.md). [C]
- **Rutas directas a `types/`.** `/// <reference path=".../gsap/types/flip.d.ts" />` da TS6053 en Linux desde 3.15.0, porque el archivo pasó a `Flip.d.ts`. Importar `gsap/types/flip` o `gsap/types/Flip` nunca fue válido con `bundler` o `node16` (TS2307): esos `.d.ts` no son módulos. Detalle en [historial](../15-versiones/ver-historial.md). [C]
- **`SplitText.Vars.type` es obligatorio** en los tipos desde 3.13.0, aunque el código tenga valor por defecto `"chars,words,lines"`. Pásalo siempre. [C]
- **`gsap.TweenVars` admite cualquier clave** por su firma de índice. Una errata como `rotaton` compila y solo avisa en ejecución con `Invalid property`. [C]
- **`skipLibCheck`.** Todas las pruebas se hicieron con `skipLibCheck: true`, el valor habitual en plantillas. Sin él no hay garantía. [P]
