/**
 * Database Cleanup Job
 * Industry-realistic retention policy implementation
 * 
 * Runs daily to clean up old data:
 * - Alerts: > 30 days
 * - Healing Actions: > 30 days  
 * - Metrics: > 24 hours
 */

const dbService = require('../database/db.service');
const cron = require('node-cron');

/**
 * Run cleanup for all tables
 */
async function runCleanup() {
  console.log('\n🧹 Starting scheduled database cleanup...');
  
  try {
    // Clean up old alerts (> 30 days)
    await dbService.cleanupOldAlerts();
    
    // Clean up old healing actions (> 30 days)
    await dbService.cleanupOldHealingActions();
    
    // Clean up old metrics (> 24 hours)
    await dbService.cleanupOldMetrics();
    
    // Get stats after cleanup
    const stats = await dbService.getDatabaseStats();
    console.log('📊 Database stats after cleanup:');
    console.log('   - Alerts:', stats.alert_count);
    console.log('   - Healing actions:', stats.healing_count);
    console.log('   - Metrics:', stats.metric_count);
    console.log('✅ Database cleanup completed\n');
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
  }
}

/**
 * Initialize cleanup job
 * Runs daily at 2:00 AM
 */
function startCleanupJob() {
  // Schedule: every day at 2:00 AM
  // Cron format: minute hour day month weekday
  cron.schedule('0 2 * * *', async () => {
    await runCleanup();
  });
  
  console.log('📅 Cleanup job scheduled: Daily at 2:00 AM');
  console.log('   - Alerts retention: 30 days');
  console.log('   - Healing actions retention: 30 days');
  console.log('   - Metrics retention: 24 hours');
}

/**
 * Run cleanup immediately (for testing)
 */
async function runCleanupNow() {
  await runCleanup();
}

module.exports = {
  startCleanupJob,
  runCleanupNow,
};
