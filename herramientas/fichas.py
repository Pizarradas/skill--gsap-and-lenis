#!/usr/bin/env python3
"""Biblioteca común de la capa de orquestación. Solo stdlib, Python >= 3.8."""
import json, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATOS = os.path.join(RAIZ, "datos")
HOME = os.path.expanduser("~")
CACHE = os.environ.get("LENIS_CACHE") or os.path.join(HOME, ".cache", "lenis-conocimiento")
CACHE_GSAP = os.environ.get("GSAP_CACHE") or os.path.join(HOME, ".cache", "gsap-conocimiento")
SISTEMAS = {"gsap": os.path.join(RAIZ, "gsap-knowledge"), "lenis": os.path.join(RAIZ, "lenis-knowledge")}
CAPAS = ["01-decidir", "02-reglas", "03-ciclo", "04-combinaciones"]

def _valor(v):
    v = v.strip()
    if v.startswith("[") and v.endswith("]"):
        d = v[1:-1].strip()
        return [_valor(x) for x in re.split(r",\s*", d)] if d else []
    return v[1:-1] if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'" else v

def leer_front(texto):
    if not texto.startswith("---"):
        return None, texto
    fin = texto.find("\n---", 3)
    if fin < 0:
        return None, texto
    meta, clave = {}, None
    for l in texto[3:fin].strip("\n").split("\n"):
        if not l.strip():
            continue
        m = re.match(r"\s*-\s+(.*)$", l)
        if m and clave:
            if not isinstance(meta[clave], list):
                meta[clave] = []
            meta[clave].append(_valor(m.group(1)))
            continue
        m = re.match(r"([a-zA-Z_]+):\s*(.*)$", l)
        if m:
            clave = m.group(1)
            meta[clave] = _valor(m.group(2)) if m.group(2).strip() else []
    return meta, texto[fin + 4:].lstrip("\n")

def fichas(capa=None):
    res = []
    for c in ([capa] if capa else CAPAS):
        d = os.path.join(RAIZ, c)
        for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
            if f.endswith(".md") and f != "README.md":
                meta, cuerpo = leer_front(open(os.path.join(d, f), encoding="utf8").read())
                res.append({"ruta": c + "/" + f, "meta": meta or {}, "cuerpo": cuerpo})
    return res

def ids_sistema(nombre):
    """ids de las fichas de una de las dos bases, leídos de su índice generado."""
    return {x["id"]: x["ruta"] for x in json.load(open(os.path.join(SISTEMAS[nombre], "datos", "indice.json"), encoding="utf8"))["fichas"]}

def api_sistema(nombre):
    return json.load(open(os.path.join(SISTEMAS[nombre], "datos", "api.json"), encoding="utf8"))

def reglas():
    return json.load(open(os.path.join(DATOS, "reglas.json"), encoding="utf8"))["reglas"]
