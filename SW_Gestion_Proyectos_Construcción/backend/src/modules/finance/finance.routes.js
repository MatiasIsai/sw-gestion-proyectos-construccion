const { Router } = require('express');
const prisma = require('../../config/database');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');

const router = Router();

router.use(authenticate, authorize('ADMINISTRADOR', 'GERENTE_FINANCIERO'));

router.get('/investments', async (req, res) => {
  res.json(await prisma.investment.findMany());
});

router.get('/incomes', async (req, res) => {
  res.json(await prisma.income.findMany());
});

router.get('/expenses', async (req, res) => {
  res.json(await prisma.expense.findMany());
});

router.get('/reconciliations', async (req, res) => {
  res.json(await prisma.bankReconciliation.findMany());
});

module.exports = router;
