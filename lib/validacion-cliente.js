import { z } from "zod";

const opcional = maximo =>
  z.union([
    z.string().trim().max(maximo),
    z.null(),
    z.undefined()
  ]).transform(v => typeof v === "string" ? v || null : null);

export const validarCliente = z.object({
  nombre_completo: z.string().trim().min(2).max(150),

  telefono: z.string()
    .trim()
    .min(7)
    .max(25)
    .regex(/^\+?[0-9\s().-]{7,25}$/),

  telefono_secundario: opcional(25),

  email: z.union([
    z.string().trim().email().max(180),
    z.literal(""),
    z.null(),
    z.undefined()
  ]).transform(v => typeof v === "string" ? v || null : null),

  tipo_documento: opcional(30),
  numero_documento: opcional(40),

  roles: z.array(z.enum([
    "propietario",
    "comprador",
    "arrendatario",
    "buscador",
    "vendedor",
    "otro"
  ])).min(1).max(6),

  departamento: opcional(80),
  ciudad: opcional(100),
  zona: opcional(120),
  direccion: opcional(250),
  notas: opcional(3000),

  estado: z.enum(["activo", "inactivo"]).default("activo")
});
