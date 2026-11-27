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

  useEffect(() => {
    const onKey = e => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (ruta === "/agente/login") return children;

  const esActivo = href =>
    href === "/agente"
      ? ruta === href
      : ruta === href || ruta.startsWith(`${href}/`);

  const actual = enlaces.find(e => esActivo(e.href));

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-brand-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col overflow-y-auto bg-brand-950 px-4 py-5 text-white shadow-lift transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 shadow-soft">
            <FiHome size={20} />
          </span>
          <div className="leading-tight">
            <p className="font-display text-base font-bold">Sistemainmo</p>
            <p className="text-xs text-brand-300">Espacio del agente</p>
          </div>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="ml-auto rounded-lg p-1.5 text-brand-200 hover:bg-white/10 lg:hidden"
          >
            <FiX size={22} />
          </button>
        </div>

        <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-widest text-brand-300/70">
          Espacio de trabajo
        </p>

        <nav className="space-y-1" aria-label="Navegación del agente">
          {enlaces.map(({ nombre, href, Icono }) => {
            const activo = esActivo(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? "page" : undefined}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
                  activo
                    ? "bg-white/10 font-semibold text-white shadow-[inset_3px_0_0_0_#c8923a]"
                    : "text-brand-100/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icono size={18} />
                <span>{nombre}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="mb-3 rounded-xl bg-white/5 p-3">
            <p className="text-sm font-semibold text-white">
              Espacio del agente
            </p>
            <p className="mt-1 text-xs text-brand-300">
              Acceso a tus registros asignados
            </p>
          </div>
          <BotonSalir />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAbierto(true)}
              aria-label="Abrir menú"
              aria-expanded={abierto}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <FiMenu size={22} />
            </button>
            <div className="leading-tight">
              <p className="text-xs font-medium uppercase tracking-wider text-gold-600">
                Panel del agente
              </p>
              <h1 className="font-display text-lg font-bold text-slate-900">
                {actual?.nombre || "Panel comercial"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-medium text-slate-500 sm:block">
              Área comercial
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <FiBriefcase size={18} />
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
