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

export const validarCanal = z.object({
  plataforma: z.enum([
    "facebook", "instagram", "google",
    "tiktok", "whatsapp", "portal", "otro"
  ]),

  id_externo: opcional(200),
  url_externa: opcional(1000),

  estado: z.enum([
    "activo", "pausado", "finalizado"
  ]).default("activo")

}).superRefine((datos, contexto) => {
  if (datos.url_externa) {
    try {
      const url = new URL(datos.url_externa);

      if (!["https:", "http:"].includes(url.protocol)) {
        throw new Error();
      }
    } catch {
      contexto.addIssue({
        code: "custom",
        path: ["url_externa"],
        message: "Introduce una URL HTTP o HTTPS válida."
      });
    }
  }
});
