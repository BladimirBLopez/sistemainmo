import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { AGENTE_COOKIE_NAME } from "@/lib/auth-agente";
import { obtenerAgenteActivo } from "@/lib/autorizacion-agente";

export const dynamic = "force-dynamic";

const etiquetas = {
  propietario: "Propietario",
  comprador: "Comprador",
  arrendatario: "Arrendatario",
  buscador: "Buscador",
  vendedor: "Vendedor",
  otro: "Otro"
};

export default async function FichaClienteAgente({ params }) {
  const store = await cookies();
  const agente = await obtenerAgenteActivo(
    store.get(AGENTE_COOKIE_NAME)?.value
  );

  if (!agente) redirect("/agente/login");

  const { id } = await params;
  if (!/^[1-9]\d{0,18}$/.test(id)) notFound();

  const [c] = await sql`
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

  if (!c) notFound();

  const campo = (titulo, valor) => (
    <div>
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className="mt-1 font-semibold text-slate-800">
        {valor || "No registrado"}
      </p>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/agente/clientes" className="text-sm font-semibold text-blue-600">
            ← Mis clientes
          </Link>
          <Link
            href={`/agente/clientes/${id}/editar`}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            Editar cliente
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            {c.nombre_completo}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            {c.roles.map(r => (
              <span key={r} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                {etiquetas[r] || r}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {campo("Teléfono principal", c.telefono)}
            {campo("Teléfono secundario", c.telefono_secundario)}
            {campo("Correo electrónico", c.email)}
            {campo("Documento", [c.tipo_documento, c.numero_documento].filter(Boolean).join(" "))}
            {campo("Departamento", c.departamento)}
            {campo("Ciudad", c.ciudad)}
            {campo("Zona", c.zona)}
            {campo("Dirección", c.direccion)}
            {campo("Estado", c.estado)}
          </div>

          {c.notas && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">OBSERVACIONES</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {c.notas}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
