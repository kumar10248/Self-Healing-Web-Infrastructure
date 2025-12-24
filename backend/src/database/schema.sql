-- Self-Healing Infrastructure Database Schema
-- Industry-realistic short-term operational history

-- ============================================================================
-- TABLE 1: ALERTS (30-day retention)
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    host VARCHAR(255) NOT NULL,
    service VARCHAR(100),
    resource VARCHAR(50),
    value DECIMAL(10, 2),
    threshold DECIMAL(10, 2),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for faster queries by timestamp and type
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_host ON alerts(host);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- ============================================================================
-- TABLE 2: HEALING ACTIONS (30-day retention)
-- ============================================================================
CREATE TABLE IF NOT EXISTS healing_actions (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255) NOT NULL,
    result VARCHAR(20) NOT NULL,
    details TEXT,
    host VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for faster queries by timestamp and result
CREATE INDEX IF NOT EXISTS idx_healing_timestamp ON healing_actions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_healing_result ON healing_actions(result);
CREATE INDEX IF NOT EXISTS idx_healing_host ON healing_actions(host);
CREATE INDEX IF NOT EXISTS idx_healing_created_at ON healing_actions(created_at);

-- ============================================================================
-- TABLE 3: METRICS (24-hour retention)
-- ============================================================================
CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    host VARCHAR(255) NOT NULL,
    cpu DECIMAL(5, 2) NOT NULL,
    memory DECIMAL(5, 2) NOT NULL,
    disk DECIMAL(5, 2) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for faster queries by timestamp and host
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_host ON metrics(host);
CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON metrics(created_at);

-- ============================================================================
-- CLEANUP FUNCTION (called by scheduled job)
-- ============================================================================

-- Function to delete old alerts (> 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_alerts() RETURNS void AS $$
BEGIN
    DELETE FROM alerts WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to delete old healing actions (> 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_healing_actions() RETURNS void AS $$
BEGIN
    DELETE FROM healing_actions WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to delete old metrics (> 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_metrics() RETURNS void AS $$
BEGIN
    DELETE FROM metrics WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Check table sizes
-- SELECT 'alerts' as table_name, COUNT(*) as row_count FROM alerts
-- UNION ALL
-- SELECT 'healing_actions', COUNT(*) FROM healing_actions
-- UNION ALL
-- SELECT 'metrics', COUNT(*) FROM metrics;

-- Check oldest records
-- SELECT 'alerts' as table_name, MIN(created_at) as oldest FROM alerts
-- UNION ALL
-- SELECT 'healing_actions', MIN(created_at) FROM healing_actions
-- UNION ALL
-- SELECT 'metrics', MIN(created_at) FROM metrics;
