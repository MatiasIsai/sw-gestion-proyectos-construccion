const { Router } = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const projectsRoutes = require('../modules/projects/projects.routes');
const propertiesRoutes = require('../modules/properties/properties.routes');
const financeRoutes = require('../modules/finance/finance.routes');
const salesRoutes = require('../modules/sales/sales.routes');
const materialsRoutes = require('../modules/materials/materials.routes');
const hrRoutes = require('../modules/hr/hr.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/projects', projectsRoutes);
router.use('/properties', propertiesRoutes);
router.use('/finance', financeRoutes);
router.use('/sales', salesRoutes);
router.use('/materials', materialsRoutes);
router.use('/hr', hrRoutes);

module.exports = router;
