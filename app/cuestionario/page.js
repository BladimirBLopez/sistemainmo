import FormularioCuestionario from "./FormularioCuestionario";

export const metadata = {
  title: "Cuestionario | Bolivia Market",
  robots: { index: false, follow: false }
};

export default function PaginaCuestionario() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">
        Cuestionario Bolivia Market
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Responde con calma. Al final se abrirá WhatsApp con tus respuestas
        listas para enviar.
      </p>
      <FormularioCuestionario />
    </main>
  );
}
