const { Router } = require('express');
const authController = require('./auth.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');

const router = Router();

router.post('/login', authController.login);
router.post('/register', authenticate, authorize('ADMINISTRADOR'), authController.register);

module.exports = router;
