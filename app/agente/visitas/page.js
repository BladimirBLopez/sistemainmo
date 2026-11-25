import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { AGENTE_COOKIE_NAME } from "@/lib/auth-agente";
import { obtenerAgenteActivo } from "@/lib/autorizacion-agente";
import AgendaVisitas from "@/components/leads/AgendaVisitas";
import BotonSalir from "@/components/agente/BotonSalir";

export const dynamic = "force-dynamic";

function mesBolivia() {
  const p = new Intl.DateTimeFormat("en", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());

  return `${p.find(x => x.type === "year").value}-${p.find(x => x.type === "month").value}`;
}

export default async function AgendaAgente({ searchParams }) {
  const store = await cookies();

  const agente = await obtenerAgenteActivo(
    store.get(AGENTE_COOKIE_NAME)?.value
  );

  if (!agente) redirect("/agente/login");

  const p = searchParams ? await searchParams : {};

  const mes = typeof p.mes === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(p.mes)
      ? p.mes
      : mesBolivia();

  const estados = ["pendiente", "completada", "cancelada"];
  const estado = estados.includes(p.estado) ? p.estado : "";

  const filas = await sql`
    SELECT
      la.id,
      la.lead_id,
      la.titulo,
      la.descripcion,
      la.estado,
      la.programado_en,
      COALESCE(c.nombre_completo, l.nombre_contacto) AS contacto_nombre,
      l.telefono,
      p.titulo AS propiedad_titulo
    FROM public.lead_actividades la
    JOIN public.leads l ON l.id = la.lead_id
    LEFT JOIN public.clientes c ON c.id = l.cliente_id
    LEFT JOIN public.propiedades p ON p.id = l.propiedad_id
    WHERE la.tipo = 'visita'
      AND la.programado_en IS NOT NULL
      AND l.agente_id = ${agente.id}
      AND TO_CHAR(
        la.programado_en AT TIME ZONE 'America/La_Paz',
        'YYYY-MM'
      ) = ${mes}
      AND (${estado} = '' OR la.estado = ${estado})
    ORDER BY la.programado_en ASC
    LIMIT 300
  `;

  const visitas = filas.map(v => ({
    ...v,
    id: String(v.id),
    lead_id: String(v.lead_id),
    programado_en: new Date(v.programado_en).toISOString()
  }));

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-5 text-white">
        <div>
          <h1 className="text-xl font-bold">Sistema Inmobiliario</h1>
          <p className="text-sm text-slate-300">Agenda de visitas</p>
        </div>
        <BotonSalir />
      </header>

      <div className="mx-auto max-w-7xl space-y-5 p-5 md:p-8">
        <Link href="/agente" className="text-sm font-semibold text-blue-600">
          ← Panel de agente
        </Link>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Mi agenda comercial
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Tus visitas y compromisos comerciales asignados.
          </p>
        </div>

        <AgendaVisitas
          mes={mes}
          estado={estado}
          modo="agente"
          visitas={visitas}
        />
      </div>
    </main>
  );
}
