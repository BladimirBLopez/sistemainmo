import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioLead from "@/components/leads/FormularioLead";

export const dynamic = "force-dynamic";

export default async function NuevoLeadPage() {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const agentes = await sql`
    SELECT id, nombre_completo
    FROM public.agentes
    WHERE estado = 'activo'
    ORDER BY nombre_completo
  `;

  return (
    <PanelShell>
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Registrar prospecto</h2>
          <p className="mt-2 text-sm text-slate-500">
            Registra una nueva oportunidad comercial y asigna un responsable.
          </p>
        </div>
        <FormularioLead modo="admin" agentes={agentes} />
      </div>
    </PanelShell>
  );
}
