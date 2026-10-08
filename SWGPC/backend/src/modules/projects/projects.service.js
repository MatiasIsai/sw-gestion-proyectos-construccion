const prisma = require('../../config/database');
const { HttpError } = require('../../utils/http');

const fullInclude = {
  manager: { select: { id: true, fullName: true } },
  houseDetail: true,
  buildingDetail: true,
  lotDetail: true,
  projectedUnits: true,
};

function detailRelations(type, detail) {
  return {
    houseDetail: type === 'CASA' ? { create: detail } : undefined,
    buildingDetail: type === 'EDIFICIO' ? { create: detail } : undefined,
    lotDetail: type === 'LOTE' ? { create: detail } : undefined,
  };
}

function list() {
  return prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      manager: { select: { id: true, fullName: true } },
      _count: { select: { properties: true } },
    },
  });
}

async function getById(id) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { ...fullInclude, properties: { orderBy: { code: 'asc' } } },
  });
  if (!project) throw new HttpError(404, 'Proyecto no encontrado');
  return project;
}

function create({ data, type, detail, units }) {
  return prisma.project.create({
    data: {
      ...data,
      ...detailRelations(type, detail),
      projectedUnits: { create: units },
    },
    include: fullInclude,
  });
}

function update(id, { data, type, detail, units }) {
  return prisma.$transaction(async (tx) => {
    await tx.houseDetail.deleteMany({ where: { projectId: id } });
    await tx.buildingDetail.deleteMany({ where: { projectId: id } });
    await tx.lotDetail.deleteMany({ where: { projectId: id } });
    await tx.projectedUnit.deleteMany({ where: { projectId: id } });

    return tx.project.update({
      where: { id },
      data: {
        ...data,
        ...detailRelations(type, detail),
        projectedUnits: { create: units },
      },
      include: fullInclude,
    });
  });
}

const round = (value) => Math.round(value * 100) / 100;

async function getIndicators(id) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, buildingDetail: true },
  });
  if (!project) throw new HttpError(404, 'Proyecto no encontrado');

  const [properties, investment] = await Promise.all([
    prisma.property.findMany({
      where: { projectId: id },
      select: { type: true, area: true, price: true, status: true },
    }),
    prisma.investment.aggregate({ where: { projectId: id }, _sum: { estimatedCost: true } }),
  ]);

  const sellable = properties.filter((p) => p.type !== 'ZONA_COMUN');
  const commonProps = properties.filter((p) => p.type === 'ZONA_COMUN');
  const sum = (items, key) => items.reduce((total, p) => total + Number(p[key]), 0);

  const sellableArea = sum(sellable, 'area');
  const totalPropertyArea = sellableArea + sum(commonProps, 'area');

  let commonAreaPercent = 0;
  if (project.buildingDetail) {
    const builtArea = Number(project.buildingDetail.builtArea);
    commonAreaPercent = builtArea > 0 ? (Number(project.buildingDetail.commonArea) / builtArea) * 100 : 0;
  } else if (totalPropertyArea > 0) {
    commonAreaPercent = (sum(commonProps, 'area') / totalPropertyArea) * 100;
  }

  const projectedSales = sum(sellable, 'price');
  const totalInvestment = Number(investment._sum.estimatedCost || 0);
  const estimatedProfit = projectedSales - totalInvestment;

  const propertiesByStatus = { DISPONIBLE: 0, SEPARADA: 0, VENDIDA: 0, ENTREGADA: 0 };
  properties.forEach((p) => {
    propertiesByStatus[p.status] += 1;
  });

  return {
    sellableArea: round(sellableArea),
    commonAreaPercent: round(commonAreaPercent),
    projectedSales: round(projectedSales),
    totalInvestment: round(totalInvestment),
    estimatedProfit: round(estimatedProfit),
    profitMarginPercent: projectedSales > 0 ? round((estimatedProfit / projectedSales) * 100) : 0,
    propertiesByStatus,
  };
}

module.exports = { list, getById, create, update, getIndicators };
