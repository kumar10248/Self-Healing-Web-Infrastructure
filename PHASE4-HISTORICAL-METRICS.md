# Phase 4: Historical Metrics

## Overview

**Operational insight, not prediction.**

Phase 4 adds 24-hour trend visualization to help operators understand system behavior over time. Line charts show CPU, Memory, and Disk usage patterns with configurable threshold lines.

**No ML. No forecasting. Just data.**

---

## What Was Built

### Backend (API)
1. **Historical Metrics Controller** (`history.controller.js`)
   - `GET /api/history/metrics` - Fetch all historical metrics (CPU/Memory/Disk)
   - `GET /api/history/metrics/:resource` - Fetch specific resource history (cpu, memory, or disk)
   - `GET /api/history/summary` - Get min/max/avg statistics

2. **Data Management**
   - Leverages existing database (Phase 1)
   - Metrics already stored every 10 seconds
   - 24-hour retention (auto-cleanup)
   - Returns last 2,880 data points (8 hours at 10s intervals)

### Frontend (Visualization)
1. **LineChart Component** (`LineChart.jsx`)
   - Canvas-based line chart (no external dependencies)
   - Shows trend lines with data points
   - Displays threshold line (red dashed) based on policies
   - Real-time statistics (Current/Avg/Min/Max)

2. **History Page** (`HistoryPage.jsx`)
   - Three line charts (CPU, Memory, Disk)
   - Auto-refresh every 30 seconds
   - Responsive design
   - Clear messaging about purpose (operational insight, not prediction)

---

## Key Features

### 1️⃣ **Trend Visualization**
- Line charts show resource usage over last 8-24 hours
- Color-coded by resource type:
  - CPU: Red (`#ef4444`)
  - Memory: Purple (`#8b5cf6`)
  - Disk: Green (`#10b981`)
- Grid lines for easier reading

### 2️⃣ **Threshold Indicators**
- Red dashed line shows current policy threshold
- Helps visualize when healing actions trigger
- Example: CPU chart shows 85% threshold line

### 3️⃣ **Real-Time Statistics**
- **Current:** Latest value
- **Average:** Mean over time range
- **Min:** Lowest value
- **Max:** Highest value

### 4️⃣ **Operational Metadata**
- Data points count
- Time range (8 hours)
- Sampling interval (10 seconds)
- Retention policy (24 hours)

---

## API Endpoints

### 1. Get All Historical Metrics
```bash
GET /api/history/metrics?host=localhost&limit=2880
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cpu": [
      { "timestamp": "2025-12-24T10:00:00Z", "value": 45.2 },
      { "timestamp": "2025-12-24T10:00:10Z", "value": 46.8 }
    ],
    "memory": [...],
    "disk": [...]
  },
  "meta": {
    "host": "localhost",
    "dataPoints": 2880,
    "timeRange": "8 hours",
    "interval": "10 seconds"
  }
}
```

### 2. Get Specific Resource History
```bash
GET /api/history/metrics/cpu?host=localhost&limit=1000
```

**Response:**
```json
{
  "success": true,
  "resource": "cpu",
  "data": [
    { "timestamp": "2025-12-24T10:00:00Z", "value": 45.2 },
    { "timestamp": "2025-12-24T10:00:10Z", "value": 46.8 }
  ],
  "meta": {
    "host": "localhost",
    "dataPoints": 1000,
    "timeRange": "24 hours",
    "interval": "10 seconds"
  }
}
```

### 3. Get Summary Statistics
```bash
GET /api/history/summary?host=localhost&limit=2880
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cpu": { "min": "12.50", "max": "89.20", "avg": "42.30", "current": "45.20" },
    "memory": { "min": "30.10", "max": "78.90", "avg": "52.40", "current": "55.60" },
    "disk": { "min": "65.00", "max": "72.50", "avg": "68.20", "current": "70.10" },
    "timeRange": {
      "start": "2025-12-24T02:00:00Z",
      "end": "2025-12-24T10:00:00Z",
      "dataPoints": 2880
    }
  }
}
```

---

## File Structure

### Backend Files Created
```
backend/src/
├── controllers/
│   └── history.controller.js      # Historical metrics API handlers
└── routes/
    └── history.routes.js           # /api/history/* routes
```

### Backend Files Modified
```
backend/src/
└── app.js                          # Added history routes
```

### Frontend Files Created
```
frontend/src/
├── components/
│   ├── LineChart.jsx               # Canvas-based line chart component
│   └── LineChart.css               # Chart styles
└── pages/
    ├── HistoryPage.jsx             # Historical metrics page
    └── HistoryPage.css             # Page styles
```

### Frontend Files Modified
```
frontend/src/
└── App.jsx                         # Added History navigation
```

---

## How It Works

### Data Flow
```
Agent (every 10s)
      ↓
Backend receives metrics
      ↓
Save to PostgreSQL (metrics table)
      ↓
Frontend requests /api/history/metrics
      ↓
Backend fetches last 2,880 points (8 hours)
      ↓
Frontend renders line charts
      ↓
Auto-refresh every 30 seconds
```

### Chart Rendering
1. **Canvas API** (no external libraries)
2. **Dynamic scaling** based on min/max values
3. **Grid lines** for reference
4. **Threshold line** from policies
5. **Time labels** (start, middle, end)
6. **Y-axis labels** (0-100%)

---

## Why Historical Metrics Matter

### ❌ What This Is NOT:
- ❌ Predictive analytics
- ❌ Machine learning
- ❌ Forecasting future values
- ❌ Complex algorithms

### ✅ What This IS:
- ✅ **Operational insight** - See what happened
- ✅ **Pattern identification** - Spot recurring issues
- ✅ **Healing validation** - Verify actions worked
- ✅ **Trend awareness** - Understand resource behavior

---

## Use Cases

### 1. Validate Healing Actions
**Scenario:** CPU healing triggered at 10:15 AM
- **Chart shows:** CPU spike at 10:15, drop after healing
- **Insight:** Healing successful

### 2. Identify Patterns
**Scenario:** Memory usage increases every day at 2 PM
- **Chart shows:** Repeating pattern
- **Insight:** Scheduled job or batch process

### 3. Capacity Planning
**Scenario:** Disk usage steadily increasing
- **Chart shows:** Upward trend
- **Insight:** Need to provision more storage

### 4. Threshold Tuning
**Scenario:** CPU threshold set to 85%
- **Chart shows:** Frequent spikes above threshold
- **Insight:** May need to adjust threshold or add capacity

---

## Industry Positioning

> "Historical metrics provide **operational insight** into system behavior over time. These charts help operators identify patterns, validate healing actions, and understand resource trends. We focus on **data visualization, not prediction**—showing what happened, not forecasting what might happen."

**Comparison with Other Systems:**

| System | Historical Charts | Retention | Purpose |
|--------|------------------|-----------|---------|
| **Your System** | ✅ 24 hours | 24 hours | Operational insight |
| Datadog | ✅ 15 months | Configurable | Monitoring + Analytics |
| Grafana | ✅ Unlimited | Configurable | Visualization |
| Prometheus | ✅ 15 days (default) | Configurable | Metrics + Alerting |
| CloudWatch | ✅ 15 months | Configurable | AWS Monitoring |

**Key Difference:** We keep it simple—24 hours is enough for operational insight without complexity.

---

## Interview Talking Points

> "Our system includes **historical metrics visualization** with line charts showing 24-hour trends for CPU, Memory, and Disk. This provides operational insight—not prediction—helping operators identify patterns and validate healing actions. We use a 24-hour retention window, which is industry-realistic for short-term operational history. The charts display configurable threshold lines from our policy system, making it easy to see when healing actions trigger."

This demonstrates:
- ✅ **Data-driven decision making**
- ✅ **Operational maturity** (not just real-time monitoring)
- ✅ **Visual communication** (charts > logs)
- ✅ **Practical retention** (24 hours is realistic)

---

## Configuration

### Adjust Data Points Returned
Edit `backend/src/controllers/history.controller.js`:
```javascript
// Default: 2,880 points (8 hours at 10s intervals)
const metrics = await dbService.getMetrics(host, 2880);

// For 24 hours: 8,640 points
const metrics = await dbService.getMetrics(host, 8640);

// For 1 hour: 360 points
const metrics = await dbService.getMetrics(host, 360);
```

### Adjust Chart Colors
Edit `frontend/src/pages/HistoryPage.jsx`:
```jsx
<LineChart color="#ef4444" />  // Red
<LineChart color="#8b5cf6" />  // Purple
<LineChart color="#10b981" />  // Green
<LineChart color="#f59e0b" />  // Orange (custom)
```

### Adjust Auto-Refresh Interval
Edit `frontend/src/pages/HistoryPage.jsx`:
```javascript
// Default: 30 seconds
const interval = setInterval(fetchHistoricalMetrics, 30000);

// For 10 seconds:
const interval = setInterval(fetchHistoricalMetrics, 10000);
```

---

## Testing

### 1. Start Backend (with Database)
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Start backend
cd backend && npm run dev
```

### 2. Start Agent (Generate Metrics)
```bash
cd agent && sudo bash install.sh
```

### 3. Start Frontend
```bash
cd frontend && npm run dev
```

### 4. Access History Page
Open browser: `http://localhost:5173`
Click: **📈 History**

### 5. Verify Charts
- ✅ Three line charts visible (CPU, Memory, Disk)
- ✅ Threshold lines displayed (red dashed)
- ✅ Statistics shown (Current/Avg/Min/Max)
- ✅ Auto-refresh every 30 seconds

---

## Rollback

If Phase 4 causes issues:
```bash
git checkout <previous-commit>  # Revert to Phase 3
```

Or disable history page:
```jsx
// In frontend/src/App.jsx, comment out:
// case 'history':
//   return <HistoryPage />;
```

---

## Next Steps (Optional)

**Possible Phase 5:**
- Multi-host monitoring (track multiple servers)
- Downloadable reports (CSV export)
- Custom time ranges (1 hour, 4 hours, 24 hours)
- Alert correlation (show alerts on charts)
- Zoom/pan functionality
- Real-time streaming (WebSocket updates)

---

**Phase 4 Complete!** 📈  
Your system now has **operational insight** through 24-hour trend visualization!