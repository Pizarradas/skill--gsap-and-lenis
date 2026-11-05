#!/usr/bin/env python3
"""Genera datos/api.json con la API pública de lenis, lenis/snap, lenis/react y lenis/vue, leyendo dist/*.d.ts.
Uso: python extraer_api.py [ruta/al/package]. Solo guarda nombres, no comentarios."""
import json, os, re, sys
from fichas import CACHE, DATOS

def limpiar(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    return re.sub(r"(?m)^\s*//.*$", "", s)

def bloques(texto):
    """(tipo, nombre, cuerpo) de cada class o type/interface con objeto literal de primer nivel."""
    for m in re.finditer(r"(?m)^(?:export\s+)?(?:declare\s+)?(class|type|interface)\s+(\w+)[^\n={]*(=\s*[^\n{]*)?\{", texto):
        i, prof = m.end(), 1
        while i < len(texto) and prof:
            prof += texto[i] == "{"
            prof -= texto[i] == "}"
            i += 1
        yield m.group(1), m.group(2), texto[m.end():i - 1]

def miembros(cuerpo):
    prof, linea, res = 0, "", []
    for c in cuerpo.replace("=>", "→"):
        if c in "{(<[": prof += 1
        if c in "})>]": prof -= 1
        if prof == 0 and c in ";\n":
            res.append(linea.strip()); linea = ""
        else:
            linea += c
    res.append(linea.strip())
    sal = {}
    for l in res:
        m = re.match(r"(private\s+|protected\s+)?(static\s+)?(readonly\s+)?(get\s+|set\s+)?([A-Za-z_$][\w$]*)(\?)?\s*([(:<])?", l)
        if not m or m.group(1) or m.group(5) in ("constructor",): continue
        if m.group(5).startswith("_") and not m.group(5).startswith("__experimental"): continue
        sal.setdefault(m.group(5), {"k": "metodo" if m.group(7) in ("(", "<") else "prop", "st": bool(m.group(2))})
    return sal

def main():
    pkg = sys.argv[1] if len(sys.argv) > 1 else os.path.join(CACHE, "pkg")
    salida = {}
    for f in ("lenis.d.ts", "lenis-snap.d.ts", "lenis-react.d.ts", "lenis-vue.d.ts"):
        t = limpiar(open(os.path.join(pkg, "dist", f), encoding="utf8").read())
        for tipo, nombre, cuerpo in bloques(t):
            m = miembros(cuerpo)
            if m and nombre not in salida:
                salida[nombre] = {"tipo": tipo, "archivo": f, "miembros": m}
        for fn in re.findall(r"(?m)^declare function (\w+)", t):
            salida.setdefault("funciones", {"tipo": "namespace", "archivo": f, "miembros": {}})["miembros"][fn] = {"k": "funcion", "st": True}
    v = json.load(open(os.path.join(pkg, "package.json"), encoding="utf8"))["version"]
    json.dump({"version": v, "generado_de": "lenis/dist/*.d.ts", "total": sum(len(x["miembros"]) for x in salida.values()), "tipos": salida},
              open(os.path.join(DATOS, "api.json"), "w", encoding="utf8", newline="\n"), ensure_ascii=False, indent=1)
    print(f"lenis {v}: {len(salida)} tipos, {sum(len(x['miembros']) for x in salida.values())} miembros")

if __name__ == "__main__":
    main()
