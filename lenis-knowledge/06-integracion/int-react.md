---
id: int-react
titulo: Lenis en React
capa: 06-integracion
tipo: guia
ambito: react
resumen: Paquete oficial lenis/react: ReactLenis, useLenis, LenisRef, cambio de ruta, opciones que no recrean, GSAP aparte y un bucle del README que no funciona.
api: [LenisProps.root, LenisProps.options, LenisProps.autoRaf, LenisProps.children, LenisProps.className, LenisRef.wrapper, LenisRef.content, LenisRef.lenis, funciones.useLenis, Lenis.scrollTo, Lenis.resize]
requiere: [int-contrato]
relacionadas: [int-nextjs, int-gsap, int-typescript, rec-navegacion]
etiquetas: [react, useLenis, reactlenis, contexto]
fuentes:
  - packages/react/README.md
  - https://react.dev/reference/react/useEffect
  - https://reactrouter.com/api/components/ScrollRestoration
estado: verificado
version: 1.3.27
---
# Lenis en React

`lenis/react` trae `ReactLenis` (también exportado como `Lenis` y por defecto), `useLenis` y `LenisContext`. Hace de [contrato](int-contrato.md): crea la instancia en un efecto y la destruye en su limpieza. Con `autoRaf` por defecto, solo falta unirlo a las rutas.

Documentación consultada el 2026-11-05. **Laboratorio del 2026-11-05:** React 19.3.1, React Router 8.5.1, Vite 8.3, Chrome 156 headless, rueda real, con `StrictMode`, en producción. El escenario común pasó entero, con `autoRaf` y con GSAP: una instancia viva, 1 `raf` por fotograma e instancia, oyentes de `window` iguales tras cinco ciclos, sin avisos ni excepciones.

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| `<ReactLenis root />` | `resize()` si cambia el alto; una opción serializable recrea la instancia, y para evitarlo, `lenis.options` | Automática al retirarlo | Efecto sobre `pathname` con [`colocar`](int-navegacion.md) | Nada, con `autoRaf`, activo por defecto; con GSAP, `gsap.ticker` en un efecto |

**Plantillas.** Las de [`plantillas/`](../plantillas/README.md) funcionan aquí: copia `plantillas/<nombre>.js`, y pásales la instancia como `opciones.lenis`. Si la instancia se recrea, vuelve a llamarlas: ver [ese caso](../plantillas/README.md#se-recrea-la-instancia).

## Pasos

### 1. Elige el modo con `root`

| Uso | Resultado | Instancia |
|---|---|---|
| `<ReactLenis root />`, con o sin hijos | No añade nodos | Ventana, global para `useLenis` |
| `<ReactLenis root="asChild">…</ReactLenis>` | Dos `div` con `wrapper` y `content` | Contenedor, y global |
| `<ReactLenis>…</ReactLenis>` | Dos `div` | Contenedor, solo para sus descendientes |
| `<ReactLenis />`, sin hijos ni `root` | Nada | **Ventana**, no global: `if (!children) return null` llega antes de que existan los nodos |

Laboratorio. `id`, `style` y el resto de atributos, y `className`, van al `wrapper`; con `root` a `true`, se ignoran. La documentación solo cita `options` y `root`: `className` y `children` están en `LenisProps`, y `autoRaf` también, obsoleta. [C]

### 2. Colócalo tras cada ruta

A diferencia de `new Lenis()`, `<ReactLenis>` activa `autoRaf` por defecto: no hay reloj que conectar. Esta forma, con `colocar` en un módulo propio, pasó todo el escenario:

```jsx
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { ReactLenis, useLenis } from 'lenis/react'
import { colocar } from './scroll'

function Reinicio() {
  const { pathname } = useLocation()
  const lenis = useLenis()
  useEffect(() => {
    if (lenis) colocar(lenis)
  }, [pathname, lenis])
  return null
}

export function Scroll() {
  return (
    <>
      <ReactLenis root />
      <Reinicio />
    </>
  )
}
```

`Reinicio` debe ir dentro del enrutador. React Router solo restaura scroll con `<ScrollRestoration>`, que no existe en el modo declarativo de `BrowserRouter`. [O] [C] Sin enrutador, basta `<ReactLenis root />`.

Una plantilla recibe la instancia de `useLenis()`. En laboratorio, la barra siguió funcionando tras salir de la vista y volver:

```jsx
const lenis = useLenis()
useEffect(() => (lenis ? barraProgreso('.barra', { lenis }) : undefined), [lenis])
```

### 3. Un contenedor con su instancia

```jsx
function Caja() {
  return (
    <ReactLenis id="caja">
      <div style={{ height: 2000 }}>contenido</div>
    </ReactLenis>
  )
}
```

`#caja` necesita alto y `overflow: auto` en una hoja de estilo: en línea, `stop()` deja de bloquear el teclado. Ver [`com-stop-start`](../04-comportamiento/com-stop-start.md#ventana-y-contenedor). La rueda sobre la caja la mueve a ella, la ventana se queda quieta, y al salir queda una sola instancia. Laboratorio.

### Con GSAP

Con `autoRaf: false` eres el dueño del reloj. Lo general está en [`int-gsap`](int-gsap.md). Esta forma pasó el escenario, también en la caja, con su propio efecto:

```jsx
import { useEffect, useRef } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function ScrollConGsap() {
  const ref = useRef(null)
  useLenis(ScrollTrigger.update)
  useEffect(() => {
    const paso = (t) => ref.current?.lenis?.raf(t * 1000)
    gsap.ticker.add(paso)
    gsap.ticker.lagSmoothing(0)
    return () => gsap.ticker.remove(paso)
  }, [])
  return <ReactLenis root ref={ref} options={{ autoRaf: false }} />
}
```

Añade `ScrollTrigger.refresh()` tras `colocar`. `ref.current.lenis` se lee **en cada tick**, y por eso esto funciona aunque valga `undefined` en el primer efecto. En laboratorio, sigue `undefined` en ese efecto y en un temporizador inmediato: la instancia llega tras el siguiente render. No captures `const lenis = ref.current.lenis` dentro de un efecto con `[]`.

### 4. Lee Lenis con `useLenis`

| Llamada | Efecto |
|---|---|
| `useLenis()` | Devuelve la instancia, o `undefined` |
| `useLenis(fn)` | `fn(lenis)` en cada `scroll`, **y una vez al suscribirse** |
| `useLenis(fn, [dep])` | Vuelve a suscribir al cambiar `dep` |
| `useLenis(fn, [], 1)` | `priority`: menor corre antes |

Sin contexto, recurre al almacén global que llena `root`, y por eso funciona **por encima** de `<ReactLenis root>`. En laboratorio, las prioridades 5, -1 y 0 corrieron como -1, 0, 5. En el primer render, devuelve `undefined`.

## Trampas

- **El bucle propio del README no funciona.** Su ejemplo llama a `requestAnimationFrame(update)` una vez, y `update` no se vuelve a pedir. Además, en ese momento `lenis` aún no existe: en laboratorio, `raf` se llamó 0 veces, y como `autoRaf` es `false`, la rueda queda cancelada y **la página no se mueve**. Vuelve a pedir el fotograma dentro de `update`. Laboratorio.

```jsx invalido
function update(time) { lenisRef.current?.lenis?.raf(time) }
const rafId = requestAnimationFrame(update) // una sola vez
```

```jsx
useEffect(() => {
  let id = requestAnimationFrame(function update(time) {
    ref.current?.lenis?.raf(time)
    id = requestAnimationFrame(update)
  })
  return () => cancelAnimationFrame(id)
}, [])
```

- **El ejemplo de GSAP del README omite dos líneas.** No llama a `lenis.on("scroll", ScrollTrigger.update)`, y los `scrub` van un fotograma por detrás; tampoco a `lagSmoothing(0)`, que es una decisión tuya: ver [`int-gsap`](int-gsap.md).
- **Las funciones en `options` no recrean nada.** La dependencia del efecto es `JSON.stringify({...options, wrapper: null, content: null})`: las funciones desaparecen. Un `options` en línea no recrea en cada render (0 instancias nuevas en laboratorio), lo que es bueno, pero **cambiar `prevent` o `easing` no tiene efecto**, y queda la primera función. Mete la variable dentro de la función, o cambia también un valor serializable. [C]
- **Cambiar `lerp` recrea la instancia.** La posición se conserva (700 antes y después en laboratorio), pero el `ref` pasa por `undefined`. Lo general, en [`int-contrato`](int-contrato.md). [C]
- **Dos `root`.** Comparten el mismo almacén global, y la raíz HTML. Al retirar una, `useLenis` por encima quedó en `undefined` y `<html>` perdió sus clases, con una instancia viva. Laboratorio.
- **`StrictMode` en desarrollo.** Crea, destruye y crea: en laboratorio, 2 creadas, 1 destruida y 1 viva. No hay fuga, pero tu efecto también corre dos veces: necesita limpieza. [O]
- **Efecto del ticker y `autoRaf`.** Si dejas `autoRaf` por defecto y además añades el ticker, tienes dos relojes: ver [`com-raf`](../04-comportamiento/com-raf.md). Motion es otro reloj externo: ver [`int-contrato`](int-contrato.md).
