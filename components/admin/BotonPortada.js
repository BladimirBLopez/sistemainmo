"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BotonPortada({ propiedadId, fotoId, alActualizar, modo = "admin" }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function cambiarPortada() {
    if (guardando) return;

    setGuardando(true);
    setError("");

    try {
      const baseApi = modo === "agente" ? "/api/agente/propiedades" : "/api/admin/propiedades";
      const respuesta = await fetch(
        `${baseApi}/${propiedadId}/portada/${fotoId}`,
        { method: "POST" }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok || resultado.ok !== true) {
        throw new Error(
          resultado.error || "No se pudo cambiar la portada"
        );
      }

      router.refresh();
      alActualizar?.();
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "Error al cambiar la portada"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="absolute bottom-3 right-3 z-10">
      <button
        type="button"
        onClick={cambiarPortada}
        disabled={guardando}
        className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-brand-700 shadow disabled:opacity-50"
      >
        {guardando ? "Guardando..." : "Elegir como portada"}
      </button>

      {error && (
        <p role="alert" className="mt-2 rounded bg-white p-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
