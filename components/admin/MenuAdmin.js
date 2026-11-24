"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid, FiHome, FiUsers, FiUserCheck,
  FiTarget, FiCalendar, FiFileText, FiCreditCard
} from "react-icons/fi";

const modulos = [
  { nombre: "Propiedades", Icono: FiHome, href: "/admin/propiedades" },
  { nombre: "Clientes", Icono: FiUsers, href: "/admin/clientes" },
  { nombre: "Agentes", Icono: FiUserCheck, href: "/admin/agentes" },
  { nombre: "Leads", Icono: FiTarget },
  { nombre: "Visitas", Icono: FiCalendar },
  { nombre: "Contratos", Icono: FiFileText },
  { nombre: "Pagos", Icono: FiCreditCard }
];

export default function MenuAdmin() {
  const ruta = usePathname();

  return (
    <nav className="space-y-2" aria-label="Menu administrativo">
      <Link
        href="/admin"
        className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium ${
          ruta === "/admin"
            ? "bg-blue-600 text-white"
            : "text-slate-300 hover:bg-slate-800"
        }`}
      >
        <FiGrid /> Dashboard
      </Link>

      <p className="px-4 pt-5 text-xs font-semibold uppercase text-slate-400">
        Gestion inmobiliaria
      </p>

      {modulos.map(({ nombre, Icono, href }) =>
        href ? (
          <Link
            key={nombre}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
              ruta.startsWith(href)
                ? "bg-blue-600 font-medium text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Icono />
            <span>{nombre}</span>
          </Link>
        ) : (
          <div
            key={nombre}
            aria-disabled="true"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300"
          >
            <Icono />
            <span className="flex-1">{nombre}</span>
            <span className="text-xs text-slate-500">Pronto</span>
          </div>
        )
      )}
    </nav>
  );
}
