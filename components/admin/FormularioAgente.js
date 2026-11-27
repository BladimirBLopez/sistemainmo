"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const clases = "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function FormularioAgente({ agente = null }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(evento) {
    evento.preventDefault();

    if (guardando) return;

    setGuardando(true);
    setError("");

    try {
      const formulario = new FormData(evento.currentTarget);

      const datos = {
        nombre_completo: formulario.get("nombre_completo"),
        email: formulario.get("email"),
        telefono: formulario.get("telefono"),
        estado: formulario.get("estado") || "activo",
        password: formulario.get("password")
      };

      const respuesta = await fetch(
        agente ? `/api/admin/agentes/${agente.id}` : "/api/admin/agentes",
        {
          method: agente ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo guardar el agente");
      }

      router.push(`/admin/agentes/${resultado.id}`);
      router.refresh();

    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-5">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-bold text-slate-900">
          Información del agente
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Nombre completo *
            </label>
            <input
              name="nombre_completo"
              required
              minLength={2}
              maxLength={150}
              defaultValue={agente?.nombre_completo || ""}
              className={clases}
              placeholder="Nombre y apellidos"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Correo electrónico *
            </label>
            <input
              name="email"
              type="email"
              required
              maxLength={180}
              defaultValue={agente?.email || ""}
              className={clases}
              placeholder="agente@correo.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Teléfono
            </label>
            <input
              name="telefono"
              type="tel"
              maxLength={25}
              defaultValue={agente?.telefono || ""}
              className={clases}
              placeholder="+591 ..."
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              {agente ? "Nueva contraseña (opcional)" : "Contraseña *"}
            </label>
            <input
              name="password"
              type="password"
              required={!agente}
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              className={clases}
              placeholder={agente ? "Dejar vacío para conservar la actual" : "Mínimo 12 caracteres"}
            />
            <p className="mt-2 text-xs text-slate-500">
              La contraseña se almacena mediante un hash seguro. No se muestra posteriormente.
            </p>
          </div>

          {agente && (
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Estado de la cuenta
              </label>
              <select
                name="estado"
                defaultValue={agente.estado}
                className={clases}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="btn-primary px-6 py-3"
        >
          {guardando ? "Guardando..." : agente ? "Guardar cambios" : "Registrar agente"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
