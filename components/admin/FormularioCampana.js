"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const campo = "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function FormularioCampana({ campana = null }) {
  const editando = Boolean(campana);
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;

    setGuardando(true);
    setError("");

    try {
      const datos = Object.fromEntries(
        new FormData(evento.currentTarget).entries()
      );

      const respuesta = await fetch(
        editando ? `/api/admin/marketing/${campana.id}` : "/api/admin/marketing",
        {
          method: editando ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo registrar");
      }

      router.push(editando ? `/admin/marketing/${campana.id}` : "/admin/marketing");
      router.refresh();

    } catch (fallo) {
      setError(fallo.message || "Error al registrar campaña");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-6">

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-bold text-slate-900">
          Información de la campaña
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Nombre de campaña *
            </label>
            <input
              name="nombre"
              required
              minLength={3}
              maxLength={160}
              defaultValue={campana?.nombre || ""}
              className={campo}
              placeholder="Ej. Captación de propiedades Santa Cruz"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Descripción
            </label>
            <textarea
              name="descripcion"
              maxLength={4000}
              defaultValue={campana?.descripcion || ""}
              rows={4}
              className={campo}
              placeholder="Describe el propósito y estrategia de la campaña..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Objetivo
              </label>
              <select name="objetivo" defaultValue={campana?.objetivo || "captacion"} className={campo}>
                <option value="captacion">Captación de leads</option>
                <option value="trafico">Tráfico</option>
                <option value="reconocimiento">Reconocimiento</option>
                <option value="interaccion">Interacción</option>
                <option value="ventas">Ventas</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Tipo de campaña
              </label>
              <select name="tipo" defaultValue={campana?.tipo || "paga"} className={campo}>
                <option value="paga">Publicidad pagada</option>
                <option value="organica">Orgánica</option>
                <option value="mixta">Mixta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Estado
            </label>
            <select name="estado" defaultValue={campana?.estado || "borrador"} className={campo}>
              <option value="borrador">Borrador</option>
              <option value="programada">Programada</option>
              <option value="activa">Activa</option>
              <option value="pausada">Pausada</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-bold text-slate-900">
          Presupuesto e inversión
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Presupuesto *
            </label>
            <input
              name="presupuesto"
              type="number"
              required
              min="0"
              max="999999999999"
              step="0.01"
              defaultValue={campana?.presupuesto ?? "0"}
              className={campo}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Moneda
            </label>
            <select name="moneda" defaultValue={campana?.moneda || "BOB"} className={campo}>
              <option value="BOB">Bolivianos (Bs)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-bold text-slate-900">
          Programación
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Fecha de inicio
            </label>
            <input
              name="fecha_inicio"
              type="date"
              defaultValue={campana?.fecha_inicio || ""}
              className={campo}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Fecha de finalización
            </label>
            <input
              name="fecha_fin"
              type="date"
              defaultValue={campana?.fecha_fin || ""}
              className={campo}
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          disabled={guardando}
          onClick={() => router.push(editando ? `/admin/marketing/${campana.id}` : "/admin/marketing")}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={guardando}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Registrar campaña"}
        </button>
      </div>
    </form>
  );
}
