---
id: eas-registro
titulo: Registrar y resolver eases
capa: 05-easing
tipo: api
ambito: core
resumen: gsap.registerEase y gsap.parseEase. Dar nombre a una función de ease, obtener la función de una cadena y evitar los fallos silenciosos.
api: [gsap.registerEase, gsap.parseEase]
requiere: [eas-guia]
relacionadas: [eas-customease, eas-easepack, fun-plugins]
etiquetas: [easing, registro]
fuentes:
  - docs/v3/GSAP/gsap.registerEase().md
  - docs/v3/GSAP/gsap.parseEase().md
  - docs/v3/Eases.md
estado: verificado
version: 3.15.1
---
# Registrar y resolver eases

`gsap.registerEase()` asigna un nombre a una función para usarlo en `ease`. `gsap.parseEase()` hace lo contrario: de una cadena obtiene la función. Juntas permiten reutilizar curvas y evaluarlas fuera de un tween. [O]

## Firma

```text
gsap.registerEase(nombre, funcion)
gsap.parseEase(cadena, porDefecto?)   → función o undefined
gsap.parseEase()                      → objeto con todos los eases registrados
```

| Entrada de `parseEase` | Devuelve |
|---|---|
| Nombre registrado | La función |
| Cadena con parámetros | Una función nueva con esa configuración |
| Función | La misma función |
| `cubic-bezier`, con CustomEase | Una CustomEase sin nombre [O] |
| Desconocido | `porDefecto` **tal cual**, o `undefined` |

La función recibe el progreso, normalmente de 0 a 1, y devuelve el progreso aplicado, que puede salirse de ese rango. Debe valer 0 en 0 y 1 en 1 para terminar en el destino. [O]

## Ejemplo

```js
gsap.registerEase("cuadrada", (p) => p * p);

const objeto = { x: 0 };
gsap.to(objeto, { x: 100, duration: 1, ease: "cuadrada", paused: true }).progress(0.5);

// prueba: objeto.x === 25
// prueba: gsap.parseEase("cuadrada")(0.5) === 0.25
```

Curva evaluada fuera de un tween, para repartir retardos o trazar:

```js
const curva = gsap.parseEase("power2.in");
const retardos = [0, 0.25, 0.5, 0.75, 1].map((p) => curva(p) * 2);

const reserva = gsap.parseEase("noexiste", gsap.parseEase("none"));
const sinResolver = gsap.parseEase("noexiste", "none");

// prueba: retardos[2] === 0.25
// prueba: reserva === gsap.parseEase("none")
// prueba: sinResolver === "none"
// prueba: gsap.parseEase("noexiste") === undefined
// prueba: typeof gsap.parseEase()["power2.out"] === "function"
```

Comprobación de un nombre antes de usarlo:

```js
function easeSeguro(nombre) {
  return gsap.parseEase(nombre) ? nombre : "none";
}

// prueba: easeSeguro("power3.inOut") === "power3.inOut"
// prueba: easeSeguro("potencia3") === "none"
```

## Trampas

- **`registerEase` distingue mayúsculas y no crea variantes.** `"cuadrada"` no da `"cuadrada.out"`, ni reconoce `"Cuadrada"`. Registra cada variante aparte, con nombres propios. [E]

```js
gsap.registerEase("cubo", (p) => p * p * p);

// prueba: gsap.parseEase("cubo.out") === undefined
// prueba: gsap.parseEase("Cubo") === undefined
```

- **`porDefecto` no se resuelve.** Si no encuentra el ease devuelve el segundo argumento sin procesar: `gsap.parseEase("x", "none")` devuelve la cadena `"none"`, no una función. Pásale una función. [E]
- **Los nombres se pisan.** Registrar un nombre estándar reemplaza ese ease en toda la página. [O]
- **Un ease que no acaba en 1** hace que el tween no llegue al destino. [C]
- **Se aplica en cada render de cada objetivo.** Mantén la función pura y barata. [P]
- **En servidor.** `CustomEase` se declara `headless`, de modo que puede crearse sin DOM. Otros plugins no. [C]
