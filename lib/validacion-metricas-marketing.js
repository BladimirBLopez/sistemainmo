import { z } from "zod";

const entero = z.string()
  .trim()
  .regex(/^(0|[1-9]\d{0,9})$/)
  .transform(Number)
  .refine(
    v => Number.isSafeInteger(v) && v <= 2147483647
  );

export const validarMetricasMarketing = z.object({
  campana_id: z.string()
    .regex(/^[1-9]\d{0,17}$/),

  fecha: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(v => {
      const d = new Date(v + "T00:00:00Z");
      return !Number.isNaN(d.getTime()) &&
        d.toISOString().slice(0, 10) === v;
    }),

  plataforma: z.enum([
    "facebook", "instagram", "google",
    "tiktok", "whatsapp", "portal", "otro"
  ]),

  alcance: entero,
  impresiones: entero,
  clics: entero,
  interacciones: entero,
  mensajes: entero,
  leads_reportados: entero,
  conversiones_reportadas: entero,

  gasto_reportado: z.string()
    .trim()
    .regex(/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/),

  moneda: z.enum(["BOB", "USD"])
}).strict();
