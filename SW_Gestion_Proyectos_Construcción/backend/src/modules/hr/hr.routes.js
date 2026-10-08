const { Router } = require('express');
const prisma = require('../../config/database');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');

const router = Router();

router.use(authenticate, authorize('ADMINISTRADOR', 'SUPERVISOR'));

router.get('/employees', async (req, res) => {
  res.json(await prisma.employee.findMany());
});

router.get('/assignments', async (req, res) => {
  const { projectId } = req.query;
  const assignments = await prisma.laborAssignment.findMany({
    where: projectId ? { projectId } : undefined,
    include: { employee: true, project: true },
  });
  res.json(assignments);
});

module.exports = router;
