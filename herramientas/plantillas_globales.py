#!/usr/bin/env python3
"""Genera plantillas/globales/<nombre>.js: cada plantilla lista para <script> clásico, sin import ni export.
Uso: python3 plantillas_globales.py [--comprobar] [--probar] [--firefox]
  sin opciones   escribe plantillas/globales/
  --comprobar    no escribe; falla si alguna copia generada no coincide con su plantilla
  --probar       ejecuta cada *.prueba.js de plantillas/ contra la copia global, en navegador real
Adaptado de lenis-knowledge/herramientas/plantillas_globales.py: aquí las plantillas no importan nada, porque
reciben las bibliotecas por parámetro. La conversión es estricta: un import o export que no reconozca detiene
el proceso. La fuente de verdad es siempre plantillas/<nombre>.js.
"""
import argparse, glob, os, re, sys
from fichas import RAIZ

PLANTILLAS = os.path.join(RAIZ, "plantillas")
GLOBALES = os.path.join(PLANTILLAS, "globales")
EXPORTA = re.compile(r"^export function (\w+)\(")

def convertir(ruta):
    """Devuelve (nombre exportado, código de la copia global)."""
    base = os.path.basename(ruta)
    nombre, cuerpo = None, []
    for n, linea in enumerate(open(ruta, encoding="utf8").read().split("\n"), 1):
        e = EXPORTA.match(linea)
        if e:
            if nombre: raise SystemExit(f"{base}:{n}: más de una exportación")
            nombre = e[1]
            linea = linea[len("export "):]
        elif re.match(r"\s*(import|export)\b", linea):
            raise SystemExit(f"{base}:{n}: import o export no reconocido: {linea}")
        cuerpo.append(linea)
    if not nombre: raise SystemExit(f"{base}: no exporta ninguna función")
    texto = "\n".join("  " + l if l else "" for l in "\n".join(cuerpo).strip().split("\n"))
    return nombre, (
        f"/* Generado por herramientas/plantillas_globales.py desde plantillas/{base}. No lo edites a mano.\n"
        f"   Expone Plantillas.{nombre}. Las bibliotecas se le pasan por parámetro. */\n"
        '(function () {\n  "use strict";\n\n'
        f"{texto}\n\n"
        f"  (window.Plantillas = window.Plantillas || {{}}).{nombre} = {nombre};\n}})();\n"
    )

def origenes():
    rutas = [p for p in sorted(glob.glob(os.path.join(PLANTILLAS, "*.js"))) if not p.endswith(".prueba.js")]
    if not rutas: raise SystemExit("no hay plantillas")
    return rutas

def probar(firefox):
    import probar_bloques as pb
    casos = []
    for ruta in origenes():
        base = ruta[:-3]
        nombre, codigo = convertir(ruta)
        prueba = open(base + ".prueba.js", encoding="utf8").read()
        marcado = open(base + ".html", encoding="utf8").read() if os.path.exists(base + ".html") else None
        casos.append({"ruta": f"plantillas/globales/{os.path.basename(ruta)}", "linea": 1, "html": marcado,
                      "code": f"{codigo}\nconst {nombre} = Plantillas.{nombre};\n{prueba}"})
    pb.recoger = lambda a: casos
    sys.argv = ["probar_bloques.py", "--espera", "9000"] + (["--firefox"] if firefox else [])  # una sola prueba larga: presupuesto de tiempo virtual holgado
    pb.main()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--comprobar", action="store_true"); ap.add_argument("--probar", action="store_true")
    ap.add_argument("--firefox", action="store_true")
    a = ap.parse_args()
    if a.probar:
        probar(a.firefox)
        return
    generadas = {os.path.join(GLOBALES, os.path.basename(r)): convertir(r)[1] for r in origenes()}
    if a.comprobar:
        actuales = set(glob.glob(os.path.join(GLOBALES, "*.js")))
        malas = [p for p, c in generadas.items()
                 if not os.path.exists(p) or open(p, encoding="utf8", newline="").read() != c]
        malas += sorted(actuales - set(generadas))
        for p in malas: print("DESFASADA", os.path.relpath(p, RAIZ))
        print(f"{len(generadas) - len(malas)}/{len(generadas)} copias globales al día")
        sys.exit(1 if malas else 0)
    os.makedirs(GLOBALES, exist_ok=True)
    for p, c in generadas.items():
        with open(p, "w", encoding="utf8", newline="") as f: f.write(c)
    print(f"{len(generadas)} copias globales en plantillas/globales/")

if __name__ == "__main__":
    main()
