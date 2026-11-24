import LoginForm from "@/components/agente/LoginForm";

export const metadata = {
  title: "Acceso de agentes | Sistema Inmobiliario"
};

export default function LoginAgentePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
            SI
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Sistema Inmobiliario
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Acceso al panel de agentes
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
