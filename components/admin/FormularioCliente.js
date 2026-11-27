"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const rolesDisponibles = [
  ["propietario", "Propietario"],
  ["comprador", "Comprador"],
  ["arrendatario", "Arrendatario"],
  ["buscador", "Buscador de inmuebles"],
  ["vendedor", "Vendedor"],
  ["otro", "Otro"]
];

const clases =
  "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function FormularioCliente({ cliente = null, modo = "admin" }) {
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
      const datos = Object.fromEntries(formulario.entries());

      datos.roles = formulario.getAll("roles");
      datos.estado = formulario.get("estado") || "activo";

      const baseApi = modo === "agente" ? "/api/agente/clientes" : "/api/admin/clientes";

      const respuesta = await fetch(
        cliente ? `${baseApi}/${cliente.id}` : baseApi,
        {
          method: cliente ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo guardar");
      }

      router.push(`${modo === "agente" ? "/agente/clientes" : "/admin/clientes"}/${resultado.id}`);
      router.refresh();
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo guardar el cliente"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-6">

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Información personal
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
              defaultValue={cliente?.nombre_completo || ""}
              className={clases}
              placeholder="Nombre y apellidos"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Teléfono principal *
            </label>
            <input
              name="telefono"
              type="tel"
              required
              defaultValue={cliente?.telefono || ""}
              className={clases}
              placeholder="+591 ..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Teléfono secundario
            </label>
            <input
              name="telefono_secundario"
              defaultValue={cliente?.telefono_secundario || ""}
              className={clases}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              defaultValue={cliente?.email || ""}
              className={clases}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Documento
              </label>
              <select
                name="tipo_documento"
                defaultValue={cliente?.tipo_documento || ""}
                className={clases}
              >
                <option value="">Sin especificar</option>
                <option value="CI">CI</option>
                <option value="NIT">NIT</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Número
              </label>
              <input
                name="numero_documento"
                maxLength={40}
                defaultValue={cliente?.numero_documento || ""}
                className={clases}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-lg font-bold text-slate-900">
          Clasificación del cliente
        </h3>
        <p className="mb-4 text-sm text-slate-500">
          Una persona puede tener varias funciones dentro de la inmobiliaria.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {rolesDisponibles.map(([valor, etiqueta]) => (
            <label
              key={valor}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium"
            >
              <input
                type="checkbox"
                name="roles"
                value={valor}
                defaultChecked={
                  cliente
                    ? cliente.roles.includes(valor)
                    : valor === "comprador"
                }
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              {etiqueta}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Ubicación y contacto
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["departamento", "Departamento"],
            ["ciudad", "Municipio o ciudad"],
            ["zona", "Zona o barrio"],
            ["direccion", "Dirección"]
          ].map(([campo, etiqueta]) => (
            <div key={campo}>
              <label className="mb-2 block text-sm font-semibold">
                {etiqueta}
              </label>
              <input
                name={campo}
                maxLength={campo === "direccion" ? 250 : 120}
                defaultValue={cliente?.[campo] || ""}
                className={clases}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Seguimiento interno
        </h3>

        <label className="mb-2 block text-sm font-semibold">
          Observaciones
        </label>
        <textarea
          name="notas"
          rows={4}
          maxLength={3000}
          defaultValue={cliente?.notas || ""}
          className={clases}
          placeholder="Información importante sobre el cliente..."
        />

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold">
            Estado
          </label>
          <select
            name="estado"
            defaultValue={cliente?.estado || "activo"}
            className={clases}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
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
          {guardando ? "Guardando..." : cliente ? "Guardar cambios" : "Registrar cliente"}
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
