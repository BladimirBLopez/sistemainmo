import { z } from "zod";

const opcional = maximo =>
  z.union([z.string().trim().max(maximo), z.literal(""), z.null(), z.undefined()])
    .transform(v => typeof v === "string" ? v || null : null);

const fechaOpcional = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
    const f = new Date(v + "T00:00:00Z");
    return !Number.isNaN(f.getTime()) && f.toISOString().slice(0, 10) === v;
  }, { message: "La fecha no es válida." }),
  z.literal(""), z.null(), z.undefined()
]).transform(v => typeof v === "string" ? v || null : null);

export const validarProyecto = z.object({
  nombre: z.string().trim().min(3).max(160),
  descripcion: opcional(4000),
  tipo: z.enum(["residencial", "comercial", "lotizacion", "otro"]).default("residencial"),
  departamento: opcional(80),
  ciudad: opcional(100),
  zona: opcional(120),
  direccion: opcional(250),
  estado: z.enum(["planificacion", "en_obra", "pausado", "terminado", "cancelado"]).default("planificacion"),
  avance_porcentaje: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .refine(v => Number.isInteger(v) && v >= 0 && v <= 100),
  presupuesto: z.string().trim().regex(/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/),
  moneda: z.enum(["BOB", "USD"]).default("BOB"),
  fecha_inicio: fechaOpcional,
  fecha_fin_estimada: fechaOpcional,
  fecha_fin_real: fechaOpcional
}).superRefine((d, ctx) => {
  if (d.fecha_inicio && d.fecha_fin_estimada && d.fecha_fin_estimada < d.fecha_inicio) {
    ctx.addIssue({ code: "custom", path: ["fecha_fin_estimada"],
      message: "La fecha final no puede ser anterior a la inicial." });
  }
});
