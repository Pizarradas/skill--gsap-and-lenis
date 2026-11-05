#!/usr/bin/env python3
"""Genera la tabla de orq-por-tarea, 00-indice/mapa.md y 00-indice/reglas.md. Uso: python generar_indices.py [--comprobar]"""
import json, os, re, sys
from fichas import RAIZ, CAPAS, fichas, reglas
from decidir import catalogo

ETIQ = {"suave": "pide suavizado", "nativo": "veta suavizado", "lenis": "exige Lenis", "smoother": "exige ScrollSmoother",
        "smoother-pref": "prefiere ScrollSmoother", "no-smoother": "descarta ScrollSmoother", "efectos": "pide ScrollSmoother si es posible"}
GSAP = {True: "Sí", False: "No"}

def tabla():
    s = []
    for g in catalogo()[0]:
        s += [f"\n### {g['grupo']}\n", "| Necesidad | Qué es | Con lo mínimo | GSAP | Scroll | Lee |", "|---|---|---|---|---|---|"]
        for n in g["necesidades"]:
            sc = ", ".join(ETIQ[x] for x in n["scroll"] if not (x == "suave" and len(n["scroll"]) > 1)) or "indiferente"
            s.append(f"| `{n['id']}` | {n['texto']} | {n['como']} | {GSAP[n['gsap']]} | {sc} | {', '.join('`'+x+'`' for x in n['lee']) or '—'} |")
    return "\n".join(s) + "\n"

def mapa():
    s = ["# Mapa", "", "GENERADO por `herramientas/generar_indices.py`.", ""]
    fs = fichas()
    for c in CAPAS:
        s += [f"## {c}", ""]
        for f in sorted((x for x in fs if x["meta"]["capa"] == c), key=lambda x: x["meta"]["id"]):
            m = f["meta"]
            s.append(f"- [`{m['id']}`](../{f['ruta']}) — {m['resumen']}")
        s.append("")
    return "\n".join(s)

def reglas_md():
    s = ["# Reglas", "", "GENERADO desde `datos/reglas.json`, que es la fuente de verdad. **Bloqueante** está demostrado por ejecución; **aviso** merece revisión.", "",
         "| Id | Severidad | Perfiles | Regla | Corrección | Evidencia |", "|---|---|---|---|---|---|"]
    for r in reglas():
        c = r["correccion"].replace("|", "\\|").replace("\n", " ")
        s.append(f"| {r['id']} | {r['severidad']} | {', '.join(r['perfiles'])} | {r['titulo'].replace('|', chr(92)+'|')} | {c} | [`{r['evidencia']}`](../{next(f['ruta'] for f in fichas() if f['meta']['id'] == r['evidencia'])}) |")
    return "\n".join(s) + "\n"

def main():
    p = os.path.join(RAIZ, "01-decidir", "orq-por-tarea.md")
    t = open(p, encoding="utf8").read()
    nuevo = re.sub(r"<!-- GENERADO: necesidades -->.*?<!-- FIN GENERADO -->", lambda m: "<!-- GENERADO: necesidades -->" + tabla() + "<!-- FIN GENERADO -->", t, flags=re.S)
    salidas = {p: nuevo, os.path.join(RAIZ, "00-indice", "mapa.md"): mapa(), os.path.join(RAIZ, "00-indice", "reglas.md"): reglas_md()}
    dif = []
    for r, c in salidas.items():
        a = open(r, encoding="utf8").read() if os.path.exists(r) else None
        if a != c:
            dif.append(os.path.relpath(r, RAIZ))
            if "--comprobar" not in sys.argv:
                open(r, "w", encoding="utf8", newline="\n").write(c)
    print("desactualizados: " + ", ".join(dif) if dif and "--comprobar" in sys.argv else f"{len(salidas)} índices al día")
    sys.exit(1 if dif and "--comprobar" in sys.argv else 0)

if __name__ == "__main__":
    main()
