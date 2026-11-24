import { z } from "zod";

const entero = z.union([
  z.string().regex(/^(0|[1-9]\d{0,3})$/),
  z.literal(""),
  z.null(),
  z.undefined()
]).transform(v => v == null || v === "" ? null : Number(v));

const superficie = z.union([
  z.string().regex(/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/),
  z.literal(""),
  z.null(),
  z.undefined()
]).transform(v => v == null || v === "" ? null : v);

export const validarPropiedad = z.object({
  tipo_operacion: z.enum(["venta", "alquiler"]),
  moneda: z.enum(["BOB", "USD"]),
  precio: z.string()
    .regex(/^\d{1,12}(\.\d{1,2})?$/)
    .refine(v => Number(v) > 0),
  dormitorios: entero,
  banos: entero,
  parqueos: entero,
  superficie_terreno_m2: superficie,
  superficie_construida_m2: superficie
});
