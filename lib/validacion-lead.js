import { z } from "zod";

const textoOpcional = max => z.preprocess(
  v => v === "" || v === undefined ? null : v,
  z.string().trim().max(max).nullable()
).transform(v => v || null);

const idOpcional = z.preprocess(
  v => v === "" || v == null ? null : String(v),
  z.string().regex(/^[1-9]\d{0,18}$/).nullable()
);

const numeroOpcional = z.preprocess(
  v => v === "" || v == null ? null : Number(v),
  z.number().finite().min(0).nullable()
);

const operacionOpcional = z.preprocess(
  v => v === "" || v == null ? null : v,
  z.enum(["venta", "alquiler", "anticretico"]).nullable()
);

const emailOpcional = z.preprocess(
  v => v === "" || v == null ? null : v,
  z.string().trim().email().max(180).nullable()
);

export const validarLead = z.object({
  cliente_id: idOpcional,
  propiedad_id: idOpcional,

  nombre_contacto: z.string().trim().min(2).max(150),

  telefono: z.string()
    .trim()
    .min(7)
    .max(25)
    .regex(/^\+?[0-9\s().-]{7,25}$/),

  email: emailOpcional,

  origen: z.enum([
    "portal", "web", "whatsapp", "facebook",
    "instagram", "llamada", "referido",
    "oficina", "otro"
  ]).default("otro"),

  origen_detalle: textoOpcional(120),

  estado: z.enum([
    "nuevo", "contactado", "calificado",
    "visita_programada", "negociacion",
    "ganado", "perdido", "pausado"
  ]).default("nuevo"),

  prioridad: z.enum([
    "baja", "media", "alta", "urgente"
  ]).default("media"),

  tipo_operacion: operacionOpcional,
  tipo_inmueble: textoOpcional(100),
  departamento: textoOpcional(80),
  ciudad: textoOpcional(100),
  zona: textoOpcional(120),

  presupuesto_min: numeroOpcional,
  presupuesto_max: numeroOpcional,

  moneda: z.enum(["BOB", "USD"]).default("USD"),

  mensaje: textoOpcional(3000),
  motivo_perdida: textoOpcional(1000)
}).superRefine((datos, ctx) => {
  if (
    datos.presupuesto_min !== null &&
    datos.presupuesto_max !== null &&
    datos.presupuesto_max < datos.presupuesto_min
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["presupuesto_max"],
      message: "El presupuesto máximo no puede ser menor al mínimo"
    });
  }

  if (datos.estado === "perdido" && !datos.motivo_perdida) {
    ctx.addIssue({
      code: "custom",
      path: ["motivo_perdida"],
      message: "El motivo de pérdida es obligatorio"
    });
  }
});
