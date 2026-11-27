import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

export default async function MisClientes({ searchParams }) {
  const store = await cookies();
  const agente = await obtenerAgenteActivo(
    store.get(AGENTE_COOKIE_NAME)?.value
  );

  if (!agente) redirect("/agente/login");

  const parametros = searchParams ? await searchParams : {};
  const q = typeof parametros.q === "string"
    ? parametros.q.trim().slice(0, 100)
    : "";

  const roles = Object.keys(etiquetas);
  const rolSolicitado = typeof parametros.rol === "string"
    ? parametros.rol
    : "";
  const rol = roles.includes(rolSolicitado) ? rolSolicitado : "";
  const patron = `%${q.replace(/[\\%_]/g, "\\$&")}%`;

  const clientes = await sql`
    SELECT
      c.id, c.nombre_completo, c.telefono,
      c.email, c.roles, c.ciudad, c.estado
    FROM public.agente_clientes ac
    JOIN public.clientes c ON c.id = ac.cliente_id
    WHERE ac.agente_id = ${agente.id}
      AND (
        ${q} = ''
        OR c.nombre_completo ILIKE ${patron}
        OR c.telefono ILIKE ${patron}
        OR COALESCE(c.email, '') ILIKE ${patron}
      )
      AND (${rol} = '' OR ${rol} = ANY(c.roles))
    ORDER BY c.creado_en DESC
    LIMIT 200
  `;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
<h1 className="mt-2 text-2xl font-bold text-slate-900">
            Mis clientes
          </h1>
          <p className="text-sm text-slate-500">
            Consulta y edita únicamente los clientes asignados.
          </p>
        </header>

        <form className="grid gap-3 rounded-2xl bg-white p-5 sm:grid-cols-3">
          <input
            name="q"
            defaultValue={q}
            maxLength={100}
            placeholder="Nombre, teléfono o correo"
            className="rounded-xl border border-slate-300 p-3 sm:col-span-2"
          />
          <select
            name="rol"
            defaultValue={rol}
            className="rounded-xl border border-slate-300 bg-white p-3"
          >
            <option value="">Todos los perfiles</option>
            {roles.map(r => (
              <option key={r} value={r}>{etiquetas[r]}</option>
            ))}
          </select>
          <button className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white">
            Buscar clientes
          </button>
          <Link
            href="/agente/clientes"
            className="rounded-xl border px-5 py-3 text-center font-semibold"
          >
            Limpiar
          </Link>
        </form>

        <section className="divide-y rounded-2xl bg-white p-4 shadow-sm">
          <div className="p-3 font-bold">
            {clientes.length} clientes encontrados
          </div>

          {clientes.map(c => (
            <Link
              key={String(c.id)}
              href={`/agente/clientes/${c.id}`}
              className="block rounded-xl p-4 hover:bg-slate-50"
            >
              <p className="font-bold text-slate-900">{c.nombre_completo}</p>
              <p className="mt-1 text-sm text-slate-500">
                {c.telefono}{c.email ? ` · ${c.email}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.roles.map(r => (
                  <span key={r} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    {etiquetas[r] || r}
                  </span>
                ))}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                  {c.estado}
                </span>
              </div>
            </Link>
          ))}

          {clientes.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">
              No tienes clientes asignados con esta búsqueda.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
