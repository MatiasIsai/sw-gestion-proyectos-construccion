const { ProjectType, ProjectStatus, UnitType } = require('@prisma/client');
const { HttpError, str, num, int, oneOf, bool } = require('../../utils/http');

function parseDetail(type, raw) {
  const d = raw || {};

  if (type === 'CASA') {
    return {
      floors: int(d.floors, 'número de pisos', { min: 1 }),
      bedrooms: int(d.bedrooms, 'número de habitaciones', { min: 0 }),
      bathrooms: int(d.bathrooms, 'número de baños', { min: 0 }),
      builtArea: num(d.builtArea, 'área construida', { positive: true }),
    };
  }

  if (type === 'EDIFICIO') {
    return {
      floors: int(d.floors, 'número de pisos', { min: 1 }),
      apartments: int(d.apartments, 'número de apartamentos', { min: 0 }),
      commercialUnits: int(d.commercialUnits, 'número de locales comerciales', { min: 0 }),
      commonArea: num(d.commonArea, 'áreas comunes', { min: 0 }),
      builtArea: num(d.builtArea, 'área construida', { positive: true }),
    };
  }

  return {
    hasWater: bool(d.hasWater, 'agua potable'),
    hasSewage: bool(d.hasSewage, 'alcantarillado'),
    hasElectricity: bool(d.hasElectricity, 'energía eléctrica'),
    otherServices: str(d.otherServices, 'otros servicios'),
  };
}

function parseUnits(raw) {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new HttpError(400, 'unidades proyectadas debe ser una lista');

  const seen = new Set();
  return raw.map((item) => {
    const unitType = oneOf(item?.unitType, 'tipo de unidad', Object.values(UnitType));
    if (seen.has(unitType)) throw new HttpError(400, `Tipo de unidad repetido: ${unitType}`);
    seen.add(unitType);
    return { unitType, quantity: int(item.quantity, 'cantidad de unidades', { min: 0 }) };
  });
}

function parseProject(body, defaultManagerId) {
  const type = oneOf(body.type, 'tipo de inmueble', Object.values(ProjectType));

  return {
    type,
    data: {
      name: str(body.name, 'nombre del proyecto', { required: true }),
      location: str(body.location, 'ubicación', { required: true }),
      description: str(body.description, 'descripción general', { max: 2000 }),
      type,
      status: oneOf(body.status, 'estado del proyecto', Object.values(ProjectStatus), { required: false }),
      lotArea: num(body.lotArea, 'área del lote', { positive: true }),
      managerId: str(body.managerId, 'responsable') || defaultManagerId,
    },
    detail: parseDetail(type, body.detail),
    units: parseUnits(body.projectedUnits),
  };
}

module.exports = { parseProject };
