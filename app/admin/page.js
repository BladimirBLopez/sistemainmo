import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import BotonSalir from "@/components/admin/BotonSalir";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Panel Administrativo
            </h1>
            <p className="text-sm text-slate-500">
              Sistema Inmobiliario
            </p>
          </div>
          <BotonSalir />
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Bienvenido al sistema
          </h2>
          <p className="mt-2 text-slate-600">
            Gestiona propiedades, clientes, visitas y contratos.
          </p>
        </section>
      </div>
    </main>
  );
}
