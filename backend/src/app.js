const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const metricsRoutes = require("./routes/metrics.routes");
const healingRoutes = require("./routes/healing.routes");
const alertsRoutes = require("./routes/alerts.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const dashboardMetricsRoutes = require("./routes/dashboard-metrics.routes");
const policiesRoutes = require("./routes/policies.routes"); // Phase 2: Policy management
const historyRoutes = require("./routes/history.routes"); // Phase 4: Historical metrics
const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Existing routes
app.use("/api/metrics", metricsRoutes);
app.use("/api/heal", healingRoutes);
app.use("/api/alerts", alertsRoutes);

// Feature 6 (Part-A): Dashboard routes
app.use("/api/dashboard", dashboardRoutes);
// Mount dashboard metrics routes under /api/metrics (extends existing metrics endpoint)
app.use("/api/metrics", dashboardMetricsRoutes);

// Phase 2: Policy management routes
app.use("/api/policies", policiesRoutes);

// Phase 4: Historical metrics routes
app.use("/api/history", historyRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", time: new Date() });
});

app.use(errorHandler);

module.exports = app;
