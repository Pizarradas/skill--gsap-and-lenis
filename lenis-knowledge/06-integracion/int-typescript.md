---
id: int-typescript
titulo: Tipos de Lenis en TypeScript
capa: 06-integracion
tipo: guia
ambito: transversal
resumen: Qué exporta cada entrada, qué resolución de módulos funciona, LenisRef y LenisExposed, por qué LenisExposed no se puede importar y los globales de window.
api: [LenisRef.wrapper, LenisRef.content, LenisRef.lenis, LenisExposed.wrapper, LenisExposed.content, LenisExposed.lenis, LenisProps.options, funciones.useLenis, Lenis.isScrolling, Lenis.on]
requiere: [int-contrato]
relacionadas: [int-react, int-vue-nuxt, api-eventos]
etiquetas: [typescript, tipos, modulos, tsconfig]
fuentes:
  - packages/react/README.md
  - packages/vue/README.md
estado: verificado
version: 1.3.27
---
# Tipos de Lenis en TypeScript

Lenis publica sus tipos junto al paquete y no necesita `@types`. Solo hay dos cuestiones: qué `moduleResolution` entiende sus `exports` y qué nombres están exportados de verdad. [C]

**Laboratorio del 2026-11-05:** `tsc` 5.9.3 y 7.0.2 sobre tres archivos que usan las cuatro entradas, en modo `strict`, con `@types/react` y Vue 3.5.45.

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| `new Lenis(opciones: LenisOptions)`, o el adaptador tipado de [`int-angular`](int-angular.md) | `lenis.resize()`; `lenis.options` está tipado | `lenis.destroy()` | `colocar(lenis: Lenis)`: ver [`int-navegacion`](int-navegacion.md) | Nada, con `autoRaf`; un reloj externo recibe `(ms: number) => void` |

## Pasos

### 1. Elige una resolución compatible

| `moduleResolution` | `module` | 5.9.3 | 7.0.2 |
|---|---|---|---|
| `bundler` | `esnext` | Correcto | Correcto |
| `nodenext` | `nodenext`, con `package.json` en ESM | Correcto | Correcto |
| `node16` | `node16`, en un proyecto CommonJS | TS1479: el paquete es ESM | TS1479 |
| `node`, es decir `node10` | `commonjs` | TS2307 en `lenis/snap`, `lenis/react`, `lenis/vue` | TS5108: la opción ya no existe |

`node10` no lee `exports`, y el paquete no trae `typesVersions`. La entrada principal sí resuelve, y por eso el fallo parece selectivo. Cambia a `bundler`. [C]

### 2. Importa los tipos de su entrada

| Entrada | Tipos |
|---|---|
| `lenis` | `LenisOptions`, `ScrollToOptions`, `ScrollCallback`, `VirtualScrollCallback`, `VirtualScrollData`, `LenisEvent`, `Scrolling`, `UserData`, `Orientation`, `GestureOrientation`, `EasingFunction`, `FromToOptions`, `OnStartCallback`, `OnUpdateCallback` |
| `lenis/snap` | `SnapOptions`, `SnapItem`, `OnSnapCallback` |
| `lenis/react` | `LenisProps`, `LenisRef`, `LenisContextValue` |
| `lenis/vue` | **Ninguno**: solo valores |

```ts
import Lenis, { type LenisOptions, type ScrollCallback, type ScrollToOptions } from 'lenis'

const opciones: LenisOptions = { lerp: 0.1, autoRaf: true }
const lenis = new Lenis(opciones)
const alMover: ScrollCallback = (instancia) => instancia.scroll.toFixed(0)
const quitar: () => void = lenis.on('scroll', alMover)
const destino: ScrollToOptions = { immediate: true, force: true }
lenis.scrollTo(0, destino)
```

`lenis.on` conoce `'scroll'` y `'virtual-scroll'`, y rechaza otros nombres en compilación. `Dimensions` no se exporta: su tipo se obtiene con `Lenis['dimensions']`. [C]

### 3. Tipa la referencia de cada envoltorio

`LenisRef` y `LenisExposed` tienen los mismos tres miembros, `wrapper`, `content` y `lenis`, con una diferencia: en `LenisRef`, `wrapper` y `content` admiten `null`; en `LenisExposed` son opcionales. `lenis` es opcional en ambos, porque la instancia no existe hasta después del primer pintado. [C]

```tsx
import { useRef } from 'react'
import { ReactLenis, useLenis, type LenisRef, type LenisProps } from 'lenis/react'

export function Scroll(props: LenisProps) {
  const ref = useRef<LenisRef>(null)
  const lenis = useLenis((instancia) => instancia.scroll, [], 1)
  const posicion = lenis?.scroll
  return <ReactLenis root="asChild" ref={ref} options={{ lerp: 1 }} {...props} />
}
```

En Vue, **`LenisExposed` no se puede importar**: existe en `lenis-vue.d.ts`, pero no se exporta. `import type { LenisExposed } from 'lenis/vue'` da TS2614. Obtén el tipo del componente: [C]

```ts
import { ref } from 'vue'
import { VueLenis, useLenis } from 'lenis/vue'

const caja = ref<InstanceType<typeof VueLenis>>()
const lenis = useLenis((instancia) => instancia.scroll, 1)
console.log(caja.value?.lenis, lenis.value?.scroll)
```

### 4. Globales

Importar `lenis` amplía `Window` con `lenisVersion: string` y `lenis: { version?, horizontal?, snap?, touch? }`. Ese `window.lenis` es diagnóstico, **no la instancia**. Si guardas la instancia en `window`, usa otro nombre. Los tipos dicen que `window.lenis` siempre existe, pero solo es cierto después del primer `new Lenis()`: antes es `undefined`. [C]

## Trampas

- **`useLenis()` puede ser `undefined`.** En React devuelve `Lenis | undefined`; en Vue, un `ComputedRef<Lenis | undefined>`. En `strict`, `lenis.scroll` sin `?.` no compila, y hace bien: en el primer render es `undefined` de verdad. [C]
- **`autoRaf` de `LenisProps` está obsoleta.** Compila, pero usa `options.autoRaf`. Si pones las dos, gana `options`. [C]
- **`LenisProps` extiende los atributos de un `div`.** Puedes pasar `id` o `style`. Solo se aplican si se renderiza la envoltura: con `root` a `true`, se ignoran sin error. [C]
- **Métodos privados en JavaScript.** Los `private` de TypeScript son normales al ejecutar. `lenis.reset()` existe, pero no es API pública ni está en los tipos. [C]
