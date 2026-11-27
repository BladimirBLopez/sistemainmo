"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid, FiHome, FiUsers, FiUserCheck,
  FiTarget, FiCalendar, FiFileText, FiCreditCard,
  FiBarChart2
} from "react-icons/fi";

const modulos = [
  { nombre: "Propiedades", Icono: FiHome, href: "/admin/propiedades" },
  { nombre: "Clientes", Icono: FiUsers, href: "/admin/clientes" },
  { nombre: "Agentes", Icono: FiUserCheck, href: "/admin/agentes" },
  { nombre: "Leads", Icono: FiTarget, href: "/admin/leads" },
  { nombre: "Visitas", Icono: FiCalendar, href: "/admin/visitas" },
  { nombre: "Contratos", Icono: FiFileText },
  { nombre: "Pagos", Icono: FiCreditCard }
];

const base =
  "group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition";
const activo =
  "bg-white/10 font-semibold text-white shadow-[inset_3px_0_0_0_#c8923a]";
const inactivo = "text-brand-100/80 hover:bg-white/5 hover:text-white";

function Titulo({ children }) {
  return (
    <p className="px-4 pb-1 pt-6 text-[11px] font-semibold uppercase tracking-widest text-brand-300/70">
      {children}
    </p>
  );
}

export default function MenuAdmin() {
  const ruta = usePathname();

  const esActivo = (href) => ruta === href || ruta.startsWith(`${href}/`);

  return (
    <nav className="space-y-1" aria-label="Menu administrativo">
      <Link
        href="/admin"
        aria-current={ruta === "/admin" ? "page" : undefined}
        className={`${base} ${ruta === "/admin" ? activo : inactivo}`}
      >
        <FiGrid size={18} /> Dashboard
      </Link>

      <Titulo>Gestion inmobiliaria</Titulo>

      {modulos.map(({ nombre, Icono, href }) =>
        href ? (
          <Link
            key={nombre}
            href={href}
            aria-current={esActivo(href) ? "page" : undefined}
            className={`${base} ${esActivo(href) ? activo : inactivo}`}
          >
            <Icono size={18} />
            <span>{nombre}</span>
          </Link>
        ) : (
          <div
            key={nombre}
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-brand-100/40"
          >
            <Icono size={18} />
            <span className="flex-1">{nombre}</span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-brand-200/60">
              Pronto
            </span>
          </div>
        )
      )}

      <Titulo>Marketing y crecimiento</Titulo>

      <Link
        href="/admin/marketing"
        aria-current={esActivo("/admin/marketing") ? "page" : undefined}
        className={`${base} ${esActivo("/admin/marketing") ? activo : inactivo}`}
      >
        <FiBarChart2 size={18} />
        <span>Marketing</span>
      </Link>
    </nav>
  );
}
