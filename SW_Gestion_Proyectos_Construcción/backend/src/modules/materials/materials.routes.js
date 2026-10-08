const { Router } = require('express');
const prisma = require('../../config/database');
const authenticate = require('../../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  res.json(await prisma.material.findMany());
});

router.get('/purchases', async (req, res) => {
  const { projectId } = req.query;
  const purchases = await prisma.materialPurchase.findMany({
    where: projectId ? { projectId } : undefined,
    include: { material: true },
  });
  res.json(purchases);
});

module.exports = router;
