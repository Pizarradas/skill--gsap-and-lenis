#!/usr/bin/env python3
"""Crea dist/lenis-conocimiento-<versión>.zip, listo para copiar a otro proyecto. Uso: python empaquetar.py"""
import json, os, zipfile
from fichas import RAIZ, DATOS

def main():
    v = json.load(open(os.path.join(DATOS, "api.json"), encoding="utf8"))["version"]
    os.makedirs(os.path.join(RAIZ, "dist"), exist_ok=True)
    salida = os.path.join(RAIZ, "dist", f"lenis-conocimiento-{v}.zip")
    n = 0
    with zipfile.ZipFile(salida, "w", zipfile.ZIP_DEFLATED) as z:
        for b, ds, fs in os.walk(RAIZ):
            ds[:] = [d for d in ds if d not in ("dist", "_notas", "__pycache__", ".git")]
            for f in fs:
                p = os.path.join(b, f)
                z.write(p, os.path.join("lenis-conocimiento", os.path.relpath(p, RAIZ))); n += 1
    print(f"{salida}: {n} archivos")

if __name__ == "__main__":
    main()
