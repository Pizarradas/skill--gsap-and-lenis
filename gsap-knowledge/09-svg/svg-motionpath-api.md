---
id: svg-motionpath-api
titulo: MotionPathPlugin, métodos estáticos
capa: 09-svg
tipo: api
ambito: MotionPathPlugin
resumen: Utilidades de rutas y coordenadas, sin tween. RawPath, posición en ruta, cortes, y conversión entre sistemas de coordenadas con transformaciones anidadas.
api: [MotionPathPlugin.arrayToRawPath, MotionPathPlugin.cacheRawPathMeasurements, MotionPathPlugin.convertCoordinates, MotionPathPlugin.convertToPath, MotionPathPlugin.getAlignMatrix, MotionPathPlugin.getGlobalMatrix, MotionPathPlugin.getPositionOnPath, MotionPathPlugin.getRawPath, MotionPathPlugin.getRelativePosition, MotionPathPlugin.pointsToSegment, MotionPathPlugin.rawPathToString, MotionPathPlugin.sliceRawPath, MotionPathPlugin.stringToRawPath, gsap.plugins.ArrayToRawPathObject.curviness, gsap.plugins.ArrayToRawPathObject.relative, gsap.plugins.ArrayToRawPathObject.type, gsap.plugins.ArrayToRawPathObject.x, gsap.plugins.ArrayToRawPathObject.y]
requiere: [svg-motionpath]
relacionadas: [svg-motionpath, svg-morphsvg-api, int-flip]
etiquetas: [svg, rawpath, coordenadas, matriz]
fuentes:
  - docs/v3/Plugins/MotionPathPlugin/*
estado: verificado
version: 3.15.1
---
# MotionPathPlugin: métodos estáticos

Funcionan sin crear tweens. Sirven para dos cosas: manipular RawPath y traducir coordenadas entre elementos, con transformaciones anidadas. El formato RawPath y sus tipos de 3.15.1 están en [svg-morphsvg-api](svg-morphsvg-api.md).

## Firma

| Método | Devuelve | Nota |
|---|---|---|
| `getRawPath(valor)` | RawPath | Selector, elemento o datos. Con elementos devuelve una caché compartida [E] |
| `stringToRawPath(datos)` `rawPathToString(raw)` | RawPath / string | Ida y vuelta |
| `arrayToRawPath(puntos, vars?)` | RawPath | `vars`: `curviness`, `relative`, `type` (`"thru"` o `"cubic"`), `x` e `y` para renombrar propiedades |
| `pointsToSegment(xy[], curviness?)` | segmento | Array plano `[x, y, x, y]` |
| `cacheRawPathMeasurements(raw, resolución?)` | el mismo RawPath | Añade `totalLength` y tablas de consulta [E] |
| `getPositionOnPath(raw, progreso, conAngulo?)` | `{x, y, angle?}` | Ángulo en grados |
| `sliceRawPath(raw, inicio, fin)` | RawPath nuevo | `fin < inicio` invierte el sentido [E] |
| `convertToPath(forma, swap?)` | path[] | Igual que el de [MorphSVG](svg-morphsvg-api.md) [O] |
| `getGlobalMatrix(el, inversa?, ajusteG?)` | Matrix2D | Local → viewport |
| `convertCoordinates(desde, hasta, punto?)` | punto o Matrix2D | Sin punto, devuelve la matriz |
| `getRelativePosition(desde, hasta, origenA?, origenB?)` | `{x, y}` | Distancia en el sistema del **padre** de `desde` |
| `getAlignMatrix(desde, hasta, origenA?, origenB?)` | Matrix2D | Para alinear |

Orígenes: `[0.5, 0.5]` (proporcional), `{x, y}` (píxeles locales) o `"auto"`, que usa el inicio de un `<path>`. [O]

La **Matrix2D** tiene `a`–`f` y métodos `apply`, `inverse`, `multiply`, `clone` y `equals`. [E]

## Ejemplo

Colocar una marca en un punto de la ruta y orientarla, sin animación:

```js
const ruta = MotionPathPlugin.getRawPath("M0 0 L100 0 L100 100");
MotionPathPlugin.cacheRawPathMeasurements(ruta);
const cuarto = MotionPathPlugin.getPositionOnPath(ruta, 0.25, true);
const tresCuartos = MotionPathPlugin.getPositionOnPath(ruta, 0.75, true);
const corte = MotionPathPlugin.sliceRawPath(ruta, 0.25, 0.75);
// prueba: Math.round(ruta.totalLength) === 200
// prueba: Math.round(cuarto.x) === 50 && cuarto.y === 0 && cuarto.angle === 0
// prueba: tresCuartos.x === 100 && Math.round(tresCuartos.y) === 50 && tresCuartos.angle === 90
// prueba: corte !== ruta && corte[0][0] === 50
```

Plotear una curva y escribirla en un `<path>`:

```html
<svg width="200" height="100"><path id="traza" fill="none" stroke="#333" /></svg>
```

```js
const anclas = [{ x: 0, y: 50 }, { x: 100, y: 0 }, { x: 200, y: 50 }];
const curva = MotionPathPlugin.arrayToRawPath(anclas, { curviness: 0.5 });
document.querySelector("#traza").setAttribute("d", MotionPathPlugin.rawPathToString(curva));
const crudo = MotionPathPlugin.pointsToSegment([0, 50, 100, 0, 200, 50], 0.5);
// prueba: curva[0].length === 14
// prueba: document.querySelector("#traza").getTotalLength() > 200
// prueba: crudo.length === 14
```

Mover un elemento hasta otro metido en un contenedor rotado:

```html
<div id="marco" style="position:absolute;left:100px;top:100px;width:100px;height:100px;transform:rotate(90deg)">
  <div id="hueco" style="position:absolute;left:10px;top:20px;width:20px;height:20px"></div>
</div>
<div id="bala" style="position:absolute;left:300px;top:300px;width:10px;height:10px"></div>
```

```js
const bala = document.querySelector("#bala");
const hueco = document.querySelector("#hueco");
const delta = MotionPathPlugin.getRelativePosition(bala, hueco, [0.5, 0.5], [0.5, 0.5]);
gsap.set(bala, { x: "+=" + delta.x, y: "+=" + delta.y });

const a = bala.getBoundingClientRect();
const b = hueco.getBoundingClientRect();
const punto = MotionPathPlugin.convertCoordinates(hueco, bala, { x: 0, y: 0 });
const matriz = MotionPathPlugin.convertCoordinates(hueco, bala);
const mismo = matriz.apply({ x: 0, y: 0 });
const global = MotionPathPlugin.getGlobalMatrix(hueco).apply({ x: 0, y: 0 });
// prueba: Math.abs(a.left + a.width / 2 - (b.left + b.width / 2)) < 0.5
// prueba: Math.abs(a.top + a.height / 2 - (b.top + b.height / 2)) < 0.5
// prueba: punto.x === mismo.x && punto.y === mismo.y
// prueba: Math.round(global.y) === 110
```

La longitud de una ruta se obtiene con `getLength`, que tiene página oficial pero **no está en los tipos**:

```js
const mp = MotionPathPlugin; // getLength no está tipado: en TS, (MotionPathPlugin as any)
const largo = mp.getLength("M0 0 L30 40");
// prueba: largo === 50
```

## Trampas

- **`getPositionOnPath` no exige caché previa.** La documentación dice que sí, pero el código la crea si falta. Llamar antes a `cacheRawPathMeasurements` solo adelanta el coste. [C] [E]
- **Tras cambiar el RawPath**, los datos de medida quedan obsoletos: vuelve a llamar a `cacheRawPathMeasurements()`. [O]
- **Selectores no.** `getGlobalMatrix`, `convertCoordinates`, `getRelativePosition` y `getAlignMatrix` piden elementos, no texto. [O]
- **`getRelativePosition` da distancias, no posiciones.** Aplícalas con `"+=" + delta.x`: las transformaciones que ya tuviera `desde` también cuentan. [O]
- **Las matrices son una foto.** Tras un resize o un cambio de layout hay que recalcular. [P]
- **`transformRawPath` también existe** en el objeto, sin tipos ni documentación; trátalo como interno. [E]
