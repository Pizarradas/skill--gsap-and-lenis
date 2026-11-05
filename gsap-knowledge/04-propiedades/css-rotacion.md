---
id: css-rotacion
titulo: Rotación direccional
capa: 04-propiedades
tipo: api
ambito: CSSPlugin
resumen: Sufijos _short, _cw y _ccw para elegir el sentido de giro, y qué unidades acepta realmente rotation.
api: [gsap.CSSProperties.rotation, gsap.CSSProperties.rotationX, gsap.CSSProperties.rotationY, gsap.CSSProperties.rotationZ, gsap.CSSProperties.rotate, gsap.CSSProperties.rotateX, gsap.CSSProperties.rotateY, gsap.CSSProperties.rotateZ]
requiere: [css-transforms]
relacionadas: [css-origin, css-modifiers]
etiquetas: [css, rotacion, transform]
fuentes:
  - docs/v3/GSAP/CorePlugins/CSS.md
estado: verificado
version: 3.15.1
---
# Rotación direccional

Por defecto una rotación recorre la diferencia numérica: de 170 a -170 gira 340° en sentido contrario al reloj. Un sufijo en cadena fija el sentido o busca el camino corto. Funciona en `rotation`, `rotationX` y `rotationY`, sin plugins. [O]

## Firma

```text
rotation: "<ángulo><unidad?>_<sufijo>"     con +=/-= opcionales
```

| Sufijo | Sentido |
|---|---|
| `_short` | El camino más corto |
| `_cw` | Horario |
| `_ccw` | Antihorario |

| Forma | Ejemplo | Nota |
|---|---|---|
| Grados | `rotation: 90` | Unidad por defecto |
| Radianes | `rotation: "1.57rad"` | Se convierte a grados [C] |
| Relativo | `rotation: "+=30"` | [E] |
| Relativo con sufijo | `rotationX: "-=30_cw"` | [O] |

Hay alias: `rotate` y `rotationZ` y `rotateZ` valen lo mismo que `rotation`, `rotateX` que `rotationX`, y `rotateY` que `rotationY`. [C] [E]

## Ejemplo

```js
gsap.set(".aguja", { rotation: 170 });
const corto = gsap.to(".aguja", {
  rotation: "-170_short",
  duration: 1,
  ease: "none",
  paused: true,
});

corto.progress(0.5);
const enMedio = gsap.getProperty(".aguja", "rotation");
corto.progress(1);
const final = gsap.getProperty(".aguja", "rotation");

// prueba: enMedio === 180
// prueba: final === -170
```

Sentido forzado: [E]

```js
gsap.set(".rueda", { rotation: 350 });
const horario = gsap.to(".rueda", { rotation: "10_cw", duration: 1, ease: "none", paused: true });
horario.progress(0.5);
const mitad = gsap.getProperty(".rueda", "rotation");

gsap.set(".disco", { rotation: 10 });
const antihorario = gsap.to(".disco", { rotation: "350_ccw", duration: 1, ease: "none", paused: true });
antihorario.progress(0.5);

// prueba: mitad === 360
// prueba: gsap.getProperty(".disco", "rotation") === 0
```

Alias: [E]

```js
gsap.set(".alias", { rotate: 45, rotateX: 10, rotateY: 20 });
gsap.set(".alias-b", { rotationZ: 45, rotationX: 10, rotationY: 20 });

const a = document.querySelector(".alias").style.transform;

// prueba: a === document.querySelector(".alias-b").style.transform
// prueba: a === "rotate(45deg) rotateY(20deg) rotateX(10deg)"
```

## Trampas

- **`turn` no se convierte.** Solo se reconoce `rad`: `rotation: "0.25turn"` son 0.25 grados, sin aviso. Convierte a grados. [E]

```js
gsap.set(".vuelta", { rotation: "0.25turn" });

// prueba: gsap.getProperty(".vuelta", "rotation") === 0.25
```

- **El valor final es el pedido, no el equivalente corto.** `"270_short"` desde 0 gira -90 y al acabar lee 270. Es visualmente igual, pero los relativos posteriores parten de 270. Si acumulas, normaliza con [`gsap.utils.wrap`](../06-utilidades/utl-numeros.md). [E]

```js
gsap.set(".marcador", { rotation: 0 });
const pasa = gsap.to(".marcador", {
  rotation: "270_short",
  duration: 1,
  ease: "none",
  paused: true,
});

pasa.progress(0.5);
const via = gsap.getProperty(".marcador", "rotation");
pasa.progress(1);

// prueba: via === -45
// prueba: gsap.getProperty(".marcador", "rotation") === 270
```

- **Los sufijos solo van en cadena.** Sin comillas ni sufijo el recorrido es numérico. [O]
- **Los valores por encima de 360 se conservan**: `rotation: 400` da `rotate(400deg)`, y se lee 400. Un `rotation: 0` posterior da casi una vuelta y cuarto hacia atrás. Usa `_short` si no quieres desenrollar. [E]
- **Fuera del DOM no aplica.** En un objeto plano los sufijos no se interpretan: los ofrece CSSPlugin. La documentación cita un `DirectionalRotationPlugin` que no está en 3.15.1. [C]
