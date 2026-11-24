"use client";

import { useState } from "react";

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
      className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
    >
      {cargando ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
