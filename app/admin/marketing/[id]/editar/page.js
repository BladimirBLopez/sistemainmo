import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioCampana from "@/components/admin/FormularioCampana";

export const dynamic = "force-dynamic";

export default async function EditarCampanaPage({ params }) {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,17}$/.test(String(id))) {
    notFound();
  }

  const [campana] = await sql`
    SELECT
      id,
      nombre,
      descripcion,
      objetivo,
      tipo,
      estado,
      presupuesto::text AS presupuesto,
      moneda,
      fecha_inicio::text AS fecha_inicio,
      fecha_fin::text AS fecha_fin
    FROM public.marketing_campanas
    WHERE id = ${id}::bigint
    LIMIT 1
  `;

  if (!campana) notFound();

  return (
    <PanelShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link
            href={`/admin/marketing/${id}`}
            className="text-sm font-semibold text-brand-600"
          >
            ← Volver a la campaña
          </Link>

          <h2 className="mt-4 text-2xl font-black text-slate-900">
            Editar campaña
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Actualiza la información sin perder sus registros comerciales.
          </p>
        </div>

        <FormularioCampana
          campana={{
            ...campana,
            id: String(campana.id)
          }}
        />
      </div>
    </PanelShell>
  );
}
