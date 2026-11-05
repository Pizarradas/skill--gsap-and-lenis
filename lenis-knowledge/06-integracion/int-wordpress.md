---
id: int-wordpress
titulo: Lenis en WordPress
capa: 06-integracion
tipo: guia
ambito: transversal
resumen: Encolar Lenis y su CSS, el código en línea cancela defer, editor y personalizador, y constructores. Basado en documentación: WordPress no se ejecutó.
api: [LenisOptions.autoRaf, LenisOptions.anchors, Lenis.destroy, Lenis.stop, Lenis.start]
requiere: [int-contrato, int-vanilla]
relacionadas: [int-gsap, fun-instalacion, rec-modal, cal-conflictos]
etiquetas: [wordpress, php, cms, enqueue]
fuentes:
  - README.md
  - https://developer.wordpress.org/reference/functions/wp_enqueue_script/
  - https://developer.wordpress.org/reference/functions/wp_add_inline_script/
  - https://make.wordpress.org/core/2023/07/14/registering-scripts-with-async-and-defer-attributes-in-wordpress-6-3/
estado: revisar
version: 1.3.27
---
# Lenis en WordPress

WordPress sirve páginas completas, así que aplica [`int-vanilla`](int-vanilla.md): entra al cargar y sale al descartarse. Lo propio es cómo llegar a la página y en qué pantallas no debe correr. No hay paquete: Lenis se encola como cualquier script.

**Sin ejecutar en WordPress**, y por eso `estado: revisar`. Las API son de la documentación oficial consultada el 2026-11-05, en especial sobre 6.3 y `$args`. El PHP no se ha ejecutado. Lo que dice "laboratorio" es el comportamiento de Lenis en una página HTML equivalente, no en un tema real.

| Entrar | Cambiar | Salir | Ruta | Sincronizar |
|---|---|---|---|---|
| `wp_enqueue_script` y archivo propio | `lenis.resize()` tras cargar más entradas o filtrar por AJAX; `lenis.options`, con la instancia en una variable global | Nada: la página se descarta | Una recarga; un tema con navegación sin recarga aplica [`colocar`](int-navegacion.md) | Nada, con `autoRaf`; con GSAP, su dependencia y [`int-gsap`](int-gsap.md) |

**Plantillas.** Las de [`plantillas/`](../plantillas/README.md) funcionan aquí. Con módulos o empaquetador, copia `plantillas/<nombre>.js`. Con `<script>` clásico, copia `plantillas/globales/<nombre>.js` y llama a `Plantillas.nombre(...)`: el archivo de `plantillas/` da `Cannot use import statement outside a module`.

## Pasos

### 1. Copia los archivos a tu tema

Sirve `lenis.min.js` y `lenis.css` desde el tema: fijas la versión y no dependes de un tercero. Un CDN también funciona: ver [`fun-instalacion`](../01-fundamentos/fun-instalacion.md). Las plantillas van desde `plantillas/globales/`, encoladas después de `lenis`.

### 2. Encola en el orden correcto

Desde WordPress 6.3, el quinto argumento admite `strategy` e `in_footer`. [O]

```php
<?php
add_action('wp_enqueue_scripts', function () {
    if (is_customize_preview()) {
        return;
    }
    $base = get_stylesheet_directory_uri() . '/vendor/';
    wp_enqueue_style('lenis', $base . 'lenis.css', [], '1.3.27');
    wp_enqueue_script('lenis', $base . 'lenis.min.js', [], '1.3.27', ['strategy' => 'defer', 'in_footer' => true]);
    wp_enqueue_script('tema-scroll', get_stylesheet_directory_uri() . '/js/scroll.js', ['lenis'], '1.0.0', ['strategy' => 'defer', 'in_footer' => true]);
});
```

### 3. Pon tu código en un archivo

```js fragmento
// js/scroll.js
window.temaLenis = new Lenis({ autoRaf: true, anchors: true });
```

**No uses `wp_add_inline_script` con `defer`.** Un script en línea en posición `after`, la predeterminada, hace que WordPress trate el script como bloqueante y retire `defer`, y esto puede afectar a toda la cadena de dependencias. [O] Un archivo propio conserva la estrategia. Si eliges en línea, deja la carga como bloqueante en el pie, y será una decisión tuya.

## Trampas

- **Editor y previsualización.** En el editor de bloques, el contenido vive en un iframe, y en el personalizador las recargas parciales cambian nodos sin recargar. Lenis no aporta nada allí: la comprobación de `is_customize_preview()` lo evita en el personalizador. Con constructores visuales, comprueba su propia bandera. [P]
- **Barra de administración.** Con la sesión iniciada, la barra fija tapa los destinos de las anclas. `scroll-padding-top` lo resuelve, y Lenis lo descuenta en `scrollTo` con objetivo. [C]
- **Modales de plugins.** Muchos bloquean con `overflow: hidden` en `body`. Lenis no lo detecta, ni con `autoToggle`, que solo mira la raíz: la página sigue moviéndose detrás. Laboratorio: 598 px de 600. Ver [`cal-conflictos`](../07-calidad/cal-conflictos.md) y [`rec-modal`](../08-recetas/rec-modal.md).
- **Tema con `html, body { height: 100% }` y `overflow`.** Ver [`cal-errores`](../07-calidad/cal-errores.md).
- **Optimizadores.** Los plugins de caché que retrasan o combinan JavaScript pueden reordenar scripts, y un `DOMContentLoaded` tardío no se dispara: ver `alEstarListo` en [`int-vanilla`](int-vanilla.md). Sin ejecutar. [P]
- **Otro scroll suave en el tema.** Muchos temas y constructores incluyen uno. Dos suavizados se pisan: desactiva uno. Ver [`cal-conflictos`](../07-calidad/cal-conflictos.md). [P]
