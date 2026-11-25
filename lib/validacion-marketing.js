import { z } from "zod";

const opcional = maximo =>
  z.union([
    z.string().trim().max(maximo),
    z.null(),
    z.undefined()
  ]).transform(v =>
    typeof v === "string" ? v || null : null
  );

const fechaCalendario = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(v => {
    const fecha = new Date(v + "T00:00:00Z");
    return !Number.isNaN(fecha.getTime()) &&
      fecha.toISOString().slice(0, 10) === v;
  }, {
    message: "La fecha no es válida."
  });

const fechaOpcional = z.union([
  fechaCalendario,
  z.literal(""),
  z.null(),
  z.undefined()
]).transform(v =>
  typeof v === "string" ? v || null : null
);

export const validarCampana = z.object({
  nombre: z.string().trim().min(3).max(160),
  descripcion: opcional(4000),

  objetivo: z.enum([
    "captacion", "trafico", "reconocimiento",
    "interaccion", "ventas", "otro"
  ]).default("captacion"),

  tipo: z.enum([
    "paga", "organica", "mixta"
  ]).default("paga"),

  estado: z.enum([
    "borrador", "programada", "activa",
    "pausada", "finalizada", "cancelada"
  ]).default("borrador"),

  presupuesto: z.string()
    .trim()
    .regex(/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/),

  moneda: z.enum(["BOB", "USD"]).default("BOB"),

  fecha_inicio: fechaOpcional,
  fecha_fin: fechaOpcional

}).superRefine((datos, contexto) => {
  if (
    datos.fecha_inicio &&
    datos.fecha_fin &&
    datos.fecha_fin < datos.fecha_inicio
  ) {
    contexto.addIssue({
      code: "custom",
      path: ["fecha_fin"],
      message: "La fecha final no puede ser anterior a la inicial."
    });
  }
});
