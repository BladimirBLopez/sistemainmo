import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import EtapasProyecto from "@/components/admin/EtapasProyecto";

export const dynamic = "force-dynamic";

const dinero = v => Number(v || 0).toLocaleString("es-BO",
  { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function ProyectoPage({ params }) {
  const store = await cookies();
  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) redirect("/admin/login");

  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(String(id))) notFound();

  const [proyecto] = await sql`
    SELECT id, nombre, descripcion, tipo, departamento, ciudad, zona, direccion,
      estado, avance_porcentaje, avance_modo, presupuesto::text AS presupuesto, moneda,
      fecha_inicio::text AS fecha_inicio,
      fecha_fin_estimada::text AS fecha_fin_estimada,
      fecha_fin_real::text AS fecha_fin_real
    FROM public.proyectos WHERE id = ${id}::bigint LIMIT 1
  `;
  if (!proyecto) notFound();

  const [unidades, gastos, etapas] = await Promise.all([
    sql`SELECT id, titulo, tipo, estado_comercial
        FROM public.propiedades WHERE proyecto_id = ${id}::bigint ORDER BY id`,
    sql`SELECT moneda, COALESCE(SUM(monto),0)::text AS total
        FROM public.proyecto_gastos WHERE proyecto_id = ${id}::bigint GROUP BY moneda`,
    sql`SELECT id::text AS id, nombre, orden, estado, avance_porcentaje,
          fecha_inicio::text AS fecha_inicio, fecha_fin::text AS fecha_fin
        FROM public.proyecto_etapas WHERE proyecto_id = ${id}::bigint ORDER BY orden, id`
  ]);

  const datos = [
    ["Estado", proyecto.estado.replaceAll("_", " ")],
    ["Tipo", proyecto.tipo],
    ["Ubicación", [proyecto.zona, proyecto.ciudad, proyecto.departamento].filter(Boolean).join(", ") || "—"],
    ["Inicio", proyecto.fecha_inicio || "—"],
    ["Fin estimado", proyecto.fecha_fin_estimada || "—"],
    ["Fin real", proyecto.fecha_fin_real || "—"]
  ];

  return (
    <PanelShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/admin/proyectos" className="text-sm font-semibold text-brand-600">← Volver a proyectos</Link>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{proyecto.nombre}</h2>
              {proyecto.descripcion && <p className="mt-2 text-sm text-slate-500">{proyecto.descripcion}</p>}
            </div>
            <Link href={`/admin/proyectos/${id}/editar`}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">
              Editar
            </Link>
          </div>

          <div className="mt-5 h-3 w-full rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-gold-500" style={{ width: `${proyecto.avance_porcentaje}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{proyecto.avance_porcentaje}% de avance</p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            {datos.map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="mt-1 text-sm font-semibold capitalize text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Presupuesto</p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {proyecto.moneda === "BOB" ? "Bs " : "USD "}{dinero(proyecto.presupuesto)}
            </p>
          </article>
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Gastado en obra</p>
            {gastos.length === 0 ? (
              <p className="mt-2 text-2xl font-black text-slate-900">0,00</p>
            ) : gastos.map(g => (
              <p key={g.moneda} className="mt-2 text-2xl font-black text-slate-900">
                {g.moneda === "BOB" ? "Bs " : "USD "}{dinero(g.total)}
              </p>
            ))}
          </article>
        </section>

        <EtapasProyecto proyectoId={String(id)} etapas={etapas} modo={proyecto.avance_modo} />

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-900">Unidades del proyecto</h3>
          {unidades.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Aún no hay propiedades enlazadas. Se asignarán desde el formulario de propiedad.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {unidades.map(u => (
                <Link key={String(u.id)} href={`/admin/propiedades/${u.id}`}
                  className="flex items-center justify-between py-3 hover:text-brand-600">
                  <span className="font-semibold text-slate-800">{u.titulo}</span>
                  <span className="text-xs text-slate-500">{u.tipo} · {u.estado_comercial}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}
