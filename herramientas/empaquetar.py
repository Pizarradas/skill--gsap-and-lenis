#!/usr/bin/env python3
"""Crea dist/gsap-lenis-orquestacion-<gsap>-<lenis>.zip, con las dos bases. Uso: python empaquetar.py"""
import json, os, zipfile
from fichas import RAIZ, SISTEMAS

def main():
    v = [json.load(open(os.path.join(SISTEMAS[n], "datos", "api.json"), encoding="utf8"))["version"] for n in ("gsap", "lenis")]
    os.makedirs(os.path.join(RAIZ, "dist"), exist_ok=True)
    salida = os.path.join(RAIZ, "dist", f"gsap-lenis-orquestacion-{v[0]}-{v[1]}.zip")
    n = 0
    with zipfile.ZipFile(salida, "w", zipfile.ZIP_DEFLATED) as z:
        for b, ds, fs in os.walk(RAIZ):
            ds[:] = [d for d in ds if d not in ("dist", "_notas", "__pycache__", ".git")]
            for f in fs:
                p = os.path.join(b, f)
                z.write(p, os.path.join("gsap-lenis-orquestacion", os.path.relpath(p, RAIZ)))
                n += 1
    print(f"{salida}: {n} archivos")

if __name__ == "__main__":
    main()
