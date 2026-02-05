export function obtenerPorcentajeComisionDefault( tipoUnidad: string | undefined): number {
    if (!tipoUnidad) return 0;

    const tipo = tipoUnidad.toUpperCase();

    if (tipo.includes('TRACTOCAMION') || tipo.includes('TRAILER')) {
      return 18;
    } else if (tipo.includes('MUDANCERO') || tipo.includes('MUDANZA')) {
      return 20;
    } else if (tipo.includes('CAMIONETA')) {
      return 0;
    }
    return 0;

}