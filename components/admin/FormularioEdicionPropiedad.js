"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const tipos = [
  "Casa", "Departamento", "Terreno",
  "Local comercial", "Oficina", "Galpon",
  "Quinta", "Otro"
];

const ubicacion = [
  ["departamento", "Departamento", 80],
  ["ciudad", "Ciudad", 100],
  ["zona", "Zona", 120],
  ["direccion_privada", "Direccion privada", 300]
];

const caracteristicas = [
  ["dormitorios", "Dormitorios", "1"],
  ["banos", "Baños", "1"],
  ["parqueos", "Parqueos", "1"],
  ["superficie_terreno_m2", "Terreno (m²)", "0.01"],
  ["superficie_construida_m2", "Construccion (m²)", "0.01"]
];

const claseInput =
  "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm";

export default function FormularioEdicionPropiedad({ propiedad }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function guardar(evento) {
    evento.preventDefault();

    if (guardando) return;

    setGuardando(true);
    setError("");
    setExito("");

    const datos = Object.fromEntries(
      new FormData(evento.currentTarget).entries()
    );

    try {
      const respuesta = await fetch(
        `/api/admin/propiedades/${propiedad.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(datos)
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "No se pudieron guardar los cambios"
        );
      }

      setExito("Propiedad actualizada correctamente.");

      router.replace(`/admin/propiedades/${propiedad.id}`);
      router.refresh();

    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "Error al actualizar"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-6">

      <section className="space-y-4">
        <h3 className="font-bold text-slate-900">
          Información principal
        </h3>

        <div>
          <label htmlFor="titulo" className="mb-2 block text-sm font-medium">
            Título de la propiedad *
          </label>
          <input
            id="titulo"
            name="titulo"
            required
            maxLength={150}
            defaultValue={propiedad.titulo}
            className={claseInput}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tipo" className="mb-2 block text-sm font-medium">
              Tipo de inmueble *
            </label>
            <select
              id="tipo"
              name="tipo"
              required
              defaultValue={propiedad.tipo}
              className={claseInput}
            >
              {tipos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tipo_operacion" className="mb-2 block text-sm font-medium">
              Operación *
            </label>
            <select
              id="tipo_operacion"
              name="tipo_operacion"
              required
              defaultValue={propiedad.tipo_operacion || ""}
              className={claseInput}
            >
              <option value="" disabled>Seleccionar</option>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="precio" className="mb-2 block text-sm font-medium">
              Precio *
            </label>
            <input
              id="precio"
              name="precio"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={propiedad.precio}
              className={claseInput}
            />
          </div>

          <div>
            <label htmlFor="moneda" className="mb-2 block text-sm font-medium">
              Moneda *
            </label>
            <select
              id="moneda"
              name="moneda"
              required
              defaultValue={propiedad.moneda || ""}
              className={claseInput}
            >
              <option value="" disabled>Seleccionar</option>
              <option value="BOB">Bolivianos (Bs)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="descripcion" className="mb-2 block text-sm font-medium">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={5}
            maxLength={4000}
            defaultValue={propiedad.descripcion}
            className={claseInput}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-bold text-slate-900">
          Ubicación del inmueble
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {ubicacion.map(([nombre, etiqueta, maximo]) => (
            <div key={nombre}>
              <label
                htmlFor={nombre}
                className="mb-2 block text-sm font-medium"
              >
                {etiqueta}
                {nombre === "direccion_privada" && (
                  <span className="ml-1 text-xs text-slate-400">
                    (solo administración)
                  </span>
                )}
              </label>
              <input
                id={nombre}
                name={nombre}
                maxLength={maximo}
                defaultValue={propiedad[nombre]}
                className={claseInput}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-bold text-slate-900">
          Características del inmueble
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {caracteristicas.map(([nombre, etiqueta, paso]) => (
            <div key={nombre}>
              <label
                htmlFor={nombre}
                className="mb-2 block text-sm font-medium"
              >
                {etiqueta}
              </label>
              <input
                id={nombre}
                name={nombre}
                type="number"
                min="0"
                step={paso}
                defaultValue={propiedad[nombre]}
                className={claseInput}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-bold text-slate-900">
          Gestión y estados
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="estado_publicacion"
              className="mb-2 block text-sm font-medium"
            >
              Estado de publicación *
            </label>
            <select
              id="estado_publicacion"
              name="estado_publicacion"
              required
              defaultValue={propiedad.estado_publicacion}
              className={claseInput}
            >
              <option value="borrador">Borrador</option>
              <option value="pendiente">Pendiente</option>
              <option value="publicada">Publicada</option>
              <option value="oculta">Oculta</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="estado_comercial"
              className="mb-2 block text-sm font-medium"
            >
              Estado comercial *
            </label>
            <select
              id="estado_comercial"
              name="estado_comercial"
              required
              defaultValue={propiedad.estado_comercial}
              className={claseInput}
            >
              <option value="disponible">Disponible</option>
              <option value="reservada">Reservada</option>
              <option value="vendida">Vendida</option>
              <option value="alquilada">Alquilada</option>
              <option value="retirada">Retirada</option>
            </select>
          </div>
        </div>
      </section>

      <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
        Las fotografías existentes se conservarán.
        Puedes administrarlas desde la ficha de la propiedad.
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {exito && (
        <p role="status" className="text-sm text-emerald-700">
          {exito}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {guardando ? "Guardando cambios..." : "Guardar cambios"}
        </button>

        <Link
          href={`/admin/propiedades/${propiedad.id}`}
          className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
