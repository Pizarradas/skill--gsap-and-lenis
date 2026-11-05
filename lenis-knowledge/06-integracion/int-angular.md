---
id: int-angular
titulo: Lenis en Angular
capa: 06-integracion
tipo: guia
ambito: transversal
resumen: Sin paquete oficial: adaptador entrar con afterNextRender y DestroyRef, directiva para contenedores, NavigationEnd, zone.js y detección de cambios por fotograma.
api: [Lenis.destroy, Lenis.scrollTo, Lenis.resize, Lenis.raf, Lenis.on, LenisOptions.autoRaf, LenisOptions.wrapper, LenisOptions.content]
requiere: [int-contrato]
relacionadas: [int-gsap, int-typescript, rec-navegacion]
etiquetas: [angular, afternextrender, destroyref, directiva, zone]
fuentes:
  - README.md
  - https://angular.dev/api/core/afterNextRender
  - https://angular.dev/api/router/withInMemoryScrolling
  - https://angular.dev/guide/zoneless
estado: verificado
version: 1.3.27
---
# Lenis en Angular

**No hay paquete oficial.** `lenis` solo publica entradas para React, Vue y Nuxt. No hace falta más: `afterNextRender` y `DestroyRef` son los dos momentos del [contrato](int-contrato.md). La integración es el adaptador de `int-contrato` dentro de un componente raíz y una directiva. [C]

Documentación consultada el 2026-11-05. **Laboratorio del 2026-11-05:** Angular 22.2.4 con CLI 22.2.6, sin zone.js, `ng build` de producción, Chrome 156 headless, rueda real. El escenario común pasó entero, con `autoRaf` y con GSAP. SSR no se ejecutó: es lo único de la tabla que sale solo de la documentación.

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| `afterNextRender` en el componente raíz | `resize()` si cambia el alto; `lenis.options`, o salir y entrar | `inject(DestroyRef).onDestroy()` | `NavigationEnd` con [`colocar`](int-navegacion.md) | Nada, con `autoRaf`; con GSAP, `entrar({ reloj: relojGsap })` |

**Plantillas.** Las de [`plantillas/`](../plantillas/README.md) funcionan aquí: copia `plantillas/<nombre>.js`, y pásales la instancia como `opciones.lenis`. Si la instancia se recrea, vuelve a llamarlas: ver [ese caso](../plantillas/README.md#se-recrea-la-instancia).

## Pasos

### 1. Copia el adaptador

Módulo normal, sin Angular: [`entrar`](int-contrato.md) y [`colocar`](int-navegacion.md), con tipos. Sin ellos, `raiz = window` se infiere como `Window` y una directiva no compila. Añade el CSS en `styles` de `angular.json`: `"node_modules/lenis/dist/lenis.css"`.

```ts
// scroll.ts
import Lenis, { type LenisOptions } from 'lenis'

type Reloj = (paso: (ms: number) => void, lenis: Lenis) => () => void
interface Entrada { raiz?: Window | HTMLElement; content?: HTMLElement; opciones?: LenisOptions; reloj?: Reloj }

export function entrar({ raiz = window, content, opciones = {}, reloj }: Entrada = {}) {
  const propio = raiz instanceof Window ? {} : {
    wrapper: raiz,
    content: content ?? (raiz.shadowRoot?.firstElementChild ?? raiz.firstElementChild) as HTMLElement,
  }
  const lenis = new Lenis({ ...propio, ...opciones, autoRaf: !reloj })
  const quitarReloj = reloj?.((ms) => lenis.raf(ms), lenis)
  let activo = true
  return {
    lenis,
    salir() {
      if (!activo) return
      activo = false
      quitarReloj?.()
      lenis.destroy()
    },
  }
}

export function colocar(lenis: Lenis, destino = 0) {
  const salto = { immediate: true, force: true }
  lenis.scrollTo(lenis.targetScroll ? 0 : 1, salto)
  lenis.resize()
  lenis.scrollTo(destino, salto)
}
```

### 2. Conéctalo en el componente raíz

```ts
import { Component, DestroyRef, afterNextRender, inject } from '@angular/core'
import { NavigationEnd, Router, RouterOutlet } from '@angular/router'
import { filter } from 'rxjs'
import { entrar, colocar } from './scroll'

@Component({ imports: [RouterOutlet], selector: 'app-root', template: `<router-outlet />` })
export class App {
  constructor() {
    let vista: ReturnType<typeof entrar> | undefined
    const destruir = inject(DestroyRef)

    afterNextRender(() => { vista = entrar() })
    destruir.onDestroy(() => vista?.salir())

    const sub = inject(Router).events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        if (vista) queueMicrotask(() => colocar(vista!.lenis))
      })
    destruir.onDestroy(() => sub.unsubscribe())
  }
}
```

`afterNextRender` corre una vez, tras renderizar, y **nunca en servidor**, y por eso `new Lenis()` está a salvo. No garantiza que la hidratación haya terminado. [O] `queueMicrotask` da tiempo a que la nueva vista se inserte: con la app probada, `limit` ya era el correcto a los 60 ms.

### 3. Un contenedor con su instancia

```ts
import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core'
import { entrar } from './scroll'

@Directive({ selector: '[lenisContenedor]' })
export class LenisContenedor {
  constructor() {
    const raiz = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement
    let vista: { salir(): void } | undefined
    afterNextRender(() => { vista = entrar({ raiz }) })
    inject(DestroyRef).onDestroy(() => vista?.salir())
  }
}
```

En una plantilla: `<div id="caja" lenisContenedor><div>…</div></div>`, con alto y `overflow: auto` en la hoja de estilo. En línea, `stop()` no bloquearía el teclado: ver [`com-stop-start`](../04-comportamiento/com-stop-start.md#ventana-y-contenedor).

### 4. Scroll del enrutador

`withInMemoryScrolling` configura la posición; **el valor por defecto de `scrollPositionRestoration` es `disabled`**: lo fija el código de `@angular/router` 22.2.4, y la página de `withInMemoryScrolling` no lo indica. [C] En laboratorio, una vista corta quedó en 0 sin configurar nada, pero fue un accidente: la vista saliente se retira antes de insertar la nueva, y el documento encoge. Con un `min-height` de 6000 en `body`, la posición se quedó en 1500.

Con `scrollPositionRestoration: 'top'` tampoco basta: como cualquier `window.scrollTo`, Lenis lo pisa en plena inercia (200 en la prueba sin reinicio). Deja el bloque de `NavigationEnd`. Si usas `'enabled'` para restaurar al volver atrás, salta `colocar` en esas navegaciones. Sin ejecutar. [P]

### 5. Con GSAP

Pasa [`relojGsap`](int-gsap.md#el-reloj-para-el-adaptador): `entrar({ reloj: relojGsap })`, también en la directiva, y añade `ScrollTrigger.refresh()` tras `colocar`, dentro del mismo `queueMicrotask`. Pasó el escenario.

## Trampas

- **`zone.js` y la detección de cambios.** Sin zone.js, predeterminado desde v21 [O], `requestAnimationFrame` no dispara nada: 0 ciclos por segundo en laboratorio. Con zone.js, `new Lenis({ autoRaf: true })` dentro de la zona dispara un ciclo por fotograma: 61 por segundo en reposo y 176 con rueda, en el componente raíz. Fuera, con `NgZone.runOutsideAngular`, 0.
- **`afterNextRender` ya corre fuera de la zona.** En laboratorio, `NgZone.isInAngularZone()` dio `false`, y por eso crear ahí la instancia no dispara ciclos. El riesgo es crearla en el constructor o en `ngOnInit`, donde además fallaría en servidor. La API no lo documenta: es un comportamiento observado, no una promesa.
- **`gsap.ticker` y la zona.** Su `requestAnimationFrame` se programa al importar `gsap`, fuera de la zona, y un `gsap.ticker.add` posterior no cambia eso: 0 ciclos en laboratorio. Si importas `gsap` por primera vez dentro de la zona, compruébalo: sin ejecutar.
- **Sin servicio.** Para compartir la instancia, ver [`int-contrato`](int-contrato.md): aquí, un servicio con `providedIn: 'root'`, creada desde el `afterNextRender` del raíz. Un `constructor` de servicio correría en servidor. Sin ejecutar. [P]
- **`NavigationEnd` y datos diferidos.** `@defer` o datos que llegan después son una [vista provisional](int-navegacion.md#trampas). Sin ejecutar. [P]
- **`ElementRef` en el constructor.** `firstElementChild` aún no existe: léelo dentro de `afterNextRender`, como en el ejemplo. [C]
