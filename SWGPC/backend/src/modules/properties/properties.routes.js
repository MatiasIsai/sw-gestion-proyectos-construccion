const { Router } = require('express');
const { UnitType, PropertyStatus } = require('@prisma/client');
const prisma = require('../../config/database');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const { HttpError, asyncHandler, str, num, oneOf } = require('../../utils/http');

const router = Router();

router.use(authenticate);

function parseProperty(body) {
  return {
    code: str(body.code, 'código de la propiedad', { required: true, max: 50 }),
    type: oneOf(body.type, 'tipo de propiedad', Object.values(UnitType)),
    area: num(body.area, 'área', { positive: true }),
    price: num(body.price, 'precio de venta', { min: 0 }),
    features: str(body.features, 'características', { max: 2000 }),
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const { status, projectId, type } = req.query;
  const properties = await prisma.property.findMany({
    where: {
      ...(status && { status: oneOf(status, 'estado', Object.values(PropertyStatus)) }),
      ...(type && { type: oneOf(type, 'tipo de propiedad', Object.values(UnitType)) }),
      ...(projectId && { projectId }),
    },
    orderBy: { code: 'asc' },
  });
  res.json(properties);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    include: { project: { select: { id: true, name: true } } },
  });
  if (!property) throw new HttpError(404, 'Propiedad no encontrada');
  res.json(property);
}));

router.post('/', authorize('ADMINISTRADOR'), asyncHandler(async (req, res) => {
  const projectId = str(req.body.projectId, 'proyecto', { required: true });
  const property = await prisma.property.create({
    data: { ...parseProperty(req.body), projectId },
  });
  res.status(201).json(property);
}));

router.put('/:id', authorize('ADMINISTRADOR'), asyncHandler(async (req, res) => {
  const current = await prisma.property.findUnique({ where: { id: req.params.id } });
  if (!current) throw new HttpError(404, 'Propiedad no encontrada');
  if (current.status !== 'DISPONIBLE') {
    throw new HttpError(409, 'Solo se pueden editar propiedades en estado Disponible');
  }

  const property = await prisma.property.update({
    where: { id: req.params.id },
    data: parseProperty(req.body),
  });
  res.json(property);
}));

router.delete('/:id', authorize('ADMINISTRADOR'), asyncHandler(async (req, res) => {
  const current = await prisma.property.findUnique({ where: { id: req.params.id } });
  if (!current) throw new HttpError(404, 'Propiedad no encontrada');
  if (current.status !== 'DISPONIBLE') {
    throw new HttpError(409, 'Solo se pueden eliminar propiedades en estado Disponible');
  }

  await prisma.property.delete({ where: { id: req.params.id } });
  res.json({ message: 'Propiedad eliminada' });
}));

module.exports = router;
