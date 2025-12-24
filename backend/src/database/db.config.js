/**
 * Database Configuration
 * PostgreSQL connection pool for safe, concurrent database access
 */

const { Pool } = require('pg');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'selfhealing',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  
  // Connection pool settings (industry best practices)
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return error after 5 seconds if no connection available
  
  // Force UTC timezone for all connections
  options: '-c timezone=UTC',
};

// Create connection pool
const pool = new Pool(dbConfig);

// Set timezone to UTC for all connections
pool.on('connect', (client) => {
  client.query('SET timezone = "UTC"');
});

// Log connection errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Query result
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 100ms)
    if (duration > 100) {
      console.warn(`⚠️  Slow query (${duration}ms):`, text.substring(0, 50));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    console.error('Query:', text);
    throw error;
  }
}

/**
 * Get a client from the pool (for transactions)
 */
async function getClient() {
  return await pool.connect();
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Close all connections (for graceful shutdown)
 */
async function close() {
  await pool.end();
  console.log('🔌 Database connections closed');
}

module.exports = {
  query,
  getClient,
  testConnection,
  close,
  pool, // Export pool for advanced usage
};
