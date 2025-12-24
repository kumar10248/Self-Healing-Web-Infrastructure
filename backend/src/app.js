const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const metricsRoutes = require("./routes/metrics.routes");
const healingRoutes = require("./routes/healing.routes");
const alertsRoutes = require("./routes/alerts.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const dashboardMetricsRoutes = require("./routes/dashboard-metrics.routes");
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

app.get("/health", (req, res) => {
  res.json({ status: "OK", time: new Date() });
});

app.use(errorHandler);

module.exports = app;
