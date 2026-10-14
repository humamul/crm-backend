const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { errorMiddleware, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CRM Backend REST API',
    version: '1.0.0',
    documentation: '/api/v1/health',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        me: 'GET /api/v1/auth/me',
      },
      enquiries: {
        publicSubmission: 'POST /api/v1/public/enquiries',
        unclaimed: 'GET /api/v1/enquiries/unclaimed',
        claim: 'POST /api/v1/enquiries/:enquiryId/claim',
        myClaimed: 'GET /api/v1/enquiries/my-claimed',
      },
    },
  });
});

// API Routes
app.use('/api/v1', routes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorMiddleware);

module.exports = app;
