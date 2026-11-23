"use client";

import { useState } from "react";

export default function BotonSalir() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function salir() {
    if (cargando) return;
    setCargando(true);
    setError("");

    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        cache: "no-store"
      });

      if (!res.ok) throw new Error();

      window.location.replace("/admin/login");
    } catch {
      setError("No se pudo cerrar la sesión.");
      setCargando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={salir}
        disabled={cargando}
        className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {cargando ? "Cerrando..." : "Cerrar sesión"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
