#!/usr/bin/env python3
"""Audita un proyecto contra la capa de orquestación: perfil real, perfil declarado, conflictos y versiones.
Uso: python auditar_proyecto.py <ruta> [--perfil X] [--json]
Sale con 1 si hay bloqueantes, con 2 si no puede auditar. Solo stdlib, Python >= 3.8.

Perfil declarado: --perfil, o un archivo `movimiento.perfil` en la raíz del proyecto.
Las reglas y sus patrones viven en datos/reglas.json. Comentarios, cadenas y archivos de prueba no cuentan.

Forma de `detecta` en cada regla: lista de {"archivos": "js|css|html", "todos": [regex], "ninguno": [regex]}.
Salta si, entre los archivos de esos tipos de todo el proyecto, aparecen todos los `todos` y ningún `ninguno`:
una condición suele repartirse entre archivos, como `new Lenis` en JavaScript y `scroll-snap-type` en CSS.
"js" abarca JavaScript, TypeScript, los <script> de HTML, Vue, Svelte y Astro, y PHP. "css" abarca también los <style>.
En `todos`, "@lenis" y "@smoother" no son regex: valen si el perfil real o el declarado tiene esa biblioteca, también
cuando el código solo llama a la plantilla. Campos opcionales de cada forma: `severidad` (sustituye a la de la regla),
`nota` (lo que el análisis estático no puede saber), `salvo_tras` y `salvo_antes` (regex: descartan una coincidencia con
eso justo antes o justo después, en el mismo archivo) y `filtro` ("fuera-del-contenido": descarta lo fijo que el HTML
sitúa fuera del contenido de ScrollSmoother).
Un archivo que define iniciarMovimiento es la plantilla: no se audita, porque contiene todas las ramas.
Una copia de una biblioteca dentro del proyecto no es código del proyecto: no dispara reglas, y solo cuenta para el
perfil si algún archivo la carga.
"""
import argparse, json, os, re, sys
from html.parser import HTMLParser

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGLAS = os.path.join(RAIZ, "datos", "reglas.json")
PERFILES = ("ninguno", "gsap", "gsap-smoother", "lenis", "gsap+lenis")
VERIFICADAS = {"gsap": "3.15.1", "lenis": "1.3.27"}
SALTAR = {"node_modules", "dist", "build", ".git", ".hg", ".svn", ".next", ".nuxt", ".output", ".svelte-kit", ".astro",
          ".cache", ".turbo", ".vercel", ".netlify", ".parcel-cache", ".vite", "coverage", "out", "vendor", "bower_components",
          "__pycache__", "storybook-static", "target", "tmp", "temp"}
PRUEBAS_DIR = {"__tests__", "__mocks__", "test", "tests", "spec", "specs", "e2e", "cypress", "playwright", "fixtures", "stories", "__fixtures__"}
PRUEBAS_ARCHIVO = re.compile(r"\.(test|spec|stories|cy|e2e)\.[a-z]+$", re.I)
JS = {".js", ".mjs", ".cjs", ".ts", ".mts", ".cts", ".jsx", ".tsx"}
MARCADO = {".html", ".htm", ".vue", ".svelte", ".astro"}
CSS = {".css", ".scss"}
PHP = {".php"}
TEXTO = JS | MARCADO | CSS | PHP
GRUPOS = {"js": JS | MARCADO | PHP, "html": MARCADO | PHP, "css": CSS | MARCADO}
TOPE = 2 * 1024 * 1024

# Evidencia de uso: (biblioteca, regex). Se busca con comentarios quitados; en cadenas vale una ruta de script o un import
IMPORTA = r"""(?:from\s*|import\s*\(?\s*|require\s*\(\s*)["'`]"""
LOCAL = r"""(?:\.{0,2}/)?(?:[^"'`\s]*/)?"""  # ruta relativa, o el archivo junto al HTML
EXT = r"""(?:[.-][\w.-]*)?\.[mc]?js\b"""
EVIDENCIA = [
    ("smoother", re.compile(r"\bScrollSmoother\s*\.\s*create\s*\(|\bnew\s+ScrollSmoother\s*\(")),
    ("smoother", re.compile(IMPORTA + r"gsap/(?:dist/)?ScrollSmoother")),
    ("smoother", re.compile(r"""\bimport\s*\{[^}]*\bScrollSmoother\b[^}]*\}\s*from\s*["'`]gsap""")),
    ("smoother", re.compile(r"""(?:src|href)\s*=\s*["'][^"']*ScrollSmoother[^"']*\.js""", re.I)),
    ("smoother", re.compile(r"""\bwp_(?:enqueue|register)_script\s*\([^)]*ScrollSmoother""", re.I)),
    ("smoother", re.compile(IMPORTA + LOCAL + r"ScrollSmoother" + EXT)),
    ("smoother", re.compile(r"""\bperfil\s*:\s*["'`]gsap-smoother["'`]""")),
    ("gsap", re.compile(IMPORTA + r"(?:gsap(?:[/\"'`]|$)|@gsap/)")),
    ("gsap", re.compile(r"""\bimport\s+(?:\*\s+as\s+)?gsap\b""")),
    ("gsap", re.compile(r"""\bimport\s*\{[^}]*\b(?:gsap|ScrollTrigger|ScrollToPlugin)\b[^}]*\}\s*from\b""")),
    ("gsap", re.compile(IMPORTA + LOCAL + r"(?:gsap|ScrollTrigger|ScrollToPlugin)" + EXT)),
    ("gsap", re.compile(r"""\bsrc\s*=\s*["']?""" + LOCAL + r"(?:gsap|ScrollTrigger|ScrollToPlugin)" + EXT, re.I)),
    ("gsap", re.compile(r"""\bperfil\s*:\s*["'`]gsap(?:\+lenis|-smoother)?["'`]""")),
    ("gsap", re.compile(r"""(?:src|href)\s*=\s*["'][^"']*(?:/gsap(?:@[^/"']*)?/|/gsap\.min\.js|/gsap\.js|cdnjs[^"']*/gsap/)""", re.I)),
    ("gsap", re.compile(r"""\bwp_(?:enqueue|register)_script\s*\([^)]*gsap""", re.I)),
    ("lenis", re.compile(IMPORTA + r"(?:lenis(?:[/\"'`]|$)|@studio-freight/(?:react-)?lenis|@darkroom\.engineering/lenis)")),
    ("lenis", re.compile(r"""\bimport\s+(?:\*\s+as\s+)?Lenis\b""")),
    ("lenis", re.compile(IMPORTA + LOCAL + r"lenis" + EXT)),
    ("lenis", re.compile(r"""\bsrc\s*=\s*["']?""" + LOCAL + r"lenis" + EXT, re.I)),
    ("lenis", re.compile(r"""\bperfil\s*:\s*["'`](?:gsap\+)?lenis["'`]""")),
    ("lenis", re.compile(r"""(?:src|href)\s*=\s*["'][^"']*(?:/lenis(?:@[^/"']*)?/|/lenis(?:\.min)?\.js|/@studio-freight/lenis)""", re.I)),
    ("lenis", re.compile(r"""\bwp_(?:enqueue|register)_script\s*\([^)]*lenis""", re.I)),
    ("lenis", re.compile(r"\bnew\s+Lenis\s*\(|<(?:ReactLenis|VueLenis)\b|\buseLenis\s*\(")),
]
PAQUETES = {"gsap": "gsap", "@gsap/react": "gsap", "@gsap/shockingly": "gsap", "lenis": "lenis",
            "@studio-freight/lenis": "lenis", "@studio-freight/react-lenis": "lenis", "@darkroom.engineering/lenis": "lenis"}
# Versión en una URL: gsap@3.12.5, /gsap/3.12.5/, lenis@1.1.20
VERSION_URL = re.compile(r"""(?:/|["'])(gsap|lenis|@studio-freight/lenis)(?:@|/)v?(\d+)(?:\.(\d+))?(?:\.(\d+))?""", re.I)


# Copias de bibliotecas: cabecera de licencia, o lo que solo una biblioteca escribe, aunque el nombre sea otro.
# Un nombre como lenis.js no basta: es habitual para un módulo propio que crea la instancia.
CABECERA_GSAP = re.compile(r"Subject to the terms at https?://(?:gsap|greensock)\.com|@author:? Jack Doyle|@license Copyright[^\n]*GreenSock")
FIRMA_GSAP = re.compile(r"\bgsapWithCSS\b")
FIRMA_LENIS = re.compile(r"//#region packages/(?:core|snap|react|vue)/src|//#region package\.json")
NOMBRE_COPIA = re.compile(r"^(?:gsap(?:-core)?|ScrollTrigger|ScrollSmoother|ScrollToPlugin|lenis|lenis-snap|lenis-react|lenis-vue)(?:\.min)?\.[mc]?js$", re.I)
PROPIO = re.compile(r"""\b(?:from|require\s*\(|import\s*\()\s*["'`](?:gsap|lenis)\b|\bnew\s+Lenis\s*\(|\bScrollSmoother\s*\.\s*create\s*\(""")
COPIA_MINIMA = 8 * 1024
# Lo que carga cada archivo: una copia con otro nombre solo se reconoce resolviendo la ruta
CARGA = re.compile(r"""(?:\bsrc\s*=\s*|\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["'`]?([^"'`\s>]+)""")


def biblioteca(nombre, texto):
    """Qué biblioteca es esta copia: "smoother", "gsap", "lenis", o None si es código del proyecto."""
    cabeza = texto[:4000]
    if CABECERA_GSAP.search(cabeza) or FIRMA_GSAP.search(cabeza):
        return "smoother" if re.search(r"\bScrollSmoother \d", cabeza) else "gsap"
    if FIRMA_LENIS.search(cabeza) or "lenis-stopped" in texto and "virtualScroll" in texto:
        return "lenis"
    if NOMBRE_COPIA.match(nombre) and len(texto) >= COPIA_MINIMA and not PROPIO.search(texto):
        return "smoother" if nombre.lower().startswith("scrollsmoother") else "lenis" if nombre.lower().startswith("lenis") else "gsap"
    return None


def mascara(texto, inicio, fin):
    """Sustituye por espacios conservando saltos de línea, para que offsets y líneas sigan valiendo."""
    return re.sub(r"[^\n]", " ", texto[inicio:fin])


def limpiar_js(t, hash_comenta=False):
    """Quita comentarios de JS, TS o PHP. Devuelve (código, tramos de cadena). Sabe de cadenas, plantillas y regex."""
    r, cadenas, i, n, previo = [], [], 0, len(t), ""
    while i < n:
        c, d = t[i], t[i + 1] if i + 1 < n else ""
        if c == "/" and d == "/" or hash_comenta and c == "#" and d != "[":
            j = t.find("\n", i)
            j = n if j < 0 else j
            r.append(mascara(t, i, j)); i = j
        elif c == "/" and d == "*":
            j = t.find("*/", i + 2)
            j = n if j < 0 else j + 2
            r.append(mascara(t, i, j)); i = j
        elif c in "\"'`":
            j, plantilla = i + 1, c == "`"
            while j < n and t[j] != c:
                if t[j] == "\\": j += 1
                elif t[j] == "\n" and not plantilla: break
                j += 1
            j = min(j + 1, n)
            cadenas.append((i + 1, j - 1))
            r.append(t[i:j]); i = j; previo = c
        elif c == "/" and (previo in "(,=:[!&|?{};\n" or previo == ""):
            # literal de expresión regular
            j = i + 1
            while j < n and t[j] not in "/\n":
                if t[j] == "\\": j += 1
                j += 1
            r.append(mascara(t, i, j + 1)); i = j + 1
        else:
            if not c.isspace(): previo = c
            r.append(c); i += 1
    return "".join(r), cadenas


def limpiar_css(t):
    r = re.sub(r"/\*.*?\*/", lambda m: mascara(m.string, m.start(), m.end()), t, flags=re.S)
    return re.sub(r"(?m)(^|\s)//[^\n]*", lambda m: mascara(m.string, m.start(), m.end()), r)


def sin_texto(marcado):
    """El texto visible de la página, también en <pre> y <code>, es contenido y no código."""
    return re.sub(r">([^<]+)(?=<|\Z)", lambda m: ">" + mascara(m.group(1), 0, len(m.group(1))), marcado)


def limpiar_marcado(t):
    """HTML, Vue, Svelte, Astro. Devuelve (código, cadenas): cada <script> se limpia como JS y cada <style> como CSS."""
    cadenas, partes, pos = [], [], 0
    t = re.sub(r"<!--.*?-->", lambda m: mascara(m.string, m.start(), m.end()), t, flags=re.S)
    if t.startswith("---"):  # frontmatter de Astro
        fin = t.find("\n---", 3)
        if fin > 0:
            limpio, c = limpiar_js(t[3:fin])
            partes.append("   " + limpio); cadenas += [(a + 3, b + 3) for a, b in c]; pos = fin
    for m in re.finditer(r"(<script\b[^>]*>)(.*?)(</script\s*>)|(<style\b[^>]*>)(.*?)(</style\s*>)", t, re.S | re.I):
        if m.start() < pos: continue
        partes.append(sin_texto(t[pos:m.start()]))
        if m.group(1):
            abre, cuerpo, cierra = m.group(1), m.group(2), m.group(3)
            base = m.start(2)
            if re.search(r"""type\s*=\s*["']?(?:text/template|text/x-|application/(?:ld\+)?json|importmap)""", abre, re.I):
                limpio, c = cuerpo, []
            else:
                limpio, c = limpiar_js(cuerpo)
        else:
            abre, cuerpo, cierra = m.group(4), m.group(5), m.group(6)
            limpio, c, base = limpiar_css(cuerpo), [], m.start(5)
        partes += [abre, limpio, cierra]
        cadenas += [(a + base, b + base) for a, b in c]
        pos = m.end()
    partes.append(sin_texto(t[pos:]))
    return "".join(partes), cadenas


def limpiar_php(t):
    r, pos, cadenas = [], 0, []
    for m in re.finditer(r"<\?(?:php|=)?(.*?)(\?>|\Z)", t, re.S):
        html, c = limpiar_marcado(t[pos:m.start()])
        r.append(html); cadenas += [(a + pos, b + pos) for a, b in c]
        codigo, c = limpiar_js(m.group(1), hash_comenta=True)
        # JavaScript en línea de WordPress: esa cadena es código
        inicio = m.start(1)
        c = [x for x in c if "wp_add_inline_script" not in t[max(0, inicio + x[0] - 60):inicio + x[0]]]
        r += [t[m.start():m.start(1)], codigo, m.group(2)]
        cadenas += [(a + m.start(1), b + m.start(1)) for a, b in c]
        pos = m.end()
    html, c = limpiar_marcado(t[pos:])
    r.append(html); cadenas += [(a + pos, b + pos) for a, b in c]
    return "".join(r), cadenas


def limpiar(ruta, texto):
    ext = os.path.splitext(ruta)[1].lower()
    if ext in JS: return limpiar_js(texto)
    if ext in CSS: return limpiar_css(texto), []
    if ext in PHP: return limpiar_php(texto)
    return limpiar_marcado(texto)


def es_prueba(rel):
    partes = rel.replace("\\", "/").split("/")
    return any(p.lower() in PRUEBAS_DIR for p in partes[:-1]) or bool(PRUEBAS_ARCHIVO.search(partes[-1]))


def recorrer(raiz):
    for d, dirs, nombres in os.walk(raiz):
        dirs[:] = sorted(x for x in dirs if x not in SALTAR)
        for n in sorted(nombres):
            yield os.path.join(d, n)


def leer(p):
    try:
        with open(p, encoding="utf8", errors="replace") as f: return f.read()
    except OSError:
        return None


def en_cadena(pos, cadenas):
    return any(a <= pos < b for a, b in cadenas)


def linea_de(texto, pos):
    return texto.count("\n", 0, pos) + 1


def mayor(rango):
    """Primer número de un rango de versión, o None si no lo fija (latest, *, workspace:, una URL)."""
    m = re.match(r"^\s*(?:npm:[^@]+@)?[\^~>=<v\s]*(\d+)", str(rango))
    return int(m.group(1)) if m else None


def versiones_paquete(raiz_rel, p, datos, res):
    for campo in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
        for nombre, rango in (datos.get(campo) or {}).items():
            lib = PAQUETES.get(nombre)
            if lib and nombre != "@gsap/react":
                res.append({"biblioteca": lib, "paquete": nombre, "version": str(rango), "mayor": mayor(rango), "archivo": raiz_rel, "linea": 0})


def versiones_lock(raiz, res):
    """El lockfile manda sobre el rango de package.json."""
    p = os.path.join(raiz, "package-lock.json")
    if not os.path.isfile(p): return {}
    try:
        datos = json.loads(leer(p) or "{}")
    except ValueError:
        return {}
    fijas = {}
    for clave, info in (datos.get("packages") or datos.get("dependencies") or {}).items():
        nombre = clave.rsplit("node_modules/", 1)[-1]
        if nombre in PAQUETES and nombre != "@gsap/react" and isinstance(info, dict) and info.get("version"):
            fijas[nombre] = info["version"]
    return fijas


def auditar(raiz, declarado=None, reglas=None):
    raiz = os.path.abspath(raiz)
    if reglas is None:
        reglas = json.load(open(REGLAS, encoding="utf8"))["reglas"]
    if declarado is None:
        declarado = leer_declarado(raiz)
    archivos, deps, evidencias, versiones, en_pruebas, copias = [], {}, [], [], set(), {}
    for p in recorrer(raiz):
        rel = os.path.relpath(p, raiz).replace(os.sep, "/")
        nombre = os.path.basename(p)
        if nombre == "package.json":
            try:
                datos = json.loads(leer(p) or "{}")
            except ValueError:
                continue
            for campo in ("dependencies", "devDependencies"):
                for pq in (datos.get(campo) or {}):
                    if pq in PAQUETES: deps.setdefault(PAQUETES[pq], []).append({"paquete": pq, "archivo": rel, "campo": campo})
            versiones_paquete(rel, p, datos, versiones)
            continue
        ext = os.path.splitext(p)[1].lower()
        if ext not in TEXTO or nombre.endswith(".d.ts"): continue
        try:
            if os.path.getsize(p) > TOPE: continue
        except OSError:
            continue
        texto = leer(p)
        if texto is None: continue
        lib = biblioteca(nombre, texto)
        if lib:
            copias[rel] = lib; continue
        if nombre.endswith((".min.js", ".min.css")): continue
        if re.search(r"function\s+iniciarMovimiento\s*\(", texto): continue  # la plantilla, copiada al proyecto
        limpio, cadenas = limpiar(rel, texto)
        prueba = es_prueba(rel)
        for lib, rx in EVIDENCIA:
            for m in rx.finditer(limpio):
                # Un literal de una cadena de texto no es uso, salvo que el patrón empiece fuera de ella
                if en_cadena(m.start(), cadenas): continue
                if prueba:
                    en_pruebas.add(lib); continue
                evidencias.append({"biblioteca": lib, "archivo": rel, "linea": linea_de(texto, m.start()), "texto": m.group(0).strip()[:80]})
        if not prueba:
            archivos.append({"rel": rel, "ext": ext, "texto": texto, "limpio": limpio, "cadenas": cadenas})
            for m in VERSION_URL.finditer(limpio):
                if en_cadena(m.start(), cadenas) and not re.search(r"https?:|//", limpio[max(0, m.start() - 120):m.start() + 1]): continue
                lib = "lenis" if "lenis" in m.group(1).lower() else "gsap"
                versiones.append({"biblioteca": lib, "paquete": m.group(1), "version": ".".join(x for x in m.groups()[1:] if x),
                                  "mayor": int(m.group(2)), "archivo": rel, "linea": linea_de(texto, m.start())})
    for a in archivos:
        for m in CARGA.finditer(a["limpio"]):
            if en_cadena(m.start(), a["cadenas"]): continue
            ruta = m.group(1).split("?")[0].split("#")[0]
            ruta = ruta.lstrip("/") if ruta.startswith("/") else os.path.normpath(os.path.join(os.path.dirname(a["rel"]), ruta)).replace(os.sep, "/")
            if ruta in copias:
                evidencias.append({"biblioteca": copias[ruta], "archivo": a["rel"], "linea": linea_de(a["texto"], m.start()), "texto": m.group(0).strip()[:80]})
    fijas = versiones_lock(raiz, versiones)
    for v in versiones:
        if v["paquete"] in fijas:
            v["version"] = fijas[v["paquete"]]; v["mayor"] = mayor(fijas[v["paquete"]])

    usa = {e["biblioteca"] for e in evidencias}
    sin_uso = sorted(l for l in deps if l not in usa and not (l == "gsap" and "smoother" in usa))
    avisos_perfil = []
    if not usa and sin_uso:  # código compilado, o proyecto sin fuentes: la dependencia es lo único que hay
        usa = set(sin_uso); sin_uso = []
    tiene_gsap = "gsap" in usa or "smoother" in usa
    tiene_smoother, tiene_lenis = "smoother" in usa, "lenis" in usa
    if tiene_smoother and tiene_lenis: real = "gsap-smoother+lenis"
    elif tiene_smoother: real = "gsap-smoother"
    elif tiene_gsap and tiene_lenis: real = "gsap+lenis"
    elif tiene_gsap: real = "gsap"
    elif tiene_lenis: real = "lenis"
    else: real = "ninguno"
    conjunto = {"gsap-smoother", "lenis", "gsap+lenis"} if real == "gsap-smoother+lenis" else {real}
    if declarado: conjunto.add(declarado)
    hechos = {x for x, si in (("lenis", tiene_lenis or declarado in ("lenis", "gsap+lenis")),
                              ("smoother", tiene_smoother or declarado == "gsap-smoother")) if si}

    conflictos = []
    for regla in reglas:
        if not set(regla.get("perfiles") or PERFILES) & conjunto: continue
        for forma in formas(regla.get("detecta")):
            conflictos += aplicar(regla, forma, archivos, hechos)
    vistos, unicos = set(), []
    for c in conflictos:
        k = (c["regla"], c["archivo"], c["linea"])
        if k not in vistos:
            vistos.add(k); unicos.append(c)
    unicos.sort(key=lambda c: (c["severidad"] != "bloqueante", c["regla"], c["archivo"], c["linea"]))

    coincide = None
    if declarado:
        coincide = declarado == real
        if not coincide:
            unicos.insert(0, {"regla": "PERFIL", "titulo": "El perfil declarado no es el real", "severidad": "bloqueante",
                              "archivo": "movimiento.perfil" if os.path.isfile(os.path.join(raiz, "movimiento.perfil")) else "--perfil",
                              "linea": 0, "texto": f"declarado {declarado}, real {real}", "tambien": [],
                              "correccion": "Cambia el perfil declarado o retira la biblioteca que sobra. Evidencias: ver `evidencias`.",
                              "ficha": "orq-ciclo"})
    avisos_version = []
    for v in versiones:
        ok = VERIFICADAS[v["biblioteca"]]
        if v["mayor"] is not None and v["mayor"] != int(ok.split(".")[0]):
            avisos_version.append({**v, "verificada": ok, "mensaje": f'{v["paquete"]} {v["version"]}: versión mayor distinta de la verificada ({ok}). Las reglas pueden no valer.'})
        elif v["mayor"] is None:
            avisos_version.append({**v, "verificada": ok, "mensaje": f'{v["paquete"]} "{v["version"]}" no fija versión: no se puede comparar con la verificada ({ok}).'})
        elif v["paquete"].startswith("@studio-freight"):
            avisos_version.append({**v, "verificada": ok, "mensaje": f'{v["paquete"]} es el nombre antiguo: el paquete actual es lenis.'})
    for l in sin_uso:
        avisos_perfil.append(f"{l} está en package.json y ningún archivo fuera de las pruebas lo usa: no cuenta para el perfil.")
    if en_pruebas - usa:
        avisos_perfil.append("Solo en pruebas, sin contar: " + ", ".join(sorted(en_pruebas - usa)) + ".")
    return {"ruta": raiz, "perfil_real": real, "perfil_declarado": declarado, "coincide": coincide,
            "evidencias": evidencias, "dependencias": deps, "versiones": versiones, "avisos_version": avisos_version,
            "avisos_perfil": avisos_perfil, "conflictos": unicos,
            "bloqueantes": sum(c["severidad"] == "bloqueante" for c in unicos),
            "avisos": sum(c["severidad"] != "bloqueante" for c in unicos), "archivos": len(archivos)}


def formas(detecta):
    if not detecta: return []
    if isinstance(detecta, dict): detecta = [detecta]
    return detecta


CERCA = 240  # caracteres que miran salvo_tras y salvo_antes


def coincidencias(rx, archivos, f=None):
    """Cada aparición fuera de una cadena: una regex que empieza en texto no es código."""
    f = f or {}
    tras = re.compile(f["salvo_tras"]) if f.get("salvo_tras") else None
    antes = re.compile(f["salvo_antes"]) if f.get("salvo_antes") else None
    r = []
    for a in archivos:
        for m in rx.finditer(a["limpio"]):
            if en_cadena(m.start(), a["cadenas"]): continue
            if tras and tras.search(a["limpio"], max(0, m.start() - CERCA), m.start()): continue
            if antes and antes.search(a["limpio"], m.end(), m.end() + CERCA): continue
            r.append((a, m))
    return r


class Arbol(HTMLParser):
    """Elementos de un marcado, cada uno con sus antepasados."""
    VACIOS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.pila, self.nodos = [], []

    @staticmethod
    def nodo(tag, attrs):
        d = dict(attrs)
        return {"tag": tag, "id": d.get("id"), "clases": (d.get("class") or "").split()}

    def handle_starttag(self, tag, attrs):
        n = self.nodo(tag, attrs)
        self.nodos.append((n, list(self.pila)))
        if tag not in self.VACIOS: self.pila.append(n)

    def handle_endtag(self, tag):
        for i in range(len(self.pila) - 1, -1, -1):
            if self.pila[i]["tag"] == tag:
                del self.pila[i:]
                break


def casa(nodo, compuesto):
    """`compuesto` es un selector simple: etiqueta, #id, .clase o su unión. Otra cosa no se puede evaluar."""
    partes = re.findall(r"[#.]?[\w-]+", compuesto)
    if not partes or "".join(partes) != compuesto: return None
    for p in partes:
        ok = nodo["id"] == p[1:] if p[0] == "#" else p[1:] in nodo["clases"] if p[0] == "." else nodo["tag"] == p.lower()
        if not ok: return False
    return True


def selector_de(limpio, pos):
    """Selector de la regla CSS que contiene `pos`, o None si no está en una regla."""
    abre = limpio.rfind("{", 0, pos)
    if abre < 0 or limpio.rfind("}", abre, pos) >= 0: return None
    inicio = max(limpio.rfind("}", 0, abre), limpio.rfind(">", 0, abre), limpio.rfind(";", 0, abre))
    return limpio[inicio + 1:abre].strip()


def fuera_del_contenido(selector, archivos):
    """True solo si el HTML demuestra que todo lo que casa con el selector queda fuera del contenido de ScrollSmoother."""
    if not selector: return False
    declarado = None
    for a in archivos:
        m = re.search(r"""\bcontent\s*:\s*["'`]([#.][\w-]+)["'`]""", a["limpio"])
        if m: declarado = m.group(1); break
    contenido = declarado or "#smooth-content"
    finales = [re.split(r"[\s>+~]+", s.strip())[-1] for s in selector.split(",")]
    vistos = 0
    for a in archivos:
        if a["ext"] not in MARCADO and a["ext"] not in PHP: continue
        arbol = Arbol()
        arbol.feed(a["limpio"])
        if not any(casa(n, contenido) for n, _ in arbol.nodos): continue
        for n, antes in arbol.nodos:
            for final in finales:
                r = casa(n, final)
                if r is None: return False
                if r:
                    if casa(n, contenido) or any(casa(x, contenido) for x in antes): return False
                    vistos += 1
    return vistos > 0


def aplicar(regla, f, archivos, hechos=frozenset()):
    tipos = f.get("archivos") or ""
    tipos = tipos if isinstance(tipos, list) else [t for t in tipos.split("|") if t]
    exts = set().union(*[GRUPOS.get(t, {"." + t}) for t in tipos]) if tipos else TEXTO
    ambito = [a for a in archivos if a["ext"] in exts]
    fuentes = f.get("todos") or []
    if any(x[1:] not in hechos for x in fuentes if x.startswith("@")): return []
    fuentes = [x for x in fuentes if not x.startswith("@")]
    todos = [coincidencias(re.compile(x), ambito, f) for x in fuentes]
    if not todos or not all(todos): return []
    # En `ninguno` valen también las cadenas: matchMedia("(prefers-reduced-motion: reduce)") es una atención real
    for x in f.get("ninguno") or []:
        rx = re.compile(x)
        if any(rx.search(a["limpio"]) for a in ambito): return []
    # Se señala la condición concreta: la menos frecuente que no sea solo "hay Lenis". Las demás van en `tambien`
    candidatas = [i for i in range(len(todos)) if "new Lenis" not in fuentes[i]] or list(range(len(todos)))
    principal = min(candidatas, key=lambda i: len(todos[i]))
    def lugar(a, m):
        return a["rel"], linea_de(a["texto"], m.start()), a
    r = []
    for a, m in todos[principal]:
        if f.get("filtro") == "fuera-del-contenido" and fuera_del_contenido(selector_de(a["limpio"], m.start()), archivos): continue
        rel, linea, _ = lugar(a, m)
        tambien = [f"{lugar(*t[0])[0]}:{lugar(*t[0])[1]}" for i, t in enumerate(todos) if i != principal]
        c = {"regla": regla["id"], "titulo": regla.get("titulo", ""), "severidad": f.get("severidad") or regla.get("severidad", "aviso"),
             "archivo": rel, "linea": linea, "texto": a["texto"].split("\n")[linea - 1].strip()[:120], "tambien": tambien,
             "correccion": regla.get("correccion", ""), "ficha": regla.get("evidencia", "")}
        if f.get("nota"): c["nota"] = f["nota"]
        r.append(c)
    return r


def leer_declarado(raiz):
    t = leer(os.path.join(raiz, "movimiento.perfil"))
    if t is None: return None
    for l in t.splitlines():
        l = l.split("#")[0].strip()
        if l: return l
    return None


def imprimir(r):
    print(f"Proyecto: {r['ruta']} ({r['archivos']} archivos)")
    print(f"Perfil real: {r['perfil_real']}")
    if r["perfil_declarado"]:
        print(f"Perfil declarado: {r['perfil_declarado']} ({'coincide' if r['coincide'] else 'NO coincide'})")
    vistos = set()
    for e in r["evidencias"]:
        k = (e["biblioteca"], e["archivo"])
        if k not in vistos:
            vistos.add(k); print(f"  {e['biblioteca']}: {e['archivo']}:{e['linea']}  {e['texto']}")
    for a in r["avisos_perfil"]: print("AVISO:", a)
    for a in r["avisos_version"]:
        print(f"VERSION: {a['archivo']}{':' + str(a['linea']) if a['linea'] else ''}: {a['mensaje']}")
    for c in r["conflictos"]:
        print(f"\n{c['severidad'].upper()} {c['regla']}: {c['titulo']}")
        print(f"  {c['archivo']}{':' + str(c['linea']) if c['linea'] else ''}  {c['texto']}")
        if c.get("tambien"): print(f"  Junto con: {', '.join(c['tambien'])}")
        print(f"  Corrección: {c['correccion']}")
        if c.get("nota"): print(f"  Nota: {c['nota']}")
        print(f"  Ficha: {c['ficha']}")
    print(f"\n{r['bloqueantes']} bloqueantes, {r['avisos']} avisos, {len(r['avisos_version'])} de versión")


def main():
    ap = argparse.ArgumentParser(description="Audita perfil, conflictos y versiones de un proyecto con GSAP o Lenis.")
    ap.add_argument("ruta"); ap.add_argument("--perfil", choices=PERFILES); ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    if not os.path.isdir(a.ruta):
        print("No existe la carpeta", a.ruta, file=sys.stderr); sys.exit(2)
    r = auditar(a.ruta, a.perfil)
    if r["perfil_declarado"] and r["perfil_declarado"] not in PERFILES:
        print(f"Perfil declarado desconocido: {r['perfil_declarado']}. Usa: {', '.join(PERFILES)}", file=sys.stderr); sys.exit(2)
    if a.json: print(json.dumps(r, ensure_ascii=False, indent=2))
    else: imprimir(r)
    sys.exit(1 if r["bloqueantes"] else 0)


if __name__ == "__main__":
    main()
