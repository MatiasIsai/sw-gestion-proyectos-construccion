const { Router } = require('express');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const { asyncHandler } = require('../../utils/http');
const { parseProject } = require('./projects.validation');
const service = require('./projects.service');

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await service.list());
}));

router.get('/:id/indicators', asyncHandler(async (req, res) => {
  res.json(await service.getIndicators(req.params.id));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await service.getById(req.params.id));
}));

router.post('/', authorize('ADMINISTRADOR'), asyncHandler(async (req, res) => {
  const parsed = parseProject(req.body, req.user.sub);
  res.status(201).json(await service.create(parsed));
}));

router.put('/:id', authorize('ADMINISTRADOR'), asyncHandler(async (req, res) => {
  const parsed = parseProject(req.body, req.user.sub);
  res.json(await service.update(req.params.id, parsed));
}));

module.exports = router;
