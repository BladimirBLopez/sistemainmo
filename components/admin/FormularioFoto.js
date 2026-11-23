"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function FormularioFoto({ propiedadId }) {
  const router = useRouter();
  const archivoRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function enviar(evento) {
    evento.preventDefault();
    if (subiendo) return;

    setError("");
    setExito("");

    const archivo = archivoRef.current?.files?.[0];

    if (!archivo) {
      setError("Selecciona una fotografia");
      return;
    }

    const tipos = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!tipos.includes(archivo.type)) {
      setError("Solo se permiten JPG, PNG o WebP");
      return;
    }

    if (archivo.size < 1 || archivo.size > 3 * 1024 * 1024) {
      setError("La imagen debe pesar menos de 3 MB");
      return;
    }

    const datos = new FormData();
    datos.append("imagen", archivo);
    datos.append("propiedad_id", propiedadId);

    setSubiendo(true);

    try {
      const respuesta = await fetch("/api/admin/upload", {
        method: "POST",
        body: datos
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo subir");
      }

      if (archivoRef.current) {
        archivoRef.current.value = "";
      }

      setExito("Fotografia guardada correctamente");
      router.refresh();
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "Error al subir fotografia"
      );
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-5 space-y-4">
      <div>
        <label
          htmlFor="fotografia"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Seleccionar fotografia
        </label>

        <input
          ref={archivoRef}
          id="fotografia"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={subiendo}
          className="block w-full rounded-xl border border-slate-300 p-3 text-sm"
        />
      </div>

      <p className="text-xs text-slate-500">
        Formatos: JPG, PNG o WebP. Maximo 3 MB.
      </p>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {exito && (
        <p role="status" className="text-sm text-green-700">
          {exito}
        </p>
      )}

      <button
        type="submit"
        disabled={subiendo}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {subiendo ? "Subiendo..." : "Subir fotografia"}
      </button>
    </form>
  );
}
