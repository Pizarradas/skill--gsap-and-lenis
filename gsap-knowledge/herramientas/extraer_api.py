#!/usr/bin/env python3
"""Genera datos/api.json: inventario de la API pública a partir de los .d.ts del paquete gsap.
Uso: python extraer_api.py [ruta/al/package]   (solo stdlib, Python >= 3.8)
Solo guarda nombres y firmas abreviadas (hechos), no comentarios."""
import json, os, re, sys
from fichas import CACHE, DATOS

NOMBRE = r"[A-Za-z_$][\w$]*"
IGNORADAS = {"constructor"}

def sin_comentarios(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    return re.sub(r"(?m)//.*$", "", s)

def analizar(texto, archivo, salida):
    pila = []
    i, n = 0, len(texto)
    stmt = ""
    prof_par = 0
    while i < n:
        c = texto[i]
        if c in "\"'`":
            j = i + 1
            while j < n and texto[j] != c:
                j += 2 if texto[j] == "\\" else 1
            stmt += texto[i:j + 1]; i = j + 1; continue
        if c in "(<[":
            prof_par += 1 if c != "<" else 0
        elif c in ")]":
            prof_par -= 1
        if prof_par == 0 and c == "{":
            cab = stmt.strip()
            m = re.search(r"\b(class|interface|namespace|module)\s+([\w.\"'/-]+)", cab)
            if m and not re.search(r"[:=]\s*$", cab):
                nombre = m.group(2).strip("\"'")
                pila.append((m.group(1), nombre))
                registrar_tipo(pila, salida, archivo)
                stmt = ""; i += 1; continue
            # objeto de tipo en línea: saltarlo entero
            prof = 1; j = i + 1
            while j < n and prof:
                prof += texto[j] == "{"
                prof -= texto[j] == "}"
                j += 1
            stmt += " {…} "; i = j; continue
        if prof_par == 0 and c == "}":
            if pila: pila.pop()
            stmt = ""; i += 1; continue
        if prof_par == 0 and c in ";\n":
            s = stmt.strip()
            sigue = s.endswith((",", "|", "&", ":", "=", "=>", "(", "extends"))
            if c == ";" or (s and not sigue):
                if s: miembro(s, pila, salida, archivo)
                stmt = ""
            else:
                stmt += " "
            i += 1; continue
        stmt += c; i += 1

def ruta(pila):
    return ".".join(p[1] for p in pila if p[1] not in ("gsap.core",) )

def limpiar(q):
    q = re.sub(r"^gsap\.core\.", "", q)
    q = re.sub(r"^gsap\.(?=[A-Z])", "", q) if False else q
    q = re.sub(r"\bgsap\.core\.", "", q)
    return q

def registrar_tipo(pila, salida, archivo):
    t, nombre = pila[-1]
    if t in ("class", "interface"):
        q = limpiar(ruta(pila))
        salida.setdefault(q, {"tipo": t, "archivo": archivo, "miembros": {}})

def miembro(s, pila, salida, archivo):
    if not pila: return
    t = pila[-1][0]
    s = re.sub(r"^(export|declare|public|readonly)\s+", "", s)
    s = re.sub(r"^(export|declare|public|readonly)\s+", "", s)
    if t in ("namespace", "module"):
        m = re.match(r"(function|const|let|var)\s+(" + NOMBRE + ")", s)
        if not m: return
        q = limpiar(ruta(pila))
        d = salida.setdefault(q, {"tipo": "namespace", "archivo": archivo, "miembros": {}})
        d["miembros"].setdefault(m.group(2), {"k": "funcion" if m.group(1) == "function" else "const", "st": True})
        return
    st = False
    m = re.match(r"static\s+", s)
    if m: st = True; s = s[m.end():]
    s = re.sub(r"^readonly\s+", "", s)
    m = re.match(r"(?:get\s+|set\s+)?([\"']?)(" + NOMBRE + r")\1(\?)?\s*([(:<]?)", s)
    if not m: return
    nombre = m.group(2)
    if nombre in IGNORADAS: return
    q = limpiar(ruta(pila))
    d = salida.setdefault(q, {"tipo": t, "archivo": archivo, "miembros": {}})
    k = "metodo" if m.group(4) in ("(", "<") else "prop"
    d["miembros"].setdefault(nombre, {"k": k, "st": st})

def main():
    pkg = sys.argv[1] if len(sys.argv) > 1 else os.path.join(CACHE, "pkg")
    tipos = os.path.join(pkg, "types")
    salida = {}
    archivos = sorted(f for f in os.listdir(tipos) if f.endswith(".d.ts"))
    for f in archivos:
        analizar(sin_comentarios(open(os.path.join(tipos, f), encoding="utf8").read()), f, salida)
    u = os.path.join(tipos, "utils")
    for f in sorted(os.listdir(u)):
        if f.endswith(".d.ts"):
            analizar(sin_comentarios(open(os.path.join(u, f), encoding="utf8").read()), "utils/" + f, salida)
    version = json.load(open(os.path.join(pkg, "package.json"), encoding="utf8"))["version"]
    salida = {k: v for k, v in sorted(salida.items()) if v["miembros"]}
    total = sum(len(v["miembros"]) for v in salida.values())
    json.dump({"version": version, "generado_de": "gsap/types/*.d.ts", "total": total, "tipos": salida},
              open(os.path.join(DATOS, "api.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1, sort_keys=False)
    print(f"gsap {version}: {len(salida)} tipos, {total} miembros")

if __name__ == "__main__":
    main()
