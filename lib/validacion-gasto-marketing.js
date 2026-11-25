import { z } from "zod";

const opcional = maximo =>
  z.union([
    z.string().trim().max(maximo),
    z.literal(""),
    z.null(),
    z.undefined()
  ]).transform(v =>
    typeof v === "string" ? v || null : null
  );

const campanaOpcional = z.union([
  z.string().regex(/^[1-9]\d{0,17}$/),
  z.literal(""),
  z.null(),
  z.undefined()
]).transform(v =>
  typeof v === "string" ? v || null : null
);

export const validarGastoMarketing = z.object({
  campana_id: campanaOpcional,

  plataforma: z.union([
    z.enum([
      "facebook", "instagram", "google",
      "tiktok", "whatsapp", "portal", "otro"
    ]),
    z.literal(""),
    z.null(),
    z.undefined()
  ]).transform(v =>
    typeof v === "string" ? v || null : null
  ),

  fecha: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(v => {
      const fecha = new Date(v + "T00:00:00Z");
      return !Number.isNaN(fecha.getTime()) &&
        fecha.toISOString().slice(0, 10) === v;
    }),

  categoria: z.enum([
    "publicidad", "diseno", "produccion",
    "impresion", "herramientas", "otros"
  ]),

  concepto: z.string().trim().min(2).max(180),

  monto: z.string()
    .trim()
    .regex(/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/),

  moneda: z.enum(["BOB", "USD"]),

  comprobante_url: opcional(1000)

}).superRefine((datos, contexto) => {
  if (datos.comprobante_url) {
    try {
      const url = new URL(datos.comprobante_url);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error();
      }
    } catch {
      contexto.addIssue({
        code: "custom",
        path: ["comprobante_url"],
        message: "El comprobante debe tener una URL HTTP o HTTPS válida."
      });
    }
  }
});
