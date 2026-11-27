import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioAgente from "@/components/admin/FormularioAgente";

export const dynamic = "force-dynamic";

export default async function EditarAgentePage({ params }) {
  const cookieStore = await cookies();

  if (!(await verificarSesion(cookieStore.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) notFound();

  const [agente] = await sql`
    SELECT id, nombre_completo, email, telefono, estado
    FROM public.agentes
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!agente) notFound();

  return (
    <PanelShell>
      <div className="mx-auto max-w-4xl space-y-5">
        <Link
          href={`/admin/agentes/${id}`}
          className="text-sm font-semibold text-brand-600"
        >
          ← Volver al agente
        </Link>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Editar agente
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Modifica sus datos, contraseña o estado de acceso.
          </p>
        </div>

        <FormularioAgente
          agente={{
            ...agente,
            id: String(agente.id)
          }}
        />
      </div>
    </PanelShell>
  );
}
