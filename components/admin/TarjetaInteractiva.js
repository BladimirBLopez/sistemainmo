"use client";

import { useCallback, useState } from "react";
import FichaLateral from "./FichaLateral";

export default function TarjetaInteractiva({ id, titulo, children, modo = "admin", className = "", abiertaInicial = false, paramUrl = "" }) {
  const [abierta, setAbierta] = useState(abiertaInicial);

  function ponerEnUrl(valor) {
    if (!paramUrl) return;
    const url = new URL(window.location.href);
    if (valor) url.searchParams.set(paramUrl, valor);
    else url.searchParams.delete(paramUrl);
    window.history.replaceState(null, "", url);
  }

  function abrir() {
    setAbierta(true);
    ponerEnUrl(String(id));
  }

  const cerrar = useCallback(() => {
    setAbierta(false);
    if (!paramUrl) return;
    const url = new URL(window.location.href);
    url.searchParams.delete(paramUrl);
    window.history.replaceState(null, "", url);
  }, [paramUrl]);

  function teclado(evento) {
    if (evento.target !== evento.currentTarget) return;

    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      abrir();
    }
  }

  return (
    <div className="h-full">
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`Abrir ficha de ${titulo}`}
        onClick={abrir}
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
