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

const fechaLocalOpcional = z.union([
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/)
    .refine(v => {
      const fecha = new Date(v + ":00Z");
      return !Number.isNaN(fecha.getTime()) &&
        fecha.toISOString().slice(0, 16) === v;
    }, {
      message: "La fecha y hora local no son válidas."
    }),
  z.literal(""),
  z.null(),
  z.undefined()
]).transform(v =>
  typeof v === "string" ? v || null : null
);

export const validarContenidoMarketing = z.object({
  campana_id: campanaOpcional,

  titulo: z.string().trim().min(2).max(180),

  plataforma: z.enum([
    "facebook", "instagram", "google",
    "tiktok", "whatsapp", "portal", "otro"
  ]),

  formato: z.enum([
    "post", "historia", "reel",
    "video", "carrusel", "anuncio", "otro"
  ]).default("post"),

  texto_publicacion: opcional(10000),

  fecha_programada: fechaLocalOpcional,

  estado: z.enum([
    "idea", "pendiente", "programado",
    "publicado", "cancelado"
  ]).default("idea"),

  url_publicacion: opcional(1000),
  recurso_url: opcional(1000)

}).superRefine((datos, contexto) => {
  if (datos.estado === "programado" && !datos.fecha_programada) {
    contexto.addIssue({
      code: "custom",
      path: ["fecha_programada"],
      message: "La fecha es obligatoria para programar."
    });
  }

  for (const campo of ["url_publicacion", "recurso_url"]) {
    const valor = datos[campo];

    if (!valor) continue;

    try {
      const url = new URL(valor);

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error();
      }
    } catch {
      contexto.addIssue({
        code: "custom",
        path: [campo],
        message: "Introduce una URL HTTP o HTTPS válida."
      });
    }
  }
});
