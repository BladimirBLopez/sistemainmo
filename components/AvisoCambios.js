"use client";

import { useEffect, useRef } from "react";

const MENSAJE = "Tienes cambios sin guardar. ¿Salir sin guardar?";

export default function AvisoCambios() {
  const marca = useRef(null);

  useEffect(() => {
    const formulario = marca.current?.closest("form");
    if (!formulario) return;

    let sucio = false;
    const marcar = () => { sucio = true; };
    const limpiar = () => { sucio = false; };

    function antesDeSalir(evento) {
      if (!sucio) return;
      evento.preventDefault();
      evento.returnValue = "";
    }

    function alHacerClic(evento) {
      if (!sucio) return;
      const enlace = evento.target.closest?.("a[href]");
      if (!enlace || enlace.target === "_blank") return;
      if (!window.confirm(MENSAJE)) {
        evento.preventDefault();
        evento.stopPropagation();
      }
    }

    formulario.addEventListener("input", marcar);
    formulario.addEventListener("change", marcar);
    formulario.addEventListener("guardado", limpiar);
    window.addEventListener("beforeunload", antesDeSalir);
    document.addEventListener("click", alHacerClic, true);

    return () => {
      formulario.removeEventListener("input", marcar);
      formulario.removeEventListener("change", marcar);
      formulario.removeEventListener("guardado", limpiar);
      window.removeEventListener("beforeunload", antesDeSalir);
      document.removeEventListener("click", alHacerClic, true);
    };
  }, []);

  return <span ref={marca} hidden />;
}
