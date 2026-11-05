#!/usr/bin/env python3
"""Resuelve qué perfil usar a partir de lo que se pide. La lógica es la de 01-decidir/orq-que-usar.md.
Uso: python decidir.py pin secuencia scroll-suave [--json]
     python decidir.py --lista        necesidades disponibles
Sale con 0 si hay perfil, 2 si los datos de entrada son contradictorios o desconocidos."""
import json, os, sys
from functools import lru_cache
from fichas import DATOS, fichas, reglas

ARRANQUE = {
    "ninguno": 'iniciarMovimiento({ perfil: "ninguno" })',
    "gsap": 'iniciarMovimiento({ perfil: "gsap", gsap, ScrollTrigger })',
    "gsap-smoother": 'iniciarMovimiento({ perfil: "gsap-smoother", gsap, ScrollTrigger, ScrollSmoother, raiz: "#smooth-wrapper", content: "#smooth-content" })',
    "lenis": 'iniciarMovimiento({ perfil: "lenis", Lenis })',
    "gsap+lenis": 'iniciarMovimiento({ perfil: "gsap+lenis", gsap, ScrollTrigger, Lenis })',
}

@lru_cache(maxsize=None)
def catalogo():
    d = json.load(open(os.path.join(DATOS, "necesidades.json"), encoding="utf8"))
    return d["grupos"], {n["id"]: n for g in d["grupos"] for n in g["necesidades"]}

@lru_cache(maxsize=None)
def _perfiles_fichas():
    return {f["meta"]["id"]: f["meta"].get("perfiles", []) for f in fichas()}

@lru_cache(maxsize=None)
def _reglas():
    return tuple(reglas())

def resolver(pedidas):
    _, cat = catalogo()
    desconocidas = [p for p in pedidas if p not in cat]
    if desconocidas:
        return {"error": "necesidad desconocida: " + ", ".join(desconocidas)}
    ns = [cat[p] for p in pedidas]
    S = {x for n in ns for x in n["scroll"]}
    if "efectos" in S and not S & {"nativo", "no-smoother"}:
        S.add("suave")
    con = lambda v: [n["id"] for n in ns if v in n["scroll"]]
    G = any(n["gsap"] for n in ns)
    existente = [p for p in pedidas if p in ("ya-lenis", "ya-smoother")]
    avisos = []
    if "ya-lenis" in pedidas and "ya-smoother" in pedidas:
        return {"error": "ya-lenis y ya-smoother: el proyecto ya incumple O03. Retira uno antes de decidir: 04-combinaciones/cmb-smoother.md"}
    quiere = bool(S & {"suave", "lenis", "smoother"})
    if quiere and "nativo" in S and existente:
        avisos.append(f"{', '.join(con('nativo'))} desaconseja el suavizado, pero {', '.join(existente)} ya lo tiene: se conserva. No se migra por gusto.")
    if quiere and "nativo" in S and not existente:
        avisos.append(f"Se pidió suavizado ({', '.join(con('suave') or con('lenis'))}), pero {', '.join(con('nativo'))} lo desaconseja: queda nativo. Si son vistas distintas, decide cada una por separado: orq-que-usar, \"Un proyecto, un perfil\". Si es la misma y el encargo lo exige tras valorarlo, quita esa necesidad de la lista.")
        escr = "nativo"
    elif not quiere:
        escr = "nativo"
    elif "smoother" in S and "lenis" in S:
        escr = "lenis"
        avisos.append(f"ScrollSmoother existente no cubre {', '.join(x for x in con('lenis'))}: hay que migrar a Lenis. Retíralo del todo: cmb-smoother.")
    elif "smoother" in S:
        escr = "smoother"
        if "no-smoother" in S:
            avisos.append(f"{', '.join(con('no-smoother'))} choca con ScrollSmoother: cámbialo por `pin` o sácalo del contenido (O31), o migra a Lenis.")
    elif "lenis" in S or "no-smoother" in S:
        escr = "lenis"
        if "smoother-pref" in S:
            avisos.append(f"Con Lenis se pierde {', '.join(con('smoother-pref'))}: ScrollSmoother queda descartado por {', '.join(con('lenis') + con('no-smoother'))}.")
    elif "smoother-pref" in S and G:
        escr = "smoother"
    else:
        escr = "lenis"
        if "smoother-pref" in S:
            avisos.append(f"Sin GSAP no hay ScrollSmoother: con Lenis se pierde {', '.join(con('smoother-pref'))}. Si es imprescindible, añade ya-gsap.")
    if escr == "smoother":
        G = True
    perfil = {("nativo", False): "ninguno", ("nativo", True): "gsap", ("lenis", False): "lenis", ("lenis", True): "gsap+lenis", ("smoother", True): "gsap-smoother"}[(escr, G)]
    if "efectos-data" in pedidas and perfil != "gsap-smoother":
        avisos.append("Sin ScrollSmoother no hay `data-speed`: escribe el parallax con `scrub`, con el padre como disparador: gsap:rec-parallax.")
    if "lenis" in perfil and "eje-horizontal" in pedidas:
        avisos.append("`mov.irA` y `mov.posicion` son verticales: en horizontal usa `mov.lenis` directamente, y `horizontal: true` en ScrollTrigger (O17).")
    if "lenis" in perfil and "encajar-secciones" in pedidas:
        avisos.append("`lenis/snap` no sigue a `mov.reducido`: llama a `snap.stop()` dentro de `mov.añadir` si `reducido`.")
    if "lenis" in perfil and "terceros-escriben" in pedidas:
        avisos.append("Con Lenis, el código ajeno que escribe el scroll se pierde en plena inercia (O08): cámbialo por `lenis.scrollTo`.")
    per = _perfiles_fichas()
    def aplica(x):
        s, _, i = x.partition(":")
        if s == "gsap" and i:
            return "gsap" in perfil and (not i.startswith("scr-smoother") or perfil == "gsap-smoother")
        if s == "lenis" and i:
            return "lenis" in perfil
        return perfil in per.get(x, [perfil])
    lee = []
    for n in ns:
        for x in n["lee"]:
            if x not in lee and aplica(x):
                lee.append(x)
    if perfil != "ninguno":
        lee = ["orq-propiedad", "orq-ciclo"] + [x for x in lee if x not in ("orq-propiedad", "orq-ciclo")]
    arranque = ARRANQUE[perfil]
    if perfil == "gsap" and "ir-a-punto" in pedidas:
        arranque = arranque.replace("ScrollTrigger }", "ScrollTrigger, ScrollToPlugin }")
    rs = [r for r in _reglas() if perfil in r["perfiles"]]
    return {"perfil": perfil, "avisos": avisos, "lee": lee, "arranque": arranque,
            "bloqueantes": [r["id"] for r in rs if r["severidad"] == "bloqueante"],
            "reglas_aviso": [r["id"] for r in rs if r["severidad"] == "aviso"]}

def main():
    a = sys.argv[1:]
    if "--lista" in a or not [x for x in a if x != "--json"]:
        for g in catalogo()[0]:
            print(f"\n{g['grupo']}")
            for n in g["necesidades"]:
                print(f"  {n['id']:<22}{n['texto']}")
        return
    pedidas = [x for x in a if not x.startswith("--")]
    r = resolver(pedidas)
    if "--json" in a:
        print(json.dumps(r, ensure_ascii=False, indent=2))
    elif "error" in r:
        print("ERROR:", r["error"])
    else:
        print(f"Perfil: {r['perfil']}\nArranque: {r['arranque']}")
        for x in r["avisos"]:
            print("AVISO:", x)
        print("Lee:", ", ".join(r["lee"]) or "nada más")
        print("Prohibido en este perfil:", ", ".join(r["bloqueantes"]) or "nada")
        print("Revisa:", ", ".join(r["reglas_aviso"]) or "nada")
    sys.exit(2 if "error" in r else 0)

if __name__ == "__main__":
    main()
