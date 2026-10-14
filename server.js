require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initDatabase, getPool } = require('./src/config/database');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    // Ensure database connection and tables are ready
    await initDatabase();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 CRM Backend API Server is running on port ${PORT}`);
      console.log(`📡 Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`====================================================`);
    });

    // Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        try {
          const pool = getPool();
          await pool.end();
          console.log('[Server] Database pool closed.');
          process.exit(0);
        } catch (err) {
          console.error('[Server] Error during pool closure:', err.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
