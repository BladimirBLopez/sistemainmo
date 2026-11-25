function normalizar(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function tieneCriteriosMatching(lead) {
  return [
    lead.tipo_operacion,
    lead.tipo_inmueble,
    lead.departamento,
    lead.ciudad,
    lead.zona,
    lead.presupuesto_min,
    lead.presupuesto_max
  ].some(v =>
    v !== null &&
    v !== undefined &&
    String(v).trim() !== ""
  );
}

export function calcularCompatibilidad(lead, propiedad) {
  let puntos = 0;
  let pesoTotal = 0;
  const razones = [];

  function comparar(valorLead, valorPropiedad, peso, nombre) {
    if (
      valorLead === null ||
      valorLead === undefined ||
      String(valorLead).trim() === ""
    ) return;

    pesoTotal += peso;

    const coincide =
      normalizar(valorLead) !== "" &&
      normalizar(valorLead) === normalizar(valorPropiedad);

    if (coincide) puntos += peso;

    razones.push(
      `${nombre}: ${coincide ? "coincide" : "no coincide"}`
    );
  }

  comparar(
    lead.tipo_operacion,
    propiedad.tipo_operacion,
    25,
    "Operación"
  );

  comparar(
    lead.tipo_inmueble,
    propiedad.tipo,
    20,
    "Tipo de inmueble"
  );

  comparar(
    lead.departamento,
    propiedad.departamento,
    10,
    "Departamento"
  );

  comparar(
    lead.ciudad,
    propiedad.ciudad,
    10,
    "Ciudad"
  );

  comparar(
    lead.zona,
    propiedad.zona,
    10,
    "Zona"
  );

  const tienePresupuesto =
    lead.presupuesto_min != null ||
    lead.presupuesto_max != null;

  if (tienePresupuesto) {
    pesoTotal += 25;

    if (normalizar(lead.moneda) !== normalizar(propiedad.moneda)) {
      razones.push(
        "Presupuesto: moneda diferente, sin conversión automática"
      );
    } else {
      const precio = Number(propiedad.precio);

      const minimo = lead.presupuesto_min == null
        ? null
        : Number(lead.presupuesto_min);

      const maximo = lead.presupuesto_max == null
        ? null
        : Number(lead.presupuesto_max);

      const coincide =
        Number.isFinite(precio) &&
        (minimo === null || precio >= minimo) &&
        (maximo === null || precio <= maximo);

      if (coincide) {
        puntos += 25;
        razones.push("Presupuesto: dentro del rango");
      } else {
        razones.push(
          "Presupuesto: fuera del rango establecido"
        );
      }
    }
  }

  return {
    compatibilidad: pesoTotal
      ? Math.round((puntos / pesoTotal) * 100)
      : null,
    criterios_evaluados: razones.length,
    razones
  };
}
