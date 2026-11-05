---
id: fun-licencia
titulo: Licencia estándar de GSAP
capa: 01-fundamentos
tipo: referencia
ambito: transversal
resumen: Resumen de la licencia estándar sin coste - qué permite, la restricción sobre constructores visuales sin código, revocación y cambios. No es asesoramiento legal.
relacionadas: [fun-que-es, fun-instalacion, ver-repo-privado]
etiquetas: [licencia, legal, webflow]
fuentes:
  - https://gsap.com/standard-license
  - resources/private-repo-migration.md
estado: verificado
version: 3.15.1
---
# Licencia estándar de GSAP

> **No es asesoramiento legal.** Esto es un resumen orientativo del texto publicado en <https://gsap.com/standard-license>, consultado el 2026-11-05 (fecha de vigencia del documento: 30 de abril de 2025; última modificación: 30 de mayo de 2025). El texto original es lo único que vincula y Webflow puede cambiarlo. Si hay dinero o un producto en juego, léelo entero y consulta a un profesional.

GSAP **no es software libre**: no usa MIT ni ninguna licencia de código abierto. El titular es Webflow, y `package.json` remite a esta licencia en lugar de declarar un identificador estándar. Es gratuita, también para uso comercial, pero con condiciones. [O] [C]

## Qué concede

| Punto | Contenido |
|---|---|
| Titular y objeto | Webflow concede la licencia sobre los "GSAP Products": todo software publicado en gsap.com o sitios sucesores, incluidos la biblioteca, plugins, herramientas y extensiones [O] |
| Alcance | No exclusiva y mundial; permite usar, reproducir, mostrar e implementar, **solo para los usos permitidos** [O] |
| Usos permitidos | Implementar o usar GSAP en cualquier sitio web, aplicación web o interfaz digital, por cualquier persona o entidad, incluidas empresas que compitan con Webflow en otras áreas [O] |
| Coste | Ninguno, también en proyectos comerciales, incluidos los plugins antes exclusivos para miembros como SplitText y MorphSVG [O] |
| Propiedad | Copyright, patentes, marcas y secretos comerciales siguen siendo de Webflow; no se transfiere ninguna propiedad [O] |

## Qué prohíbe

No puedes [O]:

1. **Hacer usos prohibidos sin consentimiento previo por escrito.** Se define como usar GSAP en herramientas que permitan construir animaciones visuales sin código, cuando ello fomente, induzca o ayude materialmente a crear una solución que compita con las capacidades de construcción visual de animaciones de Webflow.
2. **Hacer ingeniería inversa de GSAP para crear productos competidores.** Producto competidor es cualquier software, herramienta o servicio que permita crear, editar o gestionar animaciones mediante una interfaz o constructor visual similar a Webflow.
3. **Quitar o alterar avisos de propiedad o marca** de los productos GSAP.

La frontera real es el **constructor visual sin código**, no el hecho de animar ni de cobrar por tu producto.

## Revocación, cambios y marco legal

| Cláusula | Efecto |
|---|---|
| **Terminación** | Webflow puede terminar la licencia y revocar el acceso, a su discreción, si incumples los términos. Tras ello debes dejar de usar GSAP y destruir todas las copias [O] |
| **Modificación** | Webflow puede cambiar la licencia publicando el texto revisado, siempre que eso no degrade materialmente la seguridad, integridad o funcionalidad. Seguir usando GSAP implica aceptar el cambio [O] |
| **Si no aceptas un cambio** | No puedes usar versiones publicadas tras la fecha de vigencia del cambio, ni actualizaciones de versiones previas. Puedes seguir con las versiones anteriores bajo los términos que tenían [O] |
| **Marco** | La licencia se integra en los Términos de Servicio de Webflow; si chocan, prevalece la licencia en lo relativo a GSAP [O] |
| **Sin renuncia** | Que Webflow no haga valer una cláusula no le impide hacerlo después [O] |

Matiz sobre "revocable": es revocable, pero el texto liga esa facultad al **incumplimiento**; la discreción se refiere a la decisión de actuar ante él, no a retirarla sin causa. Aun así, quien dependa de GSAP debe contar con que la interpretación del incumplimiento la hace primero Webflow y con que los términos futuros pueden cambiar. [O] [P]

## Preguntas frecuentes oficiales

- **Herramientas de IA.** La propia página dice que generar código GSAP con herramientas de IA (nombra ChatGPT, Cursor, Lovable y Webstudio) no es un uso prohibido. [O]
- **Plugins de WordPress, temas y herramientas de nicho con interfaz visual.** Webflow dice querer fomentar herramientas visuales sobre GSAP que no compitan directamente con sus capacidades, e invita a contactar en caso de duda. No es una autorización general: es una invitación a consultar. [O]

## Aplicación práctica

Lectura de este sistema, **no** del texto oficial; en los casos dudosos, pregunta a Webflow [P]:

| Caso | Lectura |
|---|---|
| Web corporativa, tienda, landing de cliente | Permitido: uso en sitio web |
| SaaS con suscripción de pago que usa GSAP en su interfaz | Permitido: la licencia vigente ya no distingue si el usuario final paga |
| Generar código GSAP con un agente de IA | Permitido por la FAQ |
| Tema o plantilla comercial que incluye animaciones escritas con GSAP | Parece permitido; no hay interfaz de construcción para el usuario |
| Plugin de WordPress con panel para configurar animaciones GSAP | Zona gris: depende de si compite; consulta |
| Editor visual de animaciones sin código, general, como producto | Prohibido sin consentimiento escrito si compite con Webflow |
| Editor visual interno, no comercializado | El texto no exime usos internos; consulta |
| Biblioteca npm propia que usa GSAP | La licencia no regula de forma expresa la redistribución; declarar `gsap` como `peerDependency` evita volver a distribuirlo |
| Modificar el fuente de GSAP | La licencia no menciona la modificación entre los actos concedidos; no asumas que está permitido |

## Trampas

- **Información desactualizada.** Muchos artículos, respuestas y asistentes repiten el modelo antiguo: "si el usuario final paga necesitas Club GSAP Business". Ese texto ya no rige. El HTML de la página aún lo conserva **dentro de comentarios**, sin mostrarse, junto a un aviso de uso bajo tu propio riesgo; si extraes la página con un script o un agente puede colarse como si fuera vigente. Lo que cuenta es el texto visible. [C]
- **Garantías.** El texto visible de la licencia no incluye una cláusula de garantía propia; remite a los Términos de Servicio de Webflow, que este sistema no ha revisado. No afirmes nada sobre garantías sin leerlos. [O]
- **"Gratis" no es "libre".** No asumas los derechos de una licencia MIT: redistribuir, modificar o crear obras derivadas no aparecen concedidos de forma expresa. [O] [P]
- **La cabecera de los archivos dice GreenSock** (`Copyright 2008-2026, GreenSock`) y remite a la misma URL de licencia; la licencia nombra a Webflow como concedente. No tiene consecuencias prácticas, pero es la razón por la que ambos nombres aparecen. [C]
- **Mantén los avisos.** Un minificador configurado para eliminar comentarios `@license` puede quitar avisos de propiedad, y eso toca la tercera prohibición. Conserva esos comentarios. [P]
- **Audita tus dependencias si haces herramientas de animación.** La restricción afecta a qué construyes con GSAP, no solo a cómo lo incluyes. [P]
