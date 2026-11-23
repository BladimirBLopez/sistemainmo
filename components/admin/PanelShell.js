"use client";

import { useState } from "react";
import { FiMenu, FiX, FiBell } from "react-icons/fi";
import MenuAdmin from "./MenuAdmin";
import BotonSalir from "./BotonSalir";

export default function PanelShell({ children }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {abierto && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        id="menu-admin"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 p-5 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">Sistema Inmobiliario</h2>
          <button
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
            className="lg:hidden"
          >
            <FiX size={24} />
          </button>
        </div>

        <MenuAdmin />

        <div className="mt-auto border-t border-slate-700 pt-5">
          <BotonSalir />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              aria-label="Abrir menú"
              aria-expanded={abierto}
              aria-controls="menu-admin"
              onClick={() => setAbierto(true)}
              className="lg:hidden"
            >
              <FiMenu size={24} />
            </button>
            <h1 className="font-bold text-slate-800">
              Panel Administrativo
            </h1>
          </div>
          <FiBell size={21} className="text-slate-500" />
        </header>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
