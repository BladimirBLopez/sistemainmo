"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiHome,
  FiUsers,
  FiTarget,
  FiCalendar,
  FiMenu,
  FiX,
  FiBriefcase
} from "react-icons/fi";
import BotonSalir from "./BotonSalir";

const enlaces = [
  { nombre: "Dashboard", href: "/agente", Icono: FiGrid },
  { nombre: "Mis propiedades", href: "/agente/propiedades", Icono: FiHome },
  { nombre: "Mis clientes", href: "/agente/clientes", Icono: FiUsers },
  { nombre: "Mis prospectos", href: "/agente/leads", Icono: FiTarget },
  { nombre: "Agenda comercial", href: "/agente/visitas", Icono: FiCalendar }
];

export default function PanelShellAgente({ children }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    setAbierto(false);
  }, [ruta]);

  if (ruta === "/agente/login") return children;

  const actual = enlaces.find(e =>
    e.href === "/agente"
      ? ruta === e.href
      : ruta === e.href || ruta.startsWith(`${e.href}/`)
  );

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">

      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 px-4 py-5 text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
            <FiHome size={23} />
          </div>

          <div>
            <p className="text-sm font-extrabold tracking-widest">
              SISTEMAINMO
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Gestión inmobiliaria
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            <FiX size={21} />
          </button>
        </div>

        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          Espacio de trabajo
        </p>

        <nav className="space-y-1" aria-label="Navegación del agente">

          {enlaces.map(({ nombre, href, Icono }) => {
            const activo = href === "/agente"
              ? ruta === href
              : ruta === href || ruta.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? "page" : undefined}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  activo
                    ? "bg-blue-600 font-semibold text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icono size={19} />
                <span>{nombre}</span>
              </Link>
            );
          })}

        </nav>

        <div className="mt-auto border-t border-slate-800 pt-5">

          <div className="mb-4 rounded-xl bg-slate-900 p-3">
            <p className="text-sm font-semibold text-white">
              Espacio del agente
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Acceso a tus registros asignados
            </p>
          </div>

          <BotonSalir />

        </div>
      </aside>

      <div className="min-w-0 flex-1">

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur md:px-6">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => setAbierto(true)}
              aria-label="Abrir menú"
              aria-expanded={abierto}
              className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              <FiMenu size={23} />
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                SISTEMAINMO / AGENTE
              </p>
              <h1 className="text-sm font-bold text-slate-900 md:text-base">
                {actual?.nombre || "Panel comercial"}
              </h1>
            </div>

          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-medium text-slate-500 sm:block">
              Área comercial
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <FiBriefcase size={18} />
            </div>
          </div>

        </header>

        {children}

      </div>
    </div>
  );
}
