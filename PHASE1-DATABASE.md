# Phase 1: Database Persistence

## Overview

Industry-realistic short-term operational history with automated retention policies.

## What Was Added

### 1. **PostgreSQL Database**
- Container-based deployment (`docker-compose.yml`)
- Production-ready connection pooling
- Automatic health checks

### 2. **Database Schema** (`backend/src/database/schema.sql`)
Three simple tables with proper indexes:

| Table | Retention | Purpose |
|-------|-----------|---------|
| `alerts` | 30 days | Compliance & audit trail |
| `healing_actions` | 30 days | Incident tracking & review |
| `metrics` | 24 hours | Operational monitoring |

### 3. **Database Service Layer** (`backend/src/database/`)
- `db.config.js` - Connection pool with error handling
- `db.service.js` - Simple CRUD operations
- No ORMs, no complexity - just SQL

### 4. **Integration with Existing Services**
- `alert.service.js` - Saves every alert to DB
- `dashboard.service.js` - Saves metrics & healing actions
- All APIs read from DB with in-memory fallback

### 5. **Automated Cleanup** (`backend/src/jobs/cleanup.job.js`)
- Runs daily at 2:00 AM
- Deletes data older than retention period
- Logs cleanup statistics

### 6. **Graceful Degradation**
- System works WITHOUT database (memory-only mode)
- Automatic fallback if DB unavailable
- No breaking changes to existing functionality

## Architecture

```
Agent → Backend API → [In-Memory Cache] → Database (PostgreSQL)
                           ↓                      ↓
                      Fast reads            Persistent storage
                                             Auto-cleanup (30d/24h)
```

## Retention Policy (Industry-Realistic)

```
Alerts:          30 days  (compliance, audit trail)
Healing Actions: 30 days  (incident review, root cause analysis)
Metrics:         24 hours (real-time monitoring, not analytics)
```

## Files Modified/Created

### New Files
- `docker-compose.yml` - PostgreSQL container
- `backend/src/database/schema.sql` - Database schema
- `backend/src/database/db.config.js` - Connection pool
- `backend/src/database/db.service.js` - CRUD operations
- `backend/src/jobs/cleanup.job.js` - Retention enforcement
- `.env` - Database credentials

### Modified Files
- `backend/src/server.js` - Database initialization & cleanup job
- `backend/src/services/alert.service.js` - Save alerts to DB
- `backend/src/services/dashboard.service.js` - Save metrics/healing to DB
- `backend/src/controllers/alerts.controller.js` - Async DB reads
- `backend/src/controllers/dashboard.controller.js` - Async DB reads
- `backend/package.json` - Added `pg` and `node-cron`

## Testing

### Option 1: With Docker (Recommended)
```bash
# Start PostgreSQL
docker-compose up -d db

# Start backend
cd backend && npm run dev

# Check logs
docker-compose logs -f db
```

### Option 2: Local PostgreSQL
```bash
# Install PostgreSQL
sudo apt install postgresql

# Create database
sudo -u postgres createdb selfhealing
sudo -u postgres psql -c "CREATE USER admin WITH PASSWORD 'admin';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE selfhealing TO admin;"

# Run schema
psql -U admin -d selfhealing -f backend/src/database/schema.sql

# Start backend
cd backend && npm run dev
```

### Option 3: Without Database
```bash
# Just start backend - works in memory-only mode
cd backend && npm run dev
```

## Verification

### 1. Check Database Connection
```bash
curl http://localhost:5000/api/dashboard/health
```

### 2. Generate Some Data
```bash
# Trigger CPU stress (creates healing action)
stress --cpu 8 --timeout 30s
```

### 3. Query Database
```bash
# Connect to PostgreSQL
psql -U admin -d selfhealing -h localhost

# Check data
SELECT COUNT(*) FROM alerts;
SELECT COUNT(*) FROM healing_actions;
SELECT COUNT(*) FROM metrics;

# Check oldest records
SELECT MIN(created_at) FROM alerts;
SELECT MIN(created_at) FROM healing_actions;
SELECT MIN(created_at) FROM metrics;
```

### 4. Test Cleanup Job
```bash
# Run cleanup manually (in Node REPL)
node
> const cleanup = require('./backend/src/jobs/cleanup.job')
> cleanup.runCleanupNow()
```

## How to Explain This to a Company

> "The system maintains a **short-term operational history** to support auditing and incident review without incurring long-term storage overhead. We implement industry-standard retention policies: **30 days for alerts and healing actions** (compliance/incident tracking), and **24 hours for metrics** (operational monitoring). Automated cleanup jobs ensure data doesn't accumulate indefinitely, preventing database bloat. The system gracefully degrades to in-memory mode if the database is unavailable, ensuring continuous operation."

## Benefits

✅ **Industry-Realistic**: Real companies don't store everything forever  
✅ **Compliance-Ready**: 30-day audit trail for alerts/actions  
✅ **Performance**: Hybrid in-memory + DB approach  
✅ **Cost-Effective**: No long-term storage overhead  
✅ **Reliable**: Graceful degradation if DB fails  
✅ **Maintainable**: Simple SQL, no complex ORMs  

## Next Steps

- **Phase 2**: Multi-server support (track multiple hosts)
- **Phase 3**: Dashboard charts (24-hour metric trends)
- **Phase 4**: Advanced analytics (ML-based anomaly detection)

## Rollback

To revert to v1.0-poc (no database):
```bash
git checkout v1.0-poc
```

---

**Phase 1 Complete!** 🎉  
Your system now has industry-realistic persistence with proper retention policies.
