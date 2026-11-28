import fs from "node:fs";
const L = (...a) => a.join("\n");
function r(file, de, a) {
  const s = fs.readFileSync(file, "utf8");
  if (!s.includes(de)) throw new Error("No encontrado en " + file + ": " + de.slice(0, 60));
  fs.writeFileSync(file, s.replace(de, () => a));
  console.log("OK", file);
}

const q = 'const proyectos = (await sql`SELECT id, nombre FROM public.proyectos ORDER BY nombre`)\n    .map(p => ({ id: String(p.id), nombre: p.nombre }));\n\n';

const A = "app/api/admin/propiedades/route.js";
r(A, "        superficie_terreno_m2, superficie_construida_m2\n      )",
     "        superficie_terreno_m2, superficie_construida_m2,\n        proyecto_id\n      )");
r(A, "        ${caracteristicas.superficie_construida_m2}\n      )",
     "        ${caracteristicas.superficie_construida_m2},\n        ${caracteristicas.proyecto_id}\n      )");

r("app/api/admin/propiedades/[id]/route.js",
  "        actualizado_en = NOW()\n      WHERE id = ${id}",
  "        proyecto_id = ${p.proyecto_id},\n        actualizado_en = NOW()\n      WHERE id = ${id}");

const selNuevo = L(
'      {proyectos.length > 0 && (',
'        <div>',
'          <label htmlFor="proyecto_id" className="mb-2 block text-sm font-medium">',
'            Proyecto (opcional)',
'          </label>',
'          <select id="proyecto_id" name="proyecto_id" defaultValue="" className="input">',
'            <option value="">Sin proyecto</option>',
'            {proyectos.map(p => (',
'              <option key={p.id} value={p.id}>{p.nombre}</option>',
'            ))}',
'          </select>',
'        </div>',
'      )}',
'',
'      <div>',
'        <label htmlFor="descripcion" className="mb-2 block text-sm font-medium">');

const F = "components/admin/FormularioPropiedad.js";
r(F, "export default function FormularioPropiedad() {",
     "export default function FormularioPropiedad({ proyectos = [] }) {");
r(F, '      <div>\n        <label htmlFor="descripcion" className="mb-2 block text-sm font-medium">', selNuevo);

const N = "app/admin/propiedades/nueva/page.js";
r(N, 'import FormularioPropiedad from "@/components/admin/FormularioPropiedad";',
     'import { sql } from "@/lib/db";\nimport FormularioPropiedad from "@/components/admin/FormularioPropiedad";');
r(N, "  return (\n    <PanelShell>", "  " + q + "  return (\n    <PanelShell>");
r(N, "<FormularioPropiedad />", "<FormularioPropiedad proyectos={proyectos} />");

const E = "components/admin/FormularioEdicionPropiedad.js";
r(E, 'export default function FormularioEdicionPropiedad({ propiedad, modo = "admin" }) {',
     'export default function FormularioEdicionPropiedad({ propiedad, modo = "admin", proyectos = [] }) {');
r(E, "          <AsistenteGemini", L(
'          {modo === "admin" && (',
'            <div>',
'              <label htmlFor="proyecto_id" className={clases.label}>',
'                Proyecto (opcional)',
'              </label>',
'              <select',
'                id="proyecto_id"',
'                name="proyecto_id"',
'                defaultValue={propiedad.proyecto_id || ""}',
'                className={clases.input}',
'              >',
'                <option value="">Sin proyecto</option>',
'                {proyectos.map(p => (',
'                  <option key={p.id} value={p.id}>{p.nombre}</option>',
'                ))}',
'              </select>',
'            </div>',
'          )}',
'',
'          <AsistenteGemini'));

const P = "app/admin/propiedades/[id]/editar/page.js";
r(P, "      superficie_terreno_m2, superficie_construida_m2\n    FROM public.propiedades",
     "      superficie_terreno_m2, superficie_construida_m2, proyecto_id\n    FROM public.propiedades");
r(P, "    superficie_construida_m2: valor(propiedad.superficie_construida_m2)\n  };",
     "    superficie_construida_m2: valor(propiedad.superficie_construida_m2),\n    proyecto_id: valor(propiedad.proyecto_id)\n  };");
r(P, "  return (\n    <PanelShell>", "  " + q + "  return (\n    <PanelShell>");
r(P, "<FormularioEdicionPropiedad propiedad={inicial} />",
     "<FormularioEdicionPropiedad propiedad={inicial} proyectos={proyectos} />");
