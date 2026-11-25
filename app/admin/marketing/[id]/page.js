import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioCanal from "@/components/admin/FormularioCanal";
import FormularioMetricas from "@/components/admin/FormularioMetricas";

export const dynamic = "force-dynamic";

const etiquetas = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google Ads",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  portal: "Portal inmobiliario",
  otro: "Otro"
};

const colores = {
  activo: "bg-emerald-100 text-emerald-700",
  pausado: "bg-amber-100 text-amber-700",
  finalizado: "bg-slate-200 text-slate-700"
};

export default async function CampanaPage({ params }) {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,17}$/.test(String(id))) {
    notFound();
  }

  const [campanas, canales] = await Promise.all([
    sql`
      SELECT
        id, nombre, descripcion, objetivo,
        tipo, estado, presupuesto::text AS presupuesto,
        moneda, fecha_inicio, fecha_fin
      FROM public.marketing_campanas
      WHERE id = ${id}::bigint
      LIMIT 1
    `,

    sql`
      SELECT
        id, plataforma, id_externo,
        url_externa, estado, creado_en
      FROM public.marketing_campana_canales
      WHERE campana_id = ${id}::bigint
      ORDER BY creado_en DESC
    `
  ]);

  const campana = campanas[0];

  if (!campana) notFound();

  const [resumenGastos, gastos, metricas, resumenMetricas] = await Promise.all([
    sql`
      SELECT moneda, COUNT(*)::int AS cantidad,
        COALESCE(SUM(monto), 0)::text AS total
      FROM public.marketing_gastos
      WHERE campana_id = ${id}::bigint
      GROUP BY moneda
    `,
    sql`
      SELECT id, fecha::text AS fecha, categoria,
        concepto, plataforma, monto::text AS monto,
        moneda, comprobante_url
      FROM public.marketing_gastos
      WHERE campana_id = ${id}::bigint
      ORDER BY fecha DESC, creado_en DESC
      LIMIT 100
    `,
    sql`
      SELECT id, fecha::text AS fecha, plataforma,
        alcance, impresiones, clics, interacciones, mensajes,
        leads_reportados, conversiones_reportadas,
        gasto_reportado::text AS gasto_reportado, moneda
      FROM public.marketing_metricas_diarias
      WHERE campana_id = ${id}::bigint
      ORDER BY fecha DESC, plataforma ASC
      LIMIT 60
    `,
    sql`
      SELECT
        COUNT(*)::int AS reportes,
        COALESCE(SUM(alcance), 0)::text AS alcance,
        COALESCE(SUM(impresiones), 0)::text AS impresiones,
        COALESCE(SUM(clics), 0)::text AS clics,
        COALESCE(SUM(interacciones), 0)::text AS interacciones,
        COALESCE(SUM(mensajes), 0)::text AS mensajes,
        COALESCE(SUM(leads_reportados), 0)::text AS leads_reportados,
        COALESCE(SUM(conversiones_reportadas), 0)::text AS conversiones_reportadas
      FROM public.marketing_metricas_diarias
      WHERE campana_id = ${id}::bigint
    `
  ]);

  const presupuesto = Number(campana.presupuesto || 0);
  const gastoCampana = Number(
    resumenGastos.find(f => f.moneda === campana.moneda)?.total || 0
  );
  const saldo = presupuesto - gastoCampana;
  const porcentaje = presupuesto > 0
    ? gastoCampana / presupuesto * 100
    : null;

  const otrasMonedas = resumenGastos.filter(
    f => f.moneda !== campana.moneda
  );
  const totalesMetricas = {
    alcance: Number(resumenMetricas[0]?.alcance || 0),
    impresiones: Number(resumenMetricas[0]?.impresiones || 0),
    clics: Number(resumenMetricas[0]?.clics || 0),
    interacciones: Number(resumenMetricas[0]?.interacciones || 0),
    mensajes: Number(resumenMetricas[0]?.mensajes || 0),
    leads_reportados: Number(resumenMetricas[0]?.leads_reportados || 0),
    conversiones_reportadas: Number(resumenMetricas[0]?.conversiones_reportadas || 0),
    reportes: Number(resumenMetricas[0]?.reportes || 0)
  };
  const fechaPartes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/La_Paz",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const fechaValores = Object.fromEntries(
    fechaPartes.map(parte => [parte.type, parte.value])
  );
  const fechaActual = `${fechaValores.year}-${fechaValores.month}-${fechaValores.day}`;

  const formatoDinero = valor =>
    Number(valor || 0).toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const simboloMoneda = moneda =>
    moneda === "BOB" ? "Bs " : "USD ";

  const categoriasGasto = {
    publicidad: "Publicidad",
    diseno: "Diseño",
    produccion: "Producción",
    impresion: "Impresión",
    herramientas: "Herramientas",
    otros: "Otros"
  };

  return (
    <PanelShell>
      <div className="mx-auto max-w-6xl space-y-6">

        <div>
          <Link
            href="/admin/marketing"
            className="text-sm font-semibold text-blue-600"
          >
            ← Volver a Marketing
          </Link>

          <h2 className="mt-4 text-2xl font-black text-slate-900">
            {campana.nombre}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Administración de campaña y canales publicitarios.
          </p>

          <Link
            href={`/admin/marketing/${campana.id}/editar`}
            className="mt-4 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Editar campaña
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-slate-900">
            Información de campaña
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <div>
              <p className="text-xs text-slate-500">Objetivo</p>
              <p className="mt-1 font-semibold">{campana.objetivo}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Tipo</p>
              <p className="mt-1 font-semibold">{campana.tipo}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Estado</p>
              <p className="mt-1 font-semibold">{campana.estado}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Presupuesto</p>
              <p className="mt-1 font-bold">
                {campana.moneda === "BOB" ? "Bs " : "USD "}
                {Number(campana.presupuesto).toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Inicio</p>
              <p className="mt-1 font-semibold">
                {campana.fecha_inicio || "Sin fecha"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Finalización</p>
              <p className="mt-1 font-semibold">
                {campana.fecha_fin || "Sin fecha"}
              </p>
            </div>

          </div>

          {campana.descripcion && (
            <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
              {campana.descripcion}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Presupuesto planificado</p>
              <p className="mt-3 text-2xl font-black text-slate-900">
                {simboloMoneda(campana.moneda)}
                {formatoDinero(presupuesto)}
              </p>
            </article>

            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Gastos ejecutados</p>
              <p className="mt-3 text-2xl font-black text-blue-700">
                {simboloMoneda(campana.moneda)}
                {formatoDinero(gastoCampana)}
              </p>
            </article>

            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Saldo disponible</p>
              <p className={`mt-3 text-2xl font-black ${
                saldo < 0 ? "text-red-600" : "text-emerald-700"
              }`}>
                {simboloMoneda(campana.moneda)}
                {formatoDinero(saldo)}
              </p>
            </article>

            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Ejecución presupuestaria</p>
              <p className="mt-3 text-2xl font-black text-slate-900">
                {porcentaje === null
                  ? "Sin presupuesto"
                  : porcentaje.toLocaleString("es-BO", {
                      maximumFractionDigits: 1
                    }) + "%"}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    saldo < 0 ? "bg-red-500" : "bg-blue-600"
                  }`}
                  style={{
                    width: `${Math.min(Math.max(porcentaje || 0, 0), 100)}%`
                  }}
                />
              </div>
            </article>

          </div>

          {otrasMonedas.length > 0 && (
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-bold text-slate-900">
                Gastos registrados en otra moneda
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Estos importes se muestran por separado y no se descuentan
                del presupuesto de la campaña.
              </p>
              <div className="mt-4 flex flex-wrap gap-6">
                {otrasMonedas.map(fila => (
                  <div key={fila.moneda}>
                    <p className="text-xs text-slate-500">{fila.moneda}</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {simboloMoneda(fila.moneda)}
                      {formatoDinero(fila.total)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Historial de gastos de la campaña
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Movimientos registrados y vinculados a esta campaña.
              </p>
            </div>
            <Link
              href="/admin/marketing/gastos"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Administrar gastos
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-4">
            {resumenGastos.map(fila => (
              <div key={fila.moneda} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Total {fila.moneda}
                </p>
                <p className="mt-1 text-xl font-black text-slate-900">
                  {simboloMoneda(fila.moneda)}
                  {formatoDinero(fila.total)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {fila.cantidad} movimientos
                </p>
              </div>
            ))}
          </div>

          {gastos.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-700">
                Todavía no hay gastos registrados.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Los gastos vinculados a esta campaña aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {gastos.map(gasto => (
                <article
                  key={String(gasto.id)}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">
                      {gasto.concepto}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {gasto.fecha}
                      {" · "}
                      {categoriasGasto[gasto.categoria] || gasto.categoria}
                      {" · "}
                      {gasto.plataforma || "Sin plataforma"}
                    </p>
                    {gasto.comprobante_url && (
                      <a
                        href={gasto.comprobante_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Ver comprobante
                      </a>
                    )}
                  </div>
                  <strong className="text-base text-slate-900">
                    {simboloMoneda(gasto.moneda)}
                    {formatoDinero(gasto.monto)}
                  </strong>
                </article>
              ))}
            </div>
          )}

          {gastos.length === 100 && (
            <p className="mt-4 text-xs text-slate-400">
              Se muestran los últimos 100 movimientos.
            </p>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="mb-2 text-lg font-bold text-slate-900">
              Registrar rendimiento
            </h3>
            <p className="mb-5 text-sm text-slate-500">
              Registra los resultados diarios de cada plataforma.
            </p>
            <FormularioMetricas
              campanaId={String(campana.id)}
              fechaActual={fechaActual}
            />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                Historial de rendimiento
              </h3>
              <span className="text-xs text-slate-500">
                Mostrando {metricas.length} de {totalesMetricas.reportes} reportes
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Alcance", totalesMetricas.alcance],
                ["Impresiones", totalesMetricas.impresiones],
                ["Clics", totalesMetricas.clics],
                ["Interacciones", totalesMetricas.interacciones],
                ["Mensajes", totalesMetricas.mensajes],
                ["Leads", totalesMetricas.leads_reportados],
                ["Conversiones", totalesMetricas.conversiones_reportadas]
              ].map(([nombre, valor]) => (
                <div key={nombre} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{nombre}</p>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {Number(valor).toLocaleString("es-BO")}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Acumulados históricos de los reportes registrados. El alcance
              puede incluir audiencias repetidas entre fechas y plataformas.
            </p>

            {metricas.length === 0 ? (
              <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center">
                <p className="font-semibold text-slate-700">
                  Todavía no hay reportes de rendimiento.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Los resultados registrados aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-100">
                {metricas.map(metrica => (
                  <article key={String(metrica.id)} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">
                          {etiquetas[metrica.plataforma] || metrica.plataforma}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {metrica.fecha}
                        </p>
                      </div>
                      <strong className="text-sm text-blue-700">
                        {simboloMoneda(metrica.moneda)}
                        {formatoDinero(metrica.gasto_reportado)}
                      </strong>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
                      <p>Alcance: <strong>{Number(metrica.alcance).toLocaleString("es-BO")}</strong></p>
                      <p>Impresiones: <strong>{Number(metrica.impresiones).toLocaleString("es-BO")}</strong></p>
                      <p>Clics: <strong>{Number(metrica.clics).toLocaleString("es-BO")}</strong></p>
                      <p>Interacciones: <strong>{Number(metrica.interacciones).toLocaleString("es-BO")}</strong></p>
                      <p>Mensajes: <strong>{Number(metrica.mensajes).toLocaleString("es-BO")}</strong></p>
                      <p>Leads: <strong>{Number(metrica.leads_reportados).toLocaleString("es-BO")}</strong></p>
                      <p>Conversiones: <strong>{Number(metrica.conversiones_reportadas).toLocaleString("es-BO")}</strong></p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-5">

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
              Agregar canal
            </h3>

            <FormularioCanal campanaId={String(campana.id)} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">
                Canales vinculados
              </h3>

              <span className="text-sm text-slate-500">
                {canales.length} canales
              </span>
            </div>

            {canales.length === 0 ? (
              <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center">
                <p className="font-semibold text-slate-700">
                  Todavía no hay canales.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Registra las plataformas utilizadas en esta campaña.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-100">
                {canales.map(canal => (
                  <article
                    key={String(canal.id)}
                    className="space-y-2 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">
                        {etiquetas[canal.plataforma]}
                      </p>

                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        colores[canal.estado]
                      }`}>
                        {canal.estado}
                      </span>
                    </div>

                    {canal.id_externo && (
                      <p className="text-xs text-slate-500">
                        ID: {canal.id_externo}
                      </p>
                    )}

                    {canal.url_externa && (
                      <a
                        href={canal.url_externa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block break-all text-sm font-medium text-blue-600 hover:underline"
                      >
                        Abrir plataforma
                      </a>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

        </section>
      </div>
    </PanelShell>
  );
}
