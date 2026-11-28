import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioProyecto from "@/components/admin/FormularioProyecto";

export const dynamic = "force-dynamic";

export default async function EditarProyectoPage({ params }) {
  const store = await cookies();
  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) redirect("/admin/login");

  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(String(id))) notFound();

  const [proyecto] = await sql`
    SELECT id, nombre, descripcion, tipo, departamento, ciudad, zona, direccion,
      estado, avance_porcentaje, presupuesto::text AS presupuesto, moneda,
      fecha_inicio::text AS fecha_inicio,
      fecha_fin_estimada::text AS fecha_fin_estimada,
      fecha_fin_real::text AS fecha_fin_real
    FROM public.proyectos WHERE id = ${id}::bigint LIMIT 1
  `;
  if (!proyecto) notFound();

  return (
    <PanelShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href={`/admin/proyectos/${id}`} className="text-sm font-semibold text-brand-600">← Volver al proyecto</Link>
          <h2 className="mt-4 text-2xl font-black text-slate-900">Editar proyecto</h2>
        </div>
        <FormularioProyecto proyecto={{ ...proyecto, id: String(proyecto.id) }} />
      </div>
    </PanelShell>
  );
}
