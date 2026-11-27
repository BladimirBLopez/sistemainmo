CLASE = "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
nuevos = {}

def preparar(ruta, pares, seguro=False):
    s = open(ruta, encoding="utf-8").read()
    if seguro:
        assert 'type="checkbox"' not in s, ruta + " tiene checkbox"
        assert 'type="file"' not in s, ruta + " tiene file"
    for old, new in pares:
        assert s.count(old) == 1, (ruta, old[:70])
        s = s.replace(old, new)
    nuevos[ruta] = s

for ruta, nombre in [
    ("components/admin/FormularioCampana.js", "campo"),
    ("components/admin/FormularioGasto.js", "clase"),
    ("components/admin/FormularioContenido.js", "clase"),
    ("components/admin/FormularioMetricas.js", "clase"),
    ("components/admin/FormularioAgente.js", "clases"),
]:
    preparar(ruta, [(f'const {nombre} = "{CLASE}";', f'const {nombre} = "input";')], True)

preparar("components/admin/FormularioCanal.js",
         [('const clase =\n  "' + CLASE + '";', 'const clase = "input";')], True)

preparar("components/admin/AsignacionesAgente.js",
         [('const clasesInput = "min-w-0 flex-1 rounded-xl border border-slate-300 p-3 text-sm";',
           'const clasesInput = "input min-w-0 flex-1";')], True)

preparar("app/agente/leads/page.js", [
    ('className="rounded-xl border p-3 text-sm sm:col-span-2" />', 'className="input sm:col-span-2" />'),
    ('<select name="estado" defaultValue={estado} className="rounded-xl border bg-white p-3 text-sm">',
     '<select name="estado" defaultValue={estado} className="input">'),
    ('<select name="prioridad" defaultValue={prioridad} className="rounded-xl border bg-white p-3 text-sm">',
     '<select name="prioridad" defaultValue={prioridad} className="input">'),
    ('<button className="rounded-xl bg-slate-900 p-3 font-semibold text-white">',
     '<button type="submit" className="btn-primary">'),
    ('className="rounded-xl border p-3 text-center font-semibold text-slate-700">', 'className="btn-ghost">'),
])

preparar("app/agente/clientes/page.js", [
    ('className="rounded-xl border border-slate-300 p-3 sm:col-span-2"', 'className="input sm:col-span-2"'),
    ('className="rounded-xl border border-slate-300 bg-white p-3"', 'className="input"'),
    ('<button className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white">',
     '<button type="submit" className="btn-primary">'),
    ('className="rounded-xl border px-5 py-3 text-center font-semibold"', 'className="btn-ghost"'),
])

for ruta, s in nuevos.items():
    open(ruta, "w", encoding="utf-8").write(s)
print("OK", len(nuevos), "archivos")
