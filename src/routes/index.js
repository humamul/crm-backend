const { Router } = require('express');
const authRoutes = require('./auth.routes');
const enquiryRoutes = require('./enquiry.routes');

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'CRM Backend REST API',
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/', enquiryRoutes);

module.exports = router;
