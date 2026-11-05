#!/usr/bin/env python3
"""Biblioteca común: localizar y leer fichas. Solo stdlib, Python >= 3.8."""
import glob, json, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATOS = os.path.join(RAIZ, "datos")
CACHE = os.environ.get("LENIS_CACHE") or os.path.join(os.path.expanduser("~"), ".cache", "lenis-conocimiento")
CORPUS = os.path.join(CACHE, "docs")
BASE_URL = "https://github.com/darkroomengineering/lenis/blob/main/"
PATRON_CAPA = re.compile(r"^\d\d-[a-z-]+$")
NO_FICHAS = {"README.md"}

def _valor(v):
    v = v.strip()
    if v.startswith("[") and v.endswith("]"):
        d = v[1:-1].strip()
        return [_valor(x) for x in re.split(r",\s*(?![^()]*\))", d)] if d else []
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        return v[1:-1]
    return v

def leer_front(texto):
    """Devuelve (meta, cuerpo). Subconjunto de YAML: clave: valor, [a, b] y listas con guion."""
    if not texto.startswith("---"):
        return None, texto
    fin = texto.find("\n---", 3)
    if fin < 0:
        return None, texto
    meta, clave = {}, None
    for linea in texto[3:fin].strip("\n").split("\n"):
        if not linea.strip():
            continue
        m = re.match(r"\s+-\s+(.*)$", linea) or re.match(r"-\s+(.*)$", linea)
        if m and clave:
            if not isinstance(meta[clave], list):
                meta[clave] = []
            meta[clave].append(_valor(m.group(1)))
            continue
        m = re.match(r"([a-zA-Z_]+):\s*(.*)$", linea)
        if m:
            clave = m.group(1)
            meta[clave] = _valor(m.group(2)) if m.group(2).strip() else []
    return meta, texto[fin + 4:].lstrip("\n")

def capas():
    return sorted(d for d in os.listdir(RAIZ) if PATRON_CAPA.match(d) and d != "00-indice"
                  and os.path.isdir(os.path.join(RAIZ, d)))

def fichas(capa=None):
    """Lista de dicts: ruta (relativa, con /), meta, cuerpo."""
    res = []
    for c in ([capa] if capa else capas()):
        for f in sorted(os.listdir(os.path.join(RAIZ, c))):
            if f.endswith(".md") and f not in NO_FICHAS:
                p = os.path.join(RAIZ, c, f)
                texto = open(p, encoding="utf8").read()
                meta, cuerpo = leer_front(texto)
                res.append({"ruta": c + "/" + f, "meta": meta or {}, "cuerpo": cuerpo})
    return res

def paginas_corpus():
    """Rutas relativas (con /) de todas las páginas oficiales en caché."""
    r = []
    for b, _, fs in os.walk(CORPUS):
        for f in fs:
            if f.endswith(".md"):
                r.append(os.path.relpath(os.path.join(b, f), CORPUS).replace(os.sep, "/"))
    return sorted(r)

def expandir_fuente(patron, paginas):
    """Una fuente puede ser ruta exacta, comodín (*) o URL externa."""
    if patron.startswith("http"):
        return [patron]
    if "*" in patron:
        rx = re.compile("^" + re.escape(patron).replace(r"\*", ".*") + "$")
        return [p for p in paginas if rx.match(p)]
    return [patron] if patron in paginas else []

def url_de(pagina):
    return pagina if pagina.startswith("http") else BASE_URL + pagina

def cargar_api():
    p = os.path.join(DATOS, "api.json")
    return json.load(open(p, encoding="utf8")) if os.path.exists(p) else None
