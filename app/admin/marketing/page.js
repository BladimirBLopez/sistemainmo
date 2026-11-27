import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";

export const dynamic = "force-dynamic";

const monedas = ["BOB", "USD"];

const formatoNumero = valor =>
  Number(valor || 0).toLocaleString("es-BO");

const formatoDinero = valor =>
  Number(valor || 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

function montoMoneda(filas, moneda) {
  return filas.find(f => f.moneda === moneda)?.total || 0;
}

const estados = {
  borrador: "Borrador",
  programada: "Programada",
  activa: "Activa",
  pausada: "Pausada",
  finalizada: "Finalizada",
  cancelada: "Cancelada"
};

const colores = {
  borrador: "bg-slate-100 text-slate-600",
  programada: "bg-blue-100 text-blue-700",
  activa: "bg-emerald-100 text-emerald-700",
  pausada: "bg-amber-100 text-amber-700",
  finalizada: "bg-slate-200 text-slate-700",
  cancelada: "bg-red-100 text-red-700"
};

export default async function MarketingPage() {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const [
    resumen,
    presupuestos,
    gastos,
    leads,
    contenidos,
    metricas,
    recientes
  ] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = 'activa')::int AS activas,
        COUNT(*) FILTER (WHERE estado = 'programada')::int AS programadas,
        COUNT(*) FILTER (WHERE estado = 'pausada')::int AS pausadas
      FROM public.marketing_campanas
    `,

    sql`
      SELECT moneda, COALESCE(SUM(presupuesto), 0)::text AS total
      FROM public.marketing_campanas
      GROUP BY moneda
    `,

    sql`
      SELECT moneda, COALESCE(SUM(monto), 0)::text AS total
      FROM public.marketing_gastos
      GROUP BY moneda
    `,

    sql`
      SELECT COUNT(*)::int AS total
      FROM public.leads
      WHERE campana_id IS NOT NULL
    `,

    sql`
      SELECT
        COUNT(*) FILTER (
          WHERE estado IN ('idea', 'pendiente')
        )::int AS pendientes,
        COUNT(*) FILTER (
          WHERE estado = 'programado'
        )::int AS programados
      FROM public.marketing_contenidos
    `,

    sql`
      SELECT
        COALESCE(SUM(alcance), 0)::text AS alcance,
        COALESCE(SUM(impresiones), 0)::text AS impresiones,
        COALESCE(SUM(clics), 0)::text AS clics,
        COALESCE(SUM(interacciones), 0)::text AS interacciones,
        COALESCE(SUM(mensajes), 0)::text AS mensajes
      FROM public.marketing_metricas_diarias
      WHERE fecha >= CURRENT_DATE - INTERVAL '29 days'
        AND fecha <= CURRENT_DATE
    `,

    sql`
      SELECT
        id, nombre, objetivo, estado,
        presupuesto::text AS presupuesto,
        moneda, fecha_inicio, fecha_fin
      FROM public.marketing_campanas
      ORDER BY creado_en DESC
      LIMIT 6
    `
  ]);

  const datos = resumen[0];
  const contenido = contenidos[0];
  const rendimiento = metricas[0];

  const indicadores = [
    {
      nombre: "Campañas registradas",
      valor: datos.total,
      detalle: `${datos.programadas} programadas`,
      color: "text-blue-700"
    },
    {
      nombre: "Campañas activas",
      valor: datos.activas,
      detalle: `${datos.pausadas} pausadas`,
      color: "text-emerald-700"
    },
    {
      nombre: "Leads atribuidos",
      valor: leads[0].total,
      detalle: "Vinculados al CRM",
      color: "text-violet-700"
    },
    {
      nombre: "Contenidos pendientes",
      valor: contenido.pendientes,
      detalle: `${contenido.programados} programados`,
      color: "text-amber-700"
    }
  ];

  return (
    <PanelShell>
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                Marketing empresarial
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Centro de Marketing
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Control de campañas, inversión publicitaria y resultados comerciales.
              </p>
            </div>

            <Link href="/admin/marketing/nueva"
              className="btn-primary px-5 py-3">
              + Nueva campaña
            </Link>

            <Link href="/admin/marketing/calendario"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">
              Calendario editorial
            </Link>

            <Link href="/admin/marketing/contenidos"
              className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700">
              Gestionar contenidos
            </Link>

            <Link href="/admin/marketing/gastos"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">
              Controlar gastos
            </Link>

            <Link href="/admin/leads"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              Ver leads del CRM
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {indicadores.map(item => (
            <article key={item.nombre}
              className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{item.nombre}</p>
              <p className={`mt-3 text-3xl font-black ${item.color}`}>
                {formatoNumero(item.valor)}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {item.detalle}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              Presupuesto planificado
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Presupuesto registrado en las campañas.
            </p>

            <div className="mt-5 space-y-4">
              {monedas.map(moneda => (
                <div key={moneda}
                  className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-600">
                    {moneda === "BOB" ? "Bolivianos" : "Dólares"}
                  </span>
                  <strong className="text-lg text-slate-900">
                    {moneda === "BOB" ? "Bs " : "USD "}
                    {formatoDinero(montoMoneda(presupuestos, moneda))}
                  </strong>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              Gastos de marketing
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Inversión registrada en gastos publicitarios.
            </p>

            <div className="mt-5 space-y-4">
              {monedas.map(moneda => (
                <div key={moneda}
                  className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-600">
                    {moneda === "BOB" ? "Bolivianos" : "Dólares"}
                  </span>
                  <strong className="text-lg text-slate-900">
                    {moneda === "BOB" ? "Bs " : "USD "}
                    {formatoDinero(montoMoneda(gastos, moneda))}
                  </strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <h3 className="font-bold text-slate-900">
              Rendimiento publicitario
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Métricas registradas durante los últimos 30 días.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["Alcance", rendimiento.alcance],
              ["Impresiones", rendimiento.impresiones],
              ["Clics", rendimiento.clics],
              ["Interacciones", rendimiento.interacciones],
              ["Mensajes", rendimiento.mensajes]
            ].map(([nombre, valor]) => (
              <div key={nombre} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">{nombre}</p>
                <p className="mt-2 text-xl font-black text-slate-900">
                  {formatoNumero(valor)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">
                Campañas recientes
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Últimas campañas registradas.
              </p>
            </div>
            <span className="text-sm text-slate-500">
              {recientes.length} resultados
            </span>
          </div>

          {recientes.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-700">
                Todavía no hay campañas.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Las campañas aparecerán aquí cuando sean registradas.
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {recientes.map(campana => (
                <article key={String(campana.id)}
                  className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <Link href={`/admin/marketing/${campana.id}`} className="font-bold text-slate-900 hover:text-blue-600">
                      {campana.nombre}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {campana.objetivo.replaceAll("_", " ")}
                      {" · "}
                      {campana.fecha_inicio
                        ? String(campana.fecha_inicio).slice(0, 10)
                        : "Sin fecha de inicio"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <strong className="text-sm text-slate-800">
                      {campana.moneda === "BOB" ? "Bs " : "USD "}
                      {formatoDinero(campana.presupuesto)}
                    </strong>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      colores[campana.estado] || "bg-slate-100 text-slate-600"
                    }`}>
                      {estados[campana.estado] || campana.estado}
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
