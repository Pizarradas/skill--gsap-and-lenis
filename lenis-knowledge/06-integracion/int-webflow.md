---
id: int-webflow
titulo: Lenis en Webflow
capa: 06-integracion
tipo: guia
ambito: transversal
resumen: Fragmento sin compilación del README en el código personalizado, qué resuelve cada opción, contrastado una a una. Webflow no se ejecutó; el fragmento, sí.
api: [LenisOptions.autoRaf, LenisOptions.autoToggle, LenisOptions.anchors, LenisOptions.allowNestedScroll, LenisOptions.naiveDimensions, LenisOptions.stopInertiaOnNavigate]
requiere: [int-contrato, int-vanilla]
relacionadas: [fun-instalacion, fun-css, opc-automatico, com-anclas, rec-modal, cal-conflictos]
etiquetas: [webflow, no-code, cdn, codigo-personalizado]
fuentes:
  - README.md
  - https://developers.webflow.com/data/docs/custom-code
  - https://help.webflow.com/hc/en-us/articles/33961357265299-Custom-code-in-head-and-body-tags
estado: revisar
version: 1.3.27
---
# Lenis en Webflow

Webflow publica páginas completas, así que aplica [`int-vanilla`](int-vanilla.md). El README trae un fragmento "sin compilación" pensado para esto. Aquí se contrasta qué resuelve de verdad.

**Webflow no se ha ejecutado**, y por eso `estado: revisar`. La documentación oficial se consultó el 2026-11-05: la API de desarrolladores se leyó entera, y la ayuda de código personalizado (HTTP 403 al leerla directamente) solo por un extracto de búsqueda. Lo que dice "laboratorio" es el **fragmento real**, cargado de `unpkg.com`, en una página HTML propia, con Chrome 156 headless y rueda real.

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| Fragmento en el código personalizado | Con `naiveDimensions` del fragmento, el alto no exige nada; para opciones, guarda la instancia en una variable global y usa `lenis.options` | Nada: la página se descarta | Una recarga | Nada, con `autoRaf`; GSAP por `<script>`: ver [`int-gsap`](int-gsap.md) |

**Plantillas.** Las de [`plantillas/`](../plantillas/README.md) funcionan aquí. Con módulos o empaquetador, copia `plantillas/<nombre>.js`. Con `<script>` clásico, copia `plantillas/globales/<nombre>.js` y llama a `Plantillas.nombre(...)`: el archivo de `plantillas/` da `Cannot use import statement outside a module`.

## Pasos

### 1. Pega el fragmento

Va en el código personalizado del sitio, o de una página: `head` queda dentro de `<head>`, y `footer` justo antes de `</body>`. El código aplicado solo llega tras **publicar**. [O] No incluyas `<html>`, `<head>` ni `<body>`. [O]

```text
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.27/dist/lenis.css">
<script src="https://unpkg.com/lenis@1.3.27/dist/lenis.min.js"></script>
<script>
  new Lenis({
    autoRaf: true,
    autoToggle: true,
    anchors: true,
    allowNestedScroll: true,
    naiveDimensions: true,
    stopInertiaOnNavigate: true,
  })
</script>
```

En laboratorio funcionó también dentro de `<head>`, antes de que exista `<body>`.

### 2. Sabe qué resuelve cada opción

El README afirma que resuelve "los problemas habituales". Contraste en laboratorio:

| Promesa | Opción | Resultado |
|---|---|---|
| Anclas suaves | `anchors` | Correcto: llegó a 1802, en el destino |
| Modales | `autoToggle` | **Solo con `overflow` en `html`.** Se detuvo y volvió a funcionar al quitarlo. Con `overflow: hidden` en `body`, la página siguió moviéndose (598 de 600) |
| Alto que cambia | `naiveDimensions` | Correcto: `limit` igual al real sin esperar, tras insertar contenido |
| Reinicio al cambiar de página | `stopInertiaOnNavigate` | Corta la inercia al pulsar un enlace de otra ruta. No coloca el scroll: una carga completa ya lo hace |
| Compatibilidad con otros paquetes | `allowNestedScroll` | Deja moverse a lo anidado: ver [`opc-filtros`](../02-opciones/opc-filtros.md). No es compatibilidad general |

### 3. Añade atributos en el Designer

`data-lenis-prevent` se pone como atributo personalizado del elemento, en un panel con scroll propio o un mapa embebido. Sobre un `iframe`, ver [`cal-limitaciones`](../07-calidad/cal-limitaciones.md).

### 4. Usa las interacciones de Webflow

Lenis mueve el scroll nativo, de modo que lo que se basa en `scroll` nativo debería seguir: es la misma razón por la que ScrollTrigger funciona sin `scrollerProxy`. No se ha probado con las interacciones reales de Webflow. Sin ejecutar. [P]

## Trampas

- **Modales de Webflow.** Una interacción que bloquea el scroll suele escribir en `body`, y eso `autoToggle` no lo ve. En el manejador de abrir, llama a `stop()` y `start()`: necesitas guardar la instancia en una variable global, que el fragmento no hace. Sin ejecutar. [P]
- **`autoToggle` necesita `lenis.css` y soporte de `transition-behavior`.** Depende de una transición de `overflow`: sin la hoja o en un navegador sin soporte, no reacciona. Ver [`opc-automatico`](../02-opciones/opc-automatico.md). [C]
- **Límites de código.** La API de desarrolladores limita cada script en línea a 10 000 caracteres, y la ayuda habla de 50 000 en los campos del sitio. El fragmento cabe en ambos. [O]
- **Plan.** Una fuente no oficial dice que el código personalizado exige un plan de pago: comprueba el tuyo. Sin verificar.
- **`scroll-snap` nativo.** Si tu diseño usa `scroll-snap-type`, no es compatible: ver [`cal-conflictos`](../07-calidad/cal-conflictos.md).
