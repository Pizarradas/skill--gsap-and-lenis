#!/usr/bin/env python3
"""Comprueba si GSAP ha cambiado y qué fichas afecta. No modifica fichas.
  python actualizar.py            compara npm y la documentación oficial con datos/manifiesto-fuentes.json
  python actualizar.py --aplicar  además sustituye la caché local y regenera datos/api.json
Con una CA corporativa, indica su archivo en GSAP_CA_EXTRA (también se lee NODE_EXTRA_CA_CERTS).
Usa datos solo de gsap.com y registry.npmjs.org. Las caché vive fuera del proyecto, en ~/.cache/gsap-conocimiento
(o GSAP_CACHE): el texto oficial no se redistribuye con este sistema."""
import argparse, hashlib, io, json, os, re, shutil, ssl, subprocess, sys, tarfile, time, urllib.parse, urllib.request
from fichas import CACHE, CORPUS, DATOS, fichas, expandir_fuente

UA = {"User-Agent": "gsap-conocimiento-actualizar/1.0"}
CTX = ssl.create_default_context()  # la verificación de certificados nunca se desactiva
_ca = os.environ.get("GSAP_CA_EXTRA") or os.environ.get("NODE_EXTRA_CA_CERTS")
if _ca and os.path.exists(_ca):
    CTX.load_verify_locations(_ca)  # redes con CA corporativa: se añade a las del sistema
    CTX.verify_flags &= ~ssl.VERIFY_X509_STRICT  # esas CA no suelen cumplir el perfil estricto de Python 3.13+; la cadena se sigue verificando

def bajar(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40, context=CTX).read()

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--aplicar", action="store_true"); a = ap.parse_args()
    man_p = os.path.join(DATOS, "manifiesto-fuentes.json")
    man = json.load(open(man_p, encoding="utf8")) if os.path.exists(man_p) else {"version": None, "paginas": {}}
    try:
        npm = json.loads(bajar("https://registry.npmjs.org/gsap/latest"))
        llms = bajar("https://gsap.com/llms.txt").decode("utf8")
    except Exception as e:
        sys.exit(f"No se pudo consultar el origen: {e}. Si tu red usa una CA propia, indica su archivo en GSAP_CA_EXTRA.")
    print(f"gsap en npm: {npm['version']}  |  sistema: {man['version']}")
    rutas = list(dict.fromkeys(re.findall(r"\]\((/.*?\.md)\)\n", llms)))
    nuevo_dir = os.path.join(CACHE, "docs.nuevo")
    shutil.rmtree(nuevo_dir, ignore_errors=True)
    actuales, fallos = {}, []
    for p in rutas:
        rel = p.lstrip("/")
        try:
            b = bajar("https://gsap.com" + urllib.parse.quote(p, safe="/().-_"))
        except Exception as e:
            fallos.append(f"{rel}: {e}"); continue
        d = os.path.join(nuevo_dir, rel); os.makedirs(os.path.dirname(d), exist_ok=True)
        open(d, "wb").write(b)
        actuales[rel] = hashlib.sha256(b).hexdigest()[:16]
        time.sleep(0.15)
    viejas = man["paginas"]
    cambiadas = sorted(k for k in actuales if k in viejas and viejas[k] != actuales[k])
    nuevas = sorted(set(actuales) - set(viejas))
    borradas = sorted(set(viejas) - set(actuales)) if not fallos else []
    print(f"{len(actuales)} páginas: {len(cambiadas)} cambiadas, {len(nuevas)} nuevas, {len(borradas)} eliminadas, {len(fallos)} con error")
    for x in fallos[:10]: print("  error", x)
    if fallos:
        shutil.rmtree(nuevo_dir, ignore_errors=True)
        sys.exit(f"Comparación INCOMPLETA: {len(fallos)} páginas sin descargar, así que no se puede afirmar qué fichas siguen vigentes. "
                 "Si tu red usa una CA propia, indica su archivo en GSAP_CA_EXTRA.")
    for t, l in (("cambiada", cambiadas), ("nueva", nuevas), ("eliminada", borradas)):
        for p in l: print(f"  {t}: {p}")
    pags = sorted(set(actuales) | set(viejas))
    afectadas = set()
    for f in fichas():
        for x in f["meta"].get("fuentes", []) or []:
            if set(expandir_fuente(x, pags)) & set(cambiadas + borradas): afectadas.add(f["ruta"])
    print("Fichas a revisar:" if afectadas else "Ninguna ficha afectada.")
    for r in sorted(afectadas): print("  ", r)
    if a.aplicar:
        if fallos: sys.exit("Hay descargas fallidas: no se aplica nada.")
        shutil.rmtree(CORPUS, ignore_errors=True); os.replace(nuevo_dir, CORPUS)
        tb = bajar(f"https://registry.npmjs.org/gsap/-/gsap-{npm['version']}.tgz")
        pkg = os.path.join(CACHE, "pkg"); shutil.rmtree(pkg, ignore_errors=True)
        tmp = os.path.join(CACHE, "tmp"); shutil.rmtree(tmp, ignore_errors=True)
        with tarfile.open(fileobj=io.BytesIO(tb)) as t:
            for m in t.getmembers():
                if not m.isfile() or ".." in m.name or m.name.startswith("/"): continue
                d = os.path.join(tmp, m.name); os.makedirs(os.path.dirname(d), exist_ok=True)
                open(d, "wb").write(t.extractfile(m).read())
        os.replace(os.path.join(tmp, "package"), pkg); shutil.rmtree(tmp, ignore_errors=True)
        subprocess.run([sys.executable, "extraer_api.py"], cwd=os.path.dirname(os.path.abspath(__file__)), check=True)
        print("Caché actualizada. Revisa las fichas, ajusta `version` y ejecuta generar_indices.py, validar.py y probar_bloques.py.")
    else:
        shutil.rmtree(nuevo_dir, ignore_errors=True)

if __name__ == "__main__":
    main()
