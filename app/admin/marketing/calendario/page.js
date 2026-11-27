import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";

export const dynamic = "force-dynamic";

const plataformas = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  portal: "Portal",
  otro: "Otro"
};

const estados = {
  idea: "Idea",
  pendiente: "Pendiente",
  programado: "Programado",
  publicado: "Publicado",
  cancelado: "Cancelado"
};

const colores = {
  idea: "border-slate-200 bg-slate-100 text-slate-700",
  pendiente: "border-amber-200 bg-amber-50 text-amber-800",
  programado: "border-blue-200 bg-blue-50 text-blue-800",
  publicado: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelado: "border-red-200 bg-red-50 text-red-700"
};

const iso = fecha => fecha.toISOString().slice(0, 10);

const formatoMes = fecha =>
  new Intl.DateTimeFormat("es-BO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(fecha);

const parametroMes = fecha =>
  `${fecha.getUTCFullYear()}-${String(
    fecha.getUTCMonth() + 1
  ).padStart(2, "0")}`;

export default async function CalendarioPage({ searchParams }) {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const partesHoy = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const parte = tipo =>
    partesHoy.find(p => p.type === tipo)?.value;

  const hoyISO =
    `${parte("year")}-${parte("month")}-${parte("day")}`;

  const mesActual = hoyISO.slice(0, 7);

  const parametros = searchParams ? await searchParams : {};
  const solicitado = parametros.mes;

  const mesSeleccionado =
    typeof solicitado === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(solicitado) &&
    Number(solicitado.slice(0, 4)) >= 2000 &&
    Number(solicitado.slice(0, 4)) <= 2100
      ? solicitado
      : mesActual;

  const [anio, mes] = mesSeleccionado.split("-").map(Number);

  const primerDia = new Date(Date.UTC(anio, mes - 1, 1));

  const desplazamiento =
    (primerDia.getUTCDay() + 6) % 7;

  const inicioGrid = new Date(
    Date.UTC(anio, mes - 1, 1 - desplazamiento)
  );

  const finGrid = new Date(inicioGrid);
  finGrid.setUTCDate(finGrid.getUTCDate() + 42);

  const inicio = iso(inicioGrid);
  const fin = iso(finGrid);

  const anterior = new Date(Date.UTC(anio, mes - 2, 1));
  const siguiente = new Date(Date.UTC(anio, mes, 1));

  const contenidos = await sql`
    SELECT
      id,
      titulo,
      plataforma,
      formato,
      estado,
      fecha_programada,
      to_char(
        fecha_programada AT TIME ZONE 'America/La_Paz',
        'YYYY-MM-DD'
      ) AS fecha_local,
      to_char(
        fecha_programada AT TIME ZONE 'America/La_Paz',
        'HH24:MI'
      ) AS hora_local
    FROM public.marketing_contenidos
    WHERE fecha_programada IS NOT NULL
      AND fecha_programada >= (
        ${inicio}::date::timestamp AT TIME ZONE 'America/La_Paz'
      )
      AND fecha_programada < (
        ${fin}::date::timestamp AT TIME ZONE 'America/La_Paz'
      )
    ORDER BY fecha_programada ASC
  `;

  const porFecha = new Map();

  for (const contenido of contenidos) {
    const lista = porFecha.get(contenido.fecha_local) || [];
    lista.push(contenido);
    porFecha.set(contenido.fecha_local, lista);
  }

  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const celdas = Array.from({ length: 42 }, (_, i) => {
    const fecha = new Date(inicioGrid);
    fecha.setUTCDate(fecha.getUTCDate() + i);

    const fechaISO = iso(fecha);

    return {
      fecha: fechaISO,
      numero: fecha.getUTCDate(),
      delMes: fecha.getUTCMonth() === mes - 1,
      esHoy: fechaISO === hoyISO,
      eventos: porFecha.get(fechaISO) || []
    };
  });

  const contenidosMes = contenidos.filter(
    c => c.fecha_local?.startsWith(mesSeleccionado)
  );

  const programados = contenidosMes.filter(
    c => c.estado === "programado"
  ).length;

  const publicados = contenidosMes.filter(
    c => c.estado === "publicado"
  ).length;

  return (
    <PanelShell>
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <Link
            href="/admin/marketing"
            className="text-sm font-semibold text-blue-600"
          >
            ← Centro de Marketing
          </Link>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                Planificación editorial
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Calendario de contenidos
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Organiza las publicaciones de todos tus canales.
              </p>
            </div>

            <Link
              href="/admin/marketing/contenidos"
              className="btn-primary px-5 py-3"
            >
              + Nueva publicación
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Contenidos del mes
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              {contenidosMes.length}
            </p>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Programados
            </p>
            <p className="mt-3 text-3xl font-black text-blue-700">
              {programados}
            </p>
          </article>

          <article className="col-span-2 rounded-2xl bg-white p-5 shadow-sm sm:col-span-1">
            <p className="text-sm text-slate-500">
              Publicados
            </p>
            <p className="mt-3 text-3xl font-black text-emerald-700">
              {publicados}
            </p>
          </article>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <div>
              <h3 className="text-xl font-black capitalize text-slate-900">
                {formatoMes(primerDia)}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Horario local de Bolivia
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/marketing/calendario?mes=${parametroMes(anterior)}`}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                ←
              </Link>

              <Link
                href="/admin/marketing/calendario"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hoy
              </Link>

              <Link
                href={`/admin/marketing/calendario?mes=${parametroMes(siguiente)}`}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">

              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-t-xl bg-slate-200">
                {dias.map(dia => (
                  <div
                    key={dia}
                    className="bg-slate-50 p-3 text-center text-xs font-bold text-slate-600"
                  >
                    {dia}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-xl bg-slate-200">

                {celdas.map(celda => (
                  <article
                    key={celda.fecha}
                    className={`min-h-32 p-2 ${
                      celda.delMes ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        celda.esHoy
                          ? "bg-blue-600 text-white"
                          : celda.delMes
                            ? "text-slate-800"
                            : "text-slate-400"
                      }`}>
                        {celda.numero}
                      </span>

                      {celda.eventos.length > 0 && (
                        <span className="text-xs text-slate-400">
                          {celda.eventos.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      {celda.eventos.slice(0, 3).map(evento => (
                        <div
                          key={String(evento.id)}
                          title={`${evento.titulo} - ${evento.hora_local}`}
                          className={`overflow-hidden rounded-md border p-1.5 ${
                            colores[evento.estado] || colores.idea
                          }`}
                        >
                          <p className="truncate text-[10px] font-bold">
                            {evento.titulo}
                          </p>

                          <p className="truncate text-[9px]">
                            {evento.hora_local} · {plataformas[evento.plataforma]}
                          </p>
                        </div>
                      ))}

                      {celda.eventos.length > 3 && (
                        <p className="px-1 text-[10px] font-semibold text-slate-500">
                          +{celda.eventos.length - 3} más
                        </p>
                      )}
                    </div>
                  </article>
                ))}

              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {Object.entries(estados).map(([estado, etiqueta]) => (
              <div key={estado} className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-sm ${
                  colores[estado].split(" ")[0]
                } border`} />
                <span className="text-xs text-slate-600">
                  {etiqueta}
                </span>
              </div>
            ))}
          </div>

        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">
                Publicaciones del mes
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Consulta todas las publicaciones programadas.
              </p>
            </div>

            <Link
              href="/admin/marketing/contenidos"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Ver contenidos →
            </Link>
          </div>

          {contenidosMes.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              No hay publicaciones programadas para este mes.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {contenidosMes.map(c => (
                <article
                  key={String(c.id)}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {c.titulo}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {c.fecha_local} · {c.hora_local} · {plataformas[c.plataforma]}
                    </p>
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    colores[c.estado] || colores.idea
                  }`}>
                    {estados[c.estado]}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </PanelShell>
  );
}
