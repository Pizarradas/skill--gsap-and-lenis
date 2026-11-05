#!/usr/bin/env python3
"""Valida la capa de orquestación: estructura, referencias a las dos bases, reglas y coherencia.
Uso: python validar.py [--sin-sintaxis]. Sale con 1 si hay errores."""
import json, os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
from fichas import RAIZ, fichas, ids_sistema, api_sistema, reglas, SISTEMAS
from probar_bloques import bloques

OBLIG = ["id", "titulo", "capa", "tipo", "resumen", "fuentes", "estado", "version"]
SEV = {"bloqueante", "aviso"}
PERFILES = {"ninguno", "gsap", "gsap-smoother", "lenis", "gsap+lenis"}

def main():
    e, av = [], []
    gs, ls = ids_sistema("gsap"), ids_sistema("lenis")
    todas = fichas()
    ids = {f["meta"].get("id"): f["ruta"] for f in todas}
    for f in todas:
        m, r = f["meta"], f["ruta"]
        for k in OBLIG:
            if not m.get(k): e.append(f"{r}: falta '{k}'")
        if m.get("id") != os.path.basename(r)[:-3]: e.append(f"{r}: id ≠ archivo")
        if m.get("capa") != r.split("/")[0]: e.append(f"{r}: capa incorrecta")
        if f["cuerpo"].count("\n") > 320: e.append(f"{r}: más de 320 líneas")
        for x in m.get("fuentes", []) or []:
            s, _, i = x.partition(":")
            if s == "gsap" and i not in gs: e.append(f"{r}: ficha gsap inexistente '{i}'")
            elif s == "lenis" and i not in ls: e.append(f"{r}: ficha lenis inexistente '{i}'")
            elif s not in ("gsap", "lenis", "lab"): e.append(f"{r}: fuente '{x}': usa gsap:id, lenis:id o lab:ruta")
        for x in m.get("relacionadas", []) or []:
            if x not in ids: e.append(f"{r}: relacionada desconocida '{x}'")
        for en in re.findall(r"\]\(([^)\s#]+\.(?:md|js))(?:#[^)]*)?\)", f["cuerpo"]):
            if not en.startswith("http") and not os.path.exists(os.path.normpath(os.path.join(RAIZ, r.split("/")[0], en))):
                e.append(f"{r}: enlace roto {en}")
        for lang, info, code, l in bloques(f["cuerpo"]):
            if not lang: e.append(f"{r}: L{l} bloque sin lenguaje")
        if m.get("estado") == "verificado" and "[E]" in f["cuerpo"] and "// prueba:" not in f["cuerpo"] and "laboratorio" not in f["cuerpo"].lower():
            e.append(f"{r}: marca [E] sin prueba ni laboratorio")
    rs = reglas()
    vistos = set()
    for x in rs:
        i = x.get("id")
        if i in vistos: e.append(f"regla duplicada {i}")
        vistos.add(i)
        for k in ("id", "titulo", "severidad", "perfiles", "correccion", "evidencia"):
            if not x.get(k): e.append(f"regla {i}: falta '{k}'")
        if x.get("severidad") not in SEV: e.append(f"regla {i}: severidad")
        if set(x.get("perfiles", [])) - PERFILES: e.append(f"regla {i}: perfil desconocido")
        ev = x.get("evidencia", "")
        pf = next((f["meta"].get("perfiles", []) for f in todas if f["meta"].get("id") == ev), [])
        if set(x.get("perfiles", [])) - set(pf): e.append(f"regla {i}: la ficha {ev} no cubre {sorted(set(x.get('perfiles', [])) - set(pf))}")
        if ev not in ids: e.append(f"regla {i}: evidencia '{ev}' no es una ficha")
        elif i not in next(f for f in todas if f["meta"].get("id") == ev)["cuerpo"]:
            e.append(f"regla {i}: la ficha {ev} no la menciona")
    usadas = set(re.findall(r"\bO\d{2}\b", " ".join(f["cuerpo"] for f in todas)))
    for u in sorted(usadas - vistos): e.append(f"regla citada sin definir: {u}")
    if "--sin-sintaxis" not in sys.argv:
        node = shutil.which("node") or "/mnt/c/Program Files/nodejs/node.exe"
        if os.path.exists(node) or shutil.which(node):
            d = tempfile.mkdtemp(prefix="orqchk", dir=DATOS_TMP())
            t = []
            for f in todas:
                for i, (lang, info, code, l) in enumerate(bloques(f["cuerpo"])):
                    if lang == "js" and "fragmento" not in info and "invalido" not in info:
                        p = os.path.join(d, f"{f['meta'].get('id')}-{i}.mjs"); open(p, "w", encoding="utf8").write(code); t.append((f["ruta"], l, p))
            def run(c):
                x = c[2]
                if node.endswith(".exe") and x.startswith("/mnt/"):
                    x = subprocess.run(["wslpath", "-w", x], capture_output=True, text=True).stdout.strip()
                r = subprocess.run([node, "--check", x], capture_output=True, text=True)
                return None if not r.returncode else (c[0], c[1], (re.search(r"SyntaxError[^\n]*", r.stderr) or [r.stderr[:150]])[0])
            with ThreadPoolExecutor(6) as ex:
                for z in ex.map(run, t):
                    if z: e.append(f"{z[0]}: L{z[1]}: {z[2]}")
            shutil.rmtree(d, ignore_errors=True)
            print(f"sintaxis: {len(t)} bloques")
    for x in e: print("ERROR:", x)
    print(f"{len(todas)} fichas, {len(rs)} reglas, {len(e)} errores")
    sys.exit(1 if e else 0)

def DATOS_TMP():
    return os.path.join(RAIZ, "datos")

if __name__ == "__main__":
    main()
