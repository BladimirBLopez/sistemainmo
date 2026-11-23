import { cloudinary } from "@/lib/cloudinary";

export async function subirImagen(file) {
  if (!file || typeof file.arrayBuffer !== "function"
      || file.size < 1 || file.size > 3 * 1024 * 1024) {
    throw new Error("Imagen invalida o mayor a 3 MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const tipo = file.type;

  const jpg = buffer.subarray(0, 3).toString("hex") === "ffd8ff";
  const png = buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  const webp = buffer.toString("ascii", 0, 4) === "RIFF"
    && buffer.toString("ascii", 8, 12) === "WEBP";

  if (!((jpg && tipo === "image/jpeg") ||
        (png && tipo === "image/png") ||
        (webp && tipo === "image/webp"))) {
    throw new Error("Formato de imagen no permitido");
  }

  const resultado = await cloudinary.uploader.upload(
    `data:${tipo};base64,${buffer.toString("base64")}`,
    {
      folder: "sistemainmo/propiedades",
      resource_type: "image",
      allowed_formats: ["jpg", "png", "webp"]
    }
  );

  return {
    secure_url: resultado.secure_url,
    public_id: resultado.public_id
  };
}
