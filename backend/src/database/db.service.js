/**
 * Database Service Layer
 * Simple CRUD operations for alerts, healing_actions, and metrics
 * Industry-realistic short-term operational history
 */

const db = require('./db.config');

// ============================================================================
// ALERTS (30-day retention)
// ============================================================================

/**
 * Insert new alert into database
 */
exports.insertAlert = async (alertData) => {
  const query = `
    INSERT INTO alerts (type, severity, message, host, service, resource, value, threshold, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const values = [
    alertData.type,
    alertData.severity,
    alertData.message,
    alertData.host,
    alertData.service || null,
    alertData.resource || null,
    alertData.value || null,
    alertData.threshold || null,
    alertData.timestamp || new Date(),
  ];
  
  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error inserting alert:', error.message);
    throw error;
  }
};

/**
 * Get all alerts (with optional filters)
 */
exports.getAlerts = async (filters = {}) => {
  let query = 'SELECT * FROM alerts';
  const conditions = [];
  const values = [];
  
  // Add filters
  if (filters.type) {
    conditions.push(`type = $${conditions.length + 1}`);
    values.push(filters.type);
  }
  
  if (filters.severity) {
    conditions.push(`severity = $${conditions.length + 1}`);
    values.push(filters.severity);
  }
  
  if (filters.host) {
    conditions.push(`host = $${conditions.length + 1}`);
    values.push(filters.host);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY timestamp DESC';
  
  // Limit results
  if (filters.limit) {
    query += ` LIMIT ${parseInt(filters.limit)}`;
  }
  
  try {
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching alerts:', error.message);
    throw error;
  }
};

/**
 * Delete old alerts (> 30 days)
 */
exports.cleanupOldAlerts = async () => {
  const query = "SELECT cleanup_old_alerts()";
  
  try {
    await db.query(query);
    console.log('✅ Cleaned up old alerts (> 30 days)');
  } catch (error) {
    console.error('❌ Error cleaning up alerts:', error.message);
    throw error;
  }
};

// ============================================================================
// HEALING ACTIONS (30-day retention)
// ============================================================================

/**
 * Insert new healing action into database
 */
exports.insertHealingAction = async (actionData) => {
  const query = `
    INSERT INTO healing_actions (action, target, result, details, host, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const values = [
    actionData.action,
    actionData.target,
    actionData.result,
    actionData.details || null,
    actionData.host,
    actionData.timestamp || new Date(),
  ];
  
  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error inserting healing action:', error.message);
    throw error;
  }
};

/**
 * Get healing actions history (with optional filters)
 */
exports.getHealingActions = async (filters = {}) => {
  let query = 'SELECT * FROM healing_actions';
  const conditions = [];
  const values = [];
  
  // Add filters
  if (filters.host) {
    conditions.push(`host = $${conditions.length + 1}`);
    values.push(filters.host);
  }
  
  if (filters.result) {
    conditions.push(`result = $${conditions.length + 1}`);
    values.push(filters.result);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY timestamp DESC';
  
  // Limit results
  if (filters.limit) {
    query += ` LIMIT ${parseInt(filters.limit)}`;
  }
  
  try {
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching healing actions:', error.message);
    throw error;
  }
};

/**
 * Delete old healing actions (> 30 days)
 */
exports.cleanupOldHealingActions = async () => {
  const query = "SELECT cleanup_old_healing_actions()";
  
  try {
    await db.query(query);
    console.log('✅ Cleaned up old healing actions (> 30 days)');
  } catch (error) {
    console.error('❌ Error cleaning up healing actions:', error.message);
    throw error;
  }
};

// ============================================================================
// METRICS (24-hour retention)
// ============================================================================

/**
 * Insert new metric into database
 */
exports.insertMetric = async (metricData) => {
  const query = `
    INSERT INTO metrics (host, cpu, memory, disk, timestamp)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const values = [
    metricData.host,
    metricData.cpu,
    metricData.memory,
    metricData.disk,
    metricData.timestamp || new Date(),
  ];
  
  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error inserting metric:', error.message);
    throw error;
  }
};

/**
 * Get latest metric for a host
 */
exports.getLatestMetric = async (host) => {
  const query = `
    SELECT * FROM metrics
    WHERE host = $1
    ORDER BY timestamp DESC
    LIMIT 1
  `;
  
  try {
    const result = await db.query(query, [host]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error fetching latest metric:', error.message);
    throw error;
  }
};

/**
 * Get metrics for a host (last 24 hours)
 */
exports.getMetrics = async (host, limit = 100) => {
  const query = `
    SELECT * FROM metrics
    WHERE host = $1
    ORDER BY timestamp DESC
    LIMIT $2
  `;
  
  try {
    const result = await db.query(query, [host, limit]);
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching metrics:', error.message);
    throw error;
  }
};

/**
 * Delete old metrics (> 24 hours)
 */
exports.cleanupOldMetrics = async () => {
  const query = "SELECT cleanup_old_metrics()";
  
  try {
    await db.query(query);
    console.log('✅ Cleaned up old metrics (> 24 hours)');
  } catch (error) {
    console.error('❌ Error cleaning up metrics:', error.message);
    throw error;
  }
};

// ============================================================================
// STATISTICS & HEALTH
// ============================================================================

/**
 * Get database statistics
 */
exports.getDatabaseStats = async () => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM alerts) as alert_count,
      (SELECT COUNT(*) FROM healing_actions) as healing_count,
      (SELECT COUNT(*) FROM metrics) as metric_count,
      (SELECT MIN(created_at) FROM alerts) as oldest_alert,
      (SELECT MIN(created_at) FROM healing_actions) as oldest_healing,
      (SELECT MIN(created_at) FROM metrics) as oldest_metric
  `;
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error fetching database stats:', error.message);
    throw error;
  }
};
