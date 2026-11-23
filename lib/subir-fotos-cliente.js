export async function subirFotosPropiedad(propiedadId, archivos) {
  const pendientes = [];
  let exitos = 0;

  const lista = Array.from(archivos);

  for (let indice = 0; indice < lista.length; indice++) {
    const archivo = lista[indice];

    try {
      const datos = new FormData();

      datos.append("imagen", archivo);
      datos.append("propiedad_id", String(propiedadId));

      const respuesta = await fetch("/api/admin/upload", {
        method: "POST",
        body: datos
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok || resultado.ok !== true) {
        throw new Error("Error al subir fotografia");
      }

      exitos++;
    } catch {
      pendientes.push(...lista.slice(indice));
      break;
    }
  }

  return { exitos, pendientes };
}
