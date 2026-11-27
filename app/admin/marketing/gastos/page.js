import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioGasto from "@/components/admin/FormularioGasto";

export const dynamic = "force-dynamic";

const categorias = {
  publicidad: "Publicidad",
  diseno: "Diseño",
  produccion: "Producción",
  impresion: "Impresión",
  herramientas: "Herramientas",
  otros: "Otros"
};

const plataformas = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google Ads",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  portal: "Portal inmobiliario",
  otro: "Otro"
};

const monedas = ["BOB", "USD"];

const formatoDinero = valor =>
  Number(valor || 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const esFecha = valor => {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const fecha = new Date(valor + "T00:00:00Z");
  return !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor;
};

export default async function GastosMarketingPage({ searchParams }) {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const parametros = searchParams ? await searchParams : {};

  const categoria = Object.hasOwn(categorias, parametros.categoria)
    ? parametros.categoria : "";

  const plataforma = Object.hasOwn(plataformas, parametros.plataforma)
    ? parametros.plataforma : "";

  const moneda = monedas.includes(parametros.moneda)
    ? parametros.moneda : "";

  let desde = esFecha(parametros.desde) ? parametros.desde : "";
  let hasta = esFecha(parametros.hasta) ? parametros.hasta : "";

  if (desde && hasta && desde > hasta) {
    desde = "";
    hasta = "";
  }

  const [campanas, fecha] = await Promise.all([
    sql`
      SELECT id, nombre
      FROM public.marketing_campanas
      ORDER BY creado_en DESC
      LIMIT 300
    `,
    sql`
      SELECT CURRENT_DATE::text AS hoy
    `
  ]);

  const [gastos, totales] = await Promise.all([
    sql`
      SELECT
        g.id,
        g.campana_id,
        g.fecha::text AS fecha,
        g.categoria,
        g.concepto,
        g.plataforma,
        g.monto::text AS monto,
        g.moneda,
        g.comprobante_url,
        c.nombre AS campana_nombre
      FROM public.marketing_gastos g
      LEFT JOIN public.marketing_campanas c
        ON c.id = g.campana_id
      WHERE
        (${categoria} = '' OR g.categoria = ${categoria})
        AND (${plataforma} = '' OR g.plataforma = ${plataforma})
        AND (${moneda} = '' OR g.moneda = ${moneda})
        AND (
          NULLIF(${desde}, '')::date IS NULL
          OR g.fecha >= NULLIF(${desde}, '')::date
        )
        AND (
          NULLIF(${hasta}, '')::date IS NULL
          OR g.fecha <= NULLIF(${hasta}, '')::date
        )
      ORDER BY g.fecha DESC, g.creado_en DESC
      LIMIT 200
    `,

    sql`
      SELECT
        g.moneda,
        COUNT(*)::int AS cantidad,
        COALESCE(SUM(g.monto), 0)::text AS total
      FROM public.marketing_gastos g
      WHERE
        (${categoria} = '' OR g.categoria = ${categoria})
        AND (${plataforma} = '' OR g.plataforma = ${plataforma})
        AND (${moneda} = '' OR g.moneda = ${moneda})
        AND (
          NULLIF(${desde}, '')::date IS NULL
          OR g.fecha >= NULLIF(${desde}, '')::date
        )
        AND (
          NULLIF(${hasta}, '')::date IS NULL
          OR g.fecha <= NULLIF(${hasta}, '')::date
        )
      GROUP BY g.moneda
    `
  ]);

  const montoMoneda = m =>
    totales.find(f => f.moneda === m)?.total || 0;

  const cantidadTotal = totales.reduce(
    (total, fila) => total + Number(fila.cantidad || 0), 0
  );

  return (
    <PanelShell>
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <Link
            href="/admin/marketing"
            className="text-sm font-semibold text-blue-600"
          >
            ← Volver al Centro de Marketing
          </Link>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                Control financiero
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Gastos de Marketing
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Registro y seguimiento de la inversión publicitaria.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {monedas.map(m => (
            <article key={m} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total registrado en {m === "BOB" ? "bolivianos" : "dólares"}
              </p>
              <p className="mt-3 text-2xl font-black text-slate-900">
                {m === "BOB" ? "Bs " : "USD "}
                {formatoDinero(montoMoneda(m))}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
              Registrar nuevo gasto
            </h3>

            <FormularioGasto
              campanas={campanas}
              fechaActual={fecha[0]?.hoy || ""}
            />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-3">
            <h3 className="mb-2 text-lg font-bold text-slate-900">
              Resumen de inversión
            </h3>

            <p className="text-sm text-slate-500">
              {cantidadTotal} gastos encontrados con los filtros actuales.
            </p>

            <div className="mt-5 space-y-4">
              {monedas.map(m => (
                <div key={m} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    {m === "BOB" ? "Bolivianos" : "Dólares"}
                  </p>
                  <p className="mt-1 text-xl font-black text-slate-900">
                    {m === "BOB" ? "Bs " : "USD "}
                    {formatoDinero(montoMoneda(m))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-bold text-slate-900">
            Historial de gastos
          </h3>

          <form method="GET" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            <select name="categoria" defaultValue={categoria} className="input">
              <option value="">Todas las categorías</option>
              {Object.entries(categorias).map(([valor, nombre]) => (
                <option key={valor} value={valor}>{nombre}</option>
              ))}
            </select>

            <select name="plataforma" defaultValue={plataforma} className="input">
              <option value="">Todas las plataformas</option>
              {Object.entries(plataformas).map(([valor, nombre]) => (
                <option key={valor} value={valor}>{nombre}</option>
              ))}
            </select>

            <select name="moneda" defaultValue={moneda} className="input">
              <option value="">Todas las monedas</option>
              <option value="BOB">Bolivianos</option>
              <option value="USD">Dólares</option>
            </select>

            <div>
              <label className="mb-1 block text-xs text-slate-500">Desde</label>
              <input type="date" name="desde" defaultValue={desde} className="input" />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">Hasta</label>
              <input type="date" name="hasta" defaultValue={hasta} className="input" />
            </div>

            <div className="flex gap-2">
              <button className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                Filtrar
              </button>
              <Link href="/admin/marketing/gastos" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
                Limpiar
              </Link>
            </div>
          </form>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {gastos.length} registros mostrados
            </p>
            {gastos.length === 200 && (
              <span className="text-xs text-slate-400">
                Máximo 200 por consulta
              </span>
            )}
          </div>

          {gastos.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-700">
                No hay gastos registrados.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Los nuevos registros aparecerán en este historial.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {gastos.map(gasto => (
                <article key={String(gasto.id)} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">
                      {gasto.concepto}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {gasto.fecha}
                      {" · "}
                      {categorias[gasto.categoria]}
                      {" · "}
                      {gasto.plataforma ? plataformas[gasto.plataforma] : "Sin plataforma"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {gasto.campana_nombre || "Gasto general de marketing"}
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
                    {gasto.moneda === "BOB" ? "Bs " : "USD "}
                    {formatoDinero(gasto.monto)}
                  </strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}
