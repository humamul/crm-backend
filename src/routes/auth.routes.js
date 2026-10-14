const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validate.middleware');
const RegisterRequestDTO = require('../dtos/requests/register.dto');
const LoginRequestDTO = require('../dtos/requests/login.dto');

const router = Router();

// Employee/Counselor Registration
router.post('/register', validateBody(RegisterRequestDTO), (req, res, next) =>
  authController.register(req, res, next)
);

// Employee/Counselor Login
router.post('/login', validateBody(LoginRequestDTO), (req, res, next) =>
  authController.login(req, res, next)
);

// Get current counselor profile (Protected)
router.get('/me', authMiddleware, (req, res, next) =>
  authController.getProfile(req, res, next)
);

module.exports = router;
