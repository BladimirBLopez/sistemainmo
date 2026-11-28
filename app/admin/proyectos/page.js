import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";

export const dynamic = "force-dynamic";

const estados = {
  planificacion: "Planificación", en_obra: "En obra", pausado: "Pausado",
  terminado: "Terminado", cancelado: "Cancelado"
};
const colores = {
  planificacion: "bg-slate-100 text-slate-600",
  en_obra: "bg-emerald-100 text-emerald-700",
  pausado: "bg-amber-100 text-amber-700",
  terminado: "bg-brand-100 text-brand-700",
  cancelado: "bg-red-100 text-red-700"
};
const dinero = v => Number(v || 0).toLocaleString("es-BO",
  { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function ProyectosPage() {
  const store = await cookies();
  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) redirect("/admin/login");

  const proyectos = await sql`
    SELECT p.id, p.nombre, p.tipo, p.estado, p.avance_porcentaje,
      p.presupuesto::text AS presupuesto, p.moneda, p.ciudad,
      (SELECT COUNT(*)::int FROM public.propiedades u WHERE u.proyecto_id = p.id) AS unidades
    FROM public.proyectos p
    ORDER BY p.creado_en DESC
  `;

  return (
    <PanelShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Constructora</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Proyectos y obras</h2>
              <p className="mt-2 text-sm text-slate-500">Avance, presupuesto y unidades de cada proyecto.</p>
            </div>
            <Link href="/admin/proyectos/nuevo" className="btn-primary px-5 py-3">+ Nuevo proyecto</Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          {proyectos.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-700">Todavía no hay proyectos.</p>
              <p className="mt-2 text-sm text-slate-500">Registra el primero para empezar.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {proyectos.map(p => (
                <article key={String(p.id)} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <Link href={`/admin/proyectos/${p.id}`} className="font-bold text-slate-900 hover:text-brand-600">
                      {p.nombre}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {p.tipo} · {p.ciudad || "Sin ciudad"} · {p.unidades} unidades
                    </p>
                    <div className="mt-2 h-2 w-48 max-w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-gold-500" style={{ width: `${p.avance_porcentaje}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{p.avance_porcentaje}% de avance</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <strong className="text-sm text-slate-800">
                      {p.moneda === "BOB" ? "Bs " : "USD "}{dinero(p.presupuesto)}
                    </strong>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colores[p.estado] || "bg-slate-100 text-slate-600"}`}>
                      {estados[p.estado] || p.estado}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}
