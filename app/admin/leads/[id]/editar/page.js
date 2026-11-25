import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioLead from "@/components/leads/FormularioLead";

export const dynamic = "force-dynamic";

export default async function EditarLeadPage({ params }) {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) notFound();

  const [lead] = await sql`
    SELECT *
    FROM public.leads
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!lead) notFound();

  const agentes = await sql`
    SELECT id, nombre_completo, estado
    FROM public.agentes
    WHERE estado = 'activo'
       OR id = ${lead.agente_id}
    ORDER BY nombre_completo
  `;

  const leadUI = {
    ...lead,
    id: String(lead.id),
    cliente_id: lead.cliente_id == null ? null : String(lead.cliente_id),
    propiedad_id: lead.propiedad_id == null ? null : String(lead.propiedad_id),
    agente_id: lead.agente_id == null ? null : String(lead.agente_id)
  };

  return (
    <PanelShell>
      <div className="mx-auto max-w-4xl space-y-5">

        <Link href={`/admin/leads/${id}`}
          className="text-sm font-semibold text-blue-600">
          ← Volver a la ficha del prospecto
        </Link>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Editar prospecto
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Actualiza la información comercial, necesidades y responsable del prospecto.
          </p>
        </div>

        <FormularioLead
          modo="admin"
          agentes={agentes}
          lead={leadUI}
          edicion={true}
        />

      </div>
    </PanelShell>
  );
}
