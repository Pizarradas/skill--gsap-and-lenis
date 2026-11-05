#!/usr/bin/env python3
"""Comprueba herramientas/auditar_proyecto.py contra herramientas/casos/. Solo stdlib, Python >= 3.8.
Uso: python probar_auditor.py. Sale con 1 si algún caso no da lo esperado.

Cada caso fija perfil real, ids de regla esperados y prohibidos, y código de salida. Los prohibidos son los
falsos positivos: código comentado, cadenas de documentación, texto de la página, archivos de prueba."""
import json, os, re, shutil, subprocess, sys, tempfile
from auditar_proyecto import auditar, limpiar, REGLAS

AQUI = os.path.dirname(os.path.abspath(__file__))
CASOS = os.path.join(AQUI, "casos")
fallos = []

def compara(nombre, ok, detalle=""):
    if not ok: fallos.append(f"{nombre}: {detalle}")

def ejecuta(ruta, *args):
    r = subprocess.run([sys.executable, os.path.join(AQUI, "auditar_proyecto.py"), ruta, "--json", *args], capture_output=True, text=True, encoding="utf8")
    return r.returncode, json.loads(r.stdout) if r.stdout.strip().startswith("{") else None

# caso: perfil real, salida, reglas que deben aparecer, reglas que no, avisos de versión esperados,
# severidad exigida por regla (sev) y reglas que deben llevar nota (notas)
ESPERADO = {
    "correcto-npm": dict(perfil="gsap+lenis", salida=0, con=[], sin="*", versiones=0),
    "svelte-correcto": dict(perfil="lenis", salida=0, con=[], sin="*", versiones=0),
    "ninguno-css": dict(perfil="ninguno", salida=0, con=[], sin="*", versiones=0),
    "solo-tests": dict(perfil="gsap", salida=0, con=[], sin="*", versiones=0),
    "html-cdn-conflicto": dict(perfil="gsap-smoother+lenis", salida=1, con=["@SMOOTHER", "@RELOJ", "@NORMALIZE", "@SNAP"], sin=[], versiones=0),
    "vue-conflicto": dict(perfil="gsap+lenis", salida=1, con=["@RELOJ", "@SEGUNDOS", "@SCROLLTO", "@SNAP"], sin=["PERFIL"], versiones=0),
    "php-wordpress": dict(perfil="gsap+lenis", salida=1, con=["@RELOJ"], sin=[], versiones=0),
    "npm-version": dict(perfil="gsap+lenis", salida=0, con=[], sin=[], versiones=2),
    "cdn-version": dict(perfil="gsap+lenis", salida=0, con=[], sin=[], versiones=2),
    "declarado-distinto": dict(perfil="gsap", salida=1, con=["PERFIL"], sin=[], versiones=0),

    # Plantilla: una mención de iniciarMovimiento no apaga nada, y el perfil vale como evidencia de la biblioteca
    "orq-con-conflictos": dict(perfil="gsap+lenis", salida=1, con=["O06", "O07", "O08", "O10", "O11", "O16", "O30"], sin=["O03", "O04"]),
    "plantilla-conflictos": dict(perfil="gsap+lenis", salida=1, con=["O06", "O07", "O08", "O11", "O16"], sin=["O04"], sev={"O11": "bloqueante"}),
    "mencion-no-apaga": dict(perfil="gsap-smoother+lenis", salida=1, con=["O03", "O04", "O09", "O11"], sin=[]),
    "mencion-control": dict(perfil="gsap-smoother+lenis", salida=1, con=["O03", "O04", "O09", "O11"], sin=[]),
    "smoother-plantilla-y-lenis": dict(perfil="gsap-smoother+lenis", salida=1, con=["O03"], sin=[]),
    "o04-sin-update": dict(perfil="gsap+lenis", salida=1, con=["O04", "O32"], sin=["O01"]),
    "o04-otra-instancia": dict(perfil="gsap+lenis", salida=1, con=["O04"], sin=[]),
    "plantilla-limpia": dict(perfil="gsap+lenis", salida=0, con=[], sin="*"),
    "plantilla-otro-perfil": dict(perfil="lenis", salida=1, con=["O08", "O11"], sin=[], sev={"O11": "bloqueante"}),

    # O13
    "o13-clase": dict(perfil="gsap+lenis", salida=1, con=["O13"], sin=[], notas=["O13"]),
    "o13-lenis-css-copiada": dict(perfil="gsap+lenis", salida=1, con=["O13"], sin=[]),
    "o13-tarjeta-html": dict(perfil="gsap+lenis", salida=1, con=["O13"], sin=[]),
    "o13-tarjeta-no-apaga": dict(perfil="gsap+lenis", salida=1, con=["O13"], sin=[]),
    "o13-plantilla-lenis-directo": dict(perfil="gsap+lenis", salida=1, con=["O13"], sin=[]),
    "o13-id-falso-positivo": dict(perfil="gsap+lenis", salida=1, con=["O13"], sin=[], sev={"O13": "bloqueante"}, notas=["O13"]),
    "o13-regla-css": dict(perfil="gsap+lenis", salida=0, con=[], sin=["O13"]),
    "o13-overflow-en-linea": dict(perfil="lenis", salida=0, con=[], sin=["O13"]),
    "o13-ventana": dict(perfil="lenis", salida=0, con=[], sin=["O13"]),

    # Carga local y copias de bibliotecas
    "carga-modulos-locales": dict(perfil="gsap+lenis", salida=0, con=[], sin="*"),
    "carga-script-local": dict(perfil="gsap+lenis", salida=0, con=[], sin="*"),
    "carga-npm-copiado": dict(perfil="gsap+lenis", salida=0, con=[], sin="*"),
    "copia-sin-cargar": dict(perfil="ninguno", salida=0, con=[], sin="*"),
    "copia-otro-nombre": dict(perfil="gsap+lenis", salida=0, con=[], sin=["O01", "O03"]),
    "modulo-propio-lenis": dict(perfil="lenis", salida=0, con=[], sin="*"),

    # O08
    "o08-excepcion-area": dict(perfil="gsap+lenis", salida=0, con=[], sin="*"),
    "o08-excepcion-html": dict(perfil="gsap+lenis", salida=0, con=[], sin="*"),
    "o08-otro-destino": dict(perfil="gsap+lenis", salida=0, con=["O08"], sin=[], sev={"O08": "aviso"}, notas=["O08"]),
    "o08-timeline": dict(perfil="gsap+lenis", salida=1, con=["O08"], sin=[]),
    "o08-varias-vias": dict(perfil="gsap+lenis", salida=1, con=["O08", "O22"], sin=[]),
    "o08-lenis-ventana": dict(perfil="lenis", salida=1, con=["O08"], sin=[]),
    "o08-contenedor-ventana": dict(perfil="lenis", salida=0, con=[], sin=["O08"]),
    "o08-salida": dict(perfil="gsap+lenis", salida=0, con=[], sin=["O08"]),
    "o08-linea-de-tiempo": dict(perfil="gsap+lenis", salida=0, con=[], sin=["O08"]),
    "o08-falsos-cadenas": dict(perfil="gsap+lenis", salida=0, con=[], sin="*"),
    "o01-dos-relojes": dict(perfil="gsap+lenis", salida=1, con=["O01", "O08"], sin=["O04"]),

    # O12, O11
    "o12-defaults-abreviado": dict(perfil="gsap+lenis", salida=0, con=[], sin=["O12"]),
    "o12-cajon-ventana": dict(perfil="gsap+lenis", salida=0, con=["O12"], sin=[], sev={"O12": "aviso"}, notas=["O12"]),
    "wrapper-abreviado": dict(perfil="gsap+lenis", salida=1, con=["O12", "O13"], sin=[], sev={"O12": "aviso"}),
    "o11-carrusel": dict(perfil="gsap+lenis", salida=0, con=["O11"], sin=[], sev={"O11": "aviso"}, notas=["O11"]),

    # Patrones
    "o05-contraejemplo": dict(perfil="gsap+lenis", salida=1, con=["O05"], sin=[]),
    "o05-funcion": dict(perfil="gsap+lenis", salida=1, con=["O05"], sin=[]),
    "o05-en-linea": dict(perfil="gsap+lenis", salida=1, con=["O05"], sin=[]),
    "o05-forma-correcta": dict(perfil="gsap+lenis", salida=0, con=[], sin="*"),
    "o05-variable-intermedia": dict(perfil="gsap+lenis", salida=0, con=[], sin="*"),
    "o05-bucle-propio": dict(perfil="gsap+lenis", salida=0, con=[], sin=["O05"]),
    "react-dos-relojes": dict(perfil="gsap+lenis", salida=1, con=["O01", "O04"], sin=[]),
    "o01-react-reloj-propio": dict(perfil="gsap+lenis", salida=0, con=[], sin=["O01", "O32"]),
    "o32-react": dict(perfil="gsap+lenis", salida=0, con=["O32"], sin=["O01"]),
    "o32-ticker-ajeno": dict(perfil="gsap+lenis", salida=0, con=["O32"], sin=["O01"]),
    "opcional-lenis": dict(perfil="gsap+lenis", salida=1, con=["O13", "O20", "O22", "O27"], sin=[]),
    "opcional-control": dict(perfil="gsap+lenis", salida=1, con=["O13", "O20", "O22", "O27"], sin=[]),
    "o15-opcional": dict(perfil="gsap+lenis", salida=0, con=["O15"], sin=["O14"]),
    "o14-plantilla-sin-parar": dict(perfil="gsap+lenis", salida=1, con=["O14"], sin=["O15"]),
    "o14-plantilla-bloquea": dict(perfil="gsap+lenis", salida=0, con=["O15"], sin=["O14"]),
    "o09-sin-delay": dict(perfil="gsap+lenis", salida=0, con=["O09"], sin=[]),
    "o09-delay-ajeno": dict(perfil="gsap+lenis", salida=0, con=["O09"], sin=[]),
    "o09-delay-suficiente": dict(perfil="gsap+lenis", salida=0, con=[], sin=["O09"]),
    "o16-medio": dict(perfil="gsap+lenis", salida=0, con=["O16"], sin=[]),
    "o16-tope": dict(perfil="gsap+lenis", salida=0, con=[], sin="*"),
    "o07-variable": dict(perfil="gsap+lenis", salida=1, con=["O07"], sin=[]),
    "o26-html-body": dict(perfil="ninguno", salida=0, con=["O26"], sin=[]),
    "o26-body-html": dict(perfil="ninguno", salida=0, con=["O26"], sin=[]),
    "o26-separadas": dict(perfil="ninguno", salida=0, con=["O26"], sin=[]),
    "smoother-fijo-fuera": dict(perfil="gsap-smoother", salida=0, con=[], sin="*"),
    "o33-tween": dict(perfil="gsap-smoother", salida=1, con=["O33"], sin=[]),
    "o33-get-varias-lineas": dict(perfil="gsap-smoother", salida=1, con=["O33"], sin=[]),
    "o33-ventana": dict(perfil="gsap-smoother", salida=0, con=[], sin=["O33"]),
    "smoother-fijo-dentro": dict(perfil="gsap-smoother", salida=0, con=["O31"], sin=[]),
    "texto-no-es-codigo": dict(perfil="ninguno", salida=0, con=[], sin="*"),
}

# Ids estables de datos/reglas.json que los casos deben provocar
ids = {"@SMOOTHER": "O03", "@RELOJ": "O01", "@SEGUNDOS": "O05", "@NORMALIZE": "O07", "@SNAP": "O11", "@SCROLLTO": "O08"}

def main():
    titulos = {x["id"] for x in json.load(open(REGLAS, encoding="utf8"))["reglas"]}
    compara("reglas", set(ids.values()) <= titulos, "falta alguna regla en datos/reglas.json")
    for caso, e in ESPERADO.items():
        salida, r = ejecuta(os.path.join(CASOS, caso))
        if r is None:
            fallos.append(f"{caso}: sin JSON"); continue
        vistas = {c["regla"] for c in r["conflictos"]}
        compara(caso, r["perfil_real"] == e["perfil"], f"perfil {r['perfil_real']}")
        compara(caso, salida == e["salida"], f"salida {salida}, conflictos {sorted(vistas)}")
        for x in e["con"]: compara(caso, ids.get(x, x) in vistas, f"falta {x}={ids.get(x, x)}: {sorted(vistas)}")
        if e["sin"] == "*": compara(caso, not vistas, f"falso positivo: {[(c['regla'], c['archivo'], c['linea']) for c in r['conflictos']]}")
        else:
            for x in e["sin"]: compara(caso, ids.get(x, x) not in vistas, f"no debía salir {x}")
        compara(caso, len(r["avisos_version"]) == e.get("versiones", 0), f"versiones {r['avisos_version']}")
        for regla, sev in e.get("sev", {}).items():
            compara(caso, any(c["regla"] == regla and c["severidad"] == sev for c in r["conflictos"]), f"{regla} debía ser {sev}")
        for regla in e.get("notas", []):
            compara(caso, any(c["regla"] == regla and c.get("nota") for c in r["conflictos"]), f"{regla} sin nota")
        for c in r["conflictos"]:
            compara(caso, c["archivo"] and c["correccion"] and c["ficha"], f"conflicto incompleto {c}")
            if c["regla"] != "PERFIL": compara(caso, c["linea"] > 0, f"sin línea {c}")

    # Declarado por argumento gana al archivo
    salida, r = ejecuta(os.path.join(CASOS, "declarado-distinto"), "--perfil", "gsap")
    compara("--perfil", salida == 0 and r["coincide"] is True, f"salida {salida}")

    # Línea exacta en un conflicto de HTML
    _, r = ejecuta(os.path.join(CASOS, "html-cdn-conflicto"))
    reloj = [c for c in r["conflictos"] if c["regla"] == ids["@RELOJ"]]
    compara("línea", reloj and reloj[0]["linea"] == 15, f"{reloj}")
    snap = [c for c in r["conflictos"] if c["regla"] == ids["@SNAP"]]
    compara("línea de la condición concreta", snap and snap[0]["linea"] == 5, f"{snap}")

    # Carpetas que se saltan, y lockfile que manda sobre el rango
    t = tempfile.mkdtemp(prefix="auditor-")
    try:
        d = os.path.join(t, "p")
        shutil.copytree(os.path.join(CASOS, "correcto-npm"), d)
        malo = 'import L from "lenis"; import {ScrollSmoother} from "gsap/ScrollSmoother"; new L({autoRaf:true}); ScrollSmoother.create({});\n'
        for sub in ("node_modules/x", "dist", "build", ".next/server", ".git/hooks"):
            os.makedirs(os.path.join(d, sub))
            open(os.path.join(d, sub, "bundle.js"), "w", encoding="utf8").write(malo)
        open(os.path.join(d, "src", "vendor.min.js"), "w", encoding="utf8").write(malo)
        _, r = ejecuta(d)
        compara("saltar", r["perfil_real"] == "gsap+lenis" and not r["conflictos"], f"{r['perfil_real']} {r['conflictos']}")
        json.dump({"packages": {"node_modules/gsap": {"version": "4.1.0"}, "node_modules/lenis": {"version": "1.3.27"}}}, open(os.path.join(d, "package-lock.json"), "w"))
        _, r = ejecuta(d)
        compara("lockfile", len(r["avisos_version"]) == 1 and r["avisos_version"][0]["biblioteca"] == "gsap", f"{r['avisos_version']}")
    finally:
        shutil.rmtree(t, ignore_errors=True)

    # La plantilla copiada al proyecto contiene todas las ramas: no es un conflicto
    t = tempfile.mkdtemp(prefix="auditor-")
    try:
        d = os.path.join(t, "p")
        shutil.copytree(os.path.join(CASOS, "con-orquestador"), d)
        shutil.copy(os.path.join(os.path.dirname(AQUI), "plantillas", "orquestador.js"), os.path.join(d, "src"))
        salida, r = ejecuta(d)
        compara("con-orquestador", salida == 0 and r["perfil_real"] == "gsap+lenis" and not r["conflictos"], f"{r['perfil_real']} {r['conflictos']}")
    finally:
        shutil.rmtree(t, ignore_errors=True)

    # Limpieza línea a línea: los offsets no se mueven
    texto = 'const a = 1; // new Lenis()\n/* ScrollSmoother.create()\n*/ const url = "http://x"; const r = /\\/\\/ new Lenis/;\nnew Lenis();\n'
    limpio, _ = limpiar("a.js", texto)
    compara("offsets", len(limpio) == len(texto) and limpio.count("\n") == texto.count("\n"), "cambió la longitud")
    compara("comentarios", limpio.count("new Lenis") == 1 and "ScrollSmoother" not in limpio and '"http://x"' in limpio, repr(limpio))

    for f in fallos: print("FALLA", f)
    print(f"{len(ESPERADO) + 1} casos, {len(fallos)} fallos")
    sys.exit(1 if fallos else 0)

if __name__ == "__main__":
    main()
