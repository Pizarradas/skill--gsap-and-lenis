---
id: int-nextjs
titulo: Lenis en Next.js
capa: 06-integracion
tipo: guia
ambito: react
resumen: App Router: ReactLenis ya es de cliente, funciones en options desde el servidor, reinicio de scroll con usePathname, y por qué Link no basta en plena inercia.
api: [LenisProps.root, LenisProps.options, funciones.useLenis, Lenis.scrollTo, Lenis.resize, ScrollToOptions.immediate]
requiere: [int-contrato]
relacionadas: [int-react, int-gsap, rec-navegacion]
etiquetas: [next, app-router, servidor, hidratacion]
fuentes:
  - packages/react/README.md
  - https://nextjs.org/docs/app/api-reference/directives/use-client
  - https://nextjs.org/docs/app/api-reference/components/link
estado: verificado
version: 1.3.27
---
# Lenis en Next.js

Next.js usa el paquete `lenis/react`. Esta ficha cubre lo propio del servidor y de su enrutador; el [contrato](int-contrato.md) no cambia, y `ReactLenis`, `useLenis` y sus trampas están en [`int-react`](int-react.md).

Documentación consultada el 2026-11-05. **Laboratorio del 2026-11-05:** Next 16.4.5 con App Router y Turbopack, `next build` y `next start`, React 19.3.1, Chrome 156 headless, rueda real. El escenario común pasó entero, con `autoRaf` y con GSAP. Pages Router no se ejecutó.

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| `<ReactLenis root />` en el layout raíz, dentro de un archivo `'use client'` | `resize()` si cambia el alto; una opción serializable recrea la instancia | Automática | Efecto con `usePathname` y [`colocar`](int-navegacion.md) | Nada, con `autoRaf`; con GSAP, como en [`int-react`](int-react.md) |

El layout raíz persiste al navegar: es [lo que sobrevive](int-contrato.md), y en laboratorio se creó 1 instancia en toda la navegación raíz.

**Plantillas.** Las de [`plantillas/`](../plantillas/README.md) funcionan aquí: copia `plantillas/<nombre>.js`, y pásales la instancia como `opciones.lenis`. Si la instancia se recrea, vuelve a llamarlas: ver [ese caso](../plantillas/README.md#se-recrea-la-instancia).

## Pasos

### 1. Crea un archivo de cliente

`lenis-react.mjs` empieza por `"use client"`: puedes usar `<ReactLenis>` desde un Server Component sin envoltura. Pero el reinicio necesita un efecto, y por tanto un archivo propio. [C]

```jsx
// app/scroll.jsx
'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ReactLenis, useLenis } from 'lenis/react'
import { colocar } from './colocar'

function Reinicio() {
  const ruta = usePathname()
  const lenis = useLenis()
  useEffect(() => {
    if (lenis) colocar(lenis)
  }, [ruta, lenis])
  return null
}

export default function Scroll() {
  return <><ReactLenis root /><Reinicio /></>
}
```

Con GSAP, añade a este archivo lo de [`int-react`](int-react.md#con-gsap) y `ScrollTrigger.refresh()` tras `colocar`: esa forma también pasó el escenario.

### 2. Colócalo en el layout

```jsx
// app/layout.jsx: sigue siendo un Server Component
import 'lenis/dist/lenis.css'
import Scroll from './scroll'

export default function Layout({ children }) {
  return (
    <html lang="es">
      <body>
        <Scroll />
        {children}
      </body>
    </html>
  )
}
```

Lo prerrenderizado siguió siendo estático (`○`), y el HTML llega sin Lenis: nada se mueve hasta hidratar. Ver [rueda anterior a la entrada](int-contrato.md#trampas). [C]

### 3. Conoce el scroll del enrutador

`<Link>` no siempre sube: conserva la posición si la página sigue visible, y si no, va a su primer elemento. Con `scroll={false}` no hace nada. [O] En laboratorio, con el reinicio retirado, fue a 0 en reposo, y **en plena inercia quedó en 200**: Next escribió el scroll y Lenis lo pisó. Next lo escribe **antes** del efecto: `colocar` lo encontró en 0, justo el caso en el que `resize()` seguido de `scrollTo` no corta nada, y quedó en 200. Ver [`int-navegacion`](int-navegacion.md). Si quieres conservar la posición con `scroll={false}`, salta el `scrollTo` para esa ruta.

`lenis.resize()` es necesario porque, sin él, `limit` conservó el valor de la vista anterior (3805 contra 200) a los 30 ms.

## Trampas

- **Funciones en `options` desde el servidor.** `<ReactLenis options={{ easing: (t) => t }} />` en un Server Component rompe `next build`: `Functions cannot be passed directly to Client Components`, al prerrenderizar. Compilar no lo detecta: `✓ Compiled` aparece antes. Pon esas opciones en un archivo de cliente. Laboratorio. [O]
- **`lenis.css` en el servidor.** Impórtalo desde el layout. Importarlo en Node puro falla, pero el compilador de Next lo resuelve. [C]
- **`useLenis` en un Server Component.** Es un hook: solo en archivos de cliente. [O]
- **`loading.js`.** Es una [vista provisional](int-navegacion.md#trampas): `usePathname` cambia antes de que llegue el contenido final. Sin ejecutar. [P]
- **Layout anidado.** Un contenedor con `<ReactLenis>` en un layout anidado [persiste entre rutas](int-navegacion.md#trampas). Sin ejecutar. [P]
