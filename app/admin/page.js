import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import PanelShell from "@/components/admin/PanelShell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
    redirect("/admin/login");
  }

  return (
    <PanelShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Resumen general
          </h2>
          <p className="mt-2 text-slate-500">
            Bienvenido al sistema de gestion inmobiliaria.
          </p>
        </section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {["Propiedades", "Clientes", "Visitas", "Contratos"].map(nombre => (
            <article key={nombre} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{nombre}</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">—</p>
              <p className="mt-2 text-xs text-slate-400">Pendiente de datos</p>
            </article>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}
