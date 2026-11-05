---
id: ver-repo-privado
titulo: Salir del repositorio privado de Club GSAP
capa: 15-versiones
tipo: guia
ambito: transversal
resumen: GSAP es gratuito y público en npm. Cómo retirar .npmrc, token y paquetes de Club como @gsap/business, con npm y Yarn, y limpiar cachés.
api: [gsap.registerPlugin]
relacionadas: [fun-licencia, fun-instalacion, ver-historial]
etiquetas: [npm, club, migracion, instalacion]
fuentes:
  - resources/private-repo-migration.md
estado: verificado
version: 3.15.1
---
# Salir del repositorio privado de Club GSAP

Con el apoyo de Webflow, el núcleo y todos los plugins son gratuitos y públicos en npm. Quien instalaba desde `npm.greensock.com` con token puede eliminar todo eso. [O]

El paquete `gsap` incluye los antiguos plugins de pago desde 3.13.0, cuando entraron en `dist/`, `src/` y `gsap/all`. Ver [historial](ver-historial.md). [C]

## Pasos

### npm

1. Quita de `.npmrc` las líneas del registro privado: [O]

```text
always-auth=true
//npm.greensock.com/:_authToken=TU-TOKEN
@gsap:registry=https://npm.greensock.com
```

2. Mira en `package.json` qué nivel de Club tienes y desinstálalo. En este ejemplo, `@gsap/business`. [O]

```bash
npm uninstall @gsap/business
```

3. Instala el paquete público. [O]

```bash
npm install gsap
```

### Yarn clásico

Mismo `.npmrc`, y luego: [O]

```bash
yarn remove @gsap/business
yarn add gsap
```

### Yarn Berry

Quita de `.yarnrc.yml` la entrada `npm.greensock.com` en `unsafeHttpWhitelist` y el bloque `npmScopes.gsap`. Después usa los mismos `yarn remove` y `yarn add`. [O]

### Actualiza los imports

Si importabas de `@gsap/business/...` o similar, cambia a `gsap/...`. Eso se deduce del cambio de paquete; la guía oficial no lo detalla. [P]

```js fragmento
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(SplitText, MorphSVGPlugin);
```

### Si persisten los problemas

Borra `node_modules` y el lockfile, para que nada apunte a los archivos antiguos. [O]

```bash
# npm
rm -rf node_modules package-lock.json && npm install

# Yarn clásico
rm -rf node_modules yarn.lock && yarn install

# Yarn Berry con PnP
yarn install --immutable
```

En Yarn Berry, revisa además `.yarn/cache` y `.yarn/unplugged`. [O]

### Etiquetas `<script>`

No necesitas cambiar nada: los plugins autoalojados de Club siguen funcionando. Si quieres, pásate a un CDN. [O]

## Trampas

- **Revoca el token.** Lo eliminado del repositorio sigue en el historial de git. Considéralo expuesto si era un repositorio compartido. [P]
- **CI y Docker.** El `.npmrc` suele estar en variables del pipeline o en el `Dockerfile`, no solo en el repositorio. Si sigue apuntando a `npm.greensock.com`, la instalación fallará allí. [P]
- **`@gsap/react` no se toca.** Es público y es otro paquete, con el mismo ámbito `@gsap`: si dejas `@gsap:registry` en `.npmrc`, npm lo buscará en el registro privado. Otra razón para quitar esa línea. [P]
- **`gsap-trial` ya no tiene sentido.** Desinstálalo: era la versión de prueba de los plugins, y sus declaraciones se han ido retirando de los tipos. [C]
- **Dos copias de gsap.** Si queda el paquete antiguo como dependencia transitiva, conviven dos núcleos. Comprueba con `npm ls gsap`. [P]
- **Licencia.** Gratuito no implica licencia abierta: rige la licencia estándar de GSAP. Ver [fun-licencia](../01-fundamentos/fun-licencia.md). [O]
