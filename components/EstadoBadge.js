const ESTILOS = {
  disponible: "badge-ok",
  reservado: "badge-warn",
  reservada: "badge-warn",
  "en negociacion": "badge-warn",
  vendido: "badge-bad",
  vendida: "badge-bad",
  alquilado: "badge-bad",
  alquilada: "badge-bad",
  retirada: "badge bg-slate-100 text-slate-600",
  anticretado: "badge-bad"
};

function normalizar(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function EstadoBadge({ estado }) {
  const texto = String(estado || "").trim();
  if (!texto) {
    return <span className="badge bg-slate-100 text-slate-600">Sin estado</span>;
  }
  const clase = ESTILOS[normalizar(texto)] || "badge-brand";
  return <span className={`${clase} capitalize`}>{texto}</span>;
}
