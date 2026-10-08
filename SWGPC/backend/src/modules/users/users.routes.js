const { Router } = require('express');
const prisma = require('../../config/database');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMINISTRADOR'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, fullName: true, email: true, role: true, isActive: true },
  });
  res.json(users);
});

module.exports = router;
