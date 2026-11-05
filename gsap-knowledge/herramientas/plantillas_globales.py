#!/usr/bin/env python3
"""Genera plantillas/globales/<nombre>.js: cada plantilla lista para <script> clásico, sin import ni export.
Uso: python3 plantillas_globales.py [--comprobar] [--probar] [--navegador ruta]
  sin opciones   escribe plantillas/globales/
  --comprobar    no escribe; falla si alguna copia generada no coincide con su plantilla
  --probar       ejecuta cada *.prueba.js de plantillas/ contra la copia global, en Chrome real
La conversión es estricta: una línea import o export que no reconozca detiene el proceso en vez de
producir un archivo roto. La fuente de verdad es siempre plantillas/<nombre>.js.
"""
import argparse, glob, os, re, sys
from fichas import RAIZ

PLANTILLAS = os.path.join(RAIZ, "plantillas")
GLOBALES = os.path.join(PLANTILLAS, "globales")
IMP_NUCLEO = re.compile(r'^import gsap from "gsap";$')
IMP_PLUGIN = re.compile(r'^import \{ (\w+) \} from "gsap/(\w+)";$')
EXPORTA = re.compile(r"^export function (\w+)\(")

def convertir(ruta):
    """Devuelve (nombre exportado, código de la copia global)."""
    base = os.path.basename(ruta)
    plugins, nombre, cuerpo = [], None, []
    for n, linea in enumerate(open(ruta, encoding="utf8").read().split("\n"), 1):
        p, e = IMP_PLUGIN.match(linea), EXPORTA.match(linea)
        if IMP_NUCLEO.match(linea):
            continue
        if p:
            if p[1] != p[2]: raise SystemExit(f"{base}:{n}: la importación renombra el plugin")
            plugins.append(p[1])
            continue
        if e:
            if nombre: raise SystemExit(f"{base}:{n}: más de una exportación")
            nombre = e[1]
            linea = linea[len("export "):]
        elif re.match(r"\s*(import|export)\b", linea):
            raise SystemExit(f"{base}:{n}: import o export no reconocido: {linea}")
        cuerpo.append(linea)
    if nombre != base[:-3]:
        raise SystemExit(f"{base}: debe exportar una función llamada como el archivo")
    requiere = ", ".join(["gsap"] + plugins)
    texto = "\n".join("  " + l if l else "" for l in "\n".join(cuerpo).strip().split("\n"))
    return nombre, (
        f"/* Generado por herramientas/plantillas_globales.py desde plantillas/{base}. No lo edites a mano.\n"
        f"   Carga antes, con <script>: {requiere}. Expone Plantillas.{nombre}. */\n"
        '(function () {\n  "use strict";\n\n'
        f"{texto}\n\n"
        f"  (window.Plantillas = window.Plantillas || {{}}).{nombre} = {nombre};\n}})();\n"
    )

def origenes():
    rutas = [p for p in sorted(glob.glob(os.path.join(PLANTILLAS, "*.js"))) if not p.endswith(".prueba.js")]
    if not rutas: raise SystemExit("no hay plantillas")
    return rutas

def probar(navegador):
    import probar_bloques as pb
    casos = []
    for ruta in origenes():
        base = ruta[:-3]
        nombre, codigo = convertir(ruta)
        prueba = open(base + ".prueba.js", encoding="utf8").read()
        marcado = open(base + ".html", encoding="utf8").read() if os.path.exists(base + ".html") else None
        casos.append({"ruta": f"plantillas/globales/{nombre}.js", "linea": 1, "html": marcado,
                      "code": f"{codigo}\nconst {nombre} = Plantillas.{nombre};\n{prueba}"})
    pb.recoger = lambda a: casos
    sys.argv = ["probar_bloques.py"] + (["--navegador", navegador] if navegador else [])
    pb.main()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--comprobar", action="store_true"); ap.add_argument("--probar", action="store_true")
    ap.add_argument("--navegador")
    a = ap.parse_args()
    generadas = {os.path.join(GLOBALES, os.path.basename(r)): convertir(r)[1] for r in origenes()}
    if a.comprobar:
        actuales = set(glob.glob(os.path.join(GLOBALES, "*.js")))
        malas = [p for p, c in generadas.items()
                 if not os.path.exists(p) or open(p, encoding="utf8", newline="").read() != c]
        malas += sorted(actuales - set(generadas))
        for p in malas: print("DESFASADA", os.path.relpath(p, RAIZ))
        print(f"{len(generadas) - len(malas)}/{len(generadas)} copias globales al día")
        sys.exit(1 if malas else 0)
    if a.probar:
        probar(a.navegador)
        return
    os.makedirs(GLOBALES, exist_ok=True)
    for p, c in generadas.items():
        with open(p, "w", encoding="utf8", newline="") as f: f.write(c)
    print(f"{len(generadas)} copias globales en plantillas/globales/")

if __name__ == "__main__":
    main()
