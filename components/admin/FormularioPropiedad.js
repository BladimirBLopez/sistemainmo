"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const campos = [
  { nombre: "departamento", etiqueta: "Departamento", maximo: 80 },
  { nombre: "ciudad", etiqueta: "Ciudad", maximo: 100 },
  { nombre: "zona", etiqueta: "Zona", maximo: 120 },
  { nombre: "direccion_privada", etiqueta: "Direccion privada", maximo: 300 }
];

export default function FormularioPropiedad() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(evento) {
    evento.preventDefault();
    if (guardando) return;

    setError("");
    setGuardando(true);

    const datos = Object.fromEntries(
      new FormData(evento.currentTarget).entries()
    );

    try {
      const respuesta = await fetch("/api/admin/propiedades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo guardar");
      }

      router.push("/admin/propiedades");
      router.refresh();
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "Error al guardar la propiedad"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div>
        <label htmlFor="titulo" className="mb-2 block text-sm font-medium">
          Titulo de la propiedad *
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          maxLength={150}
          placeholder="Ej. Casa moderna en Equipetrol"
          className="w-full rounded-xl border border-slate-300 p-3"
        />
      </div>

      <div>
        <label htmlFor="tipo" className="mb-2 block text-sm font-medium">
          Tipo de inmueble *
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          defaultValue=""
          className="w-full rounded-xl border border-slate-300 p-3"
        >
          <option value="" disabled>Seleccionar tipo</option>
          {[
            "Casa", "Departamento", "Terreno",
            "Local comercial", "Oficina", "Galpon",
            "Quinta", "Otro"
          ].map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-2 block text-sm font-medium">
          Descripcion
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          maxLength={4000}
          placeholder="Describe las caracteristicas del inmueble"
          className="w-full rounded-xl border border-slate-300 p-3"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {campos.map(campo => (
          <div key={campo.nombre}>
            <label
              htmlFor={campo.nombre}
              className="mb-2 block text-sm font-medium"
            >
              {campo.etiqueta}
            </label>
            <input
              id={campo.nombre}
              name={campo.nombre}
              maxLength={campo.maximo}
              className="w-full rounded-xl border border-slate-300 p-3"
            />
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-500">
        La propiedad se guardara como borrador.
      </p>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {guardando ? "Guardando..." : "Guardar propiedad"}
      </button>
    </form>
  );
}
