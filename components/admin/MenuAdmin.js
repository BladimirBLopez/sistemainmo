import Link from "next/link";
import {
  FiGrid, FiHome, FiUsers, FiTarget,
  FiCalendar, FiFileText, FiCreditCard
} from "react-icons/fi";

const modulos = [
  { nombre: "Propiedades", Icono: FiHome },
  { nombre: "Clientes", Icono: FiUsers },
  { nombre: "Leads", Icono: FiTarget },
  { nombre: "Visitas", Icono: FiCalendar },
  { nombre: "Contratos", Icono: FiFileText },
  { nombre: "Pagos", Icono: FiCreditCard }
];

export default function MenuAdmin() {
  return (
    <nav className="space-y-2" aria-label="Menu administrativo">
      <Link
        href="/admin"
        className="flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white"
      >
        <FiGrid /> Dashboard
      </Link>

      <p className="px-4 pt-5 text-xs font-semibold uppercase text-slate-400">
        Gestion inmobiliaria
      </p>

      {modulos.map(({ nombre, Icono }) => (
        <div
          key={nombre}
          aria-disabled="true"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300"
        >
          <Icono />
          <span className="flex-1">{nombre}</span>
          <span className="text-xs text-slate-500">Pronto</span>
        </div>
      ))}
    </nav>
  );
}
