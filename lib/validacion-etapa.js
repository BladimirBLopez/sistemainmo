import { z } from "zod";

const fechaOpcional = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
    const f = new Date(v + "T00:00:00Z");
    return !Number.isNaN(f.getTime()) && f.toISOString().slice(0, 10) === v;
  }, { message: "La fecha no es válida." }),
  z.literal(""), z.null(), z.undefined()
]).transform(v => typeof v === "string" ? v || null : null);

export const validarEtapa = z.object({
  nombre: z.string().trim().min(3).max(160),
  orden: z.union([z.string(), z.number(), z.undefined()])
    .transform(v => (v === undefined || v === "" ? 0 : Number(v)))
    .refine(v => Number.isInteger(v) && v >= 0 && v <= 9999),
  estado: z.enum(["pendiente", "en_curso", "terminada"]).default("pendiente"),
  avance_porcentaje: z.union([z.string(), z.number(), z.undefined()])
    .transform(v => (v === undefined || v === "" ? 0 : Number(v)))
    .refine(v => Number.isInteger(v) && v >= 0 && v <= 100),
  fecha_inicio: fechaOpcional,
  fecha_fin: fechaOpcional
}).transform(d => ({
  ...d,
  avance_porcentaje:
    d.estado === "terminada" ? 100 : d.estado === "pendiente" ? 0 : d.avance_porcentaje
})).superRefine((d, ctx) => {
  if (d.fecha_inicio && d.fecha_fin && d.fecha_fin < d.fecha_inicio) {
    ctx.addIssue({ code: "custom", path: ["fecha_fin"],
      message: "La fecha final no puede ser anterior a la inicial." });
  }
});
