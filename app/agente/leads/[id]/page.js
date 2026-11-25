import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { AGENTE_COOKIE_NAME } from "@/lib/auth-agente";
import { obtenerAgenteActivo } from "@/lib/autorizacion-agente";
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

export default async function FichaLeadAgente({ params }) {
  const store = await cookies();

  const agente = await obtenerAgenteActivo(
    store.get(AGENTE_COOKIE_NAME)?.value
  );

  if (!agente) redirect("/agente/login");

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) notFound();

  const [lead] = await sql`
    SELECT
      l.*,
      c.nombre_completo AS cliente_nombre,
      c.id AS cliente_visible_id,
      p.titulo AS propiedad_titulo,
      p.id AS propiedad_visible_id
    FROM public.leads l
    LEFT JOIN public.clientes c
      ON c.id = l.cliente_id
      AND EXISTS (
        SELECT 1 FROM public.agente_clientes ac
        WHERE ac.agente_id = ${agente.id}
          AND ac.cliente_id = c.id
      )
    LEFT JOIN public.propiedades p
      ON p.id = l.propiedad_id
      AND EXISTS (
        SELECT 1 FROM public.agente_propiedades ap
        WHERE ap.agente_id = ${agente.id}
          AND ap.propiedad_id = p.id
      )
    WHERE l.id = ${id}
      AND l.agente_id = ${agente.id}
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
    <main className="min-h-[calc(100vh-4rem)] bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-5">

        <Link href="/agente/leads"
          className="text-sm font-semibold text-blue-600">
          ← Volver a mis Leads
        </Link>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase text-blue-600">
            Mi ficha comercial · Lead #{String(lead.id)}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {lead.nombre_contacto}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                {estados[lead.estado] || lead.estado}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-sm">
                {lead.prioridad}
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-bold text-slate-900">
              Contacto del prospecto
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {campo("Nombre", lead.nombre_contacto)}
              {campo("Teléfono", lead.telefono)}
              {campo("Correo", lead.email)}
              {campo("Origen", lead.origen)}
              {campo("Detalle del origen", lead.origen_detalle)}
              {campo("Último contacto", fecha(lead.ultimo_contacto_en))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-bold text-slate-900">
              Preferencias inmobiliarias
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {campo("Operación", lead.tipo_operacion)}
              {campo("Inmueble", lead.tipo_inmueble)}
              {campo("Departamento", lead.departamento)}
              {campo("Ciudad", lead.ciudad)}
              {campo("Zona", lead.zona)}
              {campo("Presupuesto mínimo", dinero(lead.presupuesto_min, lead.moneda))}
              {campo("Presupuesto máximo", dinero(lead.presupuesto_max, lead.moneda))}
              {campo("Moneda", lead.moneda)}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-5 font-bold text-slate-900">
              Relaciones comerciales
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {campo("Cliente vinculado", lead.cliente_nombre)}
              {campo("Propiedad vinculada", lead.propiedad_titulo)}
              {campo("Próximo seguimiento", fecha(lead.proximo_seguimiento_en))}
              {campo("Última actualización", fecha(lead.actualizado_en))}
            </div>

            {lead.cliente_visible_id && (
              <Link href={`/agente/clientes/${lead.cliente_visible_id}`}
                className="mt-4 inline-block text-sm font-semibold text-blue-600">
                Consultar cliente →
              </Link>
            )}

            {lead.propiedad_visible_id && (
              <Link href={`/agente/propiedades/${lead.propiedad_visible_id}`}
                className="mt-4 ml-4 inline-block text-sm font-semibold text-blue-600">
                Consultar propiedad →
              </Link>
            )}
          </section>
        </div>

        {lead.mensaje && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">
              Necesidades del prospecto
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
              {lead.mensaje}
            </p>
          </section>
        )}

        <MatchingPropiedadesLead leadId={String(lead.id)} modo="agente" />

        <PanelActividadesLead
          leadId={String(lead.id)}
          modo="agente"
          actividades={actividadesUI}
        />

      </div>
    </main>
  );
}
