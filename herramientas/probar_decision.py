#!/usr/bin/env python3
"""Casos de decidir.py: lo que pide el encargo y el perfil que debe salir. Sale con 1 si alguno falla."""
import sys
from decidir import resolver, catalogo
from fichas import ids_sistema, fichas

CASOS = [
    ([], "ninguno"),
    (["sitio-contenido"], "ninguno"),
    (["sitio-contenido", "revelar-simple", "ir-a-punto", "modal"], "ninguno"),
    (["encajar-secciones"], "ninguno"),
    (["sitio-contenido", "scroll-suave"], "ninguno"),
    (["secuencia"], "gsap"),
    (["pin", "scrub"], "gsap"),
    (["parallax", "texto", "svg"], "gsap"),
    (["ya-gsap", "revelar-simple"], "gsap"),
    (["sitio-contenido", "secuencia"], "gsap"),
    (["pin", "sitio-contenido", "scroll-suave"], "gsap"),
    (["scroll-suave"], "lenis"),
    (["canvas-dom"], "lenis"),
    (["suave-contenedor"], "lenis"),
    (["infinito"], "lenis"),
    (["ya-lenis", "encajar-secciones"], "lenis"),
    (["scroll-suave", "teclado-barra-suave", "sticky-fixed"], "lenis"),
    (["scroll-suave", "pin"], "gsap+lenis"),
    (["canvas-dom", "secuencia"], "gsap+lenis"),
    (["ya-lenis", "pin"], "gsap+lenis"),
    (["ya-gsap", "scroll-suave"], "gsap+lenis"),
    (["scroll-suave", "scrub", "sticky-fixed"], "gsap+lenis"),
    (["efectos-data", "sticky-fixed"], "gsap"),
    (["efectos-data", "sticky-fixed", "scroll-suave"], "gsap+lenis"),
    (["efectos-data", "sitio-contenido"], "gsap"),
    (["ya-smoother", "suave-contenedor"], "gsap+lenis"),
    (["scroll-suave", "scrub", "terceros-escriben", "marcado-fijo"], "gsap+lenis"),
    (["teclado-barra-suave"], "lenis"),
    (["teclado-barra-suave", "secuencia"], "gsap-smoother"),
    (["ya-lenis", "sitio-contenido"], "lenis"),
    (["ya-lenis", "sitio-contenido", "pin"], "gsap+lenis"),
    (["ya-smoother", "sitio-contenido"], "gsap-smoother"),
    (["sitio-contenido", "suave-contenedor"], "ninguno"),
    (["efectos-data"], "gsap-smoother"),
    (["scroll-suave", "pin", "terceros-escriben"], "gsap-smoother"),
    (["ya-smoother", "pin"], "gsap-smoother"),
    (["ya-smoother", "sticky-fixed"], "gsap-smoother"),
    (["ya-lenis", "ya-smoother"], None),
    (["no-existe"], None),
]

def main():
    fallos = 0
    for pedidas, esperado in CASOS:
        r = resolver(pedidas)
        if r.get("perfil") != esperado:
            fallos += 1
            print("FALLO", pedidas, "espera", esperado, "da", r.get("perfil"), r.get("error", ""))
    # Sin GSAP, nada de lectura de GSAP; sin Lenis, nada de Lenis ni de fichas de la combinación
    grupos, cat = catalogo()
    gs, ls = ids_sistema("gsap"), ids_sistema("lenis")
    orq = {f["meta"]["id"] for f in fichas()}
    for i, n in cat.items():
        for x in n["lee"]:
            s, _, c = x.partition(":")
            if (s == "gsap" and c not in gs) or (s == "lenis" and c not in ls) or (not c and x not in orq):
                fallos += 1
                print("FALLO lectura inexistente", i, x)
    for pedidas, esperado in [(["pin"], "gsap"), (["scroll-suave"], "lenis"), (["revelar-simple"], "ninguno")]:
        r = resolver(pedidas)
        if ("lenis" not in esperado and any(x.startswith("lenis:") for x in r["lee"])) or ("gsap" not in esperado and any(x.startswith("gsap:") for x in r["lee"])):
            fallos += 1
            print("FALLO lectura fuera de perfil", pedidas, r["lee"])
    # Toda combinación de dos necesidades da un perfil o un error explicado
    ids = list(cat)
    n = 0
    for a in ids:
        for b in ids:
            r = resolver([a, b])
            n += 1
            if "perfil" not in r and "error" not in r:
                fallos += 1
    print(f"{len(CASOS)} casos, {n} pares, {fallos} fallos")
    sys.exit(1 if fallos else 0)

if __name__ == "__main__":
    main()
