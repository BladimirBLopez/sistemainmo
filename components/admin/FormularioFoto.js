"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AvisoCambios from "@/components/AvisoCambios";
import { toast } from "sonner";

export default function FormularioFoto({ propiedadId, alActualizar, modo = "admin" }) {
  const router = useRouter();
  const archivoRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function enviar(evento) {
    evento.preventDefault();
    if (subiendo) return;
    const formulario = evento.currentTarget;

    setError("");

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
      const respuesta = await fetch(modo === "agente" ? "/api/agente/upload" : "/api/admin/upload", {
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

      formulario.dispatchEvent(new Event("guardado"));
      toast.success("Fotografia guardada");
      router.refresh();
      alActualizar?.();
    } catch (fallo) {
      toast.error(
        fallo instanceof Error
          ? fallo.message
          : "Error al subir fotografia"
      );
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
      <AvisoCambios />
      <div>
        <label
          htmlFor="fotografia"
          className="label"
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
          className="input"
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

      <button
        type="submit"
        disabled={subiendo}
        className="btn-primary px-5 py-3"
      >
        {subiendo ? "Subiendo..." : "Subir fotografia"}
      </button>
    </form>
  );
}
