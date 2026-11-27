"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const clase = "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900";

export default function FormularioLead({
  modo = "admin",
  agentes = [],
  lead = null,
  edicion = false
}) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [estado, setEstado] = useState(lead?.estado || "nuevo");

  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;

    const datos = Object.fromEntries(
      new FormData(e.currentTarget).entries()
    );

    if (modo === "admin") {
      datos.agente_id = datos.agente_id || null;
    }

    setGuardando(true);
    setError("");

    try {
      const base = modo === "admin"
        ? "/api/admin/leads"
        : "/api/agente/leads";

      const respuesta = await fetch(
        edicion ? `${base}/${lead.id}` : base,
        {
          method: edicion ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo guardar el prospecto");
      }

      router.push(
        edicion
          ? `/admin/leads/${lead.id}`
          : modo === "admin"
            ? "/admin/leads"
            : "/agente/leads"
      );

      router.refresh();

    } catch (e) {
      setError(e.message || "Error al guardar el prospecto");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-5">

      {edicion && (
        <>
          <input type="hidden" name="cliente_id" value={lead?.cliente_id || ""} />
          <input type="hidden" name="propiedad_id" value={lead?.propiedad_id || ""} />
        </>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-900">Datos de contacto</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold">Nombre completo *</label>
            <input name="nombre_contacto" required minLength={2} maxLength={150}
              defaultValue={lead?.nombre_contacto || ""}
              className={clase} placeholder="Nombre del prospecto" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Teléfono *</label>
            <input name="telefono" type="tel" required minLength={7}
              maxLength={25} defaultValue={lead?.telefono || ""}
              className={clase} placeholder="+591 ..." />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Correo electrónico</label>
            <input name="email" type="email" defaultValue={lead?.email || ""}
              className={clase} placeholder="correo@ejemplo.com" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-900">Clasificación comercial</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">Origen del prospecto</label>
            <select name="origen" defaultValue={lead?.origen || "otro"} className={clase}>
              <option value="portal">Portal inmobiliario</option>
              <option value="web">Página web</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="llamada">Llamada telefónica</option>
              <option value="referido">Referido</option>
              <option value="oficina">Oficina</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Prioridad</label>
            <select name="prioridad" defaultValue={lead?.prioridad || "media"} className={clase}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Estado comercial</label>
            <select name="estado" value={estado}
              onChange={e => setEstado(e.target.value)} className={clase}>
              <option value="nuevo">Nuevo</option>
              <option value="contactado">Contactado</option>
              <option value="calificado">Calificado</option>
              <option value="visita_programada">Visita programada</option>
              <option value="negociacion">En negociación</option>
              <option value="ganado">Ganado</option>
              <option value="perdido">Perdido</option>
              <option value="pausado">Pausado</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Tipo de operación</label>
            <select name="tipo_operacion" defaultValue={lead?.tipo_operacion || ""} className={clase}>
              <option value="">Sin especificar</option>
              <option value="venta">Compra / Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="anticretico">Anticrético</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Tipo de inmueble</label>
            <input name="tipo_inmueble" maxLength={100}
              defaultValue={lead?.tipo_inmueble || ""}
              className={clase} placeholder="Casa, terreno, departamento..." />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Departamento</label>
            <input name="departamento" maxLength={80}
              defaultValue={lead?.departamento || ""} className={clase} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Ciudad</label>
            <input name="ciudad" maxLength={100}
              defaultValue={lead?.ciudad || ""} className={clase} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Zona</label>
            <input name="zona" maxLength={120}
              defaultValue={lead?.zona || ""} className={clase} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-900">Presupuesto estimado</h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold">Mínimo</label>
            <input name="presupuesto_min" type="number" min="0" step="any"
              defaultValue={lead?.presupuesto_min ?? ""} className={clase} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Máximo</label>
            <input name="presupuesto_max" type="number" min="0" step="any"
              defaultValue={lead?.presupuesto_max ?? ""} className={clase} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Moneda</label>
            <select name="moneda" defaultValue={lead?.moneda || "USD"} className={clase}>
              <option value="USD">Dólares (USD)</option>
              <option value="BOB">Bolivianos (Bs)</option>
            </select>
          </div>
        </div>
      </section>

      {modo === "admin" && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-900">Responsable comercial</h3>
          <label className="mb-2 block text-sm font-semibold">Asignar agente</label>
          <select name="agente_id" defaultValue={lead?.agente_id || ""} className={clase}>
            <option value="">Sin asignar</option>
            {agentes.map(a => (
              <option key={String(a.id)} value={a.id}>
                {a.nombre_completo}{a.estado === "inactivo" ? " (Inactivo)" : ""}
              </option>
            ))}
          </select>
        </section>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-900">Información adicional</h3>

        <label className="mb-2 block text-sm font-semibold">Detalle del origen</label>
        <input name="origen_detalle" maxLength={120}
          defaultValue={lead?.origen_detalle || ""}
          className={clase} placeholder="Ej. Campaña de Facebook..." />

        <label className="mb-2 mt-4 block text-sm font-semibold">
          Mensaje y necesidades del prospecto
        </label>
        <textarea name="mensaje" rows={4} maxLength={3000}
          defaultValue={lead?.mensaje || ""} className={clase}
          placeholder="Describe qué está buscando y sus necesidades..." />

        <label className="mb-2 mt-4 block text-sm font-semibold">
          Motivo de pérdida {estado === "perdido" ? "*" : "(si corresponde)"}
        </label>
        <textarea name="motivo_perdida" rows={3} maxLength={1000}
          required={estado === "perdido"}
          defaultValue={lead?.motivo_perdida || ""}
          className={clase}
          placeholder="Explica por qué se perdió la oportunidad comercial..." />
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button disabled={guardando} type="submit"
          className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white disabled:opacity-50">
          {guardando ? "Guardando..." : edicion ? "Guardar cambios" : "Registrar prospecto"}
        </button>

        <button type="button" onClick={() => router.back()}
          className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700">
          Cancelar
        </button>
      </div>
    </form>
  );
}
