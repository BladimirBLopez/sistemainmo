import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { AGENTE_COOKIE_NAME } from "@/lib/auth-agente";
import { obtenerAgenteActivo } from "@/lib/autorizacion-agente";
import FormularioCliente from "@/components/admin/FormularioCliente";

export const dynamic = "force-dynamic";

export default async function EditarClienteAgente({ params }) {
  const store = await cookies();
  const agente = await obtenerAgenteActivo(
    store.get(AGENTE_COOKIE_NAME)?.value
  );

  if (!agente) redirect("/agente/login");

  const { id } = await params;
  if (!/^[1-9]\d{0,18}$/.test(id)) notFound();

  const [cliente] = await sql`
    SELECT c.*
    FROM public.clientes c
    WHERE c.id = ${id}
      AND EXISTS (
        SELECT 1
        FROM public.agente_clientes ac
        WHERE ac.agente_id = ${agente.id}
          AND ac.cliente_id = c.id
      )
    LIMIT 1
  `;

  if (!cliente) notFound();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <Link
          href={`/agente/clientes/${id}`}
          className="inline-block text-sm font-semibold text-blue-600"
        >
          ← Volver a la ficha del cliente
        </Link>
        <FormularioCliente cliente={cliente} modo="agente" />
      </div>
    </main>
  );
}
