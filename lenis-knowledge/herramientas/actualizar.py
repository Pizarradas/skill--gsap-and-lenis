#!/usr/bin/env python3
"""Comprueba si Lenis ha cambiado y qué fichas afecta. No modifica fichas.
  python actualizar.py            compara npm y la documentación del repositorio con datos/manifiesto-fuentes.json
  python actualizar.py --aplicar  además actualiza la caché local y regenera datos/api.json
Con una CA corporativa, indica su archivo en LENIS_CA_EXTRA (también se lee NODE_EXTRA_CA_CERTS)."""
import argparse, hashlib, io, json, os, shutil, ssl, subprocess, sys, tarfile, urllib.request
from fichas import CACHE, CORPUS, DATOS, fichas, expandir_fuente

UA = {"User-Agent": "lenis-conocimiento-actualizar/1.0"}
RAW = "https://raw.githubusercontent.com/darkroomengineering/lenis/main/"
PAGINAS = ["README.md", "MANIFESTO.md", "V2-ROADMAP.md", "CONTRIBUTING.md", "packages/snap/README.md",
           "packages/react/README.md", "packages/vue/README.md"]
CTX = ssl.create_default_context()  # la verificación de certificados nunca se desactiva
_ca = os.environ.get("LENIS_CA_EXTRA") or os.environ.get("NODE_EXTRA_CA_CERTS")
if _ca and os.path.exists(_ca):
    CTX.load_verify_locations(_ca)
    CTX.verify_flags &= ~ssl.VERIFY_X509_STRICT  # esas CA no suelen cumplir el perfil estricto; la cadena se sigue verificando

def bajar(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40, context=CTX).read()

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--aplicar", action="store_true"); a = ap.parse_args()
    man_p = os.path.join(DATOS, "manifiesto-fuentes.json")
    man = json.load(open(man_p, encoding="utf8")) if os.path.exists(man_p) else {"version": None, "paginas": {}}
    try:
        npm = json.loads(bajar("https://registry.npmjs.org/lenis/latest"))
        rel = json.loads(bajar("https://api.github.com/repos/darkroomengineering/lenis/releases?per_page=100"))
        nuevas = {p: bajar(RAW + p) for p in PAGINAS}
    except Exception as e:
        sys.exit(f"Comparación INCOMPLETA: {e}. No se puede afirmar qué fichas siguen vigentes. Si tu red usa una CA propia, usa LENIS_CA_EXTRA.")
    nuevas["RELEASES.md"] = ("# Releases\n\n" + "".join(f"## {r['tag_name']} ({r['published_at'][:10]})\n\n{(r.get('body') or '').strip()}\n\n" for r in rel)).encode("utf8")
    print(f"lenis en npm: {npm['version']}  |  sistema: {man['version']}")
    h = {p: hashlib.sha256(b).hexdigest()[:16] for p, b in nuevas.items()}
    cambiadas = sorted(p for p in h if man["paginas"].get(p) != h[p])
    print(f"{len(h)} documentos: {len(cambiadas)} cambiados")
    for p in cambiadas: print("  cambiado:", p)
    pags = sorted(h)
    afectadas = {f["ruta"] for f in fichas() for x in f["meta"].get("fuentes", []) or [] if set(expandir_fuente(x, pags)) & set(cambiadas)}
    print("Fichas a revisar:" if afectadas else "Ninguna ficha afectada.")
    for r in sorted(afectadas): print("  ", r)
    if a.aplicar:
        for p, b in nuevas.items():
            d = os.path.join(CORPUS, p); os.makedirs(os.path.dirname(d), exist_ok=True); open(d, "wb").write(b)
        tb = bajar(f"https://registry.npmjs.org/lenis/-/lenis-{npm['version']}.tgz")
        pkg = os.path.join(CACHE, "pkg"); shutil.rmtree(pkg, ignore_errors=True)
        tmp = os.path.join(CACHE, "tmp"); shutil.rmtree(tmp, ignore_errors=True)
        with tarfile.open(fileobj=io.BytesIO(tb)) as t:
            for m in t.getmembers():
                if not m.isfile() or ".." in m.name or m.name.startswith("/"): continue
                d = os.path.join(tmp, m.name); os.makedirs(os.path.dirname(d), exist_ok=True)
                open(d, "wb").write(t.extractfile(m).read())
        os.replace(os.path.join(tmp, "package"), pkg); shutil.rmtree(tmp, ignore_errors=True)
        subprocess.run([sys.executable, "extraer_api.py"], cwd=os.path.dirname(os.path.abspath(__file__)), check=True)
        print("Caché actualizada. Revisa las fichas, ajusta `version` y ejecuta generar_indices.py, validar.py y probar_bloques.py varias veces.")

if __name__ == "__main__":
    main()
