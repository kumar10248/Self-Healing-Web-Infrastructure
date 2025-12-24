# 🔄 Feature 1 - Data Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Linux Server                             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Agent (Node.js)                       │   │
│  │                     agent.js                             │   │
│  │                                                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │  cpu.sh     │  │ memory.sh   │  │  disk.sh    │    │   │
│  │  │             │  │             │  │             │    │   │
│  │  │ ├─ top     │  │ ├─ meminfo │  │ ├─ df       │    │   │
│  │  │ └─ bc      │  │ └─ bc      │  │ └─ awk      │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │         │                │                │              │   │
│  │         └────────────────┴────────────────┘              │   │
│  │                         │                                 │   │
│  │                 Collect Metrics                          │   │
│  │                         │                                 │   │
│  │                         ▼                                 │   │
│  │              ┌──────────────────┐                        │   │
│  │              │   JSON Payload   │                        │   │
│  │              │   {              │                        │   │
│  │              │     host: "...", │                        │   │
│  │              │     cpu: 45,     │                        │   │
│  │              │     memory: 62,  │                        │   │
│  │              │     disk: 55,    │                        │   │
│  │              │     timestamp    │                        │   │
│  │              │   }              │                        │   │
│  │              └──────────────────┘                        │   │
│  │                         │                                 │   │
│  └─────────────────────────┼─────────────────────────────────┘   │
│                            │                                     │
│                   Every 10 seconds                               │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ HTTP POST
                             │ /api/metrics
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Server                              │
│                      (Express.js)                                │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     app.js                                 │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              POST /api/metrics                      │  │  │
│  │  │                                                      │  │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │  │
│  │  │  │  metrics.routes.js                           │  │  │  │
│  │  │  │         │                                     │  │  │  │
│  │  │  │         ▼                                     │  │  │  │
│  │  │  │  metrics.controller.js                       │  │  │  │
│  │  │  │         │                                     │  │  │  │
│  │  │  │         │ receiveMetrics()                   │  │  │  │
│  │  │  │         │                                     │  │  │  │
│  │  │  │         ▼                                     │  │  │  │
│  │  │  │  monitoring.service.js                       │  │  │  │
│  │  │  │         │                                     │  │  │  │
│  │  │  │         │ processMetrics()                   │  │  │  │
│  │  │  │         │                                     │  │  │  │
│  │  │  │         │ • Validate data                    │  │  │  │
│  │  │  │         │ • Check required fields            │  │  │  │
│  │  │  │         │ • Log formatted output             │  │  │  │
│  │  │  │         │                                     │  │  │  │
│  │  │  │         ▼                                     │  │  │  │
│  │  │  │  ┌─────────────────────┐                    │  │  │  │
│  │  │  │  │   Console Output    │                    │  │  │  │
│  │  │  │  │                     │                    │  │  │  │
│  │  │  │  │ =================== │                    │  │  │  │
│  │  │  │  │ 📊 METRICS RECEIVED │                    │  │  │  │
│  │  │  │  │ =================== │                    │  │  │  │
│  │  │  │  │ Host:      server-1 │                    │  │  │  │
│  │  │  │  │ CPU:       45%      │                    │  │  │  │
│  │  │  │  │ Memory:    62%      │                    │  │  │  │
│  │  │  │  │ Disk:      55%      │                    │  │  │  │
│  │  │  │  │ Timestamp: ...      │                    │  │  │  │
│  │  │  │  └─────────────────────┘                    │  │  │  │
│  │  │  │         │                                     │  │  │  │
│  │  │  │         ▼                                     │  │  │  │
│  │  │  │  Return JSON Response                        │  │  │  │
│  │  │  │  {                                            │  │  │  │
│  │  │  │    success: true,                            │  │  │  │
│  │  │  │    message: "Metrics received",              │  │  │  │
│  │  │  │    data: { ... }                             │  │  │  │
│  │  │  │  }                                            │  │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             │ HTTP 200 OK                        │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              │
                              ▼
                    ┌──────────────────┐
                    │  Agent receives  │
                    │  success response│
                    │                  │
                    │  ✅ Logged      │
                    └──────────────────┘
```

## Request/Response Cycle

```
Time: T0
┌──────────┐
│  Agent   │  Collect CPU, Memory, Disk
│          │  ▶ cpu: 45%, memory: 62%, disk: 55%
└──────────┘
     │
     │ Build JSON
     ▼
┌──────────────────────────────────┐
│  {                                │
│    "host": "server-1",            │
│    "cpu": 45,                     │
│    "memory": 62,                  │
│    "disk": 55,                    │
│    "timestamp": "2025-12-23..."   │
│  }                                │
└──────────────────────────────────┘
     │
     │ HTTP POST
     │ Content-Type: application/json
     ▼
┌──────────┐
│ Backend  │  Parse JSON → Validate → Log
│          │  ▶ All fields present ✓
│          │  ▶ Print formatted output
└──────────┘
     │
     │ Generate Response
     ▼
┌──────────────────────────────────┐
│  {                                │
│    "success": true,               │
│    "message": "Metrics received", │
│    "data": {                      │
│      "received": true,            │
│      "host": "server-1",          │
│      "timestamp": "..."           │
│    }                              │
│  }                                │
└──────────────────────────────────┘
     │
     │ HTTP 200 OK
     │ Content-Type: application/json
     ▼
┌──────────┐
│  Agent   │  Log success message
│          │  ▶ ✅ Metrics sent successfully
└──────────┘
     │
     │ Wait 10 seconds
     ▼
   Repeat
```

## Component Interaction Matrix

```
┌─────────────────┬──────────────┬─────────────┬──────────────┐
│  Component      │  Language    │  Purpose    │  Frequency   │
├─────────────────┼──────────────┼─────────────┼──────────────┤
│  cpu.sh         │  Bash        │  Collect    │  Every 10s   │
│  memory.sh      │  Bash        │  Collect    │  Every 10s   │
│  disk.sh        │  Bash        │  Collect    │  Every 10s   │
├─────────────────┼──────────────┼─────────────┼──────────────┤
│  agent.js       │  Node.js     │  Aggregate  │  Continuous  │
│                 │              │  & Send     │              │
├─────────────────┼──────────────┼─────────────┼──────────────┤
│  server.js      │  Node.js     │  Listen     │  Continuous  │
│  app.js         │  Express     │  Route      │  On request  │
├─────────────────┼──────────────┼─────────────┼──────────────┤
│  routes         │  Express     │  Handle     │  On request  │
│  controllers    │  Express     │  Process    │  On request  │
│  services       │  Express     │  Business   │  On request  │
│                 │              │  Logic      │              │
└─────────────────┴──────────────┴─────────────┴──────────────┘
```

## Data Transformation Pipeline

```
Stage 1: Raw System Data
┌────────────────────────┐
│  $ top -bn1            │  →  "  3.2 id"
│  $ cat /proc/meminfo   │  →  "MemTotal: 16GB\nMemAvailable: 6GB"
│  $ df -h /             │  →  "/dev/sda1  50G  28G  57% /"
└────────────────────────┘
           │
           ▼
Stage 2: Shell Processing
┌────────────────────────┐
│  awk, cut, bc          │  →  CPU: "45"
│  grep, calculations    │  →  Memory: "62"
│  string manipulation   │  →  Disk: "55"
└────────────────────────┘
           │
           ▼
Stage 3: JSON Construction
┌────────────────────────┐
│  {                     │
│    cpu: 45,            │
│    memory: 62,         │
│    disk: 55,           │
│    host: "server-1",   │
│    timestamp: ISO      │
│  }                     │
└────────────────────────┘
           │
           ▼
Stage 4: HTTP Transmission
┌────────────────────────┐
│  POST /api/metrics     │
│  Content-Type: JSON    │
│  Body: { ... }         │
└────────────────────────┘
           │
           ▼
Stage 5: Validation & Storage
┌────────────────────────┐
│  Check required fields │
│  Validate ranges       │
│  Log to console        │
│  (Future: save to DB)  │
└────────────────────────┘
           │
           ▼
Stage 6: Response
┌────────────────────────┐
│  { success: true }     │
└────────────────────────┘
```

## Error Handling Flow

```
Agent Side:
┌─────────────────────────────────────────┐
│  Script fails                           │
│    ↓                                    │
│  Return 0 (default)                     │
│    ↓                                    │
│  Log error, continue                    │
│                                         │
│  Network error                          │
│    ↓                                    │
│  Catch exception                        │
│    ↓                                    │
│  Log error, retry next interval         │
└─────────────────────────────────────────┘

Backend Side:
┌─────────────────────────────────────────┐
│  Invalid JSON                           │
│    ↓                                    │
│  Express body-parser error              │
│    ↓                                    │
│  Return 400 Bad Request                 │
│                                         │
│  Missing fields                         │
│    ↓                                    │
│  Service validation fails               │
│    ↓                                    │
│  Throw error                            │
│    ↓                                    │
│  Error middleware catches               │
│    ↓                                    │
│  Return 500 Internal Error              │
└─────────────────────────────────────────┘
```

## Timing Diagram

```
T=0s    Agent starts → Collect → Send → Backend receives ✓
          |                                    │
T=10s     └─────────────────┐                 │
                            │                 │
                    Collect → Send → Backend receives ✓
                              │                │
T=20s                         └──────┐         │
                                     │         │
                             Collect → Send → Backend receives ✓
                                       │        │
T=30s                                  └────┐   │
                                            │   │
                                    Collect → Send ...

Timeline:
│
├─ 0s:  Initialize
├─ 0s:  First collection
├─ 10s: Second collection
├─ 20s: Third collection
├─ 30s: Fourth collection
└─ ...: Continues until stopped
```

---

**This completes the data flow documentation for Feature 1** 🎉
