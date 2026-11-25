import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import PanelShell from "@/components/admin/PanelShell";
import AgendaVisitas from "@/components/leads/AgendaVisitas";

export const dynamic = "force-dynamic";

function mesBolivia() {
  const p = new Intl.DateTimeFormat("en", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());

  return `${p.find(x => x.type === "year").value}-${p.find(x => x.type === "month").value}`;
}

export default async function AgendaAdmin({ searchParams }) {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const p = searchParams ? await searchParams : {};

  const mes = typeof p.mes === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(p.mes)
      ? p.mes
      : mesBolivia();

  const estados = ["pendiente", "completada", "cancelada"];
  const estado = estados.includes(p.estado) ? p.estado : "";

  const agenteFiltro = typeof p.agente === "string" &&
    /^[1-9]\d{0,18}$/.test(p.agente)
      ? p.agente
      : "";

  const agentesDB = await sql`
    SELECT id, nombre_completo
    FROM public.agentes
    ORDER BY nombre_completo
  `;

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
      p.titulo AS propiedad_titulo,
      a.nombre_completo AS agente_nombre
    FROM public.lead_actividades la
    JOIN public.leads l ON l.id = la.lead_id
    LEFT JOIN public.clientes c ON c.id = l.cliente_id
    LEFT JOIN public.propiedades p ON p.id = l.propiedad_id
    LEFT JOIN public.agentes a ON a.id = l.agente_id
    WHERE la.tipo = 'visita'
      AND la.programado_en IS NOT NULL
      AND TO_CHAR(
        la.programado_en AT TIME ZONE 'America/La_Paz',
        'YYYY-MM'
      ) = ${mes}
      AND (${estado} = '' OR la.estado = ${estado})
      AND (
        NULLIF(${agenteFiltro}, '')::bigint IS NULL
        OR l.agente_id = NULLIF(${agenteFiltro}, '')::bigint
      )
    ORDER BY la.programado_en ASC
    LIMIT 300
  `;

  const visitas = filas.map(v => ({
    ...v,
    id: String(v.id),
    lead_id: String(v.lead_id),
    programado_en: new Date(v.programado_en).toISOString()
  }));

  const agentes = agentesDB.map(a => ({
    id: String(a.id),
    nombre: a.nombre_completo
  }));

  return (
    <PanelShell>
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-blue-600">
            ← Panel administrativo
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Agenda comercial
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Control general de visitas y actividades comerciales.
          </p>
        </div>

        <AgendaVisitas
          mes={mes}
          estado={estado}
          modo="admin"
          visitas={visitas}
          agentes={agentes}
          agenteSeleccionado={agenteFiltro}
        />
      </div>
    </PanelShell>
  );
}
