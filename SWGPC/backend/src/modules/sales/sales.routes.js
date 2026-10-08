const { Router } = require('express');
const prisma = require('../../config/database');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');

const router = Router();

router.use(authenticate, authorize('ADMINISTRADOR', 'AGENTE_COMERCIAL'));

router.get('/clients', async (req, res) => {
  res.json(await prisma.client.findMany());
});

router.get('/leads', async (req, res) => {
  res.json(await prisma.lead.findMany({ include: { client: true, property: true, project: true } }));
});

router.get('/payment-plans/:clientId', async (req, res) => {
  const plans = await prisma.paymentPlan.findMany({
    where: { purchase: { clientId: req.params.clientId } },
    include: { installments: true, purchase: { include: { property: true } } },
  });
  res.json(plans);
});

router.get('/overdue-installments', async (req, res) => {
  const overdue = await prisma.installment.findMany({
    where: { status: 'PENDIENTE', dueDate: { lt: new Date() } },
    include: { paymentPlan: { include: { purchase: { include: { client: true, property: true, project: true } } } } },
  });
  const now = Date.now();
  res.json(
    overdue.map((i) => ({
      ...i,
      daysOverdue: Math.floor((now - i.dueDate.getTime()) / 86400000),
    }))
  );
});

module.exports = router;
