---
id: fun-licencia
titulo: Licencia de Lenis
capa: 01-fundamentos
tipo: referencia
ambito: transversal
resumen: Lenis y sus paquetes se distribuyen con licencia MIT: uso comercial libre, conservando el aviso de copyright en las copias.
api: []
requiere: []
relacionadas: [fun-que-es, fun-instalacion]
etiquetas: [licencia, mit, legal]
fuentes:
  - README.md
estado: verificado
version: 1.3.27
---
# Licencia de Lenis

Lenis se publica con licencia **MIT**. `package.json` declara `"license": "MIT"` y el paquete incluye `LICENSE`, con el aviso `Copyright (c) 2024 darkroom.engineering`. [C]

| Pregunta | Respuesta |
|---|---|
| ¿Uso comercial? | Sí, sin pago ni registro [C] |
| ¿Modificarlo o redistribuirlo? | Sí [C] |
| ¿Qué obliga? | Incluir el aviso de copyright y el texto de la licencia en las copias o partes sustanciales [C] |
| ¿Garantía? | Ninguna: se entrega "tal cual" [C] |
| ¿Cubre `lenis/snap`, `lenis/react`, `lenis/vue`? | Sí: viajan en el mismo paquete npm, bajo el mismo `LICENSE` [C] |

## Consecuencias prácticas

- **Si lo empaquetas**, la obligación suele cumplirse conservando los avisos de licencia del proceso de compilación o con un archivo de atribuciones. Esto es criterio práctico, no asesoría jurídica. [P]
- **El nombre y la marca no se licencian.** MIT cubre el software; no presentes un producto como si fuera de darkroom.engineering. [P]
- **Este sistema** adapta la documentación oficial en español con estructura y ejemplos propios, conservando la referencia a la fuente en `fuentes`.
