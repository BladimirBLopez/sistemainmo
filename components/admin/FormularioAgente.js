"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AvisoCambios from "@/components/AvisoCambios";
import { toast } from "sonner";

const clases = "input";

export default function FormularioAgente({ agente = null }) {
  const router = useRouter();
  const formRef = useRef(null);
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

      toast.success(agente ? "Agente actualizado" : "Agente registrado");
      formRef.current?.dispatchEvent(new Event("guardado"));
      router.push(`/admin/agentes/${resultado.id}`);
      router.refresh();

    } catch (fallo) {
      toast.error(fallo instanceof Error ? fallo.message : "Error al guardar");
      setError(fallo instanceof Error ? fallo.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={guardar} className="space-y-5">
      <AvisoCambios />
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-bold text-slate-900">
          Información del agente
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">
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
            <label className="label">
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
            <label className="label">
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
            <label className="label">
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
              <label className="label">
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
          className="btn-ghost px-6 py-3"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
