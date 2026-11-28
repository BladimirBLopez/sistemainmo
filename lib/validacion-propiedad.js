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

const textoOpcional = (maximo) =>
  z.union([
    z.string().max(maximo),
    z.null(),
    z.undefined()
  ]).transform(v =>
    typeof v === "string" ? v.trim() || null : null
  );

const coordenada = (minimo, maximo) =>
  z.union([
    z.string().regex(/^-?\d{1,3}(\.\d{1,10})?$/),
    z.literal(""),
    z.null(),
    z.undefined()
  ])
  .transform(v =>
    v == null || v === "" ? null : Number(v)
  )
  .refine(v =>
    v === null ||
    (Number.isFinite(v) && v >= minimo && v <= maximo)
  );

const proyectoOpcional = z.union([
  z.string().regex(/^[1-9]\d{0,17}$/),
  z.literal(""),
  z.null(),
  z.undefined()
]).transform(v => typeof v === "string" ? v || null : null);

export const validarPropiedad = z.object({
  tipo_operacion: z.enum(["venta", "alquiler", "anticretico"]),
  moneda: z.enum(["BOB", "USD"]),
  precio: z.string()
    .regex(/^\d{1,12}(\.\d{1,2})?$/)
    .refine(v => Number(v) > 0),
  dormitorios: entero,
  banos: entero,
  parqueos: entero,
  superficie_terreno_m2: superficie,
  superficie_construida_m2: superficie,
  geo_place_id: textoOpcional(200),
  latitud: coordenada(-90, 90),
  longitud: coordenada(-180, 180),
  proyecto_id: proyectoOpcional
});

export const validarEdicionPropiedad = z.object({
  titulo: z.string().trim().min(1).max(150),
  tipo: z.enum([
    "Casa", "Departamento", "Terreno",
    "Local comercial", "Oficina", "Galpon",
    "Quinta", "Otro"
  ]),
  descripcion: textoOpcional(4000),
  departamento: textoOpcional(80),
  ciudad: textoOpcional(100),
  zona: textoOpcional(120),
  direccion_privada: textoOpcional(300),

  estado_publicacion: z.enum([
    "borrador", "pendiente", "publicada", "oculta"
  ]),

  estado_comercial: z.enum([
    "disponible", "reservada", "vendida",
    "alquilada", "retirada"
  ]),

  ...validarPropiedad.shape
});
