#!/usr/bin/env python3
"""Vigila la deriva: si cambia una base, dice qué fichas y reglas de orquestación hay que volver a ejecutar.
Uso: python comprobar_bases.py            compara con datos/bases.lock.json; sale con 1 si hay cambios
     python comprobar_bases.py --fijar    guarda el estado actual, tras revisar y volver a probar"""
import hashlib, json, os, sys
from fichas import RAIZ, DATOS, SISTEMAS, fichas

LOCK = os.path.join(DATOS, "bases.lock.json")

def estado():
    s = {}
    for nombre, raiz in SISTEMAS.items():
        idx = json.load(open(os.path.join(raiz, "datos", "indice.json"), encoding="utf8"))
        lista = idx if isinstance(idx, list) else idx.get("fichas", idx)
        api = json.load(open(os.path.join(raiz, "datos", "api.json"), encoding="utf8"))
        h = {}
        for b, ds, fs in os.walk(raiz):
            ds[:] = [d for d in ds if d not in ("dist", "_notas", "__pycache__", ".git", "herramientas", "adaptadores", "datos", "00-indice")]
            for f in fs:
                if f.endswith(".md"):
                    p = os.path.join(b, f)
                    # Los README se repiten por capa: el nombre solo no los distingue
                    clave = os.path.relpath(p, raiz).replace(os.sep, "/")[:-3] if f == "README.md" else f[:-3]
                    h[clave] = hashlib.sha256(open(p, "rb").read().replace(b"\r\n", b"\n")).hexdigest()[:16]
        s[nombre] = {"version": api.get("version"), "fichas": len(lista), "hash": h}
    return s

def main():
    act = estado()
    if "--fijar" in sys.argv:
        json.dump(act, open(LOCK, "w", encoding="utf8"), ensure_ascii=False, indent=0, sort_keys=True)
        print("fijado:", {k: v["version"] for k, v in act.items()})
        return
    if not os.path.exists(LOCK):
        print("INCOMPLETO: falta datos/bases.lock.json; ejecuta --fijar tras verificar")
        sys.exit(1)
    prev = json.load(open(LOCK, encoding="utf8"))
    cambios = 0
    for n, a in act.items():
        p = prev[n]
        if a["version"] != p["version"]:
            cambios += 1
            print(f"{n}: versión {p['version']} → {a['version']}: repite TODAS las pruebas y el laboratorio; los pines de plantillas y `version` de las fichas")
        tocadas = {i for i in set(a["hash"]) | set(p["hash"]) if a["hash"].get(i) != p["hash"].get(i)}
        for f in fichas():
            cita = sorted(tocadas & {x.split(":", 1)[1] for x in f["meta"].get("fuentes", []) or [] if x.startswith(n + ":")})
            if cita:
                cambios += 1
                print(f"{f['ruta']}: cambió {n}:{', '.join(cita)}")
        libres = sorted(tocadas - {x.split(":", 1)[1] for f in fichas() for x in f["meta"].get("fuentes", []) or [] if x.startswith(n + ":")})
        if libres:
            cambios += 1
            print(f"{n}: cambiaron, sin ficha que las cite: {', '.join(libres)}. Revisa 02-reglas/orq-anulaciones.md")
    print("bases sin cambios" if not cambios else f"{cambios} puntos por revisar; tras resolverlos, --fijar")
    sys.exit(1 if cambios else 0)

if __name__ == "__main__":
    main()
