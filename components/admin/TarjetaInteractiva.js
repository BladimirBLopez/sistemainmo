"use client";

import { useCallback, useState } from "react";
import FichaLateral from "./FichaLateral";

export default function TarjetaInteractiva({ id, titulo, children, modo = "admin", className = "" }) {
  const [abierta, setAbierta] = useState(false);
  const cerrar = useCallback(() => setAbierta(false), []);

  function teclado(evento) {
    if (evento.target !== evento.currentTarget) return;

    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      setAbierta(true);
    }
  }

  return (
    <div className="h-full">
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`Abrir ficha de ${titulo}`}
        onClick={() => setAbierta(true)}
        onKeyDown={teclado}
        className={`cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${className || "rounded-xl transition-shadow hover:shadow-md"}`}
      >
        {children}
      </div>

      {abierta && (
        <FichaLateral id={id} alCerrar={cerrar} modo={modo} />
      )}
    </div>
  );
}
