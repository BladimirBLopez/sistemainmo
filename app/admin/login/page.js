import { FiHome, FiBarChart2, FiMapPin, FiUsers } from "react-icons/fi";
import LoginForm from "@/components/admin/LoginForm";

export const metadata = {
  title: "Acceso administrativo | Sistema Inmobiliario"
};

const puntos = [
  { Icono: FiHome, texto: "Gestiona propiedades y fotografías" },
  { Icono: FiUsers, texto: "Seguimiento de clientes y leads" },
  { Icono: FiMapPin, texto: "Ubicaciones y mapas integrados" },
  { Icono: FiBarChart2, texto: "Marketing y métricas en un solo lugar" }
];

export default function LoginPage() {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 shadow-soft">
            <FiHome size={22} />
          </span>
          <span className="font-display text-xl font-bold">Sistemainmo</span>
        </div>

        <div className="relative">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Tu negocio inmobiliario,
            <span className="text-gold-300"> en un solo panel.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {puntos.map(({ Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-brand-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Icono size={18} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-300">
          © Sistemainmo. Todos los derechos reservados.
        </p>
      </aside>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-900 text-white shadow-soft lg:hidden">
              <FiHome size={22} />
            </span>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
              Panel administrativo
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">
              Bienvenido
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Ingresa tu contraseña para acceder al panel.
            </p>
          </div>
          <div className="card">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
