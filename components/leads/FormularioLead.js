"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const clase = "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900";

export default function FormularioLead({ modo = "admin", agentes = [] }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;

    setGuardando(true);
    setError("");

    try {
      const formulario = new FormData(e.currentTarget);
      const datos = Object.fromEntries(formulario.entries());

      if (modo === "admin") {
        datos.agente_id = datos.agente_id || null;
      }

      const base = modo === "admin"
        ? "/api/admin/leads"
        : "/api/agente/leads";

      const respuesta = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo registrar el prospecto");
      }

      router.push(modo === "admin" ? "/admin/leads" : "/agente/leads");
      router.refresh();

    } catch (e) {
      setError(e.message || "Error al registrar el prospecto");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-5">

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-900">Datos de contacto</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold">Nombre completo *</label>
            <input name="nombre_contacto" required minLength={2} maxLength={150}
              className={clase} placeholder="Nombre del prospecto" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Teléfono *</label>
            <input name="telefono" type="tel" required minLength={7}
              maxLength={25} className={clase} placeholder="+591 ..." />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Correo electrónico</label>
            <input name="email" type="email" className={clase}
              placeholder="correo@ejemplo.com" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-900">Clasificación comercial</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">Origen del prospecto</label>
            <select name="origen" defaultValue="otro" className={clase}>
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
            <select name="prioridad" defaultValue="media" className={clase}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Estado comercial</label>
            <select name="estado" defaultValue="nuevo" className={clase}>
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
            <select name="tipo_operacion" defaultValue="" className={clase}>
              <option value="">Sin especificar</option>
              <option value="venta">Compra / Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="anticretico">Anticrético</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Tipo de inmueble</label>
            <input name="tipo_inmueble" maxLength={100}
              className={clase} placeholder="Casa, terreno, departamento..." />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Departamento</label>
            <input name="departamento" maxLength={80} className={clase} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Ciudad</label>
            <input name="ciudad" maxLength={100} className={clase} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Zona</label>
            <input name="zona" maxLength={120} className={clase} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-900">Presupuesto estimado</h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold">Mínimo</label>
            <input name="presupuesto_min" type="number" min="0" step="any" className={clase} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Máximo</label>
            <input name="presupuesto_max" type="number" min="0" step="any" className={clase} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Moneda</label>
            <select name="moneda" defaultValue="USD" className={clase}>
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
          <select name="agente_id" defaultValue="" className={clase}>
            <option value="">Sin asignar</option>
            {agentes.map(a => (
              <option key={String(a.id)} value={a.id}>
                {a.nombre_completo}
              </option>
            ))}
          </select>
        </section>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-900">Información adicional</h3>

        <label className="mb-2 block text-sm font-semibold">Detalle del origen</label>
        <input name="origen_detalle" maxLength={120} className={clase}
          placeholder="Ej. Campaña de Facebook..." />

        <label className="mb-2 mt-4 block text-sm font-semibold">Mensaje y necesidades del prospecto</label>
        <textarea name="mensaje" rows={4} maxLength={3000} className={clase}
          placeholder="Describe qué está buscando y sus necesidades..." />
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button disabled={guardando} type="submit"
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-50">
          {guardando ? "Guardando..." : "Registrar prospecto"}
        </button>

        <button type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700">
          Cancelar
        </button>
      </div>
    </form>
  );
}
