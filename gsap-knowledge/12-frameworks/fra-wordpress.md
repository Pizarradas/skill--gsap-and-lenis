---
id: fra-wordpress
titulo: GSAP en WordPress
capa: 12-frameworks
tipo: guia
ambito: transversal
resumen: Encolar GSAP y plugins con dependencias en functions.php, tema hijo, espera al DOM y a load, y correcciones al ejemplo oficial.
api: [gsap.registerPlugin, gsap.to, ScrollTrigger.refresh]
requiere: [fra-vanilla]
relacionadas: [fra-agnostico, fun-instalacion, fra-webflow, cal-fouc]
etiquetas: [wordpress, cms, cdn, php]
fuentes:
  - resources/Wordpress.md
estado: verificado
version: 3.15.1
---
# GSAP en WordPress

En WordPress los scripts se cargan con el sistema de colas: `wp_enqueue_script` y dependencias entre *handles*. Así, GSAP queda antes que sus plugins y que tu código, sin importar qué más cargue la página. [O]

| Cambio | Evento | Salida | Flip tras actualizar | Ruta |
|---|---|---|---|---|
| Tween con `overwrite: "auto"` | Listener directo en tu archivo | Anima y quita el nodo en `onComplete` | `Flip.getState()`, cambio síncrono, `Flip.from()` | Recarga completa: nada que limpiar. En el personalizador, vuelve a montar con `partial-content-rendered` |

La tabla no se ha ejecutado en WordPress: es JavaScript sin framework, probado en [fra-vanilla](fra-vanilla.md). [P]

## Pasos

### 1. Encola en `functions.php`

```php
<?php
function tema_encolar_gsap() {
    // $handle, $src, $deps, $ver, $in_footer
    wp_enqueue_script( 'gsap', 'https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js', array(), null, true );
    wp_enqueue_script( 'gsap-st', 'https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js', array( 'gsap' ), null, true );

    // Tu código depende de todo lo que usa
    wp_enqueue_script(
        'mi-animacion',
        get_stylesheet_directory_uri() . '/js/animacion.js',
        array( 'gsap', 'gsap-st' ),
        '1.0.0',
        true
    );
}
add_action( 'wp_enqueue_scripts', 'tema_encolar_gsap' );
```

### 2. Espera al DOM, o a `load` si mides

```js fragmento
function arrancar() {
  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".hero-titulo", { y: 30, autoAlpha: 0 });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar, { once: true });
else arrancar();

// Tras cargar imágenes y fuentes, recalcula las posiciones de scroll
window.addEventListener("load", () => ScrollTrigger.refresh());
```

Con `$in_footer = true` el script corre al final del `body`. La comprobación de `readyState` no sobra: un optimizador que retrasa el JavaScript ejecuta tu archivo **después** de `DOMContentLoaded`, y un listener a secas nunca se dispararía. [E] `window.addEventListener("load", …)` tiene el mismo límite: si `readyState` ya vale `complete`, llama a `ScrollTrigger.refresh()` directamente. [P]

Un constructor visual o el personalizador pueden sustituir parte del HTML sin recargar, y entonces tu animación apunta a nodos muertos: en ese entorno aplica el [contrato](fra-agnostico.md) completo. [P]

### 3. Con un tema de terceros

No edites `functions.php` de un tema que se actualiza, como Divi o los temas oficiales: la actualización borra tus cambios. Crea un **tema hijo** y encola allí. [O] Por eso el ejemplo usa `get_stylesheet_directory_uri()`, que apunta al tema activo, y no `get_template_directory_uri()`, que apunta al tema padre. [P]

### 4. Sin código

La documentación oficial enumera vídeos sobre encolado, Scripts Organizer con Oxygen y una interfaz visual con motion.page. Son recursos de la comunidad. [O]

## Trampas

- **Falta la barra en la ruta.** El ejemplo oficial concatena `get_template_directory_uri() . 'js/app.js'`, y esa función devuelve la ruta sin barra final: la URL queda mal formada. Escribe `'/js/app.js'`. [P]
- **Dependencia incompleta.** El ejemplo oficial pone solo `gsap-js` como dependencia de tu archivo. Si tu código usa ScrollTrigger, añade también su handle, o el orden queda sin garantía. [P]
- **Handle genérico duplicado.** Si un plugin de WordPress ya encoló GSAP con otro handle, tendrás dos copias. Las dos crean su propia global y `registerPlugin` queda repartido. Busca en el HTML `gsap.min.js` y deja una sola. [P]
- **`gsap@3.15` flota.** Sin el parche, el CDN sirve la última 3.15.x: un cambio menor puede llegar sin avisar. Fija la versión exacta en producción. [P]
- **Optimizadores.** Plugins de caché que combinan, difieren o retrasan JS pueden romper el orden. Si `gsap is not defined` aparece solo en producción, excluye esos archivos. [P]
- **`scroll-behavior: smooth`** en temas modernos desajusta ScrollTrigger. Ver [errores de ScrollTrigger](../13-calidad/cal-st-errores.md). [O]
- **Cargar en todas las páginas.** Usa condicionales como `is_front_page()` dentro de la función de encolado si solo una vista anima. [P]
