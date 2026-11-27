"use client";

import { useState } from "react";
import { FiLogOut } from "react-icons/fi";

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
        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-brand-100/80 transition hover:bg-red-500/15 hover:text-red-200 disabled:opacity-50"
      >
        <FiLogOut size={18} />
        {cargando ? "Cerrando..." : "Cerrar sesión"}
      </button>
      {error && (
        <p role="alert" className="mt-2 px-4 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
