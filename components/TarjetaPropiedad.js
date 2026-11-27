import Image from "next/image";
import { FiHome, FiMapPin } from "react-icons/fi";
import EstadoBadge from "@/components/EstadoBadge";

const ETIQUETA_OPERACION = {
  venta: "Venta",
  alquiler: "Alquiler",
  anticretico: "Anticrético"
};

const COLOR_OPERACION = {
  venta: "bg-brand-700 text-white",
  alquiler: "bg-gold-600 text-white",
  anticretico: "bg-slate-800 text-white"
};

export default function TarjetaPropiedad({ propiedad }) {
  const ubicacion = [propiedad.zona, propiedad.ciudad].filter(Boolean).join(", ");
  const precio =
    propiedad.precio != null && propiedad.moneda
      ? `${propiedad.moneda === "BOB" ? "Bs" : "USD"} ${Number(propiedad.precio).toLocaleString("es-BO", { maximumFractionDigits: 2 })}`
      : "Precio no registrado";

  return (
    <article className="group h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {propiedad.portada_url ? (
          <Image
            src={propiedad.portada_url}
            alt={`Portada de ${propiedad.titulo}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
            <FiHome size={38} />
            <span className="text-xs text-slate-400">Sin fotografía</span>
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-soft ${
            COLOR_OPERACION[propiedad.tipo_operacion] || "bg-slate-700 text-white"
          }`}
        >
          {ETIQUETA_OPERACION[propiedad.tipo_operacion] || "Sin operación"}
        </span>
        {propiedad.estado_publicacion && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium capitalize text-slate-700 shadow-soft backdrop-blur">
            {propiedad.estado_publicacion}
          </span>
        )}
      </div>

      <div className="p-5">
        <p className="font-display text-xl font-bold text-gold-700">{precio}</p>
        <h4 className="mt-1 line-clamp-2 font-semibold text-slate-900">
          {propiedad.titulo}
        </h4>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
          <FiMapPin className="shrink-0" />
          <span className="truncate">{ubicacion || "Ubicación no registrada"}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <span className="badge-brand capitalize">{propiedad.tipo}</span>
          <EstadoBadge estado={propiedad.estado_comercial} />
        </div>
      </div>
    </article>
  );
}
