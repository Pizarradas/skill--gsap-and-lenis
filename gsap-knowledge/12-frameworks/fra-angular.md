---
id: fra-angular
titulo: GSAP en Angular
capa: 12-frameworks
tipo: guia
ambito: transversal
resumen: Entrar, cambiar y salir en Angular: afterNextRender, DestroyRef, effect, animate.leave, Flip con afterNextRender y rutas, probados en una app real de Angular 22.
api: [gsap.context, gsap.Context.revert, gsap.Context.add, gsap.registerPlugin, Flip.getState, Flip.from]
requiere: [fra-agnostico]
relacionadas: [nuc-context, fra-typescript, rec-salida, int-flip]
etiquetas: [angular, ssr, signals]
fuentes:
  - resources/frameworks.md
  - https://angular.dev/api/core/afterNextRender
  - https://angular.dev/guide/zoneless
  - https://angular.dev/guide/animations
  - https://angular.dev/api/core/afterRenderEffect
  - https://angular.dev/api/core/AnimationCallbackEvent
  - https://angular.dev/api/router/Event
estado: verificado
version: 3.15.1
---
# GSAP en Angular

La documentación de GSAP no trae guía de Angular más allá de indicar que el mismo código sirve en cualquier framework. Esta ficha aplica el [contrato común](fra-agnostico.md) a las API actuales de Angular. [O]

Consultado el 2026-11-05: la documentación corresponde a Angular 22.2.4, y `afterNextRender` figura como estable desde v20. **Laboratorio del mismo día:** app real creada con `ng new` y compilada con `ng build` (CLI 22.2.6, TypeScript 6.0), gsap 3.15.1 y Chrome 156, sin pasar por el arnés: montaje, cambio, evento, salida, contenido tardío, Flip, ruta y limpieza (fuentes en `_notas/contrato-lab/angular/`). Sin Zone.js, como genera la CLI. **No** se ejecutó SSR ni una app con Zone.js. El CLI 22 exige Node 22.22.3, 24.15 o 26 como mínimo.

| Cambio | Evento | Salida | Flip tras actualizar | Ruta |
|---|---|---|---|---|
| `effect()` y `ctx?.add()` | `ctx?.add()` en el manejador | `(animate.leave)` y `animationComplete()` en `onComplete` | `Flip.getState()`, señal, `afterNextRender` con `injector`, `Flip.from()` | `(animate.leave)` en el `host` de la vista |

## Pasos

### 1. Componente

`afterNextRender` se ejecuta una vez, tras el siguiente render, y solo en navegador. Es el punto correcto para una librería que toca el DOM, y evita el problema de SSR.

```ts
import { afterNextRender, Component, DestroyRef, ElementRef, inject, viewChild } from "@angular/core";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: "app-portada",
  template: `
    <section #raiz>
      <div class="fondo"></div>
      <h1 class="titulo">Hola</h1>
    </section>
  `,
})
export class PortadaComponent {
  private raiz = viewChild.required<ElementRef<HTMLElement>>("raiz");
  private ctx?: gsap.Context;

  constructor() {
    afterNextRender({
      write: () => {
        const nodo = this.raiz().nativeElement;
        this.ctx = gsap.context(() => {
          gsap.from(".titulo", { y: 30, autoAlpha: 0 });
          gsap.to(".fondo", {
            yPercent: 15,
            ease: "none",
            scrollTrigger: { trigger: nodo, scrub: true },
          });
        }, nodo);
      },
    });

    inject(DestroyRef).onDestroy(() => this.ctx?.revert());
  }
}
```

Usa `?.`, porque en servidor `afterNextRender` no corre y `ctx` queda sin definir.

El ámbito también acepta el `ElementRef` directamente: el selector de GSAP lee `value.nativeElement`. [C]

### 2. Reaccionar a señales y eventos

`effect()` corre con cada cambio de señal. Para que lo creado se limpie, entra en el contexto. El `?.` cubre el efecto que corre antes del primer `afterNextRender`. En laboratorio, una barra que iba a 1 y recibió 0,2 siguió desde su valor sin saltos.

```ts
effect(() => {
  const v = this.valor();
  this.ctx?.add(() => gsap.to(".barra", { scaleX: v / 100, duration: 0.3, overwrite: "auto" }));
});

pulsar() {
  this.ctx?.add(() => gsap.to(".boton", { rotation: "+=90", duration: 0.1 }));
}
```

Para un nodo que aparece más tarde bajo `@if`, observa su `viewChild` con `afterRenderEffect`, que corre con el DOM listo y solo en navegador. Comprobado: la entrada del nodo corrió una vez, al aparecer.

```ts
private extra = viewChild<ElementRef<HTMLElement>>("extra");

constructor() {
  afterRenderEffect({
    write: () => {
      const nodo = this.extra()?.nativeElement;
      if (nodo) this.ctx?.add(() => gsap.from(nodo, { autoAlpha: 0, x: 30 }));
    },
  });
}
```

### 3. Salida con `animate.leave`

Es una API del compilador, y su tipo `AnimationCallbackEvent` es estable desde v20.2. Angular retiene el nodo hasta `animationComplete()`, que debes llamar tú. Si no lo haces, lo fuerza a los 4 s, valor ajustable con `MAX_ANIMATION_TIMEOUT`. En laboratorio el nodo siguió a mitad de salida y se fue al acabar.

```ts
@Component({
  selector: "app-aviso",
  template: `@if (visible()) { <div (animate.leave)="salida($event)">Guardado</div> }`,
})
export class AvisoComponent {
  visible = signal(true);

  salida(e: AnimationCallbackEvent) {
    gsap.to(e.target, { autoAlpha: 0, y: -10, duration: 0.2, onComplete: () => e.animationComplete() });
  }
}
```

Las salidas de hijos solo corren antes de retirar al padre si están en la misma plantilla, según la guía. No mezcles esta API con las animaciones antiguas de Angular en un componente. Ver [rec-salida](../14-recetas/rec-salida.md).

### 4. Flip tras actualizar

Una señal no actualiza el DOM en el acto. Sin esperar, Flip midió el DOM viejo: 0 px de recorrido. Con `afterNextRender`, 23 px y final en 0. Fuera del constructor exige `injector`. Usa `track` con identidad estable. Laboratorio.

```ts
private inyector = inject(Injector);

reordenar() {
  const estado = Flip.getState(this.raiz().nativeElement.querySelectorAll(".fila"));
  this.filas.update((f) => [...f].reverse());
  afterNextRender(
    { write: () => this.ctx?.add(() => { Flip.from(estado, { duration: 0.3 }); }) },
    { injector: this.inyector },
  );
}
```

### 5. Entre rutas

Declara `animate.leave` en el `host` de la vista enrutada, y crea el tween fuera de su contexto:

```ts
@Component({
  selector: "app-vista",
  host: { "(animate.leave)": "salirRuta($event)" },
  template: `…`,
})
export class VistaComponent {
  salirRuta(e: AnimationCallbackEvent) {
    gsap.to(e.target, { opacity: 0, duration: 0.15, onComplete: () => e.animationComplete() });
  }
}
```

Orden en laboratorio: `DestroyRef.onDestroy`, limpieza del contexto, inicio de `animate.leave` y fin. Dos consecuencias: un `ctx.revert()` en `onDestroy` deshace los valores de GSAP **cuando la salida empieza**, y la vista nueva ya está en el DOM mientras sale la vieja: coloca ambas para que no se empujen. Al volver a la ruta hubo un solo ScrollTrigger. Con una salida interna en curso dentro del contexto, retirar la vista no colgó nada: el nodo se fue a los 155 ms, y `onComplete` no llegó a correr.

### 6. Zone.js

- Con v21 o posterior, las apps son **zoneless por defecto** y no hace falta nada: el rAF de GSAP no dispara detección de cambios. En la app de laboratorio, `typeof Zone` fue `undefined`.
- Con Zone.js, cada `requestAnimationFrame` del ticker entra en la zona. Si el ticker arranca dentro de ella, puede provocar detección de cambios por fotograma. Crea las animaciones en `NgZone.runOutsideAngular()`. [P]

`runOutsideAngular` es compatible con apps zoneless, según su guía, así que una librería puede dejarlo puesto.

## Trampas

- **`ngOnInit` llega antes de que exista la vista.** Los hijos de plantilla aparecen después. Usa `afterNextRender`, o `ngAfterViewInit` con la guarda de plataforma si estás en una versión antigua. [P]
- **Hidratación.** Los callbacks pueden correr antes de que el componente esté hidratado, según la documentación de `afterNextRender`. No des por hecho que los listeners ya están activos. [P]
- **Contenido bajo `@if`.** Un nodo que aparece después del primer render no estaba cuando corrió `afterNextRender`. Ver el apartado 2.
- **`afterNextRender` corre primero en el padre.** En laboratorio el padre arrancó antes que su hijo: un hijo no puede contar con que ya exista lo que su padre crea ahí, ni al revés. Ver [orden de ejecución](fra-agnostico.md).
- **`RouteReuseStrategy`.** Un componente reutilizado por ruta no se destruye, y conserva sus triggers con medidas viejas. Ver [vistas que persisten](fra-agnostico.md). [P]
