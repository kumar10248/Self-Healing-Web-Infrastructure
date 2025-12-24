#!/usr/bin/env node

const { execSync } = require("child_process");
const http = require("http");
const os = require("os");

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const INTERVAL_SECONDS = parseInt(process.env.INTERVAL_SECONDS) || 10;
const HOSTNAME = os.hostname();

// Paths to collector scripts
const SCRIPT_DIR = __dirname + "/collectors";
const CPU_SCRIPT = `${SCRIPT_DIR}/cpu.sh`;
const MEMORY_SCRIPT = `${SCRIPT_DIR}/memory.sh`;
const DISK_SCRIPT = `${SCRIPT_DIR}/disk.sh`;
const SERVICES_SCRIPT = `${SCRIPT_DIR}/services.sh`;

/**
 * Execute a shell script and return the output
 */
function runScript(scriptPath) {
  try {
    const output = execSync(`bash ${scriptPath}`, { encoding: "utf-8" });
    return parseFloat(output.trim()) || 0;
  } catch (error) {
    console.error(`❌ Error running ${scriptPath}:`, error.message);
    return 0;
  }
}

/**
 * Execute service check script and return parsed service status
 */
function checkServices() {
  try {
    const output = execSync(`bash ${SERVICES_SCRIPT}`, { encoding: "utf-8" });
    const lines = output.trim().split("\n");
    const services = [];

    for (const line of lines) {
      if (line.includes(":")) {
        const [service, status] = line.split(":");
        services.push({
          name: service.trim(),
          status: status.trim(),
        });
      }
    }

    return services;
  } catch (error) {
    console.error(`❌ Error checking services:`, error.message);
    return [];
  }
}

/**
 * Collect all system metrics
 */
function collectMetrics() {
  const cpu = runScript(CPU_SCRIPT);
  const memory = runScript(MEMORY_SCRIPT);
  const disk = runScript(DISK_SCRIPT);
  const services = checkServices(); // Feature 2: Service status
  const timestamp = new Date().toISOString();

  return {
    host: HOSTNAME,
    cpu: cpu,
    memory: memory,
    disk: disk,
    services: services, // Feature 2: Include service status
    timestamp: timestamp,
  };
}

/**
 * Send metrics to backend API
 */
function sendMetrics(metrics) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}/api/metrics`);
    const data = JSON.stringify(metrics);

    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          console.log(`✅ Metrics sent successfully:`, metrics);
          resolve(responseData);
        } else {
          console.error(
            `❌ Failed to send metrics. Status: ${res.statusCode}`
          );
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on("error", (error) => {
      console.error(`❌ Error sending metrics:`, error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Main monitoring loop
 */
async function startMonitoring() {
  console.log(`🚀 Agent started`);
  console.log(`📡 Backend URL: ${BACKEND_URL}`);
  console.log(`⏱️  Interval: ${INTERVAL_SECONDS} seconds`);
  console.log(`🖥️  Hostname: ${HOSTNAME}`);
  console.log("=" .repeat(50));

  // Collect and send metrics immediately
  try {
    const metrics = collectMetrics();
    await sendMetrics(metrics);
  } catch (error) {
    console.error("Error in initial metric collection:", error.message);
  }

  // Then continue on interval
  setInterval(async () => {
    try {
      const metrics = collectMetrics();
      await sendMetrics(metrics);
    } catch (error) {
      console.error("Error in metric collection:", error.message);
    }
  }, INTERVAL_SECONDS * 1000);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Agent stopped");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Agent stopped");
  process.exit(0);
});

// Start the agent
startMonitoring();
