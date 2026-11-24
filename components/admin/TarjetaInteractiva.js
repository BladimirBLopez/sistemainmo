"use client";

import { useCallback, useState } from "react";
import FichaLateral from "./FichaLateral";

export default function TarjetaInteractiva({ id, titulo, children }) {
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
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`Abrir ficha de ${titulo}`}
        onClick={() => setAbierta(true)}
        onKeyDown={teclado}
        className="cursor-pointer rounded-xl outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        {children}
      </div>

      {abierta && (
        <FichaLateral id={id} alCerrar={cerrar} />
      )}
    </div>
  );
}
