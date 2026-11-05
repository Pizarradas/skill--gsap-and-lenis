#!/usr/bin/env python3
"""Ejecuta los bloques ```js de las fichas (y plantillas/) en Chrome/Edge headless real, con GSAP, sus plugins de scroll y Lenis cargados a la vez. No activa lagSmoothing(0): es objeto de las reglas.
Uso: python probar_bloques.py [--capa 07-scroll] [--ficha scr-pin] [--navegador ruta] [--espera 700] [--plantillas]
Convenciones: ver 00-indice/convenciones.md.
"""
import argparse, html, http.server, json, os, re, shutil, socket, socketserver, subprocess, sys, tempfile, glob, platform, threading, time
from fichas import RAIZ, CACHE, CACHE_GSAP, fichas

def bloques(cuerpo):
    """(lenguaje, info, código, línea)"""
    r = []
    for m in re.finditer(r"(?m)^```([^\n]*)\n(.*?)^```\s*$", cuerpo, re.S):
        info = m.group(1).strip().split()
        r.append((info[0] if info else "", info[1:], m.group(2), cuerpo[:m.start()].count("\n") + 1))
    return r

WSL = "microsoft" in platform.release().lower()
CANDIDATOS = ["/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
              "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
              r"C:\Program Files\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
ORDEN = ["lenis", "lenis-snap"]
GSAP = ["gsap", "ScrollTrigger", "ScrollToPlugin", "ScrollSmoother", "Observer", "Draggable", "InertiaPlugin", "Flip", "SplitText"]
ETIQUETAS = "svg path circle rect line ellipse polygon polyline img h1 h2 h3 p ul li section main header footer nav button span a canvas video".split()
SVGS = {"path", "circle", "rect", "line", "ellipse", "polygon", "polyline"}

def fixture(code, base=""):
    """DOM mínimo para los selectores del código que no estén ya en `base`."""
    limpio = re.sub(r"(?m)^\s*//.*$", "", code)
    sels = set(re.findall(r"""["'`]([.#][\w-]+(?:[ >,.#:\[\]=\w-]*)?)["'`]""", limpio))
    sels |= set(x for x in re.findall(r"""["'`]([a-z0-9]+)["'`]""", limpio) if x in ETIQUETAS)
    h = ['<div id="fx-gen">']
    hechos = set("." + c for grupo in re.findall(r'class="([^"]*)"', base) for c in grupo.split())
    hechos |= set("#" + c for c in re.findall(r'id="([^"]*)"', base))
    for s in sels:
        for parte in re.findall(r"[.#][\w-]+", s):
            if parte in hechos: continue
            hechos.add(parte)
            a = f'class="{parte[1:]}"' if parte[0] == "." else f'id="{parte[1:]}"'
            n = 3 if parte[0] == "." else 1
            h += [f'<div {a} style="width:80px;height:80px;">texto de prueba uno dos</div>'] * n
    tags = {t for s in sels for t in re.findall(r"(?:^|[ >,])([a-z][a-z0-9]*)", s)
            if t in ETIQUETAS and "<" + t not in base}
    for t in sorted(tags):
        if t in SVGS or t == "svg":
            h.append('<svg width="200" height="200" viewBox="0 0 200 200"><path d="M10 10 L190 10 L190 190 Z"/><circle cx="50" cy="50" r="30"/><rect x="5" y="5" width="20" height="20"/></svg>')
        elif t != "img":
            h += [f"<{t}>texto de prueba uno dos</{t}>"] * 2
    return "".join(h) + "</div>"

def preparar(code):
    code = re.sub(r"(?m)^\s*import\s[^\n]*$", "", code)
    code = re.sub(r"(?m)^\s*export\s+default\s+", "", code)
    code = re.sub(r"(?m)^\s*export\s+", "", code)
    return code

PLANT = """<!doctype html><meta charset=utf8><style>body{{margin:0}}.__alto{{height:3000px}}</style>
<body>{fx}<div class=__alto></div>
<link rel="stylesheet" href="lenis.css">
<script>/* el navegador frena rAF en iframes fuera de pantalla: se sustituye por un temporizador */
window.requestAnimationFrame=function(f){{return setTimeout(function(){{f(performance.now());}},16);}};
window.cancelAnimationFrame=function(i){{clearTimeout(i);}};
</script>
{libs}
<script>
window.__r={{warn:[],err:[]}};
/* gestos reales: Lenis solo reacciona a eventos de rueda y toque */
window.rueda=function(dy,el,dx){{(el||document.documentElement).dispatchEvent(new WheelEvent('wheel',{{deltaY:dy,deltaX:dx||0,deltaMode:0,bubbles:true,cancelable:true,composed:true}}));}};
window.espera=function(ms){{return new Promise(function(r){{setTimeout(r,ms);}});}};
window.toque=function(tipo,x,y,el){{var d=el||document.documentElement;var t=new Touch({{identifier:1,target:d,clientX:x,clientY:y}});d.dispatchEvent(new TouchEvent(tipo,{{touches:tipo==='touchend'?[]:[t],changedTouches:[t],targetTouches:tipo==='touchend'?[]:[t],bubbles:true,cancelable:true,composed:true}}));}};
var ow=console.warn,oe=console.error;
console.warn=function(){{var s=[].slice.call(arguments).join(' ');__r.warn.push(s);}};
console.error=function(){{__r.err.push([].slice.call(arguments).join(' '));}};
addEventListener('error',function(e){{__r.err.push(String(e.message));}});
addEventListener('unhandledrejection',function(e){{__r.err.push('rechazo: '+e.reason);}});
{plug}
</script>
<script>
window.__fin=(async function(){{
/* espera a que el ticker sea regular: el primer tick de la página puede saltar 50 ms o más y altera tweens cortos */
await new Promise(function(r){{setTimeout(r,120);}});
{code}
}})().catch(function(e){{__r.err.push(String(e&&e.stack||e));}});
</script>
<script>
__fin.then(function(){{setTimeout(function(){{
  var p=[];
  {pruebas}
  parent.postMessage({{n:{n},warn:__r.warn,err:__r.err,pruebas:p}},'*');
}},{espera});}});
</script>"""

RUNNER = """<!doctype html><meta charset=utf8><title>r</title><body><pre id=salida></pre><script>
var N={total},sig=0,act=0,res=[],C=6;
function lanza(){{while(act<C&&sig<N){{var f=document.createElement('iframe');f.width=1000;f.height=700;f.style.position='absolute';f.style.left='-3000px';f.src='b'+sig+'.html';f.id='f'+sig;document.body.appendChild(f);sig++;act++;}}}}
addEventListener('message',function(e){{res.push(e.data);act--;var f=document.getElementById('f'+e.data.n);if(f)f.remove();
  if(res.length>=N){{document.getElementById('salida').textContent='@@INI@@'+JSON.stringify(res)+'@@FIN@@';document.title='fin';if(location.protocol.indexOf('http')===0)fetch('/resultado',{{method:'POST',body:JSON.stringify(res)}});}}else lanza();}});
lanza();
</script>"""

def dist(pkg, nombre):
    for c in (f"{nombre}.min.js", f"{nombre}.js"):
        p = os.path.join(pkg, "dist", c)
        if os.path.exists(p): return p
    raise SystemExit("falta " + nombre)

def navegador(pedido):
    if pedido: return pedido
    for c in CANDIDATOS:
        if os.path.exists(c): return c
    raise SystemExit("No encuentro Chrome/Edge: usa --navegador")

def carpeta_temporal(exe):
    if exe.endswith(".exe") and exe.startswith("/mnt/"):
        base = glob.glob("/mnt/c/Users/*/AppData/Local/Temp")
        base = [b for b in base if os.access(b, os.W_OK)]
        return tempfile.mkdtemp(prefix="orq-pruebas-", dir=base[0])
    return tempfile.mkdtemp(prefix="orq-pruebas-")

def nativa(exe, p):
    if exe.endswith(".exe") and exe.startswith("/mnt/"):
        return subprocess.run(["wslpath", "-w", p], capture_output=True, text=True).stdout.strip()
    return p

def firefox_exe():
    for c in ("/mnt/c/Program Files/Mozilla Firefox/firefox.exe", r"C:\Program Files\Mozilla Firefox\firefox.exe",
              "/usr/bin/firefox", "/Applications/Firefox.app/Contents/MacOS/firefox"):
        if os.path.exists(c): return c
    raise SystemExit("No encuentro Firefox")

def correr_firefox(exe, t, total):
    """Firefox no tiene --dump-dom: sirve la carpeta por HTTP y la página envía el resultado por POST."""
    res = {}
    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k): super().__init__(*a, directory=t, **k)
        def log_message(self, *a): pass
        def do_POST(self):
            res["datos"] = self.rfile.read(int(self.headers["Content-Length"])).decode("utf8")
            self.send_response(200); self.end_headers()
    class S(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True
    wsl = exe.startswith("/mnt/")
    # Solo la dirección interna: la de WSL si Firefox corre en Windows, o localhost. Nunca todas las interfaces
    ip = subprocess.run(["hostname", "-I"], capture_output=True, text=True).stdout.split()[0] if wsl else "127.0.0.1"
    srv = S((ip, 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    perfil = os.path.join(t, "perfil-ff"); os.makedirs(perfil)
    open(os.path.join(perfil, "user.js"), "w").write('user_pref("browser.shell.checkDefaultBrowser",false);user_pref("datareporting.policy.dataSubmissionEnabled",false);user_pref("toolkit.telemetry.reportingpolicy.firstRun",false);')
    p = subprocess.Popen([exe, "--headless", "--no-remote", "--profile", nativa(exe, perfil), f"http://{ip}:{srv.server_port}/index.html"],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    fin = time.time() + max(120, total * 3)
    while "datos" not in res and time.time() < fin: time.sleep(0.5)
    marca = os.path.basename(t)
    if wsl:  # solo cierra los procesos de este perfil temporal, nunca el Firefox del usuario
        subprocess.run(["powershell.exe", "-NoProfile", "-Command", f"Get-CimInstance Win32_Process -Filter \"Name='firefox.exe'\" | Where-Object {{ $_.CommandLine -like '*{marca}*' }} | ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }}"], capture_output=True)
        time.sleep(1)
    p.terminate(); srv.shutdown()
    return res.get("datos")

def recoger(a):
    casos = []
    for f in fichas(a.capa) if not a.ficha else [x for x in fichas() if x["meta"].get("id") == a.ficha]:
        ult = None
        for lang, info, code, linea in bloques(f["cuerpo"]):
            if lang == "html": ult = code; continue
            if lang != "js" or "fragmento" in info or "invalido" in info or "antiguo" in info: continue
            casos.append({"ruta": f["ruta"], "linea": linea, "code": code, "html": ult})
    if a.plantillas:
        for p in sorted(glob.glob(os.path.join(RAIZ, "plantillas", "**", "*.prueba.js"), recursive=True)):
            code = open(p, encoding="utf8").read()
            rel = os.path.relpath(p, RAIZ).replace(os.sep, "/")
            base = p[:-len(".prueba.js")]
            mod = base + ".js"
            pre = open(mod, encoding="utf8").read() if os.path.exists(mod) else ""
            h = open(base + ".html", encoding="utf8").read() if os.path.exists(base + ".html") else None
            casos.append({"ruta": rel, "linea": 1, "code": pre + "\n" + code, "html": h})
    return casos

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--capa"); ap.add_argument("--ficha"); ap.add_argument("--navegador")
    ap.add_argument("--firefox", action="store_true"); ap.add_argument("--espera", type=int, default=700); ap.add_argument("--plantillas", action="store_true")
    a = ap.parse_args()
    casos = recoger(a)
    if not casos: print("nada que probar"); return
    exe = firefox_exe() if a.firefox else navegador(a.navegador)
    t = carpeta_temporal(exe)
    pkg = os.path.join(CACHE, "pkg")
    try:
        shutil.copy(os.path.join(pkg, "dist", "lenis.css"), t)
        libs = []
        for n in ORDEN:
            shutil.copy(dist(pkg, n), t); libs.append(f'<script src="{os.path.basename(dist(pkg, n))}"></script>')
        libs_g = []
        for n in GSAP:
            shutil.copy(dist(os.path.join(CACHE_GSAP, "pkg"), n), t); libs_g.append(f'<script src="{os.path.basename(dist(os.path.join(CACHE_GSAP, "pkg"), n))}"></script>')
        for i, c in enumerate(casos):
            pr = [re.sub(r"\s+//.*$", "", x).strip() for x in re.findall(r"(?m)^\s*//\s*prueba:\s*(.+)$", c["code"])]
            js = "\n".join(f"try{{p.push([{json.dumps(x)},!!(window.__ev||eval)({json.dumps(x)})]);}}catch(e){{p.push([{json.dumps(x)},false,String(e)]);}}" for x in pr)
            code = preparar(c["code"])
            # expone variables declaradas para que las pruebas las vean
            nom = re.findall(r"(?m)^(?:let|const|var)\s+([A-Za-z_$][\w$]*)", code)
            fn = re.findall(r"(?m)^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)", code)
            # las aserciones se evalúan dentro del bloque: ven el valor actual de cualquier variable
            code += "\n" + "\n".join(f"window.{n}={n};" for n in nom + fn) + "\nwindow.__ev=function(__s){return eval(__s);};"
            open(os.path.join(t, f"b{i}.html"), "w", encoding="utf8").write(
                PLANT.format(fx=(c["html"] or "") + fixture(c["code"], c["html"] or ""),
                             libs="".join(libs_g + libs),
                             plug="gsap.registerPlugin(" + ",".join(GSAP[1:]) + ");", code=code,
                             pruebas=js, n=i, espera=a.espera))
        open(os.path.join(t, "index.html"), "w", encoding="utf8").write(RUNNER.format(total=len(casos)))
        perfil = os.path.join(t, "perfil")
        presupuesto = 5000 + (a.espera + 2500) * (len(casos) // 6 + 2)
        if a.firefox:
            crudo = correr_firefox(exe, t, len(casos))
            if not crudo:
                print("SIN RESULTADO en Firefox"); sys.exit(2)
            res = {x["n"]: x for x in json.loads(crudo)}
        else:
            cmd = [exe, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--allow-file-access-from-files",
                   f"--user-data-dir={nativa(exe, perfil)}", f"--virtual-time-budget={presupuesto}", "--window-size=1000,700",
                   "--dump-dom", "file:///" + nativa(exe, os.path.join(t, "index.html")).replace("\\", "/")]
            r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf8", errors="replace", timeout=max(180, len(casos) * 3))
            m = re.search(r"@@INI@@(.*?)@@FIN@@", r.stdout, re.S)
            if not m:
                print("SIN RESULTADO. stdout:", r.stdout[:400], "stderr:", r.stderr[-400:]); sys.exit(2)
            res = {x["n"]: x for x in json.loads(html.unescape(m.group(1)))}
        malos = 0
        for i, c in enumerate(casos):
            x = res.get(i)
            prob = []
            if not x: prob.append("no terminó")
            else:
                prob += ["excepción: " + e[:200] for e in x["err"]]
                prob += ["aviso: " + w[:200] for w in x["warn"] if "Please gsap.registerPlugin" not in w]
                prob += ["prueba falsa: " + " ".join(map(str, p[0:1] + p[2:])) for p in x["pruebas"] if not p[1]]
            if prob:
                malos += 1
                print(f"FALLA {c['ruta']} L{c['linea']}")
                for z in prob: print("   ", z)
        print(f"{len(casos)-malos}/{len(casos)} bloques correctos en {os.path.basename(exe)}")
        sys.exit(1 if malos else 0)
    finally:
        shutil.rmtree(t, ignore_errors=True)

if __name__ == "__main__":
    main()
