"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FiMenu, FiX, FiBell, FiHome } from "react-icons/fi";
import MenuAdmin from "./MenuAdmin";
import BotonSalir from "./BotonSalir";

const TITULOS = {
  propiedades: "Propiedades",
  clientes: "Clientes",
  leads: "Leads",
  agentes: "Agentes",
  marketing: "Marketing",
  visitas: "Visitas"
};

function tituloDe(pathname) {
  const seccion = (pathname || "").split("/")[2];
  return TITULOS[seccion] || "Resumen general";
}

export default function PanelShell({ children }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = e => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {abierto && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-brand-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        id="menu-admin"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-brand-950 p-5 text-white shadow-lift transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-white shadow-soft">
              <FiHome size={20} />
            </span>
            <div className="leading-tight">
              <h2 className="font-display text-base font-bold">Sistemainmo</h2>
              <p className="text-xs text-brand-300">Gestión inmobiliaria</p>
            </div>
          </div>
          <button
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
            className="rounded-lg p-1 text-brand-200 hover:bg-white/10 lg:hidden"
          >
            <FiX size={22} />
          </button>
        </div>

        <MenuAdmin />

        <div className="mt-auto border-t border-white/10 pt-5">
          <BotonSalir />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 py-3.5 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              aria-label="Abrir menú"
              aria-expanded={abierto}
              aria-controls="menu-admin"
              onClick={() => setAbierto(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <FiMenu size={22} />
            </button>
            <div className="leading-tight">
              <p className="text-xs font-medium uppercase tracking-wider text-gold-600">
                Panel administrativo
              </p>
              <h1 className="font-display text-lg font-bold text-slate-900">
                {tituloDe(pathname)}
              </h1>
            </div>
          </div>

          <button
            aria-label="Notificaciones"
            className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-brand-700"
          >
            <FiBell size={19} />
          </button>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
