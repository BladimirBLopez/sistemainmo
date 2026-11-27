import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import PanelActividadesLead from "@/components/leads/PanelActividadesLead";
import MatchingPropiedadesLead from "@/components/leads/MatchingPropiedadesLead";

export const dynamic = "force-dynamic";

const estados = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  calificado: "Calificado",
  visita_programada: "Visita programada",
  negociacion: "En negociación",
  ganado: "Ganado",
  perdido: "Perdido",
  pausado: "Pausado"
};

function fecha(valor) {
  return valor
    ? new Date(valor).toLocaleString("es-BO")
    : "No registrado";
}

function dinero(valor, moneda) {
  if (valor == null) return "No registrado";
  return `${moneda === "BOB" ? "Bs" : "USD"} ${Number(valor).toLocaleString("es-BO")}`;
}

export default async function FichaLeadAdmin({ params }) {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) notFound();

  const [lead] = await sql`
    SELECT
      l.*,
      a.nombre_completo AS agente_nombre,
      c.nombre_completo AS cliente_nombre,
      p.titulo AS propiedad_titulo
    FROM public.leads l
    LEFT JOIN public.agentes a ON a.id = l.agente_id
    LEFT JOIN public.clientes c ON c.id = l.cliente_id
    LEFT JOIN public.propiedades p ON p.id = l.propiedad_id
    WHERE l.id = ${id}
    LIMIT 1
  `;

  if (!lead) notFound();

  const actividades = await sql`
    SELECT
      la.*,
      a.nombre_completo AS agente_nombre
    FROM public.lead_actividades la
    LEFT JOIN public.agentes a
      ON a.id = la.creado_por_agente_id
    WHERE la.lead_id = ${id}
    ORDER BY la.creado_en DESC
    LIMIT 100
  `;

  const actividadesUI = actividades.map(a => ({
    ...a,
    id: String(a.id),
    lead_id: String(a.lead_id)
  }));

  const campo = (titulo, valor) => (
    <div>
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className="mt-1 font-semibold text-slate-800">
        {valor ?? "No registrado"}
      </p>
    </div>
  );

  return (
    <PanelShell>
      <div className="mx-auto max-w-7xl space-y-5">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/leads"
            className="text-sm font-semibold text-blue-600">
            ← Volver a Leads
          </Link>
          <Link href={`/admin/leads/${lead.id}/editar`}
            className="btn-primary">
            Editar prospecto
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-blue-600">
                Ficha comercial · Lead #{String(lead.id)}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {lead.nombre_contacto}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Registrado: {fecha(lead.creado_en)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                {estados[lead.estado] || lead.estado}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold">
                Prioridad: {lead.prioridad}
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
              Información de contacto
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {campo("Nombre", lead.nombre_contacto)}
              {campo("Teléfono", lead.telefono)}
              {campo("Correo electrónico", lead.email)}
              {campo("Origen", lead.origen)}
              {campo("Detalle del origen", lead.origen_detalle)}
              {campo("Último contacto", fecha(lead.ultimo_contacto_en))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
              Responsable comercial
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {campo("Agente asignado", lead.agente_nombre || "Sin asignar")}
              {campo("Tipo de registro", lead.creado_por_tipo)}
              {campo("Próximo seguimiento", fecha(lead.proximo_seguimiento_en))}
              {campo("Última actualización", fecha(lead.actualizado_en))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
              Necesidades inmobiliarias
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {campo("Operación", lead.tipo_operacion)}
              {campo("Tipo de inmueble", lead.tipo_inmueble)}
              {campo("Departamento", lead.departamento)}
              {campo("Ciudad", lead.ciudad)}
              {campo("Zona", lead.zona)}
              {campo("Cliente vinculado", lead.cliente_nombre)}
              {campo("Propiedad vinculada", lead.propiedad_titulo)}
            </div>
            {lead.cliente_id && (
              <Link href={`/admin/clientes/${lead.cliente_id}`}
                className="mt-4 inline-block text-sm font-semibold text-blue-600">
                Consultar cliente →
              </Link>
            )}
            {lead.propiedad_id && (
              <Link href={`/admin/propiedades/${lead.propiedad_id}`}
                className="mt-4 ml-4 inline-block text-sm font-semibold text-blue-600">
                Consultar propiedad →
              </Link>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
              Presupuesto y resultado
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {campo("Presupuesto mínimo", dinero(lead.presupuesto_min, lead.moneda))}
              {campo("Presupuesto máximo", dinero(lead.presupuesto_max, lead.moneda))}
              {campo("Moneda", lead.moneda)}
              {campo("Conversión", fecha(lead.convertido_en))}
            </div>
            {lead.motivo_perdida && (
              <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                Motivo de pérdida: {lead.motivo_perdida}
              </p>
            )}
          </section>
        </div>

        {lead.mensaje && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">
              Mensaje y necesidades del prospecto
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
              {lead.mensaje}
            </p>
          </section>
        )}

        <MatchingPropiedadesLead leadId={String(lead.id)} modo="admin" />

        <PanelActividadesLead
          leadId={String(lead.id)}
          modo="admin"
          actividades={actividadesUI}
        />

      </div>
    </PanelShell>
  );
}
