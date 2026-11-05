#!/usr/bin/env python3
"""Genera todo lo derivado de las fichas: README de capa, 00-indice/{mapa,api,fuentes,etiquetas,estados}.md y datos/*.
No edites a mano los archivos generados. Uso: python generar_indices.py"""
import collections, hashlib, json, os, re
from fichas import RAIZ, DATOS, CORPUS, capas, fichas, paginas_corpus, expandir_fuente, url_de, cargar_api

AVISO = "<!-- GENERADO por herramientas/generar_indices.py: no editar a mano -->\n"
NOMBRES = {"01-fundamentos": "Fundamentos", "02-opciones": "Opciones", "03-api": "API", "04-comportamiento": "Comportamiento", "05-snap": "Snap", "06-integracion": "Integración", "07-calidad": "Calidad y diagnóstico", "08-recetas": "Recetas", "09-versiones": "Versiones", "10-tareas": "Tareas"}

def esc(s): return str(s).replace("|", "\\|")
def escribir(ruta, texto):
    with open(os.path.join(RAIZ, ruta), "w", encoding="utf8", newline="\n") as f: f.write(texto)

def main():
    todas = fichas()
    pags = paginas_corpus()
    version = (cargar_api() or {}).get("version", "?")
    por_capa = collections.defaultdict(list)
    for f in todas: por_capa[f["ruta"].split("/")[0]].append(f)
    # README de capa
    for c in capas():
        l = [AVISO, f"# {c[:2]} · {NOMBRES.get(c, c)}\n", "| Ficha | Tipo | Ámbito | Resumen |", "|---|---|---|---|"]
        for f in por_capa[c]:
            m = f["meta"]; a = os.path.basename(f["ruta"])
            l.append(f"| [{esc(m.get('titulo'))}]({a}) | {m.get('tipo')} | {m.get('ambito')} | {esc(m.get('resumen'))} |")
        escribir(f"{c}/README.md", "\n".join(l) + "\n")
    # mapa
    l = [AVISO, "# Mapa del sistema\n", f"{len(todas)} fichas sobre Lenis {version}.\n"]
    for c in capas():
        l.append(f"## [{c[:2]} · {NOMBRES.get(c, c)}](../{c}/README.md)\n")
        for f in por_capa[c]:
            m = f["meta"]
            l.append(f"- [`{m.get('id')}`](../{f['ruta']}) {esc(m.get('titulo'))}")
        l.append("")
    escribir("00-indice/mapa.md", "\n".join(l))
    # api → fichas
    api = collections.defaultdict(list)
    for f in todas:
        for s in f["meta"].get("api", []) or []: api[s].append(f)
    l = [AVISO, "# Índice de API\n", "Símbolo → ficha que lo documenta. Lista declarada en el campo `api` de cada ficha.\n", "| Símbolo | Fichas |", "|---|---|"]
    for s in sorted(api, key=str.lower):
        l.append(f"| `{s}` | " + ", ".join(f"[{f['meta']['id']}](../{f['ruta']})" for f in api[s]) + " |")
    escribir("00-indice/api.md", "\n".join(l) + "\n")
    # fuentes → fichas
    fu = collections.defaultdict(list)
    for f in todas:
        for x in f["meta"].get("fuentes", []) or []:
            for p in expandir_fuente(x, pags): fu[p].append(f["meta"]["id"])
    l = [AVISO, "# Fuentes\n", "Página oficial → fichas que se apoyan en ella.\n", "| Fuente | Fichas |", "|---|---|"]
    for p in sorted(fu):
        l.append(f"| [{esc(re.sub(r'.md$', '', p))}]({url_de(p).replace('(', '%28').replace(')', '%29')}) | " + ", ".join(sorted(set(fu[p]))) + " |")
    escribir("00-indice/fuentes.md", "\n".join(l) + "\n")
    # etiquetas
    et = collections.defaultdict(list)
    for f in todas:
        for e in f["meta"].get("etiquetas", []) or []: et[e].append(f)
    l = [AVISO, "# Etiquetas\n"]
    for e in sorted(et):
        l.append(f"- **{e}**: " + ", ".join(f"[{f['meta']['id']}](../{f['ruta']})" for f in et[e]))
    escribir("00-indice/etiquetas.md", "\n".join(l) + "\n")
    # estados
    est = collections.Counter(f["meta"].get("estado") for f in todas)
    marcas = collections.Counter(x for f in todas for x in re.findall(r"\[(O|C|E|P)\]", f["cuerpo"]))
    l = [AVISO, "# Estado del sistema\n", f"Lenis de referencia: {version}\n", "| Estado | Fichas |", "|---|---|"]
    l += [f"| {k} | {v} |" for k, v in est.most_common()]
    l += ["", "| Marca | Usos |", "|---|---|"] + [f"| [{k}] | {marcas[k]} |" for k in "OCEP"]
    pend = [f for f in todas if f["meta"].get("estado") != "verificado"]
    if pend:
        l += ["", "## Pendientes de revisión", ""] + [f"- [{f['meta']['id']}](../{f['ruta']})" for f in pend]
    escribir("00-indice/estados.md", "\n".join(l) + "\n")
    # datos
    ind = [{k: f["meta"].get(k) for k in ("id", "titulo", "capa", "tipo", "ambito", "resumen", "api", "requiere", "relacionadas", "etiquetas", "estado")} | {"ruta": f["ruta"]}
           for f in todas] if False else [dict({k: f["meta"].get(k) for k in ("id", "titulo", "capa", "tipo", "ambito", "resumen", "api", "requiere", "relacionadas", "etiquetas", "estado")}, ruta=f["ruta"]) for f in todas]
    json.dump({"version": version, "fichas": ind}, open(os.path.join(DATOS, "indice.json"), "w", encoding="utf8", newline="\n"), ensure_ascii=False, indent=1)
    l = [f"# Lenis {version}: contexto compacto", "", "Índice para agentes: abre la ficha completa solo cuando la necesites.", ""]
    for c in capas():
        l.append(f"## {c}")
        l += [f"- {f['ruta']}: {f['meta'].get('resumen')}" for f in por_capa[c]]
        l.append("")
    escribir("datos/contexto-compacto.md", "\n".join(l))
    if pags:
        h = {p: hashlib.sha256(open(os.path.join(CORPUS, p), "rb").read()).hexdigest()[:16] for p in pags}
        json.dump({"version": version, "paginas": h}, open(os.path.join(DATOS, "manifiesto-fuentes.json"), "w", encoding="utf8", newline="\n"), indent=0, sort_keys=True)
    print(f"{len(todas)} fichas indexadas; {len(api)} símbolos; {len(fu)} páginas citadas")

if __name__ == "__main__":
    main()
