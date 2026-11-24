import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioCliente from "@/components/admin/FormularioCliente";

export const dynamic = "force-dynamic";

export default async function EditarClientePage({ params }) {
  const cookieStore = await cookies();

  if (!(await verificarSesion(cookieStore.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) notFound();

  const [cliente] = await sql`
    SELECT *
    FROM public.clientes
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!cliente) notFound();

  return (
    <PanelShell>
      <div className="mx-auto max-w-4xl space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">
          Editar cliente
        </h2>
        <FormularioCliente cliente={cliente} />
      </div>
    </PanelShell>
  );
}
