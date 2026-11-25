"use client";

import { useState } from "react";
import { FiLogOut } from "react-icons/fi";

export default function BotonSalir() {
  const [cargando, setCargando] = useState(false);

  async function salir() {
    if (cargando) return;

    setCargando(true);

    try {
      const respuesta = await fetch("/api/agente/logout", {
        method: "POST",
        cache: "no-store"
      });

      if (!respuesta.ok) throw new Error();

      window.location.replace("/agente/login");
    } catch {
      alert("No se pudo cerrar la sesión.");
      setCargando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={salir}
      disabled={cargando}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
    >
      <FiLogOut size={17} />
      {cargando ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
