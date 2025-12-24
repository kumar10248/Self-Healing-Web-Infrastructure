const app = require("./app");
const { PORT } = require("./config/env");
const db = require("./database/db.config");
const cleanupJob = require("./jobs/cleanup.job");

// Test database connection on startup
db.testConnection()
  .then((connected) => {
    if (connected) {
      console.log("✅ Database connection successful");
      
      // Start cleanup job
      cleanupJob.startCleanupJob();
    } else {
      console.warn("⚠️  Database connection failed - running in degraded mode (memory-only)");
    }
  })
  .catch((error) => {
    console.error("❌ Database initialization error:", error.message);
    console.warn("⚠️  Continuing without database (memory-only mode)");
  });

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  await db.close();
  process.exit(0);
});
