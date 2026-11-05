#!/usr/bin/env python3
"""Valida el sistema. Uso: python validar.py [--capa 07-scroll] [--sin-sintaxis] [--cobertura]
Sale con código 1 si hay errores. Cobertura solo se exige sin --capa."""
import argparse, json, os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
from fichas import RAIZ, CORPUS, capas, fichas, paginas_corpus, expandir_fuente, cargar_api

OBLIG = ["id", "titulo", "capa", "tipo", "ambito", "resumen", "fuentes", "estado", "version"]
TIPOS = {"concepto", "api", "plugin", "guia", "patron", "diagnostico", "referencia"}
ESTADOS = {"verificado", "revisar", "borrador"}
SECCIONES = {
    "concepto": ["## Modelo mental", "## Ejemplo", "## Trampas"],
    "api": ["## Firma", "## Ejemplo", "## Trampas"],
    "plugin": ["## Para qué sirve", "## Registro", "## API", "## Ejemplo", "## Trampas"],
    "guia": ["## Pasos", "## Trampas"],
    "patron": ["## Problema", "## Solución", "## Trampas"],
    "diagnostico": ["## Síntoma", "## Causa", "## Solución"],
    "referencia": [],
}
MAX_LINEAS = 320
# Agnosticismo: fuera de estas capas no se nombran frameworks ni sus API
CAPAS_FRAMEWORK = ("06-integracion", "09-versiones", "10-tareas")
FRAMEWORK = re.compile(r"\b(React|ReactDOM|useGSAP|useEffect|useLayoutEffect|useRef|useState|StrictMode|JSX|Next\.js|Nuxt|Vue|Svelte|SvelteKit|Angular|onMounted|onUnmounted|onBeforeUnmount|onDestroy|ngOnInit|ngOnDestroy|Astro|Solid|Remix)\b")
CLASES = ["Lenis", "Snap"]
# Alias: dónde vive cada nombre en api.json
TIPO_DE = {}
# Comunes a toda clase/plugin aunque no estén en los tipos
COMUNES = set()
SIN_TIPAR = set()
EXCLUIR_TIPOS = re.compile(r"^(Dimensions|SnapElement|Rect$|LenisContextValue|funciones)")
VARS = {
    r"new Lenis\(\s*\{": ["LenisOptions"],
    r"\.scrollTo\([^{}\n;]*?,\s*\{": ["ScrollToOptions"],
    r"new Snap\([^{}\n;]*?,\s*\{": ["SnapOptions"],
}

def err(lista, ruta, msg): lista.append(f"{ruta}: {msg}")

def bloques(cuerpo):
    """(lenguaje, info, código, línea)"""
    r = []
    for m in re.finditer(r"(?m)^```([^\n]*)\n(.*?)^```\s*$", cuerpo, re.S):
        info = m.group(1).strip().split()
        r.append((info[0] if info else "", info[1:], m.group(2), cuerpo[:m.start()].count("\n") + 1))
    return r

def prosa(cuerpo):
    s = re.sub(r"(?ms)^```.*?^```\s*$", " ", cuerpo)
    s = re.sub(r"`[^`\n]*`", " ", s)
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)
    return s

def conocido(api, q):
    """Acepta Tipo.miembro, Tipo.Vars.clave, gsap.utils.x, gsap.ticker.x"""
    t = api["tipos"]
    if q in t or q in SIN_TIPAR: return True
    if "." not in q: return q in t or q in TIPO_DE or q in CLASES
    base, m = q.rsplit(".", 1)
    for tipo in [base] + TIPO_DE.get(base, []) + []:
        if tipo in t and m in t[tipo]["miembros"]: return True
    return m in COMUNES and base in CLASES

def claves_objeto(txt, ini):
    """Claves de primer nivel del objeto que abre en txt[ini] == '{'."""
    prof, i, claves, n = 0, ini, [], len(txt)
    inicio = True
    while i < n:
        c = txt[i]
        if c in "\"'`":
            j = i + 1
            while j < n and txt[j] != c:
                j += 2 if txt[j] == "\\" else 1
            i = j + 1; inicio = False; continue
        if c == "/" and txt[i:i+2] == "//":
            i = txt.find("\n", i); i = n if i < 0 else i; continue
        if c in "{[(": prof += 1
        elif c in "}])":
            prof -= 1
            if prof == 0: return claves
        if prof == 1 and (c == "," or c == "{"):
            m = re.match(r"\s*([A-Za-z_$][\w$]*)\s*(:|\(|,|\})", txt[i+1:])
            if m: claves.append(m.group(1))
        i += 1
    return claves

def comprobar_codigo(f, api, errores):
    for lang, info, code, linea in bloques(f["cuerpo"]):
        if lang == "":
            err(errores, f["ruta"], f"bloque sin lenguaje (L{linea})")
        if lang not in ("js", "jsx", "ts", "tsx", "vue", "svelte", "html", "css", "scss", "bash", "text", "json", "astro", "php", "mermaid"):
            err(errores, f["ruta"], f"lenguaje de bloque desconocido '{lang}' (L{linea})")
        if lang not in ("js", "jsx", "ts", "tsx", "vue", "svelte", "html", "astro"): continue
        # Ignora líneas que son contraejemplo declarado
        if "invalido" in info or "antiguo" in info: continue
        c = re.sub(r"(?m)//.*$", "", code)
        for m in re.finditer(r"\b(lenis|snap)\.([A-Za-z_$][\w$]*)\s*\(", c):
            b, n = "Lenis" if m.group(1) == "lenis" else "Snap", m.group(2)
            if not conocido(api, f"{b}.{n}"):
                err(errores, f["ruta"], f"L{linea}: {m.group(1)}.{n}() no existe en los tipos")
        for rx, tipos in VARS.items():
            for m in re.finditer(rx, c):
                ok = set()
                for t in tipos: ok |= set(api["tipos"][t]["miembros"])
                for k in claves_objeto(c, m.end() - 1):
                    if k not in ok:
                        err(errores, f["ruta"], f"L{linea}: clave '{k}' no está en {tipos[0]}")

def sintaxis(todas, errores):
    node = shutil.which("node") or shutil.which("node.exe") or "/mnt/c/Program Files/nodejs/node.exe"
    if not os.path.exists(node) and not shutil.which(node):
        print("AVISO: sin node; se omite la comprobación de sintaxis"); return
    d = tempfile.mkdtemp(prefix="gsapchk", dir=os.path.join(RAIZ, "datos"))
    tareas = []
    for f in todas:
        for i, (lang, info, code, linea) in enumerate(bloques(f["cuerpo"])):
            if lang == "js" and "fragmento" not in info and "invalido" not in info:
                p = os.path.join(d, f"{f['meta'].get('id','x')}-{i}.mjs")
                open(p, "w", encoding="utf8").write(re.sub(r"^", "", code))
                tareas.append((f["ruta"], linea, p))
    def run(t):
        ruta, linea, p = t
        x = p
        if node.endswith(".exe") and p.startswith("/mnt/"):
            x = subprocess.run(["wslpath", "-w", p], capture_output=True, text=True).stdout.strip()
        r = subprocess.run([node, "--check", x], capture_output=True, text=True)
        if r.returncode:
            m = re.search(r"SyntaxError[^\n]*", r.stderr)
            return (ruta, linea, m.group(0) if m else r.stderr[:200])
    try:
        with ThreadPoolExecutor(6) as ex:
            for e in ex.map(run, tareas):
                if e: err(errores, e[0], f"L{e[1]}: {e[2]}")
    finally:
        shutil.rmtree(d, ignore_errors=True)
    print(f"sintaxis: {len(tareas)} bloques js comprobados")

def indice_copia():
    """Shingles de 9 palabras del corpus oficial: detecta texto en inglés pegado."""
    ind = set()
    for b, _, fs in os.walk(CORPUS):
        for x in fs:
            pal = re.findall(r"[a-z']+", prosa(open(os.path.join(b, x), encoding="utf8").read()).lower())
            ind.update(" ".join(pal[i:i+9]) for i in range(len(pal) - 8))
    return ind

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--capa"); ap.add_argument("--sin-sintaxis", action="store_true"); ap.add_argument("--cobertura", action="store_true")
    a = ap.parse_args()
    errores, avisos = [], []
    api = cargar_api()
    pags = paginas_corpus()
    if not pags: avisos.append("sin corpus en caché: ejecuta actualizar.py; se omiten fuentes y anticopia")
    todas = fichas()
    ids = {}
    for f in todas:
        i = f["meta"].get("id")
        if i in ids: err(errores, f["ruta"], f"id duplicado con {ids[i]}")
        ids[i] = f["ruta"]
    sel = [f for f in todas if not a.capa or f["ruta"].startswith(a.capa + "/")]
    copia = indice_copia() if pags else set()
    for f in sel:
        m, r = f["meta"], f["ruta"]
        if not m: err(errores, r, "sin front matter"); continue
        for k in OBLIG:
            if k not in m or m[k] in ("", []): err(errores, r, f"falta '{k}'")
        arch = os.path.basename(r)[:-3]
        if m.get("id") != arch: err(errores, r, f"id '{m.get('id')}' ≠ nombre de archivo")
        if m.get("capa") != r.split("/")[0]: err(errores, r, f"capa '{m.get('capa')}' incorrecta")
        t = m.get("tipo")
        if t not in TIPOS: err(errores, r, f"tipo '{t}' inválido")
        if m.get("estado") not in ESTADOS: err(errores, r, f"estado '{m.get('estado')}' inválido")
        if len(str(m.get("resumen", ""))) > 180: err(errores, r, "resumen > 180 caracteres")
        c = f["cuerpo"]
        if not c.lstrip().startswith("# "): err(errores, r, "debe empezar por un título '# '")
        for s in SECCIONES.get(t, []):
            if not re.search(r"(?m)^" + re.escape(s) + r"\s*$", c): err(errores, r, f"falta sección '{s}'")
        if not r.startswith(CAPAS_FRAMEWORK) and not m.get("excepcion_agnostica"):
            for lang, _, _, linea in bloques(c):
                if lang in ("jsx", "tsx", "vue", "svelte", "astro"):
                    err(errores, r, f"L{linea}: bloque {lang} fuera de 06-integracion (agnosticismo)")
            for k in ("titulo", "resumen", "etiquetas"):
                x = FRAMEWORK.search(str(m.get(k, "")))
                if x: err(errores, r, f"{k}: nombra '{x.group(1)}' fuera de 06-integracion (agnosticismo)")
            for n, l in enumerate(c.split("\n"), 1):
                x = FRAMEWORK.search(l)
                if x: err(errores, r, f"L{n}: nombra '{x.group(1)}' fuera de 06-integracion (agnosticismo)")
            for x in m.get("relacionadas", []) or []:
                if x.startswith("int-") and x not in ("int-contrato", "int-vanilla", "int-gsap", "int-canvas-webgl"):
                    err(errores, r, f"relacionadas: '{x}' es específica; enlaza int-contrato (agnosticismo)")
        if c.count("\n") > MAX_LINEAS: err(errores, r, f"{c.count(chr(10))} líneas (> {MAX_LINEAS}): divide la ficha")
        for k in ("requiere", "relacionadas"):
            for x in m.get(k, []) or []:
                if x not in ids: err(errores, r, f"{k}: id desconocido '{x}'")
        if pags:
            for x in m.get("fuentes", []) or []:
                if not expandir_fuente(x, pags): err(errores, r, f"fuente no resuelve: {x}")
        if api:
            for x in m.get("api", []) or []:
                if not conocido(api, x): err(errores, r, f"api desconocida: {x}")
            comprobar_codigo(f, api, errores)
        for texto, enlace in re.findall(r"\[([^\]]*)\]\(([^)\s]+\.md)(?:#[^)]*)?\)", c):
            if not enlace.startswith("http") and not os.path.exists(os.path.normpath(os.path.join(RAIZ, r.split("/")[0], enlace))):
                err(errores, r, f"enlace roto: {enlace}")
        if copia:
            pal = re.findall(r"[a-z']+", prosa(c).lower())
            golpes = sum(" ".join(pal[i:i+9]) in copia for i in range(len(pal) - 8))
            if golpes: avisos.append(f"{r}: {golpes} secuencias en inglés idénticas al README: redacta en español")
        if m.get("estado") == "verificado" and not re.search(r"\[(O|C|E|P)\]", c) and t != "referencia":
            avisos.append(f"{r}: sin marcas de procedencia")
    if not a.sin_sintaxis: sintaxis(sel, errores)
    if not a.capa or a.cobertura:
        cubierta = set()
        for f in todas:
            for x in f["meta"].get("fuentes", []) or []: cubierta.update(expandir_fuente(x, pags))
        exc = os.path.join(RAIZ, "herramientas", "cobertura_excluida.txt")
        excl = [l.split("#")[0].strip() for l in open(exc, encoding="utf8")] if os.path.exists(exc) else []
        for x in excl:
            if x: cubierta.update(expandir_fuente(x, pags))
        falt = [p for p in pags if p not in cubierta]
        print(f"cobertura de páginas oficiales: {len(pags)-len(falt)}/{len(pags)}")
        for p in falt: errores.append(f"página sin cubrir: {p}")
        texto = "\n".join(f["cuerpo"] + " " + " ".join(f["meta"].get("api", []) or []) for f in todas)
        ausentes, total = [], 0
        for tipo, d in api["tipos"].items():
            if EXCLUIR_TIPOS.match(tipo): continue
            for mi in d["miembros"]:
                total += 1
                if not re.search(r"(?<![\w$])" + re.escape(mi) + r"(?![\w$])", texto): ausentes.append(f"{tipo}.{mi}")
        print(f"cobertura de API: {total-len(ausentes)}/{total}")
        for x in ausentes: errores.append(f"API sin mencionar: {x}")
    for x in avisos: print("aviso:", x)
    for x in errores: print("ERROR:", x)
    print(f"{len(sel)} fichas, {len(errores)} errores, {len(avisos)} avisos")
    sys.exit(1 if errores else 0)

if __name__ == "__main__":
    main()
